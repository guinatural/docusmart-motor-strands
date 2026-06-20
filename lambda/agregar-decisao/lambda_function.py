"""
Agregar e decidir — DocuSmart (Etapa 2; chamado pelo SFN após processar os docs).

Entrada: { sinistro_id }

Lê o sinistro, seus documentos e a apólice; aplica os gates de negócio e grava
`dados_consolidados` + o `status` de negócio no item SINISTRO.

Regras (parâmetros via env var):
  - Documentos obrigatórios: identidade (CNH), CRLV, orçamento;
    + Boletim de Ocorrência se roubo/furto ou terceiros envolvidos.
  - Consistência CPF (apólice × CNH) e placa (apólice × CRLV).
  - Data do sinistro dentro da vigência da apólice.
  - Valor de referência (MENOR orçamento) ≤ teto de auto-aprovação.
  - Confiança de todos os documentos ≥ limiar.

Decisão:
  docs incompletos            -> PENDENTE_DOCUMENTACAO (automática)
  inconsistência grave        -> EM_ANALISE (análise especial — humano)
  baixa confiança             -> EM_ANALISE (revisão humana)
  valor acima do teto         -> EM_ANALISE (fila do analista)
  tudo ok                     -> APROVADO (automática)
"""
import os
import re
from datetime import date, datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Attr

REGION = os.environ.get("AWS_REGION_NAME", "us-east-1")
TABLE = os.environ["DYNAMO_TABLE_NAME"]
LIMIAR_CONFIANCA = float(os.environ.get("LIMIAR_CONFIANCA", "0.80"))
TETO_AUTO_APROVACAO = float(os.environ.get("TETO_AUTO_APROVACAO", "5000"))
SNS_TOPIC_ARN = os.environ.get(
    "SNS_TOPIC_ARN",
    "arn:aws:sns:us-east-1:152160819260:docusmart-idp-grupo-5-notificacoes",
)

dynamo = boto3.resource("dynamodb", region_name=REGION)
sns = boto3.client("sns", region_name=REGION)


def _notificar(sinistro_id, status, segurado, contato, motivo):
    """Publica um evento de decisão no SNS (notifica cliente/analista).
    Tolerante a falha — nunca quebra o pipeline."""
    try:
        r = sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"DocuSmart — sinistro {status}"[:99],
            Message=(
                f"Sinistro: {sinistro_id}\n"
                f"Segurado: {segurado or '-'}\n"
                f"Status: {status}\n"
                f"Contato: {contato or '-'}\n"
                f"Motivo: {motivo}"
            ),
            MessageAttributes={
                "status": {"DataType": "String", "StringValue": status},
            },
        )
        print(f"[SNS] notificacao publicada: {r.get('MessageId')}")
    except Exception as e:
        print(f"[SNS] falha ao notificar: {e}")


def _audit(table, sinistro_id, etapa, status, detalhes=""):
    ts = datetime.now(timezone.utc).isoformat()
    table.put_item(Item={
        "id": f"AUDIT#{sinistro_id}#{ts}", "tipo_item": "AUDIT",
        "sinistro_id": sinistro_id, "etapa": etapa, "status": status,
        "detalhes": detalhes, "ts": ts,
    })


def _f(v):
    """Converte float -> Decimal recursivamente (DynamoDB)."""
    if isinstance(v, float):
        return Decimal(str(v))
    if isinstance(v, list):
        return [_f(x) for x in v]
    if isinstance(v, dict):
        return {k: _f(x) for k, x in v.items()}
    return v


def _num(v):
    """Extrai número de '4.200,00' / 'R$ 4.200,00' / 4200 / Decimal."""
    if v is None:
        return None
    if isinstance(v, (int, float, Decimal)):
        return float(v)
    s = re.sub(r"[^\d,.-]", "", str(v))
    if not s:
        return None
    # formato BR: 4.200,00 -> 4200.00
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".")
    elif "," in s:
        s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _conf(v):
    if v is None:
        return None
    try:
        n = float(v)
        return n / 100 if n > 1 else n
    except (ValueError, TypeError):
        return None


def _so_digitos(v):
    return re.sub(r"\D", "", str(v or ""))


