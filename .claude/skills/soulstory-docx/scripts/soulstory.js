/**
 * Soulstory DOCX Helper
 * =====================
 *
 * Módulo helper para gerar documentos .docx no padrão visual Soulstory.
 *
 * Como usar:
 *   const ss = require('./soulstory.js');
 *
 *   const sections = [];
 *   sections.push(...ss.cover({ eyebrow, titleLine1, titleLine2, bodyIntro, metaRows }));
 *   sections.push(...ss.chapterOpener({ number: 1, title: "..." }));
 *   sections.push(ss.bodyCabin("..."));
 *   sections.push(ss.indigoCallout({ eyebrow, bodyParagraphs, attribution }));
 *   ...
 *
 *   const doc = ss.buildSoulstoryDoc({
 *     headerText: "SOULSTORY  ·  MAPA DE MARCAS NOVO TRAÇO V3.0  ·  MAIO 2026",
 *     children: sections
 *   });
 *
 *   Packer.toBuffer(doc).then(buf => fs.writeFileSync("out.docx", buf));
 *
 * Cada função retorna um Paragraph, um Table, ou um array de Paragraph/Table.
 * Sempre use spread (...) ao incluir o retorno em children.
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  HeadingLevel, PageNumber, PageBreak, VerticalAlign, TabStopType, TabStopPosition
} = require('docx');

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const T = {
  // Cores (sem #)
  INDIGO_DEEP: '3d396e',
  INDIGO_BRIGHT: '5c6fcf',
  INDIGO_LIGHT: '8e9fee',
  INDIGO_LAVENDER: 'e1e4f6',
  INDIGO_DIVIDER: 'bfc3dc',
  TEXT_DEEPEST: '0c0b14',
  TEXT_BODY: '2a2934',
  TEXT_META: '7c7a88',
  DIVIDER_GREY: 'd8d6d9',
  CREAM_BG: 'f1efec',
  OFF_WHITE: 'faf8f5',

  // Fontes
  CABIN: 'Cabin',
  GARAMOND: 'EB Garamond',
  CONSOLAS: 'Consolas',
  UNICODE_FALLBACK: 'Arial Unicode MS',

  // Página A4
  PAGE_W: 11906,
  PAGE_H: 16838,
  MARGIN: 1440,
  HEADER_OFFSET: 708,
  FOOTER_OFFSET: 708,
  CONTENT_WIDTH: 9000  // largura útil pra tabelas (9026 disponível, usamos 9000 redondo)
};

// ============================================================================
// HELPERS BÁSICOS DE TEXTO
// ============================================================================

/**
 * Cria um TextRun com formatação especificada.
 * Atalho para evitar repetição.
 */
function run(text, opts = {}) {
  return new TextRun({
    text,
    font: opts.font || T.CABIN,
    size: opts.size || 24,
    bold: opts.bold || false,
    italics: opts.italics || false,
    color: opts.color || T.TEXT_BODY
  });
}

/**
 * Cria múltiplos TextRun a partir de um array de objetos.
 * Útil quando uma linha tem várias formatações lado a lado.
 */
function runs(items) {
  return items.map(item => run(item.text, item));
}

// ============================================================================
// 1. COVER (CAPA)
// ============================================================================

/**
 * Gera a capa completa do documento.
 *
 * @param {Object} opts
 * @param {string} opts.eyebrow         Texto pequeno acima do título (ex: "PORTFÓLIO DE MARCAS  ·  NOVO TRAÇO  ·  MAIO DE 2026")
 * @param {string} opts.titleLine1      Primeira linha do título (cor preto)
 * @param {string} opts.titleLine2      Segunda linha do título (cor indigo)
 * @param {string} opts.bodyIntro       Parágrafo de introdução em EB Garamond
 * @param {Array<{key: string, value: string}>} opts.metaRows  Linhas chave/valor da meta-table
 *
 * @returns {Array} Array de Paragraph e Table para inserir em children
 */
