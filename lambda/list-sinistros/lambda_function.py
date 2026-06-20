"""
GET /sinistros — DocuSmart. Lista 1 linha por SINISTRO (não por documento).
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
    try:
        table = dynamo.Table(TABLE)
        filtro = Attr("tipo_item").eq("SINISTRO")

        result = table.scan(FilterExpression=filtro)
        items = result.get("Items", [])
        while "LastEvaluatedKey" in result:
            result = table.scan(FilterExpression=filtro, ExclusiveStartKey=result["LastEvaluatedKey"])
            items.extend(result.get("Items", []))

        items.sort(key=lambda x: x.get("created_at") or "", reverse=True)

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({"sinistros": items}, ensure_ascii=False, default=_default),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": CORS,
            "body": json.dumps({"erro": str(e)}),
        }
