// Cliente Firecrawl para o Reclame Aqui e paginas de terceiros (PRD secao 6 e
// 12). Scrape com retry e backoff exponencial; bloqueio persistente vira lacuna
// declarada pelo coletor, sem nunca cair em estimativa.

import { requireEnv } from "@/lib/env";
import { fetchComRetry } from "@/lib/collectors/retry";

const BASE = "https://api.firecrawl.dev/v1";

export interface ScrapeFirecrawl {
  url: string;
  markdown: string;
  bloqueado: boolean;
}

/**
 * Scrape de uma URL em markdown, com retry e backoff compartilhados (Fase 4).
 * Bloqueio persistente (429, 5xx ou 403) vira `bloqueado=true`, que o coletor
 * trata como lacuna, sem nunca cair em estimativa.
 */
export async function scrape(
  url: string,
  tentativas = 4,
): Promise<ScrapeFirecrawl> {
  const apiKey = requireEnv("FIRECRAWL_API_KEY");
  const resp = await fetchComRetry(
    `${BASE}/scrape`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    },
    { tentativas },
  );
  if (resp.ok) {
    const json = (await resp.json()) as { data?: { markdown?: string } };
    return { url, markdown: json.data?.markdown ?? "", bloqueado: false };
  }
  return { url, markdown: "", bloqueado: true };
}
