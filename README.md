# Conta A.I. | Diagnostico de Visao Externa (Soulstory)

Webapp interno da Soulstory que gera um Diagnostico de Visao Externa (metodo
Ana Couto) a partir da pegada digital publica de uma marca ou influenciador.
Operador unico: Otavio. Idioma do produto e dos entregaveis: PT-BR. Voz
Soulstory. Sem travessao.

Contexto permanente em `CLAUDE.md`. PRD completo em `docs/PRD.md`.

## Estado: Fase 0 (fundacao)

Esta fase entrega a fundacao tecnica e o fluxo de ponta a ponta com dado
simulado, parando nos 7 checkpoints de aprovacao humana e gerando um docx
minimo. As fontes reais (Instagram, TikTok, YouTube, Reclame Aqui, SEO) e as
analises chegam a partir da Fase 1.

## Stack

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + shadcn/ui ·
Prisma sobre Postgres (Supabase) · Trigger.dev (jobs longos com checkpoints) ·
soulstory-docx (via adaptador).

## Setup

```bash
pnpm install
cp .env.example .env   # preencha as credenciais
pnpm db:generate       # gera o Prisma Client
```

Para o fluxo completo (com infra):

```bash
pnpm db:migrate        # aplica o schema no Postgres do Supabase
pnpm db:seed           # cria um projeto mock
pnpm trigger:dev       # em um terminal: worker do Trigger.dev
pnpm dev               # em outro terminal: app em http://localhost:3000
```

Login com a senha de `APP_ACCESS_PASSWORD`. Crie um diagnostico, aprove cada um
dos 7 checkpoints e o ultimo gera o `.docx` (Supabase Storage ou `./tmp`).

## Aceite da Fase 0 sem infra externa

```bash
pnpm typecheck
pnpm build
pnpm mock:pipeline     # roda os 7 estagios e gera ./tmp/diagnostico-mock.docx
```

## Arquitetura

- `src/lib/pipeline/` estagios puros (mock), tipos e os 7 checkpoints.
- `src/lib/cost.ts` estimador e medidor de custo (guardrail R$ 35/mes).
- `src/lib/docx/adapter.ts` ponte para a skill soulstory-docx (ou fallback). Ver `src/lib/docx/README.md`.
- `src/trigger/orchestrator.ts` orquestrador Trigger.dev com waitpoints (HITL).
- `src/app/` UI: login, lista, novo diagnostico, painel de checkpoints e custo.
- `.claude/agents/` e `.claude/skills/` scaffolds dos agentes e skills do PRD.

## Segredos

Todas as chaves ficam em `.env` (gitignored) e como segredos na Vercel e no
Trigger.dev. Nunca no codigo nem no git.
