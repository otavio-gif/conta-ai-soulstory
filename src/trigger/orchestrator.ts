import { logger, task, wait } from "@trigger.dev/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { comporDocx } from "@/lib/docx/adapter";
import { comContextoDeCusto } from "@/lib/cost";
import { comporRelatorio } from "@/lib/ai/redacao";
import {
  persistirAnalise,
  persistirColeta,
  persistirPlano,
  persistirTranscricoes,
  persistirVerificacao,
} from "@/lib/pipeline/persist";
import {
  analisar,
  coletar,
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

    // Todo o run roda dentro do contexto de custo, para que cada chamada paga
    // (Anthropic, OpenAI, Apify, Firecrawl) grave um CostEvent neste projeto.
    return comContextoDeCusto(projectId, async () => {
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

      // Checkpoint 1: Plano de coleta (com custo estimado e orcamento do projeto).
      const plano = await comCheckpoint(
        projectId,
        1,
        () => interpretarBriefing(briefingInput),
        (p) => ({ id: "plano_coleta", plano: p }),
        (p) => persistirPlano(projectId, p),
      );
      if (!plano) return abortar(projectId);

      // Checkpoint 2: Inventario de coleta (corpus real coletado).
      const coleta = await comCheckpoint(
        projectId,
        2,
        () => coletar(plano, projectId),
        (r) => ({ id: "inventario_coleta", inventario: r.inventario }),
        (r) => persistirColeta(projectId, r.corpus),
      );
      if (!coleta) return abortar(projectId);

      // Checkpoint 3: Transcricoes e OCR (enriquece o corpus).
      const transc = await comCheckpoint(
        projectId,
        3,
        () => transcreverOcr(coleta.corpus),
        (r) => ({ id: "transcricoes_ocr", amostra: r.amostra }),
        (r) => persistirTranscricoes(projectId, r.corpus),
      );
      if (!transc) return abortar(projectId);

      // Checkpoint 4: Analises (duas oticas e sintese metodologica).
      const analise = await comCheckpoint(
        projectId,
        4,
        () => analisar(transc.corpus, projectId),
        (a) => ({ id: "analises", analise: a }),
        (a) => persistirAnalise(projectId, a),
      );
      if (!analise) return abortar(projectId);

      // Checkpoint 5: Outline do relatorio.
      const outline = await comCheckpoint(
        projectId,
        5,
        () => montarOutline(analise),
        (o) => ({ id: "outline", outline: o }),
      );
      if (!outline) return abortar(projectId);

      // Checkpoint 6: Verificacao factual (evidence ledger, bloqueante).
      const verificacao = await comCheckpoint(
        projectId,
        6,
        () => verificar(transc.corpus, analise),
        (v) => ({ id: "verificacao_factual", verificacao: v }),
        (v) => persistirVerificacao(projectId, v),
      );
      if (!verificacao) return abortar(projectId);

      // Checkpoint 7: Draft final (redige, compoe e armazena o docx).
      const spec = await comporRelatorio({
        plano,
        corpus: transc.corpus,
        inventario: coleta.inventario,
        amostra: transc.amostra,
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
    });
  },
});
