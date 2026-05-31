---
name: coletor-protocolos
description: Convencoes de coleta, normalizacao e deduplicacao por fonte.
---

# coletor-protocolos

Convencoes de coleta, proveniencia, normalizacao e deduplicacao por fonte
(PRD secoes 9.1 e 12).

## Regras do projeto

PT-BR, voz Soulstory, sem travessao. Fidelidade factual total. Somente metricas
publicas. Captura integral dentro da janela, sem amostragem em silencio.

## Proveniencia

Todo dado bruto e gravado antes de qualquer analise, como RawArtifact imutavel,
com URL de origem, carimbo de data e payload original. A analise sempre aponta
de volta para esses artefatos.

## Captura integral e volume

Dentro da janela, coletar todos os dados publicos. Quando o volume estourar o
orcamento do projeto, NUNCA cortar dados em silencio: sinalizar volume e custo
no checkpoint 1 e deixar o operador decidir (estreitar a janela, ampliar a verba
ou aceitar uma amostra declarada como lacuna).

## Metricas publicas

Instagram: curtidas, comentarios e visualizacoes de Reels sao publicas.
Salvamentos e compartilhamentos NAO sao publicos: gravar com `disponivel=false`,
valor nulo, nunca estimado.

## LGPD e autores de comentarios

Pseudonimizar o autor por hash estavel (autor_xxxx). Guardar o texto e as
metricas publicas. Nao guardar foto de perfil. Nao publicar o @ no relatorio. A
conta da propria marca nao e anonimizada.

## Normalizacao por tipo

- **posts**: externalId, tipo de midia (imagem, carrossel, reel, video),
  legenda, url, data, metricas publicas, urls de imagem e de video.
- **comentarios**: id, autor pseudonimizado, texto, data, post de origem.
- **reclamacoes**: titulo, texto, resposta da marca, status, avaliacao, url.
- **mencoes**: posts de terceiros que citam a marca, marcados como ehMencao.

## Deduplicacao e retomada

Deduplicar por id externo. Em coleta paginada (Firecrawl no Reclame Aqui),
gravar cada pagina como artefato assim que chega, para que a retomada apos
bloqueio pule o que ja foi capturado. Bloqueio persistente vira lacuna declarada
no inventario.
