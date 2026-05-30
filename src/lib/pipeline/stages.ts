// Os 7 estagios do pipeline de Visao Externa, como funcoes puras sobre dados
// mock (PRD secao 8 e 10). Reusados pelo orquestrador Trigger.dev (com
// checkpoints e persistencia) e pelo script scripts/mock-pipeline.ts.

import { estimarCusto } from "@/lib/cost";
import { MOCK_BRAND } from "@/lib/pipeline/mock-data";
import type {
  AmostraTranscricao,
  Inventario,
  Outline,
  PlanoColeta,
  ReportSpec,
  ResultadoVerificacao,
  SaidaAnalise,
} from "@/lib/pipeline/types";

export interface BriefingInput {
  briefing: string;
  janela: { inicio: string; fim: string };
}

// 1. Interprete de briefing e escopo -> plano de coleta com custo estimado.
export function interpretarBriefing(input: BriefingInput): PlanoColeta {
  const b = MOCK_BRAND;
  const fontes = [
    {
      kind: "instagram" as const,
      handle: b.handles.instagram,
      volumeEstimado: b.posts.length + b.comments.length,
    },
    {
      kind: "reclame_aqui" as const,
      url: `${b.site}/reclame-aqui`,
      volumeEstimado: b.complaints.length,
    },
    {
      kind: "seo_serp" as const,
      volumeEstimado: b.serp.length,
    },
  ];

  return {
    marca: b.nome,
    tipo: b.tipo,
    janela: input.janela,
    palavrasChave: b.palavrasChave,
    fontes,
    custo: estimarCusto({ fontes, janela: input.janela }),
  };
}

// 2. Coletores -> inventario do que foi coletado e lacunas declaradas.
export function coletar(): Inventario {
  const b = MOCK_BRAND;
  const porFonte = [
    {
      fonte: "instagram" as const,
      posts: b.posts.length,
      comentarios: b.comments.length,
      videos: 0,
      reclamacoes: 0,
      artefatosBrutos: b.posts.length + b.comments.length,
    },
    {
      fonte: "reclame_aqui" as const,
      posts: 0,
      comentarios: 0,
      videos: 0,
      reclamacoes: b.complaints.length,
      artefatosBrutos: b.complaints.length,
    },
    {
      fonte: "seo_serp" as const,
      posts: 0,
      comentarios: 0,
      videos: 0,
      reclamacoes: 0,
      artefatosBrutos: b.serp.length,
    },
  ];

  return {
    porFonte,
    totalArtefatos: porFonte.reduce((a, f) => a + f.artefatosBrutos, 0),
    lacunas: [
      {
        fonte: "instagram",
        motivo:
          "Salvamentos e compartilhamentos nao sao publicos. Reportados como indisponiveis, sem estimativa.",
      },
    ],
    metricasIndisponiveis: [
      "instagram.salvamentos",
      "instagram.compartilhamentos",
    ],
  };
}

// 3. Transcritor e OCR -> amostra de qualidade.
export function transcreverOcr(): AmostraTranscricao {
  return {
    totalTranscricoes: 1,
    totalOcr: 1,
    amostras: [
      {
        origem: "ig_002 (Reel)",
        tipo: "transcricao",
        trecho:
          "Comece com agua a noventa e dois graus e despeje em movimentos circulares.",
      },
      {
        origem: "ig_003 (carrossel)",
        tipo: "ocr",
        trecho: "Edicao limitada de inverno. Pre-venda ate 10 de marco.",
      },
    ],
  };
}

// 4. Cientista de dados + analista senior de conteudo -> insights e graficos.
export function analisar(): SaidaAnalise {
  return {
    insights: [
      {
        otica: "cientista_dados",
        titulo: "Reels concentram o engajamento",
        conteudo:
          "O Reel de metodo (ig_002) teve 138 comentarios contra a media de 80 dos demais posts da janela.",
      },
      {
        otica: "analista_conteudo",
        titulo: "Narrativa de origem como promotor",
        conteudo:
          "O publico associa a marca a torra artesanal e a procedencia da Mantiqueira, citadas espontaneamente nos comentarios.",
      },
    ],
    graficos: [
      {
        titulo: "Engajamento por post",
        descricao: "Curtidas e comentarios dos posts da janela.",
      },
    ],
  };
}

