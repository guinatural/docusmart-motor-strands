"""
GET /sinistro/{id} — DocuSmart.

Retorna o sinistro agregado:
  { "sinistro": {...}, "documentos": [...], "historico_operacoes": [...] }
"""
import json
import os
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Attr

dynamo = boto3.resource("dynamodb", region_name="us-east-1")
TABLE = os.environ.get("DYNAMO_TABLE_NAME", "docusmart-idp-grupo-5-documents")

CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type"}


def _default(o):
    if isinstance(o, Decimal):
        return int(o) if o % 1 == 0 else float(o)
    return str(o)


def lambda_handler(event, context):
    sinistro_id = (event.get("pathParameters") or {}).get("id")
    if not sinistro_id:
        return _resp(400, {"erro": "id ausente"})

    table = dynamo.Table(TABLE)
    sinistro = table.get_item(Key={"id": sinistro_id}).get("Item")
    if not sinistro:
        return _resp(404, {"erro": f"Sinistro '{sinistro_id}' não encontrado"})

    relacionados = table.scan(
        FilterExpression=Attr("sinistro_id").eq(sinistro_id),
    ).get("Items", [])

    documentos = sorted(
        [i for i in relacionados if i.get("tipo_item") == "DOCUMENTO"],
        key=lambda x: x.get("documento_id", ""),
    )
    auditoria = sorted(
        [i for i in relacionados if i.get("tipo_item") == "AUDIT"],
        key=lambda x: x.get("ts", ""),
    )

    return _resp(200, {
        "sinistro": sinistro,
        "documentos": documentos,
        "historico_operacoes": auditoria,
    })


def _resp(status, body):
    return {
        "statusCode": status,
        "headers": CORS,
        "body": json.dumps(body, ensure_ascii=False, default=_default),
    }
