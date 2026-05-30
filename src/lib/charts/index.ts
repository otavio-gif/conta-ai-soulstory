// Gerador de graficos no padrao visual Soulstory (PRD secao 3.3 e skill
// chart-builder-soulstory). Desenha SVG na paleta indigo do Design System 2.0 e
// rasteriza para PNG com @resvg/resvg-js (sem dependencia nativa de build).
// Eleva o padrao de entrega (Fase 4): paleta canonica, tipos donut, area,
// distribuicao e barras horizontais, rotulos legiveis em pt-BR, grid, eixos com
// escala, legenda e rotulos de dado. Cada grafico carrega os dados que o
// originaram, para anexo e para o fallback de tabela no docx.

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import type { GraficoRef } from "@/lib/pipeline/types";

// Paleta canonica do Design System 2.0 (src/styles/soulstory-tokens.css).
const INDIGO = "#3d396e"; // Indigo Authority, cor de marca
const PERIWINKLE = "#8e9fee"; // Lavender Insight
const SKY = "#8cc6ff"; // Sky Awakening
const LAVENDER = "#e1e4f6"; // Mist Lavender
const FUNDO = "#faf8f5"; // Parchment Canvas
const INK = "#0c0b14"; // Deep Indigo Void
const MUTED = "#5b586b"; // texto secundario
const GRID = "rgba(60, 57, 110, 0.18)"; // line-default

// Sequencia de cores para series e fatias (marca primeiro, depois apoios).
const SERIE = [INDIGO, PERIWINKLE, SKY, "#4a4686", "#c5cbef"];

const FONTE_TITULO = "'Cabin', 'Trebuchet MS', sans-serif";
const FONTE_CORPO = "'Cabin', 'Trebuchet MS', sans-serif";

const L = 1000;
const A = 600;
const MARGEM = { top: 92, right: 48, bottom: 104, left: 92 };

const fmt = new Intl.NumberFormat("pt-BR");
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function escapar(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Numero no padrao pt-BR (ponto de milhar), com unidade opcional. */
function numero(v: number, unidade?: string): string {
  return `${fmt.format(v)}${unidade ?? ""}`;
}

/** Rotulo humano: formata datas, encurta com reticencias e nunca usa travessao. */
function rotulo(s: string, max = 18): string {
  const mes = /^(\d{4})-(\d{2})$/.exec(s);
  if (mes) return `${MESES[Number(mes[2]) - 1] ?? mes[2]}/${mes[1].slice(2)}`;
  const dia = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (dia) return `${dia[3]}/${dia[2]}`;
  const limpo = s.replace(/\s*[—–]\s*/g, ", ");
  return limpo.length > max ? `${limpo.slice(0, max - 1)}…` : limpo;
}

/** Escala "redonda" do eixo de valor: topo e passo agradaveis para o grid. */
function escala(max: number): { topo: number; passo: number } {
  if (max <= 0) return { topo: 1, passo: 1 };
  const bruto = max / 4;
  const mag = 10 ** Math.floor(Math.log10(bruto));
  const norm = bruto / mag;
  const passoNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  const passo = passoNorm * mag;
  return { topo: Math.ceil(max / passo) * passo, passo };
}

function texto(
  x: number,
  y: number,
  conteudo: string,
  opts: { tamanho?: number; cor?: string; anchor?: string; peso?: number; fonte?: string; rotacao?: number } = {},
): string {
  const transform = opts.rotacao ? ` transform="rotate(${opts.rotacao} ${x.toFixed(1)} ${y.toFixed(1)})"` : "";
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${opts.fonte ?? FONTE_CORPO}" font-size="${opts.tamanho ?? 16}" font-weight="${opts.peso ?? 400}" fill="${opts.cor ?? INK}" text-anchor="${opts.anchor ?? "middle"}"${transform}>${escapar(conteudo)}</text>`;
}

/** Moldura comum: fundo, titulo e a area de plotagem (interior ja desenhado). */
function moldura(titulo: string, interior: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}" viewBox="0 0 ${L} ${A}">
<rect width="${L}" height="${A}" fill="${FUNDO}"/>
${texto(MARGEM.left - 4, 44, titulo, { tamanho: 26, peso: 700, cor: INDIGO, anchor: "start", fonte: FONTE_TITULO })}
${interior}
</svg>`;
}

/** Eixo de valor com grid horizontal e rotulos pt-BR (compartilhado por varios tipos). */
function eixoValor(topo: number, passo: number, unidade: string | undefined, x0: number, x1: number, y0: number, y1: number): string {
  const alturaPlot = y1 - y0;
  const partes: string[] = [];
  for (let v = 0; v <= topo + 1e-9; v += passo) {
    const y = y1 - (v / topo) * alturaPlot;
    partes.push(`<line x1="${x0}" y1="${y.toFixed(1)}" x2="${x1}" y2="${y.toFixed(1)}" stroke="${GRID}" stroke-width="1"/>`);
    partes.push(texto(x0 - 12, y + 5, numero(v, unidade), { tamanho: 14, cor: MUTED, anchor: "end" }));
  }
  return partes.join("\n");
}

function svgBarras(g: GraficoRef): string {
  const larguraPlot = L - MARGEM.left - MARGEM.right;
  const alturaPlot = A - MARGEM.top - MARGEM.bottom;
  const x0 = MARGEM.left;
  const y1 = MARGEM.top + alturaPlot;
  const { topo, passo } = escala(Math.max(...g.dados.map((d) => d.valor), 0));
  const passoX = larguraPlot / Math.max(1, g.dados.length);
  const largBarra = passoX * 0.62;

  const grid = eixoValor(topo, passo, g.unidade, x0, x0 + larguraPlot, MARGEM.top, y1);
  const barras = g.dados
    .map((d, i) => {
      const h = (d.valor / topo) * alturaPlot;
      const x = x0 + i * passoX + (passoX - largBarra) / 2;
      const y = y1 - h;
      const cx = x + largBarra / 2;
      return [
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${largBarra.toFixed(1)}" height="${h.toFixed(1)}" fill="${INDIGO}" rx="4"/>`,
        texto(cx, y - 10, numero(d.valor, g.unidade), { tamanho: 15, peso: 600, cor: INK }),
        texto(cx, y1 + 26, rotulo(d.rotulo, 12), { tamanho: 14, cor: MUTED, rotacao: g.dados.length > 8 ? 24 : 0 }),
      ].join("\n");
    })
    .join("\n");
  return moldura(g.titulo, `${grid}\n${barras}`);
}

