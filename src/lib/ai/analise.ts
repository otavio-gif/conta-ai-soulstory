// As duas oticas de analise como sub-agentes (PRD secao 3.3 e 8.2). O analista
// de conteudo le cada post junto com os seus comentarios (passada por post); o
// cientista de dados le o conjunto de metricas (passada agregada). Os graficos
// sao construidos de forma deterministica a partir das metricas reais, nunca
// calculados pelo modelo, para preservar a fidelidade factual.

import { bloco, blocoCacheavel, chamarClaude, type ChamadaClaude } from "@/lib/ai/anthropic";
import { chamarClaudeEmLote } from "@/lib/ai/batch";
import { doutrina } from "@/lib/ai/doctrine";
import { mapearComConcorrencia } from "@/lib/collectors/util";
import { renderizarGraficos } from "@/lib/charts";
import { calcularShareOfVoice } from "@/lib/analytics/share-of-voice";
import { calcularPicoTimeline } from "@/lib/analytics/pico-timeline";
import { analisarSentimento } from "@/lib/analytics/sentimento";
import { consolidarGlossario, mapearTemas } from "@/lib/analytics/temas";
import {
  PROMPT_ANALISTA_CONTEUDO,
  PROMPT_CIENTISTA_DADOS,
} from "@/lib/ai/prompts";
import type {
  ClaimCandidato,
  Corpus,
  FindingItem,
  GraficoRef,
  InsightAnalise,
  PostColetado,
  SaidaAnalise,
} from "@/lib/pipeline/types";

const TIPO_SUPORTE = ["citacao_direta", "contagem", "agregacao", "padrao_observado"];

function metricaValor(post: PostColetado, nome: string): number | null {
  const m = post.metricas.find((x) => x.nome === nome && x.disponivel);
  return m ? m.valor : null;
}

/** Graficos deterministicos a partir das metricas publicas reais. */
function construirGraficos(corpus: Corpus): GraficoRef[] {
  const posts = corpus.posts.filter((p) => !p.ehMencao);
  const porData = [...posts].sort(
    (a, b) => new Date(a.publicadoEm).getTime() - new Date(b.publicadoEm).getTime(),
  );

  const curtidas = posts
    .map((p) => ({ rotulo: p.externalId, valor: metricaValor(p, "curtidas") ?? 0 }))
    .filter((d) => d.valor > 0);
  const comentarios = posts
    .map((p) => ({
      rotulo: p.externalId,
      valor: metricaValor(p, "comentarios") ?? p.comentarios.length,
    }))
    .filter((d) => d.valor > 0);
  const linha = porData
    .map((p) => ({
      rotulo: p.publicadoEm.slice(5, 10),
      valor: metricaValor(p, "curtidas") ?? 0,
    }))
    .filter((d) => d.valor > 0);

  const graficos: GraficoRef[] = [];
  if (curtidas.length > 0) {
    graficos.push({
      id: "engajamento-curtidas",
      titulo: "Curtidas por post na janela",
      descricao: "Curtidas publicas por post da marca na janela analisada.",
      tipo: "barras",
      dados: curtidas,
    });
  }
  if (comentarios.length > 0) {
    graficos.push({
      id: "engajamento-comentarios",
      titulo: "Comentarios por post na janela",
      descricao: "Comentarios publicos por post da marca na janela analisada.",
      tipo: "barras",
      dados: comentarios,
    });
  }
  if (linha.length > 1) {
    graficos.push({
      id: "linha-tempo-curtidas",
      titulo: "Linha do tempo de curtidas",
      descricao: "Evolucao das curtidas ao longo da janela.",
      tipo: "linha",
      dados: linha,
    });
  }

  // Viralizacao cross-fonte: top itens por visualizacoes publicas, rotulados
  // com a fonte. So entra quando ha video (TikTok ou YouTube ou Reel).
  const viral = posts
    .map((p) => ({
      rotulo: `${p.fonte.slice(0, 2)}:${p.externalId}`,
      valor: metricaValor(p, "visualizacoes") ?? 0,
    }))
    .filter((d) => d.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);
  const fontesComViral = new Set(posts.map((p) => p.fonte));
  if (viral.length > 1 && fontesComViral.size > 1) {
    graficos.push({
      id: "viralizacao-cross-fonte",
      titulo: "Viralizacao cross-fonte por visualizacoes",
      descricao:
        "Itens de maior alcance publico por visualizacoes, comparados entre as fontes.",
      tipo: "barras",
      dados: viral,
    });
  }
  return graficos;
}

// ----- Saidas estruturadas dos modelos -----

const SCHEMA_CLAIM = {
  type: "object",
  properties: {
    texto: { type: "string" },
    tipoSuporte: { type: "string", enum: TIPO_SUPORTE },
    suportes: { type: "array", items: { type: "string" } },
    construto: { type: "string" },
  },
  required: ["texto", "tipoSuporte", "suportes"],
};

