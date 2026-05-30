# Design Tokens · Soulstory

Tudo aqui é referência fiel à assinatura Soulstory original. Não altere valores sem testar visualmente.

## Página

| Token | Valor (DXA) | Equivalente |
|---|---|---|
| Largura página | 11906 | A4 |
| Altura página | 16838 | A4 |
| Margem topo | 1440 | 1 polegada |
| Margem base | 1440 | 1 polegada |
| Margem esquerda | 1440 | 1 polegada |
| Margem direita | 1440 | 1 polegada |
| Offset header | 708 | 0,49 polegada |
| Offset footer | 708 | 0,49 polegada |
| Largura útil (conteúdo) | 9026 | usar 9000 para tabelas |

A página é A4 portrait. Não use US Letter, mesmo que o docx-js sugira por padrão.

## Paleta de cores

Toda cor é hex sem hashtag (formato docx).

| Token | Hex | Uso |
|---|---|---|
| `INDIGO_DEEP` | `3d396e` | Acento principal, eyebrows, role labels, números de card, header de tabela invertida, barra lateral de callout |
| `INDIGO_BRIGHT` | `5c6fcf` | Marcadores de bullet customizados, setas e conectores de hierarquia |
| `INDIGO_LIGHT` | `8e9fee` | Marca "(...)" do header/footer e closing, divisores leves |
| `INDIGO_LAVENDER` | `e1e4f6` | Fundo de callout indigo |
| `INDIGO_DIVIDER` | `bfc3dc` | Divisor sutil indigo após o body intro do cover |
| `TEXT_DEEPEST` | `0c0b14` | Títulos H1/H2/H3, brand names |
| `TEXT_BODY` | `2a2934` | Corpo de texto padrão |
| `TEXT_META` | `7c7a88` | Eyebrows secundárias, atribuições, header/footer texts, metadata labels |
| `DIVIDER_GREY` | `d8d6d9` | Linha do header, linha do footer, divisores entre linhas de tabela meta, borda de tabela de dados |
| `CREAM_BG` | `f1efec` | Fundo de card de glossário |
| `OFF_WHITE` | `faf8f5` | Texto sobre fundo indigo (header de tabela de dados) |

A paleta inteira gira em torno de UMA família indigo (do deep ao lavender), grafite morno em vez de cinza azulado, e creme bege em vez de branco puro. Isso dá calor ao documento sem perder formalidade.

## Tipografia

Três famílias, cada uma com função definida. Não misture.

### Cabin (sans-serif geométrica)

Função: títulos, brand names, corpo principal, role labels, números de card.

| Uso | Tamanho (half-points) | Equivalente pt | Peso | Cor |
|---|---|---|---|---|
| Cover título (linhas 1 e 2) | 96 | 48pt | Regular (b=0) | `TEXT_DEEPEST` ou `INDIGO_DEEP` |
| Chapter title (H1) | 56 | 28pt | Regular (b=0) | `TEXT_DEEPEST` |
| Section H2 framework | 40 | 20pt | Regular (b=0) | `TEXT_DEEPEST` |
| Section H3 (subtítulo) | 28 | 14pt | Bold | `TEXT_DEEPEST` |
| Brand display name (ficha grande) | 44 | 22pt | Regular | `TEXT_DEEPEST` |
| Glossary term name | 32 | 16pt | Regular | `TEXT_DEEPEST` |
| Hierarchy diagram node grande | 30 | 15pt | Bold | `INDIGO_DEEP` |
| Hierarchy diagram node médio | 26 | 13pt | Bold | `INDIGO_DEEP` |
| Numbered card title | 23 | 11,5pt | Bold | `TEXT_DEEPEST` |
| Role label do brand entry | 22 | 11pt | Bold | `INDIGO_DEEP` |
| Body padrão | 24 | 12pt | Regular | `TEXT_BODY` |
| Body em card | 21 | 10,5pt | Regular | `TEXT_BODY` |
| Meta-table value | 22 | 11pt | Bold | `TEXT_DEEPEST` |
| Bullet marker `·` | 22 | 11pt | Bold | `INDIGO_BRIGHT` |

### EB Garamond (serifa clássica)

Função: tudo que precisa carregar emoção, narrativa ou autoridade citada. Quase sempre em itálico.

| Uso | Tamanho | Equivalente pt | Estilo | Cor |
|---|---|---|---|---|
| Cover body intro | 24 | 12pt | Regular | `TEXT_BODY` |
| Brand tagline (ficha) | 24 | 12pt | Italic | `TEXT_BODY` |
| Callout body (princípio, frase de impacto) | 26 | 13pt | Italic | `TEXT_DEEPEST` |
| Callout attribution | 18 | 9pt | Italic | `TEXT_META` |
| Footer mark "(...)" | 22 | 11pt | Italic | `INDIGO_LIGHT` |
| Cover mark "(...)" gigante | 200 | 100pt | Italic | `INDIGO_LIGHT` |
| Closing mark "(...)" centralizado | 36 | 18pt | Italic | `INDIGO_LIGHT` |
| Closing signature text | 18 | 9pt | Italic | `TEXT_META` |
| Hierarchy diagram mini-tagline | 18 | 9pt | Italic | `TEXT_META` |
| Glossary "Exemplos" body | 22 | 11pt | Italic | `TEXT_BODY` |

### Consolas (monospace)

Função: tags, eyebrows, metadata, header/footer texts. Tudo que precisa parecer "etiqueta técnica".

