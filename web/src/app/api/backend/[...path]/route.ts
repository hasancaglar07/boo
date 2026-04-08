import { NextResponse, type NextRequest } from "next/server";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import { auth } from "@/auth";
import { GUEST_GENERATE_RATE_LIMIT } from "@/lib/auth/constants";
import { audit } from "@/lib/auth/audit";
import {
  assignBookOwner,
  attachGuestCookie,
  backfillLegacyBookOwnership,
  canAccessBookPreview,
  canAccessFullBook,
  claimGuestBooksForUser,
  enrichPreviewEntitlements,
  extractSlugFromWorkspacePath,
  getBookStartAllowance,
  getGuestIdentityFromCookies,
  getOrCreateGuestIdentity,
  getOwnedBookSlugs,
  recordBookUsage,
  requestMeta,
  usageReasonLabel,
  viewerFromIds,
} from "@/lib/auth/data";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { prisma } from "@/lib/prisma";

const BACKEND_ORIGIN =
  process.env.DASHBOARD_ORIGIN ||
  process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN ||
  "http://127.0.0.1:8765";

// Timeout configuration from environment variables
const BACKEND_TIMEOUT_MULTIPLIER = Number(process.env.BACKEND_TIMEOUT_MULTIPLIER || "1.0");
const BACKEND_FETCH_TIMEOUT_MS = Number(process.env.BACKEND_FETCH_TIMEOUT_MS || "20000") * BACKEND_TIMEOUT_MULTIPLIER;
const BACKEND_BOOKS_FETCH_TIMEOUT_MS = Number(process.env.BACKEND_BOOKS_FETCH_TIMEOUT_MS || "30000") * BACKEND_TIMEOUT_MULTIPLIER;
const BACKEND_BOOK_DETAIL_FETCH_TIMEOUT_MS = Number(process.env.BACKEND_BOOK_DETAIL_FETCH_TIMEOUT_MS || "40000") * BACKEND_TIMEOUT_MULTIPLIER;
const BACKEND_BOOK_PREVIEW_FETCH_TIMEOUT_MS = Number(process.env.BACKEND_BOOK_PREVIEW_FETCH_TIMEOUT_MS || "12000") * BACKEND_TIMEOUT_MULTIPLIER;
const BACKEND_BOOK_PREVIEW_BOOTSTRAP_TIMEOUT_MS = Number(process.env.BACKEND_BOOK_PREVIEW_BOOTSTRAP_TIMEOUT_MS || "45000") * BACKEND_TIMEOUT_MULTIPLIER;
const BACKEND_WORKFLOW_FETCH_TIMEOUT_MS = Number(process.env.BACKEND_WORKFLOW_FETCH_TIMEOUT_MS || "240000") * BACKEND_TIMEOUT_MULTIPLIER;
const BACKEND_UNREACHABLE_LOG_THROTTLE_MS = Number(process.env.BACKEND_UNREACHABLE_LOG_THROTTLE_MS || "5000");
const PREVIEW_STATUS_LOG_THROTTLE_MS = Number(process.env.PREVIEW_STATUS_LOG_THROTTLE_MS || "15000");
const FULL_BOOTSTRAP_TRIGGER_THROTTLE_MS = Number(process.env.FULL_BOOTSTRAP_TRIGGER_THROTTLE_MS || "45000");
const BACKEND_UNAVAILABLE_BACKOFF_MS = Number(process.env.BACKEND_UNAVAILABLE_BACKOFF_MS || "5000");
const BACKEND_AUTO_START_COOLDOWN_MS = Number(process.env.BACKEND_AUTO_START_COOLDOWN_MS || "15000");
const BACKEND_RECOVERY_RETRY_TIMEOUT_MS = Number(process.env.BACKEND_RECOVERY_RETRY_TIMEOUT_MS || "8000");
const PREVIEW_CACHE_TTL_MS = Number(process.env.PREVIEW_CACHE_TTL_MS || "600000");
const BACKEND_AUTO_START_ENABLED = process.env.BOOK_AUTO_START_DASHBOARD !== "0";

const IMAGE_FILE_PATTERN = /\.(png|jpe?g|webp|gif|svg|ico)$/i;

export const runtime = "nodejs";

class BackendUnavailableError extends Error {
  readonly code = "BACKEND_UNAVAILABLE";

