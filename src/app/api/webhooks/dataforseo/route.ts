import { NextResponse } from "next/server";
import { wait } from "@trigger.dev/sdk";

// Webhook (pingback) de conclusao das tasks do DataForSEO. Fecha o waitpoint
// criado pelo coletor de SEO para que o estagio de coleta retome e busque o
// resultado por task_get (PRD secao 6 e 15). O tokenId vem na query string
// montada na criacao da task. O DataForSEO chama o pingback por GET (nao por
// POST como o Apify), entao tratamos os dois metodos com a mesma logica.

async function fecharWaitpoint(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("token");
  if (!tokenId) {
    return NextResponse.json({ erro: "token ausente" }, { status: 400 });
  }

  // O id da task vem no pingback (?id=$id), substituido pelo DataForSEO.
  const taskId = searchParams.get("id") ?? null;

  await wait.completeToken<{ ok: boolean; taskId: string | null }>(tokenId, {
    ok: true,
    taskId,
  });

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  return fecharWaitpoint(request);
}

export async function POST(request: Request) {
  return fecharWaitpoint(request);
}
