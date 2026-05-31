/**
 * Soulstory DOCX · Template Starter
 * ==================================
 *
 * Exemplo completo ponta a ponta. Copie este arquivo, troque o conteúdo
 * pelo do projeto, ajuste os componentes conforme necessário e rode com:
 *
 *   node template-starter.js
 *
 * Isso gera `output.docx` no diretório atual. O arquivo demonstra TODOS
 * os componentes da assinatura Soulstory, na ordem em que tipicamente aparecem.
 */

const { Packer } = require('docx');
const fs = require('fs');
const ss = require('./soulstory.js');

// ============================================================================
// MONTAGEM DOS CHILDREN
// ============================================================================

const children = [];

// --- COVER ---
children.push(...ss.cover({
  eyebrow: "EXEMPLO  ·  DOCUMENTO SOULSTORY  ·  MAIO DE 2026",
  titleLine1: "Quem somos,",
  titleLine2: "o que fazemos.",
  bodyIntro: "Este documento existe para mostrar todos os componentes visuais da assinatura Soulstory em um único arquivo. Use como referência ao construir documentos reais, copiando os blocos que servem ao caso e descartando os que não servem.",
  metaRows: [
    { key: "EMPRESA",        value: "Marca Exemplo" },
    { key: "TIPO DOCUMENTO", value: "Demonstração de assinatura" },
    { key: "FONTE",          value: "Template starter" },
    { key: "MÉTODO",         value: "Soulstory Portfolio System" },
    { key: "VERSÃO",         value: "1.0  ·  Maio de 2026" }
  ]
}));

// --- COMO LER ESTE DOCUMENTO (callout) ---
children.push(ss.spacerLarge());
children.push(ss.howToReadCallout([
  "Este template tem três capítulos ilustrativos. O primeiro mostra os componentes de método (callout indigo + cards numerados + tabela de dados). O segundo mostra os componentes de portfólio (hierarquia visual + ficha de marca). O terceiro mostra glossário.",
  "Em todo o texto, expressões marcadas em maiúsculas indigo (Branded Energizer, Linchpin) remetem ao glossário do final do documento."
]));

// ============================================================================
// CAPÍTULO 1 · MÉTODO (cards numerados, callout, tabela de dados)
// ============================================================================

children.push(...ss.chapterOpener({
  number: 1,
  title: "O método que organiza este documento."
}));

children.push(ss.h3("Soulstory Portfolio System."));

children.push(ss.bodyCabin(
  "O Soulstory Portfolio System é o método que organiza este documento. Toda marca recebe um papel, todo movimento é avaliado contra cinco objetivos, e o portfólio inteiro é mapeado em seis dimensões. Na prática, isso significa que decisão de marca aqui nunca é palpite: passa por uma análise estruturada."
));

children.push(ss.bodyCabin(
  "O que esse sistema acrescenta é a leitura narrativa: cada marca do portfólio carrega uma história, e essas histórias precisam conversar entre si para que o ecossistema se sustente."
));

// Callout de princípio
children.push(ss.indigoCallout({
  eyebrow: "PRINCÍPIO QUE ORGANIZA O MÉTODO",
  bodyParagraphs: [
    "A disciplina apresenta opções e issues, não receitas. Não há regras prontas que garantam estratégias perfeitas. Decisões difíceis seguem dependendo de coragem."
  ],
  attribution: "David Aaker, paráfrase do prefácio do Brand Portfolio Strategy."
}));

children.push(ss.spacerMedium());

// Eyebrow + H2 introduzindo o framework
children.push(ss.eyebrow("FRAMEWORK 1  ·  OS 5 PORTFOLIO ROLES"));
children.push(ss.h2("Cada marca recebe um papel."));

children.push(ss.bodyCabin(
  "Antes de criar, despromover ou descontinuar qualquer marca, ela recebe um papel no portfólio. Os papéis não são mutuamente excludentes (uma marca pode ser strategic e energizer ao mesmo tempo) e podem evoluir. Sem papel definido, qualquer marca nova é proliferação."
));

children.push(ss.spacerMedium());

// Cards numerados
children.push(...ss.numberedCardList([
  {
    title: "Strategic Brand",
    body: "Marca cuja saúde é decisiva para o negócio. Subdivide em current power (grande hoje), future power (aposta de amanhã) e linchpin (pivô de uma área inteira)."
  },
  {
    title: "Branded Energizer",
    body: "Marca, pessoa ou programa que injeta energia em outra marca. Não é o produto: é o amplificador. Funciona quando gerido no longo prazo."
  },
  {
    title: "Silver Bullet",
    body: "Subbrand ou endorsed brand cujo papel é mudar a imagem de outra marca do portfólio. O valor está no que ela transfere, não no que ela vende."
  },
  {
    title: "Flanker Brand",
    body: "Marca criada para defender a principal em segmentos específicos, geralmente de valor ou frente de preço, sem comprometer o posicionamento da master."
  },
  {
    title: "Cash Cow",
    body: "Marca leal e estável que gera caixa, gerida com prioridade em eficiência. O caixa que ela libera financia as outras marcas do portfólio."
  }
]));

// ============================================================================
// CAPÍTULO 2 · PORTFÓLIO (hierarquia + ficha de marca + tabela)
// ============================================================================

children.push(...ss.chapterOpener({
  number: 2,
  title: "O portfólio, do fundador às marcas filhas."
}));

children.push(ss.bodyCabin(
  "O fundador acima como driver behind. A empresa como master brand. Três caixinhas filhas operam sob ela. Essa é a estrutura, em uma só vista."
));

children.push(ss.spacerMedium());

