// Mapa de modelos Claude por papel (preset Equilibrio aprovado no CP1 da Fase 1).
// A verificacao factual usa Opus por ser a guardia da fidelidade: poucas
// chamadas e alto risco de um falso confirmado. Sintese e redacao tambem em
// Opus pela qualidade. OCR e analise em Sonnet. Tarefas mecanicas em Haiku.

export const MODELOS = {
  opus: "claude-opus-4-8",
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5-20251001",
} as const;

export type ModeloId = (typeof MODELOS)[keyof typeof MODELOS];

export type PapelIA =
  | "interprete"
  | "ocr"
  | "analista_conteudo"
  | "cientista_dados"
  | "sintetizador"
  | "verificador"
  | "redator"
  | "editor_voz"
  | "mecanico";

export const MODELO_POR_PAPEL: Record<PapelIA, ModeloId> = {
  interprete: MODELOS.sonnet,
  ocr: MODELOS.sonnet,
  analista_conteudo: MODELOS.sonnet,
  cientista_dados: MODELOS.sonnet,
  sintetizador: MODELOS.opus,
  verificador: MODELOS.opus,
  redator: MODELOS.opus,
  editor_voz: MODELOS.haiku,
  mecanico: MODELOS.haiku,
};

// Preco por 1M de tokens em USD (entrada, saida, escrita e leitura de cache).
// Aproximacao para medicao de custo; cada chamada vira um CostEvent.
export const PRECO_USD_POR_MTOK: Record<
  ModeloId,
  { input: number; output: number; cacheWrite: number; cacheRead: number }
> = {
  [MODELOS.opus]: { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
  [MODELOS.sonnet]: { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  [MODELOS.haiku]: { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 },
};
