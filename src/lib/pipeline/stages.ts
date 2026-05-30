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
import { coletarTiktok } from "@/lib/collectors/tiktok";
import { coletarYoutube } from "@/lib/collectors/youtube";
import { coletarSeoSerp } from "@/lib/collectors/seo-serp";
import { coletarMencoes } from "@/lib/collectors/mencoes";
import { mapearComConcorrencia } from "@/lib/collectors/util";
import { transcreverAudio } from "@/lib/transcribe/whisper";
import { ocrCarrossel } from "@/lib/transcribe/ocr";
import { baseUrl } from "@/lib/env";
import { estimarCusto } from "@/lib/cost";
import type {
  AmostraItem,
  AmostraTranscricao,
  Corpus,
  FontePlanejada,
  Inventario,
  InventarioFonte,
  Outline,
  PlanoColeta,
  PostColetado,
  SourceKind,
  ResultadoVerificacao,
  SaidaAnalise,
  TranscricaoItem,
  OcrItem,
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
  tiktokHandle?: string;
  youtubeHandle?: string;
  palavrasChave: string[];
  // Termos de busca (nome e variacoes) e dominios oficiais para SEO e mencoes.
  termosBusca?: string[];
  dominiosMarca?: string[];
  volumeInstagram: number;
  volumeReclameAqui: number;
  volumeTiktok: number;
  volumeYoutube: number;
  volumeSeoSerp?: number;
  volumeMencoes?: number;
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
        "Extraia o plano de coleta para Instagram, Reclame Aqui, TikTok, YouTube, SEO e busca no Google (seo_serp) e mencoes de terceiros (mencoes). Para SEO e mencoes, derive os termos de busca (nome da marca e variacoes) e os dominios e perfis oficiais da marca. Estime o volume por fonte.",
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
          tiktokHandle: { type: "string" },
          youtubeHandle: { type: "string" },
          palavrasChave: { type: "array", items: { type: "string" } },
          termosBusca: { type: "array", items: { type: "string" } },
          dominiosMarca: { type: "array", items: { type: "string" } },
          volumeInstagram: { type: "number" },
          volumeReclameAqui: { type: "number" },
          volumeTiktok: { type: "number" },
          volumeYoutube: { type: "number" },
          volumeSeoSerp: { type: "number" },
          volumeMencoes: { type: "number" },
        },
        required: ["marca", "tipo", "palavrasChave", "volumeInstagram", "volumeReclameAqui"],
      },
      parse: (e) => e as SaidaInterprete,
    },
  });

  const d = resp.dados;
  if (!d) throw new Error("Interprete nao devolveu o plano de coleta.");

  const fontes: FontePlanejada[] = [
    ...(d.instagramHandle
      ? [
          {
            kind: "instagram" as const,
            handle: d.instagramHandle,
            volumeEstimado: d.volumeInstagram,
          },
        ]
      : []),
    ...(d.reclameAquiUrl
      ? [
          {
            kind: "reclame_aqui" as const,
            url: d.reclameAquiUrl,
            volumeEstimado: d.volumeReclameAqui,
          },
        ]
      : []),
    ...(d.tiktokHandle
      ? [
          {
            kind: "tiktok" as const,
            handle: d.tiktokHandle,
            volumeEstimado: d.volumeTiktok ?? 0,
          },
        ]
      : []),
    ...(d.youtubeHandle
      ? [
          {
            kind: "youtube" as const,
            handle: d.youtubeHandle,
            volumeEstimado: d.volumeYoutube ?? 0,
          },
        ]
      : []),
  ];

  // SEO/SERP e mencoes (Fase 3): entram quando ha termos de busca da marca.
  const termosBusca =
    d.termosBusca && d.termosBusca.length > 0 ? d.termosBusca : [d.marca];
  const dominiosMarca = d.dominiosMarca ?? [];
  fontes.push(
    { kind: "seo_serp" as const, volumeEstimado: d.volumeSeoSerp ?? termosBusca.length },
    { kind: "mencoes" as const, volumeEstimado: d.volumeMencoes ?? 0 },
  );

  return {
    marca: d.marca,
    tipo: d.tipo,
    janela: input.janela,
    palavrasChave: d.palavrasChave,
    instagramHandle: d.instagramHandle,
    reclameAquiUrl: d.reclameAquiUrl,
    tiktokHandle: d.tiktokHandle,
    youtubeHandle: d.youtubeHandle,
    termosBusca,
    dominiosMarca,
    fontes,
    custo: estimarCusto({ fontes, janela: input.janela, orcamentoBRL: input.orcamentoBRL }),
  };
}

