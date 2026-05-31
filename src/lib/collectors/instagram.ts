// Coletor Instagram (PRD secao 3.2). Captura integral dentro da janela: bio,
// posts, legendas, comentarios (sem teto, volume vai ao checkpoint 1), metricas
// publicas, carrosseis, Reels e posts de terceiros que citam a marca.
// Salvamentos e compartilhamentos sao sempre indisponiveis, nunca estimados.

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
  TipoMidia,
} from "@/lib/pipeline/types";

const ACTOR_SCRAPER = "apify/instagram-scraper";
const ACTOR_COMMENTS = "apify/instagram-comment-scraper";

export interface ResultadoInstagram {
  bio: string;
  posts: PostColetado[];
  lacunas: LacunaColeta[];
  metricasIndisponiveis: string[];
}

function dentroDaJanela(iso: string, janela: { inicio: string; fim: string }): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return true;
  return t >= new Date(janela.inicio).getTime() && t <= new Date(janela.fim).getTime();
}

function tipoMidia(bruto: Bruto): TipoMidia {
  const tipo = texto(bruto, "type", "productType").toLowerCase();
  if (tipo.includes("sidecar") || tipo.includes("carousel")) return "carrossel";
  if (tipo.includes("video") || tipo.includes("reel") || tipo.includes("clips"))
    return "reel";
  if (tipo.includes("image") || tipo.includes("photo")) return "imagem";
  return "desconhecido";
}

/** Normaliza posts do dataset do instagram-scraper. Funcao pura (testavel). */
export function normalizarPosts(
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
    const externalId = texto(o, "id", "shortCode", "shortcode");
    if (!externalId) continue;
    const publicadoEm = texto(o, "timestamp", "takenAt") || ctx.janela.inicio;
    if (!dentroDaJanela(publicadoEm, ctx.janela)) continue;

    const dono = texto(o, "ownerUsername", "ownerUsernameId");
    const ehMencao = Boolean(
      ctx.brandHandle &&
        dono &&
        dono.toLowerCase() !== ctx.brandHandle.replace(/^@/, "").toLowerCase(),
    );

    const imagens = lista(o, "images")
      .map((i) => (typeof i === "string" ? i : texto(comoObjeto(i), "url", "src")))
      .filter(Boolean);
    const display = texto(o, "displayUrl");
    if (imagens.length === 0 && display) imagens.push(display);

    posts.push({
      externalId,
      fonte: "instagram",
      tipoMidia: tipoMidia(o),
      legenda: texto(o, "caption", "text"),
      url: texto(o, "url") || `https://instagram.com/p/${externalId}`,
      publicadoEm,
      ehMencao,
      autorMencao: ehMencao ? pseudonimoAutor(ctx.projectId, dono, ctx.brandHandle) : null,
      videoUrl: texto(o, "videoUrl") || null,
      imagens,
      // Salvamentos e compartilhamentos nao sao publicos: disponivel=false, nunca estimado.
      metricas: [
        { nome: "curtidas", valor: numero(o, "likesCount"), disponivel: numero(o, "likesCount") !== null },
        {
          nome: "comentarios",
          valor: numero(o, "commentsCount"),
          disponivel: numero(o, "commentsCount") !== null,
        },
        {
          nome: "visualizacoes",
          valor: numero(o, "videoViewCount", "videoPlayCount"),
          disponivel: numero(o, "videoViewCount", "videoPlayCount") !== null,
        },
        { nome: "salvamentos", valor: null, disponivel: false },
        { nome: "compartilhamentos", valor: null, disponivel: false },
      ],
      comentarios: [],
    });
  }
  return posts;
}

/** Normaliza comentarios e os agrupa por post (pseudonimizando o autor). */
export function agruparComentarios(
  itens: unknown[],
  ctx: { projectId: string; brandHandle?: string },
): Map<string, ComentarioColetado[]> {
  const mapa = new Map<string, ComentarioColetado[]>();
  for (const item of itens) {
    const o = comoObjeto(item);
    const postRef =
      texto(o, "postId", "postShortcode", "postShortCode") ||
      texto(comoObjeto(o.post), "shortCode", "id");
    if (!postRef) continue;
    const autor = texto(o, "ownerUsername", "owner", "username");
    const comentario: ComentarioColetado = {
      id: texto(o, "id") || `${postRef}-${(mapa.get(postRef)?.length ?? 0) + 1}`,
      autor: pseudonimoAutor(ctx.projectId, autor, ctx.brandHandle),
      texto: texto(o, "text", "comment"),
      publicadoEm: texto(o, "timestamp", "createdAt"),
    };
    const atual = mapa.get(postRef) ?? [];
    atual.push(comentario);
    mapa.set(postRef, atual);
  }
  return mapa;
}