function cover({ eyebrow, titleLine1, titleLine2, bodyIntro, metaRows }) {
  const elements = [];

  // Spacing inicial
  elements.push(new Paragraph({
    spacing: { after: 800, before: 0 },
    children: []
  }));

  // Marca "(...)" gigante alinhada à direita
  elements.push(new Paragraph({
    spacing: { after: 0, before: 0 },
    alignment: AlignmentType.RIGHT,
    children: [run("(…)", { font: T.GARAMOND, italics: true, color: T.INDIGO_LIGHT, size: 200 })]
  }));

  // Espaço entre marca e eyebrow
  elements.push(new Paragraph({
    spacing: { after: 200, before: 0 },
    children: []
  }));

  // Eyebrow
  elements.push(new Paragraph({
    spacing: { after: 120, before: 0 },
    children: [run(eyebrow, { font: T.CONSOLAS, bold: true, color: T.INDIGO_DEEP, size: 17 })]
  }));

  // Título linha 1
  elements.push(new Paragraph({
    spacing: { after: 0, before: 0 },
    children: [run(titleLine1, { font: T.CABIN, bold: false, color: T.TEXT_DEEPEST, size: 96 })]
  }));

  // Título linha 2
  elements.push(new Paragraph({
    spacing: { after: 320, before: 0 },
    children: [run(titleLine2, { font: T.CABIN, bold: false, color: T.INDIGO_DEEP, size: 96 })]
  }));

  // Body intro em Garamond
  elements.push(new Paragraph({
    spacing: { after: 480, before: 0, line: 360 },
    children: [run(bodyIntro, { font: T.GARAMOND, color: T.TEXT_BODY, size: 24 })]
  }));

  // Divisor sutil indigo
  elements.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: T.INDIGO_DIVIDER, space: 1 } },
    spacing: { after: 200, before: 0 },
    children: []
  }));

  // Meta-table chave/valor
  elements.push(metaTable(metaRows));

  return elements;
}

/**
 * Tabela meta de chave/valor usada apenas no cover.
 */
function metaTable(rows) {
  return new Table({
    width: { size: T.CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [3000, 6000],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' }
    },
    rows: rows.map(({ key, value }) => new TableRow({
      children: [
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          borders: cellBordersWithBottom(T.DIVIDER_GREY),
          margins: { top: 120, left: 0, bottom: 120, right: 200 },
          children: [new Paragraph({
            children: [run(key, { font: T.CONSOLAS, bold: true, color: T.TEXT_META, size: 15 })]
          })]
        }),
        new TableCell({
          width: { size: 6000, type: WidthType.DXA },
          borders: cellBordersWithBottom(T.DIVIDER_GREY),
          margins: { top: 120, left: 0, bottom: 120, right: 0 },
          children: [new Paragraph({
            children: [run(value, { font: T.CABIN, bold: true, color: T.TEXT_DEEPEST, size: 22 })]
          })]
        })
      ]
    }))
  });
}

// ============================================================================
// 2. INDIGO CALLOUT
// ============================================================================

/**
 * Callout indigo: barra lateral grossa + fundo lavanda.
 * Usado para princípios, citações, frase-âncora, "como ler este documento".
 *
 * @param {Object} opts
 * @param {string} opts.eyebrow          Texto em maiúsculas no topo (Consolas indigo)
 * @param {Array<string|Object>} opts.bodyParagraphs  Parágrafos do corpo. String = Garamond italic. Objeto = { text, style: 'cabin'|'garamond-italic' }
 * @param {string} [opts.attribution]    Atribuição opcional ao final (Garamond italic grey)
 *
 * @returns {Table}
 */
function indigoCallout({ eyebrow, bodyParagraphs, attribution }) {
  const cellChildren = [];

  if (eyebrow) {
    cellChildren.push(new Paragraph({
      spacing: { after: 100, before: 0 },
      children: [run(eyebrow, { font: T.CONSOLAS, bold: true, color: T.INDIGO_DEEP, size: 16 })]
    }));
  }

  bodyParagraphs.forEach((para, idx) => {
    const isLast = idx === bodyParagraphs.length - 1;
    const isPlainString = typeof para === 'string';
    const style = isPlainString ? 'garamond-italic' : (para.style || 'garamond-italic');
    const text = isPlainString ? para : para.text;

    let runOpts;
    if (style === 'cabin') {
      runOpts = { font: T.CABIN, color: T.TEXT_BODY, size: 22 };
    } else if (style === 'garamond-regular') {
      runOpts = { font: T.GARAMOND, color: T.TEXT_DEEPEST, size: 24 };
    } else {
      // garamond-italic (default)
      runOpts = { font: T.GARAMOND, italics: true, color: T.TEXT_DEEPEST, size: 26 };
    }

    cellChildren.push(new Paragraph({
      spacing: { after: isLast && !attribution ? 0 : 160, before: 0, line: 380 },
      children: [run(text, runOpts)]
    }));
  });

  if (attribution) {
    cellChildren.push(new Paragraph({
      spacing: { after: 0, before: 0 },
      children: [run(attribution, { font: T.GARAMOND, italics: true, color: T.TEXT_META, size: 18 })]
    }));
  }

  return new Table({
    width: { size: T.CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [T.CONTENT_WIDTH],
    borders: hiddenTableBorders(),
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: T.CONTENT_WIDTH, type: WidthType.DXA },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          left: { style: BorderStyle.SINGLE, size: 24, color: T.INDIGO_DEEP },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
        },
        shading: { type: ShadingType.CLEAR, fill: T.INDIGO_LAVENDER, color: 'auto' },
        margins: { top: 220, left: 320, bottom: 220, right: 320 },
        children: cellChildren
      })]
    })]
  });
}

