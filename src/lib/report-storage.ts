import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import type { DocxResultado } from "@/lib/docx/adapter";
import {
  garantirReportBucket,
  getSupabaseAdmin,
  REPORT_BUCKET,
} from "@/lib/supabase";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Persiste o relatorio gerado. Com Supabase configurado, sobe ao bucket de
 * artefatos; sem credenciais (caminho mock), grava em ./tmp. Em ambos os casos
 * cria a linha ReportArtifact.
 */
export async function persistirRelatorio(params: {
  projectId: string;
  nome: string;
  docx: DocxResultado;
}): Promise<{ storagePath: string }> {
  const { projectId, nome, docx } = params;
  const supabase = getSupabaseAdmin();
  let storagePath: string;

  if (supabase) {
    const objectPath = `${projectId}/${docx.nomeArquivo}`;
    const subir = () =>
      supabase.storage.from(REPORT_BUCKET).upload(objectPath, docx.buffer, {
        contentType: DOCX_MIME,
        upsert: true,
      });

    let { error } = await subir();
    // Autocorrecao: se o bucket nao existe, cria e tenta uma vez mais, para que
    // um Storage nao provisionado nao derrube o run no ultimo passo.
    if (error && /bucket not found/i.test(error.message)) {
      await garantirReportBucket(supabase);
      ({ error } = await subir());
    }
    if (error) {
      throw new Error(`Falha ao subir o relatorio ao Supabase: ${error.message}`);
    }
    storagePath = `${REPORT_BUCKET}/${objectPath}`;
  } else {
    const dir = path.join(process.cwd(), "tmp");
    await fs.mkdir(dir, { recursive: true });
    const local = path.join(dir, docx.nomeArquivo);
    await fs.writeFile(local, docx.buffer);
    storagePath = local;
  }

  await prisma.reportArtifact.create({
    data: {
      projectId,
      tipo: "relatorio_final",
      titulo: `Diagnostico de Visao Externa - ${nome}`,
      formato: "docx",
      storagePath,
      bytes: docx.buffer.length,
    },
  });

  return { storagePath };
}
