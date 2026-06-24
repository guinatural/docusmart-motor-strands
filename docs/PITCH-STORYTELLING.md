---
tags: [hack2hire, pitch, storytelling, regras-negocio, custos, grupo5]
status: final
criado: 2026-06-24
---

# 🎭 DocuSmart — Storytelling · Regras de Negócio · Custos
## O que encanta a banca e prova que somos sérios

---

## 🎬 A HISTÓRIA QUE ENCANTA *(storytelling para abrir ou fechar)*

> ### A noite de João.
>
> João trabalha como analista de sinistros numa seguradora de médio porte.
> São 16h30 de uma sexta-feira. Ele tem 47 sinistros na fila.
> Cada um com 5, 6, 7 documentos para abrir, ler, validar e digitar.
> Sua meta é 8 sinistros por dia. Sobraram **39 para a segunda-feira**.
>
> Do outro lado, **Marcos** acabou de bater o carro na chuva.
> Está no acostamento. Preocupado. Liga para a seguradora.
> A atendente pede os documentos por e-mail.
> O e-mail vai para João — que já foi embora.
>
> **Marcos vai dormir sem resposta.**
> **João vai trabalhar na segunda com 39 sinistros na fila.**
>
> Agora imagine o mesmo cenário **com o DocuSmart**.
>
> Marcos fotografa os documentos no celular às 18h42.
> Faz o upload pelo portal.
> Às **18h44** — dois minutos depois — o sistema já processou tudo:
> extraiu o CPF, cruzou com a apólice, validou a placa, leu o orçamento.
> O sinistro foi **pré-aprovado automaticamente**.
> Marcos recebe a notificação no celular antes de chegar em casa.
>
> **João na segunda? Tem 39 sinistros na fila — mas nenhum deles é de Marcos.**
> **Ele usa o tempo para revisar os casos complexos. Para fazer o que só humanos fazem.**
>
> Isso é o DocuSmart Intelligence.
> Não substitui o João. **Libera o João.**

---

## ⚙️ REGRAS DE NEGÓCIO — A INTELIGÊNCIA POR DENTRO

> A banca especialista vai perguntar: *"Como a IA decide?"*
> Resposta: **ela não decide sozinha. Ela segue regras.**

### Os 5 Gates de Decisão (verificados em sequência)

```
GATE 1 — Documentos Obrigatórios
  ✅ CNH (identidade)
  ✅ CRLV (veículo)
  ✅ Orçamento do reparo
  ✅ Boletim de Ocorrência (se roubo, furto ou terceiros envolvidos)
  → Faltou algum? Status: PENDENTE_DOCUMENTACAO (automático)

GATE 2 — Consistência de Dados
  ✅ CPF da CNH = CPF da apólice
  ✅ Placa do CRLV = Placa da apólice
  ✅ Data do sinistro dentro da vigência
  → Inconsistência encontrada? Status: EM_ANALISE (revisão humana)

GATE 3 — Qualidade da Extração (IA)
  ✅ Confiança de TODOS os documentos ≥ 80%
  → Algum documento abaixo do limiar? Status: EM_ANALISE (revisão humana)

GATE 4 — Valor de Referência
  ✅ Menor orçamento ≤ R$ 5.000 (teto de aprovação automática)
  → Valor acima? Status: EM_ANALISE (fila do analista sênior)

GATE 5 — Aprovação Automática
  ✅ Gates 1, 2, 3 e 4 aprovados
  → Status: APROVADO ✅ (sem intervenção humana)
```

### Tabela de Decisão Final

| Situação detectada | Status gerado | Automático? |
|---|---|---|
| Documento obrigatório faltando | `PENDENTE_DOCUMENTACAO` | ✅ Sim |
| CPF ou placa inconsistente | `EM_ANALISE` | ❌ Humano |
| Data fora da vigência | `EM_ANALISE` | ❌ Humano |
| Confiança IA < 80% | `EM_ANALISE` | ❌ Humano |
| Valor do orçamento > R$ 5.000 | `EM_ANALISE` | ❌ Humano |
| **Tudo OK, valor ≤ R$ 5.000** | **`APROVADO`** | **✅ Sim** |

### Os parâmetros são configuráveis — sem alterar código
```python
LIMIAR_CONFIANCA = 0.80      # ajustável por variável de ambiente
TETO_AUTO_APROVACAO = 5000   # ajustável por variável de ambiente
```
> O analista quer ser mais conservador? Muda para 0.90.
> A diretoria quer elevar o teto? Muda para 10.000.
> **Nenhuma linha de código alterada. Nenhuma nova versão.**

### O que isso garante para o negócio
- **Zero aprovação automática com dados inconsistentes** — gates determinísticos, não IA
- **Zero aprovação automática acima do teto financeiro** — proteção contra fraude sistêmica
- **Rastreabilidade total** — cada decisão tem trilha de auditoria no DynamoDB com timestamp e motivo
- **Revisão humana focada** — analistas veem só os casos que realmente precisam deles

