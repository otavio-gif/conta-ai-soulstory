/**
 * Cria (de forma idempotente) o bucket de Storage onde o pipeline salva o
 * relatorio final e os artefatos. Resolve o erro "Bucket not found" que derruba
 * o orquestrador no ultimo passo (persistirRelatorio).
 *
 * Rodar:  pnpm bucket:criar
 * Seguro de repetir: se o bucket ja existe, apenas reporta e sai.
 */
export {}; // marca como modulo (evita colisao de "main" no typecheck do projeto)

process.loadEnvFile(".env");

async function main() {
  // Import dinamico: so depois do loadEnvFile, para o cliente ler as envs certas.
  const { getSupabaseAdmin, REPORT_BUCKET } = await import("../src/lib/supabase");

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error(
      "Credenciais do Supabase ausentes no .env " +
        "(NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY). Nada a fazer.",
    );
    process.exit(1);
  }

  const { data: buckets, error: erroLista } =
    await supabase.storage.listBuckets();
  if (erroLista) {
    console.error("Falha ao listar buckets:", erroLista.message);
    process.exit(1);
  }

  if (buckets.some((b) => b.name === REPORT_BUCKET)) {
    console.log(`OK: bucket "${REPORT_BUCKET}" ja existe. Nada a criar.`);
    return;
  }

  const { error: erroCria } = await supabase.storage.createBucket(
    REPORT_BUCKET,
    {
      // Privado: relatorios e artefatos brutos nunca sao expostos ao browser.
      public: false,
    },
  );
  if (erroCria) {
    console.error(`Falha ao criar bucket "${REPORT_BUCKET}":`, erroCria.message);
    process.exit(1);
  }

  console.log(`Criado: bucket privado "${REPORT_BUCKET}".`);
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
