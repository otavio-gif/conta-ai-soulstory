import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { orchestrator } from "@/trigger/orchestrator";

const schema = z.object({
  nome: z.string().min(1).optional(),
  tipo: z.enum(["marca", "influenciador"]).default("marca"),
  briefing: z.string().min(1, "Informe o briefing."),
  janelaInicio: z.string(),
  janelaFim: z.string(),
});

export async function GET() {
  const projetos = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nome: true,
      tipo: true,
      status: true,
      custoAcumulado: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ projetos });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.issues[0]?.message ?? "Requisicao invalida." },
      { status: 400 },
    );
  }

  const { nome, tipo, briefing, janelaInicio, janelaFim } = parsed.data;

  const project = await prisma.project.create({
    data: {
      nome: nome ?? "Diagnostico sem titulo",
      tipo,
      briefing,
      janelaInicio: new Date(janelaInicio),
      janelaFim: new Date(janelaFim),
      status: "rascunho",
    },
  });

  // Dispara o orquestrador. Best-effort: sem TRIGGER_SECRET_KEY o projeto e
  // criado mesmo assim e o operador pode rodar o pipeline depois.
  let avisoTrigger: string | null = null;
  try {
    const handle = await tasks.trigger<typeof orchestrator>("orchestrator-ve", {
      projectId: project.id,
    });
    await prisma.project.update({
      where: { id: project.id },
      data: { triggerRunId: handle.id },
    });
  } catch (err) {
    avisoTrigger =
      "Projeto criado, mas o orquestrador nao foi disparado (Trigger.dev nao configurado).";
    console.warn(avisoTrigger, err);
  }

  return NextResponse.json({ id: project.id, avisoTrigger }, { status: 201 });
}
