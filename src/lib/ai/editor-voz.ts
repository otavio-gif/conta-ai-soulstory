// Passe de voz Soulstory por modelo (editor_voz, Haiku), PRD secao 8 e Fase 4.
// Roda DEPOIS da verificacao factual e da redacao, sobre a prosa nao evidencial
// do ReportSpec (paragrafos, callouts e textos de cards das Partes I e II). So
// refina clareza, coesao e voz: e proibido alterar numeros, nomes, datas ou
// qualquer afirmacao. Guarda deterministica de digitos reverte o bloco editado
// se qualquer numero mudar, blindando o evidence ledger. O sanitizador
// deterministico (aplicarVozSoulstory) ainda roda por ULTIMO, depois deste passe.
//
// O texto das afirmacoes do ledger (spec.evidencias) e das tabelas de anexo NAO
// passa por aqui: fica congelado, so pelo sanitizador.

import { bloco, blocoCacheavel, chamarClaude } from "@/lib/ai/anthropic";
import { PROMPT_EDITOR_VOZ } from "@/lib/ai/prompts";
import type { ReportSpec } from "@/lib/pipeline/types";

/** Sequencias numericas de um texto (digitos com separadores ou porcentagem). */
export function numerosDe(s: string): string[] {
  return s.match(/\d[\d.,]*%?/g) ?? [];
}

/** Guarda de fidelidade: o bloco editado tem exatamente os mesmos numeros. */
export function mesmosNumeros(antes: string, depois: string): boolean {
  const a = numerosDe(antes);
  const b = numerosDe(depois);
  return a.length === b.length && a.every((n, i) => n === b[i]);
}

interface Acessor {
  texto: string;
  set: (s: string) => void;
}

/** Coleta os blocos de prosa editaveis das secoes, com setters sobre o clone. */
function blocosEditaveis(secoes: ReportSpec["parteI"]["secoes"]): Acessor[] {
  const acessores: Acessor[] = [];
  for (const secao of secoes) {
    secao.paragrafos.forEach((p, i) => {
      acessores.push({ texto: p, set: (s) => (secao.paragrafos[i] = s) });
    });
    for (const el of secao.elementos ?? []) {
      if (el.tipo === "paragrafo") {
        acessores.push({ texto: el.texto, set: (s) => (el.texto = s) });
      } else if (el.tipo === "callout") {
        el.paragrafos.forEach((p, i) => {
          acessores.push({ texto: p, set: (s) => (el.paragrafos[i] = s) });
        });
      } else if (el.tipo === "cards") {
        for (const item of el.itens) {
          acessores.push({ texto: item.texto, set: (s) => (item.texto = s) });
        }
      }
    }
  }
  return acessores;
}

export async function revisarVozReportSpec(spec: ReportSpec): Promise<ReportSpec> {
  const parteI = structuredClone(spec.parteI);
  const parteII = structuredClone(spec.parteII);
  const acessores = [
    ...blocosEditaveis(parteI.secoes),
    ...blocosEditaveis(parteII.secoes),
  ];
  if (acessores.length === 0) return spec;

  const entrada = acessores.map((a, i) => ({ indice: i, texto: a.texto }));
  const resp = await chamarClaude<{ blocos: Array<{ indice: number; texto: string }> }>({
    papel: "editor_voz",
    fixtureKey: "editor-voz",
    system: [bloco(PROMPT_EDITOR_VOZ)],
    conteudo: [
      blocoCacheavel(JSON.stringify(entrada, null, 2)),
      bloco(
        "Reescreva cada bloco pelo indice, so para clareza e voz Soulstory. Nao altere numeros, nomes, datas nem afirmacoes. Devolva todos os blocos, na mesma ordem.",
      ),
    ],
    maxTokens: 16000,
    ferramenta: {
      nome: "registrar_revisao_voz",
      descricao: "Devolve cada bloco de prosa revisado, pelo indice.",
      schema: {
        type: "object",
        properties: {
          blocos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                indice: { type: "number" },
                texto: { type: "string" },
              },
              required: ["indice", "texto"],
            },
          },
        },
        required: ["blocos"],
      },
      parse: (e) => e as { blocos: Array<{ indice: number; texto: string }> },
    },
  });

  const editados = new Map<number, string>();
  for (const b of resp.dados?.blocos ?? []) editados.set(b.indice, b.texto);

  for (let i = 0; i < acessores.length; i++) {
    const novo = editados.get(i);
    // So aplica se ha edicao valida e os numeros permanecem intactos (guarda).
    if (typeof novo === "string" && novo.trim() && mesmosNumeros(acessores[i].texto, novo)) {
      acessores[i].set(novo);
    }
  }

  return { ...spec, parteI, parteII };
}
