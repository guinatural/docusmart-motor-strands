# Plano Solo P0 — se o time não entregar até 20/06

> **Use só se:** Jhonatan/Wanderson não entregarem API + SAC.  
> **Não refaça:** motor Strands (já pronto).

---

## Ordem de execução (~6 h total)

| # | Tarefa | Tempo | Por quê |
|---|--------|-------|---------|
| 1 | API Gateway HTTP → Lambda motor | 1 h | Demo sem Postman interno |
| 2 | Lambda GET `/sinistro/{id}` | 1 h | MVP pede consulta |
| 3 | Agente SAC mínimo (Bedrock Converse + DynamoDB) | 2–3 h | Diferencial Case B |
| 4 | 2 PDFs no S3 + teste Textract | 1 h | Qualidade da extração |
| 5 | Gravar vídeo 3 min | 1 h | Deadline 21/06 |

---

## P0.1 — API Gateway na Lambda existente

```bash
# Criar API HTTP
aws apigatewayv2 create-api --name docusmart-grupo5 --protocol-type HTTP \
  --profile hackathon --region us-east-1

# Integração Lambda (ajustar api-id)
aws apigatewayv2 create-integration --api-id <API_ID> \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:us-east-1:152160819260:function:docusmart-process-document \
  --payload-format-version 2.0 --profile hackathon --region us-east-1

# Rota POST /analisar
aws apigatewayv2 create-route --api-id <API_ID> \
  --route-key "POST /analisar" --target integrations/<INTEGRATION_ID> \
  --profile hackathon --region us-east-1

# Tag obrigatória em tudo novo
# Group=Grupo5
```

---

## P0.2 — GET sinistro (Lambda simples)

Implementar `lambda/api_handlers/get_document.py`:

- Input: `id` ou `sinistro_id` via path parameter
- Query DynamoDB `sinistros-resultados` por partition key
- Retornar JSON do sinistro

Deploy como `docusmart-get-sinistro` + rota `GET /sinistro/{id}`.

Stub já existe no repo com TODO — preencher lógica.

---

## P0.3 — Agente SAC mínimo

Implementar `lambda/agent_handler/agent_handler.py`:

1. Receber `{ "pergunta": "...", "sinistro_id": "..." }`
2. Buscar item no DynamoDB
3. Bedrock Converse com contexto do sinistro
4. Retornar resposta em linguagem natural

Não precisa S3 Vectors no P0 — DynamoDB como fonte de fatos basta para demo.

---

## P0.4 — PDFs de teste

Subir em `s3://docusmart-sinistros-152160819260/uploads/`:

- `boletim-ocorrencia.pdf`
- `nota-fiscal.pdf`

Testar com payload em `tests/test_payload.json`.

---

## Demo mínima solo (6 min)

1. POST `/analisar` → JSON sinistro  
2. DynamoDB → AUDIT + resultado  
3. GET `/sinistro/{id}`  
4. POST `/assistente/pergunta` → "Qual o valor do sinistro X?"  
5. Mencionar LGPD + auditoria  

---

## Quando acionar

| Situação | Ação |
|----------|------|
| 19/06 sem API do Jhonatan | Começar P0.1 + P0.2 |
| 20/06 sem SAC do Wanderson | Começar P0.3 |
| 21/06 sem vídeo do Rubens | Você grava P0.5 |

---

## Depois do hackathon (C — lab AWS)

Lab "Redes introvertidas/extrovertidas" — Tarefa 2 Egress VPC (separado do hackathon).
