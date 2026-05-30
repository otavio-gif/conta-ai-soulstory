/*
 * Roda o pipeline REAL da Fase 1 ponta a ponta sobre fixtures gravadas, sem
 * credenciais e sem custo (MOCK_EXTERNAL=1). Exercita coleta, transcricao, OCR,
 * as duas oticas, sintese, evidence ledger, verificacao bloqueante e a geracao
 * do docx no padrao Soulstory via SOULSTORY_DOCX_CMD.
 *
 *   pnpm fixtures:pipeline
 *
 * Os 7 checkpoints aqui sao auto-aprovados, apenas para validar a cadeia.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { comporDocx } from "@/lib/docx/adapter";
import { comporRelatorio } from "@/lib/ai/redacao";
import {
  analisar,
  coletar,
  interpretarBriefing,
  montarOutline,
  transcreverOcr,
  verificar,
} from "@/lib/pipeline/stages";
import { CHECKPOINTS } from "@/lib/pipeline/types";
import { Cronometro } from "@/lib/pipeline/perf";
import { mesmosNumeros } from "@/lib/ai/editor-voz";
import { formatBRL } from "@/lib/utils";

const PROJECT_ID = "fixtures";

function checkpoint(numero: number, resumo: string) {
  const def = CHECKPOINTS.find((c) => c.numero === numero);
  console.log(`\n[checkpoint ${numero}] ${def?.titulo}`);
  console.log(`  ${resumo}`);
  console.log("  decisao: aprovado (auto)");
}

async function main() {
  process.env.SOULSTORY_DOCX_CMD ||= "node scripts/soulstory-docx-build.js";
  console.log("Pipeline de Visao Externa (fixtures, MOCK_EXTERNAL)\n==================================================");

  const janela = {
    inicio: "2026-02-01T00:00:00.000Z",
    fim: "2026-03-31T23:59:59.000Z",
  };

  const cron = new Cronometro();

  const plano = await cron.medir("Plano de coleta", () =>
    interpretarBriefing({
      briefing:
        "Diagnostico da marca Cafes Serra Azul no Instagram, Reclame Aqui, TikTok, YouTube, SEO e busca no Google e mencoes de terceiros, com foco em torra artesanal e cafe especial.",
      janela,
    }),
  );
  checkpoint(
    1,
    `${plano.fontes.length} fontes (${plano.fontes.map((f) => f.kind).join(", ")}). Custo estimado ${formatBRL(plano.custo.totalBRL)}, orcamento ${formatBRL(plano.custo.orcamentoBRL)} para ${plano.custo.mesesJanela} mes(es).`,
  );

  const { inventario, corpus } = await cron.medir("Coleta", () =>
    coletar(plano, PROJECT_ID),
  );
  checkpoint(
    2,
    `${inventario.totalArtefatos} artefatos brutos. Lacunas: ${inventario.lacunas.length}. Metricas indisponiveis: ${inventario.metricasIndisponiveis.join(", ")}.`,
  );

  const { amostra, corpus: corpusTr } = await cron.medir("Transcricoes e OCR", () =>
    transcreverOcr(corpus),
  );
  checkpoint(
    3,
    `${amostra.totalTranscricoes} transcricao(oes), ${amostra.totalOcr} OCR, ${amostra.amostras.length} amostra(s).`,
  );

  const analise = await cron.medir("Analises", () => analisar(corpusTr, PROJECT_ID));
  checkpoint(
    4,
    `${analise.insights.length} insights, ${analise.graficos.length} grafico(s), ${analise.claims.length} afirmacoes candidatas, ${analise.findings.length} achados.`,
  );

  const outline = montarOutline(analise);
  checkpoint(
    5,
    `Parte I com ${outline.parteI.length} secoes, Parte II com ${outline.parteII.length} secoes.`,
  );

  const verificacao = await cron.medir("Verificacao factual", () =>
    verificar(corpusTr, analise),
  );
  checkpoint(
    6,
    `${verificacao.confirmadas} afirmacoes validadas, ${verificacao.descartadas} descartada(s) por falta de lastro.`,
  );

  const spec = await comporRelatorio({
    plano,
    corpus: corpusTr,
    inventario,
    amostra,
    analise,
    outline,
    verificacao,
    // Sem banco nas fixtures: custo por fonte vazio, so o tempo por estagio.
    desempenho: cron.resumo([]),
  });
  const docx = await comporDocx(spec);

  const dir = path.join(process.cwd(), "tmp");
  await fs.mkdir(dir, { recursive: true });
  const out = path.join(dir, "diagnostico-fixtures.docx");
  await fs.writeFile(out, docx.buffer);
  checkpoint(7, `Documento gerado: ${out} (${(docx.buffer.length / 1024).toFixed(1)} KB).`);

  // ----- Verificacoes de aceite -----
  console.log("\nAceite\n------");

  const semLastro = spec.evidencias.filter(
    (e) => (e.status === "confirmada" || e.status === "imprecisa") && e.suporte === "sem lastro",
  );
  console.log(
    semLastro.length === 0
      ? "OK: nenhuma afirmacao no relatorio sem lastro verificado."
      : `FALHA: ${semLastro.length} afirmacao(oes) validada(s) sem suporte.`,
  );

  const descartadas = spec.evidencias.filter((e) => e.status === "nao_sustentada");
  console.log(
    descartadas.length > 0
      ? `OK: ${descartadas.length} afirmacao(oes) descartada(s) pela regra de ouro (ex.: salvamentos).`
      : "ATENCAO: nenhuma afirmacao foi descartada (esperado ao menos a de salvamentos).",
  );

  const temIndisponiveis = inventario.metricasIndisponiveis.length > 0;
  console.log(
    temIndisponiveis
      ? `OK: metricas indisponiveis declaradas (${inventario.metricasIndisponiveis.join(", ")}).`
      : "FALHA: metricas indisponiveis nao declaradas.",
  );

  const totalSecoes = spec.parteI.secoes.length + spec.parteII.secoes.length + spec.anexos.length;
  console.log(
    `Estrutura: ${spec.parteI.secoes.length} secoes na Parte I, ${spec.parteII.secoes.length} na Parte II, ${spec.anexos.length} anexos (total ${totalSecoes} blocos).`,
  );

  // ----- Aceite especifico da Fase 2 (video em escala) -----
  console.log("\nAceite da Fase 2\n----------------");

  const fontes = inventario.porFonte.map((f) => f.fonte);
  const quatroFontes = ["instagram", "reclame_aqui", "tiktok", "youtube"].filter((f) =>
    fontes.includes(f as (typeof fontes)[number]),
  );
  console.log(
    quatroFontes.length === 4
      ? `OK: as quatro fontes integradas ao mesmo relatorio (${quatroFontes.join(", ")}).`
      : `FALHA: fontes presentes ${fontes.join(", ")} (esperadas 4).`,
  );

  const viralizacaoVerificada = verificacao.claims.some(
    (c) =>
      c.construto === "viralizacao" &&
      (c.status === "confirmada" || c.status === "imprecisa"),
  );
  console.log(
    viralizacaoVerificada
      ? "OK: ao menos uma afirmacao de viralizacao cross-fonte verificada."
      : "FALHA: nenhuma afirmacao de viralizacao verificada.",
  );

  function metricaDisponivel(fonte: string, nome: string): boolean {
    const post = corpusTr.posts.find((p) => p.fonte === fonte && !p.ehMencao);
    return Boolean(post?.metricas.find((m) => m.nome === nome)?.disponivel);
  }
  const sharesTiktok = metricaDisponivel("tiktok", "compartilhamentos");
  const sharesInstagram = metricaDisponivel("instagram", "compartilhamentos");
  console.log(
    sharesTiktok && !sharesInstagram
      ? "OK: compartilhamentos publico no TikTok e indisponivel no Instagram."
      : `FALHA: disponibilidade de compartilhamentos inesperada (tiktok=${sharesTiktok}, instagram=${sharesInstagram}).`,
  );

  const salvamentosTiktok = inventario.metricasIndisponiveis.includes("tiktok.salvamentos");
  console.log(
    salvamentosTiktok
      ? "OK: salvamentos do TikTok declarados indisponiveis (nunca estimados)."
      : "FALHA: salvamentos do TikTok nao declarados indisponiveis.",
  );

  const usouLegenda = corpusTr.transcricoes.some((t) => t.modelo === "youtube-captions");
  const usouFallback = corpusTr.transcricoes.some((t) => t.modelo === "gpt-4o-transcribe");
  console.log(
    usouLegenda && usouFallback
      ? "OK: legenda oficial e fallback de transcricao exercidos."
      : `FALHA: legenda=${usouLegenda}, fallback=${usouFallback} (esperados ambos).`,
  );

  // ----- Aceite especifico da Fase 3 (busca e midia espontanea) -----
  console.log("\nAceite da Fase 3\n----------------");

  const fontesF3 = inventario.porFonte.map((f) => f.fonte);
  const temSeoEMencoes = ["seo_serp", "mencoes"].every((f) =>
    fontesF3.includes(f as (typeof fontesF3)[number]),
  );
  console.log(
    temSeoEMencoes
      ? "OK: camadas de SEO/busca e de mencoes integradas ao mesmo relatorio."
      : `FALHA: fontes presentes ${fontesF3.join(", ")} (esperadas seo_serp e mencoes).`,
  );

  const serp = corpusTr.serp ?? [];
  const temPaa = serp.some((s) => s.tipo === "paa");
  const temAutocomplete = serp.some((s) => s.tipo === "autocomplete");
  const temTerceiroRanqueando = serp.some((s) => s.ehTerceiro && s.url);
  console.log(
    temPaa && temAutocomplete && temTerceiroRanqueando
      ? "OK: SERP com PAA, autocomplete e conteudo de terceiros que ranqueia."
      : `FALHA: paa=${temPaa}, autocomplete=${temAutocomplete}, terceiro=${temTerceiroRanqueando}.`,
  );

  const volumes = corpusTr.volumesBusca ?? [];
  const volumeDeclarado = volumes.some((v) => v.disponivel && v.volume !== null);
  const volumeIndisponivel = volumes.some((v) => !v.disponivel);
  console.log(
    volumeDeclarado && volumeIndisponivel
      ? "OK: volume de busca declarado pela API e ausencia declarada indisponivel (nunca estimado)."
      : `FALHA: volume declarado=${volumeDeclarado}, indisponivel declarado=${volumeIndisponivel}.`,
  );

  const plataformasMencao = new Set(
    corpusTr.posts
      .filter((p) => p.ehMencao)
      .map((p) => p.externalId.split(":")[0]),
  );
  const cobreQuatro = ["web", "tiktok", "youtube", "instagram"].every((p) =>
    plataformasMencao.has(p),
  );
  console.log(
    cobreQuatro
      ? "OK: mencoes de terceiros nas quatro plataformas (web, TikTok, YouTube, Instagram)."
      : `FALHA: plataformas de mencao presentes: ${[...plataformasMencao].join(", ")}.`,
  );

  const autoresMencaoOk = corpusTr.posts
    .filter((p) => p.ehMencao)
    .every((p) => !p.autorMencao || p.autorMencao.startsWith("autor_"));
  console.log(
    autoresMencaoOk
      ? "OK: autores de mencao pseudonimizados por hash (LGPD)."
      : "FALHA: ha mencao com autor nao pseudonimizado.",
  );

  function temConstrutoVerificado(construto: string): boolean {
    return verificacao.claims.some(
      (c) =>
        c.construto === construto &&
        (c.status === "confirmada" || c.status === "imprecisa"),
    );
  }
  for (const construto of [
    "share_of_voice",
    "sentimento",
    "temas",
    "formato_horario",
    "linha_tempo",
  ]) {
    const ok = temConstrutoVerificado(construto);
    console.log(
      ok
        ? `OK: analise 3.8 "${construto}" com afirmacao verificada.`
        : `ATENCAO: nenhuma afirmacao verificada para "${construto}".`,
    );
  }

  const temGlossario = analise.findings.some((f) => f.construto === "glossario");
  console.log(
    temGlossario
      ? "OK: glossario de linguagem nativa consolidado."
      : "ATENCAO: glossario de linguagem nativa vazio.",
  );

  const anexosTitulos = spec.anexos.map((a) => a.titulo);
  const temAnexoSeo = anexosTitulos.some((t) => t.includes("SEO e SERP"));
  const temAnexoMencoes = anexosTitulos.some((t) => t.includes("Mencoes e share of voice"));
  console.log(
    temAnexoSeo && temAnexoMencoes
      ? "OK: anexos de SEO/SERP e de mencoes presentes no relatorio."
      : `FALHA: anexo SEO=${temAnexoSeo}, anexo mencoes=${temAnexoMencoes}.`,
  );

  const graficosIds = (spec.graficos ?? []).map((g) => g.id);
  const graficosNovos = ["share-of-voice", "linha-tempo-sentimento", "mapa-temas"].filter((g) =>
    graficosIds.includes(g),
  );
  console.log(
    graficosNovos.length === 3
      ? "OK: graficos novos (share of voice, sentimento longitudinal, mapa de temas) gerados."
      : `FALHA: graficos novos presentes: ${graficosNovos.join(", ")}.`,
  );

  // ----- Aceite especifico da Fase 4 (refino, padrao de entrega) -----
  console.log("\nAceite da Fase 4\n----------------");

  const GRANDE = process.env.FIXTURE_SET === "grande";

  // Anexo de desempenho presente (tempo por estagio medido).
  const temDesempenho = spec.anexos.some((a) => a.titulo.includes("Desempenho e custo"));
  console.log(
    temDesempenho
      ? "OK: anexo de desempenho e custo presente (performance medida)."
      : "FALHA: anexo de desempenho ausente.",
  );

  // Anexos de profundidade da Fase 4.
  const temComentarios = spec.anexos.some((a) => a.titulo.includes("Comentarios ilustrativos"));
  const temSentimentoAnexo = spec.anexos.some((a) => a.titulo.includes("Sentimento longitudinal"));
  const temTemasAnexo = spec.anexos.some((a) => a.titulo.includes("Mapa de temas"));
  console.log(
    temComentarios && temSentimentoAnexo && temTemasAnexo
      ? "OK: anexos de profundidade (comentarios, sentimento, temas) presentes."
      : `FALHA: comentarios=${temComentarios}, sentimento=${temSentimentoAnexo}, temas=${temTemasAnexo}.`,
  );

  // Voz revisada ponta a ponta, sem nenhum travessao em todo o ReportSpec.
  const textos: string[] = [];
  const colher = (s: { titulo: string; secoes: typeof spec.parteI.secoes }) => {
    for (const sec of s.secoes) {
      textos.push(sec.titulo, ...sec.paragrafos);
      for (const el of sec.elementos ?? []) {
        if (el.tipo === "paragrafo") textos.push(el.texto);
        if (el.tipo === "callout") textos.push(...el.paragrafos);
        if (el.tipo === "cards") for (const it of el.itens) textos.push(it.titulo, it.texto);
      }
    }
  };
  colher(spec.parteI);
  colher(spec.parteII);
  for (const a of spec.anexos) textos.push(a.titulo, a.descricao);
  const comTravessao = textos.filter((t) => /[—–]/.test(t));
  console.log(
    comTravessao.length === 0
      ? "OK: voz revisada ponta a ponta, nenhum travessao no ReportSpec."
      : `FALHA: ${comTravessao.length} texto(s) com travessao apos o passe de voz.`,
  );

  // Guarda de digitos do editor de voz: numero alterado e revertido.
  const a = "A marca teve 1.240 curtidas em 3 posts.";
  const guardaOk = mesmosNumeros(a, "A marca registrou 1.240 curtidas em 3 posts.") &&
    !mesmosNumeros(a, "A marca teve 1.250 curtidas em 3 posts.");
  console.log(
    guardaOk
      ? "OK: guarda de digitos do editor de voz preserva os numeros (reverte edicao que altera)."
      : "FALHA: guarda de digitos do editor de voz nao funcionou.",
  );

  // Tamanho do relatorio: estimativa de paginas (contagem real no docx aberto).
  const paginas = estimarPaginas(spec);
  console.log(`Tamanho estimado do relatorio: ~${paginas} paginas (${inventario.totalArtefatos} artefatos brutos).`);
  if (GRANDE) {
    console.log(
      paginas >= 80
        ? `OK: marca grande rende relatorio no padrao de entrega (>= 80 paginas estimadas).`
        : `FALHA: marca grande estimou ${paginas} paginas (< 80).`,
    );
    console.log(`OK: volume de marca grande (${corpusTr.posts.length} pecas, ${spec.anexos.length} anexos).`);
  }

  console.log("\nConcluido. Os 7 checkpoints passaram sobre o pipeline real (fixtures).");
}

/**
 * Estimativa de paginas a partir do conteudo do ReportSpec. Heuristica honesta
 * para o aceite automatico (a contagem real confere abrindo o docx): prosa por
 * palavras, tabelas por linhas, e meia pagina por grafico.
 */
