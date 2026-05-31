/*
 * Ponte entre o ReportSpec (JSON) e o helper da skill soulstory-docx. Le o
 * contrato produzido pelo pipeline e gera o .docx no padrao indigo Soulstory,
 * reusando scripts/soulstory.js (instalado no repo, commit c935634). Nao
 * recria o sistema visual: apenas mapeia os elementos do ReportSpec para os
 * componentes do helper.
 *
 *   node scripts/soulstory-docx-build.js <report-spec.json> <saida.docx>
 *
 * E o comando apontado por SOULSTORY_DOCX_CMD (ver src/lib/docx/adapter.ts).
 */

const fs = require("fs");
const { Packer, Paragraph, ImageRun, AlignmentType } = require("docx");
const ss = require("../.claude/skills/soulstory-docx/scripts/soulstory.js");

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error("Uso: node scripts/soulstory-docx-build.js <input.json> <output.docx>");
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const graficos = new Map((spec.graficos || []).map((g) => [g.id, g]));

function imagem(caminho) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    children: [
      new ImageRun({
        type: "png",
        data: fs.readFileSync(caminho),
        transformation: { width: 620, height: 347 },
      }),
    ],
  });
}

function tabelaDeDados(g) {
  return ss.dataTable({
    headers: ["Item", "Valor"],
    rows: g.dados.map((d) => [String(d.rotulo), String(d.valor)]),
  });
}

function renderElemento(e) {
  switch (e.tipo) {
    case "paragrafo":
      return [ss.bodyGaramond(e.texto)];
    case "callout":
      return [
        ss.indigoCallout({
          eyebrow: e.eyebrow || "",
          bodyParagraphs: e.paragrafos,
          attribution: e.atribuicao || null,
        }),
      ];
    case "cards": {
      const out = [];
      if (e.titulo) out.push(ss.h4(e.titulo));
      out.push(...ss.numberedCardList(e.itens.map((i) => ({ title: i.titulo, body: i.texto }))));
      out.push(ss.spacerSmall());
      return out;
    }
    case "tabela": {
      const out = [];
      if (e.titulo) out.push(ss.h4(e.titulo));
      out.push(ss.dataTable({ headers: e.cabecalho, rows: e.linhas }));
      out.push(ss.spacerSmall());
      return out;
    }
    case "grafico": {
      const g = graficos.get(e.graficoId);
      if (!g) return [];
      const out = [ss.h4(g.titulo)];
      if (g.caminhoPng && fs.existsSync(g.caminhoPng)) out.push(imagem(g.caminhoPng));
      else out.push(tabelaDeDados(g));
      out.push(ss.bodyCabin(e.legenda || g.descricao));
      out.push(ss.spacerSmall());
      return out;
    }
    case "glossario":
      return e.itens.map((it, i) =>
        ss.glossaryCard({
          number: String(i + 1).padStart(2, "0"),
          metaTag: "LINGUAGEM NATIVA",
          term: it.termo,
          definition: it.definicao,
        }),
      );
    default:
      return [];
  }
}

function renderSecao(s) {
  const out = [ss.h2(s.titulo)];
  const elementos =
    s.elementos && s.elementos.length
      ? s.elementos
      : (s.paragrafos || []).map((p) => ({ tipo: "paragrafo", texto: p }));
  for (const e of elementos) out.push(...renderElemento(e));
  out.push(ss.spacerMedium());
  return out;
}

const children = [];

const janela = `${spec.projeto.janela.inicio.slice(0, 10)} a ${spec.projeto.janela.fim.slice(0, 10)}`;
children.push(
  ...ss.cover({
    eyebrow: `DIAGNOSTICO DE VISAO EXTERNA  ·  ${spec.projeto.nome.toUpperCase()}`,
    titleLine1: spec.subtitulo ? spec.subtitulo.linha1 : "Como a percepcao publica",
    titleLine2: spec.subtitulo ? spec.subtitulo.linha2 : `enxerga ${spec.projeto.nome}.`,
    bodyIntro:
      "Diagnostico de Visao Externa a partir da pegada digital publica. Cada afirmacao e rastreavel a um dado bruto verificado. Metricas que nao sao publicas aparecem declaradas como indisponiveis, nunca estimadas.",
    metaRows: [
      { key: "PROJETO", value: spec.projeto.nome },
      { key: "TIPO", value: spec.projeto.tipo },
      { key: "JANELA", value: janela },
      { key: "GERADO EM", value: spec.geradoEm.slice(0, 10) },
    ],
  }),
);

children.push(
  ss.howToReadCallout([
    "Parte I traz o retrato descritivo. Parte II traz a sintese estrategica formal.",
    "Os anexos trazem o inventario de coleta, os top posts por eixo publico, o Reclame Aqui e o registro de evidencias.",
  ]),
);

children.push(ss.h2("Resumo dos checkpoints"));
children.push(
  ss.dataTable({
    headers: ["#", "Etapa", "Resultado"],
    rows: spec.resumoCheckpoints.map((c) => [String(c.numero), c.titulo, c.resumo]),
  }),
);

children.push(...ss.chapterOpener({ number: 1, title: spec.parteI.titulo }));
for (const s of spec.parteI.secoes) children.push(...renderSecao(s));

children.push(...ss.chapterOpener({ number: 2, title: spec.parteII.titulo }));
for (const s of spec.parteII.secoes) children.push(...renderSecao(s));

children.push(...ss.chapterOpener({ number: 3, title: "Anexos por fonte" }));
for (const a of spec.anexos) {
  children.push(ss.h2(a.titulo));
  children.push(ss.bodyCabin(a.descricao));
  for (const e of a.elementos || []) children.push(...renderElemento(e));
  children.push(ss.spacerMedium());
}

children.push(
  ...ss.closingBlock({
    documentTitle: `Diagnostico de Visao Externa  ·  ${spec.projeto.nome}`,
    versionLine: "V1.0  ·  Visao Externa Soulstory",
    criticalPendency: "Revisar e aprovar antes de circular para o cliente.",
  }),
);

const doc = ss.buildSoulstoryDoc({
  headerText: `SOULSTORY  ·  VISAO EXTERNA  ·  ${spec.projeto.nome.toUpperCase()}`,
  children,
});

Packer.toBuffer(doc)
  .then((buf) => {
    fs.writeFileSync(outputPath, buf);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
