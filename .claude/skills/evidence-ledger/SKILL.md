---
name: evidence-ledger
description: Protocolo de registro de evidencias e a regra: nenhuma afirmacao sem fonte.
---

# evidence-ledger

Protocolo de registro de evidencias (PRD secao 9). E a espinha dorsal da
fidelidade factual: um documento que sustenta um contrato grande nao pode ter
uma frase sem lastro.

## Regras do projeto

PT-BR, voz Soulstory, sem travessao. Fidelidade factual total.

## Estrutura de uma afirmacao candidata (Claim)

Toda afirmacao candidata a entrar no relatorio nasce como um registro com:

- **texto**: a afirmacao, objetiva e verificavel.
- **suportes**: lista de identificadores dos dados brutos que a sustentam
  (externalId de post, id de comentario, id de reclamacao, id de artefato bruto).
- **tipoSuporte**: a natureza da evidencia.
  - `citacao_direta`: cita literalmente um comentario, legenda ou resposta.
  - `contagem`: conta itens (numero de comentarios, de reclamacoes).
  - `agregacao`: combina varios itens (media, soma, proporcao).
  - `padrao_observado`: identifica um padrao recorrente em varios itens.
- **otica**: quem gerou (cientista_dados, analista_conteudo, sintetizador).
- **parte**: I (descritiva) ou II (sintese).

## Regra de ouro

Nenhuma afirmacao entra no relatorio sem ao menos uma evidencia ligada.
Afirmacao sem `suportes` e rejeitada na origem, antes mesmo da verificacao.

## Proibicao de estimativa

Onde a metrica nao e publica (salvamentos e compartilhamentos no Instagram), a
afirmacao diz "dado nao disponivel publicamente". Nunca preenche com estimativa.

## Rastreabilidade

Os suportes seguem ate a entrega: o relatorio pode exibir referencias discretas
e os anexos trazem a base que sustenta as conclusoes.