/**
 * Atalho específico para o callout "Como ler este documento".
 */
function howToReadCallout(textParagraphs) {
  return indigoCallout({
    eyebrow: "COMO LER ESTE DOCUMENTO",
    bodyParagraphs: textParagraphs.map(t => ({ text: t, style: 'cabin' })),
    attribution: null
  });
}

// ============================================================================
// 3. CHAPTER OPENER
// ============================================================================

/**
 * Abertura de capítulo: quebra de página + eyebrow + H1 grande.
 *
 * @param {Object} opts
 * @param {number} opts.number  Número do capítulo (1, 2, 3...)
 * @param {string} opts.title   Título do capítulo (com ponto final)
 *
 * @returns {Array<Paragraph>}
 */
function chapterOpener({ number, title }) {
  return [
    new Paragraph({
      children: [new PageBreak()]
    }),
    new Paragraph({
      spacing: { after: 120, before: 0 },
      children: [run(`CAPÍTULO ${number}`, { font: T.CONSOLAS, bold: true, color: T.INDIGO_DEEP, size: 17 })]
    }),
    new Paragraph({
      spacing: { after: 220, before: 360 },
      children: [run(title, { font: T.CABIN, bold: false, color: T.TEXT_DEEPEST, size: 56 })]
    })
  ];
}

// ============================================================================
// 4. EYEBROW + H2
// ============================================================================

/**
 * Eyebrow standalone (Consolas bold indigo pequeno).
 */
function eyebrow(text) {
  return new Paragraph({
    spacing: { after: 120, before: 360 },
    children: [run(text, { font: T.CONSOLAS, bold: true, color: T.INDIGO_DEEP, size: 17 })]
  });
}

/**
 * H2 framework: Cabin regular grande.
 */
function h2(text) {
  return new Paragraph({
    spacing: { after: 160, before: 0 },
    children: [run(text, { font: T.CABIN, bold: false, color: T.TEXT_DEEPEST, size: 40 })]
  });
}

/**
 * H3 subsection: Cabin bold médio.
 */
function h3(text) {
  return new Paragraph({
    spacing: { after: 120, before: 240 },
    children: [run(text, { font: T.CABIN, bold: true, color: T.TEXT_DEEPEST, size: 28 })]
  });
}

/**
 * H4 sub-subsection: Cabin bold pequeno em indigo.
 */
function h4(text) {
  return new Paragraph({
    spacing: { after: 80, before: 180 },
    children: [run(text, { font: T.CABIN, bold: true, color: T.INDIGO_DEEP, size: 22 })]
  });
}

// ============================================================================
// 5. BODY PARAGRAPHS
// ============================================================================

/**
 * Parágrafo de body em Cabin (corpo padrão).
 */
function bodyCabin(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 200, before: 0, line: 320 },
    children: [run(text, { font: T.CABIN, color: T.TEXT_BODY, size: 24 })]
  });
}

/**
 * Parágrafo de body em Garamond regular (variação editorial).
 */
function bodyGaramond(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 200, before: 0, line: 360 },
    children: [run(text, { font: T.GARAMOND, color: T.TEXT_BODY, size: 24 })]
  });
}

/**
 * Parágrafo de body com runs mistos (negrito inline, indigo inline, etc).
 *
 * @param {Array<Object>} parts  Array de objetos { text, bold?, italics?, color?, font?, size? }
 */
