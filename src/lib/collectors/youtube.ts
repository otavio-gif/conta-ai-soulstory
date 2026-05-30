// Coletor YouTube (PRD secao 3.2 e 12). Coleta os videos da janela do canal da
// marca ou criador, suas estatisticas publicas e os comentarios. Prefere a
// legenda oficial; quando nao houver, sinaliza o fallback de transcricao paga
// (gpt-4o-transcribe) no estagio de transcricao. Apenas a conta da propria
// marca ou criador nesta fase. Sincrono, sem waitpoint.

import { lerFixture, MOCK_EXTERNAL } from "@/lib/env";
import {
  comentariosDoVideo,
  detalhesDosVideos,
  legendaOficial,
  resolverCanal,
  videosDoCanal,
} from "@/lib/collectors/youtube-api";
import {
  comoObjeto,
  pseudonimoAutor,
  texto,
  type Bruto,
} from "@/lib/collectors/util";
import type {
  ComentarioColetado,
  LacunaColeta,
  PostColetado,
} from "@/lib/pipeline/types";

const METRICAS_INDISPONIVEIS = [
  "youtube.compartilhamentos",
  "youtube.salvamentos",
];

export interface ResultadoYoutube {
  bio: string;
  posts: PostColetado[];
  legendasOficiais: Record<string, { texto: string; idioma: string }>;
  lacunas: LacunaColeta[];
  metricasIndisponiveis: string[];
}

function numeroStr(o: Bruto, ...chaves: string[]): number | null {
  for (const k of chaves) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
      return Number(v);
    }
  }
  return null;
}

/** Normaliza um item de videos.list em PostColetado. Funcao pura (testavel). */
export function normalizarVideoYoutube(item: unknown): PostColetado | null {
  const o = comoObjeto(item);
  const externalId = texto(o, "id");
  if (!externalId) return null;
  const snippet = comoObjeto(o.snippet);
  const stats = comoObjeto(o.statistics);

  return {
    externalId,
    fonte: "youtube",
    tipoMidia: "video",
    legenda: texto(snippet, "title"),
    url: `https://www.youtube.com/watch?v=${externalId}`,
    publicadoEm: texto(snippet, "publishedAt"),
    ehMencao: false,
    autorMencao: null,
    // O YouTube nao da url de download direto: a transcricao baixa pelo videoUrl
    // do watch. As legendas oficiais sao a via preferida.
    videoUrl: `https://www.youtube.com/watch?v=${externalId}`,
    imagens: [],
    // Compartilhamentos e salvamentos nao sao publicos no YouTube: disponivel=false.
    metricas: [
      {
        nome: "visualizacoes",
        valor: numeroStr(stats, "viewCount"),
        disponivel: numeroStr(stats, "viewCount") !== null,
      },
      {
        nome: "curtidas",
        valor: numeroStr(stats, "likeCount"),
        disponivel: numeroStr(stats, "likeCount") !== null,
      },
      {
        nome: "comentarios",
        valor: numeroStr(stats, "commentCount"),
        disponivel: numeroStr(stats, "commentCount") !== null,
      },
      { nome: "compartilhamentos", valor: null, disponivel: false },
      { nome: "salvamentos", valor: null, disponivel: false },
    ],
    comentarios: [],
  };
}

/** Normaliza um commentThread em ComentarioColetado pseudonimizado. */
export function normalizarComentarioYoutube(
  item: unknown,
  ctx: { projectId: string; brandHandle?: string },
): ComentarioColetado | null {
  const o = comoObjeto(item);
  const snippetTop = comoObjeto(comoObjeto(o.snippet).topLevelComment);
  const cs = comoObjeto(snippetTop.snippet);
  const id = texto(o, "id") || texto(snippetTop, "id");
  if (!id) return null;
  return {
    id,
    autor: pseudonimoAutor(
      ctx.projectId,
      texto(cs, "authorDisplayName"),
      ctx.brandHandle,
    ),
    texto: texto(cs, "textDisplay", "textOriginal"),
    publicadoEm: texto(cs, "publishedAt"),
  };
}

export async function coletarYoutube(params: {
  projectId: string;
  handle: string;
  janela: { inicio: string; fim: string };
}): Promise<ResultadoYoutube> {
  const { projectId, handle, janela } = params;

  if (MOCK_EXTERNAL) {
    const canal = await lerFixture<Bruto>("youtube/channel.json");
    const videosBrutos = await lerFixture<unknown[]>("youtube/youtube-videos.json");
    const comentariosBrutos = await lerFixture<Record<string, unknown[]>>(
      "youtube/youtube-comments.json",
    );
    const legendasOficiais = await lerFixture<
      Record<string, { texto: string; idioma: string }>
    >("youtube/captions.json");

    const posts: PostColetado[] = [];
    for (const v of videosBrutos) {
      const post = normalizarVideoYoutube(v);
      if (!post) continue;
      const comentarios = (comentariosBrutos[post.externalId] ?? [])
        .map((c) => normalizarComentarioYoutube(c, { projectId, brandHandle: handle }))
        .filter((c): c is ComentarioColetado => c !== null);
      post.comentarios = comentarios;
      posts.push(post);
    }
    return {
      bio: texto(comoObjeto(canal.snippet), "description"),
      posts,
      legendasOficiais,
      lacunas: [],
      metricasIndisponiveis: METRICAS_INDISPONIVEIS,
    };
  }

  const lacunas: LacunaColeta[] = [];
  const canal = await resolverCanal(handle);
  if (!canal || !canal.uploadsPlaylistId) {
    lacunas.push({ fonte: "youtube", motivo: "Canal do YouTube nao resolvido pelo handle." });
    return { bio: "", posts: [], legendasOficiais: {}, lacunas, metricasIndisponiveis: METRICAS_INDISPONIVEIS };
  }

  const ids = await videosDoCanal(canal.uploadsPlaylistId, janela);
  const detalhes = await detalhesDosVideos(ids);

  const posts: PostColetado[] = [];
  const legendasOficiais: Record<string, { texto: string; idioma: string }> = {};
  for (const d of detalhes) {
    const post = normalizarVideoYoutube(d);
    if (!post) continue;
    const comentariosBrutos = await comentariosDoVideo(post.externalId);
    post.comentarios = comentariosBrutos
      .map((c) => normalizarComentarioYoutube(c, { projectId, brandHandle: handle }))
      .filter((c): c is ComentarioColetado => c !== null);

    const legenda = await legendaOficial(post.externalId, "pt");
    if (legenda) legendasOficiais[post.externalId] = legenda;

    posts.push(post);
  }

  return {
    bio: canal.titulo,
    posts,
    legendasOficiais,
    lacunas,
    metricasIndisponiveis: METRICAS_INDISPONIVEIS,
  };
}
