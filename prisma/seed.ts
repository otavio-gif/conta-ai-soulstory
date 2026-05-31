// Seed minimo: cria um projeto mock para validar o fluxo. Idempotente.
//   pnpm db:seed

import { PrismaClient } from "@prisma/client";
import { MOCK_BRAND } from "../src/lib/pipeline/mock-data";

const prisma = new PrismaClient();

async function main() {
  const existente = await prisma.project.findFirst({
    where: { nome: MOCK_BRAND.nome },
  });
  if (existente) {
    console.log(`Seed ja aplicado (projeto ${existente.id}).`);
    return;
  }

  const project = await prisma.project.create({
    data: {
      nome: MOCK_BRAND.nome,
      tipo: MOCK_BRAND.tipo,
      briefing: `Diagnostico de Visao Externa da marca ${MOCK_BRAND.nome}. Perfil ${MOCK_BRAND.handles.instagram}, site ${MOCK_BRAND.site}, presenca no Reclame Aqui e busca. Palavras-chave: ${MOCK_BRAND.palavrasChave.join(", ")}.`,
      janelaInicio: new Date("2026-02-01T00:00:00.000Z"),
      janelaFim: new Date("2026-03-31T23:59:59.000Z"),
      status: "rascunho",
    },
  });

  console.log(`Projeto seed criado: ${project.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