function svgBarrasHorizontais(g: GraficoRef): string {
  const margemEsq = 240;
  const larguraPlot = L - margemEsq - MARGEM.right;
  const alturaPlot = A - MARGEM.top - 40;
  const y0 = MARGEM.top;
  const { topo } = escala(Math.max(...g.dados.map((d) => d.valor), 0));
  const passoY = alturaPlot / Math.max(1, g.dados.length);
  const altBarra = passoY * 0.62;

  const barras = g.dados
    .map((d, i) => {
      const w = (d.valor / topo) * larguraPlot;
      const y = y0 + i * passoY + (passoY - altBarra) / 2;
      const cor = SERIE[i % SERIE.length];
      return [
        `<rect x="${margemEsq}" y="${y.toFixed(1)}" width="${Math.max(2, w).toFixed(1)}" height="${altBarra.toFixed(1)}" fill="${cor}" rx="4"/>`,
        texto(margemEsq - 12, y + altBarra / 2 + 5, rotulo(d.rotulo, 30), { tamanho: 14, cor: INK, anchor: "end" }),
        texto(margemEsq + w + 8, y + altBarra / 2 + 5, numero(d.valor, g.unidade), { tamanho: 14, peso: 600, cor: INK, anchor: "start" }),
      ].join("\n");
    })
    .join("\n");
  return moldura(g.titulo, barras);
}

function svgLinhaOuArea(g: GraficoRef, preencher: boolean): string {
  const larguraPlot = L - MARGEM.left - MARGEM.right;
  const alturaPlot = A - MARGEM.top - MARGEM.bottom;
  const x0 = MARGEM.left;
  const y1 = MARGEM.top + alturaPlot;
  const { topo, passo } = escala(Math.max(...g.dados.map((d) => d.valor), 0));
  const passoX = larguraPlot / Math.max(1, g.dados.length - 1);

  const pontos = g.dados.map((d, i) => ({
    x: x0 + i * passoX,
    y: y1 - (d.valor / topo) * alturaPlot,
    d,
  }));
  const grid = eixoValor(topo, passo, g.unidade, x0, x0 + larguraPlot, MARGEM.top, y1);
  const caminho = pontos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = preencher
    ? `<polygon fill="${LAVENDER}" stroke="none" points="${x0},${y1} ${caminho} ${(x0 + larguraPlot).toFixed(1)},${y1}"/>`
    : "";
  const linha = `<polyline fill="none" stroke="${INDIGO}" stroke-width="3" stroke-linejoin="round" points="${caminho}"/>`;
  const marcadores = pontos
    .map((p) =>
      [
        `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="${INDIGO}"/>`,
        texto(p.x, p.y - 12, numero(p.d.valor, g.unidade), { tamanho: 13, peso: 600, cor: INK }),
        texto(p.x, y1 + 26, rotulo(p.d.rotulo, 10), { tamanho: 13, cor: MUTED }),
      ].join("\n"),
    )
    .join("\n");
  return moldura(g.titulo, `${grid}\n${area}\n${linha}\n${marcadores}`);
}

