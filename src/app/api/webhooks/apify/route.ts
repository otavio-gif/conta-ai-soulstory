import { NextResponse } from "next/server";
import { wait } from "@trigger.dev/sdk";

// Webhook de conclusao das runs do Apify. Fecha o waitpoint criado pelo coletor
// para que o estagio de coleta retome e busque os itens do dataset (PRD secao
// 6 e 15). O tokenId vem na query string configurada na criacao da run.

interface ApifyWebhookBody {
  eventType?: string;
  resource?: { status?: string; defaultDatasetId?: string };
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get("token");
  if (!tokenId) {
    return NextResponse.json({ erro: "token ausente" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as ApifyWebhookBody;
  const status = body.resource?.status ?? body.eventType ?? "DESCONHECIDO";
  const sucesso =
    body.eventType === "ACTOR.RUN.SUCCEEDED" || status === "SUCCEEDED";

  await wait.completeToken<{ ok: boolean; status: string }>(tokenId, {
    ok: sucesso,
    status,
  });

  return NextResponse.json({ ok: true });
}
