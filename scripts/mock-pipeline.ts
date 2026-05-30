/*
 * Roda os 7 estagios do pipeline de Visao Externa in-process, com dado mock e
 * auto-aprovacao, e gera o docx localmente. Demonstra o aceite da Fase 0 sem
 * depender de Supabase nem Trigger.dev.
 *
 *   pnpm mock:pipeline
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { comporDocx } from "@/lib/docx/adapter";
import {
  analisar,
  coletar,
  comporReportSpec,
  interpretarBriefing,
  montarOutline,
  transcreverOcr,
  verificar,
} from "@/lib/pipeline/stages";
import { CHECKPOINTS } from "@/lib/pipeline/types";
import { formatBRL } from "@/lib/utils";

function checkpoint(numero: number, resumo: string) {
  const def = CHECKPOINTS.find((c) => c.numero === numero);
  console.log(`\n[checkpoint ${numero}] ${def?.titulo}`);
  console.log(`  ${resumo}`);
  console.log("  decisao: aprovado (auto)");
}

async function main() {
  console.log("Pipeline de Visao Externa (mock, auto-aprovado)\n================================================");

  const janela = { inicio: "2026-02-01T00:00:00.000Z", fim: "2026-03-31T23:59:59.000Z" };

  const plano = interpretarBriefing({
    briefing: "Diagnostico da marca Cafes Serra Azul no Instagram, Reclame Aqui e busca.",
    janela,
  });
  checkpoint(
    1,
    `${plano.fontes.length} fontes. Custo estimado ${formatBRL(plano.custo.totalBRL)} ` +
      `(guardrail ${formatBRL(plano.custo.guardrailBRL)} para ${plano.custo.mesesJanela} mes(es), ` +
      `${plano.custo.dentroDoGuardrail ? "dentro" : "acima"} do alvo).`,
  );

  const inventario = coletar();
  checkpoint(
    2,
    `${inventario.totalArtefatos} artefatos brutos. Lacunas: ${inventario.lacunas.length}. ` +
      `Metricas indisponiveis: ${inventario.metricasIndisponiveis.join(", ")}.`,
  );

  const amostra = transcreverOcr();
  checkpoint(
    3,
    `${amostra.totalTranscricoes} transcricao(oes), ${amostra.totalOcr} OCR. ` +
      `${amostra.amostras.length} amostra(s) de qualidade.`,
  );

  const analise = analisar();
  checkpoint(4, `${analise.insights.length} insights, ${analise.graficos.length} grafico(s).`);

  const outline = montarOutline();
  checkpoint(
    5,
    `Parte I com ${outline.parteI.length} secoes, Parte II com ${outline.parteII.length} secoes.`,
  );

  const verificacao = verificar();
  checkpoint(
    6,
    `${verificacao.confirmadas} afirmacoes confirmadas, ${verificacao.descartadas} descartada(s) por falta de lastro.`,
  );

  const spec = comporReportSpec({
    plano,
    inventario,
    amostra,
    analise,
    outline,
    verificacao,
  });
  const docx = await comporDocx(spec);

  const dir = path.join(process.cwd(), "tmp");
  await fs.mkdir(dir, { recursive: true });
  const out = path.join(dir, "diagnostico-mock.docx");
  await fs.writeFile(out, docx.buffer);
  checkpoint(7, `Documento gerado: ${out} (${docx.buffer.length} bytes).`);

  console.log("\nConcluido. Os 7 checkpoints passaram e o docx minimo foi gerado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