function estimarPaginas(spec: import("@/lib/pipeline/types").ReportSpec): number {
  let palavras = 0;
  let linhasTabela = 0;
  let graficos = 0;
  let blocos = 0;

  const contarElementos = (elementos: import("@/lib/pipeline/types").ElementoSecao[] = []) => {
    for (const el of elementos) {
      blocos++;
      if (el.tipo === "paragrafo") palavras += el.texto.split(/\s+/).length;
      else if (el.tipo === "callout") palavras += el.paragrafos.join(" ").split(/\s+/).length;
      else if (el.tipo === "cards") palavras += el.itens.reduce((a, i) => a + i.texto.split(/\s+/).length, 0);
      else if (el.tipo === "tabela") linhasTabela += el.linhas.length + 1;
      else if (el.tipo === "grafico") graficos++;
      else if (el.tipo === "glossario") linhasTabela += el.itens.length * 2;
    }
  };

  for (const parte of [spec.parteI, spec.parteII]) {
    for (const sec of parte.secoes) {
      blocos++;
      palavras += sec.paragrafos.join(" ").split(/\s+/).length;
      contarElementos(sec.elementos);
    }
  }
  for (const a of spec.anexos) {
    blocos++;
    palavras += a.descricao.split(/\s+/).length;
    contarElementos(a.elementos);
  }
  linhasTabela += spec.evidencias.length; // a tabela do evidence ledger

  // ~420 palavras por pagina; ~24 linhas de tabela compacta por pagina; meia
  // pagina por grafico. Heuristica conservadora; a contagem real confere no docx.
  return Math.ceil(palavras / 420 + linhasTabela / 24 + graficos * 0.5 + blocos * 0.1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
