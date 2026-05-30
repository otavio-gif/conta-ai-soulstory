// Coletor TikTok (PRD secao 3.2). Mesma logica do Instagram, adaptada ao que e
// publico no TikTok: curtidas, comentarios, visualizacoes e compartilhamentos
// (o TikTok expoe compartilhamentos publicamente, ao contrario do Instagram).
// Salvamentos sao sempre indisponiveis, nunca estimados. Coleta integral da
// janela, apenas da conta da propria marca ou criador. Apify assincrono com
// webhook fechando o waitpoint do orquestrador, igual ao Instagram.

import { wait } from "@trigger.dev/sdk";
import { lerFixture, MOCK_EXTERNAL } from "@/lib/env";
import { custoApifyRun, registrarCustoEvent } from "@/lib/cost";
import { iniciarRun, itensDoDataset } from "@/lib/collectors/apify";
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

/** Normaliza comentarios e os agrupa por video (pseudonimizando o autor). */
export function agruparComentariosTiktok(
  itens: unknown[],
  ctx: { projectId: string; brandHandle?: string },
): Map<string, ComentarioColetado[]> {
  const mapa = new Map<string, ComentarioColetado[]>();
  for (const item of itens) {
    const o = comoObjeto(item);
    const postRef =
      texto(o, "videoId", "videoWebId", "aweme_id", "awemeId") ||
      texto(comoObjeto(o.video), "id");
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

  // 1. Perfil e videos da janela (captura integral).
  const tokenVideos = await wait.createToken({ timeout: "1h", tags: [projectId] });
  const runVideos = await iniciarRun(
    ACTOR_SCRAPER,
    {
      profiles: [handle.replace(/^@/, "")],
      resultsPerPage: 1000,
      shouldDownloadVideos: false,
      oldestPostDate: janela.inicio,
    },
    `${base}/api/webhooks/apify?token=${tokenVideos.id}`,
  );
  await registrarCustoEvent({
    fonte: "tiktok",
    descricao: "Apify tiktok-scraper (videos)",
    custoBRL: custoApifyRun(0.05),
  });
  const okVideos = await wait.forToken<{ ok: boolean }>(tokenVideos.id);
  if (!okVideos.ok || !okVideos.output.ok) {
    lacunas.push({
      fonte: "tiktok",
      motivo: "Coleta de videos do TikTok nao concluiu (timeout ou bloqueio).",
    });
    return { bio: "", posts: [], lacunas, metricasIndisponiveis: METRICAS_INDISPONIVEIS };
  }
  const videosBrutos = await itensDoDataset(runVideos.datasetId);
  const posts = normalizarVideosTiktok(videosBrutos, {
    projectId,
    brandHandle: handle,
    janela,
  });
  const bio = texto(comoObjeto(comoObjeto(videosBrutos[0]).authorMeta), "signature");

  // 2. Comentarios de todos os videos (sem teto; volume sinalizado no CP1).
  if (posts.length > 0) {
    const tokenC = await wait.createToken({ timeout: "2h", tags: [projectId] });
    const runC = await iniciarRun(
      ACTOR_COMMENTS,
      { postURLs: posts.map((p) => p.url), commentsPerPost: 100000 },
      `${base}/api/webhooks/apify?token=${tokenC.id}`,
    );
    await registrarCustoEvent({
      fonte: "tiktok",
      descricao: "Apify tiktok-comments-scraper",
      custoBRL: custoApifyRun(0.1),
    });
    const okC = await wait.forToken<{ ok: boolean }>(tokenC.id);
    if (okC.ok && okC.output.ok) {
      const comentariosBrutos = await itensDoDataset(runC.datasetId);
      const comentarios = agruparComentariosTiktok(comentariosBrutos, {
        projectId,
        brandHandle: handle,
      });
      for (const p of posts) p.comentarios = comentarios.get(p.externalId) ?? [];
    } else {
      lacunas.push({
        fonte: "tiktok",
        motivo: "Coleta de comentarios do TikTok nao concluiu para todos os videos.",
      });
    }
  }

  return { bio, posts, lacunas, metricasIndisponiveis: METRICAS_INDISPONIVEIS };
}
