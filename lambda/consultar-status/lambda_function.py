import boto3
import json

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
table = dynamodb.Table("docusmart-idp-grupo-5-documents")


def lambda_handler(event, context):
    params = {p["name"]: p["value"] for p in event.get("parameters", [])}
    sinistro_id = params.get("sinistro_id")
    nome = params.get("nome")
    cpf = params.get("cpf")

    if sinistro_id:
        resultado = buscar_por_id(sinistro_id)
    elif nome and cpf:
        resultado = buscar_por_nome_e_cpf(nome, cpf)
    elif nome or cpf:
        resultado = {
            "erro": "Por segurança, é necessário informar nome E CPF juntos para essa busca, não apenas um dos dois."
        }
    else:
        resultado = {"erro": "Informe sinistro_id, ou nome e cpf juntos."}

    return {
        "messageVersion": "1.0",
        "response": {
            "actionGroup": event["actionGroup"],
            "function": event["function"],
            "functionResponse": {
                "responseBody": {
                    "TEXT": {"body": json.dumps(resultado, ensure_ascii=False, default=str)}
                }
            },
        },
    }


def buscar_por_id(sinistro_id: str) -> dict:
    doc = table.get_item(Key={"id": sinistro_id}).get("Item")
    audit = table.scan(
        FilterExpression="begins_with(id, :prefix)",
        ExpressionAttributeValues={":prefix": f"AUDIT#{sinistro_id}#"},
    ).get("Items", [])

    return {
        "documento": doc if doc else "não encontrado",
        "historico_operacoes": sorted(audit, key=lambda x: x.get("ts", "")),
    }


def buscar_por_nome_e_cpf(nome: str, cpf: str) -> dict:
    cpf_normalizado = "".join(filter(str.isdigit, cpf))

    response = table.scan()
    items = response.get("Items", [])

    for item in items:
        item_id = item.get("id", "")
        if item_id.startswith("AUDIT#"):
            continue

        campos = item.get("campos_extraidos", {})
        nome_item = str(campos.get("nome", campos.get("Condutor", ""))).lower()
        cpf_item = "".join(filter(str.isdigit, str(campos.get("cpf", campos.get("CPF", "")))))

        nome_bate = nome.lower() in nome_item or nome_item in nome.lower()
        cpf_bate = cpf_item == cpf_normalizado and cpf_item != ""

        if nome_bate and cpf_bate:
            sinistro_id = item_id
            audit = table.scan(
                FilterExpression="begins_with(id, :prefix)",
                ExpressionAttributeValues={":prefix": f"AUDIT#{sinistro_id}#"},
            ).get("Items", [])
            return {
                "documento": item,
                "historico_operacoes": sorted(audit, key=lambda x: x.get("ts", "")),
            }

    return {"erro": "Nenhum sinistro encontrado com esse nome e CPF combinados."}
