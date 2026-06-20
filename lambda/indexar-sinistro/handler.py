import json
import boto3
import os

REGION = os.environ.get("AWS_REGION_NAME", "us-east-1")
TABLE = os.environ["DYNAMO_TABLE_NAME"]
VECTOR_BUCKET = os.environ["VECTOR_BUCKET_NAME"]
VECTOR_INDEX = os.environ.get("VECTOR_INDEX_NAME", "sinistros-index")

bedrock = boto3.client("bedrock-runtime", region_name=REGION)
s3vectors = boto3.client("s3vectors", region_name=REGION)
dynamo = boto3.resource("dynamodb", region_name=REGION)


def gerar_embedding(texto: str) -> list:
    response = bedrock.invoke_model(
        modelId="amazon.titan-embed-text-v2:0",
        body=json.dumps({"inputText": texto[:8000]}),
    )
    body = json.loads(response["body"].read())
    return body["embedding"]


def lambda_handler(event, context):
    sinistro_id = event.get("agent_data", {}).get("body_json", {}).get("sinistro_id")
    if not sinistro_id:
        return {"status": "skipped", "reason": "sinistro_id ausente"}

    table = dynamo.Table(TABLE)
    item = table.get_item(Key={"id": sinistro_id}).get("Item")

    if not item:
        return {"status": "skipped", "reason": f"item {sinistro_id} nao encontrado"}

    texto_para_indexar = item.get("resumo", "")
    if not texto_para_indexar:
        return {"status": "skipped", "reason": "campo resumo vazio"}

    vetor = gerar_embedding(texto_para_indexar)

    s3vectors.put_vectors(
        vectorBucketName=VECTOR_BUCKET,
        indexName=VECTOR_INDEX,
        vectors=[
            {
                "key": sinistro_id,
                "data": {"float32": vetor},
                "metadata": {
                    "sinistro_id": sinistro_id,
                    "tipo_documento": item.get("tipo_documento", ""),
                    "resumo": texto_para_indexar[:2000],
                },
            }
        ],
    )

    return {"status": "indexed", "sinistro_id": sinistro_id}
