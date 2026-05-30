// Os 7 estagios do pipeline de Visao Externa, agora REAIS (Fase 1). Cada estagio
// e uma funcao assincrona que recebe os insumos do anterior (o corpus atravessa
// a cadeia) e devolve a saida do checkpoint. A persistencia e os checkpoints
// ficam no orquestrador; os estagios em si nao leem o banco, o que permite
// rodar o pipeline real sobre fixtures (MOCK_EXTERNAL=1) sem credenciais.

import { bloco, blocoCacheavel, chamarClaude } from "@/lib/ai/anthropic";
import { doutrina } from "@/lib/ai/doctrine";
import { analisar as analisarOticas } from "@/lib/ai/analise";
import { PROMPT_INTERPRETE } from "@/lib/ai/prompts";
import { sintetizar } from "@/lib/ai/sintese";
import { verificar as verificarClaims } from "@/lib/ai/verificacao";
import { coletarInstagram } from "@/lib/collectors/instagram";
import { coletarReclameAqui } from "@/lib/collectors/reclame-aqui";
import { transcreverReel } from "@/lib/transcribe/whisper";
import { ocrCarrossel } from "@/lib/transcribe/ocr";
import { baseUrl } from "@/lib/env";
import { estimarCusto } from "@/lib/cost";
import type {
  AmostraItem,
  AmostraTranscricao,
  Corpus,
  Inventario,
  Outline,
  PlanoColeta,
  ResultadoVerificacao,
  SaidaAnalise,
} from "@/lib/pipeline/types";

export interface BriefingInput {
  briefing: string;
  janela: { inicio: string; fim: string };
  orcamentoBRL?: number | null;
}

// 1. Interprete de briefing e escopo -> plano de coleta com custo estimado.
interface SaidaInterprete {
  marca: string;
  tipo: "marca" | "influenciador";
  instagramHandle?: string;
  reclameAquiUrl?: string;
  palavrasChave: string[];
  volumeInstagram: number;
  volumeReclameAqui: number;
}

export async function interpretarBriefing(
  input: BriefingInput,
): Promise<PlanoColeta> {
  const resp = await chamarClaude<SaidaInterprete>({
    papel: "interprete",
    fixtureKey: "interprete",
    system: [bloco(PROMPT_INTERPRETE), await doutrina("coletor-protocolos")],
    conteudo: [
      blocoCacheavel(
        `Briefing:\n${input.briefing}\n\nJanela: ${input.janela.inicio} a ${input.janela.fim}.`,
      ),
      bloco(
        "Extraia o plano de coleta para Instagram e Reclame Aqui. Estime o volume por fonte.",
      ),
    ],
    ferramenta: {
      nome: "registrar_plano",
      descricao: "Registra o plano de coleta interpretado do briefing.",
      schema: {
        type: "object",
        properties: {
          marca: { type: "string" },
          tipo: { type: "string", enum: ["marca", "influenciador"] },
          instagramHandle: { type: "string" },
          reclameAquiUrl: { type: "string" },
          palavrasChave: { type: "array", items: { type: "string" } },
          volumeInstagram: { type: "number" },
          volumeReclameAqui: { type: "number" },
        },
        required: ["marca", "tipo", "palavrasChave", "volumeInstagram", "volumeReclameAqui"],
      },
      parse: (e) => e as SaidaInterprete,
    },
  });

  const d = resp.dados;
  if (!d) throw new Error("Interprete nao devolveu o plano de coleta.");

  const fontes = [
    {
      kind: "instagram" as const,
      handle: d.instagramHandle,
      volumeEstimado: d.volumeInstagram,
    },
    ...(d.reclameAquiUrl
      ? [
          {
            kind: "reclame_aqui" as const,
            url: d.reclameAquiUrl,
            volumeEstimado: d.volumeReclameAqui,
          },
        ]
      : []),
  ];

  return {
    marca: d.marca,
    tipo: d.tipo,
    janela: input.janela,
    palavrasChave: d.palavrasChave,
    instagramHandle: d.instagramHandle,
    reclameAquiUrl: d.reclameAquiUrl,
    fontes,
    custo: estimarCusto({ fontes, janela: input.janela, orcamentoBRL: input.orcamentoBRL }),
  };
}

