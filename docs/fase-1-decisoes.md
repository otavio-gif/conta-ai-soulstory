# Fase 1 (MVP vertical): decisões confirmadas

Registro canônico das decisões da Fase 1, travadas com o Otavio em 2026-05-30.
Onde este documento divergir do plano gerado na nuvem, **este documento vence**:
ele corrige o plano em três pontos para respeitar os princípios inegociáveis
do `CLAUDE.md`.

## Escopo da Fase 1

Transformar o pipeline mock em real para **Instagram** e **Reclame Aqui**, ponta
a ponta, mantendo os 7 checkpoints de aprovação humana. Aceite: um diagnóstico
real de uma marca pequena, sem nenhuma afirmação sem lastro verificado, com as
métricas indisponíveis declaradas, percorrendo os 7 checkpoints.

## Decisões que corrigem o plano da nuvem

1. **Comentários do Instagram: captura integral, sem teto.** O plano propunha
   teto de 500 por post; isso fere captura integral e a regra de não amostrar
   em silêncio. Coletar todos. Se o volume estourar o orçamento, a decisão sobe
   ao **checkpoint 1** (estreitar janela, aumentar verba ou aceitar amostra
   declarada como lacuna). Nunca amostrar em silêncio.

2. **Verificação factual no Opus 4.8.** O plano usava Sonnet 4.6 (preset
   Equilíbrio) na etapa bloqueante. A verificação é o guardião da fidelidade
   factual total (princípio 2): poucas chamadas, risco altíssimo de um falso
   confirmado. Usar o modelo mais capaz aqui.

3. **Autores de comentários pseudonimizados (LGPD).** O plano mantinha o @ real.
   Trocar o @usuário por um apelido estável via hash (ex.: `autor_a1b2`), guardar
   o texto e as métricas públicas, **não** guardar foto de perfil. O hash estável
   preserva a detecção de autor repetido sem expor identidade de terceiros num
   entregável de cliente. A conta da própria marca não é anonimizada (é o objeto
   do estudo).

## Modelos por papel (com prompt caching)

O corpus coletado e a doutrina do método entram uma vez como prefixo em cache e
são reusados em todas as chamadas, o que torna o uso do Opus viável.

| Papel | Modelo |
|---|---|
| OCR de carrosséis (visão) | Sonnet 4.6 |
| Análise (cientista de dados + analista de conteúdo) | Sonnet 4.6 |
| Síntese metodológica | Opus 4.8 |
| Verificação factual (bloqueante) | Opus 4.8 |
| Redação final (voz Soulstory) | Opus 4.8 |
| Tarefas mecânicas em volume (dedup, classificação) | Haiku 4.5 |

## Coleta

- **Instagram:** actors oficiais `apify/instagram-scraper` (perfil, bio, posts,
  legendas, métricas, Reels, carrosséis) e `apify/instagram-comment-scraper`
  (todos os comentários por post). Posts de terceiros que citam a marca via busca
  por menção/hashtag, alimentando o agente `coletor-mencoes`.
- **Assíncrono via webhook:** iniciar o run pela API do Apify, guardar o `runId`,
  e a Apify chama uma rota de webhook (`src/app/api/webhooks/apify/route.ts`) ao
  terminar, que fecha o waitpoint do Trigger.dev (`completeToken`). Sem polling.
- **Reclame Aqui:** Firecrawl, reclamações e respostas na janela mais indicadores
  públicos, com retomada sob bloqueio e registro de lacunas.
- **Salvamentos e compartilhamentos:** sempre indisponíveis, nunca estimados.

## Transcrição e OCR

- **Áudio dos Reels:** `gpt-4o-transcribe` (OpenAI), melhor precisão em PT-BR ao
  mesmo preço do whisper-1. Custo irrelevante (Reels são curtos).
- **OCR de carrosséis:** visão do Claude (Sonnet 4.6).

## Custo

- O guardrail de R$ 35/mês fixo não cabe num diagnóstico real. Vira um
  **orçamento por projeto que o Otavio aprova no checkpoint 1**. Cada chamada paga
  (Apify, OpenAI, Anthropic) gera um `CostEvent`.

## Documento e visual

- Skill `soulstory-docx` e Design System 2.0 **já instalados** (commit `c935634`).
- A skill é um kit de helpers (`scripts/soulstory.js`), não um conversor CLI.
  A Fase 1 constrói `scripts/soulstory-docx-build.js` como ponte: lê o
  `ReportSpec` e chama os helpers para gerar o .docx de 50+ páginas com anexos.
- Gráficos: PNG no padrão indigo via Node nativo (vega-lite + canvas).

## Arquitetura (do plano, mantida)

O worker Trigger.dev é Node puro, sem Claude Code. Os sub-agentes do PRD viram
chamadas à API Anthropic com system prompt por papel. A doutrina vive nos
`SKILL.md` (hoje scaffolds), preenchidos e injetados em runtime como bloco
cacheado. O orquestrador e o harness de checkpoint não mudam de forma: só os
callbacks de produzir/persistir passam a chamar código real.

## Validação sem credenciais

`MOCK_EXTERNAL=1 pnpm fixtures:pipeline` roda os 7 estágios reais sobre fixtures
gravadas das respostas das APIs, gera o docx e confere: 50+ páginas, ledger sem
afirmação sem lastro, métricas indisponíveis declaradas. Depois
`pnpm typecheck/build/lint` e `prisma migrate`.

## Ordem de implementação

Fundações (`src/lib/ai/`) → coletores (Apify + webhook, Firecrawl) → transcrição
e OCR → análise e gráficos → verificação bloqueante → redação e docx → skills
doutrinárias e fixtures. PR ao final.
