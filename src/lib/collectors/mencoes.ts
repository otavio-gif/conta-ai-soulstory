// Coletor de mencoes (midia espontanea, PRD secao 3.2, Fase 3). Conteudo de
// TERCEIROS que cita a marca, cruzando quatro rotas: web (Firecrawl sobre as
// URLs de terceiros que ranqueiam na SERP), TikTok e YouTube de terceiros
// (descoberta por palavra-chave, inclui os videos adiados na Fase 2) e posts de
// terceiros do Instagram. Tudo marcado ehMencao=true, autor pseudonimizado e
// deduplicado por id externo. Cada peca entra no corpus com fonte "mencoes"; a
// plataforma de origem fica no raw.
//
// Com MOCK_EXTERNAL=1 le fixtures. Teto de volume por rota para conter custo, com
// o volume sinalizado no checkpoint 1, nunca cortado em silencio.

import { wait } from "@trigger.dev/sdk";
import { lerFixture, MOCK_EXTERNAL } from "@/lib/env";
import {
  custoApifyRun,
  custoFirecrawl,
  custoYoutubeApi,
  registrarCustoEvent,
} from "@/lib/cost";
import { iniciarRun, itensDoDataset } from "@/lib/collectors/apify";
import { scrape } from "@/lib/collectors/firecrawl";
import { normalizarPosts } from "@/lib/collectors/instagram";
import { normalizarVideosTiktok } from "@/lib/collectors/tiktok";
import {
  buscarPorTermo,
  comentariosDoVideo,
  detalhesDosVideos,
} from "@/lib/collectors/youtube-api";
import {
  normalizarComentarioYoutube,
  normalizarVideoYoutube,
} from "@/lib/collectors/youtube";
import { pseudonimoAutor } from "@/lib/collectors/util";
import type {
  ComentarioColetado,
  LacunaColeta,
  PostColetado,
} from "@/lib/pipeline/types";

const ACTOR_TIKTOK = "clockworks/tiktok-scraper";
const ACTOR_INSTAGRAM = "apify/instagram-hashtag-scraper";

// Teto por rota: o volume real e sinalizado no CP1; o operador decide ampliar.
const TETO_WEB = 20;
const TETO_TIKTOK = 30;
const TETO_YOUTUBE = 25;
const TETO_INSTAGRAM = 30;

export interface ResultadoMencoes {
  posts: PostColetado[];
  lacunas: LacunaColeta[];
}

function citaMarca(texto: string, termos: string[]): boolean {
  const t = texto.toLowerCase();
  return termos.some((termo) => termo && t.includes(termo.toLowerCase()));
}

/** Converte os PostColetado de um coletor proprio em mencoes de terceiros. */
function comoMencao(post: PostColetado, plataforma: string): PostColetado {
  return {
    ...post,
    fonte: "mencoes",
    ehMencao: true,
    autorMencao: post.autorMencao ?? null,
    // Guarda a plataforma de origem no externalId namespaced, para dedup e raw.
    externalId: `${plataforma}:${post.externalId}`,
  };
}

/** Dedup por externalId, preservando a ordem de chegada. */
function dedup(posts: PostColetado[]): PostColetado[] {
  const vistos = new Set<string>();
  const out: PostColetado[] = [];
  for (const p of posts) {
    if (vistos.has(p.externalId)) continue;
    vistos.add(p.externalId);
    out.push(p);
  }
  return out;
}

