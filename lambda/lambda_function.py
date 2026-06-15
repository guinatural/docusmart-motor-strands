import json
import boto3
import uuid
import os
from datetime import datetime
from strands import Agent
from strands.models import BedrockModel
from strands.tools import tool


# ─── FERRAMENTA 1: Extração de texto via OCR ─────────────────────────────────
@tool
def extrair_texto_do_documento(bucket: str, key: str) -> str:
    """Extrai o texto completo de um documento PDF usando Amazon Textract."""
    textract = boto3.client('textract', region_name=os.environ.get('AWS_REGION_NAME', 'us-east-1'))
    resp = textract.detect_document_text(
        Document={'S3Object': {'Bucket': bucket, 'Name': key}}
    )
    linhas = [b['Text'] for b in resp['Blocks'] if b['BlockType'] == 'LINE']
    return ' '.join(linhas)


# ─── FERRAMENTA 2: Persistência no DynamoDB ──────────────────────────────────
@tool
def salvar_resultado_dynamodb(resultado: dict) -> str:
    """Salva o resultado estruturado da análise no DynamoDB. Retorna o ID gerado."""
    dynamo = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION_NAME', 'us-east-1'))
    table = dynamo.Table(os.environ['DYNAMO_TABLE_NAME'])
    resultado['id'] = str(uuid.uuid4())
    resultado['processado_em'] = datetime.utcnow().isoformat() + 'Z'
    table.put_item(Item=resultado)
    return resultado['id']


# ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────
def lambda_handler(event, context):
    # Aceita chamada direta ou via API Gateway (Proxy Integration)
    if 'body' in event:
        body = json.loads(event.get('body', '{}'))
    else:
        body = event

    bucket = body.get('bucket')
    key = body.get('key')

    # Validação de entrada
    if not bucket or not key:
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error_code': 'MISSING_PARAMS',
                'message': 'Informe os campos bucket e key no body da requisição.'
            })
        }

    # Inicializa o Agente Strands
    agente = Agent(
        model=BedrockModel(model_id='us.amazon.nova-pro-v1:0'),
        tools=[extrair_texto_do_documento, salvar_resultado_dynamodb],
        system_prompt=(
            'Você é um especialista em análise de sinistros de seguro. '
            'Siga exatamente estes passos em ordem: '
            '1) Use a ferramenta extrair_texto_do_documento para obter o texto do arquivo. '
            '2) Classifique o tipo do documento (Boletim de Ocorrência, Laudo Médico, '
            'Nota Fiscal, Documento de Identidade ou Outro). '
            '3) Extraia os campos: data, local, valor_prejuizo, envolvidos. '
            '4) Gere um resumo de exatamente 2 frases. '
            '5) Monte um dicionário Python com: tipo_documento, confianca (0 a 1), '
            'resumo, campos_extraidos (dict com os campos acima). '
            '6) Use a ferramenta salvar_resultado_dynamodb passando esse dicionário. '
            'Responda APENAS com o JSON final, sem texto adicional.'
        )
    )

    try:
        resposta = agente(f'Analise o documento no bucket {bucket}, chave {key}')
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': str(resposta)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error_code': 'AGENT_FAILED',
                'message': str(e)
            })
        }
