import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import path from "node:path";

declare global {
  var __bookGeneratorPrisma: PrismaClient | undefined;
}

function splitSqliteUrl(rawUrl: string) {
  const noPrefix = rawUrl.slice("file:".length);
  const queryIndex = noPrefix.indexOf("?");
  if (queryIndex === -1) {
    return { dbPath: noPrefix, query: "" };
  }
  return {
    dbPath: noPrefix.slice(0, queryIndex),
    query: noPrefix.slice(queryIndex),
  };
}

function resolveSqlitePath(relativePath: string) {
  const cwd = process.cwd();
  const searchRoots = [cwd, path.resolve(cwd, ".."), path.resolve(cwd, "../.."), path.resolve(cwd, "../../..")];
  const directCandidates = searchRoots.map((root) => path.resolve(root, relativePath));
  const prismaCandidates =
    path.basename(relativePath).toLowerCase() === "dev.db"
      ? searchRoots.map((root) => path.resolve(root, "prisma", path.basename(relativePath)))
      : [];
  const candidates = [...directCandidates, ...prismaCandidates];
  const existingCandidate = candidates.find((candidate) => existsSync(candidate));
  return (existingCandidate || candidates[0] || path.resolve(cwd, "prisma", "dev.db")).replace(/\\/g, "/");
}

function normalizedDatabaseUrl() {
  const current = (process.env.DATABASE_URL || "file:./dev.db").trim();
  if (!current.startsWith("file:")) {
    return current;
  }

  const { dbPath, query } = splitSqliteUrl(current);
  if (!dbPath || dbPath === ":memory:" || path.isAbsolute(dbPath)) {
    return current;
  }

  const resolvedPath = resolveSqlitePath(dbPath);
  return `file:${resolvedPath}${query}`;
}

process.env.DATABASE_URL = normalizedDatabaseUrl();

export const prisma =
  globalThis.__bookGeneratorPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__bookGeneratorPrisma = prisma;
}
