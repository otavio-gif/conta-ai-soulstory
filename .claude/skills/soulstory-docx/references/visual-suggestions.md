# Quando usar qual componente visual · Soulstory

Esta tabela é o primeiro lugar pra consultar quando o conteúdo está pronto e a pergunta é "como visualizo isso". A regra geral: privilegie visual quando o conteúdo é estrutural (lista, relação, dado). Privilegie prosa quando o conteúdo é argumentativo (raciocínio, contexto, nuance).

## Matriz de decisão

| Se o conteúdo é... | O componente é... |
|---|---|
| Lista de 3 a 7 itens com mesma anatomia (papel, princípio, dimensão, objetivo, regra) | Numbered cards |
| Lista de 8+ itens com mesma anatomia | Data table |
| Princípio organizador, citação de autor, frase de impacto isolada | Indigo callout |
| Definição expandida de termo técnico ao final | Glossary card |
| Como ler o documento (intro à estrutura) | Indigo callout com eyebrow "COMO LER ESTE DOCUMENTO" |
| Marca individual com nome, papel, fatos | Brand entry / ficha de marca |
| Pessoa individual com função, biografia curta, evidência | Brand entry / ficha (mesma estrutura) |
| Relação hierárquica entre 3+ marcas ou áreas | Hierarchy diagram (dentro de callout indigo) |
| Comparação numérica entre 5+ entidades em 2 a 4 atributos | Data table |
| Dado único importante (uma métrica que muda tudo) | Indigo callout com a métrica em destaque |
| Argumento que precisa de 3 a 5 parágrafos para se desenvolver | Texto corrido com H3 |
| Argumento curto que justifica a próxima decisão | Texto corrido sem H3, eventualmente com 1 callout |
| Resumo executivo de um capítulo (uma linha que sintetiza) | Eyebrow + frase única, antes do chapter opener |
| Inventário de itens em desenvolvimento (oito possibilidades, dez opções, etc.) | Sequência de numbered cards agrupados por categoria-pai |
| Indicador binário (presente/ausente, ativo/inativo) | Indigo callout com bullets internos: "Ativos no portfólio NT" |

## Como pulsar visualmente uma página

Princípio: cada página alterna entre densidade visual e ar.

**Densidade visual** é o que prende olho: callout, card, tabela, hierarquia, ficha. São os elementos com fundo, com bordas, com layout não-linear.

**Ar** é o que descansa: texto corrido em Cabin 12pt, parágrafos curtos, espaçamento generoso entre seções.

Uma página ideal tem:

```
[Eyebrow]                          ← ar
[H2 ou H3]                          ← ar
[1 parágrafo de prosa, 2-3 linhas]  ← ar

[CALLOUT ou TABELA ou DIAGRAMA]     ← densidade

[2 a 3 parágrafos de prosa]         ← ar

[CARDS NUMERADOS]                   ← densidade
```

Padrões que NÃO funcionam:

- Três callouts seguidos sem prosa entre eles (o leitor satura)
- Página inteira de prosa sem nenhum elemento visual (a sensação é de muro)
- Card numerado isolado sem antes ter um parágrafo de contexto explicando o que a lista vai mostrar
- Tabela sem H3 acima nomeando o que está sendo tabulado

## Quanto suporte visual usar

A regra heurística: um documento Soulstory tem, por capítulo, ao menos:

- 1 indigo callout (princípio, citação, frase-âncora)
- 1 grupo de cards numerados OU 1 tabela OU 1 hierarquia
- 1 brand entry, se o capítulo apresenta marca/pessoa
- Eyebrows + H2/H3 em todas as quebras de seção

Documentos com 6 a 8 capítulos típicos da Soulstory acabam tendo, no total, entre 25 e 50 componentes visuais. Isso é normal e é a assinatura. Documento Soulstory sem suporte visual não é Soulstory, é Word genérico.

## Sinais de que está faltando visual

Quando você olha o rascunho do documento e identifica um destes sinais, é hora de inserir componente visual:

1. **Sequência de 4+ parágrafos sem nenhum elemento visual entre eles.** Insira pelo menos um callout ou um conjunto de cards.
2. **Lista em prosa do tipo "a marca X tem três funções: a primeira é..., a segunda é..., a terceira é...".** Vire numbered cards.
3. **Citação de autor ou fonte enterrada no meio de um parágrafo.** Vire callout indigo com a citação como body e atribuição embaixo.
4. **Comparação numérica em texto ("a NT Records tem 60 fonogramas, a NT On Demand tem 100 eventos, a NT Education tem 4 cursos").** Vire data table.
5. **Frase do tipo "vale destacar que..." ou "é importante notar que..." seguida de uma única ideia central.** Tire o conectivo e vire callout indigo.

## Sinais de que está excessivo

Inversamente, quando o documento começa a:

1. Ter callouts em sequência sem prosa entre eles → consolide ou converta parte em prosa
2. Ter cards numerados de 1 item ou 2 itens (numbered card não faz sentido com 1 ou 2 itens) → vire H3 + body normal
3. Ter tabela de 2 colunas e 3 linhas com texto longo dentro → vire prosa com micro-tabela ou três parágrafos curtos
4. Ter hierarquia de 1 nível só (não é hierarquia, é só uma marca) → tire o diagrama, use brand entry

## Convenção de fundo / cor por tipo de conteúdo

| Cor de fundo | Tipo de conteúdo |
|---|---|
| Lavanda indigo (`#E1E4F6`) | Princípio, citação, frase-âncora, hierarquia, "como ler" |
| Creme bege (`#F1EFEC`) | Glossário, definições formais |
| Branco / sem fundo | Cards numerados (transparente sobre o branco da página), ficha de marca, body |
| Indigo deep (`#3D396E`) | Header de data table (única vez que indigo vira fundo sólido) |

Não invente fundos extras. A paleta é limitada de propósito. Quatro tons em paleta limitada já entrega 100% da expressividade do sistema.

## Espacial: ordem dos componentes em um capítulo típico

Sugestão de ordem ideal de um capítulo de portfólio (varia conforme o tema):

```
[CHAPTER OPENER]
       ↓
[parágrafo de contexto, 2 a 3 linhas]
       ↓
[INDIGO CALLOUT: princípio que organiza o capítulo]
       ↓
[H3 + parágrafo introduzindo a próxima seção]
       ↓
[HIERARCHY DIAGRAM ou TABELA ou CARDS NUMERADOS]
       ↓
[parágrafo de digestão / interpretação do visual]
       ↓
[BRAND ENTRY 1]
[BRAND ENTRY 2]
[BRAND ENTRY 3]
       ↓
[H3 + parágrafo de transição / conclusão do capítulo]
```

Não é prescrição, é referência. Capítulo de framework (papéis, objetivos, dimensões) pode ser quase 100% cards numerados. Capítulo de glossário é 100% glossary cards. Capítulo de pivô estratégico pode ser narrativo com poucos callouts. Use a matriz de decisão para calibrar.
