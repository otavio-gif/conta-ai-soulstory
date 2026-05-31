/**
 * Retomada da entrega final, sem refazer coleta/transcricao/analise/verificacao.
 *
 * Contexto: o run real do orquestrador rodou ate o fim e morreu so no upload do
 * relatorio ("Bucket not found"). Todo o trabalho caro ja esta persistido no
 * Postgres: os payloads dos checkpoints 1 a 6 (plano, inventario, amostra,
 * analise, outline, verificacao) e o corpus (RawArtifact.payload + metricas).
 * Este script recarrega tudo isso, re-roda APENAS a redacao final
 * (comporRelatorio), monta o .docx e o sobe ao bucket, criando o ReportArtifact.
 *
 * Unico passo pago que se repete: a redacao (2 chamadas Claude para as Partes I
 * e II). Coleta, Whisper, analise e verificacao NAO sao refeitas.
 *
 * Rodar:  npx tsx scripts/retomar-entrega.ts [projectId]
 * Sem projectId, usa o projeto mais recente.
 */
export {}; // marca como modulo (evita colisao de "main" no typecheck do projeto)

process.loadEnvFile(".env");

// Builder do .docx no padrao Soulstory (mesmo das fixtures), se nao houver outro.
if (!process.env.SOULSTORY_DOCX_CMD?.trim()) {
  process.env.SOULSTORY_DOCX_CMD = "node scripts/soulstory-docx-build.js";
}

async function main() {
  // Imports dinamicos: so depois do loadEnvFile, para Prisma e Anthropic lerem
  // as envs corretas (mesmo padrao de scripts/smoke-test-apis.ts).
  const { PrismaClient } = await import("@prisma/client");
  const { comporRelatorio } = await import("../src/lib/ai/redacao");
  const { comporDocx } = await import("../src/lib/docx/adapter");
  const { persistirRelatorio } = await import("../src/lib/report-storage");
  const { comContextoDeCusto } = await import("../src/lib/cost");

  const db = new PrismaClient();

  const argId = process.argv[2];
  const project = argId
    ? await db.project.findUnique({ where: { id: argId } })
    : await db.project.findFirst({ orderBy: { createdAt: "desc" } });
  if (!project) {
    console.error("Projeto nao encontrado.");
    process.exit(1);
  }
  const projectId = project.id;

  const jaTem = await db.reportArtifact.count({ where: { projectId } });
  if (jaTem > 0) {
    console.log(
      `Projeto ${projectId} ja possui ${jaTem} relatorio(s). Abortando para nao duplicar.`,
    );
    await db.$disconnect();
    return;
  }

  // Payloads dos checkpoints 1 a 6 (ja aprovados e salvos como JSON).
  const cps = await db.checkpoint.findMany({ where: { projectId } });
  const carga = (numero: number, chave: string): any => {
    const pl: any = cps.find((c) => c.numero === numero)?.payload;
    if (!pl || pl[chave] === undefined) {
      throw new Error(`Checkpoint ${numero} sem "${chave}" no payload. Run incompleto?`);
    }
    return pl[chave];
  };
  const plano = carga(1, "plano");
  const inventario = carga(2, "inventario");
  const amostra = carga(3, "amostra");
  const analise = carga(4, "analise");
  const outline = carga(5, "outline");
  const verificacao = carga(6, "verificacao");

  // Reconstroi o corpus a partir dos artefatos brutos. persistirColeta gravou o
  // objeto original inteiro de cada item em RawArtifact.payload, com a fonte.
  const artefatos = await db.rawArtifact.findMany({ where: { projectId } });
  const posts = artefatos
    .filter((a) => a.fonte !== "reclame_aqui" && a.fonte !== "seo_serp")
    .map((a) => a.payload as any);
  const reclamacoes = artefatos
    .filter((a) => a.fonte === "reclame_aqui")
    .map((a) => a.payload as any);
  const serp = artefatos
    .filter((a) => a.fonte === "seo_serp")
    .map((a) => a.payload as any);

  const volMetrics = await db.metric.findMany({
    where: { projectId, nome: "volume_busca" },
  });
  const volumesBusca = volMetrics.map((m) => ({
    termo: m.itemId,
    volume: m.valor,
    disponivel: m.disponivel,
  }));

  // A redacao so toca posts, reclamacoes, indicadoresRA, serp e volumesBusca
  // (verificado em src/lib/ai/redacao.ts). Os demais campos nao sao usados na
  // composicao; ficam com defaults fieis ao que foi coletado.
  const corpus: any = {
    marca: plano.marca,
    tipo: plano.tipo,
    janela: plano.janela,
    posts,
    reclamacoes,
    indicadoresRA: null,
    transcricoes: [],
    ocr: [],
    serp,
    volumesBusca,
    lacunas: [],
    metricasIndisponiveis: [],
  };

  console.log(
    `Recompondo entrega de "${plano.marca}" | posts:${posts.length} ` +
      `serp:${serp.length} volumes:${volumesBusca.length} ` +
      `findings:${analise.findings?.length ?? 0} claims:${verificacao.claims?.length ?? 0}`,
  );

  // Re-roda APENAS a redacao, dentro do contexto de custo (grava CostEvent).
  // Sem "desempenho": os tempos por estagio eram medicoes em memoria, perdidas
  // no crash. Omitir o anexo de desempenho e fiel; nao inventamos tempos.
  const spec = await comContextoDeCusto(projectId, () =>
    comporRelatorio({ plano, corpus, inventario, amostra, analise, outline, verificacao }),
  );

  const docx = await comporDocx(spec);
  const { storagePath } = await persistirRelatorio({
    projectId,
    nome: plano.marca,
    docx,
  });

  // Registra o draft final (CP7) e conclui o projeto, espelhando o orquestrador.
  await db.checkpoint.upsert({
    where: { projectId_numero: { projectId, numero: 7 } },
    create: {
      projectId,
      numero: 7,
      titulo: "Draft final",
      status: "aprovado",
      decisao: "aprovado",
      notas: "Entrega retomada apos correcao do bucket de Storage.",
      payload: { id: "draft_final", spec, storagePath } as any,
      resolvedAt: new Date(),
    },
    update: {
      status: "aprovado",
      decisao: "aprovado",
      notas: "Entrega retomada apos correcao do bucket de Storage.",
      payload: { id: "draft_final", spec, storagePath } as any,
      resolvedAt: new Date(),
    },
  });
  await db.project.update({
    where: { id: projectId },
    data: { status: "concluido" },
  });

  const custo = await db.costEvent.aggregate({
    where: { projectId },
    _sum: { custoBRL: true },
  });
  console.log(`\nENTREGA CONCLUIDA.`);
  console.log(`  Relatorio: ${storagePath} (${(docx.buffer.length / 1024).toFixed(0)} KB)`);
  console.log(`  Custo total acumulado do projeto: R$ ${(custo._sum.custoBRL ?? 0).toFixed(2)}`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error("FALHOU:", String(e?.stack ?? e).slice(0, 600));
  process.exit(1);
});
