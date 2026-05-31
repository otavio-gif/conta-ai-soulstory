// Coletor Reclame Aqui (PRD secao 3.2). Reclamacoes e respostas na janela, mais
// indicadores publicos. Pagina via Firecrawl com retomada: cada pagina vira
// artefato bruto assim que chega, e bloqueio persistente vira lacuna declarada.

import { lerFixture, MOCK_EXTERNAL } from "@/lib/env";
import { custoFirecrawl, registrarCustoEvent } from "@/lib/cost";
import { chamarClaude } from "@/lib/ai/anthropic";
import { bloco, blocoCacheavel } from "@/lib/ai/anthropic";
import { scrape } from "@/lib/collectors/firecrawl";
import type {
  IndicadoresReclameAqui,
  LacunaColeta,
  ReclamacaoColetada,
} from "@/lib/pipeline/types";

const MAX_PAGINAS = 20;

export interface PaginaBruta {
  url: string;
  markdown: string;
}

export interface ResultadoReclameAqui {
  reclamacoes: ReclamacaoColetada[];
  indicadores: IndicadoresReclameAqui | null;
  lacunas: LacunaColeta[];
  paginasBrutas: PaginaBruta[];
}

interface ExtracaoPagina {
  reclamacoes: ReclamacaoColetada[];
  indicadores: IndicadoresReclameAqui | null;
  temMais: boolean;
}

const SCHEMA_EXTRACAO = {
  type: "object",
  properties: {
    reclamacoes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          titulo: { type: "string" },
          texto: { type: "string" },
          resposta: { type: ["string", "null"] },
          status: { type: ["string", "null"] },
          avaliacao: { type: ["number", "null"] },
          url: { type: "string" },
          publicadoEm: { type: ["string", "null"] },
        },
        required: ["id", "titulo", "texto", "url"],
      },
    },
    indicadores: {
      type: ["object", "null"],
      properties: {
        nota: { type: ["number", "null"] },
        indiceResposta: { type: ["string", "null"] },
        indiceSolucao: { type: ["string", "null"] },
        reclamacoesRespondidas: { type: ["string", "null"] },
      },
    },
    temMais: { type: "boolean" },
  },
  required: ["reclamacoes", "temMais"],
} as const;

/** Extrai reclamacoes e indicadores do markdown de uma pagina (Haiku mecanico). */
async function extrairPagina(
  markdown: string,
  url: string,
  janela: { inicio: string; fim: string },
): Promise<ExtracaoPagina> {
  const resp = await chamarClaude<ExtracaoPagina>({
    papel: "mecanico",
    fixtureKey: "reclame-aqui-extracao",
    system: [
      blocoCacheavel(
        "Voce extrai reclamacoes, respostas da marca e indicadores publicos do markdown de uma pagina do Reclame Aqui. Nao invente dados: copie o que esta na pagina. Marque temMais=true se houver paginacao para mais reclamacoes.",
      ),
    ],
    conteudo: [
      bloco(`Janela: ${janela.inicio} a ${janela.fim}. URL: ${url}`),
      bloco(markdown.slice(0, 60000)),
    ],
    ferramenta: {
      nome: "registrar_pagina_ra",
      descricao: "Registra as reclamacoes e indicadores extraidos da pagina.",
      schema: SCHEMA_EXTRACAO as unknown as Record<string, unknown>,
      parse: (e) => e as ExtracaoPagina,
    },
  });
  return resp.dados ?? { reclamacoes: [], indicadores: null, temMais: false };
}

export async function coletarReclameAqui(params: {
  projectId: string;
  url: string;
  janela: { inicio: string; fim: string };
}): Promise<ResultadoReclameAqui> {
  const { url, janela } = params;

  if (MOCK_EXTERNAL) {
    const fixture = await lerFixture<{
      reclamacoes: ReclamacaoColetada[];
      indicadores: IndicadoresReclameAqui | null;
    }>("firecrawl/reclame-aqui.json");
    return {
      reclamacoes: fixture.reclamacoes,
      indicadores: fixture.indicadores,
      lacunas: [],
      paginasBrutas: [],
    };
  }

  const reclamacoes: ReclamacaoColetada[] = [];
  const paginasBrutas: PaginaBruta[] = [];
  const lacunas: LacunaColeta[] = [];
  let indicadores: IndicadoresReclameAqui | null = null;

  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const paginaUrl = pagina === 1 ? url : `${url}?pagina=${pagina}`;
    const resultado = await scrape(paginaUrl);
    await registrarCustoEvent({
      fonte: "reclame_aqui",
      descricao: `Firecrawl scrape pagina ${pagina}`,
      custoBRL: custoFirecrawl(1),
    });

    if (resultado.bloqueado) {
      lacunas.push({
        fonte: "reclame_aqui",
        motivo: `Coleta interrompida por bloqueio na pagina ${pagina}. Capturadas ${reclamacoes.length} reclamacoes ate aqui.`,
      });
      break;
    }

    // Retomada: grava a pagina bruta antes de extrair, para nao reprocessar.
    paginasBrutas.push({ url: paginaUrl, markdown: resultado.markdown });
    const extracao = await extrairPagina(resultado.markdown, paginaUrl, janela);
    if (extracao.indicadores && !indicadores) indicadores = extracao.indicadores;
    reclamacoes.push(...extracao.reclamacoes);
    if (!extracao.temMais) break;
  }

  return { reclamacoes, indicadores, lacunas, paginasBrutas };
}