  constructor() {
    super("BACKEND_UNAVAILABLE");
    this.name = "BackendUnavailableError";
  }
}

declare global {
  var __backendLastUnreachableLogAt: number | undefined;
  var __backendUnavailableUntilByPath: Record<string, number> | undefined;
  var __backendLastStartAttemptAt: number | undefined;
  var __backendStartInFlight: Promise<boolean> | undefined;
  var __backendPreviewCacheBySlug: Record<string, { payload: Record<string, unknown>; cachedAt: number }> | undefined;
  var __backendPreviewLastStatusLogBySlug: Record<string, number> | undefined;
  var __backendFullBootstrapLastAttemptBySlug: Record<string, number> | undefined;
}

function isBackendUnavailableLike(error: unknown) {
  if (error instanceof BackendUnavailableError) return true;
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: unknown; code?: unknown; message?: unknown };
  if (candidate.name === "BackendUnavailableError") return true;
  if (candidate.code === "BACKEND_UNAVAILABLE") return true;
  return typeof candidate.message === "string" && candidate.message.includes("BACKEND_UNAVAILABLE");
}

function logUpstreamUnavailable(details: {
  method: string;
  upstream: string;
  timeoutMs: number;
  reason: string;
}) {
  const now = Date.now();
  const last = globalThis.__backendLastUnreachableLogAt || 0;
  if (now - last < BACKEND_UNREACHABLE_LOG_THROTTLE_MS) return;
  globalThis.__backendLastUnreachableLogAt = now;
  console.error("[api/backend] upstream unreachable", details);
}

function backendCircuitKeyForPath(upstreamPath: string) {
  if (upstreamPath === "/api/settings") return "/api/settings";
  if (upstreamPath === "/api/books") return "/api/books";
  if (/^\/api\/books\/[^/]+\/preview$/.test(upstreamPath)) return "/api/books/:slug/preview";
  return null;
}

function readCachedPreviewPayload(slug: string): Record<string, unknown> | null {
  const cache = globalThis.__backendPreviewCacheBySlug;
  if (!cache) return null;
  const entry = cache[slug];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > PREVIEW_CACHE_TTL_MS) {
    delete cache[slug];
    return null;
  }
  return entry.payload;
}

function writeCachedPreviewPayload(slug: string, payload: Record<string, unknown>) {
  const cache = globalThis.__backendPreviewCacheBySlug || {};
  cache[slug] = {
    payload,
    cachedAt: Date.now(),
  };
  globalThis.__backendPreviewCacheBySlug = cache;
}

function logPreviewStatus(slug: string, payload: Record<string, unknown>, source: "live" | "stale-cache") {
  const cache = globalThis.__backendPreviewLastStatusLogBySlug || {};
  const now = Date.now();
  const last = cache[slug] || 0;
  if (now - last < PREVIEW_STATUS_LOG_THROTTLE_MS) return;
  cache[slug] = now;
  globalThis.__backendPreviewLastStatusLogBySlug = cache;

  const generationRaw = payload.generation;
  const generation = generationRaw && typeof generationRaw === "object"
    ? (generationRaw as Record<string, unknown>)
    : {};
  const fullRaw = generation.full_generation;
  const full = fullRaw && typeof fullRaw === "object"
    ? (fullRaw as Record<string, unknown>)
    : {};

  console.info("[api/backend] preview status", {
    slug,
    source,
    stage: String(generation.stage || ""),
    previewReady: Boolean(generation.preview_ready),
    coverState: String(generation.cover_state || ""),
    coverReady: Boolean(generation.cover_ready),
    fullStage: String(full.stage || ""),
    fullReadyCount: Number(full.ready_count || 0),
    fullTargetCount: Number(full.target_count || 0),
    fullEtaSeconds: Number(full.eta_seconds || 0),
    fullError: String(full.error || ""),
  });
}

function shouldTriggerFullBootstrap(slug: string) {
  const cache = globalThis.__backendFullBootstrapLastAttemptBySlug || {};
  const now = Date.now();
  const last = cache[slug] || 0;
  if (now - last < FULL_BOOTSTRAP_TRIGGER_THROTTLE_MS) {
    return false;
  }
  cache[slug] = now;
  globalThis.__backendFullBootstrapLastAttemptBySlug = cache;
  return true;
}

