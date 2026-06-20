# Roteiro de testes — DocuSmart (sistema completo)

App: URL do Amplify (ou `localhost:3000` com `npm run dev`).
Backend: real (AWS) — `https://8ntra04xyh.execute-api.us-east-1.amazonaws.com/prod`.

> Deixe o DevTools aberto (**Network** + **Console**). Para cada falha: passo,
> erro do Console e a chamada da Network (status + resposta).

---

## 0. Pré-requisitos

- [ ] Fork `vctorgriggi` sincronizado com o último commit do front + Amplify "Deployed".
- [ ] Hard refresh (`Cmd+Shift+R`) ao abrir.
- Base já está limpa: **0 sinistros, 6 apólices** semeadas.

**Apólice e arquivos da Mariana (caso colisão):**

| Campo             | Valor                                                |
| ----------------- | ---------------------------------------------------- |
| Número da apólice | `AP-2026-MFL-00123`                                  |
| Tipo              | Colisão · Data `10/03/2026` · Local Cuiabá-MT        |
| E-mail            | `mariana.fulana.lima@email.com` · Terceiros: **não** |
| Arquivos          | CNH, CRLV, orçamento (R$ 4.200), foto do veículo     |

---

## 1. Smoke test

- [ ] `/` abre (logo + cores azuis).
- [ ] `/painel` carrega sem erro (lista pode estar vazia no começo).
- [ ] `/assistente` abre com a saudação.

---

## 2. Upload do cliente — `/` (agora **1 protocolo por pacote**)

- [ ] Preencher com os dados da seção 0 e anexar os 4 arquivos.
- [ ] Enviar **sem arquivo** → bloqueia com aviso.
- [ ] Enviar → "Enviando documentos…".
- [ ] **Network:** `upload`+`PUT` por arquivo, depois **1** `POST /sinistro` (200).
- [ ] Tela **"Pacote recebido!"** com **UM** protocolo (UUID) e status "Em processamento".
- [ ] **Anote o protocolo:** `____________________`

> ✅ O ponto-chave da correção: 4 arquivos = **1 protocolo só** (não mais 4).

---

## 3. Acompanhar (polling) — botão "Acompanhar sinistro"

- [ ] Abre `/acompanhar?n=<protocolo>` e busca sozinho.
- [ ] Status começa "Em processamento" (spinner "atualiza sozinha").
- [ ] Em ~10–20s muda **sozinho** para a decisão final (ex.: **Aprovado**).
- [ ] Aparece segurado, motivo da decisão e a **timeline de andamento**.
- [ ] Protocolo inexistente (ex.: `abc`) → erro amigável.

---

## 4. Painel do analista — `/painel`

- [ ] **1 linha por sinistro** (não por documento).
- [ ] KPIs (Sinistros / Fila de revisão / Aprovados / Total em orçamentos) batem.
- [ ] Filtros (Todos / Fila de revisão / Aprovados / Em análise / Pendente) funcionam.
- [ ] "Atualizar" recarrega. Clicar no protocolo → detalhe.

---

## 5. Detalhe do sinistro — `/painel/<id>`

- [ ] Cabeçalho: protocolo, badge de status, tipo/data/apólice.
- [ ] **Caixa de decisão** (verde = automática / âmbar = requer analista) com o motivo.
- [ ] **Segurado, veículo e evento** preenchidos (vêm da apólice + formulário).
- [ ] **Documentos**: uma linha por arquivo (DOC-01…), tipo, **% confiança**, status.
- [ ] **Validações (gates)**: ✓/✗ para docs completos, CPF, placa, vigência, teto.
- [ ] **Orçamentos** + valor de referência (quando houver).
- [ ] **Auditoria**: timeline com início/extração/classificação/decisão.

---

## 6. Verificação manual (fila de revisão)

Use um caso que caia em **Em análise** (ver cenários na seção 8).

- [ ] No detalhe, aparece o bloco **"Revisão do analista"** com **Aprovar / Negar**.
- [ ] Clicar **Aprovar** → status muda para Aprovado, some o bloco, toast de sucesso.
- [ ] **Network:** `PUT /sinistro/{id}` (200). Recarregar confirma o novo status.
- [ ] A auditoria ganha uma entrada "revisao_manual".

---

## 7. Assistente SAC — `/assistente`

- [ ] Perguntar: "Resuma os sinistros mais recentes".
- [ ] Perguntar sobre um protocolo específico; depois uma pergunta de acompanhamento (testa o contexto / `session_id`).
- [ ] **Network:** `POST /chat` `{message, session_id}` → `data.response`.
- [ ] "•••" enquanto pensa; sem "⚠️".

---

## 8. Cenários de decisão (o que demonstra os gates)

Monte os documentos para cada caso (a apólice já está semeada):

| Cenário                 | Como montar                                                    | Status esperado                   |
| ----------------------- | -------------------------------------------------------------- | --------------------------------- |
| **Caminho feliz**       | CNH + CRLV + orçamento ≤ R$ 5.000, dados batendo com a apólice | **Aprovado** (automático)         |
| **Falta documento**     | enviar só a CNH                                                | **Pendente de documentação**      |
| **Valor acima do teto** | orçamento > R$ 5.000                                           | **Em análise** (fila do analista) |
| **Fora da vigência**    | data do sinistro fora de 10/03/2026–10/03/2027                 | **Em análise** (análise especial) |
| **Roubo sem B.O.**      | tipo "Roubo" sem boletim de ocorrência                         | **Pendente de documentação**      |

- [ ] Pelo menos o **caminho feliz** e um de **revisão** demonstrados ao vivo.

---

## 9. Se algo não reagir (build/cache)

- [ ] Fork `vctorgriggi` com o último commit → Amplify "Deployed".
- [ ] Hard refresh `Cmd+Shift+R`.
- [ ] Na aba Network, conferir o status/resposta da chamada que falhou.

---

## 10. Observações

- **LGPD (DELETE)**: o endpoint `DELETE /sinistro/{id}` está pronto e testado
  (remove documentos + auditoria + arquivos no S3), mas **ainda não tem botão na
  tela** — disponível via API. Posso adicionar um botão "Excluir (LGPD)" no
  detalhe se quiser.
- **Qualidade da extração** depende do documento (foto ruim → confiança baixa →
  cai em revisão humana, que é o comportamento correto).
- A base começa limpa; cada teste cria sinistros reais no DynamoDB.