// 2. Coletores -> corpus normalizado + inventario com lacunas declaradas.
// Instagram, TikTok e YouTube alimentam o mesmo array corpus.posts (cada item
// carrega a sua fonte); Reclame Aqui alimenta as reclamacoes. O inventario por
// fonte e agregado dinamicamente a partir do corpus.
export async function coletar(
  plano: PlanoColeta,
  projectId: string,
): Promise<{ inventario: Inventario; corpus: Corpus }> {
  const webhookBase = baseUrl();

  const ig = plano.instagramHandle
    ? await coletarInstagram({
        projectId,
        handle: plano.instagramHandle,
        palavrasChave: plano.palavrasChave,
        janela: plano.janela,
        webhookBase,
      })
    : { bio: "", posts: [], lacunas: [], metricasIndisponiveis: [] };

  const tt = plano.tiktokHandle
    ? await coletarTiktok({
        projectId,
        handle: plano.tiktokHandle,
        janela: plano.janela,
        webhookBase,
      })
    : { bio: "", posts: [], lacunas: [], metricasIndisponiveis: [] };

  const yt = plano.youtubeHandle
    ? await coletarYoutube({
        projectId,
        handle: plano.youtubeHandle,
        janela: plano.janela,
      })
    : { bio: "", posts: [], legendasOficiais: {}, lacunas: [], metricasIndisponiveis: [] };

  const ra = plano.reclameAquiUrl
    ? await coletarReclameAqui({
        projectId,
        url: plano.reclameAquiUrl,
        janela: plano.janela,
      })
    : { reclamacoes: [], indicadores: null, lacunas: [], paginasBrutas: [] };

  // SEO e busca no Google (Fase 3). Roda primeiro para alimentar as mencoes web
  // com as URLs de terceiros que ranqueiam.
  const temSeo = plano.fontes.some((f) => f.kind === "seo_serp");
  const seo = temSeo
    ? await coletarSeoSerp({
        projectId,
        termos: plano.termosBusca ?? [plano.marca],
        dominiosMarca: plano.dominiosMarca ?? [],
        webhookBase,
      })
    : { serp: [], volumes: [], lacunas: [], urlsTerceiros: [] };

  // Mencoes de terceiros (midia espontanea, Fase 3), cross-plataforma.
  const temMencoes = plano.fontes.some((f) => f.kind === "mencoes");
  const men = temMencoes
    ? await coletarMencoes({
        projectId,
        marca: plano.marca,
        termos: plano.termosBusca ?? [plano.marca],
        janela: plano.janela,
        urlsTerceiros: seo.urlsTerceiros,
        webhookBase,
      })
    : { posts: [], lacunas: [] };

  const posts: PostColetado[] = [...ig.posts, ...tt.posts, ...yt.posts, ...men.posts];

  const corpus: Corpus = {
    marca: plano.marca,
    tipo: plano.tipo,
    janela: plano.janela,
    instagramHandle: plano.instagramHandle,
    bio: ig.bio || tt.bio || yt.bio,
    posts,
    reclamacoes: ra.reclamacoes,
    indicadoresRA: ra.indicadores,
    transcricoes: [],
    ocr: [],
    legendasOficiais: yt.legendasOficiais,
    serp: seo.serp,
    volumesBusca: seo.volumes,
    lacunas: [
      ...ig.lacunas,
      ...tt.lacunas,
      ...yt.lacunas,
      ...ra.lacunas,
      ...seo.lacunas,
      ...men.lacunas,
    ],
    metricasIndisponiveis: [
      ...ig.metricasIndisponiveis,
      ...tt.metricasIndisponiveis,
      ...yt.metricasIndisponiveis,
    ],
  };

  const inventario = montarInventario(corpus);
  return { inventario, corpus };
}

