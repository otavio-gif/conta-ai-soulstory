// Coletor de SEO e busca no Google (PRD secao 3.2, Fase 3). Usa o DataForSEO
// como fonte unica: o que aparece ao pesquisar a marca (SERP organica), o "as
// pessoas tambem perguntam" (PAA), os featured snippets, as sugestoes de
// autocomplete, as palavras relacionadas e o volume de busca declarado. A SERP
// vai por Task POST com pingback fechando o waitpoint (igual ao Apify); volume,
// relacionadas e autocomplete vao em Live.
//
// Conteudo de terceiros que ranqueia (ehTerceiro=true) alimenta o coletor de
// mencoes. Volume de busca e sempre dado da API, nunca estimado.

import { wait } from "@trigger.dev/sdk";
import { lerFixture, MOCK_EXTERNAL } from "@/lib/env";
import {
  autocompleteLive,
  relacionadasLive,
  serpTaskGet,
  serpTaskPost,
  volumeBuscaLive,
} from "@/lib/collectors/dataforseo";
import { comoObjeto, lista, numero, texto } from "@/lib/collectors/util";
import type {
  LacunaColeta,
  SerpItem,
  VolumeBusca,
} from "@/lib/pipeline/types";

export interface ResultadoSeoSerp {
  serp: SerpItem[];
  volumes: VolumeBusca[];
  lacunas: LacunaColeta[];
  // URLs organicas de terceiros que ranqueiam, para a descoberta de mencoes web.
  urlsTerceiros: string[];
}