function svgDistribuicao(g: GraficoRef): string {
  // Histograma: barras adjacentes (sem espaco), cada item e uma faixa/bin.
  const larguraPlot = L - MARGEM.left - MARGEM.right;
  const alturaPlot = A - MARGEM.top - MARGEM.bottom;
  const x0 = MARGEM.left;
  const y1 = MARGEM.top + alturaPlot;
  const { topo, passo } = escala(Math.max(...g.dados.map((d) => d.valor), 0));
  const largBin = larguraPlot / Math.max(1, g.dados.length);
  const grid = eixoValor(topo, passo, g.unidade, x0, x0 + larguraPlot, MARGEM.top, y1);
  const bins = g.dados
    .map((d, i) => {
      const h = (d.valor / topo) * alturaPlot;
      const x = x0 + i * largBin;
      return [
        `<rect x="${x.toFixed(1)}" y="${(y1 - h).toFixed(1)}" width="${(largBin - 1).toFixed(1)}" height="${h.toFixed(1)}" fill="${PERIWINKLE}" stroke="${INDIGO}" stroke-width="1"/>`,
        texto(x + largBin / 2, y1 + 26, rotulo(d.rotulo, 8), { tamanho: 13, cor: MUTED, rotacao: g.dados.length > 8 ? 24 : 0 }),
      ].join("\n");
    })
    .join("\n");
  return moldura(g.titulo, `${grid}\n${bins}`);
}

function svgDonut(g: GraficoRef): string {
  const cx = MARGEM.left + 170;
  const cy = A / 2 + 10;
  const raio = 150;
  const espessura = 64;
  const total = g.dados.reduce((acc, d) => acc + d.valor, 0) || 1;

  let angulo = -Math.PI / 2;
  const fatias: string[] = [];
  const legenda: string[] = [];
  g.dados.forEach((d, i) => {
    const fracao = d.valor / total;
    const fim = angulo + fracao * 2 * Math.PI;
    const cor = SERIE[i % SERIE.length];
    const grande = fim - angulo > Math.PI ? 1 : 0;
    const xa = cx + raio * Math.cos(angulo);
    const ya = cy + raio * Math.sin(angulo);
    const xb = cx + raio * Math.cos(fim);
    const yb = cy + raio * Math.sin(fim);
    fatias.push(
      `<path d="M ${xa.toFixed(1)} ${ya.toFixed(1)} A ${raio} ${raio} 0 ${grande} 1 ${xb.toFixed(1)} ${yb.toFixed(1)}" fill="none" stroke="${cor}" stroke-width="${espessura}"/>`,
    );
    const yLeg = MARGEM.top + 30 + i * 40;
    const xLeg = cx + raio + 80;
    legenda.push(
      `<rect x="${xLeg}" y="${yLeg - 14}" width="18" height="18" rx="3" fill="${cor}"/>`,
      texto(xLeg + 28, yLeg, `${rotulo(d.rotulo, 22)}: ${numero(d.valor, g.unidade)} (${Math.round(fracao * 100)}%)`, { tamanho: 16, cor: INK, anchor: "start" }),
    );
    angulo = fim;
  });
  // Furo central com o total.
  fatias.push(`<circle cx="${cx}" cy="${cy}" r="${raio - espessura / 2 - 2}" fill="${FUNDO}"/>`);
  fatias.push(texto(cx, cy - 4, numero(total), { tamanho: 30, peso: 700, cor: INDIGO }));
  fatias.push(texto(cx, cy + 24, "total", { tamanho: 15, cor: MUTED }));
  return moldura(g.titulo, `${fatias.join("\n")}\n${legenda.join("\n")}`);
}

function montarSvg(g: GraficoRef): string {
  switch (g.tipo) {
    case "barras_horizontais":
      return svgBarrasHorizontais(g);
    case "linha":
      return svgLinhaOuArea(g, false);
    case "area":
      return svgLinhaOuArea(g, true);
    case "distribuicao":
      return svgDistribuicao(g);
    case "donut":
      return svgDonut(g);
    default:
      return svgBarras(g);
  }
}

/**
 * Rasteriza cada grafico para PNG num diretorio temporario por projeto e
 * preenche caminhoPng. Em caso de falha de render, o grafico segue sem PNG e o
 * build script usa o fallback de tabela a partir de `dados`.
 */
export async function renderizarGraficos(
  graficos: GraficoRef[],
  projectId: string,
): Promise<GraficoRef[]> {
  if (graficos.length === 0) return graficos;
  const dir = path.join(os.tmpdir(), `soulstory-charts-${projectId}`);
  await fs.mkdir(dir, { recursive: true });

  for (const g of graficos) {
    if (g.dados.length === 0) continue;
    try {
      const svg = montarSvg(g);
      const png = new Resvg(svg, {
        background: FUNDO,
        font: { loadSystemFonts: true, defaultFontFamily: "sans-serif" },
      })
        .render()
        .asPng();
      const caminho = path.join(dir, `${g.id}.png`);
      await fs.writeFile(caminho, png);
      g.caminhoPng = caminho;
    } catch {
      // Sem PNG: o docx cai no fallback de tabela com os mesmos dados.
      g.caminhoPng = undefined;
    }
  }
  return graficos;
}
