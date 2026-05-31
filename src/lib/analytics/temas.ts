// Mapa de temas e glossario de linguagem nativa (PRD secao 3.8, Fase 3). O mapa
// de temas e por modelo (Sonnet, papel temas), agrupando as pecas em 8 a 12
// temas com itens de suporte. O glossario consolida de forma DETERMINISTICA os
// termos de linguagem nativa que o analista de conteudo ja extraiu por post
// (findings de construto linguagem_nativa), deduplicando por termo. Cada tema e
// cada termo viram Claim com suporte, preservando o ledger.

import { bloco, blocoCacheavel, chamarClaude } from "@/lib/ai/anthropic";
import { doutrina } from "@/lib/ai/doctrine";
import { PROMPT_TEMAS } from "@/lib/ai/prompts";
import type {
  ClaimCandidato,
  Corpus,
  FindingItem,
  GraficoRef,
} from "@/lib/pipeline/types";

export interface SaidaTemas {
  claims: ClaimCandidato[];
  findings: FindingItem[];
  graficos: GraficoRef[];
}

interface TemaIA {
  tema: string;
  descricao: string;
  itens: string[];
}

export async function mapearTemas(corpus: Corpus): Promise<SaidaTemas> {
  const pecas = corpus.posts;
  if (pecas.length === 0) return { claims: [], findings: [], graficos: [] };

  const entrada = pecas.map((p) => ({
    externalId: p.externalId,
    fonte: p.fonte,
    legenda: p.legenda.slice(0, 300),
    comentarios: p.comentarios.slice(0, 5).map((c) => c.texto.slice(0, 160)),
  }));

  const resp = await chamarClaude<{ temas: TemaIA[] }>({
    papel: "temas",
    fixtureKey: "temas",
    system: [bloco(PROMPT_TEMAS), await doutrina("evidence-ledger")],
    conteudo: [
      blocoCacheavel(JSON.stringify(entrada, null, 2)),
      bloco(
        "Agrupe as pecas em 8 a 12 temas que orbitam a marca. Cada tema lista os externalIds das pecas que o sustentam. Nao invente pecas nem temas sem suporte.",
      ),
    ],
    ferramenta: {
      nome: "registrar_temas",
      descricao: "Registra o mapa de temas com itens de suporte.",
      schema: {
        type: "object",
        properties: {
          temas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tema: { type: "string" },
                descricao: { type: "string" },
                itens: { type: "array", items: { type: "string" } },
              },
              required: ["tema", "descricao", "itens"],
            },
          },
        },
        required: ["temas"],
      },
      parse: (e) => e as { temas: TemaIA[] },
    },
  });

  const temas = (resp.dados?.temas ?? []).filter((t) => (t.itens ?? []).length > 0);

  const claims: ClaimCandidato[] = temas.map((t) => ({
    otica: "analista_conteudo",
    parte: "I",
    texto: `O tema "${t.tema}" aparece em ${t.itens.length} peca(s) sobre a marca.`,
    tipoSuporte: "padrao_observado",
    suportes: t.itens,
    construto: "temas",
  }));

  const findings: FindingItem[] = temas.map((t) => ({
    otica: "analista_conteudo",
    construto: "temas",
    parte: "I",
    titulo: t.tema,
    conteudo: t.descricao,
  }));

  const graficos: GraficoRef[] =
    temas.length > 0
      ? [
          {
            id: "mapa-temas",
            titulo: "Mapa de temas",
            descricao: "Numero de pecas por tema que orbita a marca na janela.",
            tipo: "barras_horizontais",
            dados: temas.map((t) => ({ rotulo: t.tema, valor: t.itens.length })),
          },
        ]
      : [];

  return { claims, findings, graficos };
}

/**
 * Glossario de linguagem nativa consolidado (deterministico). Deduplica por
 * termo os findings de construto linguagem_nativa que o analista de conteudo ja
 * produziu por post, mantendo a primeira definicao. Nao chama modelo: e
 * consolidacao pura, sem risco para o ledger.
 */
export function consolidarGlossario(findings: FindingItem[]): FindingItem[] {
  const vistos = new Map<string, FindingItem>();
  for (const f of findings) {
    if (f.construto !== "linguagem_nativa") continue;
    const chave = f.titulo.trim().toLowerCase();
    if (!chave || vistos.has(chave)) continue;
    vistos.set(chave, {
      otica: "analista_conteudo",
      construto: "glossario",
      parte: "I",
      titulo: f.titulo,
      conteudo: f.conteudo,
    });
  }
  return [...vistos.values()];
}
