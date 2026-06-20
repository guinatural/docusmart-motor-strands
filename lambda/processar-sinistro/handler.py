"""
Processar documento — DocuSmart (chamado pelo Step Functions, 1x por documento).

Entrada (Payload do SFN): { sinistro_id, bucket, documento_id, key }

O agente Bedrock SÓ extrai/classifica e devolve JSON. A persistência é feita
por código (determinística) — sem depender do LLM chamar tools de gravação.
Grava o item DOCUMENTO (id = <sinistro_id>#DOC#<documento_id>) e a auditoria
sob o sinistro_id correto. Normaliza a confiança para float 0–1.
"""
import json
import os
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from strands import Agent
from strands.models import BedrockModel
from strands.tools import tool

REGION = os.environ.get("AWS_REGION_NAME", "us-east-1")
TABLE = os.environ["DYNAMO_TABLE_NAME"]
LIMIAR_CONFIANCA = float(os.environ.get("LIMIAR_CONFIANCA", "0.80"))
MODEL_ID = os.environ.get("MODEL_ID", "us.anthropic.claude-haiku-4-5-20251001-v1:0")

dynamo = boto3.resource("dynamodb", region_name=REGION)


# ── Tools de extração (somente leitura; o agente não grava no banco) ──────────
@tool
def extrair_texto_documento(bucket: str, key: str) -> str:
    """Extrai texto de PDF/imagem de documento via Amazon Textract (OCR).
    Use para B.O., Notas Fiscais/Orçamentos, CNH, CRLV, Laudos, Formulários.
    NÃO use para fotos de veículos/cenas de acidente."""
    client = boto3.client("textract", region_name=REGION)
    resp = client.detect_document_text(Document={"S3Object": {"Bucket": bucket, "Name": key}})
    return " ".join(b["Text"] for b in resp["Blocks"] if b["BlockType"] == "LINE")


@tool
def extrair_entidades_texto(texto: str) -> dict:
    """Extrai entidades (datas, valores, CPFs, nomes, locais) em pt-BR via Amazon
    Comprehend. Use APÓS extrair_texto_documento."""
    client = boto3.client("comprehend", region_name=REGION)
    resp = client.detect_entities(Text=texto[:4900], LanguageCode="pt")
    entidades: dict = {}
    for e in resp["Entities"]:
        entidades.setdefault(e["Type"], []).append(e["Text"])
    return entidades


@tool
def analisar_imagem_veiculo(bucket: str, key: str) -> dict:
    """Analisa imagem de veículo/cena de acidente via Amazon Rekognition.
    Use para fotos de carros/danos. NÃO use para documentos com texto."""
    client = boto3.client("rekognition", region_name=REGION)
    resp = client.detect_labels(
        Image={"S3Object": {"Bucket": bucket, "Name": key}},
        MaxLabels=20, MinConfidence=70.0,
    )
    labels = [{"label": l["Name"], "confianca": round(l["Confidence"] / 100, 3)} for l in resp["Labels"]]
    return {"labels_detectados": labels, "total_labels": len(labels)}


# ── Helpers ──────────────────────────────────────────────────────────────────
def _audit(sinistro_id, etapa, status, detalhes="", documento_id=None):
    ts = datetime.now(timezone.utc).isoformat()
    dynamo.Table(TABLE).put_item(Item={
        "id": f"AUDIT#{sinistro_id}#{ts}",
        "tipo_item": "AUDIT",
        "sinistro_id": sinistro_id,
        "documento_id": documento_id,
        "etapa": etapa,
        "status": status,
        "detalhes": detalhes,
        "ts": ts,
    })


def _normalizar_confianca(v):
    if v is None:
        return None
    try:
        s = str(v).strip().replace("%", "").replace(",", ".")
        if not s:
            return None
        n = float(s)
        return round(n / 100 if n > 1 else n, 3)
    except (ValueError, TypeError):
        return None


def _parse_json(texto: str) -> dict:
    t = str(texto).strip()
    if "```json" in t:
        t = t.split("```json", 1)[1].split("```", 1)[0].strip()
    elif t.startswith("```"):
        t = t.strip("`").strip()
    try:
        return json.loads(t)
    except json.JSONDecodeError:
        ini, fim = t.find("{"), t.rfind("}")
        if ini >= 0 and fim > ini:
            return json.loads(t[ini:fim + 1])
        raise


