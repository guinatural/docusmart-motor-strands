# 🎤 Roteiros de Pitch — DocuSmart Intelligence

## PITCH DE 2 MINUTOS — Final dia 25/06
*(para empresas contratantes)*

**[0:00] O PROBLEMA**
"No Brasil, uma seguradora de médio porte processa centenas de sinistros por dia.
Cada sinistro chega como um pacote de documentos. Hoje, um analista leva
60 minutos para ler, classificar e digitar tudo isso. Manualmente. Com risco de erro."

**[0:25] A SOLUÇÃO**
"Construímos o DocuSmart Intelligence — um pipeline de IA que recebe qualquer
documento, entende o que é, extrai os dados relevantes e entrega um JSON estruturado
em menos de 2 minutos. Com trilha de auditoria completa."

**[0:45] A TECNOLOGIA**
"Seis serviços de IA da AWS. Textract lê o documento. Comprehend identifica nomes,
datas e valores em português. Rekognition analisa fotos de veículos. Bedrock com
Claude Haiku sintetiza tudo. Serverless, escala automaticamente, menos de R$0,05
por documento."

**[1:10] IMPACTO**
"Um analista processa 1 pacote. Nosso sistema processa 30 no mesmo tempo.
Sem erro de digitação. Com cada etapa registrada — obrigatório pela LGPD."

**[1:30] AGENTE SAC**
"E um agente de IA que responde em linguagem natural. O atendente pergunta
qual o valor do sinistro e recebe a resposta em menos de 15 segundos."

**[1:50] FECHAMENTO**
"DocuSmart Intelligence. De 60 minutos para 2 minutos. Feito com AWS,
rodando hoje, pronto para escalar. Obrigado."

---

## PITCH DE 6 MINUTOS — Banca técnica dias 22-23/06

**[0:00-0:45] PROBLEMA DE NEGÓCIO**
Processo manual: 60 min/pacote, erros de digitação, gargalo em catástrofes,
dados presos em PDF. SAC com busca manual nos arquivos.

**[0:45-1:30] SOLUÇÃO**
Pipeline serverless IDP + Agente GenAI.
60 minutos → 2 minutos. Busca manual → resposta em 15 segundos.

**[1:30-3:00] ARQUITETURA**
API Gateway → Step Functions → Lambda Motor Strands (Claude Haiku 4.5)
Tools: Textract + Comprehend + Rekognition + Bedrock + DynamoDB (resultado+auditoria)
Agente SAC: Bedrock AgentCore + S3 Vectors (RAG)

**[3:00-4:00] DEMO AO VIVO**
POST com boletim → HTTP 200 → JSON → DynamoDB com 4 registros AUDIT#

**[4:00-4:45] MÉTRICAS**
60 min → 2 min | R$0,05/doc | ROI imediato | 100% auditado | LGPD compliant

**[4:45-5:30] IA RESPONSÁVEL + WELL-ARCHITECTED**
IAM least privilege | LGPD Art.18 (DELETE API) | Auditoria por etapa |
Bedrock chamado 1x por documento

**[5:30-6:00] FECHAMENTO**
Motor rodando na AWS hoje. Próximos passos: A2I, Guardrails, QuickSight.
"Do documento ao dado, do dado à resposta."
