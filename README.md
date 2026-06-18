# 🏢 DocuSmart Intelligence — Hack2Hire 2026

**Escola da Nuvem + AWS | Case B — IDP com AWS AI Services + Agente GenAI**

---

## 👥 Equipe — Squad DocuSmart (Grupo 5)

| # | Papel | 👤 Responsável | Stack | Entregáveis |
|---|-------|---------------|-------|------------|
| 1 | **Arquiteto IA / Backend (Motor de Extração)** | **Guilherme Barreto Gomes** | Python · Strands SDK · Textract · Bedrock | Lambda process_document + classify_document + JSON final ✅ |
| 2 | **Cloud & Infra (O Encanador)** | **Jeannette Sofia Quidel Espinoza / Jhonatan Henrique Alves dos Santos** | IAM · S3 · DynamoDB | Buckets S3 · DynamoDB · IAM Roles · variáveis de ambiente | ✅
| 3 | **Orquestração & API (O Fio Condutor)** | **Jhonatan Henrique Alves dos Santos** | Step Functions · API Gateway | Máquina de estados + rotas REST POST/GET |
| 4 | **Dev Agente RAG (O Cérebro do Chat)** | **Wanderson Carlos Ramos de Souza Sá Filho** | Bedrock AgentCore · S3 Vectors | AgentCore + S3 Vectors + Prompt SAC |
| 5 | **Dev Frontend (O Showman da Tela)** | **Victor Griggi Moreira Regis da Silva** | React · Vue · Streamlit | Tela upload + Dashboard + Chat SAC |
| 6 | **QA & Dados (O Engenheiro do Caos)** | **Ana Paula Lemos de Vasconcelos** | Postman · Testes E2E · Fake Data | PDFs falsos + popular banco + validar rotas |
| 7 | **Product Owner / Pitch (O Mestre da Narrativa)** | **Guilherme + time (colaborativo)** | PowerPoint · Storytelling | README + Diagrama + Pitch 2 minutos |

------|-------|-----------------|
| **Guilherme Barreto Gomes** | ⭐ Arquiteto IA / Backend | Motor Strands — Lambda + 6 Tools + Claude 3 Haiku |
| **Jeannette Sofia Quidel Espinoza** | Cloud & Infra | S3, DynamoDB, IAM Roles |
| **Arildo de Almeida** | Cloud & Infra | S3, DynamoDB, IAM Roles |
| **Jhonatan Henrique Alves dos Santos** | Orquestração & API | Step Functions + API Gateway |
| **Wanderson Carlos Ramos de Souza Sá Filho** | Dev Agente RAG | Bedrock AgentCore + S3 Vectors |
| **Victor Griggi Moreira Regis da Silva** | Dev Frontend | Interface web — upload + chat |
| **Ana Paula Lemos de Vasconcelos** | QA & Dados | PDFs de teste + validação E2E |
| **Rubens Guilherme Lopes da Fonseca** | Product Owner / Pitch | Slides + vídeo + documentação |

---

## 1. Entendendo a Necessidade do Cliente

### Cliente
**DocuSmart Seguros** — seguradora de médio porte que processa centenas de sinistros por dia.

**Persona principal:** Analista de sinistros que recebe pacotes de documentos em múltiplos formatos (PDF, imagens, scans) e precisa classificar, extrair dados e registrar manualmente cada documento nos sistemas internos.

### Problema

| Dor | Impacto Mensurável |
|-----|-------------------|
| Processamento manual lento | ~60 minutos por pacote de sinistro |
| Erros de digitação | Retrabalho e atrasos no pagamento |
| SAC sem busca inteligente | Atendentes buscam manualmente nos arquivos |
| Não escala em picos | Catástrofes criam gargalo humano crítico |
| Dados presos em PDF | Zero analytics ou insights operacionais |

### Solução
**DocuSmart Intelligence** — pipeline serverless de Processamento Inteligente de Documentos (IDP) integrado a um Agente de IA Generativa para consultas em linguagem natural.

### Benefícios
- Analista processa 1 pacote enquanto o sistema processa 30 — mesmo headcount
- SAC responde perguntas sobre sinistros em menos de 15 segundos
- Trilha de auditoria completa por etapa em cada documento processado
- Suporte a PDFs e imagens de veículos no mesmo pipeline

### Métricas de Sucesso

