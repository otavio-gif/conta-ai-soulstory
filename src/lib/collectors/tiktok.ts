// Coletor TikTok (PRD secao 3.2). Mesma logica do Instagram, adaptada ao que e
// publico no TikTok: curtidas, comentarios, visualizacoes e compartilhamentos
// (o TikTok expoe compartilhamentos publicamente, ao contrario do Instagram).
// Salvamentos sao sempre indisponiveis, nunca estimados. Coleta integral da
// janela, apenas da conta da propria marca ou criador. Apify assincrono com
// webhook fechando o waitpoint do orquestrador, igual ao Instagram.

import { lerFixture, MOCK_EXTERNAL } from "@/lib/env";
import { custoApifyRun } from "@/lib/cost";
import { coletarRunApify } from "@/lib/collectors/apify-run";
import { lacunaPorStatus } from "@/lib/collectors/lacunas";
import { timeoutColeta } from "@/lib/collectors/retry";
import {
  comoObjeto,
  lista,
  numero,
  pseudonimoAutor,
  texto,
  type Bruto,
} from "@/lib/collectors/util";
import type {
  ComentarioColetado,
  LacunaColeta,
  PostColetado,
} from "@/lib/pipeline/types";

const ACTOR_SCRAPER = "clockworks/tiktok-scraper";
const ACTOR_COMMENTS = "clockworks/tiktok-comments-scraper";

export interface ResultadoTiktok {
  bio: string;
  posts: PostColetado[];
  lacunas: LacunaColeta[];
  metricasIndisponiveis: string[];
}

const METRICAS_INDISPONIVEIS = ["tiktok.salvamentos"];

function dentroDaJanela(iso: string, janela: { inicio: string; fim: string }): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return true;
  return t >= new Date(janela.inicio).getTime() && t <= new Date(janela.fim).getTime();
}

function urlDoVideo(o: Bruto): string | null {
  const direto = texto(o, "videoUrl", "webVideoUrl", "downloadAddr");
  if (direto) return direto;
  const midias = lista(o, "mediaUrls", "videoUrlNoWaterMark");
  const primeira = midias.find((m) => typeof m === "string" && m.length > 0);
  return typeof primeira === "string" ? primeira : null;
}

/** Normaliza videos do dataset do tiktok-scraper. Funcao pura (testavel). */
export function normalizarVideosTiktok(
  itens: unknown[],
  ctx: {
    projectId: string;
    brandHandle?: string;
    janela: { inicio: string; fim: string };
  },
): PostColetado[] {
  const posts: PostColetado[] = [];
  for (const item of itens) {
    const o = comoObjeto(item);
    const externalId = texto(o, "id", "awemeId", "aweme_id");
    if (!externalId) continue;
    const publicadoEm =
      texto(o, "createTimeISO", "createTime", "createTimeAsString") || ctx.janela.inicio;
    if (!dentroDaJanela(publicadoEm, ctx.janela)) continue;

    const autorMeta = comoObjeto(o.authorMeta);
    const dono = texto(o, "authorUniqueId") || texto(autorMeta, "name", "uniqueId");
    const ehMencao = Boolean(
      ctx.brandHandle &&
        dono &&
        dono.toLowerCase() !== ctx.brandHandle.replace(/^@/, "").toLowerCase(),
    );

    const compartilhamentos = numero(o, "shareCount");
    posts.push({
      externalId,
      fonte: "tiktok",
      tipoMidia: "video",
      legenda: texto(o, "text", "desc", "title"),
      url: texto(o, "webVideoUrl", "url") || `https://www.tiktok.com/@/video/${externalId}`,
      publicadoEm,
      ehMencao,
      autorMencao: ehMencao ? pseudonimoAutor(ctx.projectId, dono, ctx.brandHandle) : null,
      videoUrl: urlDoVideo(o),
      imagens: [],
      // O TikTok expoe compartilhamentos publicamente: disponivel quando vem no payload.
      // Salvamentos nao sao publicos: disponivel=false, valor nulo, nunca estimado.
      metricas: [
        { nome: "curtidas", valor: numero(o, "diggCount"), disponivel: numero(o, "diggCount") !== null },
        {
          nome: "comentarios",
          valor: numero(o, "commentCount"),
          disponivel: numero(o, "commentCount") !== null,
        },
        {
          nome: "visualizacoes",
          valor: numero(o, "playCount", "viewCount"),
          disponivel: numero(o, "playCount", "viewCount") !== null,
        },
        {
          nome: "compartilhamentos",
          valor: compartilhamentos,
          disponivel: compartilhamentos !== null,
        },
        { nome: "salvamentos", valor: null, disponivel: false },
      ],
      comentarios: [],
    });
  }
  return posts;
}

/** Extrai o id numerico do video de uma URL do TikTok (.../video/<id>). */
function idDeUrlTiktok(url: string): string {
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : "";
}

