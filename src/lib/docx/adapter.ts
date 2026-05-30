// Adaptador de geracao do documento. Desacopla o pipeline da skill
// soulstory-docx (que o Otavio fornecera) por um contrato JSON (ReportSpec).
//
// Caminho 1 (preferido): se SOULSTORY_DOCX_CMD estiver setado, grava o
// ReportSpec em um arquivo temporario e invoca o comando como:
//     <SOULSTORY_DOCX_CMD> <input.json> <output.docx>
// a skill le o JSON e produz o .docx no padrao indigo Soulstory.
//
// Caminho 2 (fallback): gera um .docx minimo valido com a lib `docx`, para a
// Fase 0 fechar de ponta a ponta mesmo sem a skill instalada.

import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ReportSpec, ReportSpecSecao } from "@/lib/pipeline/types";

const execFileAsync = promisify(execFile);

const INDIGO = "312E81";

export interface DocxResultado {
  buffer: Buffer;
  nomeArquivo: string;
}

export async function comporDocx(spec: ReportSpec): Promise<DocxResultado> {
  const nomeArquivo = `diagnostico-visao-externa-${slug(spec.projeto.nome)}.docx`;
  const cmd = process.env.SOULSTORY_DOCX_CMD?.trim();

  if (cmd) {
    const buffer = await viaSkill(cmd, spec);
    return { buffer, nomeArquivo };
  }

  const buffer = await viaFallback(spec);
  return { buffer, nomeArquivo };
}

async function viaSkill(cmd: string, spec: ReportSpec): Promise<Buffer> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "soulstory-docx-"));
  const inputPath = path.join(dir, "report-spec.json");
  const outputPath = path.join(dir, "relatorio.docx");

  await fs.writeFile(inputPath, JSON.stringify(spec, null, 2), "utf8");

  const [bin, ...args] = cmd.split(/\s+/);
  await execFileAsync(bin, [...args, inputPath, outputPath], {
    maxBuffer: 64 * 1024 * 1024,
  });

  return fs.readFile(outputPath);
}

function secoesToParagraphs(secoes: ReportSpecSecao[]): Paragraph[] {
  const out: Paragraph[] = [];
  for (const secao of secoes) {
    out.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: secao.titulo, color: INDIGO })],
      }),
    );
    if (secao.paragrafos.length === 0) {
      out.push(new Paragraph({ text: "Conteudo a desenvolver." }));
    }
    for (const p of secao.paragrafos) {
      out.push(new Paragraph({ text: p }));
    }
  }
  return out;
}

async function viaFallback(spec: ReportSpec): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Capa
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({ text: "Diagnostico de Visao Externa", color: INDIGO }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: spec.projeto.nome, color: INDIGO })],
    }),
    new Paragraph({
      text: `Tipo: ${spec.projeto.tipo}. Janela: ${spec.projeto.janela.inicio} a ${spec.projeto.janela.fim}.`,
    }),
    new Paragraph({ text: `Gerado em ${spec.geradoEm}.` }),
    new Paragraph({
      text: "Documento minimo gerado pelo fallback. Sera substituido pela skill soulstory-docx.",
    }),
  );

  // Sumario dos checkpoints
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "Resumo dos checkpoints", color: INDIGO })],
    }),
  );
  for (const c of spec.resumoCheckpoints) {
    children.push(new Paragraph({ text: `${c.numero}. ${c.titulo}: ${c.resumo}` }));
  }

  // Parte I e Parte II
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: spec.parteI.titulo, color: INDIGO })],
    }),
    ...secoesToParagraphs(spec.parteI.secoes),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: spec.parteII.titulo, color: INDIGO })],
    }),
    ...secoesToParagraphs(spec.parteII.secoes),
  );

  // Evidencias (rastreabilidade)
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "Registro de evidencias", color: INDIGO })],
    }),
  );
  for (const e of spec.evidencias) {
    children.push(
      new Paragraph({
        text: `[${e.status}] ${e.afirmacao} (suporte: ${e.suporte})`,
      }),
    );
  }

  // Anexos
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "Anexos", color: INDIGO })],
    }),
  );
  for (const a of spec.anexos) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: a.titulo, color: INDIGO })],
      }),
      new Paragraph({ text: a.descricao }),
    );
  }

  const doc = new Document({
    creator: "Conta A.I. Soulstory",
    title: `Diagnostico de Visao Externa - ${spec.projeto.nome}`,
    styles: {
      default: {
        document: { run: { font: "Cabin" } },
      },
    },
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
