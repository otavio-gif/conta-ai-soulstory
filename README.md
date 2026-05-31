# Conta A.I. | Diagnostico de Visao Externa (Soulstory)

Webapp interno da Soulstory que gera um Diagnostico de Visao Externa (metodo
Ana Couto) a partir da pegada digital publica de uma marca ou influenciador.
Operador unico: Otavio. Idioma do produto e dos entregaveis: PT-BR. Voz
Soulstory. Sem travessao.

Contexto permanente em `CLAUDE.md`. PRD completo em `docs/PRD.md`.

## Estado: Fase 2 (video em escala)

O pipeline e real e ponta a ponta para quatro fontes, Instagram, Reclame Aqui,
TikTok e YouTube, integradas ao mesmo relatorio, mantendo os 7 checkpoints.
Inclui coleta via Apify (Instagram e TikTok, perfil, posts, Reels, videos,
carrosseis e comentarios integrais) com webhook fechando o waitpoint, YouTube via
Data API v3 (videos, comentarios e legendas oficiais com transcricao como
fallback), Reclame Aqui via Firecrawl com retomada, transcricao de audio em
volume (gpt-4o-transcribe, paralelismo, custo por chamada), OCR de carrosseis
(visao do Claude), as duas oticas de analise mais a analise de viralizacao
cross-fonte, sintese metodologica via API Anthropic com prompt caching, evidence
ledger com verificacao factual bloqueante e o relatorio completo (Parte I e II)
em soulstory-docx com anexos por fonte e graficos. Nesta fase a coleta de TikTok
e YouTube cobre a conta da propria marca ou criador; descoberta de video de
terceiros e SEO entram nas fases seguintes.

Modelos (preset Equilibrio): Sonnet 4.6 para OCR, analise e (com Haiku 4.5 nas
tarefas mecanicas); Opus 4.8 para sintese, verificacao factual e redacao. O
orcamento e por projeto, aprovado no checkpoint 1; cada chamada paga vira um
CostEvent. As 50+ paginas de qualidade saem dos runs reais com Opus; o run de
fixtures valida toda a maquinaria e a estrutura sem custo.

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

## Validacao sem credenciais (MOCK_EXTERNAL)

```bash
pnpm typecheck
pnpm build
pnpm fixtures:pipeline  # roda o pipeline real sobre fixtures e gera ./tmp/diagnostico-fixtures.docx
```

Com `MOCK_EXTERNAL=1` os clientes de API (Apify, Firecrawl, OpenAI, Anthropic)
leem respostas gravadas em `tests/fixtures/`, exercendo toda a logica real
(normalizacao, ledger, verificacao bloqueante, redacao e docx) sem chave e sem
custo. O script confere que nenhuma afirmacao entra sem lastro verificado, que
as metricas indisponiveis sao declaradas e que a regra de ouro descarta
afirmacoes sem suporte.

## Arquitetura

- `src/lib/pipeline/` os 7 estagios reais, tipos e o corpus que atravessa a cadeia.
- `src/lib/ai/` cliente Anthropic com prompt caching, doutrina das skills, e os papeis (interprete, analise, sintese, verificacao, redacao).
- `src/lib/collectors/` Apify (Instagram) com webhook + waitpoint e Firecrawl (Reclame Aqui) com retomada.
- `src/lib/transcribe/` transcricao de Reels (OpenAI) e OCR de carrosseis (Claude).
- `src/lib/charts/` graficos indigo em PNG (SVG rasterizado), sem dependencia nativa.
- `src/lib/cost.ts` estimador, medidor (CostEvent) e contexto de custo por projeto.
- `src/lib/docx/adapter.ts` ponte para a skill soulstory-docx. Ver `src/lib/docx/README.md`.
- `scripts/soulstory-docx-build.js` build script Node sobre o helper `soulstory.js`.
- `src/trigger/orchestrator.ts` orquestrador Trigger.dev com waitpoints (HITL).
- `.claude/skills/` doutrina (visao-externa-metodo, evidence-ledger, fact-check-ve, coletor-protocolos) lida em runtime, e a skill soulstory-docx.

## Segredos

Todas as chaves ficam em `.env` (gitignored) e como segredos na Vercel e no
Trigger.dev. Nunca no codigo nem no git.
