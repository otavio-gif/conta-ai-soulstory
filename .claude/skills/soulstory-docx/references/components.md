# Catálogo de Componentes · Soulstory

Cada componente abaixo tem um propósito comunicativo, uma anatomia visual e um snippet de uso. Use o helper `scripts/soulstory.js` para gerar cada um. Não reimplemente.

## 1. Cover (capa)

**Propósito.** Estabelece o documento. Anuncia marca, vertical, versão e mês. Já entrega uma frase de promessa em duas linhas que orienta o leitor sobre o que vai encontrar.

**Anatomia.**

```
[marca "(...)" indigo gigante alinhada à direita]

EYEBROW EM CONSOLAS INDIGO

Título linha 1.       (Cabin 48pt preto)
Título linha 2.       (Cabin 48pt indigo)

[parágrafo de introdução, EB Garamond 12pt, line 360]

[divisor sutil indigo]

[tabela meta de 4 a 6 linhas chave/valor]
```

**Quando usar.** Sempre. Todo documento Soulstory abre com cover.

**Helper.** `soulstory.cover({ eyebrow, titleLine1, titleLine2, bodyIntro, metaRows })`

## 2. Como ler este documento (callout)

**Propósito.** Antes do conteúdo, orientar o leitor sobre a arquitetura do documento. O que vem em cada capítulo, como ler os destaques em maiúsculas indigo, qualquer convenção que o leitor precisa saber para navegar.

**Anatomia.** É um callout indigo padrão (componente 5) com eyebrow "COMO LER ESTE DOCUMENTO" e 1 a 3 parágrafos de corpo em Cabin regular.

**Quando usar.** Em todo documento com mais de 4 capítulos ou que use vocabulário técnico marcado em algum sistema (maiúsculas indigo, por exemplo).

**Helper.** `soulstory.howToReadCallout(textParagraphs[])` ou `soulstory.indigoCallout({ eyebrow: "COMO LER ESTE DOCUMENTO", bodyParagraphs })`

## 3. Chapter opener (abertura de capítulo)

**Propósito.** Marca início de capítulo. Sempre em página nova.

**Anatomia.**

```
[quebra de página]

CAPÍTULO N              (Consolas bold 8,5pt indigo)

Título do capítulo.     (Cabin regular 28pt preto, com ponto final)
```

**Quando usar.** No início de cada capítulo.

**Helper.** `soulstory.chapterOpener({ number, title })`

## 4. Eyebrow + H2 (sub-abertura)

**Propósito.** Quando dentro de um capítulo há mais de uma seção principal, cada uma abre com eyebrow + H2.

**Anatomia.**

```
FRAMEWORK 1  ·  OS 5 PORTFOLIO ROLES     (Consolas bold 8,5pt indigo)

Cada marca recebe um papel.              (Cabin regular 20pt preto)
```

**Quando usar.** Para dividir um capítulo longo em frentes nomeáveis. Especialmente útil quando o time precisa identificar "estou no framework 1 ou no framework 2".

**Helper.** `soulstory.eyebrow(text)` seguido de `soulstory.h2(text)`

## 5. Callout indigo (princípio, citação, frase de impacto)

**Propósito.** Destacar UM conceito-chave, princípio organizador ou citação que merece pausa visual.

**Anatomia.** Card de uma célula, barra lateral indigo grossa à esquerda, fundo lavanda, padding generoso. Conteúdo é, tipicamente:

```
[EYEBROW EM CONSOLAS INDIGO]

[Frase em EB Garamond italic, 13pt, dark]

[Atribuição em EB Garamond italic, 9pt, grafite]
```

**Quando usar.**
- Princípio que organiza o pensamento do capítulo
- Citação de autor de referência (Aaker, Schwartz, Brunson, etc.)
- Frase única que sintetiza o argumento
- Diagrama de hierarquia (componente 8) — entra dentro de um callout

**Quando NÃO usar.** Para body text comum. Para listas. Para texto que precisa ser escaneado, não saboreado.

**Helper.** `soulstory.indigoCallout({ eyebrow, bodyParagraphs, attribution })`

## 6. Numbered cards (lista de itens estruturados)

**Propósito.** Apresentar uma lista de itens onde cada um tem mesma anatomia (nome + definição curta).

**Anatomia.** Cada item é uma tabela de 2 colunas, com bordas invisíveis. Coluna 1 (600 DXA) tem o número "01.", "02." etc em Consolas indigo. Coluna 2 (8400 DXA) tem título em Cabin bold + descrição em Cabin regular.

