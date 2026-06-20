"""
DELETE /sinistro/{id} — DocuSmart. LGPD (Art. 18 — direito ao esquecimento).
Remove o sinistro, seus documentos, a auditoria e os arquivos no S3.
"""
import json
import os

import boto3
from boto3.dynamodb.conditions import Attr

dynamo = boto3.resource("dynamodb", region_name="us-east-1")
s3 = boto3.client("s3", region_name="us-east-1")

TABLE = os.environ.get("DYNAMO_TABLE_NAME", "docusmart-idp-grupo-5-documents")
BUCKET = os.environ.get("BUCKET_NAME", "docusmart-idp-grupo-5-docs")

CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type"}


def lambda_handler(event, context):
    sinistro_id = (event.get("pathParameters") or {}).get("id")
    if not sinistro_id:
        return _resp(400, {"erro": "id ausente"})

    table = dynamo.Table(TABLE)
    sinistro = table.get_item(Key={"id": sinistro_id}).get("Item")
    if not sinistro:
        return _resp(404, {"erro": f"Sinistro '{sinistro_id}' não encontrado"})

    # Itens relacionados (documentos + auditoria)
    relacionados = table.scan(
        FilterExpression=Attr("sinistro_id").eq(sinistro_id),
        ProjectionExpression="id, s3_origem, tipo_item",
    ).get("Items", [])

    # Apaga arquivos do S3 (de cada documento)
    for it in relacionados:
        origem = it.get("s3_origem") or {}
        chave = origem.get("key") if isinstance(origem, dict) else None
        if chave:
            try:
                s3.delete_object(Bucket=BUCKET, Key=chave)
            except Exception:
                pass  # não bloqueia o delete se o arquivo já sumiu

    # Apaga todos os itens (relacionados + o próprio sinistro).
    # delete_item individual (o role não tem BatchWriteItem).
    ids = {it["id"] for it in relacionados} | {sinistro_id}
    for item_id in ids:
        table.delete_item(Key={"id": item_id})

    return _resp(200, {"sinistro_id": sinistro_id, "deleted": True, "itens_removidos": len(ids)})


def _resp(code, body):
    return {"statusCode": code, "headers": CORS, "body": json.dumps(body, ensure_ascii=False)}
