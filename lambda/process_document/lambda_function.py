import json
import boto3
import uuid
import os
from datetime import datetime, timezone
from strands import Agent
from strands.models import BedrockModel
from strands.tools import tool

REGION = os.environ.get("AWS_REGION_NAME", "us-east-1")
TABLE  = os.environ["DYNAMO_TABLE_NAME"]


def _normalize_agent_body(resposta) -> str:
    """Garante JSON puro na resposta (Step Functions e API Gateway)."""
    text = str(resposta).strip()
    if "```json" in text:
        start = text.index("```json") + 7
        end = text.index("```", start)
        text = text[start:end].strip()
    elif text.startswith("```"):
        start = text.index("```") + 3
        end = text.index("```", start)
        text = text[start:end].strip()
    try:
        json.loads(text)
        return text
    except json.JSONDecodeError:
        return json.dumps({"raw_response": text})


# ── Tool 1: Textract — OCR especializado em documentos ───────────────────────
@tool
def extrair_texto_documento(bucket: str, key: str) -> str:
    """
    Extrai o texto completo de um documento PDF ou imagem de documento
    usando Amazon Textract (OCR especializado).
    Use para: B.O., Notas Fiscais, CNH, Laudos Médicos, Formulários.
    NÃO use para fotos de veículos ou cenas de acidente.
    """
    client = boto3.client("textract", region_name=REGION)
    resp = client.detect_document_text(
        Document={"S3Object": {"Bucket": bucket, "Name": key}}
    )
    linhas = [b["Text"] for b in resp["Blocks"] if b["BlockType"] == "LINE"]
    return " ".join(linhas)


# ── Tool 2: Comprehend — NER em Português ────────────────────────────────────
@tool
def extrair_entidades_texto(texto: str) -> dict:
    """
    Extrai entidades nomeadas do texto em Português usando Amazon Comprehend:
    datas, valores monetários, CPFs, nomes de pessoas, locais e organizações.
    Use APÓS extrair_texto_documento, passando o texto retornado.
    """
    client = boto3.client("comprehend", region_name=REGION)
    resp = client.detect_entities(Text=texto[:4900], LanguageCode="pt")
    entidades = {}
    for e in resp["Entities"]:
        tipo = e["Type"]
        valor = e["Text"]
        if tipo not in entidades:
            entidades[tipo] = []
        entidades[tipo].append(valor)
    return entidades


# ── Tool 3: Rekognition — análise visual de imagens ──────────────────────────
@tool
def analisar_imagem_veiculo(bucket: str, key: str) -> dict:
    """
    Analisa visualmente uma imagem de veículo sinistrado ou cena de acidente
    usando Amazon Rekognition. Detecta objetos, labels e indicadores de dano.
    Use para: fotos de carros, imagens de danos, cenas de acidente.
    NÃO use para documentos PDF com texto.
    """
    client = boto3.client("rekognition", region_name=REGION)
    resp = client.detect_labels(
        Image={"S3Object": {"Bucket": bucket, "Name": key}},
        MaxLabels=20,
        MinConfidence=70.0,
    )
    labels = [
        {"label": l["Name"], "confianca": round(l["Confidence"] / 100, 3)}
        for l in resp["Labels"]
    ]
    return {"labels_detectados": labels, "total_labels": len(labels)}


# ── Tool 6: Auditoria por etapa — exigida pelo Case B ────────────────────────
@tool
def registrar_auditoria(sinistro_id: str, etapa: str, status: str, detalhes: str = "") -> str:
    """
    Registra cada etapa do processamento no DynamoDB para trilha de auditoria completa.
    Chame em cada fase: 'inicio', 'extracao', 'classificacao', 'concluido'.
    """
    dynamo = boto3.resource("dynamodb", region_name=REGION)
    table  = dynamo.Table(TABLE)
    ts = datetime.now(timezone.utc).isoformat()
    table.put_item(Item={
        "id": f"AUDIT#{sinistro_id}#{ts}",
        "sinistro_id": sinistro_id,
        "etapa": etapa,
        "status": status,
        "detalhes": detalhes,
        "ts": ts,
    })
    return f"Etapa '{etapa}' registrada em {ts}"


