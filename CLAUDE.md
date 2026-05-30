# Conta A.I. | Soulstory | Diagnóstico de Visão Externa

Memória permanente do projeto. Leia antes de qualquer trabalho.

## O que é

Webapp de uso interno da Soulstory que gera um Diagnóstico de Visão Externa (método Ana Couto)
a partir da pegada digital pública de uma marca ou influenciador. Um pipeline orquestrado de
agentes coleta, transcreve, analisa, sintetiza, verifica e compõe um relatório soulstory-docx de
50 a 100 páginas. Operador único: Otavio.

## Princípios inegociáveis (vencem qualquer conflito)

1. **Padrão de consultoria de elite.** Profundidade comparável a McKinsey/BCG. Nada raso, nada genérico, nada de achismo.
2. **Fidelidade factual total.** Zero invenção, zero estimativa. Toda afirmação rastreável a um dado bruto. Verificadores auditam cada afirmação contra a fonte. Sem lastro, é rejeitada.
3. **Arquitetura de agents, sub-agents e skills.** Orquestrador delega a especialistas, apoiados por skills versionadas.
4. **Somente métricas públicas.** O que não é público (salvamentos e compartilhamentos de Instagram/TikTok) é reportado como indisponível, nunca inferido.
5. **Captura integral.** Dentro da janela, coletar todos os dados públicos. Profundidade acima de velocidade.
6. **Soberania do dado.** Dados brutos exclusivos da Soulstory, com proveniência e retenção definidas.
7. **Human in the loop.** Mínimo 5 checkpoints de aprovação humana (o projeto usa 7), começando pelo plano de coleta.
8. **Escopo: estritamente Visão Externa.** Percepção de consumidores e stakeholders, mídia espontânea e boca a boca. Sem Visão Interna, Cultura ou Mercado/Concorrência.

## Regras de escrita (sempre)

- **Idioma:** Português do Brasil em todo o produto e em todos os entregáveis.
- **Voz Soulstory.**
- **Sem travessão.** Nunca usar travessão (—) em nenhum texto, código de exibição, relatório ou comentário voltado ao usuário.

## Stack

Next.js (App Router) + React + TypeScript + Tailwind + shadcn/ui · Supabase (Postgres, storage, auth simples)
· Prisma · Vercel · Trigger.dev (jobs longos) · API Anthropic · Whisper (OpenAI) · Apify · YouTube Data API
· Firecrawl · DataForSEO · soulstory-docx + Plotly/matplotlib para gráficos.

## Segredos

Todas as chaves ficam em `.env` (gitignored) e como segredos na Vercel/Trigger.dev. NUNCA no código nem no git.

## Documentos

- PRD completo: `docs/PRD.md`