function markBackendUnavailable(pathKey: string | null) {
  if (!pathKey) return;
  const cache = globalThis.__backendUnavailableUntilByPath || {};
  cache[pathKey] = Date.now() + BACKEND_UNAVAILABLE_BACKOFF_MS;
  globalThis.__backendUnavailableUntilByPath = cache;
}

function clearBackendUnavailable(pathKey: string | null) {
  if (!pathKey) return;
  const cache = globalThis.__backendUnavailableUntilByPath;
  if (!cache) return;
  cache[pathKey] = 0;
}

function shouldShortCircuitBackend(pathKey: string | null) {
  if (!pathKey) return false;
  const cache = globalThis.__backendUnavailableUntilByPath;
  if (!cache) return false;
  const until = cache[pathKey] || 0;
  return Date.now() < until;
}

function backendLooksLocal() {
  try {
    const url = new URL(BACKEND_ORIGIN);
    return url.hostname === "127.0.0.1" || url.hostname === "localhost" || url.hostname === "::1";
  } catch {
    return false;
  }
}

function resolveDashboardStartScript() {
  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, "../start-dashboard.sh"),
    path.resolve(cwd, "../../start-dashboard.sh"),
    path.resolve(cwd, "start-dashboard.sh"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function maybeStartLocalDashboard() {
  if (!BACKEND_AUTO_START_ENABLED || !backendLooksLocal()) {
    return false;
  }
  if (globalThis.__backendStartInFlight) {
    return globalThis.__backendStartInFlight;
  }
  const now = Date.now();
  const last = globalThis.__backendLastStartAttemptAt || 0;
  if (now - last < BACKEND_AUTO_START_COOLDOWN_MS) {
    return false;
  }

  const startScript = resolveDashboardStartScript();
  if (!startScript) {
    return false;
  }

  globalThis.__backendLastStartAttemptAt = now;

  const attempt = new Promise<boolean>((resolve) => {
    const child = spawn("bash", [startScript, "start"], {
      stdio: "ignore",
    });
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), 12000);
    child.once("error", () => {
      clearTimeout(timer);
      finish(false);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      finish(code === 0);
    });
  }).finally(() => {
    globalThis.__backendStartInFlight = undefined;
  });

  globalThis.__backendStartInFlight = attempt;
  return attempt;
}