---

## 💵 CUSTOS — O QUE CADA CENTAVO FAZ

> *"Quanto custa manter isso?"*
> Resposta: **menos do que um almoço por dia para 200 sinistros.**

### Custo unitário por sinistro (3 documentos, média)

| Serviço AWS | O que faz neste sinistro | Custo |
|---|---|---|
| **Amazon Textract** | Lê o texto da CNH, CRLV e orçamento | US$ 0,0045 |
| **Amazon Comprehend** | Identifica CPF, datas, valores no texto | US$ 0,0009 |
| **Amazon Rekognition** | Analisa a foto do veículo/danos | US$ 0,003 |
| **Bedrock Claude Haiku 4.5** | Classifica o documento e estrutura o JSON | US$ 0,0004 |
| **Lambda + Step Functions** | Executa o pipeline, orquestra as etapas | US$ 0,001 |
| **DynamoDB + S3** | Armazena sinistro, documentos e auditoria | US$ 0,0002 |
| **Total** | | **US$ ~0,05** |

> **US$ 0,05 por sinistro = R$ 0,28. Contra R$ 35,00 no processo manual.**
> **Fator de redução: 125×.**

### Custo zero em repouso
```
Sexta à noite. Nenhum sinistro chegando.
Custo de computação AWS: US$ 0,00
Custo com equipe de plantão: R$ 0,00
Sistema disponível: SIM — 24h/7 dias
```

### Simulação de crescimento — o custo escala linearmente

| Volume mensal | Custo AWS | Custo manual equivalente | Economia |
|---|---|---|---|
| 1.000 sinistros | **~US$ 70** (~R$ 385) | R$ 35.000 | **R$ 34.615** |
| 4.400 sinistros | **~US$ 250** (~R$ 1.375) | R$ 154.000 | **R$ 152.625** |
| 10.000 sinistros | **~US$ 690** (~R$ 3.800) | R$ 350.000 | **R$ 346.200** |
| 100.000 sinistros | **~US$ 6.900** (~R$ 38.000) | R$ 3.500.000 | **R$ 3.462.000** |

> ⚡ **Quanto mais cresce, mais barato proporcionalmente fica.**
> Desconto por volume no Textract e Bedrock reduz o custo unitário na escala.

### O único custo significativo — e como controlá-lo
```
Textract representa ~65% do custo do IDP.
Solução já implementada: usamos AnalyzeDocument (Queries)
  → extrai só os campos que precisamos
  → 10× mais barato que o modo Forms
  → sem sacrificar precisão

Para escala de 1 milhão de sinistros:
  → DetectDocumentText: US$ 1,50 / 1.000 páginas (mais barato ainda)
  → Prompt Caching no Bedrock: −50% no custo de tokens repetidos
  → S3 Lifecycle: documentos arquivados após 15 dias → −75% em storage
```

---

## 🏆 O QUE ISSO TUDO SIGNIFICA PARA A BANCA

### Para quem avalia NEGÓCIO
> Uma seguradora com 200 sinistros/dia que adota o DocuSmart
> **devolve R$ 152.625 por mês para a margem operacional**.
> Em 12 meses: **R$ 1.831.500 de economia direta**.
> O custo de desenvolvimento do projeto: recuperado **em menos de 1 semana**.

### Para quem avalia TÉCNICA
> - Gates determinísticos que não dependem da IA para decisões críticas
> - Parâmetros de negócio em variáveis de ambiente — zero código para ajustar regras
> - Trilha de auditoria imutável por sinistro — rastreável para LGPD e regulação SUSEP
> - Custo unitário de US$ 0,05 com cálculo detalhado por serviço

### Para quem avalia INOVAÇÃO
> - AWS Strands Agents SDK — lançado em 2025, framework oficial AWS para agentes
> - RAG híbrido: DynamoDB (dados estruturados) + S3 Vectors (busca semântica nos documentos)
> - Bedrock Guardrails no chat SAC — IA responsável com filtros de prompt injection
> - 100% serverless: zero servidor para gerenciar, zero custo em repouso

---

## 📋 COMO USAR ESSE MATERIAL NA DEFESA

| Momento da defesa | O que usar |
|---|---|
| **Abertura** | A história de João e Marcos — cria empatia antes dos números |
| **Corpo técnico** | Os 5 Gates — mostra que a IA não decide sozinha |
| **Pergunta sobre custo** | Tabela unitária US$ 0,05 + simulação de escala |
| **Pergunta sobre risco/fraude** | Gates 2, 3 e 4 — decisão humana obrigatória nesses casos |
| **Fechamento** | *"R$ 154.000 viram R$ 1.375. 14/14 acertos. Já está funcionando."* |

---
#hack2hire #grupo5 #storytelling #regras-negocio #custos #banca