def _so_alfanum(v):
    return re.sub(r"[^A-Za-z0-9]", "", str(v or "")).upper()


def _categoria(tipo_documento: str) -> str:
    t = (tipo_documento or "").lower()
    if "crlv" in t:
        return "crlv"
    if "identidade" in t or "cnh" in t or "habilita" in t:
        return "identidade"
    if "nota" in t or "fiscal" in t or "orç" in t or "orc" in t:
        return "orcamento"
    if "ocorr" in t or t == "bo" or "boletim" in t:
        return "bo"
    if "imagem" in t or "foto" in t:
        return "foto"
    return "outro"


def lambda_handler(event, context):
    sinistro_id = event["sinistro_id"]
    table = dynamo.Table(TABLE)

    sinistro = table.get_item(Key={"id": sinistro_id}).get("Item") or {}
    form = sinistro.get("dados_formulario") or {}
    numero_apolice = (sinistro.get("numero_apolice") or form.get("numero_apolice") or "").strip()

    apolice = None
    if numero_apolice:
        apolice = table.get_item(Key={"id": f"APOLICE#{numero_apolice}"}).get("Item")

    # Documentos do sinistro
    docs = table.scan(
        FilterExpression=Attr("sinistro_id").eq(sinistro_id) & Attr("tipo_item").eq("DOCUMENTO"),
    ).get("Items", [])

    por_cat = {}
    for d in docs:
        por_cat.setdefault(_categoria(d.get("tipo_documento", "")), []).append(d)

    tipo_sinistro = (form.get("tipo_sinistro") or "").lower()
    terceiros = bool(form.get("terceiros_envolvidos"))
    exige_bo = tipo_sinistro in ("roubo", "furto") or terceiros

    # ── Gate: documentos obrigatórios ────────────────────────────────────────
    faltantes = []
    if not por_cat.get("identidade"):
        faltantes.append("documento_identidade")
    if not por_cat.get("crlv"):
        faltantes.append("crlv")
    if not por_cat.get("orcamento"):
        faltantes.append("orcamento")
    if exige_bo and not por_cat.get("bo"):
        faltantes.append("boletim_ocorrencia")
    documentos_completos = len(faltantes) == 0

    # ── Gate: consistência CPF/placa ─────────────────────────────────────────
    consistencia_cpf = True
    consistencia_placa = True
    if apolice:
        cnh = (por_cat.get("identidade") or [{}])[0].get("campos_extraidos") or {}
        crlv = (por_cat.get("crlv") or [{}])[0].get("campos_extraidos") or {}
        cpf_doc = _so_digitos(cnh.get("cpf"))
        if cpf_doc:
            consistencia_cpf = _so_digitos(apolice.get("cpf_titular")) == cpf_doc
        placa_doc = _so_alfanum(crlv.get("placa_veiculo") or crlv.get("placa"))
        placa_ap = _so_alfanum((apolice.get("veiculo") or {}).get("placa"))
        if placa_doc and placa_ap:
            consistencia_placa = placa_ap == placa_doc

    # ── Gate: data dentro da vigência ────────────────────────────────────────
    data_dentro_vigencia = True
    data_sinistro = form.get("data_sinistro")
    if apolice and data_sinistro:
        vig = apolice.get("vigencia") or {}
        try:
            d = date.fromisoformat(str(data_sinistro)[:10])
            ini = date.fromisoformat(str(vig.get("inicio"))[:10])
            fim = date.fromisoformat(str(vig.get("fim"))[:10])
            data_dentro_vigencia = ini <= d <= fim
        except (ValueError, TypeError):
            data_dentro_vigencia = True  # não dá pra avaliar -> não bloqueia

    # ── Gate: valor de referência (menor orçamento) ──────────────────────────
    orcamentos = []
    for d in por_cat.get("orcamento", []):
        ce = d.get("campos_extraidos") or {}
        valor = _num(ce.get("valor_total") or ce.get("valor_prejuizo") or ce.get("valor"))
        orcamentos.append({"oficina": ce.get("oficina") or "Oficina", "valor_total": valor or 0})
    valores = [o["valor_total"] for o in orcamentos if o["valor_total"]]
    valor_referencia = min(valores) if valores else 0
    dentro_do_teto = valor_referencia <= TETO_AUTO_APROVACAO if valores else True

    # ── Gate: confiança ──────────────────────────────────────────────────────
    baixa_confianca = any(
        (c := _conf(d.get("confianca"))) is not None and c < LIMIAR_CONFIANCA
        for d in docs
    )

    # ── Decisão ──────────────────────────────────────────────────────────────
    if not documentos_completos:
        status, automatica = "PENDENTE_DOCUMENTACAO", True
        motivo = "Documentos obrigatórios ausentes: " + ", ".join(faltantes) + "."
    elif not apolice:
        status, automatica = "EM_ANALISE", False
        motivo = f"Apólice '{numero_apolice}' não encontrada — análise especial."
    elif not (consistencia_cpf and consistencia_placa and data_dentro_vigencia):
        status, automatica = "EM_ANALISE", False
        det = []
        if not consistencia_cpf:
            det.append("CPF divergente da apólice")
        if not consistencia_placa:
            det.append("placa divergente da apólice")
        if not data_dentro_vigencia:
            det.append("data do sinistro fora da vigência")
        motivo = "Inconsistência grave (" + "; ".join(det) + ") — análise especial."
    elif baixa_confianca:
        status, automatica = "EM_ANALISE", False
        motivo = "Documento com confiança abaixo do limiar — revisão humana antes de fechar."
    elif not dentro_do_teto:
        status, automatica = "EM_ANALISE", False
        motivo = (f"Valor de referência (R$ {valor_referencia:,.2f}) acima do teto "
                  f"de auto-aprovação — fila do analista.")
    else:
        status, automatica = "APROVADO", True
        motivo = "Documentação completa, dados consistentes e valor abaixo do teto."

    seg = {}
    vei = {}
    if apolice:
        seg = {"nome": apolice.get("nome_titular"), "cpf": apolice.get("cpf_titular")}
        vei = apolice.get("veiculo") or {}

    now = datetime.now(timezone.utc).isoformat()
    dados_consolidados = {
        "numero_sinistro": sinistro_id,
        "numero_apolice": numero_apolice,
        "status": status,
        "segurado": seg,
        "veiculo": {"placa": vei.get("placa"), "marca_modelo": vei.get("marca_modelo"), "ano": vei.get("ano")},
        "evento": {
            "tipo_sinistro": form.get("tipo_sinistro"),
            "data_sinistro": data_sinistro,
            "local": form.get("local"),
            "terceiros_envolvidos": terceiros,
        },
        "documentos": [
            {"documento_id": d.get("documento_id"), "tipo": d.get("tipo_documento"),
             "score": _conf(d.get("confianca"))}
            for d in sorted(docs, key=lambda x: x.get("documento_id", ""))
        ],
        "orcamentos": orcamentos,
        "valor_referencia": valor_referencia,
        "validacoes": {
            "documentos_completos": documentos_completos,
            "documentos_faltantes": faltantes,
            "consistencia_cpf": consistencia_cpf,
            "consistencia_placa": consistencia_placa,
            "data_dentro_vigencia": data_dentro_vigencia,
            "dentro_do_teto": dentro_do_teto,
        },
        "decisao": {"status": status, "motivo": motivo, "automatica": automatica},
        "timestamps": {"recebido_em": sinistro.get("created_at"), "processado_em": now},
    }

    table.update_item(
        Key={"id": sinistro_id},
        UpdateExpression=(
            "SET #st = :st, dados_consolidados = :dc, valor_total_orcamentos = :v, "
            "documentos_faltantes = :f, revisao_pendente = :rp, updated_at = :ts"
        ),
        ExpressionAttributeNames={"#st": "status"},
        ExpressionAttributeValues={
            ":st": status,
            ":dc": _f(dados_consolidados),
            ":v": _f(valor_referencia) if valores else None,
            ":f": faltantes,
            ":rp": (status == "EM_ANALISE"),
            ":ts": now,
        },
    )

    _audit(table, sinistro_id, "decisao", "ok", f"{status}: {motivo}")
    _notificar(sinistro_id, status, seg.get("nome"), form.get("contato"), motivo)

    return {"sinistro_id": sinistro_id, "status": status, "automatica": automatica}