function bodyMixed(parts, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 200, before: 0, line: 320 },
    children: parts.map(p => run(p.text, {
      font: p.font || T.CABIN,
      bold: p.bold || false,
      italics: p.italics || false,
      color: p.color || T.TEXT_BODY,
      size: p.size || 24
    }))
  });
}

// ============================================================================
// 6. NUMBERED CARDS
// ============================================================================

/**
 * Card numerado (item de lista estruturada).
 * Para gerar uma série, chame esta função uma vez por item e
 * intercale com `spacerSmall()` entre eles.
 *
 * @param {Object} opts
 * @param {string} opts.number  "01.", "02.", "03." etc
 * @param {string} opts.title   Título do item (Cabin bold)
 * @param {string} opts.body    Descrição do item (Cabin regular)
 *
 * @returns {Table}
 */
function numberedCard({ number, title, body }) {
  return new Table({
    width: { size: T.CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [600, 8400],
    borders: hiddenTableBorders(),
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 600, type: WidthType.DXA },
          borders: invisibleCellBorders(),
          margins: { top: 100, left: 0, bottom: 100, right: 80 },
          verticalAlign: VerticalAlign.TOP,
          children: [new Paragraph({
            spacing: { after: 0, before: 60 },
            children: [run(number, { font: T.CONSOLAS, bold: true, color: T.INDIGO_DEEP, size: 19 })]
          })]
        }),
        new TableCell({
          width: { size: 8400, type: WidthType.DXA },
          borders: invisibleCellBorders(),
          margins: { top: 100, left: 80, bottom: 100, right: 0 },
          children: [
            new Paragraph({
              spacing: { after: 60, before: 0 },
              children: [run(title, { font: T.CABIN, bold: true, color: T.TEXT_DEEPEST, size: 23 })]
            }),
            new Paragraph({
              spacing: { after: 0, before: 0, line: 320 },
              children: [run(body, { font: T.CABIN, color: T.TEXT_BODY, size: 21 })]
            })
          ]
        })
      ]
    })]
  });
}

/**
 * Gera uma lista de numbered cards com espaçamento entre eles.
 *
 * @param {Array<{title: string, body: string}>} items
 * @returns {Array<Table|Paragraph>}
 */
function numberedCardList(items) {
  const result = [];
  items.forEach((item, idx) => {
    const num = String(idx + 1).padStart(2, '0') + '.';
    result.push(numberedCard({ number: num, title: item.title, body: item.body }));
    if (idx < items.length - 1) {
      result.push(spacerSmall());
    }
  });
  return result;
}

// ============================================================================
// 7. BRAND ENTRY (FICHA DE MARCA)
// ============================================================================

/**
 * Ficha de marca: H3 + eyebrow + display name grande + tagline + papel + bullets.
 *
 * @param {Object} opts
 * @param {string} opts.titleH3       H3 com nome curto + ponto. Ex: "Rafaello."
 * @param {string} opts.eyebrow       Eyebrow em Consolas. Ex: "FUNDADOR  ·  ECONOMIA DA EMOÇÃO"
 * @param {string} opts.displayName   Display name grande. Ex: "Rafaello"
 * @param {string} opts.tagline       Tagline em Garamond italic
 * @param {string} opts.roleLabel     Label do papel. Ex: "Papel  ·  " (mantenha o `  ·  ` no final)
 * @param {string} opts.roleValue     Valor do papel em indigo bold. Ex: "Branded Energizer"
 * @param {Array<string>} opts.bullets  Lista de fatos/argumentos. Cada um vira uma linha com bullet customizado.
 *
 * @returns {Array<Paragraph>}
 */
