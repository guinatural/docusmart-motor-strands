"""
Assistente SAC — DocuSmart (Bedrock Converse + RAG sobre dados estruturados).

Em vez de depender da Knowledge Base gerenciada (incompatível com o Retrieve do
Agent), respondemos com base nos dados reais do DynamoDB:
  - se a pergunta cita um protocolo (UUID), carrega aquele sinistro + documentos;
  - senão, carrega um resumo de todos os sinistros.
Mantém histórico por session_id (item CHAT#<session_id>) para conversa multi-turno.

Body: { "message": "...", "session_id": "..." }  →  { "response": "...", "session_id": "..." }
"""
import json
import os
import re
import uuid
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Attr

REGION = os.environ.get("AWS_REGION_NAME", "us-east-1")
TABLE = os.environ.get("DYNAMO_TABLE_NAME", "docusmart-idp-grupo-5-documents")
MODEL_ID = os.environ.get("MODEL_ID", "us.anthropic.claude-haiku-4-5-20251001-v1:0")
KB_ID = os.environ.get("KNOWLEDGE_BASE_ID", "GDHBPK6JNK")
GUARDRAIL_ID = os.environ.get("GUARDRAIL_ID", "8sz2kyufzbjc")
GUARDRAIL_VERSION = os.environ.get("GUARDRAIL_VERSION", "DRAFT")
MAX_HIST = 8

dynamo = boto3.resource("dynamodb", region_name=REGION)
bedrock = boto3.client("bedrock-runtime", region_name=REGION)
bedrock_kb = boto3.client("bedrock-agent-runtime", region_name=REGION)


def _semantica(message: str, n: int = 4) -> str:
    """Busca semântica (RAG) na Knowledge Base S3 Vectors. Tolerante a falha."""
    try:
        r = bedrock_kb.retrieve(
            knowledgeBaseId=KB_ID,
            retrievalQuery={"text": message},
        )
        trechos = [
            res.get("content", {}).get("text", "").strip()
            for res in r.get("retrievalResults", [])[:n]
        ]
        return "\n---\n".join(t for t in trechos if t)
    except Exception:
        return ""  # se a KB falhar, segue só com os dados estruturados

CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type"}
UUID_RE = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", re.I)


def _ctx(table, message: str, last_sid: str | None):
    """Monta o contexto (JSON) do DynamoDB. Reaproveita o último sinistro citado
    na sessão para perguntas de acompanhamento. Retorna (contexto, sinistro_id)."""
    m = UUID_RE.search(message)
    sid = m.group(0) if m else last_sid
    if sid:
        item = table.get_item(Key={"id": sid}).get("Item")
        if item:
            rel = table.scan(FilterExpression=Attr("sinistro_id").eq(sid)).get("Items", [])
            docs = [i for i in rel if i.get("tipo_item") == "DOCUMENTO"]
            return (
                json.dumps({"sinistro": item, "documentos": docs}, ensure_ascii=False, default=str),
                sid,
            )

    sinistros = table.scan(FilterExpression=Attr("tipo_item").eq("SINISTRO")).get("Items", [])
    resumo = []
    for s in sinistros:
        dc = s.get("dados_consolidados") or {}
        resumo.append({
            "protocolo": s.get("id"),
            "status": s.get("status"),
            "segurado": (dc.get("segurado") or {}).get("nome"),
            "tipo_sinistro": (s.get("dados_formulario") or {}).get("tipo_sinistro"),
            "data_sinistro": (s.get("dados_formulario") or {}).get("data_sinistro"),
            "valor_total_orcamentos": s.get("valor_total_orcamentos"),
            "documentos_faltantes": s.get("documentos_faltantes"),
            "decisao": (dc.get("decisao") or {}).get("motivo"),
        })
    return json.dumps(resumo, ensure_ascii=False, default=str), last_sid


def _salvar_hist(table, session_id, mensagens, last_sid):
    item = {
        "id": f"CHAT#{session_id}",
        "tipo_item": "CHAT",
        "mensagens": mensagens[-MAX_HIST:],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if last_sid:
        item["last_sinistro"] = last_sid
    table.put_item(Item=item)


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
        message = (body.get("message") or "").strip()
        session_id = body.get("session_id") or str(uuid.uuid4())
        if not message:
            return _resp(400, {"erro": "Campo 'message' obrigatório"})

        table = dynamo.Table(TABLE)
        sess = table.get_item(Key={"id": f"CHAT#{session_id}"}).get("Item") or {}
        hist = sess.get("mensagens", [])
        contexto, last_sid = _ctx(table, message, sess.get("last_sinistro"))
        trechos = _semantica(message)

        system = [{
            "text": (
                "Você é o assistente do SAC da DocuSmart Seguros. Responda em português, "
                "de forma objetiva e cordial, com base nos dados fornecidos abaixo. "
                "Se a informação não estiver nos dados, diga que não encontrou e peça o "
                "número do protocolo. Não invente valores. "
                "Responda em texto simples e direto, SEM markdown (não use #, *, tabelas "
                "ou emojis). Use frases curtas; listas, se precisar, com hífen.\n\n"
                f"DADOS ESTRUTURADOS (sinistros/documentos):\n{contexto}\n\n"
                f"TRECHOS DE DOCUMENTOS (busca semântica nos arquivos):\n{trechos or '(nenhum)'}"
            )
        }]

        mensagens = [
            {"role": h["role"], "content": [{"text": h["text"]}]} for h in hist
        ]
        mensagens.append({"role": "user", "content": [{"text": message}]})

        resp = bedrock.converse(
            modelId=MODEL_ID,
            system=system,
            messages=mensagens,
            inferenceConfig={"maxTokens": 700, "temperature": 0.2},
            guardrailConfig={
                "guardrailIdentifier": GUARDRAIL_ID,
                "guardrailVersion": GUARDRAIL_VERSION,
            },
        )
        texto = resp["output"]["message"]["content"][0]["text"]

        novo_hist = hist + [
            {"role": "user", "text": message},
            {"role": "assistant", "text": texto},
        ]
        _salvar_hist(table, session_id, novo_hist, last_sid)

        return _resp(200, {"response": texto, "session_id": session_id})

    except Exception as e:
        return _resp(500, {"erro": str(e)})


def _resp(status, body):
    return {
        "statusCode": status,
        "headers": CORS,
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }
