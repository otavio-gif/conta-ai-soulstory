// Persistencia dos resultados de cada estagio no Postgres (Prisma), usada pelo
// orquestrador. O script mock-pipeline nao usa estas funcoes (roda sem banco).

import { prisma } from "@/lib/db";
import { registrarCustoEvent } from "@/lib/cost";
import { MOCK_BRAND } from "@/lib/pipeline/mock-data";
import type {
  PlanoColeta,
  ResultadoVerificacao,
} from "@/lib/pipeline/types";

/** Grava as fontes ativas do plano de coleta. */
export async function persistirPlano(
  projectId: string,
  plano: PlanoColeta,
): Promise<void> {
  await prisma.source.deleteMany({ where: { projectId } });
  await prisma.source.createMany({
    data: plano.fontes.map((f) => ({
      projectId,
      kind: f.kind,
      handle: f.handle ?? null,
      url: f.url ?? null,
    })),
  });
}

/**
 * Grava os dados coletados (mock): artefatos brutos imutaveis, dados
 * normalizados, metricas (com disponivel=false para as nao publicas) e os
 * cost_events da coleta.
 */
export async function persistirColeta(projectId: string): Promise<void> {
  const b = MOCK_BRAND;

  for (const p of b.posts) {
    const artifact = await prisma.rawArtifact.create({
      data: {
        projectId,
        fonte: "instagram",
        url: p.url,
        payload: p as unknown as object,
      },
    });

    await prisma.post.create({
      data: {
        projectId,
        externalId: p.externalId,
        fonte: "instagram",
        legenda: p.legenda,
        url: p.url,
        publicadoEm: new Date(p.publicadoEm),
        raw: { rawArtifactId: artifact.id },
      },
    });

    // Metricas publicas e nao publicas (salvamentos/compartilhamentos = indisponiveis).
    const metricas: Array<{ nome: string; valor: number | null; disponivel: boolean }> = [
      { nome: "curtidas", valor: p.curtidas, disponivel: p.curtidas !== null },
      {
        nome: "comentarios",
        valor: p.comentariosCount,
        disponivel: p.comentariosCount !== null,
      },
      {
        nome: "visualizacoes",
        valor: p.visualizacoes,
        disponivel: p.visualizacoes !== null,
      },
      { nome: "salvamentos", valor: null, disponivel: false },
      { nome: "compartilhamentos", valor: null, disponivel: false },
    ];

    await prisma.metric.createMany({
      data: metricas.map((m) => ({
        projectId,
        itemTipo: "post",
        itemId: p.externalId,
        nome: m.nome,
        valor: m.valor,
        disponivel: m.disponivel,
        fonte: "instagram" as const,
      })),
    });
  }

  for (const c of b.comments) {
    await prisma.comment.create({
      data: {
        projectId,
        postId: c.postExternalId,
        autor: c.autor,
        texto: c.texto,
        publicadoEm: new Date(c.publicadoEm),
      },
    });
  }

  for (const c of b.complaints) {
    const artifact = await prisma.rawArtifact.create({
      data: {
        projectId,
        fonte: "reclame_aqui",
        url: `${b.site}/reclame-aqui`,
        payload: c as unknown as object,
      },
    });
    await prisma.complaint.create({
      data: {
        projectId,
        titulo: c.titulo,
        texto: c.texto,
        resposta: c.resposta,
        status: c.status,
        avaliacao: c.avaliacao,
        raw: { rawArtifactId: artifact.id },
      },
    });
  }

  for (const s of b.serp) {
    await prisma.serpResult.create({
      data: {
        projectId,
        termo: s.termo,
        posicao: s.posicao,
        titulo: s.titulo,
        url: s.url,
        snippet: s.snippet,
        tipo: s.tipo,
      },
    });
  }

  // cost_events da coleta (mock).
  await registrarCustoEvent({
    projectId,
    fonte: "instagram",
    descricao: "Coleta Apify (posts e comentarios)",
    custoBRL: 0.12,
  });
  await registrarCustoEvent({
    projectId,
    fonte: "reclame_aqui",
    descricao: "Coleta Firecrawl (reclamacoes)",
    custoBRL: 0.03,
  });
  await registrarCustoEvent({
    projectId,
    fonte: "seo_serp",
    descricao: "Coleta DataForSEO (SERP)",
    custoBRL: 0.01,
  });
}

/** Grava o evidence ledger verificado (PRD secao 9). */
export async function persistirVerificacao(
  projectId: string,
  verificacao: ResultadoVerificacao,
): Promise<void> {
  await prisma.claim.deleteMany({ where: { projectId } });
  await prisma.claim.createMany({
    data: verificacao.claims.map((c) => ({
      projectId,
      texto: c.texto,
      tipoSuporte: c.tipoSuporte,
      suportes: c.suportes,
      status: c.status,
      notaVerificacao: c.nota ?? null,
    })),
  });
}
