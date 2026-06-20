"""
Intake do sinistro — DocuSmart.

Cria UM sinistro (1 protocolo) com N documentos e dispara o pipeline (Step
Functions) UMA vez, passando o sinistro_id e a lista de documentos. O pipeline
processa cada documento e depois agrega/decide.

Modelo single-table (PK `id`, discriminador `tipo_item`):
  - SINISTRO:  id = <sinistro_id>
  - DOCUMENTO: id = <sinistro_id>#DOC#DOC-NN
  - AUDIT:     id = AUDIT#<sinistro_id>#<ts>
  - APOLICE:   id = APOLICE#<numero_apolice>   (semeada à parte)
"""
import json
import os
import uuid
from datetime import datetime, timezone

import boto3

dynamo = boto3.resource("dynamodb", region_name="us-east-1")
sfn = boto3.client("stepfunctions", region_name="us-east-1")

TABLE = os.environ.get("DYNAMO_TABLE_NAME", "docusmart-idp-grupo-5-documents")
SFN_ARN = os.environ.get(
    "SFN_ARN",
    "arn:aws:states:us-east-1:152160819260:stateMachine:docusmart-idp-grupo-5-pipeline",
)
BUCKET = os.environ.get("BUCKET_NAME", "docusmart-idp-grupo-5-docs")

CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type"}


def _audit(table, sinistro_id, etapa, status, detalhes=""):
    ts = datetime.now(timezone.utc).isoformat()
    table.put_item(Item={
        "id": f"AUDIT#{sinistro_id}#{ts}",
        "tipo_item": "AUDIT",
        "sinistro_id": sinistro_id,
        "etapa": etapa,
        "status": status,
        "detalhes": detalhes,
        "ts": ts,
    })


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
        keys = body.get("keys", [])
        dados = body.get("dados_formulario", {})

        if not keys:
            return _resp(400, {"erro": "Campo 'keys' obrigatório"})

        table = dynamo.Table(TABLE)

        # Gate 0 — a apólice existe? (não bloqueia o intake; a decisão final trata,
        # mas registramos para a Etapa 2 validar consistência.)
        numero_apolice = (dados.get("numero_apolice") or "").strip()
        apolice = None
        if numero_apolice:
            apolice = table.get_item(Key={"id": f"APOLICE#{numero_apolice}"}).get("Item")

        sinistro_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        # Cria os itens DOCUMENTO (um por arquivo) com status inicial
        documentos_meta = []
        for i, key in enumerate(keys, start=1):
            documento_id = f"DOC-{i:02d}"
            documentos_meta.append({"documento_id": documento_id, "key": key})
            table.put_item(Item={
                "id": f"{sinistro_id}#DOC#{documento_id}",
                "tipo_item": "DOCUMENTO",
                "sinistro_id": sinistro_id,
                "documento_id": documento_id,
                "s3_origem": {"bucket": BUCKET, "key": key},
                "status_doc": "processando",
                "tipo_documento": "",
                "campos_extraidos": {},
                "resumo": "",
                "created_at": now,
            })

        # Cria o item SINISTRO (1 protocolo para o pacote)
        table.put_item(Item={
            "id": sinistro_id,
            "tipo_item": "SINISTRO",
            "sinistro_id": sinistro_id,
            "numero_apolice": numero_apolice,
            "apolice_encontrada": bool(apolice),
            "status": "EM_PROCESSAMENTO",
            "dados_formulario": dados,
            "total_documentos": len(keys),
            "dados_consolidados": None,
            "created_at": now,
            "updated_at": now,
        })

        _audit(table, sinistro_id, "intake", "ok",
               f"Sinistro aberto com {len(keys)} documento(s).")

        # Dispara o pipeline UMA vez para o sinistro inteiro
        sfn.start_execution(
            stateMachineArn=SFN_ARN,
            name=sinistro_id,
            input=json.dumps({
                "sinistro_id": sinistro_id,
                "bucket": BUCKET,
                "documentos": documentos_meta,
            }),
        )

        return _resp(200, {"sinistro_id": sinistro_id, "status": "EM_PROCESSAMENTO"})

    except Exception as e:
        return _resp(500, {"erro": str(e)})


def _resp(status, body):
    return {
        "statusCode": status,
        "headers": CORS,
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }
