// Sentimento longitudinal (PRD secao 3.8, Fase 3). O modelo (Sonnet, papel
// sentimento) classifica cada PECA (proprias e mencoes) em positivo, neutro ou
// negativo, numa unica passada batelada para conter custo. A agregacao por
// janela (mes) e deterministica. Cada rotulo por peca e cada ponto da serie
// viram Claim com suporte rastreavel, preservando o ledger.

import { bloco, blocoCacheavel, chamarClaude } from "@/lib/ai/anthropic";
import { doutrina } from "@/lib/ai/doctrine";
import { PROMPT_SENTIMENTO } from "@/lib/ai/prompts";
import type {
  ClaimCandidato,
  Corpus,
  FindingItem,
  GraficoRef,
} from "@/lib/pipeline/types";

export interface SaidaSentimento {
  claims: ClaimCandidato[];
  findings: FindingItem[];
  graficos: GraficoRef[];
}

type Rotulo = "positivo" | "neutro" | "negativo";

interface ClassificacaoItem {
  externalId: string;
  sentimento: Rotulo;
}

function corpoDaPeca(corpus: Corpus, externalId: string): string {
  const p = corpus.posts.find((x) => x.externalId === externalId);
  if (!p) return "";
  const t = corpus.transcricoes.find((x) => x.postExternalId === externalId);
  return [p.legenda, t?.texto ?? ""].filter(Boolean).join(" ").slice(0, 600);
}

export async function analisarSentimento(corpus: Corpus): Promise<SaidaSentimento> {
  const pecas = corpus.posts;
  if (pecas.length === 0) return { claims: [], findings: [], graficos: [] };

  const entrada = pecas.map((p) => ({
    externalId: p.externalId,
    fonte: p.fonte,
    ehMencao: p.ehMencao,
    publicadoEm: p.publicadoEm.slice(0, 10),
    texto: corpoDaPeca(corpus, p.externalId),
  }));

  const resp = await chamarClaude<{ classificacoes: ClassificacaoItem[] }>({
    papel: "sentimento",
    fixtureKey: "sentimento",
    system: [bloco(PROMPT_SENTIMENTO), await doutrina("evidence-ledger")],
    conteudo: [
      blocoCacheavel(JSON.stringify(entrada, null, 2)),
      bloco(
        "Classifique o sentimento de cada peca pelo externalId em positivo, neutro ou negativo, com base apenas no texto fornecido. Nao invente pecas.",
      ),
    ],
    ferramenta: {
      nome: "registrar_sentimento",
      descricao: "Classifica o sentimento de cada peca.",
      schema: {
        type: "object",
        properties: {
          classificacoes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                externalId: { type: "string" },
                sentimento: {
                  type: "string",
                  enum: ["positivo", "neutro", "negativo"],
                },
              },
              required: ["externalId", "sentimento"],
            },
          },
        },
        required: ["classificacoes"],
      },
      parse: (e) => e as { classificacoes: ClassificacaoItem[] },
    },
  });

  const classificacoes = resp.dados?.classificacoes ?? [];
  if (classificacoes.length === 0) return { claims: [], findings: [], graficos: [] };

  const porId = new Map<string, Rotulo>();
  for (const c of classificacoes) porId.set(c.externalId, c.sentimento);

  const claims: ClaimCandidato[] = [];

  // Um Claim por peca rotulada, lastreado no externalId da peca.
  for (const c of classificacoes) {
    if (!corpus.posts.some((p) => p.externalId === c.externalId)) continue;
    claims.push({
      otica: "analista_conteudo",
      parte: "I",
      texto: `A peca ${c.externalId} foi classificada com sentimento ${c.sentimento}.`,
      tipoSuporte: "padrao_observado",
      suportes: [c.externalId],
      construto: "sentimento",
    });
  }

  // Agregacao deterministica por mes: percentual de pecas positivas.
  const porMes = new Map<string, { pos: number; total: number; ids: string[] }>();
  for (const p of corpus.posts) {
    const rotulo = porId.get(p.externalId);
    if (!rotulo) continue;
    const mes = p.publicadoEm.slice(0, 7);
    const agg = porMes.get(mes) ?? { pos: 0, total: 0, ids: [] };
    agg.total += 1;
    if (rotulo === "positivo") agg.pos += 1;
    agg.ids.push(p.externalId);
    porMes.set(mes, agg);
  }

  const meses = [...porMes.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const dados = meses.map(([mes, agg]) => ({
    rotulo: mes,
    valor: agg.total > 0 ? Math.round((agg.pos / agg.total) * 100) : 0,
  }));

  for (const [mes, agg] of meses) {
    const pct = agg.total > 0 ? Math.round((agg.pos / agg.total) * 100) : 0;
    claims.push({
      otica: "analista_conteudo",
      parte: "I",
      texto: `Em ${mes}, ${pct}% das ${agg.total} pecas com sentimento classificado foram positivas.`,
      tipoSuporte: "agregacao",
      suportes: agg.ids,
      construto: "sentimento",
    });
  }

  const findings: FindingItem[] = [
    {
      otica: "analista_conteudo",
      construto: "sentimento",
      parte: "I",
      titulo: "Sentimento longitudinal",
      conteudo: meses
        .map(([mes, agg]) => `${mes}: ${Math.round((agg.pos / Math.max(1, agg.total)) * 100)}% positivo`)
        .join("; "),
    },
  ];

  const graficos: GraficoRef[] =
    dados.length > 1
      ? [
          {
            id: "linha-tempo-sentimento",
            titulo: "Sentimento longitudinal",
            descricao: "Percentual de pecas com sentimento positivo por mes na janela.",
            tipo: "linha",
            dados,
          },
        ]
      : [];

  return { claims, findings, graficos };
}
