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

// Connection pool configuration from environment variables
const connectionPoolConfig = {
  // Maximum number of connections in the pool
  max: parseInt(process.env.DATABASE_POOL_MAX || "10", 10),
  // Minimum number of connections in the pool
  min: parseInt(process.env.DATABASE_POOL_MIN || "2", 10),
  // Idle timeout in milliseconds (30 seconds default)
  idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT || "30000", 10),
  // Acquire timeout in milliseconds (60 seconds default)
  acquireTimeoutMillis: parseInt(process.env.DATABASE_POOL_ACQUIRE_TIMEOUT || "60000", 10),
};

export const prisma =
  globalThis.__bookGeneratorPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Connection pool health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("[Prisma] Database connection check failed:", error);
    return false;
  }
}

// Graceful shutdown handler
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log("[Prisma] Database disconnected successfully");
  } catch (error) {
    console.error("[Prisma] Error disconnecting database:", error);
  }
}

// Log connection pool status in development
if (process.env.NODE_ENV === "development") {
  console.log("[Prisma] Connection pool config:", connectionPoolConfig);
}

// Register graceful shutdown handlers
if (typeof process !== "undefined") {
  const shutdown = async (signal: string) => {
    console.log(`[Prisma] Received ${signal}, disconnecting database...`);
    await disconnectPrisma();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

if (process.env.NODE_ENV !== "production") {
  globalThis.__bookGeneratorPrisma = prisma;
}
