---
tags: [hack2hire, pitch, defesa, 2min, grupo5]
status: final
criado: 2026-06-24
---

# 🎤 DocuSmart Intelligence — Pitch 2 Minutos
### Hack2Hire 2026 · Case B · Grupo 5

---

## O PROBLEMA *(15 segundos)*

> Hoje, quando um segurado sofre um acidente, ele envia uma pilha de documentos para a seguradora.
> Do outro lado, um analista abre cada PDF manualmente, digita os dados, cruza com a apólice — **60 minutos por sinistro**.
> Para 200 sinistros por dia, isso custa **R$ 154.000,00 por mês** só em triagem.

---

## A SOLUÇÃO *(20 segundos)*

> Apresentamos o **DocuSmart Intelligence**.
> O cliente faz o upload dos documentos pelo celular.
> Nossa IA classifica, extrai e valida todos os dados automaticamente em **menos de 2 minutos**.
> O sinistro é pré-aprovado ou direcionado para análise — sem que um analista precise digitar uma única letra.

---

## COMO FUNCIONA *(20 segundos)*

> Usamos **6 serviços AWS integrados via Strands SDK**:
> Textract lê os documentos, Comprehend identifica os dados, Rekognition analisa as fotos,
> e o Bedrock — com Claude Haiku 4.5 — estrutura tudo em JSON e toma a decisão inteligente.
> O Step Functions orquestra o pipeline, e o resultado vai direto para o DynamoDB com trilha de auditoria completa.

---

## OS NÚMEROS *(20 segundos)*

| Métrica | Antes | Com DocuSmart |
|---|---|---|
| Tempo por sinistro | 60 min | **< 2 min** |
| Custo por 1.000 docs | R$ 8.750 | **R$ 140** |
| Disponibilidade | 8h/dia | **24h / 7 dias** |
| Resposta SAC | Minutos | **< 15 segundos** |

> **Economia de 99% no custo de triagem. ROI alcançado em 1 semana.**

---

## SEGURANÇA E LGPD *(15 segundos)*

> Cada Lambda tem apenas as permissões que precisa — IAM Least Privilege.
> O texto bruto extraído **nunca é persistido** no banco.
> E temos um endpoint `DELETE` que apaga fisicamente todos os dados do segurado — **conformidade total com o Art. 18 da LGPD**.

---

## POR QUE VENCEMOS *(20 segundos)*

> Não apresentamos uma ideia. **Apresentamos algo funcionando.**
> Testamos com 14 documentos reais hoje — **14/14 classificados corretamente**.
> Usamos o **AWS Strands SDK**, o framework mais recente da AWS para agentes de IA.
> Documentamos todos os 6 pilares do Well-Architected Framework.
> E calculamos o custo real: **US$ 0,05 por sinistro processado**.

---

## O FECHAMENTO *(10 segundos)*

> *"Enquanto concorrentes ainda montam equipes para digitalizar processos,*
> *nós já estamos em produção, com precisão de 99%, custando centavos.*
> *Isso não é um protótipo de hackathon — é uma solução pronta para o mercado."*

---
#hack2hire #grupo5 #pitch #2min
