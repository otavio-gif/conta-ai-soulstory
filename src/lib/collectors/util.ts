// Acessores seguros para payloads de API (formato nao garantido) e o
// pseudonimo de autor por hash estavel (LGPD, ver coletor-protocolos).

import { createHash } from "node:crypto";

export type Bruto = Record<string, unknown>;

export function comoObjeto(v: unknown): Bruto {
  return v && typeof v === "object" ? (v as Bruto) : {};
}

export function texto(o: Bruto, ...chaves: string[]): string {
  for (const k of chaves) {
    const v = o[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return "";
}

export function numero(o: Bruto, ...chaves: string[]): number | null {
  for (const k of chaves) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

export function lista(o: Bruto, ...chaves: string[]): unknown[] {
  for (const k of chaves) {
    const v = o[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

/**
 * Mapeia itens com concorrencia limitada, preservando a ordem de entrada. Usado
 * na transcricao e OCR em volume (muitos videos) para nao estourar rate limit
 * nem custo de uma vez, mantendo paralelismo controlado.
 */
export async function mapearComConcorrencia<T, R>(
  itens: T[],
  limite: number,
  fn: (item: T, indice: number) => Promise<R>,
): Promise<R[]> {
  const resultados = new Array<R>(itens.length);
  let proximo = 0;
  const teto = Math.max(1, limite);

  async function worker(): Promise<void> {
    for (;;) {
      const i = proximo++;
      if (i >= itens.length) return;
      resultados[i] = await fn(itens[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(teto, itens.length) }, worker);
  await Promise.all(workers);
  return resultados;
}

function normalizarHandle(handle: string): string {
  return handle.trim().replace(/^@/, "").toLowerCase();
}

/**
 * Pseudonimo estavel por projeto para autores de comentario (LGPD). A conta da
 * propria marca nao e anonimizada. Nunca publica o @ no relatorio.
 */
export function pseudonimoAutor(
  projectId: string,
  handle: string,
  brandHandle?: string,
): string {
  if (!handle) return "autor_anon";
  if (brandHandle && normalizarHandle(handle) === normalizarHandle(brandHandle)) {
    return normalizarHandle(handle);
  }
  const hash = createHash("sha256")
    .update(`${projectId}:${normalizarHandle(handle)}`)
    .digest("hex")
    .slice(0, 4);
  return `autor_${hash}`;
}
