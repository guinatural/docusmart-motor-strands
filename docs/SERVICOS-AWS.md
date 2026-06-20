# Serviços AWS — DocuSmart

Mapa de **todos os serviços AWS** usados no projeto: onde entram, para quê e por
quê. Tudo em **us-east-1**, conta `152160819260` (Grupo 5).

> **Princípio da arquitetura:** 100% **serverless / gerenciado**. Não há EC2,
> RDS nem VPC — todos os serviços são regionais, acessados por endpoint, e
> cobrados por uso (_pay-per-use_). Isso dá escala automática, zero servidor pra
> administrar e custo próximo de zero em repouso.

---

## Visão rápida

| Serviço                                 | Papel no DocuSmart                                      |
| --------------------------------------- | ------------------------------------------------------- |
| **API Gateway**                         | Porta de entrada REST (7 rotas)                         |
| **Lambda**                              | Toda a computação (11 funções Python 3.12)              |
| **Step Functions**                      | Orquestra o pipeline (1 sinistro, N documentos)         |
| **S3**                                  | Armazena os documentos enviados                         |
| **DynamoDB**                            | Banco (sinistros, documentos, auditoria, apólices)      |
| **Textract**                            | OCR — extrai texto de documentos                        |
| **Comprehend**                          | NER — entidades em português                            |
| **Rekognition**                         | Visão — analisa fotos de veículos/danos                 |
| **Bedrock (Converse)**                  | LLM (Claude Haiku) — classifica/extrai e responde o SAC |
| **Bedrock Knowledge Base + S3 Vectors** | RAG — busca semântica nos documentos                    |
| **Amplify Hosting**                     | Hospeda o frontend (Next.js)                            |
| **CloudWatch**                          | Logs e observabilidade                                  |
| **IAM**                                 | Permissões (roles das Lambdas e do Step Functions)      |

---

## Camada de entrada e orquestração

### Amazon API Gateway (REST)

- **Onde:** expõe as 7 rotas — `POST /upload`, `POST /sinistro`,
  `GET /sinistro/{id}`, `GET /sinistros`, `PUT /sinistro/{id}`,
  `DELETE /sinistro/{id}`, `POST /chat`. Cada rota integra (AWS_PROXY) com uma
  Lambda.
- **Finalidade:** ser a fachada HTTP única entre o frontend e o backend, com CORS.
- **Por quê:** gerenciado, escala sozinho, integra nativamente com Lambda e não
  exige servidor de API.

### AWS Step Functions

- **Onde:** state machine `docusmart-idp-grupo-5-pipeline`. Disparada pelo
  `intake`; faz um **Map** por documento (chama `processar-sinistro`) e depois
  `agregar-decisao`.
- **Finalidade:** orquestrar o processamento de **vários documentos** de um
  mesmo sinistro e só então decidir.
- **Por quê:** dá paralelismo (Map), _retries_ automáticos por etapa, e um
  histórico visual de execução — sem escrever código de orquestração.

---

## Computação

### AWS Lambda (Python 3.12) — 11 funções

- **Onde:** intake, processar-sinistro, agregar-decisao, get/list/put/delete-sinistro,
  chat, upload-presigned, indexar-sinistro, consultar-status (ver `lambda/README.md`).
- **Finalidade:** todo o backend — validação, processamento IDP, regras de
  negócio (Etapa 2), CRUD e o agente SAC.
- **Por quê:** compute sob demanda, escala automática, cobra por execução. Ideal
  para um pipeline orientado a eventos.

---

## Armazenamento e dados

### Amazon S3 — `docusmart-idp-grupo-5-docs`

- **Onde:** o cliente faz upload **direto** dos arquivos via **presigned URL**
  (gerada pela `upload-presigned`), no prefixo `uploads/`. O prefixo `vectors/`
  alimenta a Knowledge Base.
- **Finalidade:** guardar os documentos (PDF/imagens) dos sinistros.
- **Por quê:** durável e barato; o **presigned URL** faz o arquivo ir do browser
  direto pro S3 (não passa pela Lambda → sem limite de payload e mais barato).

### Amazon DynamoDB — `docusmart-idp-grupo-5-documents`

- **Onde:** banco principal, **single-table** (PK `id`, discriminador
  `tipo_item`): SINISTRO, DOCUMENTO, AUDIT, APOLICE, CHAT.
- **Finalidade:** estado dos sinistros, dados extraídos, trilha de auditoria,
  apólices (gabarito) e histórico do chat.
- **Por quê:** NoSQL serverless, latência baixa, escala automática, cobra por
  uso. Single-table simplifica (1 tabela para todo o domínio).

---

## Inteligência de documentos (IDP)

### Amazon Textract

- **Onde:** tool `extrair_texto_documento` na `processar-sinistro`
  (`detect_document_text`).
