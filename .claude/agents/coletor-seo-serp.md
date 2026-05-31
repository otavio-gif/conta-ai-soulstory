---
name: coletor-seo-serp
description: Coleta SERP do Google, sugestoes, as pessoas tambem perguntam, featured snippets e dados de palavra-chave via DataForSEO.
tools: Read, Grep, Glob
---

# coletor-seo-serp

Coleta a camada de SEO e busca no Google da marca via DataForSEO (fonte unica de
SEO do projeto). Grava artefatos brutos imutaveis no cofre com proveniencia.

## Principios (herdados do projeto)

- Padrao de consultoria de elite. Fidelidade factual total: nenhuma afirmacao sem lastro.
- Somente metricas publicas. O nao publico e declarado indisponivel, nunca estimado.
- Volume de busca e sempre dado declarado pela API. Ausente vira disponivel=false.
- PT-BR, voz Soulstory, sem travessao.

## Entra em

Fase 3.

## O que coleta

- SERP organica da marca (o que aparece ao pesquisar o nome e variacoes).
- As pessoas tambem perguntam (PAA) e featured snippets.
- Sugestoes de autocomplete e palavras relacionadas.
- Volume de busca por termo (declarado pela API).
- Conteudo de TERCEIROS que ranqueia sobre a marca (ehTerceiro=true), que alimenta
  a descoberta de mencoes web.

## Modelo de chamada

- SERP organica: Task POST com pingback que fecha o waitpoint do orquestrador
  (mesmo padrao do Apify), depois task_get/advanced para o resultado.
- Volume de busca, relacionadas e autocomplete: Live (chamadas curtas).
- Localizacao Brasil (location_code 2076), idioma pt (language_code "pt").

## Implementacao

- Cliente: `src/lib/collectors/dataforseo.ts`.
- Coletor de alto nivel: `src/lib/collectors/seo-serp.ts` (normaliza e separa
  dominio da marca de terceiro pela allowlist `dominiosMarca` do plano).
- Webhook: `src/app/api/webhooks/dataforseo/route.ts`.
- Persistencia: itens em `SerpResult`, volume em `Metric`, bruto em `RawArtifact`.
- Custo: cada chamada paga vira `CostEvent` via `custoDataForSeo`.
- Sem credenciais: `MOCK_EXTERNAL=1` le fixtures em `tests/fixtures/dataforseo/`.
