# Backend — Lambdas (DocuSmart Grupo 5)

Código das funções Lambda (Python 3.12). Cada pasta = uma função implantada.
Região `us-east-1`, conta `152160819260`, tabela `docusmart-idp-grupo-5-documents`.

| Pasta                 | Função AWS                                 | Trigger                     | O que faz                                                  |
| --------------------- | ------------------------------------------ | --------------------------- | ---------------------------------------------------------- |
| `intake/`             | `docusmart-idp-grupo-5-intake`             | API `POST /sinistro`        | cria 1 SINISTRO + N DOCUMENTOS e dispara o Step Functions  |
| `processar-sinistro/` | `docusmart-idp-grupo-5-processar-sinistro` | Step Functions (Map)        | OCR/NER/visão + Bedrock; grava o DOCUMENTO e a auditoria   |
| `agregar-decisao/`    | `docusmart-idp-grupo-5-agregar-decisao`    | Step Functions              | Etapa 2: gates + decisão + `dados_consolidados`            |
| `get-sinistro/`       | `docusmart-idp-grupo-5-get-sinistro`       | API `GET /sinistro/{id}`    | sinistro + documentos[] + auditoria                        |
| `list-sinistros/`     | `docusmart-idp-grupo-5-list-sinistros`     | API `GET /sinistros`        | 1 linha por sinistro                                       |
| `put-sinistro/`       | `docusmart-idp-grupo-5-put-sinistro`       | API `PUT /sinistro/{id}`    | decisão manual do analista (aprovar/negar)                 |
| `delete-sinistro/`    | `docusmart-idp-grupo-5-delete-sinistro`    | API `DELETE /sinistro/{id}` | LGPD: remove dados + arquivos do S3                        |
| `chat/`               | `docusmart-idp-grupo-5-chat`               | API `POST /chat`            | agente SAC: Bedrock Converse + RAG (DynamoDB + S3 Vectors) |
| `upload-presigned/`   | `docusmart-idp-grupo-5-upload-presigned`   | API `POST /upload`          | gera a presigned URL para upload no S3                     |
| `indexar-sinistro/`   | `docusmart-idp-grupo-5-indexar-sinistro`   | (avulso)                    | ingestão de texto no índice S3 Vectors (RAG)              |
| `consultar-status/`   | `docusmart-idp-consultar-status-grupo-5`   | (legado)                    | action group do Bedrock Agent — não usado pelo chat atual  |

Handler: `lambda_function.lambda_handler` em todas, **exceto** `processar-sinistro`
e `indexar-sinistro`, que usam `handler.lambda_handler`.

> **Notas**
> - `consultar-status` é **legado** da abordagem com Bedrock Agent (formato de
>   action group). O chat atual (`chat/`) usa Converse + Retrieve direto — não
>   depende dele. Mantido só como referência.
> - `indexar-sinistro` grava num índice **S3 Vectors** próprio
>   (`docusmart-idp-grupo-5-vectors` / `sinistros-index`), separado da Knowledge
>   Base gerenciada que o chat consulta. Não está plugado no pipeline atual.

## Variáveis de ambiente

- Todas: `DYNAMO_TABLE_NAME=docusmart-idp-grupo-5-documents`, `AWS_REGION_NAME=us-east-1`
- `intake`: `SFN_ARN`, `BUCKET_NAME`
- `processar-sinistro` / `agregar-decisao`: `LIMIAR_CONFIANCA=0.80`, `TETO_AUTO_APROVACAO=5000`, `MODEL_ID`
- `chat`: `MODEL_ID`, `KNOWLEDGE_BASE_ID=GDHBPK6JNK`
- `upload-presigned`: `BUCKET_NAME`
- `indexar-sinistro`: `VECTOR_BUCKET_NAME`, `VECTOR_INDEX_NAME`

## Deploy (funções de código puro — boto3)

`intake`, `agregar-decisao`, `get/list/put/delete-sinistro`, `chat` não têm
dependências externas (só boto3, já no runtime):

```bash
cd lambda/<pasta>
zip -r f.zip lambda_function.py
aws lambda update-function-code \
  --function-name <nome-da-funcao> \
  --zip-file fileb://f.zip --region us-east-1 --profile hackathon
```

> `processar-sinistro` usa o **Strands SDK** (empacotado com dependências). Para
> atualizar só o handler, substitua `handler.py` dentro do zip de deploy
> existente e faça `update-function-code`.

## Step Functions

Definição em [`../step-functions/pipeline.asl.json`](../step-functions/pipeline.asl.json):
`Map` por documento (chama `processar-sinistro`) → `agregar-decisao`.

## Seed / limpeza

```bash
AWS_PROFILE=hackathon python3 ../scripts/seed_clean.py
```

Limpa a tabela + o prefixo `uploads/` do S3 e popula 6 apólices (gabarito).
