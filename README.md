# 🏢 DocuSmart Intelligence (Enterprise IDP Pipeline)

**Hack2Hire 2026 — Escola da Nuvem + AWS · Grupo 5 · Case B**

Pipeline **Serverless e Event-Driven de Processamento Inteligente de Documentos (IDP)** para triagem de sinistros de seguro auto. Incorpora **decisão automática**, **fila de revisão humana (Human-in-the-loop)** e um **agente de IA generativa (SAC)** construído com Amazon Bedrock.

---

## 🏛️ Arquitetura de Produção (AWS Well-Architected)

Substituímos o acoplamento monolítico tradicional por uma máquina de estados resiliente, focando em **Confiabilidade, Observabilidade e FinOps**.

`mermaid
flowchart TD
    subgraph Frontend [Next.js / AWS Amplify]
        Client[Portal do Cliente]
        Painel[Painel do Analista]
    end

    subgraph API Gateway [REST API]
        API[Amazon API Gateway]
    end

    subgraph Orchestration [Event-Driven Core]
        SFN[AWS Step Functions\nIDP Workflow]
    end

    subgraph AI & Processing [Serverless Compute]
        Textract[Amazon Textract]
        Comp[Amazon Comprehend]
        Rekog[Amazon Rekognition]
        Bedrock[Amazon Bedrock\nClaude Haiku / RAG]
    end

    subgraph Data & State
        S3[(Amazon S3)]
        DDB[(DynamoDB\nSingle-Table)]
    end
    
    subgraph Observability & FinOps
        XRay[AWS X-Ray Tracing]
        Budgets[AWS Budgets / Cost Explorer]
    end

    Client -->|Upload via Presigned URL| S3
    Client -->|Submete Sinistro| API
    Painel -->|Consulta/Aprova| API
    
    API -->|Dispara| SFN
    SFN -->|Map State| Textract & Comp & Rekog
    SFN -->|Classificação/Extração| Bedrock
    
    Textract & Comp & Rekog & Bedrock -->|Salva Estado| DDB
    SFN -.->|Trace| XRay
    Bedrock -.->|Limites de Custo| Budgets
`

## 🛡️ Padrões Enterprise Implementados

1. **Observabilidade (O11y):** Tracing distribuído nativo com AWS X-Ray abrangendo API Gateway, Step Functions e Lambdas. Todo prompt enviado ao Bedrock é logado estruturadamente via structlog.
2. **FinOps & Cost Control:** 
   - Arquitetura 100% *Pay-as-you-go*.
   - AWS Budgets configurados para travar execuções do Amazon Textract caso o limite de gastos em USD seja excedido, prevenindo faturas surpresas.
3. **Design Resiliente (Event-Driven):** O uso do AWS Step Functions com blocos de Catch e Retry garante que falhas temporárias em APIs de IA não percam o processamento do documento.

---

## Como funciona (visão de 30s)

1. **Cliente** envia o pacote de documentos (CNH, CRLV, orçamento, BO, fotos) por uma página pública e recebe um **protocolo**.
2. O **pipeline** (Step Functions) processa cada documento — OCR, NER e visão computacional — e o **agente Bedrock** classifica e extrai os campos.
3. Uma etapa de **agregação** aplica as regras de negócio (gates) e **decide**: aprovado automático, pendente de documentação, ou fila de análise humana.

---

## Estrutura do repositório

\\\
frontend/docusmart-web/   App web (Next.js 16 + Tailwind v4)
lambda/                   Código das Lambdas (Python 3.12, integradas com X-Ray)
step-functions/           pipeline.asl.json — definição do AWS Step Functions
docs/                     ARQUITETURA.md · DIAGRAMA.md · SERVICOS-AWS.md · CUSTOS.md
\\\

## IA Responsável / LGPD

- **Auditoria por etapa** de cada documento com registros imutáveis no DynamoDB.
- **Direito ao esquecimento** (Art. 18 LGPD): Endpoint \DELETE /sinistro/{id}\ programado para expurgar PII (Personally Identifiable Information) do S3 e DynamoDB.
- **Human-in-the-loop**: Decisões de alto impacto financeiro não são delegadas à IA sem supervisão humana (Confiabilidade Bedrock configurada com limiares de score).