# ── Tool 5: DynamoDB — persistência do resultado final ───────────────────────
@tool
def salvar_resultado_dynamodb(resultado: dict) -> str:
    """
    Salva o resultado estruturado final da análise no Amazon DynamoDB.
    Chame APENAS após ter o JSON final completo com todos os campos.
    Retorna o ID UUID gerado para o registro.
    """
    dynamo = boto3.resource("dynamodb", region_name=REGION)
    table  = dynamo.Table(TABLE)
    item_id = str(uuid.uuid4())
    resultado["id"] = item_id
    resultado["processado_em"] = datetime.now(timezone.utc).isoformat()
    # LGPD: não persistir texto bruto do Textract
    resultado.pop("_texto_bruto", None)
    table.put_item(Item=resultado)
    return item_id


# ── Handler principal ─────────────────────────────────────────────────────────
def lambda_handler(event, context):
    body = json.loads(event.get("body", "{}")) if "body" in event else event
    bucket = body.get("bucket")
    key    = body.get("key")

    if not bucket or not key:
        return {
            "statusCode": 400,
            "body": json.dumps({
                "error_code": "MISSING_PARAMS",
                "message": "Informe 'bucket' e 'key' no body.",
            }),
        }

    extensao    = key.lower().rsplit(".", 1)[-1] if "." in key else ""
    eh_imagem   = extensao in {"jpg", "jpeg", "png", "bmp", "tiff"}
    tipo_arquivo = "imagem" if eh_imagem else "documento"
    sinistro_id  = str(uuid.uuid4())

    agente = Agent(
        model=BedrockModel(model_id="us.anthropic.claude-haiku-4-5-20251001-v1:0"),
        tools=[
            extrair_texto_documento,
            extrair_entidades_texto,
            analisar_imagem_veiculo,
            registrar_auditoria,
            salvar_resultado_dynamodb,
        ],
        system_prompt=(
            "Você é um especialista em análise de sinistros de seguro. "
            f"O sinistro_id desta análise é '{sinistro_id}'. "
            "Siga EXATAMENTE esta sequência de 9 passos:\n"
            f"1. Use registrar_auditoria(sinistro_id='{sinistro_id}', etapa='inicio', status='ok').\n"
            f"2. O arquivo é do tipo '{tipo_arquivo}'. "
            "Se for 'documento': use extrair_texto_documento, depois extrair_entidades_texto. "
            "Se for 'imagem': use analisar_imagem_veiculo.\n"
            f"3. Use registrar_auditoria(sinistro_id='{sinistro_id}', etapa='extracao', status='ok').\n"
            "4. Com os dados, identifique:\n"
            "   - tipo_documento: 'Boletim de Ocorrência', 'Laudo Médico', 'Nota Fiscal', "
            "'Documento de Identidade', 'Imagem de Sinistro' ou 'Outro'.\n"
            "   - campos_extraidos: dict com data, local, valor_prejuizo, envolvidos.\n"
            "   - resumo: exatamente 2 frases.\n"
            "   - confianca: número entre 0 e 1.\n"
            f"5. Use registrar_auditoria(sinistro_id='{sinistro_id}', etapa='classificacao', status='ok').\n"
            "6. Monte um dicionário com os campos acima mais "
            f"'s3_origem': {{'bucket': '{bucket}', 'key': '{key}'}} e "
            f"'sinistro_id': '{sinistro_id}'.\n"
            "7. Use salvar_resultado_dynamodb passando esse dicionário.\n"
            f"8. Use registrar_auditoria(sinistro_id='{sinistro_id}', etapa='concluido', status='ok').\n"
            "9. Responda APENAS com o JSON retornado pelo salvamento, sem texto adicional."
        ),
    )

    try:
        instrucao = (
            f"Analise o arquivo {tipo_arquivo} no bucket '{bucket}', chave '{key}'. "
            "Classifique, extraia os campos, gere o resumo, registre a auditoria e salve o resultado."
        )
        resposta = agente(instrucao)
        body = _normalize_agent_body(resposta)
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": body,
        }
    except Exception as exc:
        return {
            "statusCode": 502,
            "body": json.dumps({
                "error_code": "AGENT_FAILED",
                "message": str(exc),
            }),
        }