| KPI | Baseline | Meta |
|-----|----------|------|
| Tempo de processamento por documento | ~15 min | < 2 min |
| Tempo de triagem por pacote | ~60 min | < 10 min |
| Tempo de resposta SAC | Minutos (busca manual) | < 15 segundos |
| Custo por sinistro processado | Alto (RH dedicado) | < US$ 0,01 |
| Cobertura de auditoria | 0% | 100% das etapas registradas |

---

## 2. Arquitetura da Solução

```
+--------------------------------------------------------------------------+
|  SUPERFICIES - Frontend (React / Streamlit)  [Victor]                   |
|  Upload cliente . Painel analista . Chat SAC                            |
+----------------------------+---------------------------------------------+
                             |
                    +--------v---------+
                    |   API Gateway    |  [Jhonatan]
                    | + Lambda intake  |
                    +--------+---------+
                             |
                    +--------v--------------------------+
                    |   Step Functions  [Jhonatan]      |
                    |   Orquestra o pipeline IDP        |
                    +--------+--------------------------+
                             |
+========================== MOTOR STRANDS ==================================+
|  [Guilherme Barreto Gomes] - Lambda Python 3.12                         |
|  Strands Agent . Claude 3 Haiku (Bedrock)                               |
|                                                                          |
|  PDF/doc  --> Tool 1: Textract (OCR)                                    |
|           --> Tool 2: Comprehend (NER pt-BR)                            |
|  Imagem   --> Tool 3: Rekognition (labels + danos)                      |
|           --> Tool 4: Bedrock (sintese JSON)                            |
|           --> Tool 6: DynamoDB (auditoria por etapa)                    |
|           --> Tool 5: DynamoDB (resultado final)                        |
+==========================================================================+
                             |
          +------------------+------------------+
          |                  |                  |
    Amazon S3           DynamoDB          S3 Vectors
    (arquivos)      (fatos+auditoria)  (embeddings RAG)
  [Jeannette/Arildo]                    [Wanderson]
                             |
                    +--------v-----------+
                    |    Agente SAC      |  [Wanderson]
                    |  Strands SDK       |
                    |  Bedrock AgentCore |
                    +--------------------+
```

### Serviços AWS Utilizados

| Servico | Categoria | Funcao |
|---------|-----------|--------|
| Amazon Bedrock (Claude 3 Haiku) | **GenAI** | Sintese, classificacao, LLM do Agente SAC |
| Amazon Bedrock AgentCore | **GenAI Nativo** | Agente conversacional gerenciado |
| Amazon S3 Vectors | **GenAI Nativo** | Armazenamento vetorial para RAG |
| Amazon Textract | Managed AI | OCR especializado em documentos |
| Amazon Comprehend | Managed AI | NER em portugues |
| Amazon Rekognition | Managed AI | Analise visual de imagens |
| AWS Lambda | Serverless | Compute do motor e handlers |
| AWS Step Functions | Managed | Orquestracao visual do pipeline |
| Amazon DynamoDB | Serverless | Resultados + auditoria por etapa |
| Amazon S3 | Managed | Armazenamento de documentos |
| Amazon API Gateway | Managed | APIs REST |
| Amazon CloudWatch | Managed | Logs e observabilidade |

### IA Responsavel
- **Transparencia:** auditoria completa de cada etapa no DynamoDB
- **Privacidade (LGPD):** texto bruto nunca persistido; DELETE API remove dados do S3 e DynamoDB (Art. 18 LGPD)
- **Confianca:** campo `confianca` em cada resultado; documentos com confianca < 0.8 sinalizados para revisao humana
- **Seguranca:** IAM com least privilege por servico; sem credenciais hardcoded

### Well-Architected
- **Excelencia Operacional:** CloudWatch logs em todas as Lambdas; Step Functions com historico visual
- **Seguranca:** IAM scoped por recurso; S3 com acesso publico bloqueado
- **Confiabilidade:** Lambda serverless escala automaticamente
- **Eficiencia:** Bedrock chamado uma unica vez por documento com payload minimo
- **Otimizacao de Custos:** pay-per-use em todos os servicos; < US$ 0,01 por documento

---

## 3. Motor de Analise — Detalhe Tecnico

