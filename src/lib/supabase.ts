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
