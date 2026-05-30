import { NextResponse } from "next/server";
import { wait } from "@trigger.dev/sdk";

// Webhook (pingback) de conclusao das tasks do DataForSEO. Fecha o waitpoint
// criado pelo coletor de SEO para que o estagio de coleta retome e busque o
// resultado por task_get (PRD secao 6 e 15). Espelha o webhook do Apify: o
// tokenId vem na query string montada na criacao da task.

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("token");
  if (!tokenId) {
    return NextResponse.json({ erro: "token ausente" }, { status: 400 });
  }

  // O DataForSEO inclui o id da task no pingback (?id=$id) e/ou no corpo.
  const taskId = searchParams.get("id") ?? null;

  await wait.completeToken<{ ok: boolean; taskId: string | null }>(tokenId, {
    ok: true,
    taskId,
  });

  return NextResponse.json({ ok: true });
}
