// Redator do relatorio (PRD secao 3.6 e 8.2). Escreve as Partes I e II em
// profundidade de consultoria, usando SOMENTE afirmacoes verificadas. Roda em
// Opus. Os anexos por fonte sao montados de forma deterministica a partir do
// corpus e do ledger. O resultado passa pelo pente fino de voz (sem travessao).

import { bloco, blocoCacheavel, chamarClaude } from "@/lib/ai/anthropic";
import { doutrina } from "@/lib/ai/doctrine";
import { PROMPT_REDATOR } from "@/lib/ai/prompts";
import { afirmacoesValidas } from "@/lib/ai/verificacao";
import { aplicarVozSoulstory } from "@/lib/text";
import { formatBRL } from "@/lib/utils";
import type {
  AmostraTranscricao,
  ClaimVerificada,
  Corpus,
  ElementoSecao,
  Inventario,
  Outline,
  PlanoColeta,
  ReportSpec,
  ReportSpecAnexo,
  ReportSpecSecao,
  ResultadoVerificacao,
  SaidaAnalise,
} from "@/lib/pipeline/types";

interface SecaoRedigida {
  titulo: string;
  paragrafos: string[];
  callouts: Array<{ eyebrow?: string; texto: string }>;
  cards: Array<{ numero: string; titulo: string; texto: string }>;
  glossario: Array<{ termo: string; definicao: string }>;
  graficos: string[];
}

const SCHEMA_REDACAO = {
  type: "object",
  properties: {
    secoes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          paragrafos: { type: "array", items: { type: "string" } },
          callouts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                eyebrow: { type: "string" },
                texto: { type: "string" },
              },
              required: ["texto"],
            },
          },
          cards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                numero: { type: "string" },
                titulo: { type: "string" },
                texto: { type: "string" },
              },
              required: ["numero", "titulo", "texto"],
            },
          },
          glossario: {
            type: "array",
            items: {
              type: "object",
              properties: {
                termo: { type: "string" },
                definicao: { type: "string" },
              },
              required: ["termo", "definicao"],
            },
          },
          graficos: { type: "array", items: { type: "string" } },
        },
        required: ["titulo", "paragrafos"],
      },
    },
  },
  required: ["secoes"],
} as const;

function elementosDaSecao(s: SecaoRedigida): ElementoSecao[] {
  const out: ElementoSecao[] = [];
  for (const p of s.paragrafos ?? []) out.push({ tipo: "paragrafo", texto: p });
  for (const c of s.callouts ?? [])
    out.push({ tipo: "callout", eyebrow: c.eyebrow, paragrafos: [c.texto] });
  if ((s.cards ?? []).length > 0)
    out.push({
      tipo: "cards",
      itens: s.cards.map((c) => ({ numero: c.numero, titulo: c.titulo, texto: c.texto })),
    });
  for (const id of s.graficos ?? []) out.push({ tipo: "grafico", graficoId: id });
  if ((s.glossario ?? []).length > 0)
    out.push({ tipo: "glossario", itens: s.glossario });
  return out;
}