const SCHEMA_INSIGHT = {
  type: "object",
  properties: {
    titulo: { type: "string" },
    conteudo: { type: "string" },
    suportes: { type: "array", items: { type: "string" } },
  },
  required: ["titulo", "conteudo", "suportes"],
};

interface SaidaAnalistaPost {
  insights: Array<{ titulo: string; conteudo: string; suportes: string[] }>;
  claims: Array<{
    texto: string;
    tipoSuporte: ClaimCandidato["tipoSuporte"];
    suportes: string[];
    construto?: string;
  }>;
  termosNativos: Array<{ termo: string; definicao: string }>;
}

function corpoDoPost(post: PostColetado, corpus: Corpus): string {
  const transcricao = corpus.transcricoes.find(
    (t) => t.postExternalId === post.externalId,
  );
  const ocr = corpus.ocr.find((o) => o.postExternalId === post.externalId);
  return JSON.stringify(
    {
      externalId: post.externalId,
      fonte: post.fonte,
      tipoMidia: post.tipoMidia,
      publicadoEm: post.publicadoEm,
      legenda: post.legenda,
      metricasPublicas: post.metricas.filter((m) => m.disponivel),
      metricasIndisponiveis: post.metricas
        .filter((m) => !m.disponivel)
        .map((m) => m.nome),
      transcricao: transcricao?.texto ?? null,
      ocr: ocr?.texto ?? null,
      comentarios: post.comentarios.map((c) => ({
        id: c.id,
        autor: c.autor,
        texto: c.texto,
      })),
    },
    null,
    2,
  );
}

// Performance (Fase 4): a analise por post sao centenas de chamadas
// independentes em marca grande. Abaixo do limiar roda com concorrencia (cache de
// prompt quente entre as chamadas); acima, vai para o lote (Message Batches),
// assincrono e 50% mais barato. O prefixo cacheado (system + bloco da marca) e
// identico entre os posts para maximizar cache_read.
const CONCORRENCIA_ANALISE = 6;
const LIMIAR_LOTE = 80;

