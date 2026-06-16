# 🏢 DocuSmart Intelligence — Hack2Hire 2026

**Escola da Nuvem + AWS | Case B — IDP com AWS AI Services + Agente GenAI**

---

## 🗺️ Mapa do Projeto

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DOCUSMART INTELLIGENCE                                                 │
│                                                                         │
│  Cliente / Analista                                                     │
│        ↓                                                                │
│  API Gateway ────────────────────────── [Papel 3 — Jhonny]             │
│        ↓                                                                │
│  Step Functions ─────────────────────── [Papel 3 — Jhonny]             │
│        ↓                                                                │
│ ╔══════════════════════════════════════╗                               │
│ ║  ⭐ MOTOR STRANDS                   ║ ← [Papel 1 — GUILHERME]       │
│ ║  lambda/process_document/           ║                               │
│ ║  Textract → Comprehend → Rekognition ║                               │
│ ║  → Bedrock (Claude 3 Haiku)         ║                               │
│ ║  → DynamoDB (resultado + auditoria) ║                               │
│ ╚══════════════════════════════════════╝                               │
│        ↓                                                                │
│  DynamoDB ───────────────────────────── [Papel 2 — Jeanne/Jonny]       │
│        ↓                                                                │
│  Agente SAC ─────────────────────────── [Papel 4 — Wanderson]          │
│  (Bedrock + S3 Vectors)                                                 │
│        ↓                                                                │
│  Frontend ───────────────────────────── [Papel 5 — Victor]             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Pastas e Responsáveis

| Pasta | Responsável | Status |
|-------|-------------|--------|
| `lambda/process_document/` | ⭐ **Guilherme Barreto** | ✅ Implementado |
| `lambda/api_handlers/` | Papel 3 — Jhonny | ⏳ Pendente |
| `lambda/agent_handler/` | Papel 4 — Wanderson | ⏳ Pendente |
| `step-functions/` | Papel 3 — Jhonny | ⏳ Pendente |
| `infrastructure/` | Papel 2 — Jeanne/Jonny | ⏳ Pendente |
| `frontend/` | Papel 5 — Victor | ⏳ Pendente |
| `samples/documents/` | Todos | Adicionar PDFs de teste |

> **Cada pasta tem um arquivo `OWNER.txt`** com as instruções detalhadas de implementação.

---

## ⭐ Motor de Análise (Guilherme) — Como funciona

```
POST /analisar-sinistro
Body: { "bucket": "docusmart-sinistros", "key": "uploads/doc.pdf" }

↓

Lambda (Strands Agent — Claude 3 Haiku)
  ├── Tool 1: Textract → extrai texto
  ├── Tool 2: Comprehend → extrai entidades (pt-BR)
  ├── Tool 3: Rekognition → analisa imagens
  ├── Tool 6: DynamoDB → auditoria por etapa
  └── Tool 5: DynamoDB → salva resultado final

↓

HTTP 200 + JSON estruturado
```

**Resposta:**
```json
{
  "id": "uuid",
  "sinistro_id": "uuid",
  "tipo_documento": "Boletim de Ocorrência",
  "confianca": 0.94,
  "resumo": "Acidente na Av. Paulista. Sem vítimas.",
  "campos_extraidos": { "data": "...", "local": "...", "valor_prejuizo": "..." },
  "processado_em": "2026-06-17T14:23:00Z"
}
```

---

## 🚀 Como executar o motor (Guilherme)

### Configuração da Lambda

| Parâmetro | Valor |
|-----------|-------|
| Runtime | Python 3.12 |
| Handler | `lambda_function.lambda_handler` |
| Timeout | 60s |
| Memory | 512 MB |
| Layer | `arn:aws:lambda:us-east-1:856699698935:layer:strands-agents-py3_12-x86_64:2` |

### Variáveis de ambiente
```
AWS_REGION_NAME=us-east-1
DYNAMO_TABLE_NAME=sinistros-resultados
DOCUMENTS_BUCKET=docusmart-sinistros
```

### Permissões IAM (Execution Role)
```
AmazonTextractFullAccess
AmazonComprehendReadOnly
AmazonRekognitionReadOnlyAccess
AmazonBedrockFullAccess
AmazonDynamoDBFullAccess
AmazonS3ReadOnlyAccess
```

### Teste rápido no Console AWS
```json
{
  "bucket": "docusmart-sinistros",
  "key": "uploads/boletim-teste.pdf"
}
```

---

## 📋 Critérios do Case B (o que a banca avalia)

| Critério | Responsável | Status |
|----------|-------------|--------|
| Pipeline IDP funcional (upload → extração) | Guilherme + Jhonny | ✅/⏳ |
| Qualidade da extração e classificação | **Guilherme** | ✅ |
| **Agente de IA com RAG** | **Wanderson** | ⏳ |
| Arquitetura serverless + boas práticas | Todos | ⏳ |
| Inovação e UX | Victor + Todos | ⏳ |
| Apresentação e documentação | **Guilherme** | ⏳ |

---

## 🔗 Serviços AWS utilizados

S3 · Textract · Comprehend · Rekognition · Bedrock (Claude 3 Haiku) ·
Bedrock AgentCore · S3 Vectors · Lambda · DynamoDB · Step Functions · API Gateway · CloudWatch

---

*Hack2Hire 2026 — Escola da Nuvem + AWS*
*Desenvolvido por: Guilherme Barreto e time*
