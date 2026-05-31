// Gerador de graficos no padrao visual Soulstory (PRD secao 3.3 e skill
// chart-builder-soulstory). Desenha SVG indigo e rasteriza para PNG com
// @resvg/resvg-js (sem dependencia nativa de build). Cada grafico tambem carrega
// os dados que o originaram, para anexo e para o fallback de tabela no docx.

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import type { GraficoRef } from "@/lib/pipeline/types";

const INDIGO = "#312E81";
const INDIGO_CLARO = "#5c6fcf";
const FUNDO = "#faf8f5";
const GRID = "#d8d6d9";
const TEXTO = "#2a2934";

const L = 1000;
const A = 560;
const MARGEM = { top: 60, right: 40, bottom: 90, left: 70 };

function escapar(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function svgBarras(g: GraficoRef): string {
  const larguraPlot = L - MARGEM.left - MARGEM.right;
  const alturaPlot = A - MARGEM.top - MARGEM.bottom;
  const max = Math.max(1, ...g.dados.map((d) => d.valor));
  const passo = larguraPlot / Math.max(1, g.dados.length);
  const larguraBarra = passo * 0.62;

  const barras = g.dados
    .map((d, i) => {
      const h = (d.valor / max) * alturaPlot;
      const x = MARGEM.left + i * passo + (passo - larguraBarra) / 2;
      const y = MARGEM.top + alturaPlot - h;
      const rotulo = escapar(d.rotulo.slice(0, 14));
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${larguraBarra.toFixed(1)}" height="${h.toFixed(1)}" fill="${INDIGO}" rx="3"/>
<text x="${(x + larguraBarra / 2).toFixed(1)}" y="${(y - 8).toFixed(1)}" font-family="sans-serif" font-size="18" fill="${TEXTO}" text-anchor="middle">${d.valor}</text>
<text x="${(x + larguraBarra / 2).toFixed(1)}" y="${(MARGEM.top + alturaPlot + 28).toFixed(1)}" font-family="sans-serif" font-size="16" fill="${TEXTO}" text-anchor="middle" transform="rotate(20 ${(x + larguraBarra / 2).toFixed(1)} ${(MARGEM.top + alturaPlot + 28).toFixed(1)})">${rotulo}</text>`;
    })
    .join("\n");

  return moldura(g.titulo, barras);
}

function svgLinha(g: GraficoRef): string {
  const larguraPlot = L - MARGEM.left - MARGEM.right;
  const alturaPlot = A - MARGEM.top - MARGEM.bottom;
  const max = Math.max(1, ...g.dados.map((d) => d.valor));
  const passo = larguraPlot / Math.max(1, g.dados.length - 1);

  const pontos = g.dados.map((d, i) => {
    const x = MARGEM.left + i * passo;
    const y = MARGEM.top + alturaPlot - (d.valor / max) * alturaPlot;
    return { x, y, d };
  });
  const linha = `<polyline fill="none" stroke="${INDIGO}" stroke-width="3" points="${pontos
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ")}"/>`;
  const marcadores = pontos
    .map(
      (p) =>
        `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="${INDIGO_CLARO}"/>
<text x="${p.x.toFixed(1)}" y="${(MARGEM.top + alturaPlot + 28).toFixed(1)}" font-family="sans-serif" font-size="15" fill="${TEXTO}" text-anchor="middle">${escapar(p.d.rotulo.slice(0, 12))}</text>`,
    )
    .join("\n");
  return moldura(g.titulo, `${linha}\n${marcadores}`);
}

function moldura(titulo: string, interior: string): string {
  const alturaPlot = A - MARGEM.top - MARGEM.bottom;
  const eixoY = MARGEM.top + alturaPlot;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}" viewBox="0 0 ${L} ${A}">
<rect width="${L}" height="${A}" fill="${FUNDO}"/>
<text x="${MARGEM.left}" y="36" font-family="sans-serif" font-size="22" font-weight="700" fill="${INDIGO}">${escapar(titulo)}</text>
<line x1="${MARGEM.left}" y1="${eixoY}" x2="${L - MARGEM.right}" y2="${eixoY}" stroke="${GRID}" stroke-width="1.5"/>
<line x1="${MARGEM.left}" y1="${MARGEM.top}" x2="${MARGEM.left}" y2="${eixoY}" stroke="${GRID}" stroke-width="1.5"/>
${interior}
</svg>`;
}

function montarSvg(g: GraficoRef): string {
  return g.tipo === "linha" ? svgLinha(g) : svgBarras(g);
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
      const png = new Resvg(svg, { background: FUNDO }).render().asPng();
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
