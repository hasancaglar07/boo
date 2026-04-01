import { PrismaClient } from "@prisma/client";

declare global {
  var __bookGeneratorPrisma: PrismaClient | undefined;
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

export const prisma =
  globalThis.__bookGeneratorPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__bookGeneratorPrisma = prisma;
}