export async function coletarMencoes(params: {
  projectId: string;
  marca: string;
  termos: string[];
  janela: { inicio: string; fim: string };
  urlsTerceiros: string[];
  webhookBase?: string;
}): Promise<ResultadoMencoes> {
  const { projectId, termos, janela, urlsTerceiros } = params;
  const termosFiltro = termos.length > 0 ? termos : [params.marca];

  if (MOCK_EXTERNAL) {
    const web = await lerFixture<
      Array<{ url: string; titulo: string; texto: string; autor?: string }>
    >("mencoes/web-terceiros.json");
    const ttBrutos = await lerFixture<unknown[]>("mencoes/tiktok-terceiros.json");
    const ytBrutos = await lerFixture<unknown[]>("mencoes/youtube-terceiros.json");
    const ytComentarios = await lerFixture<Record<string, unknown[]>>(
      "mencoes/youtube-terceiros-comentarios.json",
    ).catch(() => ({}) as Record<string, unknown[]>);
    const igBrutos = await lerFixture<unknown[]>("mencoes/instagram-terceiros.json");

    const posts: PostColetado[] = [];

    // Web: cada pagina de terceiro vira uma peca de mencao.
    for (const pagina of web.slice(0, TETO_WEB)) {
      if (!citaMarca(`${pagina.titulo} ${pagina.texto}`, termosFiltro)) continue;
      posts.push({
        externalId: `web:${pagina.url}`,
        fonte: "mencoes",
        tipoMidia: "desconhecido",
        legenda: pagina.titulo,
        url: pagina.url,
        publicadoEm: janela.inicio,
        ehMencao: true,
        autorMencao: pseudonimoAutor(projectId, pagina.autor ?? pagina.url, params.marca),
        videoUrl: null,
        imagens: [],
        metricas: [],
        comentarios: [],
      });
    }

    // TikTok e Instagram de terceiros: reusa os normalizadores das Fases 1 e 2.
    const tt = normalizarVideosTiktok(ttBrutos, { projectId, janela })
      .filter((p) => citaMarca(p.legenda, termosFiltro))
      .slice(0, TETO_TIKTOK)
      .map((p) => comoMencao(p, "tiktok"));
    const ig = normalizarPosts(igBrutos, { projectId, janela })
      .filter((p) => citaMarca(p.legenda, termosFiltro))
      .slice(0, TETO_INSTAGRAM)
      .map((p) => comoMencao(p, "instagram"));

    // YouTube de terceiros: normaliza video e anexa comentarios.
    const yt: PostColetado[] = [];
    for (const v of ytBrutos.slice(0, TETO_YOUTUBE)) {
      const post = normalizarVideoYoutube(v);
      if (!post || !citaMarca(post.legenda, termosFiltro)) continue;
      post.comentarios = (ytComentarios[post.externalId] ?? [])
        .map((c) => normalizarComentarioYoutube(c, { projectId }))
        .filter((c): c is ComentarioColetado => c !== null);
      yt.push(comoMencao(post, "youtube"));
    }

    posts.push(...tt, ...ig, ...yt);
    return { posts: dedup(posts), lacunas: [] };
  }

  const lacunas: LacunaColeta[] = [];
  const base = params.webhookBase ?? "";
  const posts: PostColetado[] = [];

  // Rota 1: web via Firecrawl sobre as URLs de terceiros que ranqueiam na SERP.
  for (const url of urlsTerceiros.slice(0, TETO_WEB)) {
    const res = await scrape(url);
    await registrarCustoEvent({
      fonte: "mencoes",
      descricao: `Firecrawl mencao web ${url}`,
      custoBRL: custoFirecrawl(1),
    });
    if (res.bloqueado || !citaMarca(res.markdown, termosFiltro)) continue;
    posts.push({
      externalId: `web:${url}`,
      fonte: "mencoes",
      tipoMidia: "desconhecido",
      legenda: res.markdown.slice(0, 160),
      url,
      publicadoEm: janela.inicio,
      ehMencao: true,
      autorMencao: pseudonimoAutor(projectId, url, params.marca),
      videoUrl: null,
      imagens: [],
      metricas: [],
      comentarios: [],
    });
  }

  // Rota 2: TikTok de terceiros por palavra-chave/hashtag (Apify, webhook).
  const termoBusca = termosFiltro[0] ?? params.marca;
  try {
    const tokenTt = await wait.createToken({ timeout: "1h", tags: [projectId] });
    const runTt = await iniciarRun(
      ACTOR_TIKTOK,
      {
        searchQueries: [termoBusca],
        resultsPerPage: TETO_TIKTOK,
        shouldDownloadVideos: false,
        oldestPostDate: janela.inicio,
      },
      `${base}/api/webhooks/apify?token=${tokenTt.id}`,
    );
    await registrarCustoEvent({
      fonte: "mencoes",
      descricao: "Apify tiktok-scraper (mencoes)",
      custoBRL: custoApifyRun(0.08),
    });
    const okTt = await wait.forToken<{ ok: boolean }>(tokenTt.id);
    if (okTt.ok && okTt.output.ok) {
      const brutos = await itensDoDataset(runTt.datasetId);
      posts.push(
        ...normalizarVideosTiktok(brutos, { projectId, janela })
          .filter((p) => citaMarca(p.legenda, termosFiltro))
          .slice(0, TETO_TIKTOK)
          .map((p) => comoMencao(p, "tiktok")),
      );
    } else {
      lacunas.push({ fonte: "mencoes", motivo: "Busca de mencoes no TikTok nao concluiu." });
    }
  } catch {
    lacunas.push({ fonte: "mencoes", motivo: "Busca de mencoes no TikTok falhou." });
  }

  // Rota 3: YouTube de terceiros por palavra-chave (Data API search.list).
  try {
    const ids = await buscarPorTermo(termoBusca, janela, TETO_YOUTUBE);
    await registrarCustoEvent({
      fonte: "mencoes",
      descricao: "YouTube search.list (mencoes)",
      custoBRL: custoYoutubeApi(100),
    });
    const detalhes = await detalhesDosVideos(ids);
    for (const d of detalhes) {
      const post = normalizarVideoYoutube(d);
      if (!post || !citaMarca(post.legenda, termosFiltro)) continue;
      const comentariosBrutos = await comentariosDoVideo(post.externalId);
      post.comentarios = comentariosBrutos
        .map((c) => normalizarComentarioYoutube(c, { projectId }))
        .filter((c): c is ComentarioColetado => c !== null);
      posts.push(comoMencao(post, "youtube"));
    }
  } catch {
    lacunas.push({ fonte: "mencoes", motivo: "Busca de mencoes no YouTube falhou." });
  }

  // Rota 4: Instagram de terceiros por hashtag (Apify, webhook).
  try {
    const tokenIg = await wait.createToken({ timeout: "1h", tags: [projectId] });
    const runIg = await iniciarRun(
      ACTOR_INSTAGRAM,
      { hashtags: [termoBusca.replace(/\s+/g, "")], resultsLimit: TETO_INSTAGRAM },
      `${base}/api/webhooks/apify?token=${tokenIg.id}`,
    );
    await registrarCustoEvent({
      fonte: "mencoes",
      descricao: "Apify instagram-hashtag-scraper (mencoes)",
      custoBRL: custoApifyRun(0.08),
    });
    const okIg = await wait.forToken<{ ok: boolean }>(tokenIg.id);
    if (okIg.ok && okIg.output.ok) {
      const brutos = await itensDoDataset(runIg.datasetId);
      posts.push(
        ...normalizarPosts(brutos, { projectId, janela })
          .filter((p) => citaMarca(p.legenda, termosFiltro))
          .slice(0, TETO_INSTAGRAM)
          .map((p) => comoMencao(p, "instagram")),
      );
    } else {
      lacunas.push({ fonte: "mencoes", motivo: "Busca de mencoes no Instagram nao concluiu." });
    }
  } catch {
    lacunas.push({ fonte: "mencoes", motivo: "Busca de mencoes no Instagram falhou." });
  }

  return { posts: dedup(posts), lacunas };
}
