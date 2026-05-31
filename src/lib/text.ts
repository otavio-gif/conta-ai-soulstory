// Aplicacao deterministica da regra de voz Soulstory: nenhum travessao em
// nenhum texto do relatorio (CLAUDE.md). Roda como pente fino final do editor
// de voz sobre todo o ReportSpec, alem da instrucao ja dada aos modelos.

import type { ElementoSecao, ReportSpec } from "@/lib/pipeline/types";

/** Troca travessao (em-dash e en-dash) por virgula. Hifen comum e preservado. */
export function semTravessao(s: string): string {
  return s.replace(/\s*[—–]\s*/g, ", ");
}

export function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function limparElemento(e: ElementoSecao): ElementoSecao {
  switch (e.tipo) {
    case "paragrafo":
      return { ...e, texto: semTravessao(e.texto) };
    case "callout":
      return {
        ...e,
        eyebrow: e.eyebrow ? semTravessao(e.eyebrow) : e.eyebrow,
        paragrafos: e.paragrafos.map(semTravessao),
        atribuicao: e.atribuicao ? semTravessao(e.atribuicao) : e.atribuicao,
      };
    case "cards":
      return {
        ...e,
        titulo: e.titulo ? semTravessao(e.titulo) : e.titulo,
        itens: e.itens.map((i) => ({
          numero: i.numero,
          titulo: semTravessao(i.titulo),
          texto: semTravessao(i.texto),
        })),
      };
    case "tabela":
      return {
        ...e,
        titulo: e.titulo ? semTravessao(e.titulo) : e.titulo,
        cabecalho: e.cabecalho.map(semTravessao),
        linhas: e.linhas.map((l) => l.map(semTravessao)),
      };
    case "glossario":
      return {
        ...e,
        itens: e.itens.map((i) => ({
          termo: semTravessao(i.termo),
          definicao: semTravessao(i.definicao),
        })),
      };
    case "grafico":
      return { ...e, legenda: e.legenda ? semTravessao(e.legenda) : e.legenda };
  }
}

/** Passa o pente fino do editor de voz por todo o ReportSpec. */
export function aplicarVozSoulstory(spec: ReportSpec): ReportSpec {
  const limparSecoes = (secoes: ReportSpec["parteI"]["secoes"]) =>
    secoes.map((s) => ({
      titulo: semTravessao(s.titulo),
      paragrafos: s.paragrafos.map(semTravessao),
      elementos: s.elementos?.map(limparElemento),
    }));

  return {
    ...spec,
    resumoCheckpoints: spec.resumoCheckpoints.map((c) => ({
      ...c,
      titulo: semTravessao(c.titulo),
      resumo: semTravessao(c.resumo),
    })),
    parteI: { titulo: semTravessao(spec.parteI.titulo), secoes: limparSecoes(spec.parteI.secoes) },
    parteII: { titulo: semTravessao(spec.parteII.titulo), secoes: limparSecoes(spec.parteII.secoes) },
    evidencias: spec.evidencias.map((e) => ({
      ...e,
      afirmacao: semTravessao(e.afirmacao),
      suporte: semTravessao(e.suporte),
    })),
    anexos: spec.anexos.map((a) => ({
      titulo: semTravessao(a.titulo),
      descricao: semTravessao(a.descricao),
      elementos: a.elementos?.map(limparElemento),
    })),
  };
}
