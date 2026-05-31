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
  const { garantirReportBucket, getSupabaseAdmin, REPORT_BUCKET } =
    await import("../src/lib/supabase");

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error(
      "Credenciais do Supabase ausentes no .env " +
        "(NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY). Nada a fazer.",
    );
    process.exit(1);
  }

  const criou = await garantirReportBucket(supabase);
  console.log(
    criou
      ? `Criado: bucket privado "${REPORT_BUCKET}".`
      : `OK: bucket "${REPORT_BUCKET}" ja existe. Nada a criar.`,
  );
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