function brandEntry({ titleH3, eyebrow: eyebrowText, displayName, tagline, roleLabel, roleValue, bullets }) {
  const result = [];

  // H3
  result.push(new Paragraph({
    spacing: { after: 120, before: 240 },
    children: [run(titleH3, { font: T.CABIN, bold: true, color: T.TEXT_DEEPEST, size: 28 })]
  }));

  // Eyebrow
  result.push(new Paragraph({
    spacing: { after: 120, before: 0 },
    children: [run(eyebrowText, { font: T.CONSOLAS, bold: true, color: T.INDIGO_DEEP, size: 16 })]
  }));

  // Display name (grande)
  result.push(new Paragraph({
    spacing: { after: 120, before: 0 },
    children: [run(displayName, { font: T.CABIN, bold: false, color: T.TEXT_DEEPEST, size: 44 })]
  }));

  // Tagline italic
  result.push(new Paragraph({
    spacing: { after: 200, before: 0, line: 320 },
    children: [run(tagline, { font: T.GARAMOND, italics: true, color: T.TEXT_BODY, size: 24 })]
  }));

  // Linha de papel
  result.push(new Paragraph({
    spacing: { after: 200, before: 0 },
    children: [
      run(roleLabel, { font: T.CONSOLAS, bold: true, color: T.TEXT_META, size: 16 }),
      run(roleValue, { font: T.CABIN, bold: true, color: T.INDIGO_DEEP, size: 22 })
    ]
  }));

  // Bullets customizados
  bullets.forEach(bulletText => {
    result.push(new Paragraph({
      spacing: { after: 140, before: 0, line: 320 },
      indent: { left: 80, firstLine: 0 },
      children: [
        run("·  ", { font: T.CABIN, bold: true, color: T.INDIGO_BRIGHT, size: 22 }),
        run(bulletText, { font: T.CABIN, color: T.TEXT_BODY, size: 21 })
      ]
    }));
  });

  return result;
}

// ============================================================================
// 8. HIERARCHY DIAGRAM
// ============================================================================

/**
 * Diagrama de hierarquia dentro de callout indigo.
 *
 * @param {Object} opts
 * @param {Array<Object>} opts.levels  Array de níveis. Cada nível tem:
 *                                       { name, tagline, size? (sz para o name: default 26), connector? (string que vem ANTES, opcional) }
 *
 * Exemplo:
 *   hierarchyDiagram({
 *     levels: [
 *       { name: "RAFAELLO", tagline: "Branded Energizer  ·  Driver behind", size: 26 },
 *       { name: "NOVO TRAÇO", tagline: "Master brand  ·  Strategic  ·  Linchpin", size: 30, connector: "↓" },
 *       { name: "NT RECORDS    NT ON DEMAND    NT EDUCATION", tagline: "Future Power    Cash cow    Subbrand", size: 22, connector: "┌──────────────┼──────────────┐" }
 *     ]
 *   })
 *
 * @returns {Table}
 */
function hierarchyDiagram({ levels }) {
  const cellChildren = [];

  levels.forEach((level, idx) => {
    // Conector ANTES do nível (se não for o primeiro)
    if (level.connector) {
      cellChildren.push(new Paragraph({
        spacing: { after: 200, before: 0 },
        alignment: AlignmentType.CENTER,
        children: [run(level.connector, {
          font: T.UNICODE_FALLBACK,
          color: T.INDIGO_BRIGHT,
          size: 22
        })]
      }));
    }

    // Nome do nó
    cellChildren.push(new Paragraph({
      spacing: { after: 60, before: 0 },
      alignment: AlignmentType.CENTER,
      children: [run(level.name, {
        font: T.CABIN,
        bold: true,
        color: T.INDIGO_DEEP,
        size: level.size || 26
      })]
    }));

    // Tagline
    if (level.tagline) {
      const isLast = idx === levels.length - 1;
      cellChildren.push(new Paragraph({
        spacing: { after: isLast ? 0 : 200, before: 0 },
        alignment: AlignmentType.CENTER,
        children: [run(level.tagline, {
          font: T.GARAMOND,
          italics: true,
          color: T.TEXT_META,
          size: 18
        })]
      }));
    }
  });

  return new Table({
    width: { size: T.CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [T.CONTENT_WIDTH],
    borders: hiddenTableBorders(),
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: T.CONTENT_WIDTH, type: WidthType.DXA },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          left: { style: BorderStyle.SINGLE, size: 24, color: T.INDIGO_DEEP },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
        },
        shading: { type: ShadingType.CLEAR, fill: T.INDIGO_LAVENDER, color: 'auto' },
        margins: { top: 320, left: 320, bottom: 320, right: 320 },
        children: cellChildren
      })]
    })]
  });
}

// ============================================================================
// 9. DATA TABLE
// ============================================================================

