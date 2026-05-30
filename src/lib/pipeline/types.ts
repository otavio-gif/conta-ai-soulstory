// Tipos do pipeline de Visao Externa e definicao dos 7 checkpoints (PRD secao 10).
// Os estagios sao funcoes puras sobre dados mock nesta fase (aceite da Fase 0).

export type SourceKind =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "reclame_aqui"
  | "seo_serp"
  | "mencoes";

export type CheckpointId =
  | "plano_coleta"
  | "inventario_coleta"
  | "transcricoes_ocr"
  | "analises"
  | "outline"
  | "verificacao_factual"
  | "draft_final";

export interface CheckpointDef {
  numero: number;
  id: CheckpointId;
  titulo: string;
  descricao: string;
}

/** Os 7 checkpoints, na ordem do fluxo. Fonte unica para UI e orquestrador. */
export const CHECKPOINTS: readonly CheckpointDef[] = [
  {
    numero: 1,
    id: "plano_coleta",
    titulo: "Plano de coleta",
    descricao:
      "Fontes, perfis e palavras-chave interpretados, janela, volume e custo estimados.",
  },
  {
    numero: 2,
    id: "inventario_coleta",
    titulo: "Inventario de coleta",
    descricao:
      "Dados brutos coletados, volume real por fonte e lacunas declaradas.",
  },
  {
    numero: 3,
    id: "transcricoes_ocr",
    titulo: "Transcricoes e OCR",
    descricao: "Amostra de qualidade de transcricao de audio e OCR de texto.",
  },
  {
    numero: 4,
    id: "analises",
    titulo: "Analises",
    descricao:
      "Saidas do cientista de dados e do analista senior, com graficos e insights.",
  },
  {
    numero: 5,
    id: "outline",
    titulo: "Outline do relatorio",
    descricao: "Estrutura da Parte I e da Parte II antes de redigir.",
  },
  {
    numero: 6,
    id: "verificacao_factual",
    titulo: "Verificacao factual",
    descricao:
      "Auditoria do evidence ledger, com afirmacoes confirmadas e descartadas.",
  },
  {
    numero: 7,
    id: "draft_final",
    titulo: "Draft final",
    descricao: "Documento soulstory-docx completo com anexos, para aprovacao.",
  },
] as const;

export type Decisao = "aprovado" | "reprovado" | "ajuste";

export interface DecisaoCheckpoint {
  decisao: Decisao;
  notas?: string;
}

// ----- Custo -----

export interface CustoPorFonte {
  fonte: SourceKind;
  chamadas: number;
  custoBRL: number;
}

export interface CustoEstimado {
  porFonte: CustoPorFonte[];
  totalBRL: number;
  // Orcamento por projeto aprovado pelo operador no checkpoint 1 (nao e teto fixo).
  orcamentoBRL: number;
  mesesJanela: number;
  dentroDoOrcamento: boolean;
}

// ----- Estagios -----

export interface FontePlanejada {
  kind: SourceKind;
  handle?: string;
  url?: string;
  volumeEstimado: number;
}

export interface PlanoColeta {
  marca: string;
  tipo: "marca" | "influenciador";
  janela: { inicio: string; fim: string };
  palavrasChave: string[];
  /** Handle do perfil principal no Instagram, interpretado do briefing. */
  instagramHandle?: string;
  /** URL da pagina do Reclame Aqui, quando a marca tem presenca. */
  reclameAquiUrl?: string;
  fontes: FontePlanejada[];
  custo: CustoEstimado;
}

export interface LacunaColeta {
  fonte: SourceKind;
  motivo: string;
}

export interface InventarioFonte {
  fonte: SourceKind;
  posts: number;
  comentarios: number;
  videos: number;
  reclamacoes: number;
  artefatosBrutos: number;
}

export interface Inventario {
  porFonte: InventarioFonte[];
  totalArtefatos: number;
  lacunas: LacunaColeta[];
  metricasIndisponiveis: string[];
}

// ----- Corpus em memoria (dados normalizados que atravessam os estagios) -----

export interface MetricaPublica {
  nome: string;
  valor: number | null;
  // false quando a metrica nao e publica (salvamentos, compartilhamentos),
  // nunca estimada (PRD secao 9.5).
  disponivel: boolean;
}

export interface ComentarioColetado {
  id: string;
  // Pseudonimo estavel (autor_xxxx) por LGPD; a conta da marca nao e anonimizada.
  autor: string;
  texto: string;
  publicadoEm: string;
}

export type TipoMidia = "imagem" | "carrossel" | "reel" | "video" | "desconhecido";

export interface PostColetado {
  externalId: string;
  fonte: SourceKind;
  tipoMidia: TipoMidia;
  legenda: string;
  url: string;
  publicadoEm: string;
  // Quando o post e de terceiro citando a marca (midia espontanea).
  ehMencao: boolean;
  autorMencao?: string | null;
  videoUrl?: string | null;
  imagens: string[];
  metricas: MetricaPublica[];
  comentarios: ComentarioColetado[];
}

export interface ReclamacaoColetada {
  id: string;
  titulo: string;
  texto: string;
  resposta: string | null;
  status: string | null;
  avaliacao: number | null;
  url: string;
  publicadoEm?: string | null;
}

export interface IndicadoresReclameAqui {
  nota?: number | null;
  indiceResposta?: string | null;
  indiceSolucao?: string | null;
  reclamacoesRespondidas?: string | null;
}

