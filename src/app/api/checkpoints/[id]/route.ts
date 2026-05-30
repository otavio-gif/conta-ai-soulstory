import { NextResponse } from "next/server";
import { wait } from "@trigger.dev/sdk";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { DecisaoCheckpoint } from "@/lib/pipeline/types";

const schema = z.object({
  decisao: z.enum(["aprovado", "reprovado", "ajuste"]),
  notas: z.string().optional(),
});

// Aprovar, reprovar ou pedir ajuste em um checkpoint: completa o waitpoint e
// retoma o run do orquestrador (PRD secao 10).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: "Requisicao invalida." }, { status: 400 });
  }

  const checkpoint = await prisma.checkpoint.findUnique({ where: { id } });
  if (!checkpoint) {
    return NextResponse.json(
      { erro: "Checkpoint nao encontrado." },
      { status: 404 },
    );
  }
  if (checkpoint.status !== "aguardando" || !checkpoint.tokenId) {
    return NextResponse.json(
      { erro: "Checkpoint nao esta aguardando decisao." },
      { status: 409 },
    );
  }

  const { decisao, notas } = parsed.data;

  await prisma.checkpoint.update({
    where: { id },
    data: {
      status: decisao,
      decisao,
      notas: notas ?? null,
      resolvedAt: new Date(),
    },
  });

  await wait.completeToken<DecisaoCheckpoint>(checkpoint.tokenId, {
    decisao,
    notas,
  });

  return NextResponse.json({ ok: true });
}