/** Normaliza comentarios e os agrupa por video (pseudonimizando o autor). */
export function agruparComentariosTiktok(
  itens: unknown[],
  ctx: { projectId: string; brandHandle?: string },
): Map<string, ComentarioColetado[]> {
  const mapa = new Map<string, ComentarioColetado[]>();
  for (const item of itens) {
    const o = comoObjeto(item);
    // O ator clockworks/tiktok-comments-scraper nao traz videoId; o vinculo com
    // o video vem na URL (submittedVideoUrl/videoWebUrl). Extraimos o id dela
    // para casar com o externalId do video. Ver run real, Fase 5.
    const postRef =
      texto(o, "videoId", "videoWebId", "aweme_id", "awemeId") ||
      texto(comoObjeto(o.video), "id") ||
      idDeUrlTiktok(texto(o, "submittedVideoUrl", "videoWebUrl"));
    if (!postRef) continue;
    const autor =
      texto(o, "uniqueId", "username") || texto(comoObjeto(o.user), "uniqueId", "nickname");
    const comentario: ComentarioColetado = {
      id: texto(o, "cid", "id") || `${postRef}-${(mapa.get(postRef)?.length ?? 0) + 1}`,
      autor: pseudonimoAutor(ctx.projectId, autor, ctx.brandHandle),
      texto: texto(o, "text", "comment"),
      publicadoEm: texto(o, "createTimeISO", "createTime", "createTimeAsString"),
    };
    const atual = mapa.get(postRef) ?? [];
    atual.push(comentario);
    mapa.set(postRef, atual);
  }
  return mapa;
}

export async function coletarTiktok(params: {
  projectId: string;
  handle: string;
  janela: { inicio: string; fim: string };
  webhookBase?: string;
  volumeEstimado?: number;
}): Promise<ResultadoTiktok> {
  const { projectId, handle, janela } = params;

  if (MOCK_EXTERNAL) {
    const perfil = await lerFixture<Bruto>("tiktok/tiktok-profile.json");
    const videosBrutos = await lerFixture<unknown[]>("tiktok/tiktok-videos.json");
    const comentariosBrutos = await lerFixture<unknown[]>("tiktok/tiktok-comments.json");
    const posts = normalizarVideosTiktok(videosBrutos, {
      projectId,
      brandHandle: handle,
      janela,
    });
    const comentarios = agruparComentariosTiktok(comentariosBrutos, {
      projectId,
      brandHandle: handle,
    });
    for (const p of posts) p.comentarios = comentarios.get(p.externalId) ?? [];
    return {
      bio: texto(perfil, "signature", "bio", "biography"),
      posts,
      lacunas: [],
      metricasIndisponiveis: METRICAS_INDISPONIVEIS,
    };
  }

  const lacunas: LacunaColeta[] = [];
  const base = params.webhookBase ?? "";
  const timeout = timeoutColeta(params.volumeEstimado ?? 0);

  // 1. Perfil e videos da janela (captura integral, com degradacao graciosa).
  const resVideos = await coletarRunApify({
    projectId,
    actorId: ACTOR_SCRAPER,
    fonte: "tiktok",
    descricao: "Apify tiktok-scraper (videos)",
    webhookBase: base,
    timeout,
    montarInput: (proxyConfiguration) => ({
      profiles: [handle.replace(/^@/, "")],
      resultsPerPage: 1000,
      shouldDownloadVideos: false,
      oldestPostDate: janela.inicio,
      proxyConfiguration,
    }),
    custoBRL: (residencial) => custoApifyRun(residencial ? 0.12 : 0.05),
  });
  const lacunaVideos = lacunaPorStatus("tiktok", "Videos do TikTok", resVideos.status);
  if (lacunaVideos) lacunas.push(lacunaVideos);

  const videosBrutos = resVideos.itens;
  const posts = normalizarVideosTiktok(videosBrutos, {
    projectId,
    brandHandle: handle,
    janela,
  });
  const bio = texto(comoObjeto(comoObjeto(videosBrutos[0]).authorMeta), "signature");

  // 2. Comentarios de todos os videos (sem teto; volume sinalizado no CP1).
  if (posts.length > 0) {
    const resC = await coletarRunApify({
      projectId,
      actorId: ACTOR_COMMENTS,
      fonte: "tiktok",
      descricao: "Apify tiktok-comments-scraper",
      webhookBase: base,
      timeout,
      montarInput: (proxyConfiguration) => ({
        postURLs: posts.map((p) => p.url),
        commentsPerPost: 100000,
        proxyConfiguration,
      }),
      custoBRL: (residencial) => custoApifyRun(residencial ? 0.22 : 0.1),
    });
    const comentarios = agruparComentariosTiktok(resC.itens, {
      projectId,
      brandHandle: handle,
    });
    for (const p of posts) p.comentarios = comentarios.get(p.externalId) ?? [];
    const lacunaC = lacunaPorStatus("tiktok", "Comentarios do TikTok", resC.status);
    if (lacunaC) lacunas.push(lacunaC);
  }

  return { bio, posts, lacunas, metricasIndisponiveis: METRICAS_INDISPONIVEIS };
}
