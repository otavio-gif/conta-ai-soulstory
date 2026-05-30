import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Estado do projeto para o painel (polling): dados, checkpoints e custo.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      checkpoints: { orderBy: { numero: "asc" } },
      costEvents: { orderBy: { createdAt: "desc" } },
      reportArtifacts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) {
    return NextResponse.json({ erro: "Projeto nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({ project });
}