def _to_dynamo(obj):
    """Converte floats em Decimal (exigência do DynamoDB)."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, list):
        return [_to_dynamo(x) for x in obj]
    if isinstance(obj, dict):
        return {k: _to_dynamo(v) for k, v in obj.items()}
    return obj


def lambda_handler(event, context):
    sinistro_id = event["sinistro_id"]
    documento_id = event["documento_id"]
    bucket = event["bucket"]
    key = event["key"]
    item_id = f"{sinistro_id}#DOC#{documento_id}"
    table = dynamo.Table(TABLE)

    _audit(sinistro_id, "inicio", "ok", f"{documento_id}: início do processamento", documento_id)

    agente = Agent(
        model=BedrockModel(model_id=MODEL_ID),
        tools=[extrair_texto_documento, extrair_entidades_texto, analisar_imagem_veiculo],
        system_prompt=(
            "Você é um especialista em análise de sinistros de seguro auto.\n"
            "1. SEMPRE comece chamando extrair_texto_documento. "
            "Se vier texto relevante (CNH, CRLV, nota/orçamento, B.O.), é um DOCUMENTO: "
            "chame também extrair_entidades_texto. "
            "Se vier pouco/nenhum texto, é uma IMAGEM de veículo/cena: chame analisar_imagem_veiculo.\n"
            "2. Classifique e extraia. Responda APENAS com um JSON (sem texto fora dele):\n"
            "{\n"
            '  "tipo_documento": "CNH" | "CRLV" | "Nota Fiscal" | "Boletim de Ocorrência" '
            '| "Laudo Médico" | "Imagem de Sinistro" | "Outro",\n'
            '  "confianca": número entre 0 e 1 (ex.: 0.93),\n'
            '  "campos_extraidos": { "nome": ..., "cpf": ..., "placa_veiculo": ..., '
            '"renavam": ..., "marca_modelo": ..., "ano": ..., "valor_total": ..., '
            '"data": ..., "local": ..., "envolvidos": [...] },\n'
            '  "resumo": "2 frases"\n'
            "}\n"
            "Use null nos campos que não se aplicam. 'confianca' é SEMPRE número decimal entre 0 e 1."
        ),
    )

    try:
        resposta = agente(
            f"Analise o arquivo no bucket '{bucket}', chave '{key}'. "
            "Comece por extrair_texto_documento. Classifique e extraia os campos "
            "conforme o formato pedido."
        )
        data = _parse_json(str(resposta))
    except Exception as exc:
        _audit(sinistro_id, "extracao", "erro", f"{documento_id}: {exc}", documento_id)
        table.update_item(
            Key={"id": item_id},
            UpdateExpression="SET status_doc = :s, erro = :e, processado_em = :ts",
            ExpressionAttributeValues={
                ":s": "erro", ":e": str(exc),
                ":ts": datetime.now(timezone.utc).isoformat(),
            },
        )
        return {"documento_id": documento_id, "status_doc": "erro", "erro": str(exc)}

    conf = _normalizar_confianca(data.get("confianca"))
    tipo_doc = data.get("tipo_documento") or "Outro"
    campos = data.get("campos_extraidos") or {}
    resumo = data.get("resumo") or ""
    labels = data.get("labels_detectados") or []
    status_doc = "revisao_pendente" if (conf is not None and conf < LIMIAR_CONFIANCA) else "processado"

    _audit(sinistro_id, "extracao", "ok", f"{documento_id}: dados extraídos", documento_id)
    _audit(sinistro_id, "classificacao", "ok",
           f"{documento_id}: {tipo_doc} (confiança {conf})", documento_id)

    table.update_item(
        Key={"id": item_id},
        UpdateExpression=(
            "SET tipo_documento = :t, confianca = :c, campos_extraidos = :ce, "
            "resumo = :r, status_doc = :s, labels_detectados = :l, processado_em = :ts"
        ),
        ExpressionAttributeValues={
            ":t": tipo_doc,
            ":c": Decimal(str(conf)) if conf is not None else None,
            ":ce": _to_dynamo(campos),
            ":r": resumo,
            ":s": status_doc,
            ":l": _to_dynamo(labels),
            ":ts": datetime.now(timezone.utc).isoformat(),
        },
    )

    return {
        "documento_id": documento_id,
        "tipo_documento": tipo_doc,
        "confianca": conf,
        "status_doc": status_doc,
    }
