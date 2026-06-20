# Arquitetura — DocuSmart

## Fluxo end-to-end

```
POST /upload (1x por arquivo) ──> presigned URL ──> PUT no S3 (uploads/<uuid>/arquivo)
            │
POST /sinistro { dados_formulario, keys[] }
            │  intake: cria 1 SINISTRO + N DOCUMENTOS (AGUARDANDO) e dispara o SFN
            ▼
Step Functions (docusmart-idp-grupo-5-pipeline)
   ├─ Map por documento ──> processar-sinistro
   │     Textract/Comprehend/Rekognition + Bedrock (Claude Haiku)
   │     grava o DOCUMENTO (tipo, confiança 0–1, campos) + auditoria
   └─ agregar-decisao (Etapa 2)
         lê documentos + apólice, aplica os gates e grava status + dados_consolidados
            ▼
GET /sinistro/{id}  ·  GET /sinistros  ·  PUT (revisão)  ·  DELETE (LGPD)  ·  POST /chat
```

## Modelo de dados (single-table, PK `id`, discriminador `tipo_item`)

| tipo_item   | id                  | Campos principais                                                                                                                |
| ----------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `SINISTRO`  | `<uuid>`            | `status`, `dados_formulario`, `dados_consolidados`, `total_documentos`, `documentos_faltantes`, `revisao_pendente`, `created_at` |
| `DOCUMENTO` | `<uuid>#DOC#DOC-NN` | `sinistro_id`, `documento_id`, `tipo_documento`, `confianca` (0–1), `campos_extraidos`, `status_doc`, `s3_origem`                |
| `AUDIT`     | `AUDIT#<uuid>#<ts>` | `sinistro_id`, `etapa`, `status`, `detalhes`, `ts`                                                                               |
| `APOLICE`   | `APOLICE#<numero>`  | `cpf_titular`, `nome_titular`, `veiculo`, `vigencia`, `valor_segurado`, `cobertura`                                              |
| `CHAT`      | `CHAT#<session_id>` | `mensagens[]`, `last_sinistro` (histórico do SAC)                                                                                |

> O `sinistro_id` (UUID) é o **protocolo** que o cliente recebe e usa no Acompanhar.

## Etapa 2 — gates e decisão (`agregar-decisao`)

Parâmetros (env var): `LIMIAR_CONFIANCA=0.80`, `TETO_AUTO_APROVACAO=5000`.

**Gates verificados:**

1. Documentos obrigatórios: identidade (CNH) + CRLV + orçamento; **+ BO** se roubo/furto ou terceiros.
2. Consistência: CPF (CNH × apólice) e placa (CRLV × apólice).
3. Data do sinistro dentro da vigência da apólice.
4. Valor de referência (**menor** orçamento) ≤ teto.
5. Confiança de todos os documentos ≥ limiar.

**Decisão (status de negócio):**

| Situação                            | Status                  | Automática?            |
| ----------------------------------- | ----------------------- | ---------------------- |
| Documento obrigatório faltando      | `PENDENTE_DOCUMENTACAO` | sim                    |
| Inconsistência (CPF/placa/vigência) | `EM_ANALISE`            | não (análise especial) |
| Confiança abaixo do limiar          | `EM_ANALISE`            | não (revisão humana)   |
| Valor acima do teto                 | `EM_ANALISE`            | não (fila do analista) |
| Tudo OK e valor ≤ teto              | `APROVADO`              | sim                    |

O analista revê os `EM_ANALISE`/`PENDENTE` e decide via `PUT` → `APROVADO`/`NEGADO`.

Ao final da decisão, `agregar-decisao` **publica no SNS**
(`docusmart-idp-grupo-5-notificacoes`) com sinistro, segurado, status, contato e
motivo — base para notificar o cliente/equipe (ex.: e-mail inscrito no tópico).

## Contratos da API

```
POST /upload        { filename, content_type } → { upload_url, key }
PUT  <upload_url>    (S3 presigned, Content-Type do arquivo)
POST /sinistro      { dados_formulario:{numero_apolice,tipo_sinistro,data_sinistro,
                      local,terceiros_envolvidos,contato}, keys:[...] }
                    → { sinistro_id, status:"EM_PROCESSAMENTO" }
GET  /sinistro/{id} → { sinistro, documentos[], historico_operacoes[] }
                      (cada documento inclui url_visualizacao: presigned GET, 5 min)
GET  /sinistros     → { sinistros:[ ...SINISTRO... ] }
PUT  /sinistro/{id} { status, observacao? } → { sinistro_id, status }
DELETE /sinistro/{id} → { deleted:true, itens_removidos }
POST /chat          { message, session_id } → { response, session_id }
```

## Agente SAC (RAG híbrido)

`chat` usa **Bedrock Converse (Claude Haiku)** combinando duas fontes:

- **DynamoDB** (estruturado) → perguntas factuais (status, valor, documentos);
- **S3 Vectors** via Knowledge Base gerenciada (`Retrieve`) → busca semântica no
  texto dos documentos (ex.: cláusulas da apólice).

Mantém histórico por `session_id` e lembra o último sinistro citado (follow-ups).
As chamadas ao Converse passam por **Bedrock Guardrails**
(`docusmart-idp-grupo-5-sac`), que filtra abuso, injeção de prompt e vazamento de
dados/instruções.

> Nota: usamos **Bedrock Converse** (não o Bedrock Agent) — o Agent gerenciado é
> incompatível com o `Retrieve` da Knowledge Base S3 Vectors usada aqui.

## Decisões de design

- **1 sinistro = N documentos** (não 1 registro por arquivo): o pacote é uma
  unidade; o protocolo do cliente recebe o resultado consolidado.
- **Agente extrai, código persiste**: o LLM só devolve JSON; a Lambda grava no
  DynamoDB de forma determinística (sem depender do modelo chamar tools).
- **Confiança sempre float 0–1**, normalizada no processador.
- **Parâmetros de negócio em env var** (limiar, teto) — nada hardcoded.
