// Redator do relatorio (PRD secao 3.6 e 8.2). Escreve as Partes I e II em
// profundidade de consultoria, usando SOMENTE afirmacoes verificadas. Roda em
// Opus. Os anexos por fonte sao montados de forma deterministica a partir do
// corpus e do ledger. O resultado passa pelo pente fino de voz (sem travessao).

import { bloco, blocoCacheavel, chamarClaude } from "@/lib/ai/anthropic";
import { doutrina } from "@/lib/ai/doctrine";
import { PROMPT_REDATOR } from "@/lib/ai/prompts";
import { afirmacoesValidas } from "@/lib/ai/verificacao";
import { revisarVozReportSpec } from "@/lib/ai/editor-voz";
import { aplicarVozSoulstory } from "@/lib/text";
import { formatBRL } from "@/lib/utils";
import type {
  AmostraTranscricao,
  ClaimVerificada,
  Corpus,
  DesempenhoResumo,
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
        `Escreva a Parte ${parte} em profundidade de consultoria de elite, uma secao por construto, com varios paragrafos densos, callouts para principios e cards para listas. Use apenas as afirmacoes verificadas. Marque metricas indisponiveis. Referencie os graficos pelo id quando ajudarem.`,
      ),
    ],
    maxTokens: 24000,
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

function anexoDesempenho(desempenho: DesempenhoResumo): ReportSpecAnexo {
  const segundos = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
  const elementos: ElementoSecao[] = [
    {
      tipo: "tabela",
      titulo: "Tempo por estagio",
      cabecalho: ["Estagio", "Tempo"],
      linhas: [
        ...desempenho.estagios.map((e) => [e.estagio, segundos(e.ms)]),
        ["Total", segundos(desempenho.totalMs)],
      ],
    },
  ];
  if (desempenho.custoPorFonte.length > 0) {
    elementos.push({
      tipo: "tabela",
      titulo: "Custo por fonte (medido)",
      cabecalho: ["Fonte", "Custo"],
      linhas: desempenho.custoPorFonte.map((c) => [c.fonte, formatBRL(c.custoBRL)]),
    });
  } else {
    elementos.push({
      tipo: "callout",
      eyebrow: "Custo por fonte",
      paragrafos: [
        "O custo por fonte e medido por CostEvent em runs reais. Nesta validacao sem credenciais nao ha chamada paga.",
      ],
    });
  }
  return {
    titulo: "Desempenho e custo",
    descricao:
      "Tempo de parede por estagio e custo medido por fonte. A medicao serve a visibilidade e ao guardrail de custo do checkpoint 1, nunca como teto de tempo.",
    elementos,
  };
}

const ROTULO_FONTE_ANEXO: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  mencoes: "Mencoes",
};

/**
 * Anexo de comentarios ilustrativos por fonte (Fase 4). Amostra de vozes reais
 * do publico, com o autor ja pseudonimizado por hash (LGPD). Da profundidade e
 * volume ao relatorio sem nenhuma estimativa: e dado bruto coletado.
 */
function anexoComentariosIlustrativos(corpus: Corpus): ReportSpecAnexo | null {
  const fontes = ["instagram", "tiktok", "youtube", "mencoes"] as const;
  const elementos: ElementoSecao[] = [];
  for (const fonte of fontes) {
    const comentarios = corpus.posts
      .filter((p) => p.fonte === fonte)
      .flatMap((p) => p.comentarios.map((c) => ({ peca: p.externalId, c })))
      .filter((x) => x.c.texto.trim().length > 0)
      .slice(0, 15);
    if (comentarios.length === 0) continue;
    elementos.push({
      tipo: "tabela",
      titulo: `Comentarios ilustrativos no ${ROTULO_FONTE_ANEXO[fonte]}`,
      cabecalho: ["Peca", "Autor", "Comentario"],
      linhas: comentarios.map((x) => [x.peca, x.c.autor, x.c.texto.slice(0, 240)]),
    });
  }
  if (elementos.length === 0) return null;
  return {
    titulo: "Comentarios ilustrativos por fonte",
    descricao:
      "Amostra de vozes do publico por fonte, com autores pseudonimizados por hash (LGPD). Dado bruto coletado, nunca estimado.",
    elementos,
  };
}

/** Anexo de sentimento longitudinal (Fase 4), a partir dos achados verificaveis. */
function anexoSentimento(analise: SaidaAnalise): ReportSpecAnexo | null {
  const sentimento = analise.findings.filter((f) => f.construto === "sentimento");
  if (sentimento.length === 0) return null;
  const elementos: ElementoSecao[] = [
    {
      tipo: "callout",
      eyebrow: "Sentimento longitudinal",
      paragrafos: sentimento.map((f) => `${f.titulo}: ${f.conteudo}`),
    },
  ];
  if (analise.graficos.some((g) => g.id === "linha-tempo-sentimento")) {
    elementos.push({ tipo: "grafico", graficoId: "linha-tempo-sentimento" });
  }
  return {
    titulo: "Sentimento longitudinal",
    descricao:
      "Evolucao do sentimento das pecas sobre a marca por mes na janela. Cada ponto e lastreado nas pecas que o sustentam.",
    elementos,
  };
}

