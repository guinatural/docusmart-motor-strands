# DocuSmart Web — Frontend

Interface do **DocuSmart Intelligence** (Hack2Hire 2026). Triagem inteligente de
sinistros de seguro auto. **Todos os dados são fictícios e mockados** — não há
backend nem autenticação reais nesta camada.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 · Headless UI · Heroicons
- Sonner (notificações)

## Rodando

```bash
npm install
npm run dev   # http://localhost:3000
```

## Estrutura

```
app/(public)/            # superfícies públicas (cliente, sem login)
  page.tsx               #   upload do pacote → gera protocolo SIN-2026-xxxxx
  acompanhar/            #   consulta o andamento por número de protocolo
app/(private)/           # superfícies internas (analista) — sem auth no protótipo
  painel/                #   KPIs + tabela de sinistros + fila de revisão
  painel/[numero]/       #   detalhe: documentos, validações (gates), decisão, auditoria
  assistente/            #   chatbot SAC (respostas mockadas sobre o seed)
lib/docusmart/           # domínio: types, constantes de negócio, seed e "mock-api"
components/docusmart/    # componentes específicos do produto
```

## Trocar o mock pelo backend real

Toda chamada de dados passa por `lib/docusmart/mock-api.ts`. Quando os endpoints
da AWS (API Gateway) existirem, basta substituir o corpo dessas funções por
`fetch`, mantendo as mesmas assinaturas — a UI não muda.

## Dados de seed

6 apólices (gabarito) e 5 sinistros, cada um exercitando um gate da regra de
negócio:

| Protocolo      | Cenário                        | Status                   |
| -------------- | ------------------------------ | ------------------------ |
| SIN-2026-00123 | caminho feliz                  | Aprovado                 |
| SIN-2026-00130 | faltam documentos obrigatórios | Pendente de documentação |
| SIN-2026-00141 | data fora da vigência          | Em análise               |
| SIN-2026-00155 | valor acima do teto            | Em análise               |
| SIN-2026-00162 | baixa confiança na extração    | Em processamento         |
