// Traducao do resultado de uma coleta assincrona em lacuna declarada (Fase 4).
// Funcao pura: o coletor segue sempre com o que coletou (degradacao graciosa) e
// so registra a lacuna do que faltou, sem nunca estimar nem matar o pipeline.

import type { LacunaColeta, SourceKind } from "@/lib/pipeline/types";
import type { ResultadoColeta } from "@/lib/collectors/retry";

/**
 * Devolve a lacuna correspondente ao status, ou null quando a coleta foi
 * completa. "parcial": seguimos com o que veio. "vazia": a etapa nao retornou
 * nada nem apos retomada e escalada de proxy.
 */
export function lacunaPorStatus(
  fonte: SourceKind,
  etapa: string,
  status: ResultadoColeta,
): LacunaColeta | null {
  if (status === "completa") return null;
  if (status === "parcial") {
    return {
      fonte,
      motivo: `${etapa}: coleta parcial (timeout ou bloqueio). Seguindo com o que foi coletado na janela.`,
    };
  }
  return {
    fonte,
    motivo: `${etapa}: sem itens apos retomada e escalada de proxy. Fonte declarada indisponivel nesta etapa.`,
  };
}
