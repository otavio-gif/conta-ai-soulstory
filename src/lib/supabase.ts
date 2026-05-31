import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a service_role, exclusivo do servidor (storage de
 * artefatos brutos e relatorios). Nunca exponha esta chave ao browser.
 * Retorna null quando as credenciais nao estao configuradas, para a Fase 0
 * funcionar sem infra (o caminho mock grava em disco).
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return null;
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false },
  });
}

export const REPORT_BUCKET =
  process.env.SOULSTORY_REPORT_BUCKET ?? "report-artifacts";

/**
 * Garante que o bucket privado de relatorios existe. Idempotente: nao faz nada
 * se ja existe, e trata corrida (dois criadores simultaneos) como sucesso.
 * Usado tanto pelo script de setup quanto como autocorrecao no upload, para que
 * um bucket faltando nunca derrube o run no ultimo passo (era o "Bucket not
 * found" em persistirRelatorio). Retorna true se criou agora.
 */
export async function garantirReportBucket(
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    throw new Error(`Falha ao listar buckets do Supabase: ${error.message}`);
  }
  if (buckets.some((b) => b.name === REPORT_BUCKET)) return false;

  const { error: erroCria } = await supabase.storage.createBucket(
    REPORT_BUCKET,
    { public: false }, // relatorios e artefatos nunca sao expostos ao browser
  );
  if (erroCria && !/already exists/i.test(erroCria.message)) {
    throw new Error(
      `Falha ao criar bucket "${REPORT_BUCKET}": ${erroCria.message}`,
    );
  }
  return true;
}
