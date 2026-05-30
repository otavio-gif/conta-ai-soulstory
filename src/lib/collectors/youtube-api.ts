// Cliente REST da YouTube Data API v3 (PRD secao 3.2 e 12). Resolve o canal a
// partir do handle, lista os videos da janela (playlist de uploads), busca as
// estatisticas publicas e os comentarios, e tenta a legenda oficial via o
// endpoint publico timedtext. Sincrono (sem waitpoint), igual ao Firecrawl.
//
// Com MOCK_EXTERNAL=1 este cliente nao e chamado: o coletor le fixtures.

import { requireEnv } from "@/lib/env";
import { custoYoutubeApi, registrarCustoEvent } from "@/lib/cost";
import { fetchComRetry } from "@/lib/collectors/retry";

const BASE = "https://www.googleapis.com/youtube/v3";

async function chamarApi(
  recurso: string,
  params: Record<string, string>,
  unidades: number,
): Promise<Record<string, unknown>> {
  const token = requireEnv("YOUTUBE_API_KEY");
  const query = new URLSearchParams({ ...params, key: token }).toString();
  const resp = await fetchComRetry(`${BASE}/${recurso}?${query}`, {});
  if (!resp.ok) {
    throw new Error(`YouTube Data API ${recurso} falhou: ${resp.status}`);
  }
  await registrarCustoEvent({
    fonte: "youtube",
    descricao: `YouTube Data API ${recurso}`,
    custoBRL: custoYoutubeApi(unidades),
  });
  return (await resp.json()) as Record<string, unknown>;
}

/** Resolve o id do canal e a playlist de uploads a partir do handle do briefing. */
export async function resolverCanal(
  handle: string,
): Promise<{ channelId: string; uploadsPlaylistId: string; titulo: string } | null> {
  const limpo = handle.replace(/^@/, "");
  // forHandle e o caminho moderno; mantem busca por id como alternativa.
  const json = await chamarApi(
    "channels",
    handle.startsWith("UC")
      ? { part: "contentDetails,snippet", id: limpo }
      : { part: "contentDetails,snippet", forHandle: limpo },
    1,
  );
  const items = (json.items as Record<string, unknown>[]) ?? [];
  const canal = items[0];
  if (!canal) return null;
  const contentDetails = (canal.contentDetails as Record<string, unknown>) ?? {};
  const related = (contentDetails.relatedPlaylists as Record<string, unknown>) ?? {};
  const snippet = (canal.snippet as Record<string, unknown>) ?? {};
  return {
    channelId: String(canal.id ?? ""),
    uploadsPlaylistId: String(related.uploads ?? ""),
    titulo: String(snippet.title ?? ""),
  };
}

/** Itens da playlist de uploads dentro da janela (paginado). */
export async function videosDoCanal(
  uploadsPlaylistId: string,
  janela: { inicio: string; fim: string },
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken = "";
  const inicio = new Date(janela.inicio).getTime();
  const fim = new Date(janela.fim).getTime();
  for (;;) {
    const json = await chamarApi(
      "playlistItems",
      {
        part: "contentDetails",
        playlistId: uploadsPlaylistId,
        maxResults: "50",
        ...(pageToken ? { pageToken } : {}),
      },
      1,
    );
    const items = (json.items as Record<string, unknown>[]) ?? [];
    for (const it of items) {
      const cd = (it.contentDetails as Record<string, unknown>) ?? {};
      const id = String(cd.videoId ?? "");
      const publicadoEm = new Date(String(cd.videoPublishedAt ?? "")).getTime();
      if (!id) continue;
      if (Number.isNaN(publicadoEm) || (publicadoEm >= inicio && publicadoEm <= fim)) {
        ids.push(id);
      }
    }
    pageToken = String(json.nextPageToken ?? "");
    if (!pageToken) break;
  }
  return ids;
}

/**
 * Busca videos de terceiros por termo na janela (search.list). Usado pela coleta
 * de mencoes (Fase 3): videos que falam da marca sem ser do canal dela. Retorna
 * os ids encontrados, que depois passam por detalhesDosVideos e comentarios.
 */
export async function buscarPorTermo(
  termo: string,
  janela: { inicio: string; fim: string },
  maxResultados = 25,
): Promise<string[]> {
  const json = await chamarApi(
    "search",
    {
      part: "snippet",
      q: termo,
      type: "video",
      maxResults: String(Math.min(50, maxResultados)),
      order: "relevance",
      publishedAfter: new Date(janela.inicio).toISOString(),
      publishedBefore: new Date(janela.fim).toISOString(),
    },
    // search.list custa 100 unidades de quota por chamada.
    100,
  );
  const items = (json.items as Record<string, unknown>[]) ?? [];
  const ids: string[] = [];
  for (const it of items) {
    const id = (it.id as Record<string, unknown>) ?? {};
    const videoId = String(id.videoId ?? "");
    if (videoId) ids.push(videoId);
  }
  return ids;
}

/** Metadados e estatisticas publicas dos videos (lotes de 50). */
export async function detalhesDosVideos(ids: string[]): Promise<Record<string, unknown>[]> {
  const detalhes: Record<string, unknown>[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const lote = ids.slice(i, i + 50);
    const json = await chamarApi(
      "videos",
      { part: "snippet,statistics", id: lote.join(",") },
      1,
    );
    detalhes.push(...((json.items as Record<string, unknown>[]) ?? []));
  }
  return detalhes;
}

/** Comentarios de um video (commentThreads, paginado). */
export async function comentariosDoVideo(videoId: string): Promise<Record<string, unknown>[]> {
  const comentarios: Record<string, unknown>[] = [];
  let pageToken = "";
  for (;;) {
    let json: Record<string, unknown>;
    try {
      json = await chamarApi(
        "commentThreads",
        {
          part: "snippet",
          videoId,
          maxResults: "100",
          textFormat: "plainText",
          ...(pageToken ? { pageToken } : {}),
        },
        1,
      );
    } catch {
      // Comentarios desativados ou indisponiveis: nao quebra a coleta do video.
      break;
    }
    comentarios.push(...((json.items as Record<string, unknown>[]) ?? []));
    pageToken = String(json.nextPageToken ?? "");
    if (!pageToken) break;
  }
  return comentarios;
}

/**
 * Tenta a legenda oficial via o endpoint publico timedtext. Devolve null quando
 * o video nao tem legenda publicada, sinalizando o fallback de transcricao.
 */
export async function legendaOficial(
  videoId: string,
  idioma: string,
): Promise<{ texto: string; idioma: string } | null> {
  try {
    const url = `https://www.youtube.com/api/timedtext?lang=${encodeURIComponent(idioma)}&v=${encodeURIComponent(videoId)}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const xml = await resp.text();
    if (!xml.trim()) return null;
    const texto = xml
      .replace(/<[^>]+>/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
    if (!texto) return null;
    return { texto, idioma };
  } catch {
    return null;
  }
}