async function redigirParte(params: {
  parte: "I" | "II";
  outline: Array<{ titulo: string; bullets: string[] }>;
  analise: SaidaAnalise;
  validas: ClaimVerificada[];
  corpus: Corpus;
}): Promise<ReportSpecSecao[]> {
  const { parte, outline, analise, validas } = params;
  const findings = analise.findings.filter((f) => f.parte === parte);
  const insights = analise.insights.filter((i) =>
    parte === "I" ? i.otica === "analista_conteudo" : i.otica === "cientista_dados",
  );

  const material = {
    parte,
    secoesSugeridas: outline.map((s) => ({ titulo: s.titulo, bullets: s.bullets })),
    afirmacoesVerificadas: validas
      .filter((c) => c.parte === parte || !c.parte)
      .map((c) => ({ texto: c.texto, construto: c.construto, suportes: c.suportes })),
    findings: findings.map((f) => ({
      construto: f.construto,
      titulo: f.titulo,
      conteudo: f.conteudo,
    })),
    insights: insights.map((i) => ({ titulo: i.titulo, conteudo: i.conteudo })),
    graficosDisponiveis: analise.graficos.map((g) => ({ id: g.id, titulo: g.titulo })),
  };

  const resp = await chamarClaude<{ secoes: SecaoRedigida[] }>({
    papel: "redator",
    fixtureKey: `redacao-parte-${parte === "I" ? "1" : "2"}`,
    system: [
      bloco(PROMPT_REDATOR),
      await doutrina("visao-externa-metodo", "evidence-ledger"),
    ],
    conteudo: [
      blocoCacheavel(JSON.stringify(material, null, 2)),
      bloco(
        `Escreva a Parte ${parte} em profundidade de consultoria. Use apenas as afirmacoes verificadas. Marque metricas indisponiveis. Referencie os graficos pelo id quando ajudarem.`,
      ),
    ],
    maxTokens: 16000,
    ferramenta: {
      nome: "registrar_secoes",
      descricao: "Registra as secoes redigidas da parte do relatorio.",
      schema: SCHEMA_REDACAO as unknown as Record<string, unknown>,
      parse: (e) => e as { secoes: SecaoRedigida[] },
    },
  });

  return (resp.dados?.secoes ?? []).map((s) => ({
    titulo: s.titulo,
    paragrafos: s.paragrafos ?? [],
    elementos: elementosDaSecao(s),
  }));
}

function metrica(corpus: Corpus, externalId: string, nome: string): string {
  const post = corpus.posts.find((p) => p.externalId === externalId);
  const m = post?.metricas.find((x) => x.nome === nome);
  if (!m) return "n/d";
  return m.disponivel ? String(m.valor) : "indisponivel";
}

function anexos(
  corpus: Corpus,
  inventario: Inventario,
  verificacao: ResultadoVerificacao,
): ReportSpecAnexo[] {
  const lista: ReportSpecAnexo[] = [];

  lista.push({
    titulo: "Anexo A. Inventario de coleta",
    descricao: `${inventario.totalArtefatos} artefatos brutos por fonte, com lacunas e metricas indisponiveis declaradas.`,
    elementos: [
      {
        tipo: "tabela",
        titulo: "Volume por fonte",
        cabecalho: ["Fonte", "Posts", "Comentarios", "Videos", "Reclamacoes", "Artefatos"],
        linhas: inventario.porFonte.map((f) => [
          f.fonte,
          String(f.posts),
          String(f.comentarios),
          String(f.videos),
          String(f.reclamacoes),
          String(f.artefatosBrutos),
        ]),
      },
      {
        tipo: "callout",
        eyebrow: "Metricas indisponiveis",
        paragrafos: [
          `Nao sao publicas e nunca foram estimadas: ${inventario.metricasIndisponiveis.join(", ")}.`,
          ...inventario.lacunas.map((l) => `Lacuna em ${l.fonte}: ${l.motivo}`),
        ],
      },
    ],
  });

  const ordenados = corpus.posts
    .filter((p) => !p.ehMencao)
    .sort((a, b) => {
      const ca = a.metricas.find((m) => m.nome === "curtidas")?.valor ?? 0;
      const cb = b.metricas.find((m) => m.nome === "curtidas")?.valor ?? 0;
      return cb - ca;
    })
    .slice(0, 10);

  lista.push({
    titulo: "Anexo B. Top posts por eixo publico",
    descricao: "Ranking pelos eixos publicos disponiveis. Salvamentos e compartilhamentos nao entram por nao serem publicos.",
    elementos: [
      {
        tipo: "tabela",
        titulo: "Top posts",
        cabecalho: ["Post", "Tipo", "Data", "Curtidas", "Comentarios", "Visualizacoes"],
        linhas: ordenados.map((p) => [
          p.externalId,
          p.tipoMidia,
          p.publicadoEm.slice(0, 10),
          metrica(corpus, p.externalId, "curtidas"),
          metrica(corpus, p.externalId, "comentarios"),
          metrica(corpus, p.externalId, "visualizacoes"),
        ]),
      },
    ],
  });

  if (corpus.reclamacoes.length > 0 || corpus.indicadoresRA) {
    const elementos: ElementoSecao[] = [];
    if (corpus.indicadoresRA) {
      elementos.push({
        tipo: "callout",
        eyebrow: "Indicadores publicos do Reclame Aqui",
        paragrafos: [
          `Nota: ${corpus.indicadoresRA.nota ?? "n/d"}. Indice de resposta: ${corpus.indicadoresRA.indiceResposta ?? "n/d"}. Indice de solucao: ${corpus.indicadoresRA.indiceSolucao ?? "n/d"}.`,
        ],
      });
    }
    if (corpus.reclamacoes.length > 0) {
      elementos.push({
        tipo: "tabela",
        titulo: "Reclamacoes na janela",
        cabecalho: ["Titulo", "Status", "Respondida"],
        linhas: corpus.reclamacoes.map((r) => [
          r.titulo,
          r.status ?? "n/d",
          r.resposta ? "sim" : "nao",
        ]),
      });
    }
    lista.push({
      titulo: "Anexo C. Reclame Aqui",
      descricao: "Reclamacoes, respostas da marca e indicadores publicos na janela.",
      elementos,
    });
  }

  lista.push({
    titulo: "Anexo D. Registro de evidencias",
    descricao: "Todas as afirmacoes candidatas e o resultado da verificacao factual.",
    elementos: [
      {
        tipo: "tabela",
        titulo: "Evidence ledger",
        cabecalho: ["Afirmacao", "Status", "Suporte"],
        linhas: verificacao.claims.map((c) => [
          c.texto,
          c.status,
          c.suportes.length ? c.suportes.join(", ") : "sem lastro",
        ]),
      },
    ],
  });

  return lista;
}