/** Agrega o inventario por fonte a partir do corpus coletado (captura integral). */
function montarInventario(corpus: Corpus): Inventario {
  const fontesPost: SourceKind[] = ["instagram", "tiktok", "youtube"];
  const porFonte: InventarioFonte[] = [];

  for (const fonte of fontesPost) {
    const postsFonte = corpus.posts.filter((p) => p.fonte === fonte);
    if (postsFonte.length === 0) continue;
    const comentarios = postsFonte.reduce((a, p) => a + p.comentarios.length, 0);
    const videos = postsFonte.filter(
      (p) => p.tipoMidia === "reel" || p.tipoMidia === "video",
    ).length;
    porFonte.push({
      fonte,
      posts: postsFonte.length,
      comentarios,
      videos,
      reclamacoes: 0,
      artefatosBrutos: postsFonte.length + comentarios,
    });
  }

  if (corpus.reclamacoes.length > 0) {
    porFonte.push({
      fonte: "reclame_aqui",
      posts: 0,
      comentarios: 0,
      videos: 0,
      reclamacoes: corpus.reclamacoes.length,
      artefatosBrutos: corpus.reclamacoes.length,
    });
  }

  // SEO e busca (Fase 3): cada item de SERP e um artefato bruto.
  const serp = corpus.serp ?? [];
  if (serp.length > 0) {
    porFonte.push({
      fonte: "seo_serp",
      posts: serp.length,
      comentarios: 0,
      videos: 0,
      reclamacoes: 0,
      artefatosBrutos: serp.length,
    });
  }

  // Mencoes (Fase 3): pecas de terceiros e seus comentarios.
  const mencoes = corpus.posts.filter((p) => p.fonte === "mencoes");
  if (mencoes.length > 0) {
    const comentariosMencoes = mencoes.reduce((a, p) => a + p.comentarios.length, 0);
    porFonte.push({
      fonte: "mencoes",
      posts: mencoes.length,
      comentarios: comentariosMencoes,
      videos: mencoes.filter((p) => p.tipoMidia === "reel" || p.tipoMidia === "video").length,
      reclamacoes: 0,
      artefatosBrutos: mencoes.length + comentariosMencoes,
    });
  }

  const totalArtefatos = porFonte.reduce((a, f) => a + f.artefatosBrutos, 0);
  return {
    porFonte,
    totalArtefatos,
    lacunas: corpus.lacunas,
    metricasIndisponiveis: corpus.metricasIndisponiveis,
  };
}

// 3. Transcritor e OCR -> corpus enriquecido + amostra de qualidade.
// Transcricao em volume: legenda oficial do YouTube curto-circuita a chamada
// paga; o restante (Reels e videos com videoUrl) vai para o gpt-4o-transcribe.
// Roda com concorrencia limitada para muitos videos. OCR segue so no carrossel
// do Instagram (sem OCR de texto em tela de video nesta fase).
const CONCORRENCIA_TRANSCRICAO = 4;
const CONCORRENCIA_OCR = 4;

export async function transcreverOcr(
  corpus: Corpus,
): Promise<{ amostra: AmostraTranscricao; corpus: Corpus }> {
  const legendas = corpus.legendasOficiais ?? {};
  const origemLegenda = new Set<string>();

  const videos = corpus.posts.filter(
    (p) => p.tipoMidia === "reel" || p.tipoMidia === "video",
  );
  const transcricoesBrutas = await mapearComConcorrencia(
    videos,
    CONCORRENCIA_TRANSCRICAO,
    async (post): Promise<TranscricaoItem | null> => {
      const legenda = legendas[post.externalId];
      if (legenda && legenda.texto) {
        origemLegenda.add(post.externalId);
        return {
          postExternalId: post.externalId,
          fonte: post.fonte,
          texto: legenda.texto,
          idioma: legenda.idioma,
          modelo: "youtube-captions",
        };
      }
      return transcreverAudio(post);
    },
  );
  const transcricoes = transcricoesBrutas.filter(
    (t): t is TranscricaoItem => t !== null,
  );

  const carrosseis = corpus.posts.filter((p) => p.tipoMidia === "carrossel");
  const ocrBrutos = await mapearComConcorrencia(
    carrosseis,
    CONCORRENCIA_OCR,
    (post): Promise<OcrItem | null> => ocrCarrossel(post),
  );
  const ocr = ocrBrutos.filter((o): o is OcrItem => o !== null);

  const enriquecido: Corpus = { ...corpus, transcricoes, ocr };

  const rotuloFonte: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
  };
  const amostras: AmostraItem[] = [
    ...transcricoes.slice(0, 4).map((t) => {
      const legenda = origemLegenda.has(t.postExternalId);
      return {
        origem: `${t.postExternalId} (${rotuloFonte[t.fonte] ?? t.fonte}${legenda ? ", legenda oficial" : ""})`,
        fonte: t.fonte,
        tipo: legenda ? ("legenda" as const) : ("transcricao" as const),
        trecho: t.texto.slice(0, 280),
      };
    }),
    ...ocr.slice(0, 2).map((o) => ({
      origem: `${o.postExternalId} (carrossel)`,
      fonte: "instagram" as const,
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
