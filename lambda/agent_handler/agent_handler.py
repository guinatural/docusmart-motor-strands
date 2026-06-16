# agent_handler.py
# RESPONSÁVEL: Papel 4 — Wanderson
# STATUS: ⏳ PENDENTE — implementar até 19/06
#
# O QUE ESTE MÓDULO PRECISA ENTREGAR:
#   Agente SAC conversacional que responde perguntas sobre sinistros
#   usando os dados gravados no DynamoDB pelo Motor (process_document).
#
# EXEMPLOS DE PERGUNTAS QUE PRECISA RESPONDER (exigidos pelo Case B):
#   "Qual o valor total do orçamento do sinistro 12345?"
#   "Quais documentos estão faltando nesse sinistro?"
#   "Quais operações foram realizadas no documento X hoje?"
#   "Resuma os sinistros de acidentes de trânsito desta semana"
#
# TECNOLOGIAS:
#   - Amazon Bedrock Converse API (MVP) ou AgentCore (completo)
#   - Modelo: Claude 3 Haiku (anthropic.claude-3-haiku-20240307-v1:0)
#   - Tools: consultar_sinistro(id) → DynamoDB
#            buscar_documentos(query) → S3 Vectors (se der tempo)
#
# DADOS DISPONÍVEIS NO DYNAMODB (gerados pelo Motor do Guilherme):
#   Tabela: sinistros-resultados
#   Campos: id, sinistro_id, tipo_documento, campos_extraidos, resumo, confianca
#   Auditoria: id=AUDIT#sinistro_id#ts, etapa, status, ts
#
# MVP MÍNIMO (para passar na banca):
#   1. Bedrock Converse API com system prompt de especialista em sinistros
#   2. Tool get_sinistro(id) que lê o DynamoDB
#   3. Responder as 2 primeiras perguntas do case ao vivo na demo
#
# REFERÊNCIA:
#   Case B — Seção 5.2 (Agente de IA Generativa — Diferencial)
#   É o critério de avaliação mais importante da banca.

import boto3, json, os

def lambda_handler(event, context):
    # TODO: extrair pergunta do body
    # TODO: invocar Bedrock Converse API
    # TODO: tools: consultar_sinistro, buscar_documentos
    # TODO: retornar resposta em linguagem natural
    return {"statusCode": 501, "body": json.dumps({"message": "Not implemented yet - Wanderson"})}