children.push(ss.h3("A hierarquia em uma só vista."));

// Diagrama de hierarquia visual
children.push(ss.hierarchyDiagram({
  levels: [
    {
      name: "FUNDADOR",
      tagline: "Branded Energizer  ·  Driver behind",
      size: 26
    },
    {
      name: "EMPRESA-MÃE",
      tagline: "Master brand  ·  Strategic  ·  Linchpin",
      size: 30,
      connector: "↓"
    },
    {
      name: "FILHA 1     FILHA 2     FILHA 3",
      tagline: "Future Power    Cash cow    Subbrand de crescimento",
      size: 22,
      connector: "┌──────────────┼──────────────┐"
    }
  ]
}));

children.push(ss.spacerMedium());

// Ficha de marca (brand entry)
children.push(...ss.brandEntry({
  titleH3: "Fundador.",
  eyebrow: "FUNDADOR  ·  ECONOMIA DA EMOÇÃO",
  displayName: "Nome do Fundador",
  tagline: "19 anos no campo dos sentidos. Cria experiências que deixam latência emocional, e a latência move o resto.",
  roleLabel: "Papel  ·  ",
  roleValue: "Branded Energizer",
  bullets: [
    "Economia da emoção. Não opera por mídia paga nem por discurso de venda: opera pelo que fica em quem assiste. Esse tipo de marca emocional não se compra, se cria.",
    "Latência emocional como ativo. O que ele entrega ao público não termina quando acaba: vira desejo, vira recompra, vira pertencimento. É o motor invisível por trás de toda a operação.",
    "Curador de intensidade. Define o padrão artístico e dirige o que vai pro palco. Os artistas, o time e o mercado entenderam o papel dele de liderar e dirigir, não só de assinar."
  ]
}));

children.push(ss.spacerMedium());

// Tabela de dados
children.push(ss.eyebrow("FICHAS TÉCNICAS  ·  EXEMPLO"));
children.push(ss.h3("O detalhe por artista."));

children.push(ss.bodyCabin(
  "Os números abaixo somam a audiência total. Cada artista tem peso e história próprios. Onde aparece ND, o número não foi localizado em fonte pública confiável até o fechamento desta versão."
));

children.push(ss.spacerSmall());

children.push(ss.dataTable({
  headers: ["ARTISTA", "RECORTE", "OUVINTES MENSAIS (SPOTIFY)"],
  columnWidths: [3200, 3000, 2800],
  rows: [
    ["Artista A", { text: "MPB · Cantor e compositor", style: 'garamond-italic' }, "2,0M"],
    ["Artista B", { text: "Rap · Trap brasileiro",     style: 'garamond-italic' }, "3,2M"],
    ["Artista C", { text: "Rap · Trap",                style: 'garamond-italic' }, "9,6M"],
    ["Artista D", { text: "Produtor · Hip hop",        style: 'garamond-italic' }, "2,4M"],
    ["Artista E", { text: "Maestro · Música clássica", style: 'garamond-italic' }, "ND"]
  ]
}));

// ============================================================================
// CAPÍTULO 3 · GLOSSÁRIO
// ============================================================================

children.push(...ss.chapterOpener({
  number: 3,
  title: "Glossário."
}));

children.push(ss.bodyCabin(
  "Os termos técnicos usados em todo o documento. Cada um traz a definição operacional, exemplos canônicos da literatura de referência e a aplicação no caso aqui em análise."
));

children.push(ss.spacerMedium());

children.push(ss.glossaryCard({
  number: "01",
  metaTag: "PAPEL NO PORTFÓLIO  ·  AAKER · CAPÍTULO 1",
  term: "Branded Energizer",
  definition: "Marca, pessoa ou programa cuja função é injetar energia em outra marca do portfólio. Não é o produto que vende: é o amplificador que faz o produto ser percebido como vivo.",
  examples: "Michael Jordan para a Nike Air Jordan. Steve Jobs para a Apple. Tony Hawk para a Birdhouse.",
  application: "O fundador da empresa exemplo opera como branded energizer. Ele não vende o produto: ele eleva a percepção de tudo que aparece sob a marca."
}));

children.push(ss.spacerMedium());

children.push(ss.glossaryCard({
  number: "02",
  metaTag: "TIPO DE STRATEGIC BRAND  ·  AAKER · CAPÍTULO 1",
  term: "Linchpin",
  definition: "Marca-pivô. Se ela fraqueja, todas as outras marcas conectadas ao portfólio caem junto. Não é a maior em vendas necessariamente: é a que sustenta a coerência do todo.",
  examples: "Sony como linchpin do portfólio Sony. McDonald's como linchpin no portfólio de fast food do grupo.",
  application: "A empresa-mãe é o linchpin do portfólio. Toda receita passa por ela, toda credibilidade com parceiros depende dela."
}));

// ============================================================================
// ENCERRAMENTO
// ============================================================================

children.push(...ss.closingBlock({
  documentTitle: "Documento exemplo Soulstory.",
  versionLine: "Versão 1.0, Maio de 2026. Template de referência construído para demonstrar todos os componentes visuais da assinatura.",
  criticalPendency: "Este é um template. Em documentos reais, esta seção lista o que ainda falta resolver antes da próxima versão."
}));

// ============================================================================
// BUILD E SAVE
// ============================================================================

const doc = ss.buildSoulstoryDoc({
  headerText: "SOULSTORY  ·  TEMPLATE STARTER V1.0  ·  MAIO 2026",
  children
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("output.docx", buffer);
  console.log("✓ output.docx gerado com sucesso.");
}).catch(err => {
  console.error("✗ Erro ao gerar:", err);
  process.exit(1);
});