// 2. Coletores -> corpus normalizado + inventario com lacunas declaradas.
export async function coletar(
  plano: PlanoColeta,
  projectId: string,
): Promise<{ inventario: Inventario; corpus: Corpus }> {
  const ig = await coletarInstagram({
    projectId,
    handle: plano.instagramHandle ?? "",
    palavrasChave: plano.palavrasChave,
    janela: plano.janela,
    webhookBase: baseUrl(),
  });

  const ra = plano.reclameAquiUrl
    ? await coletarReclameAqui({
        projectId,
        url: plano.reclameAquiUrl,
        janela: plano.janela,
      })
    : { reclamacoes: [], indicadores: null, lacunas: [], paginasBrutas: [] };

  const corpus: Corpus = {
    marca: plano.marca,
    tipo: plano.tipo,
    janela: plano.janela,
    instagramHandle: plano.instagramHandle,
    bio: ig.bio,
    posts: ig.posts,
    reclamacoes: ra.reclamacoes,
    indicadoresRA: ra.indicadores,
    transcricoes: [],
    ocr: [],
    lacunas: [...ig.lacunas, ...ra.lacunas],
    metricasIndisponiveis: ig.metricasIndisponiveis,
  };

  const comentariosIg = corpus.posts.reduce((a, p) => a + p.comentarios.length, 0);
  const inventario: Inventario = {
    porFonte: [
      {
        fonte: "instagram",
        posts: corpus.posts.length,
        comentarios: comentariosIg,
        videos: corpus.posts.filter((p) => p.tipoMidia === "reel").length,
        reclamacoes: 0,
        artefatosBrutos: corpus.posts.length + comentariosIg,
      },
      {
        fonte: "reclame_aqui",
        posts: 0,
        comentarios: 0,
        videos: 0,
        reclamacoes: corpus.reclamacoes.length,
        artefatosBrutos: corpus.reclamacoes.length,
      },
    ],
    totalArtefatos: corpus.posts.length + comentariosIg + corpus.reclamacoes.length,
    lacunas: corpus.lacunas,
    metricasIndisponiveis: corpus.metricasIndisponiveis,
  };

  return { inventario, corpus };
}

// 3. Transcritor e OCR -> corpus enriquecido + amostra de qualidade.
export async function transcreverOcr(
  corpus: Corpus,
): Promise<{ amostra: AmostraTranscricao; corpus: Corpus }> {
  const transcricoes = [];
  const ocr = [];
  for (const post of corpus.posts) {
    if (post.tipoMidia === "reel") {
      const t = await transcreverReel(post);
      if (t) transcricoes.push(t);
    }
    if (post.tipoMidia === "carrossel") {
      const o = await ocrCarrossel(post);
      if (o) ocr.push(o);
    }
  }

  const enriquecido: Corpus = { ...corpus, transcricoes, ocr };

  const amostras: AmostraItem[] = [
    ...transcricoes.slice(0, 2).map((t) => ({
      origem: `${t.postExternalId} (Reel)`,
      tipo: "transcricao" as const,
      trecho: t.texto.slice(0, 280),
    })),
    ...ocr.slice(0, 2).map((o) => ({
      origem: `${o.postExternalId} (carrossel)`,
      tipo: "ocr" as const,
      trecho: o.texto.slice(0, 280),
    })),
  ];

  return {
    corpus: enriquecido,
    amostra: {
      totalTranscricoes: transcricoes.length,
      totalOcr: ocr.length,
      amostras,
    },
  };
}

// 4. Cientista de dados + analista de conteudo + sintetizador metodologico.
export async function analisar(
  corpus: Corpus,
  projectId: string,
): Promise<SaidaAnalise> {
  const base = await analisarOticas(corpus, projectId);
  const sintese = await sintetizar(corpus, base);
  return {
    insights: base.insights,
    graficos: base.graficos,
    claims: [...base.claims, ...sintese.claims],
    findings: [...base.findings, ...sintese.findings],
  };
}

// 5. Outline do relatorio, derivado do mapa metodologico e dos achados.
const ROTULO_CONSTRUTO: Record<string, string> = {
  gap_percepcao: "Gap de percepcao",
  promotores: "Promotores",
  detratores: "Detratores",
  aceleradores: "Aceleradores",
  persona: "Insights de persona",
  ondas_valor: "Ondas de valor",
  depara: "Insumo para o DE/PARA",
};

export function montarOutline(analise: SaidaAnalise): Outline {
  const construtosII = ["gap_percepcao", "promotores", "detratores", "aceleradores", "persona", "ondas_valor", "depara"];
  const presentes = construtosII.filter((c) =>
    analise.findings.some((f) => f.parte === "II" && f.construto === c),
  );
  const ordem = presentes.length > 0 ? presentes : construtosII;

  return {
    parteI: [
      { titulo: "Como a marca e vista", bullets: ["Tom percebido", "Temas recorrentes"] },
      { titulo: "Viralizacao e desempenho publico", bullets: ["Fatores de destaque"] },
      { titulo: "Linguagem nativa do publico", bullets: ["Glossario"] },
      { titulo: "Linha do tempo da conversa", bullets: ["Marcos na janela"] },
    ],
    parteII: ordem.map((c) => ({
      titulo: ROTULO_CONSTRUTO[c] ?? c,
      bullets: analise.findings
        .filter((f) => f.parte === "II" && f.construto === c)
        .map((f) => f.titulo),
    })),
  };
}

// 6. Verificadores de fato -> auditoria do evidence ledger (BLOQUEANTE).
export async function verificar(
  corpus: Corpus,
  analise: SaidaAnalise,
): Promise<ResultadoVerificacao> {
  return verificarClaims(corpus, analise.claims);
}
