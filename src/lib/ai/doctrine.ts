// Carrega a doutrina versionada nas skills do projeto (.claude/skills) para
// injetar como bloco cacheado no system prompt dos papeis de IA. Manter a
// doutrina nas skills evita duplicar regra entre o ambiente Claude Code e o
// runtime. Se um arquivo nao estiver disponivel no deploy, cai num resumo curto
// embutido para o pipeline nunca quebrar por falta da skill.

import { promises as fs } from "node:fs";
import path from "node:path";
import { blocoCacheavel, type BlocoTexto } from "@/lib/ai/anthropic";

const SKILLS_DIR = path.join(process.cwd(), ".claude", "skills");

export type SkillDoutrina =
  | "visao-externa-metodo"
  | "evidence-ledger"
  | "fact-check-ve"
  | "coletor-protocolos";

const RESUMO_EMBUTIDO: Record<SkillDoutrina, string> = {
  "visao-externa-metodo":
    "Visao Externa (metodo Ana Couto): leia so a percepcao publica. Derive gap de percepcao, promotores, detratores, aceleradores, persona e ondas de valor (produto, pessoas, proposito) apenas de evidencia externa.",
  "evidence-ledger":
    "Nenhuma afirmacao sem ao menos um dado bruto ligado. Toda afirmacao carrega texto, ids de suporte e tipo (citacao_direta, contagem, agregacao, padrao_observado).",
  "fact-check-ve":
    "Relê cada afirmacao contra o dado bruto citado e classifica em confirmada, imprecisa ou nao_sustentada. Sem lastro, sai do relatorio.",
  "coletor-protocolos":
    "Proveniencia em todo dado bruto: URL, carimbo de data, payload intacto. Metrica nao publica e declarada indisponivel, nunca estimada.",
};

const cache = new Map<SkillDoutrina, string>();

async function lerSkill(skill: SkillDoutrina): Promise<string> {
  const memo = cache.get(skill);
  if (memo) return memo;
  let conteudo: string;
  try {
    conteudo = await fs.readFile(
      path.join(SKILLS_DIR, skill, "SKILL.md"),
      "utf8",
    );
  } catch {
    conteudo = RESUMO_EMBUTIDO[skill];
  }
  cache.set(skill, conteudo);
  return conteudo;
}

/** Bloco unico, cacheavel, com a doutrina das skills pedidas. */
export async function doutrina(...skills: SkillDoutrina[]): Promise<BlocoTexto> {
  const partes = await Promise.all(skills.map(lerSkill));
  const texto = partes
    .map((p, i) => `# Doutrina: ${skills[i]}\n\n${p}`)
    .join("\n\n---\n\n");
  return blocoCacheavel(texto);
}
