# Roteiro Demo — Reunião 19/06 (3–6 min)

**Objetivo:** provar que o Papel 1 está fechado e o time só precisa plugar em volta.

---

## Abertura (30 s)

> "Case B continua sendo o produto. Eu entreguei o motor de análise — a Lambda que recebe um documento no S3 e devolve JSON estruturado com auditoria no DynamoDB. O restante do pipeline conecta nela."

---

## Demo ao vivo (2 min)

1. **Mostrar** `lambda/process_document/` no GitHub  
2. **Invocar** a Lambda (Postman ou AWS Console Test) com:
   ```json
   { "bucket": "docusmart-sinistros-152160819260", "key": "uploads/boletim-teste.txt" }
   ```
3. **Mostrar** resposta JSON: `tipo_documento`, `campos_extraidos`, `sinistro_id`
4. **Abrir** DynamoDB `sinistros-resultados` → itens `AUDIT#...` + resultado final

---

## Handoff para o time (1 min)

| Pessoa | O que plugar |
|--------|--------------|
| Jhonatan | Step Functions → ARN da Lambda; API POST/GET |
| Wanderson | Agente SAC lê DynamoDB pelo `sinistro_id` |
| Victor | Upload → S3 → chama API |
| Ana Paula | PDFs em `samples/documents/` + Postman |
| Rubens | Diagrama: motor no centro do Case B |

> "Instruções de cada um estão no OWNER.txt da pasta dele no repo."

---

## Frase de ouro (feche com isso)

> "Não mudei o case — entreguei a peça que todo o pipeline precisa. Quem integra Step Functions ou API, o contrato JSON e o ARN estão em `docs/ENTREGA-PAPEL1-GUILHERME.md`."

---

## Se perguntarem "e o resto?"

> "Motor ✅. API, SAC e front estão no OWNER.txt de cada responsável. Se algo não sair até 20/06, tenho plano solo documentado em `docs/PLANO-SOLO-P0.md` — mas a divisão oficial continua valendo."

---

## Checklist antes da reunião

- [ ] Lambda responde HTTP 200 (testar 1x)
- [ ] DynamoDB com registros de auditoria visíveis
- [ ] Repo GitHub acessível ao time
- [ ] Mensagem do checklist Discord enviada (ver `22 - Checklist Discord por Pessoa.md` no Obsidian)
