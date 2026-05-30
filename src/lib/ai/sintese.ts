// Sintetizador metodologico (Visao Externa, metodo Ana Couto), PRD secao 3.4.
// Consolida os achados das duas oticas em gap de percepcao, promotores,
// detratores, aceleradores, persona, ondas de valor e insumo DE/PARA. Roda em
// Opus pela exigencia estrategica. Nao introduz dado novo: herda os suportes.

import { bloco, blocoCacheavel, chamarClaude } from "@/lib/ai/anthropic";
import { doutrina } from "@/lib/ai/doctrine";
import { PROMPT_SINTETIZADOR } from "@/lib/ai/prompts";
import type {
  ClaimCandidato,
  Corpus,
  FindingItem,
  SaidaAnalise,
} from "@/lib/pipeline/types";

const CONSTRUTOS = [
  "gap_percepcao",
  "promotores",
  "detratores",
  "aceleradores",
  "persona",
  "ondas_valor",
  "depara",
];

interface SaidaSintese {
  findings: Array<{
    construto: string;
    titulo: string;
    conteudo: string;
    suportes: string[];
  }>;
  claims: Array<{
    texto: string;
    tipoSuporte: ClaimCandidato["tipoSuporte"];
    suportes: string[];
    construto: string;
  }>;
}

export async function sintetizar(
  corpus: Corpus,
  analise: SaidaAnalise,
): Promise<{ findings: FindingItem[]; claims: ClaimCandidato[] }> {
  const entrada = {
    marca: corpus.marca,
    tipo: corpus.tipo,
    bio: corpus.bio ?? null,
    indicadoresReclameAqui: corpus.indicadoresRA,
    reclamacoes: corpus.reclamacoes.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      status: r.status,
      resposta: r.resposta,
    })),
    insights: analise.insights,
    afirmacoes: analise.claims.map((c) => ({
      texto: c.texto,
      suportes: c.suportes,
    })),
  };

  const resp = await chamarClaude<SaidaSintese>({
    papel: "sintetizador",
    fixtureKey: "sintese",
    system: [
      bloco(PROMPT_SINTETIZADOR),
      await doutrina("visao-externa-metodo", "evidence-ledger"),
    ],
    conteudo: [
      blocoCacheavel(JSON.stringify(entrada, null, 2)),
      bloco(
        "Consolide os construtos da Visao Externa. Cada conclusao herda os suportes dos achados que a originam. Use os construtos: " +
          CONSTRUTOS.join(", ") +
          ".",
      ),
    ],
    ferramenta: {
      nome: "registrar_sintese",
      descricao: "Registra os achados e afirmacoes da sintese metodologica.",
      schema: {
        type: "object",
        properties: {
          findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                construto: { type: "string", enum: CONSTRUTOS },
                titulo: { type: "string" },
                conteudo: { type: "string" },
                suportes: { type: "array", items: { type: "string" } },
              },
              required: ["construto", "titulo", "conteudo", "suportes"],
            },
          },
          claims: {
            type: "array",
            items: {
              type: "object",
              properties: {
                texto: { type: "string" },
                tipoSuporte: {
                  type: "string",
                  enum: ["citacao_direta", "contagem", "agregacao", "padrao_observado"],
                },
                suportes: { type: "array", items: { type: "string" } },
                construto: { type: "string", enum: CONSTRUTOS },
              },
              required: ["texto", "tipoSuporte", "suportes", "construto"],
            },
          },
        },
        required: ["findings", "claims"],
      },
      parse: (e) => e as SaidaSintese,
    },
  });

  const findings: FindingItem[] = (resp.dados?.findings ?? []).map((f) => ({
    otica: "sintetizador",
    construto: f.construto,
    parte: "II",
    titulo: f.titulo,
    conteudo: f.conteudo,
  }));
  const claims: ClaimCandidato[] = (resp.dados?.claims ?? []).map((c) => ({
    otica: "sintetizador",
    parte: "II",
    texto: c.texto,
    tipoSuporte: c.tipoSuporte,
    suportes: c.suportes ?? [],
    construto: c.construto,
  }));
  return { findings, claims };
}
