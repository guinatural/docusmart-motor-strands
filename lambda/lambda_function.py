import json
import boto3
import uuid
import os
from datetime import datetime
from strands import Agent
from strands.models import BedrockModel
from strands.tools import tool


# ─── TOOL 1: Textract — Especialista em OCR de documentos ────────────────────
@tool
def extrair_texto_documento(bucket: str, key: str) -> str:
    """
    Extrai o texto completo de um documento PDF ou imagem de documento
    usando Amazon Textract (OCR especializado em documentos com texto).
    Use esta ferramenta para: B.O., Notas Fiscais, CNH, Laudos Médicos, Formulários.
    """
    textract = boto3.client('textract', region_name=os.environ.get('AWS_REGION_NAME', 'us-east-1'))
    resp = textract.detect_document_text(
        Document={'S3Object': {'Bucket': bucket, 'Name': key}}
    )
    linhas = [b['Text'] for b in resp['Blocks'] if b['BlockType'] == 'LINE']
    return ' '.join(linhas)


# ─── TOOL 2: Comprehend — Especialista em NER em Português ───────────────────
@tool
def extrair_entidades_texto(texto: str) -> dict:
    """
    Extrai entidades nomeadas do texto em Português usando Amazon Comprehend:
    datas, valores monetários, CPFs, nomes de pessoas, locais e organizações.
    Use esta ferramenta APÓS extrair_texto_documento, passando o texto retornado.
    """
    comprehend = boto3.client('comprehend', region_name=os.environ.get('AWS_REGION_NAME', 'us-east-1'))
    resp = comprehend.detect_entities(
        Text=texto[:4900],  # Comprehend aceita até 5000 chars por chamada
        LanguageCode='pt'
    )
    entidades = {}
    for entidade in resp['Entities']:
        tipo = entidade['Type']
        valor = entidade['Text']
        if tipo not in entidades:
            entidades[tipo] = []
        entidades[tipo].append(valor)
    return entidades


# ─── TOOL 3: Rekognition — Especialista em análise de imagens ────────────────
@tool
def analisar_imagem_veiculo(bucket: str, key: str) -> dict:
    """
    Analisa visualmente uma imagem de veículo sinistrado ou cena de acidente
    usando Amazon Rekognition. Detecta objetos, labels e indicadores de dano.
    Use esta ferramenta para: fotos de carros, imagens de danos, cenas de acidente.
    NÃO use para documentos PDF ou imagens de documentos com texto.
    """
    rekognition = boto3.client('rekognition', region_name=os.environ.get('AWS_REGION_NAME', 'us-east-1'))
    resp = rekognition.detect_labels(
        Image={'S3Object': {'Bucket': bucket, 'Name': key}},
        MaxLabels=20,
        MinConfidence=70.0
    )
    labels = [
        {'label': l['Name'], 'confianca': round(l['Confidence'], 2)}
        for l in resp['Labels']
    ]
    return {
        'labels_detectados': labels,
        'total_labels': len(labels)
    }


# ─── TOOL 4: DynamoDB — Persistência do resultado final ──────────────────────
@tool
def salvar_resultado_dynamodb(resultado: dict) -> str:
    """
    Salva o resultado estruturado final da análise no Amazon DynamoDB.
    Chame esta ferramenta APENAS após ter o JSON final completo com todos os campos.
    Retorna o ID UUID gerado para o registro salvo.
    """
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

    if not bucket or not key:
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error_code': 'MISSING_PARAMS',
                'message': 'Informe os campos bucket e key no body da requisição.'
            })
        }

    # Detecta tipo do arquivo pelo extension
    extensao = key.lower().split('.')[-1]
    tipo_arquivo = 'imagem' if extensao in ['jpg', 'jpeg', 'png', 'bmp', 'tiff'] else 'documento'

    # Inicializa o Agente Strands com as 4 ferramentas especializadas
    agente = Agent(
        model=BedrockModel(model_id='us.amazon.nova-lite-v1:0'),  # Mais barato da AWS
        tools=[
            extrair_texto_documento,    # Tool 1: Textract (OCR)
            extrair_entidades_texto,    # Tool 2: Comprehend (NER em PT-BR)
            analisar_imagem_veiculo,    # Tool 3: Rekognition (análise visual)
            salvar_resultado_dynamodb   # Tool 4: DynamoDB (persistência)
        ],
        system_prompt=(
            'Você é um especialista em análise de sinistros de seguro. '
            'Cada tecnologia tem uma especialidade. Siga estas regras obrigatórias: '

            'REGRA 1 — TIPO DE ARQUIVO: '
            f'O arquivo recebido é do tipo "{tipo_arquivo}". '
            'Se for "documento" (PDF, formulário, B.O., NF, CNH, Laudo): '
            'use extrair_texto_documento para extrair o texto, depois '
            'use extrair_entidades_texto para identificar datas, valores e nomes. '
            'Se for "imagem" (foto de veículo, dano, acidente): '
            'use analisar_imagem_veiculo para detectar labels e danos. '

            'REGRA 2 — RACIOCÍNIO FINAL: '
            'Com os dados coletados acima, monte um dicionário Python com: '
            'tipo_documento (Boletim de Ocorrência / Laudo Médico / Nota Fiscal / '
            'Documento de Identidade / Imagem de Sinistro / Outro), '
            'confianca (0.0 a 1.0), '
            'resumo (exatamente 2 frases descrevendo o documento ou imagem), '
            'campos_extraidos (dict com todos os dados encontrados: data, local, '
            'valor_prejuizo, envolvidos, labels_detectados conforme aplicável). '

            'REGRA 3 — SALVAR: '
            'Use salvar_resultado_dynamodb passando o dicionário completo. '

            'REGRA 4 — RESPOSTA: '
            'Responda APENAS com o JSON final. Sem texto adicional.'
        )
    )

    try:
        instrucao = f'Analise o arquivo no bucket "{bucket}", chave "{key}"'
        resposta = agente(instrucao)
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