async function retryUpstreamAfterRecovery(input: {
  request: NextRequest;
  url: URL;
  headers: Headers;
  body: ArrayBuffer | null;
  timeoutMs: number;
}) {
  const started = await maybeStartLocalDashboard();
  if (!started) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, Math.min(input.timeoutMs, BACKEND_RECOVERY_RETRY_TIMEOUT_MS));
  try {
    return await fetch(input.url, {
      method: input.request.method,
      headers: new Headers(input.headers),
      body:
        input.request.method === "GET" || input.request.method === "HEAD" || !input.body || input.body.byteLength === 0
          ? undefined
          : input.body,
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function jsonError(status: number, error: string, code?: string) {
  return NextResponse.json(
    {
      ok: false,
      error,
      ...(code ? { code } : {}),
    },
    { status },
  );
}

function cloneHeaders(headers: Headers) {
  const nextHeaders = new Headers();
  for (const [key, value] of headers.entries()) {
    const lower = key.toLowerCase();
    if (lower === "content-encoding" || lower === "content-length" || lower === "transfer-encoding") {
      continue;
    }
    nextHeaders.set(key, value);
  }
  return nextHeaders;
}

function withGuestCookie(response: NextResponse, rawToken?: string | null) {
  if (rawToken) {
    attachGuestCookie(response, rawToken);
  }
  return response;
}

async function readJsonBody(body: ArrayBuffer | null) {
  if (!body || body.byteLength === 0) return null;
  try {
    return JSON.parse(new TextDecoder().decode(body)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function forwardToBackend(
  request: NextRequest,
  upstreamPath: string,
  body: ArrayBuffer | null,
) {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cookie");

  const url = new URL(upstreamPath, BACKEND_ORIGIN);
  url.search = request.nextUrl.search;

  const isPreviewPath = /^\/api\/books\/[^/]+\/preview$/.test(upstreamPath);
  const isBookDetailPath = /^\/api\/books\/[^/]+$/.test(upstreamPath);
  const isPreviewBootstrapPath = /^\/api\/books\/[^/]+\/preview-bootstrap$/.test(upstreamPath);
  const isFullBootstrapPath = /^\/api\/books\/[^/]+\/full-bootstrap$/.test(upstreamPath);
  const timeoutMs =
    upstreamPath === "/api/books" && request.method === "GET"
      ? BACKEND_BOOKS_FETCH_TIMEOUT_MS
      : isBookDetailPath && request.method === "GET"
        ? BACKEND_BOOK_DETAIL_FETCH_TIMEOUT_MS
      : isPreviewBootstrapPath && request.method === "POST"
        ? BACKEND_BOOK_PREVIEW_BOOTSTRAP_TIMEOUT_MS
      : isPreviewPath && request.method === "GET"
        ? BACKEND_BOOK_PREVIEW_FETCH_TIMEOUT_MS
      : isFullBootstrapPath
        ? BACKEND_BOOK_PREVIEW_FETCH_TIMEOUT_MS
      : upstreamPath === "/api/workflows" && request.method === "POST"
        ? BACKEND_WORKFLOW_FETCH_TIMEOUT_MS
        : BACKEND_FETCH_TIMEOUT_MS;
  const circuitPathKey = request.method === "GET" ? backendCircuitKeyForPath(upstreamPath) : null;

  if (shouldShortCircuitBackend(circuitPathKey)) {
    throw new BackendUnavailableError();
  }

  const controller = new AbortController();
  let didTimeout = false;
  const timeout = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD" || !body || body.byteLength === 0
          ? undefined
          : body,
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
    clearBackendUnavailable(circuitPathKey);
    return response;
  } catch (error) {
    const recovered = await retryUpstreamAfterRecovery({
      request,
      url,
      headers,
      body,
      timeoutMs,
    });
    if (recovered) {
      clearBackendUnavailable(circuitPathKey);
      return recovered;
    }

    const reason =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);
    const isAbortError = error instanceof Error && error.name === "AbortError";
    if (didTimeout || !isAbortError) {
      logUpstreamUnavailable({
        method: request.method,
        upstream: url.toString(),
        timeoutMs,
        reason,
      });
      markBackendUnavailable(circuitPathKey);
    }
    throw new BackendUnavailableError();
  } finally {
    clearTimeout(timeout);
  }
}

async function forwardResponse(
  request: NextRequest,
  upstreamPath: string,
  body: ArrayBuffer | null,
) {
  const response = await forwardToBackend(request, upstreamPath, body);
  return new NextResponse(response.body, {
    status: response.status,
    headers: cloneHeaders(response.headers),
  });
}

async function requirePreviewAccess(input: {
  request: NextRequest;
  slug: string;
  userId: string | null;
  guestIdentityId: string | null;
}) {
  const allowed = await canAccessBookPreview(
    viewerFromIds(input.userId, input.guestIdentityId),
    input.slug,
  );

  if (allowed) {
    return null;
  }

  await audit({
    action: "preview.access_denied",
    entityType: "book",
    entityId: input.slug,
    actorUserId: input.userId,
    guestIdentityId: input.guestIdentityId,
    request: input.request,
  });

  if (!input.userId && !input.guestIdentityId) {
    return jsonError(401, "You need to create or link this book to your account first for this preview.", "AUTH_REQUIRED");
  }

  return jsonError(403, "You don't have permission to access this book preview.", "BOOK_ACCESS_DENIED");
}

async function requireFullAccess(input: {
  slug: string;
  userId: string | null;
  guestIdentityId?: string | null;
}) {
  if (!input.userId) {
    return jsonError(401, "Session required for this operation.", "AUTH_REQUIRED");
  }

  let ownsBook = await canAccessBookPreview(viewerFromIds(input.userId, null), input.slug);
  if (!ownsBook && input.guestIdentityId) {
    const guestHasBook = await canAccessBookPreview(viewerFromIds(null, input.guestIdentityId), input.slug);
    if (guestHasBook) {
      await claimGuestBooksForUser({
        userId: input.userId,
        guestIdentityId: input.guestIdentityId,
      }).catch(() => 0);
      ownsBook = await canAccessBookPreview(viewerFromIds(input.userId, null), input.slug);
    }
  }
  if (!ownsBook) {
    return jsonError(403, "You don't have permission to access this book.", "BOOK_ACCESS_DENIED");
  }

  const fullAccess = await canAccessFullBook(input.userId, input.slug);
  if (!fullAccess) {
    return jsonError(403, "You need to upgrade your plan to access the full book.", "FULL_ACCESS_REQUIRED");
  }

  return null;
}

async function handleBooksIndex(
  request: NextRequest,
  body: ArrayBuffer | null,
  userId: string | null,
  guestIdentityId: string | null,
) {
  const viewer = viewerFromIds(userId, guestIdentityId);
  let ownedSlugs = await getOwnedBookSlugs(viewer);
  if (!userId && ownedSlugs.size === 0) {
    return NextResponse.json({ books: [] });
  }

  const response = await forwardToBackend(request, "/api/books", body);
  const payload = (await response.json().catch(() => ({ books: [] }))) as {
    books?: Array<Record<string, unknown>>;
  };
  const upstreamBooks = payload.books || [];

  if (userId && upstreamBooks.length > 0 && ownedSlugs.size < upstreamBooks.length) {
    try {
      const claimedCount = await backfillLegacyBookOwnership({
        userId,
        candidateSlugs: upstreamBooks.map((book) => String(book.slug || "").trim()),
      });
      if (claimedCount > 0) {
        ownedSlugs = await getOwnedBookSlugs(viewer);
      }
    } catch (error) {
      console.error("[api/backend] legacy book backfill failed", { userId, error });
    }
  }

  if (ownedSlugs.size === 0) {
    return NextResponse.json({ books: [] }, { status: response.status });
  }

  return NextResponse.json(
    {
      books: upstreamBooks.filter((book) => ownedSlugs.has(String(book.slug || ""))),
    },
    { status: response.status },
  );
}

async function handleBookCreateOrUpdate(
  request: NextRequest,
  body: ArrayBuffer | null,
  userId: string | null,
  guestIdentityId: string | null,
) {
  const payload = await readJsonBody(body);
  const slug = typeof payload?.slug === "string" ? payload.slug.trim() : "";
  const existingBook = slug
    ? await prisma.bookRecord.findUnique({
        where: { slug },
        select: { slug: true },
      })
    : null;

  if (existingBook) {
    const denied = await requireFullAccess({
      slug: existingBook.slug,
      userId,
      guestIdentityId,
    });
    if (denied) {
      return denied;
    }

    const response = await forwardToBackend(request, "/api/books", body);
    const upstreamPayload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    if (!response.ok || !upstreamPayload) {
      return NextResponse.json(upstreamPayload || { ok: false, error: "Book could not be updated." }, { status: response.status });
    }

    await assignBookOwner({
      slug: String(upstreamPayload.slug || slug),
      userId,
      origin: "api.books.update",
      statusSnapshot: upstreamPayload.status,
    });

    return NextResponse.json(upstreamPayload, { status: response.status });
  }

  if (userId) {
    const allowance = await getBookStartAllowance(userId);
    if (!allowance.canStartBook) {
      return jsonError(
        403,
        usageReasonLabel(allowance.reason) || "You need to upgrade your plan to create a new book.",
        "BOOK_CREATION_LIMIT_REACHED",
      );
    }
  }

  let createdGuestIdentityId: string | null = null;
  let guestToken: string | null = null;

  if (!userId) {
    const guestIdentity = await getOrCreateGuestIdentity();
    createdGuestIdentityId = guestIdentity.guest.id;
    guestToken = guestIdentity.rawToken;

    const rateLimit = await consumeRateLimit({
      scope: "guest-generate",
      key: requestMeta(request).ipHash || createdGuestIdentityId,
      ...GUEST_GENERATE_RATE_LIMIT,
    });
    if (!rateLimit.allowed) {
      return withGuestCookie(
        jsonError(429, "Too many free book creation attempts. Please try again later."),
        guestToken,
      );
    }
  }

  const response = await forwardToBackend(request, "/api/books", body);
  const upstreamPayload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || !upstreamPayload) {
    const errorResponse = NextResponse.json(
      upstreamPayload || { ok: false, error: "Book could not be created." },
      { status: response.status },
    );
    return withGuestCookie(errorResponse, guestToken);
  }

  const createdSlug = String(upstreamPayload.slug || slug || "").trim();
  if (createdSlug) {
    await assignBookOwner({
      slug: createdSlug,
      userId,
      guestIdentityId: createdGuestIdentityId,
      origin: "api.books.create",
      statusSnapshot: upstreamPayload.status,
    });
    if (userId) {
      await recordBookUsage({
        userId,
        bookSlug: createdSlug,
      });
    }
  }

  return withGuestCookie(NextResponse.json(upstreamPayload, { status: response.status }), guestToken);
}

async function handleBookScopedRoute(
  request: NextRequest,
  upstreamPath: string,
  body: ArrayBuffer | null,
  userId: string | null,
  guestIdentityId: string | null,
) {
  const parts = upstreamPath.split("/").filter(Boolean);
  const slug = decodeURIComponent(parts[2] || "");
  const action = parts[3] || "";

  if (!slug) {
    return jsonError(404, "Book not found.");
  }

  if (action === "preview" || action === "preview-bootstrap") {
    const denied = await requirePreviewAccess({
      request,
      slug,
      userId,
      guestIdentityId,
    });
    if (denied) {
      return denied;
    }

    let response: Response;
    try {
      response = await forwardToBackend(request, upstreamPath, body);
    } catch (error) {
      if (action === "preview" && isBackendUnavailableLike(error)) {
        const cachedPayload = readCachedPreviewPayload(slug);
        if (cachedPayload) {
          logPreviewStatus(slug, cachedPayload, "stale-cache");
          return NextResponse.json(cachedPayload, {
            status: 200,
            headers: { "x-backend-preview": "stale-cache" },
          });
        }
      }
      throw error;
    }
    if (!response.ok) {
      if (action === "preview" && response.status === 503) {
        const cachedPayload = readCachedPreviewPayload(slug);
        if (cachedPayload) {
          logPreviewStatus(slug, cachedPayload, "stale-cache");
          return NextResponse.json(cachedPayload, {
            status: 200,
            headers: { "x-backend-preview": "stale-cache" },
          });
        }
      }
      return new NextResponse(response.body, {
        status: response.status,
        headers: cloneHeaders(response.headers),
      });
    }

    if (action === "preview") {
      const payload = (await response.json()) as Record<string, unknown>;
      const enriched = await enrichPreviewEntitlements(payload, userId, slug);
      const generation = (enriched.generation && typeof enriched.generation === "object")
        ? (enriched.generation as Record<string, unknown>)
        : {};
      const fullGenerationRaw = generation.full_generation;
      const fullGeneration = (fullGenerationRaw && typeof fullGenerationRaw === "object")
        ? (fullGenerationRaw as Record<string, unknown>)
        : {};
      const entitlementsRaw = enriched.entitlements;
      const entitlements = (entitlementsRaw && typeof entitlementsRaw === "object")
        ? (entitlementsRaw as Record<string, unknown>)
        : {};
      const canViewFullBook = Boolean(entitlements.can_view_full_book);
      const fullGenerationComplete = Boolean(fullGeneration.complete);
      const fullGenerationStage = String(fullGeneration.stage || "").trim().toLowerCase();
      const firstPreviewReady = Boolean(generation.first_chapter_ready || generation.preview_ready);
      const shouldBootstrapFullGeneration =
        canViewFullBook &&
        firstPreviewReady &&
        !fullGenerationComplete &&
        fullGenerationStage !== "queued" &&
        fullGenerationStage !== "running";
      if (shouldBootstrapFullGeneration && shouldTriggerFullBootstrap(slug)) {
        void forwardToBackend(
          request,
          `/api/books/${encodeURIComponent(slug)}/full-bootstrap`,
          null,
        ).catch(() => {
          // Continue rendering preview even if background full-generation bootstrap fails.
        });
      }
      writeCachedPreviewPayload(slug, enriched);
      logPreviewStatus(slug, enriched, "live");
      return NextResponse.json(enriched, { status: response.status });
    }

    return NextResponse.json(await response.json(), { status: response.status });
  }

  if (action === "asset" && request.method === "POST") {
    const payload = await readJsonBody(body);
    const kind = typeof payload?.kind === "string" ? payload.kind.trim() : "";
    const isCoverAsset = kind === "cover_image" || kind === "back_cover_image";
    if (isCoverAsset) {
      const denied = await requirePreviewAccess({
        request,
        slug,
        userId,
        guestIdentityId,
      });
      if (denied) {
        return denied;
      }
      return forwardResponse(request, upstreamPath, body);
    }
  }

  const denied = await requireFullAccess({
    slug,
    userId,
    guestIdentityId,
  });
  if (denied) {
    return denied;
  }

  return forwardResponse(request, upstreamPath, body);
}

async function handleWorkflowRoute(
  request: NextRequest,
  body: ArrayBuffer | null,
  userId: string | null,
  guestIdentityId: string | null,
) {
  const payload = await readJsonBody(body);
  const slug = typeof payload?.slug === "string" ? payload.slug.trim() : "";
  const action = typeof payload?.action === "string" ? payload.action.trim() : "";

  if (slug) {
    const record = await prisma.bookRecord.findUnique({
      where: { slug },
      select: { slug: true },
    });

    if (record) {
      if (action === "cover_variants_generate") {
        const previewDenied = await requirePreviewAccess({
          request,
          slug: record.slug,
          userId,
          guestIdentityId,
        });
        if (previewDenied) {
          return previewDenied;
        }
      } else {
        const denied = await requireFullAccess({
          slug: record.slug,
          userId,
          guestIdentityId,
        });
        if (denied) {
          return denied;
        }
      }
    }
  }

  return forwardResponse(request, "/api/workflows", body);
}

async function handleSettingsRoute(
  request: NextRequest,
  body: ArrayBuffer | null,
  userId: string | null,
) {
  if (request.method === "GET") {
    return forwardResponse(request, "/api/settings", body);
  }

  if (!userId) {
    return jsonError(401, "Session required to update settings.", "AUTH_REQUIRED");
  }

  return forwardResponse(request, "/api/settings", body);
}

async function handleWorkspaceRoute(
  request: NextRequest,
  upstreamPath: string,
  body: ArrayBuffer | null,
  userId: string | null,
  guestIdentityId: string | null,
) {
  const slug = extractSlugFromWorkspacePath(upstreamPath);
  if (!slug) {
    return jsonError(404, "File not found.");
  }

  const previewDenied = await requirePreviewAccess({
    request,
    slug,
    userId,
    guestIdentityId,
  });
  if (previewDenied) {
    return previewDenied;
  }

  const pathname = upstreamPath.toLowerCase();
  const previewSafeAsset =
    request.method === "GET" &&
    (pathname.includes("/assets/") || IMAGE_FILE_PATTERN.test(pathname));

  if (previewSafeAsset) {
    return forwardResponse(request, upstreamPath, body);
  }

  const fullDenied = await requireFullAccess({
    slug,
    userId,
    guestIdentityId,
  });
  if (fullDenied) {
    return fullDenied;
  }

  return forwardResponse(request, upstreamPath, body);
}

async function handleProxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const upstreamPath = `/${(path || []).join("/")}`;
    const body =
      request.method === "GET" || request.method === "HEAD" ? null : await request.arrayBuffer();
    const session = await auth();
    const guest = await getGuestIdentityFromCookies();
    const userId = session?.user?.id || null;
    const guestIdentityId = guest?.id || null;

    if (upstreamPath === "/api/health") {
      return await forwardResponse(request, upstreamPath, body);
    }

    if (upstreamPath === "/api/books" && request.method === "GET") {
      return await handleBooksIndex(request, body, userId, guestIdentityId);
    }

    if (upstreamPath === "/api/books" && request.method === "POST") {
      return await handleBookCreateOrUpdate(request, body, userId, guestIdentityId);
    }

    if (upstreamPath.startsWith("/api/books/")) {
      return await handleBookScopedRoute(request, upstreamPath, body, userId, guestIdentityId);
    }

    if (upstreamPath === "/api/workflows" && request.method === "POST") {
      return await handleWorkflowRoute(request, body, userId, guestIdentityId);
    }

    if (upstreamPath === "/api/settings") {
      return await handleSettingsRoute(request, body, userId);
    }

    if (upstreamPath === "/api/logs") {
      if (!userId) {
        return jsonError(401, "Session required for log records.", "AUTH_REQUIRED");
      }
      return await forwardResponse(request, upstreamPath, body);
    }

    if (upstreamPath.startsWith("/workspace/")) {
      return await handleWorkspaceRoute(request, upstreamPath, body, userId, guestIdentityId);
    }

    return jsonError(404, "Bilinmeyen backend route.");
  } catch (error) {
    if (isBackendUnavailableLike(error)) {
      return jsonError(
        503,
        "Service is temporarily unavailable. Please try again in a few seconds.",
        "BACKEND_UNAVAILABLE",
      );
    }
    console.error("[api/backend] unexpected error", error);
    return jsonError(500, "Unexpected server error.");
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxyRequest(request, context);
}
