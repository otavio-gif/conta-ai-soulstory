// Formato e horario de pico e linha do tempo de percepcao (PRD secao 3.8, Fase
// 3). Tudo deterministico, a partir de publicadoEm e do tipo de midia das pecas:
// que formatos aparecem, em que horario, e como o VOLUME de conversa (proprias +
// mencoes) se distribui na janela. Cada numero vira Claim de contagem ou
// agregacao com os externalIds que o sustentam. A leitura interpretativa fica
// para a redacao, que usa estes findings lastreados.

import type {
  ClaimCandidato,
  Corpus,
  FindingItem,
  GraficoRef,
} from "@/lib/pipeline/types";

export interface SaidaPicoTimeline {
  claims: ClaimCandidato[];
  findings: FindingItem[];
  graficos: GraficoRef[];
}

const ROTULO_FORMATO: Record<string, string> = {
  imagem: "Imagem",
  carrossel: "Carrossel",
  reel: "Reel ou video curto",
  video: "Video",
  desconhecido: "Outro",
};

function horaDe(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getUTCHours();
}

export function calcularPicoTimeline(corpus: Corpus): SaidaPicoTimeline {
  const posts = corpus.posts;
  if (posts.length === 0) return { claims: [], findings: [], graficos: [] };

  const claims: ClaimCandidato[] = [];
  const findings: FindingItem[] = [];
  const graficos: GraficoRef[] = [];

  // Formato: contagem por tipo de midia.
  const porFormato = new Map<string, string[]>();
  for (const p of posts) {
    const ids = porFormato.get(p.tipoMidia) ?? [];
    ids.push(p.externalId);
    porFormato.set(p.tipoMidia, ids);
  }
  const formatoDados = [...porFormato.entries()].map(([tipo, ids]) => ({
    rotulo: ROTULO_FORMATO[tipo] ?? tipo,
    valor: ids.length,
  }));
  if (formatoDados.length > 0) {
    const topFormato = [...formatoDados].sort((a, b) => b.valor - a.valor)[0];
    graficos.push({
      id: "formato-distribuicao",
      titulo: "Distribuicao por formato",
      descricao: "Quantidade de pecas por formato na janela (proprias e de terceiros).",
      tipo: "barras",
      dados: formatoDados,
    });
    claims.push({
      otica: "cientista_dados",
      parte: "I",
      texto: `O formato mais frequente na janela e ${topFormato.rotulo}, com ${topFormato.valor} de ${posts.length} pecas.`,
      tipoSuporte: "contagem",
      suportes: posts.map((p) => p.externalId),
      construto: "formato_horario",
    });
    findings.push({
      otica: "cientista_dados",
      construto: "formato_horario",
      parte: "I",
      titulo: "Formato predominante",
      conteudo: `${topFormato.rotulo} concentra ${topFormato.valor} de ${posts.length} pecas na janela.`,
    });
  }

  // Horario de pico: contagem por hora do dia (UTC).
  const porHora = new Map<number, string[]>();
  for (const p of posts) {
    const h = horaDe(p.publicadoEm);
    if (h === null) continue;
    const ids = porHora.get(h) ?? [];
    ids.push(p.externalId);
    porHora.set(h, ids);
  }
  if (porHora.size > 0) {
    const horaDados = [...porHora.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([h, ids]) => ({ rotulo: `${String(h).padStart(2, "0")}h`, valor: ids.length }));
    const pico = [...porHora.entries()].sort((a, b) => b[1].length - a[1].length)[0];
    graficos.push({
      id: "horario-pico",
      titulo: "Publicacoes por horario (UTC)",
      descricao: "Distribuicao das pecas por hora do dia na janela.",
      tipo: "barras",
      dados: horaDados,
    });
    claims.push({
      otica: "cientista_dados",
      parte: "I",
      texto: `O horario de pico de publicacao na janela e ${String(pico[0]).padStart(2, "0")}h UTC, com ${pico[1].length} pecas.`,
      tipoSuporte: "contagem",
      suportes: pico[1],
      construto: "formato_horario",
    });
  }

  // Linha do tempo de percepcao: volume de conversa por mes na janela.
  const porMes = new Map<string, string[]>();
  for (const p of posts) {
    const mes = p.publicadoEm.slice(0, 7);
    const ids = porMes.get(mes) ?? [];
    ids.push(p.externalId);
    porMes.set(mes, ids);
  }
  if (porMes.size > 1) {
    const mesDados = [...porMes.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mes, ids]) => ({ rotulo: mes, valor: ids.length }));
    const picoMes = [...porMes.entries()].sort((a, b) => b[1].length - a[1].length)[0];
    graficos.push({
      id: "linha-tempo-percepcao",
      titulo: "Linha do tempo de percepcao",
      descricao: "Volume de pecas sobre a marca por mes na janela (proprias e de terceiros).",
      tipo: "linha",
      dados: mesDados,
    });
    claims.push({
      otica: "cientista_dados",
      parte: "I",
      texto: `O volume de conversa sobre a marca teve pico em ${picoMes[0]}, com ${picoMes[1].length} pecas.`,
      tipoSuporte: "agregacao",
      suportes: picoMes[1],
      construto: "linha_tempo",
    });
    findings.push({
      otica: "cientista_dados",
      construto: "linha_tempo",
      parte: "I",
      titulo: "Marco de volume na janela",
      conteudo: `O mes ${picoMes[0]} concentrou o maior volume de pecas (${picoMes[1].length}) sobre a marca na janela.`,
    });
  }

  return { claims, findings, graficos };
}
