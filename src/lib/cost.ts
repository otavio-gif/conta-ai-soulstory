import { prisma } from "@/lib/db";
import type {
  CustoEstimado,
  FontePlanejada,
  SourceKind,
} from "@/lib/pipeline/types";

// Guardrail do PRD secao 13: alvo de ate R$ 35,00 por mes de janela analisada.
// E alerta, nao teto rigido.
export const GUARDRAIL_BRL_POR_MES = 35;

// Tarifas mock por chamada/item, por fonte (BRL). Substituir por custos reais
// das APIs (Apify, Firecrawl, DataForSEO, Whisper, tokens) a partir da Fase 1.
const TARIFA_POR_FONTE: Record<SourceKind, number> = {
  instagram: 0.02,
  tiktok: 0.02,
  youtube: 0.015,
  reclame_aqui: 0.03,
  seo_serp: 0.005,
  mencoes: 0.02,
};

/** Numero de meses (arredondado para cima, minimo 1) entre duas datas ISO. */
export function mesesEntre(inicioISO: string, fimISO: string): number {
  const inicio = new Date(inicioISO);
  const fim = new Date(fimISO);
  const dias = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.ceil(dias / 30));
}

/** Projeta o custo da coleta antes de coletar (entra no Checkpoint 1). */
export function estimarCusto(params: {
  fontes: FontePlanejada[];
  janela: { inicio: string; fim: string };
}): CustoEstimado {
  const { fontes, janela } = params;

  const porFonte = fontes.map((f) => {
    const tarifa = TARIFA_POR_FONTE[f.kind] ?? 0.02;
    return {
      fonte: f.kind,
      chamadas: f.volumeEstimado,
      custoBRL: Number((f.volumeEstimado * tarifa).toFixed(2)),
    };
  });

  const totalBRL = Number(
    porFonte.reduce((acc, p) => acc + p.custoBRL, 0).toFixed(2),
  );
  const mesesJanela = mesesEntre(janela.inicio, janela.fim);
  const guardrailBRL = GUARDRAIL_BRL_POR_MES * mesesJanela;

  return {
    porFonte,
    totalBRL,
    guardrailBRL,
    mesesJanela,
    dentroDoGuardrail: totalBRL <= guardrailBRL,
  };
}

/** Grava um cost_event e atualiza o custo acumulado do projeto (PRD secao 13). */
export async function registrarCustoEvent(params: {
  projectId: string;
  fonte: string;
  descricao?: string;
  custoBRL: number;
}): Promise<void> {
  const { projectId, fonte, descricao, custoBRL } = params;

  await prisma.$transaction([
    prisma.costEvent.create({
      data: { projectId, fonte, descricao, custoBRL },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: { custoAcumulado: { increment: custoBRL } },
    }),
  ]);
}