export async function comporRelatorio(params: {
  plano: PlanoColeta;
  corpus: Corpus;
  inventario: Inventario;
  amostra: AmostraTranscricao;
  analise: SaidaAnalise;
  outline: Outline;
  verificacao: ResultadoVerificacao;
}): Promise<ReportSpec> {
  const { plano, corpus, inventario, amostra, analise, outline, verificacao } =
    params;
  const validas = afirmacoesValidas(verificacao);

  const [secoesI, secoesII] = await Promise.all([
    redigirParte({ parte: "I", outline: outline.parteI, analise, validas, corpus }),
    redigirParte({ parte: "II", outline: outline.parteII, analise, validas, corpus }),
  ]);

  const spec: ReportSpec = {
    projeto: { nome: plano.marca, tipo: plano.tipo, janela: plano.janela },
    geradoEm: new Date().toISOString(),
    subtitulo: { linha1: "Como a percepcao publica", linha2: `enxerga ${plano.marca}.` },
    resumoCheckpoints: [
      {
        numero: 1,
        titulo: "Plano de coleta",
        resumo: `${plano.fontes.length} fontes, custo estimado de ${formatBRL(plano.custo.totalBRL)}.`,
      },
      {
        numero: 2,
        titulo: "Inventario de coleta",
        resumo: `${inventario.totalArtefatos} artefatos brutos, ${inventario.lacunas.length} lacuna(s) declarada(s).`,
      },
      {
        numero: 3,
        titulo: "Transcricoes e OCR",
        resumo: `${amostra.totalTranscricoes} transcricao(oes) e ${amostra.totalOcr} OCR.`,
      },
      {
        numero: 4,
        titulo: "Analises",
        resumo: `${analise.insights.length} insights e ${analise.graficos.length} grafico(s).`,
      },
      {
        numero: 6,
        titulo: "Verificacao factual",
        resumo: `${verificacao.confirmadas} afirmacoes validadas, ${verificacao.descartadas} descartada(s) por falta de lastro.`,
      },
    ],
    parteI: { titulo: "Parte I. Retrato descritivo e exploratorio", secoes: secoesI },
    parteII: { titulo: "Parte II. Sintese estrategica formal", secoes: secoesII },
    evidencias: verificacao.claims.map((c) => ({
      afirmacao: c.texto,
      status: c.status,
      suporte: c.suportes.length ? c.suportes.join(", ") : "sem lastro",
    })),
    anexos: anexos(corpus, inventario, verificacao),
    graficos: analise.graficos,
  };

  return aplicarVozSoulstory(spec);
}
