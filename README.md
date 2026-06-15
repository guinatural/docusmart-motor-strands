# 🤖 DocuSmart — Motor de Análise Documental (Strands SDK)

**Responsável:** Guilherme Barreto
**Papel no Hackathon:** Arquiteto IA / Backend (Motor de Extração)
**Contexto:** Este repositório contém o "Motor" do projeto DocuSmart Intelligence do Hack2Hire 2026 — Escola da Nuvem.

---

## O que é isso?

Este módulo é responsável pelo núcleo de inteligência do pipeline IDP (Case B).
Ele recebe um documento PDF armazenado no Amazon S3, processa com IA (Textract + Bedrock via Strands SDK) e devolve um JSON estruturado com os dados do sinistro.

**O time consome a API deste módulo. Não precisa entender como ele funciona por dentro.**

---

## Arquitetura do Motor

```
[PDF no S3]
     │
     ▼
[API Gateway POST /analisar-sinistro]
     │
     ▼
[Lambda Python 3.12 + Strands SDK Layer]
     │
     ├── Tool 1: Amazon Textract  → OCR, extrai o texto do PDF
     ├── Tool 2: Amazon Bedrock   → Classifica e resume o documento
     └── Tool 3: Amazon DynamoDB  → Salva o resultado estruturado
     │
     ▼
[JSON padronizado de resposta]
```

---

## Como usar (para o time)

### Endpoint
```
POST /analisar-sinistro
Content-Type: application/json
```

### Payload de entrada
```json
{
  "bucket": "docusmart-sinistros",
  "key": "uploads/boletim-ocorrencia.pdf"
}
```

### Resposta de sucesso (200)
```json
{
  "id": "7f3a91bc-e2a1-4c9d-a832-...",
  "tipo_documento": "Boletim de Ocorrência",
  "confianca": 0.91,
  "resumo": "Acidente de trânsito na Av. Paulista em 10/06/2025, envolvendo dois veículos. Sem vítimas.",
  "campos_extraidos": {
    "data": "10/06/2025",
    "local": "Av. Paulista, 1000",
    "valor_prejuizo": "R$ 4.500,00",
    "envolvidos": ["João Silva", "Maria Souza"]
  },
  "processado_em": "2026-06-17T14:23:00Z"
}
```

### Teste rápido com curl
```bash
curl -X POST https://<sua-api>.execute-api.us-east-1.amazonaws.com/prod/analisar-sinistro \
  -H "Content-Type: application/json" \
  -d '{"bucket": "docusmart-sinistros", "key": "samples/documents/boletim-ocorrencia.pdf"}'
```

---

## Configuração da Lambda

### Runtime
- **Python:** 3.12
- **Arquitetura:** x86_64
- **Timeout:** 60 segundos (mínimo)

### Lambda Layer (Strands SDK — obrigatório)
```
arn:aws:lambda:us-east-1:856699698935:layer:strands-agents-py3_12-x86_64:2
```

### Variáveis de Ambiente
| Variável | Valor |
|---|---|
| `AWS_REGION_NAME` | `us-east-1` |
| `DYNAMO_TABLE_NAME` | `sinistros-resultados` |
| `DOCUMENTS_BUCKET` | `docusmart-sinistros` |

### Permissões IAM (Execution Role)
- `AmazonTextractFullAccess`
- `AmazonDynamoDBFullAccess`
- `AmazonS3ReadOnlyAccess`
- `AmazonBedrockFullAccess`

---

## Estrutura do repositório

```
docusmart-motor-strands/
├── lambda/
│   └── lambda_function.py   ← Código principal da Lambda
├── samples/
│   └── documents/           ← PDFs de teste (B.O., Nota Fiscal, etc.)
├── tests/
│   └── test_payload.json    ← Payload para testar no Console/Postman
├── docs/                    ← Documentação adicional
├── .env.example             ← Variáveis de ambiente necessárias
└── README.md                ← Este arquivo
```

---

## Custo AWS estimado (hackathon inteiro)

| Serviço | Uso | Custo |
|---|---|---|
| Amazon Textract | ~50 páginas | < US$ 2,00 |
| Amazon Bedrock (Nova Pro) | ~100 invocações | < US$ 3,00 |
| AWS Lambda + API Gateway | Baixo volume | < US$ 0,50 |
| Amazon S3 + DynamoDB | Mínimo | < US$ 0,50 |
| **Strands SDK** | Framework Python | **US$ 0,00** |
| **TOTAL** | | **< US$ 6,00** |

---

*Hack2Hire 2026 — Escola da Nuvem | Guilherme Barreto*
