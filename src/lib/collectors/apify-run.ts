// Orquestracao de uma run assincrona do Apify com waitpoint, leitura parcial no
// timeout e escalada de proxy (PRD secao 15, Fase 4). Concentra num so lugar a
// robustez que antes cada coletor repetia: cria o waitpoint com timeout
// proporcional ao volume, inicia a run (proxy datacenter), e quando o waitpoint
// nao fecha tenta ler o parcial ja populado no dataset. So escala para proxy
// residencial (mais caro) quando nada veio, e uma unica vez. Cada run paga vira
// CostEvent, e so depois de a run iniciar de fato.

import { wait } from "@trigger.dev/sdk";
import { registrarCustoEvent } from "@/lib/cost";
import {
  iniciarRun,
  itensDoDataset,
  itensDoDatasetParcial,
  proxyApify,
} from "@/lib/collectors/apify";
import { classificarColeta, type ResultadoColeta } from "@/lib/collectors/retry";

export interface ColetaRunApify {
  itens: unknown[];
  status: ResultadoColeta;
}

export async function coletarRunApify(params: {
  projectId: string;
  actorId: string;
  fonte: string;
  descricao: string;
  webhookBase: string;
  timeout: string;
  /** Monta o input do actor, recebendo a configuracao de proxy a usar. */
  montarInput: (proxyConfiguration: ReturnType<typeof proxyApify>) => unknown;
  /** Custo em BRL da run, diferenciando datacenter de residencial. */
  custoBRL: (residencial: boolean) => number;
}): Promise<ColetaRunApify> {
  async function umaPassada(residencial: boolean): Promise<ColetaRunApify> {
    const token = await wait.createToken({
      timeout: params.timeout,
      tags: [params.projectId],
    });
    const run = await iniciarRun(
      params.actorId,
      params.montarInput(proxyApify(residencial)),
      `${params.webhookBase}/api/webhooks/apify?token=${token.id}`,
    );
    await registrarCustoEvent({
      fonte: params.fonte,
      descricao: `${params.descricao}${residencial ? " (proxy residencial)" : ""}`,
      custoBRL: params.custoBRL(residencial),
    });
    const resultado = await wait.forToken<{ ok: boolean }>(token.id);
    const sucesso = resultado.ok && resultado.output.ok;
    const itens = sucesso
      ? await itensDoDataset(run.datasetId)
      : await itensDoDatasetParcial(run.datasetId);
    return {
      itens,
      status: classificarColeta({ waitpointOk: sucesso, itensColetados: itens.length }),
    };
  }

  const primeira = await umaPassada(false);
  if (primeira.status !== "escalar") return primeira;

  // Bloqueio total na primeira passada: escala para proxy residencial uma vez.
  const segunda = await umaPassada(true);
  return segunda.status === "escalar" ? { itens: [], status: "vazia" } : segunda;
}