```
01.  Strategic Brand
     Marca cuja saúde é decisiva para o negócio. Subdivide em current power,
     future power e linchpin.

02.  Branded Energizer
     Marca, pessoa ou programa que injeta energia em outra marca.
```

**Quando usar.**
- Lista de 3 a 7 papéis, princípios, dimensões, objetivos
- Quando cada item precisa de uma definição que cabe em 1 a 3 linhas
- Quando o usuário pediria "lista com bullets" — substitua por numbered cards, é Soulstory

**Quando NÃO usar.** Para listas de checklist pura sem definição (use bullets discretos). Para listas onde cada item teria 5+ linhas de descrição (vire texto corrido com H4 ou ficha).

**Helper.** `soulstory.numberedCard({ number, title, body })` chamada uma vez por item, com parágrafo vazio entre cada chamada.

## 7. Brand entry / ficha de marca

**Propósito.** Apresentar UMA marca, pessoa ou área do portfólio em profundidade. Mostrar o nome, o que é, qual o papel, e os 3 a 5 fatos importantes.

**Anatomia.**

```
Nome.                                    (H3 Cabin bold 14pt, com ponto)

FUNDADOR  ·  ECONOMIA DA EMOÇÃO          (Consolas bold 8pt indigo)

Nome Display                             (Cabin regular 22pt preto, sem ponto)

Tagline em itálico, EB Garamond 12pt.    (descrição emocional, line 320)

Papel  ·  Strategic Brand                (Consolas grey + Cabin bold indigo)

·  Primeiro fato sobre a marca, em prosa.
·  Segundo fato, separado por bullet customizado.
·  Terceiro fato, idealmente com micro-prova ou número.
```

**Quando usar.**
- Apresentação de cada marca do portfólio
- Apresentação de pessoa-chave (fundador, gestor, expert)
- Apresentação de produto-âncora dentro de uma marca

**Helper.** `soulstory.brandEntry({ titleH3, eyebrow, displayName, tagline, roleLabel, roleValue, bullets })`

## 8. Hierarchy diagram (diagrama de hierarquia)

**Propósito.** Mostrar como marcas, áreas ou papéis se relacionam hierarquicamente, em uma única vista visual.

**Anatomia.** É um callout indigo (componente 5), mas o conteúdo é centralizado e composto por níveis hierárquicos separados por setas e conectores ASCII.

```
                    RAFAELLO                    (Cabin bold 13pt indigo)
              Branded Energizer · Driver behind (Garamond italic 9pt grey)

                        ↓                       (caractere ↓ azul indigo)

                    NOVO TRAÇO                  (Cabin bold 15pt indigo)
              Master brand · Strategic · Linchpin (Garamond italic 9pt grey)

           ┌──────────────┼──────────────┐      (conectores ASCII)

   NT RECORDS      NT ON DEMAND      NT EDUCATION  (em linha, ou em coluna se não couber)
```

**Quando usar.**
- Sempre que houver relação pai-filho explícita entre marcas
- Quando o time de marketing precisa ver "quem manda em quem" sem ler 3 páginas
- Logo após o título do capítulo "O portfólio inteiro" ou equivalente

**Helper.** `soulstory.hierarchyDiagram({ levels })` onde `levels` é um array com cada nível tendo `{ name, tagline, connector }`.

## 9. Data table (tabela de dados)

**Propósito.** Apresentar dados quantitativos comparáveis (números, métricas, status por marca, etc).

**Anatomia.**

```
[HEADER ROW: fundo indigo, texto off-white, Consolas bold 7pt]
ARTISTA          | RECORTE                 | OUVINTES MENSAIS
─────────────────┼─────────────────────────┼─────────────────
Zeca Baleiro     | MPB · Cantor e compositor | 2,0M
Kyan             | Rap · Trap brasileiro    | 3,2M
[bordas grey divider]
```

Coluna 1 (nome): Cabin bold preto
Coluna 2 (descritor): EB Garamond italic grey
Coluna 3 (número/dado): Cabin bold preto, à esquerda

**Quando usar.**
- Comparação de 5+ itens com 2 a 4 atributos cada
- Apresentação de KPIs, métricas de audiência, números de catálogo
- Quando o usuário pediria uma "tabela" no sentido convencional

