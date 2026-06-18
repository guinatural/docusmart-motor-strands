# Entrega Papel 1 — Guilherme Barreto Gomes

**Status:** ✅ COMPLETO para reunião (19/06)  
**Repo:** https://github.com/guinatural/docusmart-motor-strands  
**Conta AWS:** `152160819260` (Grupo 5) · `us-east-1`

---

## O que este papel entrega

| Entregável | Status |
|------------|--------|
| Lambda `docusmart-process-document` | ✅ Active |
| Strands Agent + 6 tools | ✅ |
| JSON estruturado + auditoria DynamoDB | ✅ |
| Documentação de integração | ✅ este arquivo |
| Payloads de teste | ✅ `tests/` |

**Fora do escopo Papel 1:** API Gateway, Step Functions, Agente SAC, Frontend, Slides.

---

## Contrato de integração (obrigatório para o time)

### Entrada

```json
{
  "bucket": "docusmart-sinistros-152160819260",
  "key": "uploads/arquivo.pdf"
}
```

### Saída (HTTP 200, body JSON)

```json
{
  "sinistro_id": "uuid",
  "tipo_documento": "Boletim de Ocorrência",
  "confianca": "0.92",
  "resumo": "Duas frases sobre o sinistro.",
  "campos_extraidos": {
    "data": "15/06/2024",
    "local": "Avenida Paulista, São Paulo, SP",
    "valor_prejuizo": "R$ 15.000,00",
    "envolvidos": ["João Silva", "Maria Santos"]
  },
  "s3_origem": {
    "bucket": "docusmart-sinistros-152160819260",
    "key": "uploads/arquivo.pdf"
  }
}
```

### ARNs

| Recurso | Valor |
|---------|-------|
| Lambda | `arn:aws:lambda:us-east-1:152160819260:function:docusmart-process-document` |
| DynamoDB | `sinistros-resultados` |
| S3 | `docusmart-sinistros-152160819260` |
| IAM Role | `docusmart-motor-role` |
| Bedrock | `us.anthropic.claude-haiku-4-5-20251001-v1:0` |
| Layer Strands | `arn:aws:lambda:us-east-1:856699698935:layer:strands-agents-py3_12-x86_64:2` |

---

## Como testar (AWS CLI)

```powershell
aws lambda invoke `
  --function-name docusmart-process-document `
  --profile hackathon `
  --region us-east-1 `
  --payload fileb://tests/invoke_payload.json `
  --cli-binary-format raw-in-base64-out `
  tests/last_invoke_output.json

Get-Content tests/last_invoke_output.json
```

Arquivo de teste no S3: `uploads/boletim-teste.txt`

---

## Step Functions (para Jhonatan)

Estado `AnalisarDocumento`:

```json
{
  "Type": "Task",
  "Resource": "arn:aws:lambda:us-east-1:152160819260:function:docusmart-process-document",
  "Parameters": {
    "bucket.$": "$.bucket",
    "key.$": "$.key"
  },
  "ResultPath": "$.analise"
}
```

Rascunho completo: `step-functions/workflow-definition.json`

---

## Tag obrigatória em recursos novos

```
Group=Grupo5
```

Sem tag, o recurso some após a política de isolamento da EDN.

---

## Evidência para a banca

- Motor serverless com GenAI (Bedrock) + serviços gerenciados (Textract, Comprehend, Rekognition)
- Auditoria por etapa no DynamoDB (critério Case B)
- Custo estimado < US$ 0,01 por documento (ver README seção 5)
