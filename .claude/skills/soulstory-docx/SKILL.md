---
name: soulstory-docx
description: Use esta skill SEMPRE que o usuário pedir para criar um documento .docx com a assinatura Soulstory, ou qualquer deliverable de consultoria de marca, mapa de marcas, portfólio de marcas, plataforma de marca, diretrizes estratégicas, decodificação de valor, brand audit, brand portfolio strategy, brand book ou documento estratégico voltado a orientar o time de marketing. Acione também quando mencionar "documento Soulstory", "no padrão Soulstory", "com a cara da Soulstory", "soulstory style", "soulstory template", "vira docx Soulstory" ou "monta um docx Soulstory". A skill contém o sistema visual completo (paleta indigo, Cabin + EB Garamond + Consolas, callouts indigo, cards numerados, fichas de marca, diagramas de hierarquia, tabelas indigo, glossários, capa e encerramento marcados) e o sistema de linguagem (acessível, sem jargão, sem travessões, orientado a orientar e gerar insights para o time de marketing). Consultar OBRIGATORIAMENTE antes de escrever conteúdo ou rodar código .docx neste padrão.
---

# Soulstory DOCX

Sistema de documentos da Soulstory para consultoria de marca, estratégia e portfólio. Gera arquivos `.docx` com uma assinatura visual reconhecível, linguagem acessível e suporte visual abundante. O documento é uma ferramenta de trabalho do time de marketing, não um artefato decorativo.

## O propósito do documento

O leitor é o time de marketing. Não é o board, não é a agência, não é o cliente final. É a pessoa que vai usar o que está escrito ali pra tomar decisão de calendário, de canal, de copy, de criativo, de prioridade. Cada página precisa responder a duas perguntas, sempre nessa ordem:

1. **Isso me orienta?** (O que eu faço de diferente agora que li isso?)
2. **Isso me dá insight?** (Eu enxergo algo que eu não enxergava antes?)

Se um trecho não responde a uma dessas duas, ele não é necessário e não entra.

## Princípios de linguagem

Antes de escrever qualquer linha do conteúdo, leia o guia completo em `references/language-guide.md`. Em resumo:

A linguagem é acessível e livre de jargão. Quando um termo técnico aparece (Branded Energizer, Linchpin, Future Power, posicionamento, arquétipo, jornada, etc.), ele recebe uma definição operacional na primeira aparição. A definição é uma frase, não um parágrafo. Se o leitor de marketing não entender em uma leitura, a frase precisa ser reescrita.

A voz é ativa. Frases curtas. Parágrafos de no máximo 4 linhas. O documento usa "a marca faz", não "a marca tem como objetivo fazer". Usa "isso significa que", não "depreende-se daí que".

Em todo o texto, o autor jamais usa travessão (—). Para inserir uma pausa, usa vírgula, dois-pontos ou ponto. Quando precisa de uma marca visual de relação, usa o ponto interpunct (·). Esta regra é absoluta.

A conclusão prática vem junto com o conceito. Cada explicação termina com uma linha que o time pode usar. Não há "esse conceito é interessante porque". Há "na prática, isso significa que o time deve...".

## Princípios visuais

O documento é denso de suporte visual. Texto puro corrido é exceção, não regra. Sempre que houver:

- Lista de itens com mesma estrutura → cards numerados (01., 02., 03.)
- Conceito-chave, princípio organizador ou citação → callout indigo
- Relação hierárquica entre marcas, áreas, papéis → diagrama de hierarquia com setas (↓) e conectores (┌─┼─┐) dentro de callout
- Dados quantitativos comparáveis → tabela indigo com header invertido
- Ficha de marca, ficha de pessoa, ficha de produto → bloco de ficha com eyebrow + nome grande + tagline + papel + bullets
- Termo técnico merecendo definição expandida → card de glossário com fundo creme
- Resumo executivo em uma linha → eyebrow indigo + frase única em destaque

A regra é: se você consegue ver o conteúdo como uma imagem mental, ele provavelmente vira componente visual. Se é argumentação corrida com nuance, fica em prosa.

Ao mesmo tempo, suporte visual não é decoração. Cada componente entra porque comunica algo que o texto sozinho comunicaria pior. Se um card numerado teria 3 linhas em cada item, e o conteúdo é só três frases soltas, prefira prosa. O critério é densidade, não vontade de enfeitar.

Leia `references/visual-suggestions.md` antes de decidir quais componentes usar em cada seção. Leia `references/components.md` para ver o catálogo completo com exemplos.

## Fluxo de trabalho

### Passo 1. Confirme o briefing

Antes de qualquer linha de código, valide com o usuário:

1. **Qual é o documento?** (mapa de marcas, plataforma de marca, brand audit, diretrizes, deliverable de pesquisa, etc.)
2. **Qual a marca / projeto / cliente?** (vai no header e no cover)
3. **Qual a versão?** (V1.0, V2.0, etc. Soulstory documenta versão sempre)
4. **Qual o mês de referência?** (vai no header e no cover)
5. **Qual o subtítulo do cover?** O padrão é uma frase em duas linhas, primeira linha em preto, segunda em indigo. Exemplos: "Quem somos, / o que fazemos." ou "Onde estamos, / onde podemos ir." ou "O que somos / e o que ainda não somos."
6. **Quantos capítulos?** (mínimo 3, máximo 8 idealmente)
7. **Tem glossário no final?** (recomendado quando o documento usa 4+ termos técnicos)

Se o usuário já forneceu o conteúdo bruto e só pediu para formatar, pule a validação detalhada. Se forneceu um briefing aberto, faça as perguntas faltantes em UMA mensagem só, com no máximo 4 perguntas (use a tool de elicitação se disponível).

### Passo 2. Carregue os tokens e componentes

Antes de gerar qualquer linha de docx-js, leia em sequência:

1. `references/design-tokens.md` para fixar paleta, fontes e dimensões
2. `references/components.md` para o catálogo de blocos visuais
3. `references/language-guide.md` para checar o tom

### Passo 3. Estruture o documento antes de codar

Em um rascunho mental (ou rabisco no scratchpad), liste:

```
COVER
  · Eyebrow: [VERTICAL] · [MARCA] · [MÊS ANO]
  · Título linha 1: "____"
  · Título linha 2: "____"
  · Body intro: [1 parágrafo, Garamond]
  · Meta-table: 4 a 6 linhas chave/valor
  · "Como ler este documento" (callout)

CAPÍTULO 1: [Nome]
  · Componente A
  · Componente B
  · Callout indigo com princípio
  · ...

CAPÍTULO N: ...

GLOSSÁRIO (opcional)
  · Card 01: [termo]
  · Card 02: [termo]
  · ...

ENCERRAMENTO
  · Linha "DOCUMENTO" + título
  · Linha "PENDÊNCIA CRÍTICA" + nota
  · Marca centralizada "(...) Soulstory · Brand Portfolio System"
```

Só depois desse rascunho, comece a codar.

### Passo 4. Gere com docx-js usando o helper

A skill bundla um módulo helper em `scripts/soulstory.js` com todas as funções pré-construídas: `cover()`, `chapterOpener()`, `eyebrow()`, `h2()`, `bodyCabin()`, `bodyGaramond()`, `numberedCard()`, `indigoCallout()`, `hierarchyDiagram()`, `brandEntry()`, `dataTable()`, `glossaryCard()`, `closingMark()`, `pageBreak()`, e o builder completo `buildSoulstoryDoc()`.

Sempre use o helper. Nunca reimplemente a partir do zero, porque cada função carrega calibrações finas (espaçamentos, line-heights, margens de célula) que não são óbvias por inspeção do XML.

Veja `assets/template-starter.js` para um exemplo completo, ponta a ponta, gerando um documento que reproduz fielmente a assinatura Soulstory.

### Passo 5. Valide e entregue

Após gerar o `.docx`:

1. Rode `python /mnt/skills/public/docx/scripts/office/validate.py <arquivo>` para checar integridade
2. Converta para PDF e renderize as primeiras páginas como imagem para inspecionar o resultado visual (`/mnt/skills/public/docx/scripts/office/soffice.py --headless --convert-to pdf`)
3. Se a inspeção visual mostrar algo fora do padrão (espaçamento, cor, alinhamento), volte ao helper e ajuste a função, não o XML solto
4. Mova o arquivo final para `/mnt/user-data/outputs/` e apresente via `present_files`

## Quando NÃO usar esta skill

- Documento corporativo genérico que o usuário quer só "bem formatado" → use a skill `docx` pública
- Pitch deck de vendas, slides, apresentação → use `pptx` ou `aula-pptx-builder`
- Sales page, landing page, VSL, email, carrossel, qualquer copy de venda direta → use a skill correspondente de copywriting
- Relatório acadêmico, paper, artigo científico → não é Soulstory, é outro padrão

A assinatura Soulstory é específica para documentos de orientação estratégica voltados a times de marketing. Se o pedido não cabe nesse perfil, dispense esta skill e use a apropriada.

## Referências internas

- `references/design-tokens.md` — paleta, fontes, dimensões, todos os valores numéricos
- `references/components.md` — catálogo de blocos visuais com snippets de uso
- `references/language-guide.md` — guia de tom, vocabulário, regras de redação
- `references/visual-suggestions.md` — guia de quando usar qual componente
- `scripts/soulstory.js` — módulo helper com todas as funções de geração
- `assets/template-starter.js` — exemplo completo ponta a ponta
