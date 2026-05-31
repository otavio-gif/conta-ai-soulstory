import { PrismaClient } from "@prisma/client";

// Singleton do Prisma. Em dev o Next recarrega modulos a cada mudanca, entao
// guardamos a instancia no globalThis para nao estourar conexoes.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
