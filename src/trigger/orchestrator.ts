import { logger, task, wait } from "@trigger.dev/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { comporDocx } from "@/lib/docx/adapter";
import {
  persistirColeta,
  persistirPlano,
  persistirVerificacao,
} from "@/lib/pipeline/persist";
import {
  analisar,
  coletar,
  comporReportSpec,
  interpretarBriefing,
  montarOutline,
  transcreverOcr,
  verificar,
} from "@/lib/pipeline/stages";
import {
  CHECKPOINTS,
  type CheckpointPayload,
  type Decisao,
  type DecisaoCheckpoint,
} from "@/lib/pipeline/types";
import { persistirRelatorio } from "@/lib/report-storage";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

/**
 * Cria o waitpoint, registra o checkpoint como `aguardando` e suspende o run
 * ate o operador decidir (PRD secao 10). Retorna a decisao humana.
 */
async function solicitarCheckpoint(
  projectId: string,
  numero: number,
  payload: CheckpointPayload,
): Promise<Decisao> {
  const def = CHECKPOINTS.find((c) => c.numero === numero);
  if (!def) throw new Error(`Checkpoint ${numero} desconhecido.`);

  const token = await wait.createToken({ timeout: "7d", tags: [projectId] });

  await prisma.checkpoint.upsert({
    where: { projectId_numero: { projectId, numero } },
    create: {
      projectId,
      numero,
      titulo: def.titulo,
      status: "aguardando",
      payload: toJson(payload),
      tokenId: token.id,
      publicAccessToken: token.publicAccessToken,
    },
    update: {
      titulo: def.titulo,
      status: "aguardando",
      payload: toJson(payload),
      tokenId: token.id,
      publicAccessToken: token.publicAccessToken,
      decisao: null,
      notas: null,
      resolvedAt: null,
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "aguardando_aprovacao" },
  });

  logger.info("Aguardando aprovacao no checkpoint", {
    numero,
    titulo: def.titulo,
  });

  const result = await wait.forToken<DecisaoCheckpoint>(token.id);

  if (!result.ok) {
    await prisma.checkpoint.update({
      where: { projectId_numero: { projectId, numero } },
      data: {
        status: "reprovado",
        notas: "Timeout aguardando aprovacao humana.",
        resolvedAt: new Date(),
      },
    });
    return "reprovado";
  }

  const { decisao, notas } = result.output;
  await prisma.checkpoint.update({
    where: { projectId_numero: { projectId, numero } },
    data: {
      status: decisao,
      decisao,
      notas: notas ?? null,
      resolvedAt: new Date(),
    },
  });
  await prisma.project.update({
    where: { id: projectId },
    data: { status: "em_andamento" },
  });

  return decisao;
}

/**
 * Roda um estagio, persiste, e abre o checkpoint. Em "ajuste" reexecuta o
 * estagio. Retorna null quando reprovado (ou timeout), sinalizando abortar.
 */
async function comCheckpoint<T>(
  projectId: string,
  numero: number,
  produzir: () => T | Promise<T>,
  montarPayload: (r: T) => CheckpointPayload,
  persistir?: (r: T) => Promise<void>,
): Promise<T | null> {
  for (;;) {
    const resultado = await produzir();
    if (persistir) await persistir(resultado);

    const decisao = await solicitarCheckpoint(
      projectId,
      numero,
      montarPayload(resultado),
    );

    if (decisao === "aprovado") return resultado;
    if (decisao === "reprovado") return null;
    // decisao === "ajuste": reexecuta o estagio e reabre o checkpoint.
    logger.info("Ajuste solicitado, reexecutando estagio", { numero });
  }
}

async function abortar(projectId: string): Promise<{ status: "reprovado" }> {
  await prisma.project.update({
    where: { id: projectId },
    data: { status: "reprovado" },
  });
  return { status: "reprovado" };
}

export const orchestrator = task({
  id: "orchestrator-ve",
  maxDuration: 3600,
  run: async (payload: { projectId: string }) => {
    const { projectId } = payload;

    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "em_andamento", triggerRunId: payload.projectId },
    });

    const janela = {
      inicio: project.janelaInicio.toISOString(),
      fim: project.janelaFim.toISOString(),
    };
    const briefingInput = { briefing: project.briefing, janela };

    // Checkpoint 1: Plano de coleta (com custo estimado).
    const plano = await comCheckpoint(
      projectId,
      1,
      () => interpretarBriefing(briefingInput),
      (p) => ({ id: "plano_coleta", plano: p }),
      (p) => persistirPlano(projectId, p),
    );
    if (!plano) return abortar(projectId);

    // Checkpoint 2: Inventario de coleta.
    const inventario = await comCheckpoint(
      projectId,
      2,
      () => coletar(),
      (inv) => ({ id: "inventario_coleta", inventario: inv }),
      () => persistirColeta(projectId),
    );
    if (!inventario) return abortar(projectId);

    // Checkpoint 3: Transcricoes e OCR.
    const amostra = await comCheckpoint(
      projectId,
      3,
      () => transcreverOcr(),
      (a) => ({ id: "transcricoes_ocr", amostra: a }),
    );
    if (!amostra) return abortar(projectId);

    // Checkpoint 4: Analises.
    const analise = await comCheckpoint(
      projectId,
      4,
      () => analisar(),
      (a) => ({ id: "analises", analise: a }),
    );
    if (!analise) return abortar(projectId);

    // Checkpoint 5: Outline do relatorio.
    const outline = await comCheckpoint(
      projectId,
      5,
      () => montarOutline(),
      (o) => ({ id: "outline", outline: o }),
    );
    if (!outline) return abortar(projectId);

    // Checkpoint 6: Verificacao factual (evidence ledger).
    const verificacao = await comCheckpoint(
      projectId,
      6,
      () => verificar(),
      (v) => ({ id: "verificacao_factual", verificacao: v }),
      (v) => persistirVerificacao(projectId, v),
    );
    if (!verificacao) return abortar(projectId);

    // Checkpoint 7: Draft final (compoe e armazena o docx antes de aprovar).
    const spec = comporReportSpec({
      plano,
      inventario,
      amostra,
      analise,
      outline,
      verificacao,
    });
    const docx = await comporDocx(spec);
    const { storagePath } = await persistirRelatorio({
      projectId,
      nome: plano.marca,
      docx,
    });

    const decisaoFinal = await solicitarCheckpoint(projectId, 7, {
      id: "draft_final",
      spec,
      storagePath,
    });
    if (decisaoFinal !== "aprovado") return abortar(projectId);

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "concluido" },
    });

    logger.info("Diagnostico concluido", { projectId, storagePath });
    return { status: "concluido", storagePath };
  },
});