| Uso | Tamanho | Equivalente pt | Peso | Cor |
|---|---|---|---|---|
| Eyebrow capítulo "CAPÍTULO N" | 17 | 8,5pt | Bold | `INDIGO_DEEP` |
| Eyebrow framework "FRAMEWORK 1 · OS 5 ROLES" | 17 | 8,5pt | Bold | `INDIGO_DEEP` |
| Eyebrow seção curta dentro de ficha | 16 | 8pt | Bold | `INDIGO_DEEP` |
| Eyebrow dentro de callout | 16 | 8pt | Bold | `INDIGO_DEEP` |
| Meta-table key | 15 | 7,5pt | Bold | `TEXT_META` |
| Data table header text | 14 | 7pt | Bold | `OFF_WHITE` |
| Header texto | 14 | 7pt | Regular | `TEXT_META` |
| Footer texto e numeração | 14 | 7pt | Regular | `TEXT_META` |
| "Papel · " e similares labels | 16 | 8pt | Bold | `TEXT_META` |
| Numbered card número (01., 02.) | 19 | 9,5pt | Bold | `INDIGO_DEEP` |

## Espaçamentos

Todos em DXA, half-points ou unidades docx.

| Token | Valor | Função |
|---|---|---|
| Line height padrão body | 320 | Body Cabin |
| Line height Garamond | 360 | Body Garamond |
| Line height callout italic | 380 | Frase de impacto |
| Spacing after H1 | 220 | |
| Spacing before H1 | 360 | |
| Spacing after H2 | 160 | |
| Spacing before H2 | 320 | |
| Spacing after H3 | 120 | |
| Spacing before H3 | 240 | |
| Spacing entre cards numerados | 120-200 | Parágrafo vazio entre tabelas |
| Padding célula callout | 220/320/220/320 | top/left/bottom/right |
| Padding célula glossary | 280/320/280/320 | |
| Padding célula data table header | 140/200/140/200 | |
| Padding célula data table body | 120/200/120/200 | |
| Padding célula numbered card (esquerda da número) | 100/0/100/80 | sem padding interno à esquerda do número |
| Padding célula numbered card (direita do título+texto) | 100/80/100/0 | |
| Padding célula meta-table key | 120/0/120/200 | |
| Padding célula meta-table value | 120/0/120/0 | |

## Bordas

| Token | Especificação |
|---|---|
| Callout indigo barra lateral | left only, color `INDIGO_DEEP`, sz=24, single |
| Callout indigo demais bordas | top/bottom/right: nil |
| Glossary card bordas | left: indigo deep sz=24; top/bottom/right: grey divider sz=4 |
| Numbered card bordas | todas nil (invisíveis) |
| Meta-table linha | bottom only: `DIVIDER_GREY` sz=4 |
| Data table header | todas: `INDIGO_DEEP` sz=4 |
| Data table body | todas: `DIVIDER_GREY` sz=4 |
| Header do documento (linha inferior) | bottom: `DIVIDER_GREY` sz=4, space=4 |
| Footer do documento (linha superior) | top: `DIVIDER_GREY` sz=4, space=6 |
| Divisor pós-intro do cover | bottom: `INDIGO_DIVIDER` sz=4 single |

## Fundos (shading)

Sempre `ShadingType.CLEAR` (nunca SOLID).

| Componente | Fundo |
|---|---|
| Callout indigo | `INDIGO_LAVENDER` (`e1e4f6`) |
| Glossary card | `CREAM_BG` (`f1efec`) |
| Data table header row | `INDIGO_DEEP` (`3d396e`) |
| Data table body rows | branco (`ffffff`) ou omitir |
| Numbered card | sem fundo (transparente) |
| Brand entry "ficha" | sem fundo (apenas tipografia hierárquica) |

## Marcas distintas Soulstory

Três marcas visuais que aparecem ao longo do documento:

1. **"(...)" indigo gigante no cover** — EB Garamond italic, sz=200, color `INDIGO_LIGHT`, alinhado à direita
2. **"(...)" pequeno no footer** — EB Garamond italic, sz=22, color `INDIGO_LIGHT`, no fluxo de texto do footer antes de "Página X de Y"
3. **"(...)" centralizado no encerramento** — EB Garamond italic, sz=36 para o símbolo + sz=18 para "Soulstory · Brand Portfolio System" em `TEXT_META`, alinhado ao centro

Essas três aparições são a "assinatura" no sentido literal. Não substitua por outro símbolo, não tire, não mude de cor.

## Caracteres especiais usados

| Caractere | Uso | Onde aparece |
|---|---|---|
| `·` (interpunct, U+00B7) | Separador entre meta-itens | Eyebrows, taglines, header, footer, bullets |
| `↓` (U+2193) | Seta vertical | Conector vertical em diagrama de hierarquia |
| `┌` `┐` `└` `┘` `─` `│` `┼` (box drawing) | Conectores ASCII | Diagrama de hierarquia entre marcas-filhas |
| `…` (U+2026) ou `(...)` literal | Marca Soulstory | Header/footer/cover/closing |
| `"` `"` (smart quotes U+201C/U+201D) | Citações | Sempre que o documento citar fala literal |
| `'` (apostrofo U+2019) | Apóstrofo tipográfico | "Eles não querem isto", nunca `'` reto |

Nunca use travessão (—) em nenhum lugar do documento. Para pausas, use vírgula, dois-pontos ou ponto. Para indicar relação entre itens curtos, use o ponto interpunct (`·`) com dois espaços antes e depois. Esta regra vale para todo o conteúdo, é absoluta.
