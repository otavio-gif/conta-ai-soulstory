// Cliente da API Anthropic para os papeis de IA do pipeline (PRD secao 8.2).
// No runtime nao existe Claude Code: cada "sub-agente" e uma chamada a este
// cliente com system prompt por papel. O prefixo estavel (instrucao do papel +
// doutrina das skills + corpus compartilhado) recebe cache_control para
// maximizar cache hits entre as passadas por post e entre os papeis.
//
// Com MOCK_EXTERNAL=1 nenhuma chamada e feita: a resposta vem de uma fixture
// gravada, deixando a logica real (ledger, verificacao, redacao) exercitavel
// sem chave e sem custo.

import Anthropic from "@anthropic-ai/sdk";
import { lerFixture, MOCK_EXTERNAL, requireEnv } from "@/lib/env";
import { custoAnthropic, registrarCustoEvent } from "@/lib/cost";
import { MODELO_POR_PAPEL, type ModeloId, type PapelIA } from "@/lib/ai/models";

export interface BlocoTexto {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}

export interface BlocoImagem {
  type: "image";
  source: { type: "url"; url: string };
}

export type ConteudoBloco = BlocoTexto | BlocoImagem;

/** Marca um texto longo e estavel como cacheavel (doutrina ou corpus). */
export function blocoCacheavel(text: string): BlocoTexto {
  return { type: "text", text, cache_control: { type: "ephemeral" } };
}

export function bloco(text: string): BlocoTexto {
  return { type: "text", text };
}

export function blocoImagemUrl(url: string): BlocoImagem {
  return { type: "image", source: { type: "url", url } };
}

export interface FerramentaSaida<T> {
  nome: string;
  descricao: string;
  schema: Record<string, unknown>;
  // Narrowing da entrada do tool_use, validado pelo chamador.
  parse: (entrada: unknown) => T;
}

export interface ChamadaClaude<T> {
  papel: PapelIA;
  /** Blocos do system prompt (instrucao do papel + doutrina cacheada). */
  system: BlocoTexto[];
  /** Blocos da mensagem do usuario (corpus cacheado, imagens e instrucao). */
  conteudo: ConteudoBloco[];
  /** Quando presente, forca saida estruturada via tool use. */
  ferramenta?: FerramentaSaida<T>;
  maxTokens?: number;
  /** Chave da fixture usada quando MOCK_EXTERNAL=1. Obrigatoria nesse modo. */
  fixtureKey: string;
  modelo?: ModeloId;
}

export interface RespostaClaude<T> {
  texto: string;
  dados: T | null;
}

let clienteSingleton: Anthropic | null = null;

/** Cliente Anthropic singleton, reusado pela chamada unica e pelo lote (batch). */
export function clienteAnthropic(): Anthropic {
  if (!clienteSingleton) {
    clienteSingleton = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  }
  return clienteSingleton;
}

/** Modelo efetivo de uma chamada (override explicito ou o do papel). */
export function modeloDaChamada<T>(params: ChamadaClaude<T>): ModeloId {
  return params.modelo ?? MODELO_POR_PAPEL[params.papel];
}

/** Corpo da requisicao a Messages, compartilhado entre chamada unica e lote. */
export function corpoMensagem<T>(
  params: ChamadaClaude<T>,
): Anthropic.Messages.MessageCreateParamsNonStreaming {
  const tools = params.ferramenta
    ? [
        {
          name: params.ferramenta.nome,
          description: params.ferramenta.descricao,
          input_schema: params.ferramenta.schema as Anthropic.Tool.InputSchema,
        },
      ]
    : undefined;
  return {
    model: modeloDaChamada(params),
    max_tokens: params.maxTokens ?? 8192,
    system: params.system,
    messages: [{ role: "user", content: params.conteudo }],
    tools,
    tool_choice: params.ferramenta
      ? { type: "tool", name: params.ferramenta.nome }
      : undefined,
  };
}

/** Extrai texto e a saida estruturada (tool_use) do conteudo de uma resposta. */
export function interpretarConteudo<T>(
  content: Anthropic.Messages.ContentBlock[],
  ferramenta?: FerramentaSaida<T>,
): RespostaClaude<T> {
  let texto = "";
  let dados: T | null = null;
  for (const b of content) {
    if (b.type === "text") texto += b.text;
    if (b.type === "tool_use" && ferramenta) dados = ferramenta.parse(b.input);
  }
  return { texto, dados };
}

/** Le a fixture de uma chamada quando MOCK_EXTERNAL, com fallback por papel. */
export async function lerFixtureChamada<T>(
  params: ChamadaClaude<T>,
): Promise<RespostaClaude<T>> {
  // Fallback por papel (Fase 4): habilita centenas de itens em larga escala sem
  // uma fixture por externalId. A fixture especifica das fases anteriores vence.
  const fixture = await lerFixture<{ texto?: string; dados?: T }>(
    `anthropic/${params.fixtureKey}.json`,
  ).catch(() => lerFixture<{ texto?: string; dados?: T }>(`anthropic/${params.papel}.default.json`));
  return { texto: fixture.texto ?? "", dados: (fixture.dados ?? null) as T | null };
}

export async function chamarClaude<T = never>(
  params: ChamadaClaude<T>,
): Promise<RespostaClaude<T>> {
  if (MOCK_EXTERNAL) return lerFixtureChamada(params);

  const modelo = modeloDaChamada(params);
  // Streaming: a redacao do relatorio (Opus, saida longa) pode passar de 10 min
  // numa unica chamada, e o SDK exige streaming nesse caso. finalMessage() junta
  // o stream e devolve a mensagem completa (com usage), servindo a qualquer
  // tamanho de saida, das chamadas curtas a redacao inteira.
  const resposta = await clienteAnthropic()
    .messages.stream(corpoMensagem(params))
    .finalMessage();

  await registrarCustoEvent({
    fonte: "anthropic",
    descricao: `${params.papel} (${modelo})`,
    custoBRL: custoAnthropic(modelo, resposta.usage),
  });

  return interpretarConteudo(resposta.content, params.ferramenta);
}