/**
 * Tabela de dados com header indigo invertido.
 *
 * @param {Object} opts
 * @param {Array<string>} opts.headers          Textos das colunas do header
 * @param {Array<Array<Object|string>>} opts.rows  Linhas de dados. Cada célula pode ser:
 *                                                   - string (vira Cabin bold preto)
 *                                                   - { text, style: 'cabin-bold'|'cabin'|'garamond-italic' }
 * @param {Array<number>} opts.columnWidths     Largura de cada coluna em DXA. Soma = 9000.
 *
 * @returns {Table}
 */
function dataTable({ headers, rows, columnWidths }) {
  if (!columnWidths) {
    // Distribui igualmente se não especificado
    const colW = Math.floor(T.CONTENT_WIDTH / headers.length);
    columnWidths = headers.map((_, idx) =>
      idx === headers.length - 1 ? T.CONTENT_WIDTH - (colW * (headers.length - 1)) : colW
    );
  }

  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((headerText, idx) => new TableCell({
      width: { size: columnWidths[idx], type: WidthType.DXA },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: T.INDIGO_DEEP },
        left: { style: BorderStyle.SINGLE, size: 4, color: T.INDIGO_DEEP },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: T.INDIGO_DEEP },
        right: { style: BorderStyle.SINGLE, size: 4, color: T.INDIGO_DEEP }
      },
      shading: { type: ShadingType.CLEAR, fill: T.INDIGO_DEEP, color: 'auto' },
      margins: { top: 140, left: 200, bottom: 140, right: 200 },
      children: [new Paragraph({
        children: [run(headerText, { font: T.CONSOLAS, bold: true, color: T.OFF_WHITE, size: 14 })]
      })]
    }))
  });

  // Body rows
  const bodyRows = rows.map(rowData => new TableRow({
    children: rowData.map((cell, idx) => {
      const cellText = typeof cell === 'string' ? cell : cell.text;
      const style = typeof cell === 'string' ? 'cabin-bold' : (cell.style || 'cabin-bold');

      let runOpts;
      if (style === 'cabin') {
        runOpts = { font: T.CABIN, color: T.TEXT_BODY, size: 22 };
      } else if (style === 'garamond-italic') {
        runOpts = { font: T.GARAMOND, italics: true, color: T.TEXT_META, size: 22 };
      } else {
        // cabin-bold (default)
        runOpts = { font: T.CABIN, bold: true, color: T.TEXT_DEEPEST, size: 22 };
      }

      return new TableCell({
        width: { size: columnWidths[idx], type: WidthType.DXA },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: T.DIVIDER_GREY },
          left: { style: BorderStyle.SINGLE, size: 4, color: T.DIVIDER_GREY },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: T.DIVIDER_GREY },
          right: { style: BorderStyle.SINGLE, size: 4, color: T.DIVIDER_GREY }
        },
        shading: { type: ShadingType.CLEAR, fill: 'ffffff', color: 'auto' },
        margins: { top: 120, left: 200, bottom: 120, right: 200 },
        children: [new Paragraph({
          children: [run(cellText, runOpts)]
        })]
      });
    })
  }));

  return new Table({
    width: { size: T.CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths,
    borders: hiddenTableBorders(),
    rows: [headerRow, ...bodyRows]
  });
}

// ============================================================================
// 10. GLOSSARY CARD
// ============================================================================

/**
 * Card de glossário: fundo creme, barra lateral indigo.
 *
 * @param {Object} opts
 * @param {string} opts.number       Número de 2 dígitos: "01", "02", "03"
 * @param {string} opts.metaTag      Meta-tag em grafite, ex: "PAPEL NO PORTFÓLIO  ·  AAKER · CAPÍTULO 1"
 * @param {string} opts.term         Nome do termo, ex: "Branded Energizer"
 * @param {string} opts.definition   Texto após "Definição." (Cabin regular)
 * @param {string} opts.examples     Texto após "Exemplos." (Garamond italic)
 * @param {string} opts.application  Texto após "Aplicação no portfólio." (Cabin regular)
 *
 * @returns {Table}
 */