function requisicaoAnalistaPost(
  post: PostColetado,
  corpus: Corpus,
  system: ReturnType<typeof bloco>[],
): ChamadaClaude<SaidaAnalistaPost> {
  return {
    papel: "analista_conteudo",
    fixtureKey: `analista-${post.externalId}`,
    system,
    conteudo: [
      blocoCacheavel(`Marca analisada: ${corpus.marca}. Bio: ${corpus.bio ?? ""}`),
      bloco(`Analise o post a seguir junto com os seus comentarios.\n\n${corpoDoPost(post, corpus)}`),
    ],
    ferramenta: {
      nome: "registrar_analise_post",
      descricao:
        "Registra insights, afirmacoes com suportes e termos de linguagem nativa do post.",
      schema: {
        type: "object",
        properties: {
          insights: { type: "array", items: SCHEMA_INSIGHT },
          claims: { type: "array", items: SCHEMA_CLAIM },
          termosNativos: {
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
        },
        required: ["insights", "claims", "termosNativos"],
      },
      parse: (e) => e as SaidaAnalistaPost,
    },
  };
}

async function analisarPorPost(corpus: Corpus): Promise<{
  insights: InsightAnalise[];
  claims: ClaimCandidato[];
  findings: FindingItem[];
}> {
  const system = [
    bloco(PROMPT_ANALISTA_CONTEUDO),
    await doutrina("visao-externa-metodo", "evidence-ledger"),
  ];
  const insights: InsightAnalise[] = [];
  const claims: ClaimCandidato[] = [];
  const findings: FindingItem[] = [];

  const posts = corpus.posts.filter((p) => !p.ehMencao);
  const requisicoes = posts.map((p) => requisicaoAnalistaPost(p, corpus, system));
  const respostas =
    posts.length >= LIMIAR_LOTE
      ? await chamarClaudeEmLote(requisicoes)
      : await mapearComConcorrencia(requisicoes, CONCORRENCIA_ANALISE, (req) =>
          chamarClaude(req),
        );

  for (const resp of respostas) {
    const d = resp.dados;
    if (!d) continue;
    for (const i of d.insights ?? []) {
      insights.push({ otica: "analista_conteudo", ...i, suportes: i.suportes ?? [] });
    }
    for (const c of d.claims ?? []) {
      claims.push({
        otica: "analista_conteudo",
        parte: "I",
        texto: c.texto,
        tipoSuporte: c.tipoSuporte,
        suportes: c.suportes ?? [],
        construto: c.construto,
      });
    }
    for (const t of d.termosNativos ?? []) {
      findings.push({
        otica: "analista_conteudo",
        construto: "linguagem_nativa",
        parte: "I",
        titulo: t.termo,
        conteudo: t.definicao,
      });
    }
  }
  return { insights, claims, findings };
}

function resumoMetricas(corpus: Corpus): string {
  const linhas = corpus.posts
    .filter((p) => !p.ehMencao)
    .map((p) => {
      const curtidas = metricaValor(p, "curtidas");
      const vis = metricaValor(p, "visualizacoes");
      const comp = metricaValor(p, "compartilhamentos");
      return `${p.externalId} | ${p.fonte} | ${p.tipoMidia} | ${p.publicadoEm.slice(0, 10)} | curtidas=${curtidas ?? "n/d"} | comentarios=${p.comentarios.length} | visualizacoes=${vis ?? "n/d"} | compartilhamentos=${comp ?? "n/d"}`;
    })
    .join("\n");
  return `Itens da marca por fonte (externalId | fonte | tipo | data | metricas):\n${linhas}\n\nMetricas nao publicas (sempre indisponiveis): ${corpus.metricasIndisponiveis.join(", ")}.`;
}

interface SaidaCientista {
  insights: Array<{ titulo: string; conteudo: string; suportes: string[] }>;
  claims: Array<{
    texto: string;
    tipoSuporte: ClaimCandidato["tipoSuporte"];
    suportes: string[];
    construto?: string;
    parte?: "I" | "II";
  }>;
}

async function analisarCientista(
  corpus: Corpus,
  graficos: GraficoRef[],
): Promise<{ insights: InsightAnalise[]; claims: ClaimCandidato[] }> {
  const resp = await chamarClaude<SaidaCientista>({
    papel: "cientista_dados",
    fixtureKey: "cientista",
    system: [
      bloco(PROMPT_CIENTISTA_DADOS),
      await doutrina("visao-externa-metodo", "evidence-ledger"),
    ],
    conteudo: [
      blocoCacheavel(resumoMetricas(corpus)),
      bloco(
        `Graficos ja gerados (referencie pelo id quando util): ${graficos
          .map((g) => `${g.id} (${g.titulo})`)
          .join("; ")}.\n\nProduza insights quantitativos, rankings dos top posts por eixo publico e leitura de viralizacao, com afirmacoes lastreadas nos externalIds.`,
      ),
    ],
    ferramenta: {
      nome: "registrar_analise_quantitativa",
      descricao: "Registra insights e afirmacoes quantitativas com suportes.",
      schema: {
        type: "object",
        properties: {
          insights: { type: "array", items: SCHEMA_INSIGHT },
          claims: {
            type: "array",
            items: {
              type: "object",
              properties: {
                texto: { type: "string" },
                tipoSuporte: { type: "string", enum: TIPO_SUPORTE },
                suportes: { type: "array", items: { type: "string" } },
                construto: { type: "string" },
                parte: { type: "string", enum: ["I", "II"] },
              },
              required: ["texto", "tipoSuporte", "suportes"],
            },
          },
        },
        required: ["insights", "claims"],
      },
      parse: (e) => e as SaidaCientista,
    },
  });

  const insights: InsightAnalise[] = (resp.dados?.insights ?? []).map((i) => ({
    otica: "cientista_dados",
    titulo: i.titulo,
    conteudo: i.conteudo,
    suportes: i.suportes ?? [],
  }));
  const claims: ClaimCandidato[] = (resp.dados?.claims ?? []).map((c) => ({
    otica: "cientista_dados",
    parte: c.parte ?? "I",
    texto: c.texto,
    tipoSuporte: c.tipoSuporte,
    suportes: c.suportes ?? [],
    construto: c.construto,
  }));
  return { insights, claims };
}

/** Resumo das transcricoes e legendas por item, para a leitura de viralizacao. */
function resumoTranscricoes(corpus: Corpus): string {
  const linhas = corpus.posts
    .filter((p) => !p.ehMencao)
    .map((p) => {
      const t = corpus.transcricoes.find((x) => x.postExternalId === p.externalId);
      const o = corpus.ocr.find((x) => x.postExternalId === p.externalId);
      const conteudo = t?.texto ?? o?.texto ?? "";
      if (!conteudo) return null;
      return `${p.externalId} (${p.fonte}): ${conteudo.slice(0, 400)}`;
    })
    .filter((l): l is string => l !== null)
    .join("\n");
  return linhas || "Sem transcricoes ou legendas disponiveis.";
}

/**
 * Analise de viralizacao cross-fonte (PRD secao 3.2): le a tabela multi-fonte e
 * o conteudo transcrito e identifica os fatores que explicam o desempenho dos
 * itens de maior destaque, comparando entre Instagram, TikTok e YouTube. Cada
 * afirmacao nasce como Claim parte I, construto viralizacao, lastreada nos
 * externalIds. Nao ranqueia por metrica nao publica.
 */
async function analisarViralizacao(
  corpus: Corpus,
  graficos: GraficoRef[],
): Promise<{ insights: InsightAnalise[]; claims: ClaimCandidato[]; findings: FindingItem[] }> {
  const fontes = [...new Set(corpus.posts.filter((p) => !p.ehMencao).map((p) => p.fonte))];
  if (corpus.posts.filter((p) => !p.ehMencao).length === 0) {
    return { insights: [], claims: [], findings: [] };
  }

  const resp = await chamarClaude<SaidaCientista>({
    papel: "cientista_dados",
    fixtureKey: "viralizacao",
    system: [
      bloco(PROMPT_CIENTISTA_DADOS),
      await doutrina("visao-externa-metodo", "evidence-ledger"),
    ],
    conteudo: [
      blocoCacheavel(`${resumoMetricas(corpus)}\n\nConteudo transcrito por item:\n${resumoTranscricoes(corpus)}`),
      bloco(
        `Fontes presentes: ${fontes.join(", ")}. Graficos disponiveis: ${graficos
          .map((g) => g.id)
          .join(", ")}.\n\nAnalise a viralizacao cross-fonte: por que os itens de maior alcance publico se destacaram, comparando o comportamento entre as fontes. Use apenas metricas publicas. Cada afirmacao lastreada nos externalIds, parte I.`,
      ),
    ],
    ferramenta: {
      nome: "registrar_viralizacao",
      descricao: "Registra insights e afirmacoes sobre a viralizacao cross-fonte.",
      schema: {
        type: "object",
        properties: {
          insights: { type: "array", items: SCHEMA_INSIGHT },
          claims: {
            type: "array",
            items: {
              type: "object",
              properties: {
                texto: { type: "string" },
                tipoSuporte: { type: "string", enum: TIPO_SUPORTE },
                suportes: { type: "array", items: { type: "string" } },
              },
              required: ["texto", "tipoSuporte", "suportes"],
            },
          },
        },
        required: ["insights", "claims"],
      },
      parse: (e) => e as SaidaCientista,
    },
  });

  const insights: InsightAnalise[] = (resp.dados?.insights ?? []).map((i) => ({
    otica: "cientista_dados",
    titulo: i.titulo,
    conteudo: i.conteudo,
    suportes: i.suportes ?? [],
  }));
  const claims: ClaimCandidato[] = (resp.dados?.claims ?? []).map((c) => ({
    otica: "cientista_dados",
    parte: "I",
    texto: c.texto,
    tipoSuporte: c.tipoSuporte,
    suportes: c.suportes ?? [],
    construto: "viralizacao",
  }));
  const findings: FindingItem[] = insights.map((i) => ({
    otica: "cientista_dados",
    construto: "viralizacao",
    parte: "I",
    titulo: i.titulo,
    conteudo: i.conteudo,
  }));
  return { insights, claims, findings };
}

/** Roda as duas oticas e devolve a saida consolidada com os graficos renderizados. */
export async function analisar(
  corpus: Corpus,
  projectId: string,
): Promise<SaidaAnalise> {
  // Especificacoes dos graficos das oticas, referenciadas por id nos prompts.
  const graficosOticas = construirGraficos(corpus);
  const porPost = await analisarPorPost(corpus);
  const cientista = await analisarCientista(corpus, graficosOticas);
  const viralizacao = await analisarViralizacao(corpus, graficosOticas);

  // Analises adicionais (PRD secao 3.8, Fase 3). Deterministicas (share of voice,
  // formato e horario de pico, linha do tempo) e por modelo (sentimento, temas).
  // O glossario consolida de forma deterministica a linguagem nativa por post.
  const sov = calcularShareOfVoice(corpus);
  const pico = calcularPicoTimeline(corpus);
  const sentimento = await analisarSentimento(corpus);
  const temas = await mapearTemas(corpus);
  const glossario = consolidarGlossario(porPost.findings);

  // Renderiza os graficos das oticas e das analises adicionais numa unica passada.
  const graficos = await renderizarGraficos(
    [
      ...graficosOticas,
      ...sov.graficos,
      ...pico.graficos,
      ...sentimento.graficos,
      ...temas.graficos,
    ],
    projectId,
  );

  return {
    insights: [...cientista.insights, ...porPost.insights, ...viralizacao.insights],
    graficos,
    claims: [
      ...porPost.claims,
      ...cientista.claims,
      ...viralizacao.claims,
      ...sov.claims,
      ...pico.claims,
      ...sentimento.claims,
      ...temas.claims,
    ],
    findings: [
      ...porPost.findings,
      ...viralizacao.findings,
      ...sov.findings,
      ...pico.findings,
      ...sentimento.findings,
      ...temas.findings,
      ...glossario,
    ],
  };
}
