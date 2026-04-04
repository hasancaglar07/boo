import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { GUEST_GENERATE_RATE_LIMIT } from "@/lib/auth/constants";
import { audit } from "@/lib/auth/audit";
import {
  assignBookOwner,
  attachGuestCookie,
  canAccessBookPreview,
  canAccessFullBook,
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
const BACKEND_FETCH_TIMEOUT_MS = 30_000;

const IMAGE_FILE_PATTERN = /\.(png|jpe?g|webp|gif|svg|ico)$/i;

export const runtime = "nodejs";

class BackendUnavailableError extends Error {
  constructor() {
    super("BACKEND_UNAVAILABLE");
    this.name = "BackendUnavailableError";
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BACKEND_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
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
  } catch {
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
    return jsonError(401, "Bu önizleme için önce kitabını oluşturman veya hesabına bağlaman gerekiyor.", "AUTH_REQUIRED");
  }

  return jsonError(403, "Bu kitap önizlemesine erişim iznin yok.", "BOOK_ACCESS_DENIED");
}

async function requireFullAccess(input: {
  slug: string;
  userId: string | null;
}) {
  if (!input.userId) {
    return jsonError(401, "Bu işlem için oturum gerekli.", "AUTH_REQUIRED");
  }

  const ownsBook = await canAccessBookPreview(viewerFromIds(input.userId, null), input.slug);
  if (!ownsBook) {
    return jsonError(403, "Bu kitaba erişim iznin yok.", "BOOK_ACCESS_DENIED");
  }

  const fullAccess = await canAccessFullBook(input.userId, input.slug);
  if (!fullAccess) {
    return jsonError(403, "Tam kitaba erişmek için planını yükseltmen gerekiyor.", "FULL_ACCESS_REQUIRED");
  }

  return null;
}

async function handleBooksIndex(
  request: NextRequest,
  body: ArrayBuffer | null,
  userId: string | null,
  guestIdentityId: string | null,
) {
  const ownedSlugs = await getOwnedBookSlugs(viewerFromIds(userId, guestIdentityId));
  if (ownedSlugs.size === 0) {
    return NextResponse.json({ books: [] });
  }

  const response = await forwardToBackend(request, "/api/books", body);
  const payload = (await response.json().catch(() => ({ books: [] }))) as {
    books?: Array<Record<string, unknown>>;
  };

  return NextResponse.json(
    {
      books: (payload.books || []).filter((book) => ownedSlugs.has(String(book.slug || ""))),
    },
    { status: response.status },
  );
}

async function handleBookCreateOrUpdate(
  request: NextRequest,
  body: ArrayBuffer | null,
  userId: string | null,
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
    });
    if (denied) {
      return denied;
    }

    const response = await forwardToBackend(request, "/api/books", body);
    const upstreamPayload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    if (!response.ok || !upstreamPayload) {
      return NextResponse.json(upstreamPayload || { ok: false, error: "Kitap güncellenemedi." }, { status: response.status });
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
        usageReasonLabel(allowance.reason) || "Yeni kitap oluşturmak için planını yükseltmen gerekiyor.",
        "BOOK_CREATION_LIMIT_REACHED",
      );
    }
  }

  let guestIdentityId: string | null = null;
  let guestToken: string | null = null;

  if (!userId) {
    const guestIdentity = await getOrCreateGuestIdentity();
    guestIdentityId = guestIdentity.guest.id;
    guestToken = guestIdentity.rawToken;

    const rateLimit = await consumeRateLimit({
      scope: "guest-generate",
      key: requestMeta(request).ipHash || guestIdentityId,
      ...GUEST_GENERATE_RATE_LIMIT,
    });
    if (!rateLimit.allowed) {
      return withGuestCookie(
        jsonError(429, "Çok fazla ücretsiz kitap oluşturma denemesi yapıldı. Lütfen daha sonra tekrar dene."),
        guestToken,
      );
    }
  }

  const response = await forwardToBackend(request, "/api/books", body);
  const upstreamPayload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || !upstreamPayload) {
    const errorResponse = NextResponse.json(
      upstreamPayload || { ok: false, error: "Kitap oluşturulamadı." },
      { status: response.status },
    );
    return withGuestCookie(errorResponse, guestToken);
  }

  const createdSlug = String(upstreamPayload.slug || slug || "").trim();
  if (createdSlug) {
    await assignBookOwner({
      slug: createdSlug,
      userId,
      guestIdentityId,
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
    return jsonError(404, "Kitap bulunamadı.");
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

    const response = await forwardToBackend(request, upstreamPath, body);
    if (!response.ok) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: cloneHeaders(response.headers),
      });
    }

    if (action === "preview") {
      const payload = (await response.json()) as Record<string, unknown>;
      const enriched = await enrichPreviewEntitlements(payload, userId, slug);
      return NextResponse.json(enriched, { status: response.status });
    }

    return NextResponse.json(await response.json(), { status: response.status });
  }

  const denied = await requireFullAccess({
    slug,
    userId,
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
    return jsonError(401, "Ayarları güncellemek için oturum gerekli.", "AUTH_REQUIRED");
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
    return jsonError(404, "Dosya bulunamadı.");
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
      return forwardResponse(request, upstreamPath, body);
    }

    if (upstreamPath === "/api/books" && request.method === "GET") {
      return handleBooksIndex(request, body, userId, guestIdentityId);
    }

    if (upstreamPath === "/api/books" && request.method === "POST") {
      return handleBookCreateOrUpdate(request, body, userId);
    }

    if (upstreamPath.startsWith("/api/books/")) {
      return handleBookScopedRoute(request, upstreamPath, body, userId, guestIdentityId);
    }

    if (upstreamPath === "/api/workflows" && request.method === "POST") {
      return handleWorkflowRoute(request, body, userId, guestIdentityId);
    }

    if (upstreamPath === "/api/settings") {
      return handleSettingsRoute(request, body, userId);
    }

    if (upstreamPath === "/api/logs") {
      if (!userId) {
        return jsonError(401, "Log kayıtları için oturum gerekli.", "AUTH_REQUIRED");
      }
      return forwardResponse(request, upstreamPath, body);
    }

    if (upstreamPath.startsWith("/workspace/")) {
      return handleWorkspaceRoute(request, upstreamPath, body, userId, guestIdentityId);
    }

    return jsonError(404, "Bilinmeyen backend route.");
  } catch (error) {
    if (error instanceof BackendUnavailableError) {
      return jsonError(
        503,
        "Servis geçici olarak erişilemiyor. Lütfen birkaç saniye sonra tekrar dene.",
        "BACKEND_UNAVAILABLE",
      );
    }
    console.error("[api/backend] unexpected error", error);
    return jsonError(500, "Beklenmeyen sunucu hatası.");
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