export interface TranscricaoItem {
  postExternalId: string;
  texto: string;
  idioma?: string | null;
  modelo: string;
}

export interface OcrItem {
  postExternalId: string;
  texto: string;
}

/** Tudo que foi coletado e normalizado, threadado entre os estagios. */
export interface Corpus {
  marca: string;
  tipo: "marca" | "influenciador";
  janela: { inicio: string; fim: string };
  instagramHandle?: string;
  bio?: string;
  posts: PostColetado[];
  reclamacoes: ReclamacaoColetada[];
  indicadoresRA: IndicadoresReclameAqui | null;
  transcricoes: TranscricaoItem[];
  ocr: OcrItem[];
  lacunas: LacunaColeta[];
  metricasIndisponiveis: string[];
}

export interface AmostraItem {
  origem: string;
  tipo: "transcricao" | "ocr";
  trecho: string;
}

export interface AmostraTranscricao {
  totalTranscricoes: number;
  totalOcr: number;
  amostras: AmostraItem[];
}

export interface InsightAnalise {
  otica: "cientista_dados" | "analista_conteudo";
  titulo: string;
  conteudo: string;
  // Identificadores dos dados brutos que sustentam o insight (ledger).
  suportes: string[];
}

/** Grafico gerado pelo chart-builder, com PNG (ou dados para fallback de tabela). */
export interface GraficoRef {
  id: string;
  titulo: string;
  descricao: string;
  tipo: "barras" | "linha" | "distribuicao";
  caminhoPng?: string;
  // Dados que originaram o grafico, para anexo e fallback de tabela.
  dados: Array<{ rotulo: string; valor: number }>;
}

/** Afirmacao candidata, antes da verificacao factual (PRD secao 9.2). */
export interface ClaimCandidato {
  texto: string;
  tipoSuporte: "citacao_direta" | "contagem" | "agregacao" | "padrao_observado";
  suportes: string[];
  otica: "cientista_dados" | "analista_conteudo" | "sintetizador";
  construto?: string;
  parte: "I" | "II";
}

/** Achado consolidado por otica e construto metodologico. */
export interface FindingItem {
  otica: string;
  construto?: string;
  parte: "I" | "II";
  titulo: string;
  conteudo: string;
}

export interface SaidaAnalise {
  insights: InsightAnalise[];
  graficos: GraficoRef[];
  claims: ClaimCandidato[];
  findings: FindingItem[];
}

export interface SecaoOutline {
  titulo: string;
  bullets: string[];
}

export interface Outline {
  parteI: SecaoOutline[];
  parteII: SecaoOutline[];
}

export type ClaimStatus =
  | "confirmada"
  | "imprecisa"
  | "nao_sustentada"
  | "pendente";

export interface ClaimVerificada {
  texto: string;
  tipoSuporte: string;
  suportes: string[];
  status: ClaimStatus;
  nota?: string;
  parte?: "I" | "II";
  construto?: string;
}

export interface ResultadoVerificacao {
  claims: ClaimVerificada[];
  confirmadas: number;
  descartadas: number;
}

// ----- Contrato do documento (entrada da skill soulstory-docx) -----

/** Componentes visuais do padrao Soulstory mapeados pelo build script. */
export type ElementoSecao =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "callout"; eyebrow?: string; paragrafos: string[]; atribuicao?: string }
  | {
      tipo: "cards";
      titulo?: string;
      itens: Array<{ numero: string; titulo: string; texto: string }>;
    }
  | { tipo: "tabela"; titulo?: string; cabecalho: string[]; linhas: string[][] }
  | { tipo: "grafico"; graficoId: string; legenda?: string }
  | { tipo: "glossario"; itens: Array<{ termo: string; definicao: string }> };

export interface ReportSpecSecao {
  titulo: string;
  // Mantido por compatibilidade com o fallback embutido em adapter.ts.
  paragrafos: string[];
  // Componentes ricos consumidos pelo build script soulstory-docx.
  elementos?: ElementoSecao[];
}

export interface ReportSpecAnexo {
  titulo: string;
  descricao: string;
  elementos?: ElementoSecao[];
}

export interface ReportSpec {
  projeto: {
    nome: string;
    tipo: string;
    janela: { inicio: string; fim: string };
  };
  geradoEm: string;
  subtitulo?: { linha1: string; linha2: string };
  resumoCheckpoints: Array<{ numero: number; titulo: string; resumo: string }>;
  parteI: { titulo: string; secoes: ReportSpecSecao[] };
  parteII: { titulo: string; secoes: ReportSpecSecao[] };
  evidencias: Array<{ afirmacao: string; status: ClaimStatus; suporte: string }>;
  anexos: ReportSpecAnexo[];
  // Charts gerados, referenciados por id nos elementos do tipo "grafico".
  graficos?: GraficoRef[];
}

/** Payload tipado por checkpoint, usado no campo Checkpoint.payload (Json). */
export type CheckpointPayload =
  | { id: "plano_coleta"; plano: PlanoColeta }
  | { id: "inventario_coleta"; inventario: Inventario }
  | { id: "transcricoes_ocr"; amostra: AmostraTranscricao }
  | { id: "analises"; analise: SaidaAnalise }
  | { id: "outline"; outline: Outline }
  | { id: "verificacao_factual"; verificacao: ResultadoVerificacao }
  | { id: "draft_final"; spec: ReportSpec; storagePath?: string };
