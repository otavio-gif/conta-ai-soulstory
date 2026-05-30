// Cliente REST do DataForSEO (PRD secao 6 e 12), fonte unica de SEO e busca do
// projeto. A SERP organica (com PAA e featured snippets) vai por Task POST com
// pingback que fecha o waitpoint do orquestrador, no mesmo padrao do Apify. O
// volume de busca (Keywords Data) e as palavras relacionadas e o autocomplete
// (Labs e SERP autocomplete) vao em modo Live, por serem chamadas curtas.
//
// Com MOCK_EXTERNAL=1 este cliente nao e chamado: o coletor le fixtures. Volume
// de busca e sempre dado declarado da API, nunca estimado (PRD secao 9.5).

import { requireEnv } from "@/lib/env";
import { custoDataForSeo, registrarCustoEvent } from "@/lib/cost";

const BASE = "https://api.dataforseo.com/v3";

// Brasil, portugues. location_code 2076 e o codigo do Brasil no DataForSEO.
export const LOCATION_CODE = 2076;
export const LANGUAGE_CODE = "pt";

function autorizacao(): string {
  const login = requireEnv("DATAFORSEO_LOGIN");
  const senha = requireEnv("DATAFORSEO_PASSWORD");
  return `Basic ${Buffer.from(`${login}:${senha}`, "utf8").toString("base64")}`;
}

async function chamar(
  caminho: string,
  corpo: unknown,
): Promise<Record<string, unknown>> {
  const resp = await fetch(`${BASE}/${caminho}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: autorizacao(),
    },
    body: JSON.stringify(corpo),
  });
  if (!resp.ok) {
    throw new Error(`DataForSEO ${caminho} falhou: ${resp.status}`);
  }
  return (await resp.json()) as Record<string, unknown>;
}

/** Primeira task da resposta, onde o resultado fica em result[]. */
function primeiraTask(json: Record<string, unknown>): Record<string, unknown> {
  const tasks = (json.tasks as Record<string, unknown>[]) ?? [];
  return tasks[0] ?? {};
}

/**
 * Dispara a SERP organica por Task POST com pingback. O DataForSEO chama a
 * pingbackUrl ao concluir, fechando o waitpoint. Retorna o id da task para o
 * task_get posterior.
 */
export async function serpTaskPost(
  termo: string,
  pingbackUrl: string,
): Promise<string> {
  const json = await chamar("serp/google/organic/task_post", [
    {
      keyword: termo,
      location_code: LOCATION_CODE,
      language_code: LANGUAGE_CODE,
      device: "desktop",
      // O pingback_url e chamado quando a task fica pronta (fecha o waitpoint).
      pingback_url: pingbackUrl,
      people_also_ask_click_depth: 1,
    },
  ]);
  await registrarCustoEvent({
    fonte: "seo_serp",
    descricao: `DataForSEO SERP task_post (${termo})`,
    custoBRL: custoDataForSeo("serp"),
  });
  const id = primeiraTask(json).id;
  if (typeof id !== "string") {
    throw new Error("DataForSEO serpTaskPost: resposta sem id de task.");
  }
  return id;
}

/** Busca o resultado avancado de uma task SERP ja concluida (organico, PAA, snippet). */
export async function serpTaskGet(taskId: string): Promise<unknown[]> {
  const json = await chamar(`serp/google/organic/task_get/advanced/${taskId}`, {});
  const task = primeiraTask(json);
  return (task.result as unknown[]) ?? [];
}

/** Volume de busca por termo (Keywords Data, Google Ads), em modo Live. */
export async function volumeBuscaLive(termos: string[]): Promise<unknown[]> {
  const json = await chamar("keywords_data/google_ads/search_volume/live", [
    {
      keywords: termos,
      location_code: LOCATION_CODE,
      language_code: LANGUAGE_CODE,
    },
  ]);
  await registrarCustoEvent({
    fonte: "seo_serp",
    descricao: `DataForSEO search_volume (${termos.length} termos)`,
    custoBRL: custoDataForSeo("volume", termos.length),
  });
  return (primeiraTask(json).result as unknown[]) ?? [];
}

/** Palavras relacionadas a marca (DataForSEO Labs), em modo Live. */
export async function relacionadasLive(termo: string): Promise<unknown[]> {
  const json = await chamar("dataforseo_labs/google/related_keywords/live", [
    {
      keyword: termo,
      location_code: LOCATION_CODE,
      language_code: LANGUAGE_CODE,
      limit: 50,
    },
  ]);
  await registrarCustoEvent({
    fonte: "seo_serp",
    descricao: `DataForSEO related_keywords (${termo})`,
    custoBRL: custoDataForSeo("labs"),
  });
  return (primeiraTask(json).result as unknown[]) ?? [];
}

/** Sugestoes de autocomplete do Google (SERP autocomplete), em modo Live. */
export async function autocompleteLive(termo: string): Promise<unknown[]> {
  const json = await chamar("serp/google/autocomplete/live/advanced", [
    {
      keyword: termo,
      location_code: LOCATION_CODE,
      language_code: LANGUAGE_CODE,
    },
  ]);
  await registrarCustoEvent({
    fonte: "seo_serp",
    descricao: `DataForSEO autocomplete (${termo})`,
    custoBRL: custoDataForSeo("autocomplete"),
  });
  return (primeiraTask(json).result as unknown[]) ?? [];
}
