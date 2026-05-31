// Share of voice de mencao (PRD secao 3.8, Fase 3). Quanto a marca e falada por
// TERCEIROS versus por ela mesma, SEM comparar com concorrentes (recorte Visao
// Externa). Unidade: pecas. 100% deterministico: conta pecas proprias
// (ehMencao=false) e de terceiros (ehMencao=true) sobre o total, e cada numero
// vira Claim de contagem com os externalIds que o sustentam. O modelo nao entra
// aqui, o que blinda o ledger.

import type {
  ClaimCandidato,
  Corpus,
  FindingItem,
  GraficoRef,
} from "@/lib/pipeline/types";

export interface SaidaShareOfVoice {
  claims: ClaimCandidato[];
  findings: FindingItem[];
  graficos: GraficoRef[];
}

export function calcularShareOfVoice(corpus: Corpus): SaidaShareOfVoice {
  const proprias = corpus.posts.filter((p) => !p.ehMencao);
  const terceiros = corpus.posts.filter((p) => p.ehMencao);
  const total = proprias.length + terceiros.length;

  if (total === 0) {
    return { claims: [], findings: [], graficos: [] };
  }

  const pctTerceiros = Math.round((terceiros.length / total) * 100);
  const pctProprias = 100 - pctTerceiros;

  const claims: ClaimCandidato[] = [
    {
      otica: "cientista_dados",
      parte: "I",
      texto: `Das ${total} pecas sobre a marca na janela, ${terceiros.length} sao de terceiros (${pctTerceiros}%) e ${proprias.length} sao da propria marca (${pctProprias}%).`,
      tipoSuporte: "contagem",
      suportes: corpus.posts.map((p) => p.externalId),
      construto: "share_of_voice",
    },
  ];

  const findings: FindingItem[] = [
    {
      otica: "cientista_dados",
      construto: "share_of_voice",
      parte: "I",
      titulo: "Share of voice de mencao",
      conteudo: `${pctTerceiros}% das pecas sobre a marca na janela vem de terceiros (midia espontanea) e ${pctProprias}% da propria marca, em ${total} pecas.`,
    },
  ];

  const graficos: GraficoRef[] = [
    {
      id: "share-of-voice",
      titulo: "Share of voice de mencao",
      descricao:
        "Proporcao de pecas sobre a marca produzidas por terceiros versus pela propria marca na janela.",
      tipo: "barras",
      dados: [
        { rotulo: "Terceiros", valor: terceiros.length },
        { rotulo: "Propria marca", valor: proprias.length },
      ],
    },
  ];

  return { claims, findings, graficos };
}
