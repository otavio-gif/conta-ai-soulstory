// Message Batches da Anthropic para as chamadas independentes por item em marca
// grande (PRD secao 8, Fase 4). A analise por post sao centenas de chamadas
// independentes: o lote e assincrono e custa 50% menos que a chamada sincrona,
// o que e essencial com o preset Opus na camada de maior volume. O resultado
// volta por custom_id, na mesma ordem das requisicoes.
//
// Com MOCK_EXTERNAL=1 nao chama a API: resolve cada requisicao pela fixture
// (mesma logica de chamarClaude), com concorrencia, preservando o caminho
// determinista do aceite sem credenciais.

import { MOCK_EXTERNAL } from "@/lib/env";
import { custoAnthropic, registrarCustoEvent } from "@/lib/cost";
import {
  type ChamadaClaude,
  type RespostaClaude,
  chamarClaude,
  clienteAnthropic,
  corpoMensagem,
  interpretarConteudo,
  modeloDaChamada,
} from "@/lib/ai/anthropic";
import { mapearComConcorrencia } from "@/lib/collectors/util";

// Concorrencia do caminho MOCK (le fixtures, sem rede nem rate limit real).
const CONCORRENCIA_MOCK = 8;
// Fator de desconto do batch sobre o custo da chamada sincrona (50%).
const FATOR_BATCH = 0.5;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Executa N chamadas independentes em lote, preservando a ordem de entrada.
 * Cada item vira um request com custom_id igual ao seu indice.
 */
export async function chamarClaudeEmLote<T>(
  requisicoes: ChamadaClaude<T>[],
): Promise<RespostaClaude<T>[]> {
  if (requisicoes.length === 0) return [];

  if (MOCK_EXTERNAL) {
    return mapearComConcorrencia(requisicoes, CONCORRENCIA_MOCK, (req) =>
      chamarClaude(req),
    );
  }

  const cliente = clienteAnthropic();
  const lote = await cliente.messages.batches.create({
    requests: requisicoes.map((req, i) => ({
      custom_id: `item-${i}`,
      params: corpoMensagem(req),
    })),
  });

  // Poll com backoff ate o lote terminar (processing_status === "ended").
  let estado = await cliente.messages.batches.retrieve(lote.id);
  let espera = 2000;
  while (estado.processing_status !== "ended") {
    await sleep(espera);
    espera = Math.min(espera * 2, 30000);
    estado = await cliente.messages.batches.retrieve(lote.id);
  }

  // Coleta os resultados por custom_id e remonta na ordem das requisicoes.
  const porIndice = new Map<number, RespostaClaude<T>>();
  for await (const item of await cliente.messages.batches.results(lote.id)) {
    const indice = Number(item.custom_id.replace("item-", ""));
    const req = requisicoes[indice];
    if (item.result.type === "succeeded") {
      const msg = item.result.message;
      await registrarCustoEvent({
        fonte: "anthropic",
        descricao: `${req.papel} (${modeloDaChamada(req)}, lote)`,
        custoBRL: custoAnthropic(modeloDaChamada(req), msg.usage) * FATOR_BATCH,
      });
      porIndice.set(indice, interpretarConteudo(msg.content, req.ferramenta));
    } else {
      // Falha de um item nao derruba o lote: entra vazio e o estagio segue.
      porIndice.set(indice, { texto: "", dados: null });
    }
  }

  return requisicoes.map((_, i) => porIndice.get(i) ?? { texto: "", dados: null });
}
