// Fixtures deterministicas de uma marca pequena, para o pipeline da Fase 0.
// Honram o principio de "dado nao disponivel": salvamentos e compartilhamentos
// de Instagram aparecem como indisponiveis, nunca estimados (PRD secao 4 e 9.5).

import type { SourceKind } from "@/lib/pipeline/types";

export interface MockPost {
  externalId: string;
  fonte: SourceKind;
  legenda: string;
  url: string;
  publicadoEm: string;
  curtidas: number | null;
  comentariosCount: number | null;
  visualizacoes: number | null;
  // Nao publicos no Instagram: ficam nulos e sao reportados como indisponiveis.
  salvamentos: number | null;
  compartilhamentos: number | null;
}

export interface MockComment {
  postExternalId: string;
  autor: string;
  texto: string;
  publicadoEm: string;
}

export interface MockComplaint {
  titulo: string;
  texto: string;
  resposta: string | null;
  status: string;
  avaliacao: number | null;
}

export interface MockSerp {
  termo: string;
  posicao: number;
  titulo: string;
  url: string;
  snippet: string;
  tipo: "organico" | "paa" | "featured";
}

export interface MockBrand {
  nome: string;
  tipo: "marca" | "influenciador";
  handles: { instagram: string };
  site: string;
  palavrasChave: string[];
  posts: MockPost[];
  comments: MockComment[];
  complaints: MockComplaint[];
  serp: MockSerp[];
}

export const MOCK_BRAND: MockBrand = {
  nome: "Cafes Serra Azul",
  tipo: "marca",
  handles: { instagram: "@cafesserraazul" },
  site: "https://cafesserraazul.com.br",
  palavrasChave: ["cafe especial", "serra azul", "torra artesanal"],
  posts: [
    {
      externalId: "ig_001",
      fonte: "instagram",
      legenda:
        "Nossa torra media nasce de graos colhidos a mao na Serra da Mantiqueira.",
      url: "https://instagram.com/p/ig_001",
      publicadoEm: "2026-02-04T13:00:00.000Z",
      curtidas: 1280,
      comentariosCount: 64,
      visualizacoes: null,
      salvamentos: null,
      compartilhamentos: null,
    },
    {
      externalId: "ig_002",
      fonte: "instagram",
      legenda: "Reel: o passo a passo do nosso metodo de coar em casa.",
      url: "https://instagram.com/p/ig_002",
      publicadoEm: "2026-02-18T18:30:00.000Z",
      curtidas: 2210,
      comentariosCount: 138,
      visualizacoes: 41200,
      salvamentos: null,
      compartilhamentos: null,
    },
    {
      externalId: "ig_003",
      fonte: "instagram",
      legenda: "Lancamento da edicao limitada de inverno. Pre-venda aberta.",
      url: "https://instagram.com/p/ig_003",
      publicadoEm: "2026-03-02T12:15:00.000Z",
      curtidas: 1740,
      comentariosCount: 95,
      visualizacoes: null,
      salvamentos: null,
      compartilhamentos: null,
    },
  ],
  comments: [
    {
      postExternalId: "ig_001",
      autor: "ana.bebe.cafe",
      texto: "O sabor dessa torra e incomparavel, virei cliente fiel.",
      publicadoEm: "2026-02-04T14:10:00.000Z",
    },
    {
      postExternalId: "ig_002",
      autor: "joao.barista",
      texto: "Adorei o passo a passo, finalmente acertei o coado em casa.",
      publicadoEm: "2026-02-18T19:02:00.000Z",
    },
    {
      postExternalId: "ig_003",
      autor: "cliente.curitiba",
      texto: "A entrega demorou mais do que o prometido, mas o cafe compensou.",
      publicadoEm: "2026-03-03T09:40:00.000Z",
    },
  ],
  complaints: [
    {
      titulo: "Atraso na entrega",
      texto: "Pedido feito ha 12 dias e ainda nao chegou.",
      resposta: "Pedimos desculpas, reenviamos com prioridade e frete cortesia.",
      status: "Resolvido",
      avaliacao: 4,
    },
  ],
  serp: [
    {
      termo: "cafes serra azul",
      posicao: 1,
      titulo: "Cafes Serra Azul | Torra artesanal da Mantiqueira",
      url: "https://cafesserraazul.com.br",
      snippet: "Cafe especial torrado em pequenos lotes.",
      tipo: "organico",
    },
    {
      termo: "cafes serra azul vale a pena",
      posicao: 1,
      titulo: "As pessoas tambem perguntam",
      url: "https://google.com/paa",
      snippet: "O cafe da Serra Azul vale a pena?",
      tipo: "paa",
    },
  ],
};