**Quando NÃO usar.**
- Para listas de 3 itens (vire numbered cards)
- Para fichas com narrativa (vire brand entry)
- Quando os dados precisam de mais comentário do que ocupa a célula (vire prosa com micro-tabela inline)

**Helper.** `soulstory.dataTable({ headers, rows, columnWidths })`

## 10. Glossary card (card de glossário)

**Propósito.** Definir formalmente um termo técnico ao final do documento, com exemplos canônicos e aplicação no caso da marca.

**Anatomia.**

```
[Card único: fundo creme, barra lateral indigo grossa à esquerda, padding generoso]

01   TIPO DE STRATEGIC BRAND  ·  AAKER · CAPÍTULO 1       (numerador + meta)

Future Power Brand                                         (Cabin regular 16pt)

Definição.  Marca cuja base de vendas atual é pequena...   (label indigo + body)

Exemplos.  Toyota Prius nos primeiros anos...              (label indigo + italic Garamond)

Aplicação no portfólio.  A NT Records é a future power...  (label indigo + body)
```

**Quando usar.**
- Capítulo final "Glossário" quando o documento usa 4+ termos técnicos
- Um card por termo

**Helper.** `soulstory.glossaryCard({ number, metaTag, term, definition, examples, application })`

## 11. Meta-info table (tabela chave/valor)

**Propósito.** No cover, apresentar dados estruturados sobre o documento (empresa, fonte, status, versão, método).

**Anatomia.**

```
EMPRESA               | Novo Traço                          (Consolas grey | Cabin bold)
MARCAS MAPEADAS       | 14
FONTE                 | Reunião 01.05.2026
STATUS                | NT Records sem identidade visual
MÉTODO                | Soulstory Portfolio System (sobre Aaker)
VERSÃO                | 3.0  ·  Maio de 2026
```

Sem bordas externas, apenas linha grey divisora entre cada linha de chave/valor.

**Quando usar.** Apenas no cover. Não usar dentro do corpo do documento.

**Helper.** `soulstory.metaTable(rows)` onde `rows` é array de `{ key, value }`.

## 12. Closing mark (encerramento)

**Propósito.** Fechar o documento com a marca Soulstory centralizada e dados de versão.

**Anatomia.**

```
DOCUMENTO                                     (Consolas bold 7,5pt indigo)

Mapa de marcas Novo Traço.                    (H3 Cabin bold 14pt)
Versão 3.0, Maio de 2026. Construído a partir... (body Cabin)

PENDÊNCIA CRÍTICA                             (Consolas bold 7,5pt indigo)

Identidade visual da NT Records mais...       (body Cabin)

                  (...)   Soulstory · Brand Portfolio System   (centralizado)
```

**Quando usar.** Sempre, como última seção do documento.

**Helper.** `soulstory.closingBlock({ documentTitle, versionLine, criticalPendency })` seguido de `soulstory.closingMark()`.

## 13. Header e footer (do documento)

**Propósito.** Identificar o documento em toda página.

**Anatomia header.** Consolas bold 7pt grey, alinhado à esquerda, com linha grey por baixo:
`SOULSTORY  ·  [TÍTULO DOCUMENTO] V[X.X]  ·  [MÊS ANO]`

**Anatomia footer.** Marca "(...)" pequena indigo italic + "Página X de Y" em Consolas grey, com linha grey por cima:
`(...)Página 1 de 41`

**Helper.** O helper `buildSoulstoryDoc()` já configura header e footer automaticamente. Passe `headerText` e o resto sai por padrão.

## Convenções entre componentes

**Espaçamento entre componentes.** Cada componente abre seu próprio "ar". Não force parágrafos vazios extras. Se o resultado pareceu apertado na inspeção visual, ajuste o `spacing.after` do último parágrafo do componente.

**Quebra de página.** Use sempre antes de chapter opener. Use também antes de glossário e de closing. Não use quebras forçadas no meio de capítulos, deixe o Word fluir naturalmente.

**Densidade visual por página.** Cada página deve ter ao menos 1 elemento visual distintivo. Página 100% texto corrido é exceção (acontece em capítulo de contexto/argumentação). Página 100% cards/callouts também é exceção (acontece em capítulo de inventário/checklist).

A meta é alternar: texto corrido curto que prepara um insight → callout ou card que entrega o insight → texto curto que digere → próximo bloco visual. Esse pulso visual é a assinatura Soulstory.
