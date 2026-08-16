import { PrismaClient } from "@/generated/prisma";

// Evita criar múltiplas instâncias do PrismaClient durante hot-reload em
// desenvolvimento (o Next.js recarrega módulos a cada mudança).
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
