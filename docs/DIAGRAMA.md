# Diagrama de arquitetura — DocuSmart Intelligence

Diagrama em Mermaid (renderiza no GitHub e em editores Markdown). Reflete o que
está de fato implementado: dois atores, Step Functions orquestrando a extração +
a decisão (Etapa 2), notificação por SNS, e o agente SAC com Guardrails.

```mermaid
flowchart LR
  cliente([Cliente])
  analista([Analista])

  subgraph aws["AWS Account · us-east-1"]
    amplify["Amplify<br/>Front-end Next.js"]
    apigw["API Gateway REST<br/>/upload /sinistro<br/>/sinistros /chat"]

    up["Lambda upload-presigned"]
    intake["Lambda intake<br/>cria 1 sinistro + N documentos"]
    s3[("S3<br/>uploads/")]

    subgraph sfn["Step Functions — pipeline"]
      direction TB
      subgraph proc["Map por documento · processar-sinistro<br/>MOTOR STRANDS"]
        direction TB
        textract["Textract — OCR"]
        comprehend["Comprehend — NER"]
        rekognition["Rekognition — visão/danos"]
        bedrockx["Bedrock Claude Haiku 4.5<br/>síntese JSON"]
      end
      agg["agregar-decisao · Etapa 2<br/>gates: docs, CPF/placa,<br/>vigência, teto R$5k, confiança<br/>→ DECISÃO"]
    end

    ddb[("DynamoDB single-table<br/>sinistros · documentos<br/>auditoria · apólices")]
    sns["SNS<br/>notificação da decisão"]
    idx["Lambda indexar-sinistro"]

    rev["Lambdas get / list / put / delete<br/>consulta + revisão + LGPD"]

    subgraph sac["Agente SAC — RAG híbrido"]
      direction TB
      converse["Bedrock Converse<br/>Claude Haiku 4.5"]
      guard["Bedrock Guardrails"]
      vectors[("S3 Vectors · Knowledge Base<br/>busca semântica")]
    end

    cw["CloudWatch<br/>logs · métricas · alarmes"]
  end

  cliente -->|envia documentos| amplify
  analista -->|painel · aprova/nega| amplify
  amplify --> apigw

  apigw --> up --> s3
  apigw --> intake --> ddb
  intake -->|dispara| sfn
  s3 -. lê arquivos .-> proc
  proc --> agg
  agg --> ddb
  agg --> sns
  sns -. e-mail .-> analista

  apigw --> rev --> ddb
  ddb --> idx --> vectors

  apigw -->|/chat| converse
  converse --- guard
  converse -->|fatos| ddb
  converse -->|semântica| vectors
  converse -->|resposta| apigw
  apigw -.-> amplify

  sfn -.-> cw
  apigw -.-> cw
```

## Legenda do fluxo

1. **Cliente** envia o pacote pela página pública (Amplify) → `upload-presigned` (URL
   assinada) → `PUT` no **S3** → `intake` cria **1 sinistro + N documentos** e dispara o
   **Step Functions**.
2. **Step Functions**: `Map` por documento → **processar-sinistro** (Motor Strands:
   Textract, Comprehend, Rekognition + Bedrock Haiku 4.5) → **agregar-decisao** (Etapa 2:
   gates + decisão).
3. A decisão grava no **DynamoDB** e **publica no SNS** (e-mail ao cliente/equipe).
4. **Analista** acompanha no painel e revisa via `put`/`delete` (LGPD); `get-sinistro`
   ainda devolve uma URL presigned para **ver o documento original**.
5. **Agente SAC**: `/chat` → **Bedrock Converse** com **Guardrails**, combinando **fatos do
   DynamoDB** + **busca semântica no S3 Vectors** (RAG híbrido; indexação via
   `indexar-sinistro`).
6. **CloudWatch** observa tudo (logs, métricas, alarmes) — ver `scripts/cloudwatch_dashboard.py`.
