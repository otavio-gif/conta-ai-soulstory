// Mapa de modelos Claude por papel. Preset elevado ao padrao cliente seis
// digitos (Fase 4): a analise de conteudo por post e o cientista de dados (que a
// viralizacao herda) sobem para Opus, alem da sintese, verificacao e redacao que
// ja eram Opus. O custo maior na camada de maior volume fica contido pelo
// Message Batches (50% off) e pelo prompt caching, e visivel no CP1. Sentimento,
// temas, OCR e interprete seguem em Sonnet (passada unica ou batelada); tarefas
// mecanicas e o editor de voz em Haiku.

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
  | "sentimento"
  | "temas"
  | "sintetizador"
  | "verificador"
  | "redator"
  | "editor_voz"
  | "mecanico";

export const MODELO_POR_PAPEL: Record<PapelIA, ModeloId> = {
  interprete: MODELOS.sonnet,
  ocr: MODELOS.sonnet,
  // Analise por post e cientista de dados em Opus (preset seis digitos, Fase 4).
  analista_conteudo: MODELOS.opus,
  cientista_dados: MODELOS.opus,
  // Sentimento e mapa de temas (Fase 3): Sonnet, leitura qualitativa estruturada.
  sentimento: MODELOS.sonnet,
  temas: MODELOS.sonnet,
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
