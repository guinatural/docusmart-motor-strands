# 🤖 Motor de Análise Documental — DocuSmart Intelligence

**Responsável:** Guilherme Barreto
**Projeto:** Hack2Hire 2026 — Escola da Nuvem + AWS
**Papel:** Motor Strands — núcleo do pipeline IDP do Case B

---

## O que este motor faz

Recebe um arquivo (PDF ou imagem) armazenado no S3 e devolve um JSON estruturado com:
- Tipo do documento classificado
- Campos extraídos (data, local, valor, envolvidos)
- Resumo em 2 frases
- Score de confiança
- Trilha de auditoria completa por etapa no DynamoDB

## Arquitetura do Motor

```
POST { bucket, key }
        ↓
    API Gateway
        ↓
    Lambda (Strands Agent — Claude 3 Haiku)
        ↓
    PDF/doc?  → Textract (OCR) → Comprehend (NER pt-BR)
    Imagem?   → Rekognition (labels + danos)
        ↓
    Bedrock sintetiza → JSON final
        ↓
    DynamoDB salva resultado + auditoria por etapa
        ↓
    HTTP 200 + JSON
```

## Serviços AWS utilizados

| Serviço | Função |
|---------|--------|
| Amazon Textract | OCR — extrai texto de documentos |
| Amazon Comprehend | NER em português — datas, nomes, valores |
| Amazon Rekognition | Análise visual de imagens e danos |
| Amazon Bedrock (Claude 3 Haiku) | LLM — síntese e classificação final |
| Amazon DynamoDB | Persistência + auditoria por etapa |
| AWS Lambda + Strands SDK | Orquestração do agente |

## Como usar

### Endpoint
`POST /analisar-sinistro`

### Payload de entrada
```json
{
  "bucket": "docusmart-sinistros",
  "key": "uploads/boletim-001.pdf"
}
```

### Resposta (200 OK)
```json
{
  "id": "uuid-gerado",
  "sinistro_id": "uuid-do-sinistro",
  "tipo_documento": "Boletim de Ocorrência",
  "confianca": 0.94,
  "resumo": "Acidente de trânsito na Av. Paulista em 10/06/2025. Sem vítimas registradas.",
  "campos_extraidos": {
    "data": "10/06/2025",
    "local": "Av. Paulista, 1000",
    "valor_prejuizo": "R$ 4.500,00",
    "envolvidos": ["João Silva", "Maria Souza"]
  },
  "processado_em": "2026-06-17T14:23:00Z",
  "s3_origem": { "bucket": "docusmart-sinistros", "key": "uploads/boletim-001.pdf" }
}
```

### Erros
| Código | error_code | Causa |
|--------|------------|-------|
| 400 | MISSING_PARAMS | Faltou bucket ou key no body |
| 502 | AGENT_FAILED | Erro interno no agente |

## Configuração da Lambda

| Parâmetro | Valor |
|-----------|-------|
| Runtime | Python 3.12 |
| Timeout | 60s (mínimo) |
| Memory | 512 MB |
| Layer | `arn:aws:lambda:us-east-1:856699698935:layer:strands-agents-py3_12-x86_64:2` |

### Variáveis de ambiente
```
AWS_REGION_NAME=us-east-1
DYNAMO_TABLE_NAME=sinistros-resultados
DOCUMENTS_BUCKET=docusmart-sinistros
```

### IAM (Execution Role)
```
AmazonTextractFullAccess
AmazonComprehendReadOnly
AmazonRekognitionReadOnlyAccess
AmazonBedrockFullAccess
AmazonDynamoDBFullAccess
AmazonS3ReadOnlyAccess
```

## Teste rápido

```bash
# Testar via curl (com API Gateway configurado)
curl -X POST https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod/analisar-sinistro \
  -H "Content-Type: application/json" \
  -d '{"bucket": "docusmart-sinistros", "key": "uploads/boletim-teste.pdf"}'
```

## Estrutura do projeto

```
docusmart-motor-strands/
├── lambda/
│   └── lambda_function.py    ← Código principal (6 tools + handler)
├── samples/                  ← PDFs de teste (não comitar dados reais)
├── tests/
│   └── test_payload.json     ← Payload para testar no Console AWS
├── .env.example              ← Variáveis de ambiente necessárias
└── README.md
```

## Integração com o time

O Step Functions do time chama esta Lambda na etapa `AnalisarDocumento`:

```json
{
  "Resource": "arn:aws:lambda:us-east-1:ACCOUNT:function:docusmart-motor",
  "Parameters": {
    "bucket.$": "$.bucket",
    "key.$": "$.key"
  }
}
```

O JSON retornado alimenta o Agente SAC (Papel 4) via DynamoDB.

---

*Hack2Hire 2026 — Escola da Nuvem + AWS | Guilherme Barreto*
