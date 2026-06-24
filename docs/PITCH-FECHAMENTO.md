---
tags: [hack2hire, pitch, fechamento, numeros, estrategia, grupo5]
status: final
criado: 2026-06-24
---

# 🔥 A Frase de Fechamento — Dissecada
## Como usar cada número para vencer a banca do Hack2Hire

---

> *"R$ 154.000 gastos por mês viram R$ 1.375.*
> *60 minutos viram 2 minutos.*
> *14 documentos testados. 14 acertos.*
> **Isso não é uma promessa. Já está funcionando."**

---

## Por que essa frase funciona?

A banca de hackathon é formada por **empresários, executivos e especialistas técnicos AWS**.
Cada perfil tem uma dor diferente — mas todos respondem a **números reais e prova de execução**.

Essa frase foi construída com 4 golpes cirúrgicos. Cada um fecha uma objeção antes que ela seja feita.

---

## 🔴 Golpe 1 — "R$ 154.000 gastos por mês viram R$ 1.375."

### O que o número significa
- **R$ 154.000/mês** é o custo de triagem manual de 4.400 sinistros com analistas a R$ 35/hora
- **R$ 1.375/mês** é o custo total AWS para a mesma volumetria (US$ ~250/mês × câmbio)
- A diferença: **R$ 152.625,00 devolvidos à margem operacional toda mês**

### Por que impacta a banca
- O CFO na banca ouve "R$ 154.000 → R$ 1.375" e calcula: **12 meses = R$ 1,8 milhão de economia**
- O CEO ouve que o custo por apólice processada caiu **112 vezes**
- O investidor ouve que o ROI se paga **em menos de 1 semana**

### O que não dizer
- ❌ Não detalhe o cálculo aqui — a banca faz a conta sozinha. É mais impactante.
- ✅ Deixe o número nu. Ele fala por si.

### Se a banca perguntar de onde vem esse número
> "4.400 sinistros/mês × 1h/sinistro × R$ 35/hora = R$ 154.000.
> Na AWS, o custo por sinistro é US$ 0,05 — Textract, Bedrock, Lambda, DynamoDB.
> Isso é **R$ 0,28 por sinistro** contra **R$ 35,00 no processo manual.**"

---

## 🟡 Golpe 2 — "60 minutos viram 2 minutos."

### O que o número significa
- **60 minutos** é o tempo médio de um analista para abrir, ler, validar e registrar um pacote de sinistro
- **2 minutos** é o tempo do pipeline completo: upload → Textract → Comprehend → Rekognition → Bedrock → DynamoDB → decisão
- Redução de **96,6% no tempo de ciclo** (Claim Cycle Time)

### Por que impacta a banca
- O COO na banca pensa em **SLA e fila**: com 60 min por sinistro, a equipe trava em picos de catástrofe. Com 2 min, o sistema processa **30x mais** sem contratar ninguém.
- O especialista AWS reconhece a arquitetura assíncrona: o cliente não espera — o pipeline roda em background via Step Functions, a resposta chega por SNS/notificação.

### O que não dizer
- ❌ Não diga "quase 2 minutos" — diga **menos de 2 minutos**. Precisão importa.
- ✅ Se quiser reforçar: "O cliente envia às 22h. Às 22h02, o sistema já decidiu."

### Se a banca perguntar como medir
> "O timestamp de criação do sinistro está no DynamoDB com `created_at`.
> O timestamp de conclusão é gravado pelo `agregar-decisao`.
> A diferença é o nosso SLA mensurável — e nossos testes hoje estão abaixo de 2 minutos."

---

## 🟢 Golpe 3 — "14 documentos testados. 14 acertos."

### O que o número significa
- **14 documentos reais** processados hoje durante o hackathon
- **14/14 classificados corretamente** pelo pipeline: CNH, CRLV, Boletim de Ocorrência, Nota Fiscal, fotos de veículo
- Taxa de acerto: **100% nos testes realizados**
- Confiança média extraída pelo Bedrock: **> 93%**

### Por que impacta a banca
- Este é o golpe mais poderoso. A maioria das equipes apresenta **slides com promessas**.
- "14 documentos testados. 14 acertos." prova que saímos do Figma e fomos para produção.
- Para o especialista técnico AWS na banca: isso valida que o prompt do Claude Haiku está calibrado, que o schema JSON está correto e que o pipeline não quebrou em edge cases reais.

### O que não dizer
- ❌ Não diga "aproximadamente 100%" — diga **14 de 14**. Fração é mais crível que porcentagem.
- ✅ Se quiser escalar: "Se quiserem, podemos processar mais 14 agora, ao vivo, na frente da banca."

### Se a banca perguntar o que acontece com o 15º documento
> "Se a confiança cair abaixo de 80%, o sistema não aprova automaticamente.
> Ele encaminha para revisão humana com o motivo registrado na trilha de auditoria.
> O modelo erra com segurança — e sabemos exatamente onde e por quê."

---

## ⚫ Golpe 4 — "Isso não é uma promessa. Já está funcionando."

### O que essa frase faz
- Antecipa e mata a objeção mais comum da banca: *"Parece bom, mas vai funcionar de verdade?"*
- Posiciona a solução não como MVP de hackathon, mas como produto em estágio de produção
- Cria contraste implícito com as outras equipes que apresentam mockups e decks

### Por que impacta a banca
- Executivos tomam decisão por **evidência, não por intenção**
- "Já está funcionando" é a prova de que a equipe não só projetou — **executou**
- Para o investidor: reduz risco percebido. Não é seed stage — é proof of concept validado.

### A psicologia por trás
- As 3 frases anteriores constroem o argumento numérico
- Esta frase fecha com autoridade: não pede a aprovação da banca — **ela declara um fato**
- É o equivalente verbal de colocar o código rodando na tela

### Como entregar em voz
- Pausa de 1 segundo antes de falar essa linha
- Tom mais lento, mais firme, sem entonação de pergunta
- Olhar direto para a banca, não para o slide

---

## 🏆 Por que essa frase vence a banca

A banca de hackathon avalia, conscientemente ou não, duas perguntas:

1. **"Essa solução resolve um problema real?"** → Respondida pelos números (R$ 154k → R$ 1.375)
2. **"Essa equipe é capaz de entregar?"** → Respondida pela prova (14/14, já funcionando)

A maioria das equipes responde apenas a primeira.
Nós respondemos as duas — **com números reais e execução comprovada**.

---

## 📋 Script final para memorizar

```
R$ 154.000 gastos por mês [PAUSA] viram R$ 1.375.
60 minutos [PAUSA] viram 2 minutos.
14 documentos testados. [PAUSA] 14 acertos.
[PAUSA LONGA]
Isso não é uma promessa.
[PAUSA]
Já está funcionando.
```

> 💡 **Dica:** As pausas são tão importantes quanto as palavras.
> Cada número precisa de 1 segundo de silêncio depois para a banca processar.

---
#hack2hire #grupo5 #pitch #fechamento #estrategia