// 5. Outline do relatorio (Parte I descritiva, Parte II sintese estrategica).
export function montarOutline(): Outline {
  return {
    parteI: [
      { titulo: "Como a marca e vista", bullets: ["Tom", "Temas", "Viralizacao"] },
      { titulo: "Linguagem nativa do publico", bullets: ["Glossario"] },
    ],
    parteII: [
      { titulo: "Gap de percepcao", bullets: ["Abertura da Parte II"] },
      {
        titulo: "Promotores, detratores e aceleradores",
        bullets: ["Promotores", "Detratores", "Aceleradores"],
      },
      { titulo: "Insumo para o DE/PARA", bullets: ["Fechamento"] },
    ],
  };
}

// 6. Verificadores de fato -> auditoria do evidence ledger (PRD secao 9).
export function verificar(): ResultadoVerificacao {
  const claims = [
    {
      texto:
        "O Reel de metodo recebeu 138 comentarios, acima da media da janela.",
      tipoSuporte: "contagem",
      suportes: ["ig_002"],
      status: "confirmada" as const,
    },
    {
      texto: "O publico cita espontaneamente a procedencia da Mantiqueira.",
      tipoSuporte: "citacao_direta",
      suportes: ["ig_001"],
      status: "confirmada" as const,
    },
    {
      texto: "A marca tem alto indice de salvamentos no Instagram.",
      tipoSuporte: "agregacao",
      suportes: [],
      status: "nao_sustentada" as const,
      nota: "Salvamentos nao sao publicos. Afirmacao descartada por falta de lastro.",
    },
  ];

  return {
    claims,
    confirmadas: claims.filter((c) => c.status === "confirmada").length,
    descartadas: claims.filter((c) => c.status === "nao_sustentada").length,
  };
}

// 7. Compositor de relatorio -> ReportSpec (entrada da skill soulstory-docx).
export function comporReportSpec(params: {
  plano: PlanoColeta;
  inventario: Inventario;
  amostra: AmostraTranscricao;
  analise: SaidaAnalise;
  outline: Outline;
  verificacao: ResultadoVerificacao;
}): ReportSpec {
  const { plano, inventario, analise, outline, verificacao } = params;

  return {
    projeto: {
      nome: plano.marca,
      tipo: plano.tipo,
      janela: plano.janela,
    },
    geradoEm: new Date().toISOString(),
    resumoCheckpoints: [
      {
        numero: 1,
        titulo: "Plano de coleta",
        resumo: `${plano.fontes.length} fontes, custo estimado de R$ ${plano.custo.totalBRL.toFixed(2)}.`,
      },
      {
        numero: 2,
        titulo: "Inventario de coleta",
        resumo: `${inventario.totalArtefatos} artefatos brutos, ${inventario.lacunas.length} lacuna(s) declarada(s).`,
      },
      {
        numero: 6,
        titulo: "Verificacao factual",
        resumo: `${verificacao.confirmadas} afirmacoes confirmadas, ${verificacao.descartadas} descartada(s).`,
      },
    ],
    parteI: {
      titulo: "Parte I. Retrato descritivo e exploratorio",
      secoes: outline.parteI.map((s) => ({
        titulo: s.titulo,
        paragrafos: analise.insights
          .filter((i) => i.otica === "analista_conteudo")
          .map((i) => i.conteudo),
      })),
    },
    parteII: {
      titulo: "Parte II. Sintese estrategica formal",
      secoes: outline.parteII.map((s) => ({
        titulo: s.titulo,
        paragrafos: analise.insights
          .filter((i) => i.otica === "cientista_dados")
          .map((i) => i.conteudo),
      })),
    },
    evidencias: verificacao.claims.map((c) => ({
      afirmacao: c.texto,
      status: c.status,
      suporte: c.suportes.length ? c.suportes.join(", ") : "sem lastro",
    })),
    anexos: [
      {
        titulo: "Anexo A. Inventario de coleta",
        descricao: `${inventario.totalArtefatos} artefatos brutos por fonte.`,
      },
    ],
  };
}
