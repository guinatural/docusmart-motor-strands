"""
Limpeza + seed do ambiente DocuSmart (Grupo 5).
- Apaga TODOS os itens da tabela docusmart-idp-grupo-5-documents.
- Apaga o prefixo uploads/ do bucket.
- Semeia as apólices (gabarito) como itens APOLICE#<numero>.

Rodar com: AWS_PROFILE=hackathon python3 seed_clean.py
"""
import boto3
from decimal import Decimal

REGION = "us-east-1"
TABLE = "docusmart-idp-grupo-5-documents"
BUCKET = "docusmart-idp-grupo-5-docs"

dynamo = boto3.resource("dynamodb", region_name=REGION)
s3 = boto3.client("s3", region_name=REGION)


def limpar_tabela():
    table = dynamo.Table(TABLE)
    scan = table.scan(ProjectionExpression="id")
    itens = scan.get("Items", [])
    while "LastEvaluatedKey" in scan:
        scan = table.scan(ProjectionExpression="id", ExclusiveStartKey=scan["LastEvaluatedKey"])
        itens.extend(scan.get("Items", []))
    with table.batch_writer() as batch:
        for it in itens:
            batch.delete_item(Key={"id": it["id"]})
    print(f"tabela: {len(itens)} itens apagados")


def limpar_s3():
    paginator = s3.get_paginator("list_objects_v2")
    apagados = 0
    for page in paginator.paginate(Bucket=BUCKET, Prefix="uploads/"):
        objs = [{"Key": o["Key"]} for o in page.get("Contents", [])]
        if objs:
            s3.delete_objects(Bucket=BUCKET, Delete={"Objects": objs})
            apagados += len(objs)
    print(f"s3 uploads/: {apagados} objetos apagados")


APOLICES = [
    {
        "numero_apolice": "AP-2026-MFL-00123", "cpf_titular": "12345678900",
        "nome_titular": "Mariana Fulana Lima",
        "veiculo": {"placa": "RDX1A23", "renavam": "00123456789", "marca_modelo": "BMW Série 3", "ano": 2021},
        "vigencia": {"inicio": "2026-03-10", "fim": "2027-03-10"},
        "valor_segurado": 95000, "cobertura": "compreensiva", "contato": "mariana.fulana.lima@email.com",
    },
    {
        "numero_apolice": "AP-2024-5567", "cpf_titular": "12345678900", "nome_titular": "Mariana Costa Lima",
        "veiculo": {"placa": "RDX1A23", "renavam": "00123456789", "marca_modelo": "Honda Civic EXL", "ano": 2022},
        "vigencia": {"inicio": "2025-08-01", "fim": "2026-07-31"},
        "valor_segurado": 95000, "cobertura": "compreensiva", "contato": "mariana.lima@email.com",
    },
    {
        "numero_apolice": "AP-2023-3310", "cpf_titular": "98765432100", "nome_titular": "João Henrique Pereira",
        "veiculo": {"placa": "MIX7888", "renavam": "00987654321", "marca_modelo": "Volkswagen Golf", "ano": 2020},
        "vigencia": {"inicio": "2025-04-15", "fim": "2026-04-14"},
        "valor_segurado": 78000, "cobertura": "compreensiva", "contato": "joao.pereira@email.com",
    },
    {
        "numero_apolice": "AP-2025-1180", "cpf_titular": "45678912300", "nome_titular": "Carla Souza Andrade",
        "veiculo": {"placa": "QWE2C45", "renavam": "00456789123", "marca_modelo": "Toyota Corolla XEI", "ano": 2023},
        "vigencia": {"inicio": "2025-11-01", "fim": "2026-10-31"},
        "valor_segurado": 110000, "cobertura": "compreensiva", "contato": "carla.andrade@email.com",
    },
    {
        "numero_apolice": "AP-2024-7702", "cpf_titular": "32165498700", "nome_titular": "Roberto Alves Nunes",
        "veiculo": {"placa": "RST3067", "renavam": "00321654987", "marca_modelo": "Fiat Argo Drive", "ano": 2021},
        "vigencia": {"inicio": "2025-06-10", "fim": "2026-06-09"},
        "valor_segurado": 42000, "cobertura": "roubo_furto", "contato": "roberto.nunes@email.com",
    },
    {
        "numero_apolice": "AP-2025-2245", "cpf_titular": "78912345600", "nome_titular": "Patrícia Gomes Ribeiro",
        "veiculo": {"placa": "UVW4889", "renavam": "00789123456", "marca_modelo": "Hyundai HB20 Vision", "ano": 2022},
        "vigencia": {"inicio": "2026-01-15", "fim": "2027-01-14"},
        "valor_segurado": 65000, "cobertura": "compreensiva", "contato": "patricia.ribeiro@email.com",
    },
]


def _f(o):
    if isinstance(o, float):
        return Decimal(str(o))
    if isinstance(o, dict):
        return {k: _f(v) for k, v in o.items()}
    if isinstance(o, list):
        return [_f(x) for x in o]
    return o


def seed_apolices():
    table = dynamo.Table(TABLE)
    for ap in APOLICES:
        item = {"id": f"APOLICE#{ap['numero_apolice']}", "tipo_item": "APOLICE", **ap}
        table.put_item(Item=_f(item))
    print(f"apólices: {len(APOLICES)} semeadas")


if __name__ == "__main__":
    limpar_tabela()
    limpar_s3()
    seed_apolices()
    print("OK")