const METRICAS_INDISPONIVEIS = [
  "instagram.salvamentos",
  "instagram.compartilhamentos",
];

export async function coletarInstagram(params: {
  projectId: string;
  handle: string;
  palavrasChave: string[];
  janela: { inicio: string; fim: string };
  webhookBase?: string;
  volumeEstimado?: number;
}): Promise<ResultadoInstagram> {
  const { projectId, handle, janela } = params;

  if (MOCK_EXTERNAL) {
    const perfil = await lerFixture<Bruto>("apify/instagram-profile.json");
    const postsBrutos = await lerFixture<unknown[]>("apify/instagram-posts.json");
    const comentariosBrutos = await lerFixture<unknown[]>(
      "apify/instagram-comments.json",
    );
    const posts = normalizarPosts(postsBrutos, { projectId, brandHandle: handle, janela });
    const comentarios = agruparComentarios(comentariosBrutos, {
      projectId,
      brandHandle: handle,
    });
    for (const p of posts) p.comentarios = comentarios.get(p.externalId) ?? [];
    return {
      bio: texto(perfil, "biography", "bio"),
      posts,
      lacunas: [],
      metricasIndisponiveis: METRICAS_INDISPONIVEIS,
    };
  }

  const lacunas: LacunaColeta[] = [];
  const base = params.webhookBase ?? "";
  const timeout = timeoutColeta(params.volumeEstimado ?? 0);

  // 1. Perfil, posts, Reels e carrosseis (captura integral da janela).
  // Degradacao graciosa: parcial ou vazio viram lacuna, mas a fonte nunca aborta
  // o pipeline; seguimos com o que veio.
  const resPosts = await coletarRunApify({
    projectId,
    actorId: ACTOR_SCRAPER,
    fonte: "instagram",
    descricao: "Apify instagram-scraper (posts)",
    webhookBase: base,
    timeout,
    montarInput: (proxyConfiguration) => ({
      username: [handle.replace(/^@/, "")],
      resultsType: "posts",
      onlyPostsNewerThan: janela.inicio,
      addParentData: true,
      proxyConfiguration,
    }),
    custoBRL: (residencial) => custoApifyRun(residencial ? 0.12 : 0.05),
  });
  const lacunaPosts = lacunaPorStatus("instagram", "Posts do Instagram", resPosts.status);
  if (lacunaPosts) lacunas.push(lacunaPosts);

  const postsBrutos = resPosts.itens;
  const posts = normalizarPosts(postsBrutos, { projectId, brandHandle: handle, janela });
  const bio = texto(comoObjeto(postsBrutos[0]), "biography");

  // 2. Comentarios de todos os posts (sem teto; volume sinalizado no CP1).
  if (posts.length > 0) {
    const resC = await coletarRunApify({
      projectId,
      actorId: ACTOR_COMMENTS,
      fonte: "instagram",
      descricao: "Apify instagram-comment-scraper",
      webhookBase: base,
      timeout,
      montarInput: (proxyConfiguration) => ({
        directUrls: posts.map((p) => p.url),
        resultsLimit: 100000,
        proxyConfiguration,
      }),
      custoBRL: (residencial) => custoApifyRun(residencial ? 0.22 : 0.1),
    });
    const comentarios = agruparComentarios(resC.itens, { projectId, brandHandle: handle });
    for (const p of posts) {
      p.comentarios = comentarios.get(p.externalId) ?? comentarios.get(p.url) ?? [];
    }
    const lacunaC = lacunaPorStatus("instagram", "Comentarios do Instagram", resC.status);
    if (lacunaC) lacunas.push(lacunaC);
  }

  return { bio, posts, lacunas, metricasIndisponiveis: METRICAS_INDISPONIVEIS };
}
