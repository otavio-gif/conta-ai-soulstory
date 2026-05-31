// Acesso centralizado a variaveis de ambiente e ao modo de validacao sem
// credenciais. Com MOCK_EXTERNAL=1 os clientes de API leem fixtures gravadas em
// vez de chamar servicos pagos, permitindo rodar o pipeline real ponta a ponta
// sem chaves e sem custo (PRD secao 14, aceite da Fase 1).

import { promises as fs } from "node:fs";
import path from "node:path";

/** Liga o modo de fixtures: nenhuma chamada externa paga e resultado deterministico. */
export const MOCK_EXTERNAL = process.env.MOCK_EXTERNAL === "1";

/** Cambio usado para converter o custo das APIs (cotadas em USD) para BRL. */
export const USD_BRL = Number(process.env.USD_BRL ?? "5.40");

/** Raiz das fixtures gravadas das respostas de API. */
export const FIXTURES_DIR = path.join(process.cwd(), "tests", "fixtures");

/**
 * Conjunto de fixtures de larga escala (marca grande), Fase 4. Quando
 * FIXTURE_SET=grande, a leitura procura primeiro em tests/fixtures/grande e cai
 * para a base, de modo que o conjunto grande so precisa sobrescrever os arquivos
 * de alto volume (corpus e saidas de modelo), reaproveitando o resto.
 */
const FIXTURE_SET = process.env.FIXTURE_SET;

/** Le uma fixture JSON pelo caminho relativo dentro de tests/fixtures. */
export async function lerFixture<T>(relativo: string): Promise<T> {
  if (FIXTURE_SET) {
    try {
      const sobrescrita = path.join(FIXTURES_DIR, FIXTURE_SET, relativo);
      return JSON.parse(await fs.readFile(sobrescrita, "utf8")) as T;
    } catch {
      // Sem sobrescrita no conjunto grande: cai para a fixture base.
    }
  }
  const caminho = path.join(FIXTURES_DIR, relativo);
  const conteudo = await fs.readFile(caminho, "utf8");
  return JSON.parse(conteudo) as T;
}

/** URL publica base do app, usada para montar os webhooks de coleta assincrona. */
export function baseUrl(): string {
  const explicita = process.env.APP_BASE_URL;
  if (explicita) return explicita.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/** Le uma variavel obrigatoria, lancando erro claro quando ausente fora do modo mock. */
export function requireEnv(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(
      `Variavel de ambiente ${nome} nao configurada. Defina no .env ou use MOCK_EXTERNAL=1.`,
    );
  }
  return valor;
}
