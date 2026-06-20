# Custos AWS — DocuSmart Intelligence

> Estimativa de custos do projeto, por serviço, em modelo **pay-per-use** (sem instâncias
> fixas). Valores de **referência da região `us-east-1`** — preços mudam; confirme sempre na
> [Calculadora de Preços AWS](https://calculator.aws/) e nas páginas oficiais de cada serviço.
> A arquitetura é 100% serverless, então **sem uso = sem custo**.

---

## 1. Premissas de cálculo

Para estimar, assumimos um **sinistro típico**:

- **3 documentos** por pacote (ex.: CNH, CRLV, foto do veículo), ~1 página cada.
- Cada documento passa por **Textract + Comprehend + Rekognition**.
- O agente SAC (chat) responde, em média, **3 perguntas por sinistro**.

E um **volume mensal de demonstração**: **1.000 sinistros** + **3.000 perguntas** no chat.

---

## 2. Preço unitário por serviço (referência us-east-1)

| Serviço                           | O que cobramos                                       | Preço de referência                                                                                                        |
| --------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Lambda**                        | Execução das 11 funções                              | $0,20 / 1M requisições + $0,0000166667 / GB-s                                                                              |
| **API Gateway** (REST)            | Endpoints `/upload`, `/chat`, `/sinistro`, etc.      | $3,50 / 1M chamadas                                                                                                        |
| **Step Functions**                | Orquestração do pipeline (Map + agregador)           | $0,025 / 1.000 transições de estado                                                                                        |
| **DynamoDB** (on-demand)          | Tabela única (SINISTRO/DOCUMENTO/AUDIT/APOLICE/CHAT) | $1,25 / 1M escritas · $0,25 / 1M leituras                                                                                  |
| **S3**                            | Upload de documentos + assets                        | $0,023 / GB-mês · $0,005 / 1.000 PUT · $0,0004 / 1.000 GET                                                                 |
| **Textract**                      | Extração de texto/campos                             | `DetectDocumentText` $1,50 / 1.000 págs · `AnalyzeDocument` (Queries/Tables) ~$15 / 1.000 págs · (Forms) ~$50 / 1.000 págs |
| **Comprehend**                    | Entidades / sentimento                               | $0,0001 / unidade (100 chars), mín. 3 un. = **~$0,0003 / doc**                                                             |
| **Rekognition**                   | Detecção em imagens (labels/texto)                   | ~$1,00 / 1.000 imagens                                                                                                     |
| **Bedrock — Claude Haiku 4.5**    | Chat do agente SAC (Converse)                        | **$1,00 / 1M tokens entrada · $5,00 / 1M tokens saída**                                                                    |
| **Bedrock — Titan Embeddings v2** | Vetorização p/ RAG (indexação + busca)               | ~$0,02 / 1M tokens                                                                                                         |
| **S3 Vectors** (Knowledge Base)   | Armazenamento + consulta de vetores                  | ~$0,06 / GB-mês + consultas (centavos no nosso volume)                                                                     |
| **Bedrock Guardrails**            | Filtros de conteúdo do chat                          | ~$0,15 / 1.000 text units (1 un. = 1.000 chars) — desprezível                                                              |
| **SNS**                           | Notificação de decisão do sinistro                   | $0,50 / 1M publicações · e-mail: 1.000 grátis/mês, depois $2 / 100k                                                        |
| **CloudWatch Logs**               | Logs das Lambdas/SFN                                 | ~$0,50 / GB ingerido                                                                                                       |
| **Amplify Hosting**               | Front-end (build + CDN)                              | build ~$0,01 / min · servido ~$0,15 / GB · armazenado ~$0,023 / GB-mês                                                     |

---

## 3. Custo por sinistro (IDP — Etapa 1 + 2)

Para 3 documentos de 1 página, usando `AnalyzeDocument` com **Queries** (extração de campos
específicos: CPF, placa, vigência):

| Item                                    | Cálculo                     | Custo       |
| --------------------------------------- | --------------------------- | ----------- |
| Textract (Queries)                      | 3 págs × $0,015             | $0,045      |
| Comprehend                              | 3 docs × $0,0003            | $0,0009     |
| Rekognition                             | 3 imgs × $0,001             | $0,003      |
| Embeddings (indexação)                  | ~poucos milhares de tokens  | < $0,0001   |
| Lambda + Step Functions + DynamoDB + S3 | dezenas de transições/itens | < $0,001    |
| **Total por sinistro**                  |                             | **≈ $0,05** |

> Se trocar Queries por **Forms** ($0,05/pág), o custo Textract sobe para ~$0,15/sinistro — o
> Textract é o fator dominante do IDP.

---

## 4. Custo por pergunta no chat (Agente SAC)

Claude Haiku 4.5 via Bedrock, com RAG híbrido (~2.000 tokens de contexto + ~400 de resposta):

| Item                          | Cálculo         | Custo        |
| ----------------------------- | --------------- | ------------ |
| Bedrock entrada               | 2.000 × $1 / 1M | $0,0020      |
| Bedrock saída                 | 400 × $5 / 1M   | $0,0020      |
| Embeddings (busca semântica)  | ~50 tokens      | < $0,0001    |
| Guardrails + S3 Vectors query | —               | desprezível  |
| **Total por pergunta**        |                 | **≈ $0,004** |

---

## 5. Estimativa mensal (demo: 1.000 sinistros + 3.000 perguntas)

| Categoria                                      | Cálculo        | Custo/mês          |
| ---------------------------------------------- | -------------- | ------------------ |
| IDP (sinistros)                                | 1.000 × $0,05  | ~$50               |
| Chat (perguntas)                               | 3.000 × $0,004 | ~$12               |
| S3 / DynamoDB / SNS / armazenamento de vetores | volume baixo   | ~$5                |
| Amplify + CloudWatch                           | hosting + logs | ~$5–10             |
| **Total estimado**                             |                | **≈ $70–80 / mês** |

> **Free Tier:** boa parte da demo cabe no nível gratuito da AWS — Lambda (1M req/mês),
> DynamoDB (25 GB), SNS (1.000 e-mails), CloudWatch, e os 3 primeiros meses de Textract/
> Comprehend/Rekognition têm cota gratuita. Para uma apresentação pontual, o custo real
> tende a **poucos dólares**.

---

## 6. Onde o custo se concentra

1. **Textract** — maior fatia do IDP. Use `Queries` em vez de `Forms` sempre que precisar só
   de campos específicos (3× mais barato).
2. **Bedrock (chat)** — escala com o nº de perguntas e o tamanho do contexto RAG.
3. Todo o resto (Lambda, Step Functions, DynamoDB, S3, SNS, Guardrails, S3 Vectors) é
   **centavos** no nosso volume.

---

## 7. Sugestões de otimização

- **Textract sob medida:** preferir `Queries` a `Forms`; rodar `DetectDocumentText` (texto puro,
  $0,0015/pág) quando não houver campos estruturados a extrair.
- **Cortar o contexto do RAG:** enviar ao Bedrock só os trechos relevantes reduz tokens de
  entrada — principal alavanca de custo do chat.
- **Cache de prompt (Bedrock):** se o system prompt do agente for estável, o cache reduz o custo
  da parte fixa do contexto em chamadas repetidas.
- **Retenção de logs:** definir expiração nos grupos do CloudWatch (ex.: 14–30 dias) evita
  acúmulo de custo de armazenamento de logs.
- **Lifecycle no S3:** mover/expirar uploads antigos para classes mais baratas (ou deletar após
  o processamento) corta o custo de armazenamento.
- **Manter on-demand no DynamoDB** enquanto o tráfego for irregular (hackathon/demo); só vale
  provisionar capacidade com volume alto e previsível.

---

_Valores de referência us-east-1, sujeitos a alteração. Confirme na
[Calculadora AWS](https://calculator.aws/) antes de usar como base oficial._