function glossaryCard({ number, metaTag, term, definition, examples, application }) {
  const cellChildren = [];

  // Header: número + meta-tag
  cellChildren.push(new Paragraph({
    spacing: { after: 100, before: 0 },
    children: [
      run(number, { font: T.CONSOLAS, bold: true, color: T.INDIGO_DEEP, size: 18 }),
      run(`   ${metaTag}`, { font: T.CONSOLAS, bold: true, color: T.TEXT_META, size: 14 })
    ]
  }));

  // Term name
  cellChildren.push(new Paragraph({
    spacing: { after: 200, before: 0 },
    children: [run(term, { font: T.CABIN, color: T.TEXT_DEEPEST, size: 32 })]
  }));

  // Definição
  if (definition) {
    cellChildren.push(new Paragraph({
      spacing: { after: 160, before: 0, line: 320 },
      children: [
        run("Definição.  ", { font: T.CABIN, bold: true, color: T.INDIGO_DEEP, size: 22 }),
        run(definition, { font: T.CABIN, color: T.TEXT_BODY, size: 22 })
      ]
    }));
  }

  // Exemplos
  if (examples) {
    cellChildren.push(new Paragraph({
      spacing: { after: 160, before: 0, line: 320 },
      children: [
        run("Exemplos.  ", { font: T.CABIN, bold: true, color: T.INDIGO_DEEP, size: 22 }),
        run(examples, { font: T.GARAMOND, italics: true, color: T.TEXT_BODY, size: 22 })
      ]
    }));
  }

  // Aplicação
  if (application) {
    cellChildren.push(new Paragraph({
      spacing: { after: 0, before: 0, line: 320 },
      children: [
        run("Aplicação no portfólio.  ", { font: T.CABIN, bold: true, color: T.INDIGO_DEEP, size: 22 }),
        run(application, { font: T.CABIN, color: T.TEXT_BODY, size: 22 })
      ]
    }));
  }

  return new Table({
    width: { size: T.CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [T.CONTENT_WIDTH],
    borders: hiddenTableBorders(),
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: T.CONTENT_WIDTH, type: WidthType.DXA },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: T.DIVIDER_GREY },
          left: { style: BorderStyle.SINGLE, size: 24, color: T.INDIGO_DEEP },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: T.DIVIDER_GREY },
          right: { style: BorderStyle.SINGLE, size: 4, color: T.DIVIDER_GREY }
        },
        shading: { type: ShadingType.CLEAR, fill: T.CREAM_BG, color: 'auto' },
        margins: { top: 280, left: 320, bottom: 280, right: 320 },
        children: cellChildren
      })]
    })]
  });
}

// ============================================================================
// 11. CLOSING BLOCK
// ============================================================================

/**
 * Bloco de encerramento: DOCUMENTO + título + versionLine + pendência crítica + marca centralizada.
 *
 * @param {Object} opts
 * @param {string} opts.documentTitle    Título curto do documento (ex: "Mapa de marcas Novo Traço.")
 * @param {string} opts.versionLine      Linha de versão (ex: "Versão 3.0, Maio de 2026...")
 * @param {string} [opts.criticalPendency]  Pendência crítica opcional
 *
 * @returns {Array<Paragraph|Table>}
 */
function closingBlock({ documentTitle, versionLine, criticalPendency }) {
  const result = [];

  // Quebra de página antes de fechar
  result.push(new Paragraph({
    children: [new PageBreak()]
  }));

  // Divisor
  result.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: T.DIVIDER_GREY, space: 1 } },
    spacing: { after: 240, before: 200 },
    children: []
  }));

  // DOCUMENTO
  result.push(new Paragraph({
    spacing: { after: 80, before: 0 },
    children: [run("DOCUMENTO", { font: T.CONSOLAS, bold: true, color: T.INDIGO_DEEP, size: 15 })]
  }));

  // Título do documento
  result.push(new Paragraph({
    spacing: { after: 120, before: 0 },
    children: [run(documentTitle, { font: T.CABIN, bold: true, color: T.TEXT_DEEPEST, size: 28 })]
  }));

  // Linha de versão
  result.push(new Paragraph({
    spacing: { after: 320, before: 0, line: 320 },
    children: [run(versionLine, { font: T.CABIN, color: T.TEXT_BODY, size: 22 })]
  }));

  if (criticalPendency) {
    result.push(new Paragraph({
      spacing: { after: 80, before: 0 },
      children: [run("PENDÊNCIA CRÍTICA", { font: T.CONSOLAS, bold: true, color: T.INDIGO_DEEP, size: 15 })]
    }));

    result.push(new Paragraph({
      spacing: { after: 320, before: 0, line: 320 },
      children: [run(criticalPendency, { font: T.CABIN, color: T.TEXT_BODY, size: 22 })]
    }));
  }

  // Marca centralizada de encerramento
  result.push(spacerLarge());
  result.push(closingMark());

  return result;
}

