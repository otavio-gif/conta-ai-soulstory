// Robustez de coleta sob bloqueio (PRD secao 15, Fase 4). Helper unico de retry
// com backoff exponencial e jitter, extraido do padrao que ja existia no
// Firecrawl e aplicado a todos os clientes de API (Apify, DataForSEO, YouTube).
//
// Politica: so repete erro transitorio (429, 5xx, rede/timeout). Nao repete 4xx
// de autenticacao ou validacao (400, 401, 403, 404), porque retry nao conserta
// credencial errada nem parametro invalido: falha rapido e o coletor registra a
// lacuna. O fetch e injetavel para exercitar o backoff em teste, sem rede.

export interface OpcoesRetry {
  /** Numero maximo de tentativas (default 4, igual ao Firecrawl original). */
  tentativas?: number;
  /** Base do backoff em ms (default 2000: 2s, 4s, 8s, 16s). */
  baseMs?: number;
  /** Implementacao de fetch (default globalThis.fetch), injetavel para teste. */
  fetch?: typeof globalThis.fetch;
  /** Espera entre tentativas (default setTimeout), injetavel para teste. */
  sleep?: (ms: number) => Promise<void>;
  /** Funcao de aleatoriedade do jitter (default Math.random), injetavel. */
  random?: () => number;
}

const sleepPadrao = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Um status HTTP transitorio merece nova tentativa (limite ou erro do servidor). */
export function statusTransitorio(status: number): boolean {
  return status === 429 || status >= 500;
}

/** Backoff exponencial (base * 2^tentativa) com jitter de ate uma base. */
export function atrasoBackoff(tentativa: number, baseMs: number, random: () => number): number {
  return baseMs * 2 ** tentativa + Math.floor(random() * baseMs);
}

/**
 * Faz a requisicao com retry e backoff. Devolve a Response mesmo quando o status
 * e permanente (4xx nao transitorio ou ultima tentativa), para o chamador
 * decidir entre seguir, registrar lacuna ou lancar. So relanca em erro de rede
 * na ultima tentativa.
 */
export async function fetchComRetry(
  url: string,
  init: RequestInit,
  opcoes: OpcoesRetry = {},
): Promise<Response> {
  const tentativas = opcoes.tentativas ?? 4;
  const baseMs = opcoes.baseMs ?? 2000;
  const f = opcoes.fetch ?? globalThis.fetch;
  const sleep = opcoes.sleep ?? sleepPadrao;
  const random = opcoes.random ?? Math.random;

  let ultimoErro: unknown = null;
  for (let i = 0; i < tentativas; i++) {
    const ultima = i === tentativas - 1;
    try {
      const resp = await f(url, init);
      if (resp.ok || !statusTransitorio(resp.status) || ultima) return resp;
    } catch (err) {
      ultimoErro = err;
      if (ultima) throw err;
    }
    await sleep(atrasoBackoff(i, baseMs, random));
  }
  // Inalcancavel: o laco sempre retorna ou lanca na ultima tentativa.
  throw ultimoErro ?? new Error("fetchComRetry esgotou as tentativas.");
}

/**
 * Retry generico para operacoes que ja devolvem dados (nao Response). Repete em
 * qualquer erro lancado, ate o limite, com o mesmo backoff. O chamador deve
 * lancar so em falha transitoria; erros permanentes devem ser tratados antes.
 */
export async function comRetry<T>(
  fn: (tentativa: number) => Promise<T>,
  opcoes: OpcoesRetry = {},
): Promise<T> {
  const tentativas = opcoes.tentativas ?? 4;
  const baseMs = opcoes.baseMs ?? 2000;
  const sleep = opcoes.sleep ?? sleepPadrao;
  const random = opcoes.random ?? Math.random;

  let ultimoErro: unknown = null;
  for (let i = 0; i < tentativas; i++) {
    try {
      return await fn(i);
    } catch (err) {
      ultimoErro = err;
      if (i === tentativas - 1) throw err;
      await sleep(atrasoBackoff(i, baseMs, random));
    }
  }
  throw ultimoErro ?? new Error("comRetry esgotou as tentativas.");
}

/**
 * Resultado de uma passada de coleta assincrona (Apify). "completa": o waitpoint
 * fechou com sucesso. "parcial": estourou o timeout mas o dataset ja tinha
 * itens. "escalar": nada veio (bloqueio total), vale tentar escalar o proxy.
 * "vazia": nem a escalada trouxe itens, a fonte fica como lacuna declarada.
 */
export type ResultadoColeta = "completa" | "parcial" | "escalar" | "vazia";

/** Funcao pura de decisao de degradacao graciosa (testavel sem rede). */
export function classificarColeta(params: {
  waitpointOk: boolean;
  itensColetados: number;
}): ResultadoColeta {
  if (params.waitpointOk) return "completa";
  if (params.itensColetados > 0) return "parcial";
  return "escalar";
}

/**
 * Timeout de waitpoint proporcional ao volume estimado no checkpoint 1, com teto
 * generoso para marca grande. A coleta de comentarios em volume pode passar de
 * 2h; o valor cresce com o volume e nunca passa de 6h. Devolve uma duracao
 * Trigger.dev (ex.: "3h").
 */
export function timeoutColeta(volumeEstimado: number): string {
  const horas = Math.min(6, Math.max(1, Math.ceil(volumeEstimado / 100) + 1));
  return `${horas}h`;
}