- **Finalidade:** OCR — extrair o texto de CNH, CRLV, notas/orçamentos, B.O.
- **Por quê:** OCR gerenciado e especializado em documentos, melhor que OCR
  genérico para layouts de formulário.

### Amazon Comprehend

- **Onde:** tool `extrair_entidades_texto` (`detect_entities`, `pt`).
- **Finalidade:** NER — identificar datas, valores, CPFs, nomes e locais no texto.
- **Por quê:** NER pronto em **português**, sem treinar modelo.

### Amazon Rekognition

- **Onde:** tool `analisar_imagem_veiculo` (`detect_labels`).
- **Finalidade:** visão computacional — detectar veículo, danos e objetos nas
  fotos da cena.
- **Por quê:** análise de imagem gerenciada; complementa o Textract quando o
  arquivo é uma foto e não um documento de texto.

---

## IA generativa (GenAI)

### Amazon Bedrock — Converse (Claude Haiku 4.5)

- **Modelo:** `us.anthropic.claude-haiku-4-5-20251001-v1:0`.
- **Onde:** (1) na `processar-sinistro`, via **Strands Agents SDK**, para
  **classificar** o documento e **extrair os campos** em JSON; (2) na `chat`,
  via **Converse API**, para responder o SAC.
- **Finalidade:** transformar texto/entidades brutas em dados estruturados e
  responder perguntas em linguagem natural.
- **Por quê:** LLM gerenciado (sem infra de modelo); Haiku é rápido e barato,
  adequado para classificação/extração e chat.

### Amazon Bedrock Knowledge Base + S3 Vectors (RAG)

- **Onde:** KB gerenciada `GDHBPK6JNK` (lastreada em **S3 Vectors**), consultada
  pela `chat` via `Retrieve`. A `indexar-sinistro` mantém um índice S3 Vectors
  próprio (`docusmart-idp-grupo-5-vectors`).
- **Finalidade:** **busca semântica** no conteúdo dos documentos (ex.: cláusulas
  da apólice) — a parte "RAG" do agente.
- **Por quê:** atende o requisito de **GenAI nativo (S3 Vectors)** do case e
  permite responder sobre o texto dos documentos, não só sobre os campos
  estruturados. O `chat` combina os dois (RAG **híbrido**: DynamoDB + S3 Vectors).

---

## Hospedagem, observabilidade e segurança

### AWS Amplify Hosting

- **Onde:** hospeda o frontend Next.js (`frontend/docusmart-web`), build a cada
  push (config em `amplify.yml`, monorepo).
- **Finalidade:** servir a aplicação web (cliente + analista).
- **Por quê:** hospedagem serverless com CI/CD, HTTPS e SSR de Next.js nativos —
  sem servidor (coerente com o resto da arquitetura).

### Amazon CloudWatch

- **Onde:** logs automáticos de todas as Lambdas e execuções do Step Functions.
- **Finalidade:** observabilidade, depuração e trilha técnica.
- **Por quê:** integrado por padrão; essencial para diagnosticar o pipeline.

### AWS IAM

- **Onde:** `docusmart-idp-grupo-5-lambda-execution-role` (Lambdas) e
  `StepFunctionsExecutionRoleGrupo5` (orquestração). A conta tem um
  _permissions boundary_ por tag (`Group=Grupo5`).
- **Finalidade:** permissões mínimas por serviço (S3, DynamoDB, Textract,
  Comprehend, Rekognition, Bedrock, Retrieve).
- **Por quê:** _least privilege_ e isolamento entre grupos na conta compartilhada.

---

## Como os serviços se encaixam no fluxo

```
Cliente → Amplify → API Gateway → upload-presigned → S3 (presigned PUT)
                              └→ intake → DynamoDB + Step Functions
                                           ├─ Map: processar-sinistro
                                           │     Textract / Comprehend / Rekognition
                                           │     + Bedrock (Claude Haiku) → DynamoDB
                                           └─ agregar-decisao → DynamoDB (decisão)
Analista → Amplify → API Gateway → get/list/put-sinistro → DynamoDB
SAC      → Amplify → API Gateway → chat → Bedrock Converse
                                          + Knowledge Base (S3 Vectors) + DynamoDB
(tudo logando em CloudWatch; permissões via IAM)
```

---

## O que NÃO usamos (e por quê)

- **EC2 / ECS / VPC:** desnecessários — nada exige rede privada ou servidor
  persistente. Tudo é gerenciado/serverless.
- **RDS:** o domínio cabe bem em DynamoDB (chave-valor + auditoria); sem
  necessidade de SQL relacional.
- **SQS/SNS:** o Step Functions já orquestra o fluxo; filas não foram necessárias
  para o volume do projeto.
