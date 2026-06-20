"""
PUT /sinistro/{id} — DocuSmart. Decisão manual do analista (verificação manual).
Body: { "status": "APROVADO|NEGADO|EM_ANALISE|PENDENTE_DOCUMENTACAO|ENCERRADO",
        "observacao": "..." }
"""
import json
import os
from datetime import datetime, timezone

import boto3

dynamo = boto3.resource("dynamodb", region_name="us-east-1")
TABLE = os.environ.get("DYNAMO_TABLE_NAME", "docusmart-idp-grupo-5-documents")

CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type"}
STATUS_VALIDOS = {"APROVADO", "NEGADO", "EM_ANALISE", "PENDENTE_DOCUMENTACAO", "ENCERRADO"}


def lambda_handler(event, context):
    sinistro_id = (event.get("pathParameters") or {}).get("id")
    if not sinistro_id:
        return _resp(400, {"erro": "id ausente"})

    try:
        body = json.loads(event.get("body") or "{}")
    except (ValueError, TypeError):
        return _resp(400, {"erro": "Body inválido"})

    novo_status = body.get("status")
    observacao = body.get("observacao", "")
    if not novo_status:
        return _resp(400, {"erro": "Campo 'status' obrigatório"})
    if novo_status not in STATUS_VALIDOS:
        return _resp(400, {"erro": f"Status inválido. Use: {sorted(STATUS_VALIDOS)}"})

    table = dynamo.Table(TABLE)
    item = table.get_item(Key={"id": sinistro_id}).get("Item")
    if not item:
        return _resp(404, {"erro": f"Sinistro '{sinistro_id}' não encontrado"})

    now = datetime.now(timezone.utc).isoformat()
    update_expr = "SET #st = :status, revisado_em = :ts, revisao_pendente = :false, updated_at = :ts"
    expr_values = {":status": novo_status, ":ts": now, ":false": False}
    if observacao:
        update_expr += ", observacao_analista = :obs"
        expr_values[":obs"] = observacao

    table.update_item(
        Key={"id": sinistro_id},
        UpdateExpression=update_expr,
        ExpressionAttributeNames={"#st": "status"},
        ExpressionAttributeValues=expr_values,
    )

    table.put_item(Item={
        "id": f"AUDIT#{sinistro_id}#{now}",
        "tipo_item": "AUDIT",
        "sinistro_id": sinistro_id,
        "etapa": "revisao_manual",
        "status": "ok",
        "detalhes": f"Status alterado para {novo_status}" + (f": {observacao}" if observacao else ""),
        "ts": now,
    })

    return _resp(200, {"sinistro_id": sinistro_id, "status": novo_status})


def _resp(code, body):
    return {"statusCode": code, "headers": CORS, "body": json.dumps(body, ensure_ascii=False)}