```
POST /analisar-sinistro
Body: { "bucket": "docusmart-sinistros", "key": "uploads/doc.pdf" }

Lambda (Strands Agent - Claude 3 Haiku)
  |- Tool 1: Textract   -> extrai texto do documento
  |- Tool 2: Comprehend -> detecta entidades em pt-BR
  |- Tool 3: Rekognition-> analisa imagens de veiculos
  |- Tool 6: DynamoDB   -> registra auditoria por etapa
  +- Tool 5: DynamoDB   -> salva resultado final

HTTP 200 + JSON estruturado
```

**Resposta:**
```json
{
  "id": "7f3a91bc-...",
  "sinistro_id": "uuid",
  "tipo_documento": "Boletim de Ocorrencia",
  "confianca": 0.94,
  "resumo": "Acidente na Av. Paulista em 10/06/2025. Sem vitimas registradas.",
  "campos_extraidos": {
    "data": "10/06/2025",
    "local": "Av. Paulista, 1000 - SP",
    "valor_prejuizo": "R$ 4.500,00",
    "envolvidos": ["Joao Silva", "Maria Souza"]
  },
  "processado_em": "2026-06-17T14:23:00Z"
}
```

---

## 4. Configuracao da Lambda (Motor)

| Parametro | Valor |
|-----------|-------|
| Runtime | Python 3.12 |
| Handler | `lambda_function.lambda_handler` |
| Timeout | 60s |
| Memory | 512 MB |
| Layer | `arn:aws:lambda:us-east-1:856699698935:layer:strands-agents-py3_12-x86_64:2` |

**Variaveis de ambiente:**
```
AWS_REGION_NAME=us-east-1
DYNAMO_TABLE_NAME=sinistros-resultados
DOCUMENTS_BUCKET=docusmart-sinistros
```

**IAM (Execution Role):**
```
AmazonTextractFullAccess . AmazonComprehendReadOnly
AmazonRekognitionReadOnlyAccess . AmazonBedrockFullAccess
AmazonDynamoDBFullAccess . AmazonS3ReadOnlyAccess
```

---

## 5. Estimativa de Custo

| Servico | Custo por documento | 1.000 docs/mes |
|---------|--------------------|--------------------|
| Textract | US$ 0,0015/pag | US$ 1,50 |
| Comprehend | US$ 0,0003 | US$ 0,30 |
| Rekognition | US$ 0,001/img | US$ 1,00 |
| Bedrock (Claude Haiku) | US$ 0,00025 | US$ 0,25 |
| Lambda + DynamoDB | ~US$ 0,001 | US$ 1,00 |
| **Total estimado** | **~US$ 0,005/doc** | **~US$ 4,05/mes** |

> ROI: uma hora de trabalho manual de analista (~R$ 25) substitui 5.000 documentos processados automaticamente (~US$ 25). Payback imediato.

---

## 6. Evolucoes Futuras

| Evolucao | Impacto |
|----------|---------|
| Amazon A2I (Augmented AI) | Revisao humana automatica para confianca < 0.8 |
| Amazon Bedrock Guardrails | Protecao de PII nas respostas do Agente SAC |
| Multi-tenancy | Isolar dados por seguradora (LGPD multi-cliente) |
| Amazon QuickSight | Dashboard executivo com metricas de sinistros |
| Notificacoes SNS/SES | Alertar analista quando pacote estiver processado |

---

## 7. Estrutura de Pastas

| Pasta | Responsavel | Status |
|-------|-------------|--------|
| `lambda/process_document/` | Guilherme Barreto Gomes | Implementado |
| `lambda/api_handlers/` | Jhonatan Henrique Alves dos Santos | Pendente |
| `lambda/agent_handler/` | Wanderson Carlos R. de Souza Sa Filho | Pendente |
| `step-functions/` | Jhonatan Henrique Alves dos Santos | Pendente |
| `infrastructure/` | Jeannette Sofia Q. Espinoza + Jhonatan Henrique Alves dos Santos | Implementado |
| `frontend/` | Victor Griggi M. R. da Silva | Pendente |
| `samples/documents/` | Ana Paula L. de Vasconcelos | Pendente |
| `docs/` | Rubens Guilherme L. da Fonseca | Pendente |

> Cada pasta tem um arquivo `OWNER.txt` com instrucoes detalhadas.

---

*Hack2Hire 2026 — Escola da Nuvem + AWS*
*Grupo 5 — DocuSmart Intelligence*