function dominioDe(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function ehDaMarca(dominio: string, dominiosMarca: string[]): boolean {
  const d = dominio.toLowerCase();
  return dominiosMarca.some((m) => {
    const limpo = m.replace(/^www\./, "").toLowerCase();
    return d === limpo || d.endsWith(`.${limpo}`);
  });
}

/**
 * Normaliza o result[] do task_get/advanced da SERP em SerpItem. Trata organico,
 * featured snippet, people_also_ask e related_searches. Funcao pura (testavel).
 */
export function normalizarSerp(
  resultados: unknown[],
  dominiosMarca: string[],
): SerpItem[] {
  const itens: SerpItem[] = [];
  let seq = 0;

  for (const r of resultados) {
    const bloco = comoObjeto(r);
    const termo = texto(bloco, "keyword");
    for (const item of lista(bloco, "items")) {
      const o = comoObjeto(item);
      const tipoBruto = texto(o, "type");

      if (tipoBruto === "organic" || tipoBruto === "featured_snippet") {
        const url = texto(o, "url");
        const dominio = dominioDe(url);
        itens.push({
          externalId: `serp_${++seq}`,
          termo,
          tipo: tipoBruto === "featured_snippet" ? "featured_snippet" : "organico",
          posicao: numero(o, "rank_absolute", "rank_group"),
          titulo: texto(o, "title"),
          url,
          snippet: texto(o, "description", "snippet"),
          dominio,
          ehTerceiro: dominio.length > 0 && !ehDaMarca(dominio, dominiosMarca),
        });
      } else if (tipoBruto === "people_also_ask") {
        for (const paa of lista(o, "items")) {
          const p = comoObjeto(paa);
          const expandido = comoObjeto(lista(p, "expanded_element")[0]);
          const url = texto(expandido, "url");
          const dominio = dominioDe(url);
          itens.push({
            externalId: `serp_${++seq}`,
            termo,
            tipo: "paa",
            posicao: null,
            titulo: texto(p, "title"),
            url,
            snippet: texto(expandido, "description"),
            dominio,
            ehTerceiro: dominio.length > 0 && !ehDaMarca(dominio, dominiosMarca),
          });
        }
      } else if (tipoBruto === "related_searches") {
        for (const rel of lista(o, "items")) {
          if (typeof rel !== "string") continue;
          itens.push({
            externalId: `serp_${++seq}`,
            termo,
            tipo: "related",
            posicao: null,
            titulo: rel,
            url: "",
            snippet: "",
            dominio: "",
            ehTerceiro: false,
          });
        }
      }
    }
  }
  return itens;
}

/** Normaliza autocomplete em SerpItem do tipo autocomplete. Funcao pura. */
export function normalizarAutocomplete(resultados: unknown[]): SerpItem[] {
  const itens: SerpItem[] = [];
  let seq = 0;
  for (const r of resultados) {
    const bloco = comoObjeto(r);
    const termo = texto(bloco, "keyword");
    for (const item of lista(bloco, "items")) {
      const o = comoObjeto(item);
      const sugestao = texto(o, "suggestion");
      if (!sugestao) continue;
      itens.push({
        externalId: `ac_${++seq}`,
        termo,
        tipo: "autocomplete",
        posicao: null,
        titulo: sugestao,
        url: "",
        snippet: "",
        dominio: "",
        ehTerceiro: false,
      });
    }
  }
  return itens;
}

/** Normaliza related_keywords (Labs) em SerpItem do tipo related. Funcao pura. */
export function normalizarRelacionadas(resultados: unknown[]): SerpItem[] {
  const itens: SerpItem[] = [];
  let seq = 0;
  for (const r of resultados) {
    const kd = comoObjeto(comoObjeto(r).keyword_data);
    const kw = texto(kd, "keyword");
    if (!kw) continue;
    itens.push({
      externalId: `rel_${++seq}`,
      termo: kw,
      tipo: "related",
      posicao: null,
      titulo: kw,
      url: "",
      snippet: "",
      dominio: "",
      ehTerceiro: false,
    });
  }
  return itens;
}

/** Normaliza o search_volume (Keywords Data) em VolumeBusca declarado. Funcao pura. */
export function normalizarVolumes(resultados: unknown[]): VolumeBusca[] {
  const volumes: VolumeBusca[] = [];
  for (const r of resultados) {
    const o = comoObjeto(r);
    const termo = texto(o, "keyword");
    if (!termo) continue;
    const volume = numero(o, "search_volume");
    // Volume nunca e estimado: ausente vira disponivel=false (PRD secao 9.5).
    volumes.push({ termo, volume, disponivel: volume !== null });
  }
  return volumes;
}

export async function coletarSeoSerp(params: {
  projectId: string;
  termos: string[];
  dominiosMarca: string[];
  webhookBase?: string;
}): Promise<ResultadoSeoSerp> {
  const { termos, dominiosMarca } = params;
  const termoPrincipal = termos[0] ?? "";

  if (MOCK_EXTERNAL) {
    const serpBruto = await lerFixture<unknown[]>("dataforseo/serp-task-get.json");
    const volumeBruto = await lerFixture<unknown[]>("dataforseo/search-volume.json");
    const autocompleteBruto = await lerFixture<unknown[]>("dataforseo/autocomplete.json");
    const relacionadasBruto = await lerFixture<unknown[]>(
      "dataforseo/related-keywords.json",
    );

    const serp = [
      ...normalizarSerp(serpBruto, dominiosMarca),
      ...normalizarAutocomplete(autocompleteBruto),
      ...normalizarRelacionadas(relacionadasBruto),
    ];
    const volumes = normalizarVolumes(volumeBruto);
    const urlsTerceiros = serp
      .filter((s) => s.ehTerceiro && s.url)
      .map((s) => s.url);
    return { serp, volumes, lacunas: [], urlsTerceiros };
  }

  const lacunas: LacunaColeta[] = [];
  const base = params.webhookBase ?? "";

  // SERP organica por Task POST com pingback fechando o waitpoint (padrao Apify).
  let serpItens: SerpItem[] = [];
  if (termoPrincipal) {
    const token = await wait.createToken({ timeout: "1h", tags: [params.projectId] });
    const taskId = await serpTaskPost(
      termoPrincipal,
      `${base}/api/webhooks/dataforseo?token=${token.id}&id=__task_id__`,
    );
    const ok = await wait.forToken<{ ok: boolean; taskId: string | null }>(token.id);
    if (ok.ok && ok.output.ok) {
      const resultados = await serpTaskGet(ok.output.taskId ?? taskId);
      serpItens = normalizarSerp(
        resultados.map((res) => ({
          keyword: termoPrincipal,
          items: (comoObjeto(res).items as unknown[]) ?? [],
        })),
        dominiosMarca,
      );
    } else {
      lacunas.push({
        fonte: "seo_serp",
        motivo: "Task de SERP do DataForSEO nao concluiu (timeout ou pingback perdido).",
      });
    }
  }

  // Volume, relacionadas e autocomplete em Live (chamadas curtas).
  const volumes = normalizarVolumes(await volumeBuscaLive(termos));
  const autocomplete = normalizarAutocomplete(
    termoPrincipal ? await autocompleteLive(termoPrincipal) : [],
  );
  const relacionadas = normalizarRelacionadas(
    termoPrincipal ? await relacionadasLive(termoPrincipal) : [],
  );

  const serp = [...serpItens, ...autocomplete, ...relacionadas];
  const urlsTerceiros = serp.filter((s) => s.ehTerceiro && s.url).map((s) => s.url);
  return { serp, volumes, lacunas, urlsTerceiros };
}
