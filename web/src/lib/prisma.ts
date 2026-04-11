import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import path from "node:path";

declare global {
  var __bookGeneratorPrisma: PrismaClient | undefined;
  var __bookGeneratorPrismaShutdownRegistered: boolean | undefined;
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
  const basename = path.basename(relativePath);
  const searchRoots = Array.from(
    new Set([
      cwd,
      path.resolve(cwd, "web"),
      path.resolve(cwd, ".."),
      path.resolve(cwd, "../web"),
      path.resolve(cwd, "../.."),
      path.resolve(cwd, "../../web"),
      path.resolve(cwd, "../../.."),
    ]),
  );
  const directCandidates = searchRoots.flatMap((root) => [
    path.resolve(root, relativePath),
    path.resolve(root, "web", relativePath),
  ]);
  const prismaCandidates = searchRoots.flatMap((root) => [
    path.resolve(root, "prisma", basename),
    path.resolve(root, "web", "prisma", basename),
  ]);
  const candidates = [...directCandidates, ...prismaCandidates];
  const existingCandidate = candidates.find((candidate) => existsSync(candidate));
  return (
    existingCandidate ||
    candidates[0] ||
    path.resolve(cwd, "web", "prisma", "dev.db")
  ).replace(/\\/g, "/");
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

function envFlag(name: string, defaultValue = false) {
  const raw = (process.env[name] || "").trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

const PRISMA_LOG_QUERIES = envFlag("PRISMA_LOG_QUERIES", false);
const PRISMA_LOG_POOL_CONFIG = envFlag("PRISMA_LOG_POOL_CONFIG", false);

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

const prismaLogLevels: Array<"query" | "warn" | "error"> =
  process.env.NODE_ENV === "development"
    ? PRISMA_LOG_QUERIES
      ? ["query", "warn", "error"]
      : ["warn", "error"]
    : ["error"];

export const prisma =
  globalThis.__bookGeneratorPrisma ??
  new PrismaClient({
    log: prismaLogLevels,
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
if (process.env.NODE_ENV === "development" && PRISMA_LOG_POOL_CONFIG) {
  console.log("[Prisma] Connection pool config:", connectionPoolConfig);
}

// Register graceful shutdown handlers
if (typeof process !== "undefined" && !globalThis.__bookGeneratorPrismaShutdownRegistered) {
  globalThis.__bookGeneratorPrismaShutdownRegistered = true;
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
