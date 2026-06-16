# get_document.py
# RESPONSÁVEL: Papel 3 — Jhonny
# TODO: Implementar GET /sinistro/{id} — consulta DynamoDB por ID

import boto3, json, os

def lambda_handler(event, context):
    # TODO: extrair sinistro_id do path parameter
    # TODO: consultar DynamoDB e retornar o item
    return {"statusCode": 501, "body": json.dumps({"message": "Not implemented yet"})}