/**
 * Marca de encerramento centralizada: "(...) Soulstory · Brand Portfolio System"
 */
function closingMark(signature = "Soulstory  ·  Brand Portfolio System") {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200, before: 0 },
    children: [
      run("(…)", { font: T.GARAMOND, italics: true, color: T.INDIGO_LIGHT, size: 36 }),
      run("   ", { font: T.CABIN }),
      run(signature, { font: T.GARAMOND, italics: true, color: T.TEXT_META, size: 18 })
    ]
  });
}

// ============================================================================
// 12. UTILITIES (espaçamento, bordas, etc)
// ============================================================================

function spacerSmall() {
  return new Paragraph({
    spacing: { after: 120, before: 0 },
    children: []
  });
}

function spacerMedium() {
  return new Paragraph({
    spacing: { after: 240, before: 0 },
    children: []
  });
}

function spacerLarge() {
  return new Paragraph({
    spacing: { after: 480, before: 0 },
    children: []
  });
}

function hiddenTableBorders() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' }
  };
}

function invisibleCellBorders() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
  };
}

function cellBordersWithBottom(color) {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
  };
}

// ============================================================================
// HEADER / FOOTER
// ============================================================================

/**
 * Constrói o header do documento.
 *
 * @param {string} headerText  Texto que aparece no header. Ex: "SOULSTORY  ·  MAPA DE MARCAS NOVO TRAÇO V3.0  ·  MAIO 2026"
 */
function buildHeader(headerText) {
  return new Header({
    children: [new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: T.DIVIDER_GREY, space: 4 } },
      children: [run(headerText, { font: T.CONSOLAS, color: T.TEXT_META, size: 14 })]
    })]
  });
}

/**
 * Constrói o footer do documento com marca "(...)" + numeração.
 */
function buildFooter() {
  return new Footer({
    children: [new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: T.DIVIDER_GREY, space: 6 } },
      children: [
        run("(…)", { font: T.GARAMOND, italics: true, color: T.INDIGO_LIGHT, size: 22 }),
        run("Página ", { font: T.CONSOLAS, color: T.TEXT_META, size: 14 }),
        new TextRun({ children: [PageNumber.CURRENT], font: T.CONSOLAS, color: T.TEXT_META, size: 14 }),
        run(" de ", { font: T.CONSOLAS, color: T.TEXT_META, size: 14 }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: T.CONSOLAS, color: T.TEXT_META, size: 14 })
      ]
    })]
  });
}

// ============================================================================
// BUILDER PRINCIPAL
// ============================================================================

/**
 * Monta o documento completo com page settings, header, footer e o conteúdo.
 *
 * @param {Object} opts
 * @param {string} opts.headerText  Texto do header
 * @param {Array} opts.children     Array de Paragraph e Table do conteúdo
 *
 * @returns {Document}
 */
function buildSoulstoryDoc({ headerText, children }) {
  return new Document({
    styles: {
      default: {
        document: {
          run: { font: T.CABIN, size: 22, color: T.TEXT_BODY }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          size: { width: T.PAGE_W, height: T.PAGE_H },
          margin: {
            top: T.MARGIN, right: T.MARGIN, bottom: T.MARGIN, left: T.MARGIN,
            header: T.HEADER_OFFSET, footer: T.FOOTER_OFFSET
          }
        }
      },
      headers: { default: buildHeader(headerText) },
      footers: { default: buildFooter() },
      children
    }]
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Tokens (caso precise customizar)
  T,

  // Componentes de bloco
  cover,
  chapterOpener,
  indigoCallout,
  howToReadCallout,
  numberedCard,
  numberedCardList,
  brandEntry,
  hierarchyDiagram,
  dataTable,
  glossaryCard,
  closingBlock,
  closingMark,
  metaTable,

  // Componentes de tipografia
  eyebrow,
  h2,
  h3,
  h4,
  bodyCabin,
  bodyGaramond,
  bodyMixed,

  // Utilities
  spacerSmall,
  spacerMedium,
  spacerLarge,
  run,
  runs,

  // Builder
  buildSoulstoryDoc,
  buildHeader,
  buildFooter
};
