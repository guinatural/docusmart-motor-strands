# delete_document.py
# RESPONSÁVEL: Papel 3 — Jhonny
# TODO: Implementar DELETE /sinistro/{id}
# LGPD: remover do S3 + DynamoDB (direito ao esquecimento, Art. 18 LGPD)

import boto3, json, os

def lambda_handler(event, context):
    # TODO: extrair sinistro_id
    # TODO: deletar item do DynamoDB
    # TODO: deletar arquivo do S3
    return {"statusCode": 501, "body": json.dumps({"message": "Not implemented yet"})}
