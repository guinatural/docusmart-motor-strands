# 🏢 DocuSmart Intelligence

**Hack2Hire 2026 — Escola da Nuvem + AWS · Grupo 5 · Case B (IDP + Agente GenAI)**

Pipeline **serverless de Processamento Inteligente de Documentos (IDP)** para
triagem de sinistros de seguro auto, com **decisão automática**, **fila de
revisão humana** e um **agente de IA generativa (SAC)** para consultas em
linguagem natural.

---

## Como funciona (visão de 30s)

1. **Cliente** envia o pacote de documentos (CNH, CRLV, orçamento, BO, fotos) por
   uma página pública e recebe um **protocolo**.
2. O **pipeline** (Step Functions) processa cada documento — OCR, NER e visão
   computacional — e o **agente Bedrock** classifica e extrai os campos.
3. Uma etapa de **agregação** aplica as regras de negócio (gates) e **decide**:
   aprovado automático, pendente de documentação, ou fila de análise humana.
4. O **analista** acompanha tudo num painel, revisa os casos sinalizados e
   aprova/nega. Um **chat (RAG)** responde perguntas sobre os sinistros.

---

## Arquitetura

```
Cliente ─┐                                   ┌─ Painel do analista
         │  (Next.js / Amplify)              │  (Next.js / Amplify)
         ▼                                   ▼
      ┌──────────────────── API Gateway (REST) ────────────────────┐
      │  POST /upload   POST /sinistro   GET /sinistro/{id}         │
      │  GET /sinistros  PUT /sinistro/{id}  DELETE /sinistro/{id}  │
      │  POST /chat                                                 │
      └───────┬───────────────────┬───────────────────┬────────────┘
              │                    │                   │
       S3 (presigned)      Step Functions          Bedrock Converse
        docs upload         (1 sinistro,            + S3 Vectors (KB)
              │              N documentos)           [agente SAC / RAG]
              ▼                    │
      ┌───────────────────────────▼───────────────────────────┐
      │  Map por documento → processar-sinistro                │
      │    Textract (OCR) · Comprehend (NER) · Rekognition     │
      │    + Bedrock (Claude Haiku) classifica/extrai          │
      │  → agregar-decisao (Etapa 2: gates + decisão)          │
      └───────────────────────────┬───────────────────────────┘
                                   ▼
                    DynamoDB (single-table) + Auditoria
```

### Serviços AWS

API Gateway · Lambda (Python 3.12) · Step Functions · S3 · DynamoDB ·
Amazon Textract · Comprehend · Rekognition · Bedrock (Converse + Knowledge Base /
S3 Vectors) · CloudWatch.

### Frontend

Next.js 16 · React 19 · TypeScript · Tailwind v4 — hospedado no **AWS Amplify**.

---

## Estrutura do repositório

```
frontend/docusmart-web/   App web (cliente + painel do analista + chat SAC)
lambda/                   Código das Lambdas (1 pasta por função)
  intake/                   POST /sinistro — cria 1 sinistro + N documentos
  processar-sinistro/       Processa 1 documento (OCR/NER/visão + Bedrock)
  agregar-decisao/          Etapa 2 — gates + decisão de negócio
  get-sinistro/             GET /sinistro/{id} (sinistro + documentos + auditoria)
  list-sinistros/           GET /sinistros (1 linha por sinistro)
  put-sinistro/             PUT — decisão manual do analista
  delete-sinistro/          DELETE — LGPD (remove dados + arquivos)
  chat/                     POST /chat — agente SAC (Converse + RAG)
step-functions/           pipeline.asl.json — definição do Step Functions
scripts/                  seed_clean.py · cloudwatch_dashboard.py
docs/                     ARQUITETURA.md · SERVICOS-AWS.md · CUSTOS.md · roteiro-testes.md
```

---

## Rodando o frontend

```bash
cd frontend/docusmart-web
npm install
npm run dev        # http://localhost:3000
```

Variáveis em `.env.example` (a base da API tem fallback embutido).

## Backend (referência)

- **Região:** us-east-1 · **Conta:** 152160819260 (Grupo 5)
- **API base:** `https://8ntra04xyh.execute-api.us-east-1.amazonaws.com/prod`
- **Tabela DynamoDB:** `docusmart-idp-grupo-5-documents` (single-table)
- **Bucket S3:** `docusmart-idp-grupo-5-docs`
- **Step Functions:** `docusmart-idp-grupo-5-pipeline`

Deploy das Lambdas e detalhes em [`lambda/README.md`](lambda/README.md).
Arquitetura e regras de negócio em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).
Serviços AWS (onde/porquê de cada um) em [`docs/SERVICOS-AWS.md`](docs/SERVICOS-AWS.md).
Estimativa de custos (pay-per-use) em [`docs/CUSTOS.md`](docs/CUSTOS.md).
Roteiro de testes em [`docs/roteiro-testes.md`](docs/roteiro-testes.md).

---
## Benefícios Futuros
- Utilização do Amazon Cognito para logins seguros


## IA Responsável / LGPD

- **Auditoria por etapa** de cada documento no DynamoDB.
- **Confiança** em cada extração; abaixo do limiar → revisão humana.
- **Decisão não 100% automática**: inconsistências e valores altos vão para o
  analista.
- **Direito ao esquecimento** (Art. 18 LGPD): `DELETE /sinistro/{id}` remove os
  dados do DynamoDB e os arquivos do S3.

_Projeto educacional. Todos os dados são fictícios._
