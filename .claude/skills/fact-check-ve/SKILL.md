---
name: fact-check-ve
description: Protocolo de verificacao de afirmacoes contra os dados brutos.
---

# fact-check-ve

Protocolo de verificacao factual (PRD secao 9.4). Etapa obrigatoria e
BLOQUEANTE, em uma passada separada da redacao e da analise.

## Regras do projeto

PT-BR, voz Soulstory, sem travessao. Fidelidade factual total.

## Como verificar

Para cada afirmacao candidata, releia APENAS os dados brutos apontados em
`suportes` e decida se eles sustentam o texto. Nao use conhecimento externo nem
suposicao. A pergunta e simples: o dado citado prova a afirmacao?

## Classificacao

- **confirmada**: os dados citados sustentam a afirmacao como esta escrita.
- **imprecisa**: ha lastro, mas o texto exagera, generaliza ou erra um detalhe.
  Entra no relatorio apenas apos ajuste do texto ao que o dado sustenta.
- **nao_sustentada**: os dados nao sustentam a afirmacao, ou nao ha suporte
  valido. Sai do relatorio. Fica registrada no ledger com a nota do motivo.

## Cuidados criticos

- Trate metricas nao publicas como nao sustentaveis: qualquer afirmacao sobre
  salvamentos ou compartilhamentos do Instagram e `nao_sustentada`.
- Um falso confirmado custa caro. Na duvida entre confirmada e imprecisa, prefira
  imprecisa e proponha o ajuste. Na duvida entre imprecisa e nao_sustentada com
  suporte fraco, prefira nao_sustentada.
- A verificacao nao reescreve a analise: so classifica e, quando imprecisa,
  sugere o texto minimo corrigido fiel ao dado.
