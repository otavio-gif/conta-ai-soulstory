// Persistencia dos resultados de cada estagio no Postgres (Prisma), usada pelo
// orquestrador. Os estagios produzem o corpus em memoria; aqui ele vira
// artefatos brutos imutaveis (com proveniencia) e dados normalizados. O script
// de fixtures roda sem banco e nao chama estas funcoes.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  Corpus,
  PlanoColeta,
  ResultadoVerificacao,
  SaidaAnalise,
} from "@/lib/pipeline/types";

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

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
 * Grava o corpus coletado: artefatos brutos imutaveis com proveniencia, posts,
 * comentarios (autor ja pseudonimizado), metricas (com disponivel=false para as
 * nao publicas) e reclamacoes.
 */
export async function persistirColeta(
  projectId: string,
  corpus: Corpus,
): Promise<void> {
  for (const p of corpus.posts) {
    const artifact = await prisma.rawArtifact.create({
      data: {
        projectId,
        fonte: p.fonte,
        url: p.url,
        payload: toJson(p),
      },
    });

    const raw = toJson({
      rawArtifactId: artifact.id,
      tipoMidia: p.tipoMidia,
      ehMencao: p.ehMencao,
      autorMencao: p.autorMencao ?? null,
      videoUrl: p.videoUrl ?? null,
      imagens: p.imagens,
    });

    // Instagram e mencoes nao video vao para o modelo Post; videos de TikTok,
    // YouTube e mencoes em video para o modelo Video (PRD secao 11). Ambos
    // compartilham comentarios e metricas.
    const ehVideo = p.tipoMidia === "reel" || p.tipoMidia === "video";
    const comoPost = p.fonte === "instagram" || (p.fonte === "mencoes" && !ehVideo);
    if (comoPost) {
      await prisma.post.create({
        data: {
          projectId,
          externalId: p.externalId,
          fonte: p.fonte,
          legenda: p.legenda,
          url: p.url,
          publicadoEm: new Date(p.publicadoEm),
          raw,
        },
      });
    } else {
      await prisma.video.create({
        data: {
          projectId,
          externalId: p.externalId,
          fonte: p.fonte,
          titulo: p.legenda,
          url: p.url,
          publicadoEm: new Date(p.publicadoEm),
          raw,
        },
      });
    }

    await prisma.metric.createMany({
      data: p.metricas.map((m) => ({
        projectId,
        itemTipo: comoPost ? "post" : "video",
        itemId: p.externalId,
        nome: m.nome,
        valor: m.valor,
        disponivel: m.disponivel,
        fonte: p.fonte,
      })),
    });

    for (const c of p.comentarios) {
      await prisma.comment.create({
        data: {
          projectId,
          postId: p.externalId,
          autor: c.autor,
          texto: c.texto,
          publicadoEm: c.publicadoEm ? new Date(c.publicadoEm) : null,
          raw: toJson({ id: c.id }),
        },
      });
    }
  }

  for (const r of corpus.reclamacoes) {
    const artifact = await prisma.rawArtifact.create({
      data: {
        projectId,
        fonte: "reclame_aqui",
        url: r.url,
        payload: toJson(r),
      },
    });
    await prisma.complaint.create({
      data: {
        projectId,
        titulo: r.titulo,
        texto: r.texto,
        resposta: r.resposta,
        status: r.status,
        avaliacao: r.avaliacao,
        raw: toJson({ rawArtifactId: artifact.id, id: r.id }),
      },
    });
  }

  // SEO e busca (Fase 3): cada item de SERP vira RawArtifact + SerpResult.
  for (const s of corpus.serp ?? []) {
    const artifact = await prisma.rawArtifact.create({
      data: {
        projectId,
        fonte: "seo_serp",
        url: s.url || `serp://${s.termo}/${s.externalId}`,
        payload: toJson(s),
      },
    });
    await prisma.serpResult.create({
      data: {
        projectId,
        termo: s.termo,
        posicao: s.posicao,
        titulo: s.titulo,
        url: s.url,
        snippet: s.snippet,
        tipo: s.tipo,
        raw: toJson({ rawArtifactId: artifact.id, dominio: s.dominio, ehTerceiro: s.ehTerceiro }),
      },
    });
  }

  // Volume de busca declarado pela API (nunca estimado): vira Metric por termo.
  for (const v of corpus.volumesBusca ?? []) {
    await prisma.metric.create({
      data: {
        projectId,
        itemTipo: "termo_busca",
        itemId: v.termo,
        nome: "volume_busca",
        valor: v.volume,
        disponivel: v.disponivel,
        fonte: "seo_serp",
      },
    });
  }
}

/** Grava transcricoes de Reels e OCR de carrosseis. */
export async function persistirTranscricoes(
  projectId: string,
  corpus: Corpus,
): Promise<void> {
  for (const t of corpus.transcricoes) {
    await prisma.transcript.create({
      data: {
        projectId,
        fonte: t.fonte,
        texto: t.texto,
        idioma: t.idioma ?? null,
        modelo: t.modelo,
      },
    });
  }
  for (const o of corpus.ocr) {
    await prisma.ocrText.create({
      data: { projectId, texto: o.texto },
    });
  }
}

/** Grava os achados consolidados por otica e construto. */
export async function persistirAnalise(
  projectId: string,
  analise: SaidaAnalise,
): Promise<void> {
  await prisma.finding.deleteMany({ where: { projectId } });
  if (analise.findings.length === 0) return;
  await prisma.finding.createMany({
    data: analise.findings.map((f) => ({
      projectId,
      otica: f.otica,
      construto: f.construto ?? null,
      parte: f.parte,
      titulo: f.titulo,
      conteudo: f.conteudo,
    })),
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
      suportes: toJson(c.suportes),
      status: c.status,
      notaVerificacao: c.nota ?? null,
    })),
  });
}
