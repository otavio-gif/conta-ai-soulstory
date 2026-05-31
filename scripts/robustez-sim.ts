/*
 * Simulacao de robustez sob bloqueio (Fase 4), sem credenciais e sem rede. Prova
 * que o helper de retry, os timeouts proporcionais e as funcoes puras de
 * degradacao graciosa se comportam como o aceite exige:
 *
 *   pnpm robustez:sim
 *
 * Nenhuma chamada externa: o fetch e injetado, e a degradacao e exercitada nas
 * funcoes puras (classificarColeta, lacunaPorStatus) e nos normalizadores reais.
 */

import {
  atrasoBackoff,
  classificarColeta,
  fetchComRetry,
  statusTransitorio,
  timeoutColeta,
} from "@/lib/collectors/retry";
import { lacunaPorStatus } from "@/lib/collectors/lacunas";
import { normalizarPosts } from "@/lib/collectors/instagram";

let falhas = 0;
function ok(condicao: boolean, descricao: string) {
  console.log(condicao ? `OK: ${descricao}` : `FALHA: ${descricao}`);
  if (!condicao) falhas++;
}

/** fetch falso: devolve os status da fila em ordem, contando as chamadas. */
function fetchFila(status: number[]): {
  fn: typeof globalThis.fetch;
  chamadas: () => number;
} {
  let i = 0;
  const fn = (async () => {
    const s = status[Math.min(i, status.length - 1)];
    i++;
    return new Response(JSON.stringify({ s }), { status: s });
  }) as unknown as typeof globalThis.fetch;
  return { fn, chamadas: () => i };
}

async function main() {
  console.log("Simulacao de robustez sob bloqueio (sem rede)\n=============================================");

  const semEspera = async () => {};

  // 1. Backoff: 429, 429, 200 deve retentar e terminar em sucesso.
  console.log("\nRetry e backoff\n---------------");
  const transitorio = fetchFila([429, 429, 200]);
  const resp1 = await fetchComRetry("https://x", {}, { fetch: transitorio.fn, sleep: semEspera });
  ok(resp1.status === 200 && transitorio.chamadas() === 3, "429,429,200 retentou e terminou em 200 (3 chamadas).");

  // 2. 5xx tambem e transitorio.
  const servidor = fetchFila([503, 200]);
  const resp2 = await fetchComRetry("https://x", {}, { fetch: servidor.fn, sleep: semEspera });
  ok(resp2.status === 200 && servidor.chamadas() === 2, "503,200 retentou e terminou em 200 (2 chamadas).");

  // 3. 401 (auth) NAO e transitorio: falha rapido, sem retry.
  const auth = fetchFila([401, 200]);
  const resp3 = await fetchComRetry("https://x", {}, { fetch: auth.fn, sleep: semEspera });
  ok(resp3.status === 401 && auth.chamadas() === 1, "401 falhou rapido, sem retry (1 chamada).");

  // 4. 403 e 400 tambem param na primeira.
  ok(!statusTransitorio(403) && !statusTransitorio(400), "403 e 400 nao sao transitorios.");
  ok(statusTransitorio(429) && statusTransitorio(500) && statusTransitorio(502), "429, 500 e 502 sao transitorios.");

  // 5. Backoff cresce exponencialmente (sem jitter, random=0).
  const a0 = atrasoBackoff(0, 2000, () => 0);
  const a1 = atrasoBackoff(1, 2000, () => 0);
  const a2 = atrasoBackoff(2, 2000, () => 0);
  ok(a0 === 2000 && a1 === 4000 && a2 === 8000, "Backoff 2s, 4s, 8s (base 2000, sem jitter).");

  // 6. Timeout proporcional ao volume, com teto de 6h.
  console.log("\nTimeout proporcional\n--------------------");
  ok(timeoutColeta(0) === "1h", "Volume baixo -> 1h.");
  ok(timeoutColeta(250) === "4h", "250 itens -> 4h.");
  ok(timeoutColeta(100000) === "6h", "Volume enorme -> teto de 6h.");

  // 7. Degradacao graciosa: classificacao do resultado de coleta.
  console.log("\nDegradacao graciosa\n-------------------");
  ok(classificarColeta({ waitpointOk: true, itensColetados: 10 }) === "completa", "Waitpoint ok -> completa.");
  ok(classificarColeta({ waitpointOk: false, itensColetados: 7 }) === "parcial", "Timeout com itens -> parcial (segue com o parcial).");
  ok(classificarColeta({ waitpointOk: false, itensColetados: 0 }) === "escalar", "Timeout sem itens -> escalar (tenta proxy residencial).");

  ok(lacunaPorStatus("instagram", "Posts", "completa") === null, "Coleta completa nao gera lacuna.");
  ok((lacunaPorStatus("instagram", "Posts", "parcial")?.motivo ?? "").includes("parcial"), "Coleta parcial vira lacuna declarada.");
  ok((lacunaPorStatus("instagram", "Posts", "vazia")?.motivo ?? "").includes("indisponivel"), "Coleta vazia vira lacuna de fonte indisponivel.");

  // 8. O parcial ainda e aproveitado: normalizar dados parciais rende posts.
  console.log("\nAproveitamento do parcial\n-------------------------");
  const janela = { inicio: "2026-02-01T00:00:00.000Z", fim: "2026-03-31T23:59:59.000Z" };
  const parcialBruto = [
    { id: "p1", timestamp: "2026-02-10T12:00:00.000Z", caption: "parcial 1", likesCount: 10 },
    { id: "p2", timestamp: "2026-02-11T12:00:00.000Z", caption: "parcial 2", likesCount: 20 },
  ];
  const posts = normalizarPosts(parcialBruto, { projectId: "sim", brandHandle: "marca", janela });
  ok(posts.length === 2, "Dados parciais do dataset ainda rendem posts normalizados (pipeline segue).");

  console.log(
    falhas === 0
      ? "\nConcluido. Robustez sob bloqueio validada sem credenciais."
      : `\nFALHOU: ${falhas} verificacao(oes) de robustez.`,
  );
  if (falhas > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