/** Anexo do mapa de temas (Fase 4), a partir dos achados de tema. */
function anexoTemas(analise: SaidaAnalise): ReportSpecAnexo | null {
  const temas = analise.findings.filter((f) => f.construto === "temas");
  if (temas.length === 0) return null;
  const elementos: ElementoSecao[] = [
    {
      tipo: "tabela",
      titulo: "Temas que orbitam a marca",
      cabecalho: ["Tema", "Leitura"],
      linhas: temas.map((f) => [f.titulo, f.conteudo.slice(0, 280)]),
    },
  ];
  if (analise.graficos.some((g) => g.id === "mapa-temas")) {
    elementos.push({ tipo: "grafico", graficoId: "mapa-temas" });
  }
  return {
    titulo: "Mapa de temas",
    descricao:
      "Os temas recorrentes na conversa publica sobre a marca, com o numero de pecas que sustenta cada um.",
    elementos,
  };
}

function anexos(
  corpus: Corpus,
  inventario: Inventario,
  verificacao: ResultadoVerificacao,
  analise: SaidaAnalise,
  desempenho?: DesempenhoResumo,
): ReportSpecAnexo[] {
  const lista: ReportSpecAnexo[] = [];

  lista.push({
    titulo: "Inventario de coleta",
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

  // Anexo por fonte: top itens por eixo publico, uma tabela por fonte presente.
  const rotuloFonte: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
  };
  const fontesPresentes = (["instagram", "tiktok", "youtube"] as const).filter(
    (f) => corpus.posts.some((p) => p.fonte === f && !p.ehMencao),
  );
  for (const fonte of fontesPresentes) {
    const ordenados = corpus.posts
      .filter((p) => !p.ehMencao && p.fonte === fonte)
      .sort((a, b) => {
        const ca = a.metricas.find((m) => m.nome === "curtidas")?.valor ?? 0;
        const cb = b.metricas.find((m) => m.nome === "curtidas")?.valor ?? 0;
        return cb - ca;
      })
      .slice(0, 10);
    lista.push({
      titulo: `Top itens no ${rotuloFonte[fonte]} por eixo publico`,
      descricao:
        "Ranking pelos eixos publicos disponiveis. Salvamentos (e compartilhamentos onde nao sao publicos) nao entram, por nao serem publicos.",
      elementos: [
        {
          tipo: "tabela",
          titulo: `Top itens no ${rotuloFonte[fonte]}`,
          cabecalho: ["Item", "Tipo", "Data", "Curtidas", "Comentarios", "Visualizacoes", "Compartilhamentos"],
          linhas: ordenados.map((p) => [
            p.externalId,
            p.tipoMidia,
            p.publicadoEm.slice(0, 10),
            metrica(corpus, p.externalId, "curtidas"),
            metrica(corpus, p.externalId, "comentarios"),
            metrica(corpus, p.externalId, "visualizacoes"),
            metrica(corpus, p.externalId, "compartilhamentos"),
          ]),
        },
      ],
    });
  }

  // Anexo de viralizacao cross-fonte: afirmacoes verificadas sobre os fatores de
  // destaque, com os suportes (externalIds) que as sustentam.
  const viraisVerificadas = verificacao.claims.filter(
    (c) =>
      c.construto === "viralizacao" &&
      (c.status === "confirmada" || c.status === "imprecisa"),
  );
  if (fontesPresentes.length > 1 || viraisVerificadas.length > 0) {
    lista.push({
      titulo: "Viralizacao cross-fonte",
      descricao:
        "Fatores que explicam o desempenho dos itens de maior destaque, comparados entre as fontes. So entram afirmacoes verificadas.",
      elementos: [
        {
          tipo: "tabela",
          titulo: "Fatores de viralizacao verificados",
          cabecalho: ["Afirmacao", "Status", "Suporte"],
          linhas:
            viraisVerificadas.length > 0
              ? viraisVerificadas.map((c) => [
                  c.texto,
                  c.status,
                  c.suportes.join(", "),
                ])
              : [["Sem afirmacoes de viralizacao verificadas na janela.", "n/d", "n/d"]],
        },
      ],
    });
  }

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
      titulo: "Reclame Aqui",
      descricao: "Reclamacoes, respostas da marca e indicadores publicos na janela.",
      elementos,
    });
  }

  // Anexo de SEO e busca (Fase 3): o que aparece ao pesquisar a marca, mais o
  // volume de busca declarado pela API (nunca estimado).
  const serp = corpus.serp ?? [];
  if (serp.length > 0) {
    const elementos: ElementoSecao[] = [
      {
        tipo: "tabela",
        titulo: "Resultados de busca sobre a marca",
        cabecalho: ["Termo", "Tipo", "Posicao", "Titulo", "Dominio", "Origem"],
        linhas: serp
          .filter((s) => s.tipo === "organico" || s.tipo === "featured_snippet" || s.tipo === "paa")
          .map((s) => [
            s.termo,
            s.tipo,
            s.posicao !== null ? String(s.posicao) : "n/d",
            s.titulo,
            s.dominio || "n/d",
            s.ehTerceiro ? "terceiro" : "marca",
          ]),
      },
    ];
    const sugestoes = serp.filter((s) => s.tipo === "autocomplete" || s.tipo === "related");
    if (sugestoes.length > 0) {
      elementos.push({
        tipo: "callout",
        eyebrow: "Sugestoes e buscas relacionadas",
        paragrafos: [sugestoes.map((s) => s.titulo).join("; ")],
      });
    }
    const volumes = corpus.volumesBusca ?? [];
    if (volumes.length > 0) {
      elementos.push({
        tipo: "tabela",
        titulo: "Volume de busca (dado declarado pela API)",
        cabecalho: ["Termo", "Volume mensal"],
        linhas: volumes.map((v) => [
          v.termo,
          v.disponivel ? String(v.volume) : "dado nao disponivel",
        ]),
      });
    }
    lista.push({
      titulo: "SEO e SERP",
      descricao:
        "O que aparece ao pesquisar a marca no Google: SERP organica, featured snippets, as pessoas tambem perguntam, sugestoes e volume de busca declarado.",
      elementos,
    });
  }

  // Anexo de mencoes e share of voice (Fase 3): midia espontanea de terceiros.
  const mencoes = corpus.posts.filter((p) => p.ehMencao);
  if (mencoes.length > 0) {
    const sovVerificadas = verificacao.claims.filter(
      (c) =>
        c.construto === "share_of_voice" &&
        (c.status === "confirmada" || c.status === "imprecisa"),
    );
    const elementos: ElementoSecao[] = [];
    if (sovVerificadas.length > 0) {
      elementos.push({
        tipo: "callout",
        eyebrow: "Share of voice de mencao",
        paragrafos: sovVerificadas.map((c) => c.texto),
      });
    }
    elementos.push({
      tipo: "tabela",
      titulo: "Pecas de terceiros sobre a marca",
      cabecalho: ["Peca", "Tipo", "Data", "Autor", "Trecho"],
      linhas: mencoes.map((p) => [
        p.externalId,
        p.tipoMidia,
        p.publicadoEm.slice(0, 10),
        p.autorMencao ?? "n/d",
        p.legenda.slice(0, 120),
      ]),
    });
    lista.push({
      titulo: "Mencoes e share of voice",
      descricao:
        "Conteudo de terceiros que cita a marca (midia espontanea), com a proporcao de voz de terceiros versus a propria marca na janela. So entram afirmacoes verificadas.",
      elementos,
    });
  }

  // Anexos de profundidade (Fase 4): vozes do publico, sentimento e temas.
  const comentarios = anexoComentariosIlustrativos(corpus);
  if (comentarios) lista.push(comentarios);
  const sentimento = anexoSentimento(analise);
  if (sentimento) lista.push(sentimento);
  const temas = anexoTemas(analise);
  if (temas) lista.push(temas);

  lista.push({
    titulo: "Registro de evidencias",
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

  // Anexo de desempenho e custo (Fase 4), quando o run foi instrumentado.
  if (desempenho) lista.push(anexoDesempenho(desempenho));

  // Numera os anexos sequencialmente (Anexo A, B, C, ...) na ordem montada.
  return lista.map((anexo, i) => ({
    ...anexo,
    titulo: `Anexo ${String.fromCharCode(65 + i)}. ${anexo.titulo}`,
  }));
}

export async function comporRelatorio(params: {
  plano: PlanoColeta;
  corpus: Corpus;
  inventario: Inventario;
  amostra: AmostraTranscricao;
  analise: SaidaAnalise;
  outline: Outline;
  verificacao: ResultadoVerificacao;
  desempenho?: DesempenhoResumo;
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
    anexos: anexos(corpus, inventario, verificacao, analise, params.desempenho),
    graficos: analise.graficos,
    desempenho: params.desempenho,
  };

  // Passe de voz por modelo (editor_voz) com guarda de digitos, e so entao o
  // sanitizador deterministico, por ultimo, para garantir a regra do travessao.
  const revisado = await revisarVozReportSpec(spec);
  return aplicarVozSoulstory(revisado);
}
