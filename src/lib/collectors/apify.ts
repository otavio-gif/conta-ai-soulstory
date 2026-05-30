// Cliente REST do Apify para os actors oficiais de Instagram. Coleta assincrona:
// inicia a run com um webhook que fecha o waitpoint do orquestrador; quando a
// run termina, o estagio retoma e busca os itens do dataset (PRD secao 6 e 15).
//
// Com MOCK_EXTERNAL=1 este cliente nao e chamado: os coletores leem fixtures.

import { requireEnv } from "@/lib/env";
import { fetchComRetry } from "@/lib/collectors/retry";

const BASE = "https://api.apify.com/v2";

/**
 * Configuracao de proxy do Apify. Datacenter por padrao (mais barato). O coletor
 * escala para residencial so como fallback de bloqueio (PRD secao 15, Fase 4).
 */
export function proxyApify(residencial: boolean): {
  useApifyProxy: true;
  apifyProxyGroups: string[];
} {
  return {
    useApifyProxy: true,
    apifyProxyGroups: residencial ? ["RESIDENTIAL"] : ["BUILDPROXIES"],
  };
}

export interface RunApify {
  runId: string;
  datasetId: string;
}

interface WebhookApify {
  eventTypes: string[];
  requestUrl: string;
}

function webhooksParam(webhooks: WebhookApify[]): string {
  return Buffer.from(JSON.stringify(webhooks), "utf8").toString("base64");
}

/**
 * Inicia uma run do actor com webhook de conclusao. Retorna runId e datasetId
 * imediatamente (o dataset e populado ao longo da run).
 */
export async function iniciarRun(
  actorId: string,
  input: unknown,
  webhookRequestUrl: string,
): Promise<RunApify> {
  const token = requireEnv("APIFY_TOKEN");
  const webhooks = webhooksParam([
    {
      eventTypes: ["ACTOR.RUN.SUCCEEDED", "ACTOR.RUN.FAILED", "ACTOR.RUN.ABORTED"],
      requestUrl: webhookRequestUrl,
    },
  ]);
  const url = `${BASE}/acts/${actorId}/runs?token=${token}&webhooks=${webhooks}`;
  const resp = await fetchComRetry(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!resp.ok) {
    throw new Error(`Apify iniciarRun ${actorId} falhou: ${resp.status}`);
  }
  const json = (await resp.json()) as { data?: { id?: string; defaultDatasetId?: string } };
  const runId = json.data?.id;
  const datasetId = json.data?.defaultDatasetId;
  if (!runId || !datasetId) {
    throw new Error(`Apify iniciarRun ${actorId}: resposta sem run/dataset.`);
  }
  return { runId, datasetId };
}

/** Busca todos os itens de um dataset (paginado). */
export async function itensDoDataset(datasetId: string): Promise<unknown[]> {
  const token = requireEnv("APIFY_TOKEN");
  const itens: unknown[] = [];
  let offset = 0;
  const limit = 1000;
  for (;;) {
    const url = `${BASE}/datasets/${datasetId}/items?token=${token}&clean=true&offset=${offset}&limit=${limit}`;
    const resp = await fetchComRetry(url, {});
    if (!resp.ok) throw new Error(`Apify itensDoDataset falhou: ${resp.status}`);
    const pagina = (await resp.json()) as unknown[];
    itens.push(...pagina);
    if (pagina.length < limit) break;
    offset += limit;
  }
  return itens;
}

/**
 * Leitura parcial e best-effort do dataset (Fase 4): usada quando o waitpoint
 * estoura o timeout. O dataset do Apify e populado ao longo da run, entao ainda
 * ha valor no que ja foi coletado. Nunca lanca: devolve o que conseguir ler para
 * o coletor seguir com o parcial e registrar a lacuna do que faltou.
 */
export async function itensDoDatasetParcial(datasetId: string): Promise<unknown[]> {
  try {
    return await itensDoDataset(datasetId);
  } catch {
    return [];
  }
}
