// Cliente Firecrawl para o Reclame Aqui e paginas de terceiros (PRD secao 6 e
// 12). Scrape com retry e backoff exponencial; bloqueio persistente vira lacuna
// declarada pelo coletor, sem nunca cair em estimativa.

import { requireEnv } from "@/lib/env";

const BASE = "https://api.firecrawl.dev/v1";

export interface ScrapeFirecrawl {
  url: string;
  markdown: string;
  bloqueado: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Scrape de uma URL em markdown, com ate `tentativas` e backoff (2s, 4s, 8s). */
export async function scrape(
  url: string,
  tentativas = 4,
): Promise<ScrapeFirecrawl> {
  const apiKey = requireEnv("FIRECRAWL_API_KEY");
  for (let i = 0; i < tentativas; i++) {
    const resp = await fetch(`${BASE}/scrape`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
    });
    if (resp.ok) {
      const json = (await resp.json()) as { data?: { markdown?: string } };
      return { url, markdown: json.data?.markdown ?? "", bloqueado: false };
    }
    // 429 (limite) e 403 (bloqueio) sao retentaveis com backoff.
    if (resp.status === 429 || resp.status === 403 || resp.status >= 500) {
      await sleep(2000 * 2 ** i);
      continue;
    }
    break;
  }
  return { url, markdown: "", bloqueado: true };
}
