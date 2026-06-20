# DocuSmart Web — Frontend

Interface do **DocuSmart Intelligence** (Hack2Hire 2026). Triagem inteligente de
sinistros de seguro auto. Consome a **API real** (AWS API Gateway). Dados
fictícios.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 · Headless UI · Heroicons
- Sonner (notificações)

## Rodando

```bash
npm install
npm run dev   # http://localhost:3000
```

## Configuração

`NEXT_PUBLIC_API_BASE_URL` define a base da API (ver `.env.example`). Se ausente,
usa o endpoint atual como fallback. Não há autenticação nesta camada (protótipo —
o painel do analista usa um usuário fixo).

## Estrutura

```
app/(public)/            # superfícies do cliente (sem login)
  page.tsx               #   upload do pacote → gera protocolo (UUID)
  acompanhar/            #   acompanha o andamento pelo protocolo (polling)
app/(private)/           # painel do analista
  painel/                #   KPIs + tabela de sinistros + fila de revisão
  painel/[numero]/       #   detalhe: documentos, gates, decisão, auditoria, aprovar/negar
  assistente/            #   chat SAC
lib/docusmart/           # api.ts (client real), constants, format
components/docusmart/    # componentes do produto
```

## Camada de dados

Tudo passa por **`lib/docusmart/api.ts`** (client da API real). Endpoints:
`POST /upload`, `POST /sinistro`, `GET /sinistro/{id}`, `GET /sinistros`,
`PUT /sinistro/{id}`, `DELETE /sinistro/{id}`, `POST /chat`.

## Deploy

Hospedado no **AWS Amplify** (build automático a cada push). Config em
`../../amplify.yml` (monorepo, appRoot `frontend/docusmart-web`).
