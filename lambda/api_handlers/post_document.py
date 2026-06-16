# post_document.py
# RESPONSÁVEL: Papel 3 — Jhonny
# TODO: Implementar POST /upload-sinistro — recebe arquivo, salva no S3
# TODO: Implementar POST /analisar-sinistro — chama Lambda do Guilherme

import boto3, json, os

def lambda_handler(event, context):
    # TODO: receber arquivo do body (base64) ou URL pre-signed
    # TODO: salvar no S3 em uploads/
    # TODO: invocar process_document Lambda
    return {"statusCode": 501, "body": json.dumps({"message": "Not implemented yet"})}
