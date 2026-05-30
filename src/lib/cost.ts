import { AsyncLocalStorage } from "node:async_hooks";
import { prisma } from "@/lib/db";
import { USD_BRL } from "@/lib/env";
import { PRECO_USD_POR_MTOK, type ModeloId } from "@/lib/ai/models";
import type {
  CustoEstimado,
  FontePlanejada,
  SourceKind,
} from "@/lib/pipeline/types";

// O orcamento nao e um teto fixo. Em runs reais e um orcamento por projeto que
// o operador aprova no checkpoint 1 (PRD secao 13). Este valor por mes e apenas
// uma sugestao de partida exibida no estimador.
export const ORCAMENTO_SUGERIDO_BRL_POR_MES = 35;

// Tarifas de estimativa por item, por fonte (BRL). Servem para projetar o custo
// antes de coletar; o custo real e medido por CostEvent a cada chamada paga.
const TARIFA_POR_FONTE: Record<SourceKind, number> = {
  instagram: 0.02,
  tiktok: 0.02,
  youtube: 0.015,
  reclame_aqui: 0.03,
  seo_serp: 0.005,
  mencoes: 0.02,
};

// ----- Contexto de custo do worker -----
// Cada run do orquestrador roda dentro de comContextoDeCusto(projectId, ...).
// Assim qualquer chamada paga (Anthropic, OpenAI, Apify, Firecrawl) grava o
// CostEvent no projeto certo, sem passar o projectId por toda a cadeia. Fora de
// um contexto (ex.: fixtures:pipeline sem banco), a gravacao e ignorada.
const contextoCusto = new AsyncLocalStorage<{ projectId: string }>();

export function comContextoDeCusto<T>(
  projectId: string,
  fn: () => Promise<T>,
): Promise<T> {
  return contextoCusto.run({ projectId }, fn);
}

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
  orcamentoBRL?: number | null;
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
  const orcamentoBRL =
    params.orcamentoBRL ?? ORCAMENTO_SUGERIDO_BRL_POR_MES * mesesJanela;

  return {
    porFonte,
    totalBRL,
    orcamentoBRL,
    mesesJanela,
    dentroDoOrcamento: totalBRL <= orcamentoBRL,
  };
}

/**
 * Grava um cost_event e atualiza o custo acumulado do projeto (PRD secao 13).
 * O projectId vem do contexto do run quando nao informado. Sem projeto
 * resolvido (modo fixtures sem banco), apenas ignora.
 */
export async function registrarCustoEvent(params: {
  projectId?: string;
  fonte: string;
  descricao?: string;
  custoBRL: number;
}): Promise<void> {
  const projectId = params.projectId ?? contextoCusto.getStore()?.projectId;
  if (!projectId) return;

  const { fonte, descricao, custoBRL } = params;
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

// ----- Conversores de custo por API -----

interface UsoTokens {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

/** Converte o uso de tokens de uma resposta Anthropic para BRL. */
export function custoAnthropic(modelo: ModeloId, uso: UsoTokens): number {
  const p = PRECO_USD_POR_MTOK[modelo];
  const usd =
    (uso.input_tokens * p.input +
      uso.output_tokens * p.output +
      (uso.cache_creation_input_tokens ?? 0) * p.cacheWrite +
      (uso.cache_read_input_tokens ?? 0) * p.cacheRead) /
    1_000_000;
  return Number((usd * USD_BRL).toFixed(4));
}

/** Custo aproximado de transcricao (gpt-4o-transcribe, ~USD 0,006 por minuto). */
export function custoTranscricao(segundos: number): number {
  const usd = (segundos / 60) * 0.006;
  return Number((usd * USD_BRL).toFixed(4));
}

/** Custo aproximado de uma run de actor Apify (estimativa por run). */
export function custoApifyRun(usd: number): number {
  return Number((usd * USD_BRL).toFixed(4));
}

/**
 * Custo aproximado de chamadas a YouTube Data API v3. A quota e gratuita ate o
 * teto diario (unidades), mas registramos um CostEvent simbolico por unidade
 * para que a medicao reflita o consumo de quota do projeto.
 */
export function custoYoutubeApi(unidades: number): number {
  const usd = unidades * 0.00001;
  return Number((usd * USD_BRL).toFixed(4));
}

/** Custo aproximado de scrapes Firecrawl (creditos consumidos x preco do credito). */
export function custoFirecrawl(creditos: number): number {
  const usd = creditos * 0.0008;
  return Number((usd * USD_BRL).toFixed(4));
}
