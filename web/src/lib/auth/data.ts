import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import {
  PLAN_CURRENCY,
  PLAN_PRICES_CENTS,
  type BookPlanId,
  GUEST_COOKIE_MAX_AGE_SECONDS,
  GUEST_COOKIE_NAME,
  SUBSCRIPTION_PLANS,
} from "@/lib/auth/constants";
import { hashIp, hashToken, normalizeEmail, randomToken } from "@/lib/auth/crypto";
import { prisma } from "@/lib/prisma";

type Viewer = {
  userId: string | null;
  guestIdentityId: string | null;
};

export async function resolveGuestIdentityByToken(token?: string | null) {
  if (!token) return null;
  const guest = await prisma.guestIdentity.findUnique({
    where: { cookieTokenHash: hashToken(token) },
  });
  if (!guest) return null;
  await prisma.guestIdentity.update({
    where: { id: guest.id },
    data: { lastSeenAt: new Date() },
  });
  return guest;
}

export async function getGuestIdentityFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_COOKIE_NAME)?.value || "";
  return resolveGuestIdentityByToken(token);
}

export async function createGuestIdentity() {
  const rawToken = randomToken();
  const guest = await prisma.guestIdentity.create({
    data: {
      cookieTokenHash: hashToken(rawToken),
    },
  });
  return { guest, rawToken };
}

export async function getOrCreateGuestIdentity() {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(GUEST_COOKIE_NAME)?.value || "";
  const existing = await resolveGuestIdentityByToken(existingToken);
  if (existing) return { guest: existing, rawToken: existingToken, created: false };
  const created = await createGuestIdentity();
  return { ...created, created: true };
}

export function attachGuestCookie(response: NextResponse, rawToken: string) {
  response.cookies.set(GUEST_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: GUEST_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function assignBookOwner(input: {
  slug: string;
  userId?: string | null;
  guestIdentityId?: string | null;
  origin: string;
  statusSnapshot?: unknown;
}) {
  return prisma.bookRecord.upsert({
    where: { slug: input.slug },
    update: {
      ownerUserId: input.userId || null,
      guestIdentityId: input.userId ? null : input.guestIdentityId || null,
      origin: input.origin,
      statusSnapshot: input.statusSnapshot as never,
      claimedAt: input.userId ? new Date() : null,
    },
    create: {
      slug: input.slug,
      ownerUserId: input.userId || null,
      guestIdentityId: input.userId ? null : input.guestIdentityId || null,
      origin: input.origin,
      statusSnapshot: input.statusSnapshot as never,
      claimedAt: input.userId ? new Date() : null,
    },
  });
}

export async function claimGuestBooksForUser(input: { userId: string; guestIdentityId: string }) {
  const now = new Date();
  const [updatedBooks] = await prisma.$transaction([
    prisma.bookRecord.updateMany({
      where: {
        guestIdentityId: input.guestIdentityId,
      },
      data: {
        ownerUserId: input.userId,
        guestIdentityId: null,
        claimedAt: now,
      },
    }),
    prisma.guestIdentity.update({
      where: { id: input.guestIdentityId },
      data: {
        claimedByUserId: input.userId,
        claimedAt: now,
      },
    }),
  ]);
  return updatedBooks.count;
}

export async function getOwnedBookSlugs(viewer: Viewer) {
  if (!viewer.userId && !viewer.guestIdentityId) return new Set<string>();

  const ownershipFilters: Array<{ ownerUserId: string } | { guestIdentityId: string }> = [];
  if (viewer.userId) {
    ownershipFilters.push({ ownerUserId: viewer.userId });
  }
  if (viewer.guestIdentityId) {
    ownershipFilters.push({ guestIdentityId: viewer.guestIdentityId });
  }

  const books = await prisma.bookRecord.findMany({
    where: {
      OR: ownershipFilters,
    },
    select: { slug: true },
  });
  return new Set(books.map((item) => item.slug));
}

export async function canAccessBookPreview(viewer: Viewer, slug: string) {
  const book = await prisma.bookRecord.findUnique({
    where: { slug },
  });
  if (!book) return false;
  if (viewer.userId && book.ownerUserId === viewer.userId) return true;
  if (viewer.guestIdentityId && book.guestIdentityId === viewer.guestIdentityId) return true;
  return false;
}

export async function getEffectivePlanId(userId?: string | null): Promise<BookPlanId> {
  if (!userId) return "free";
  const entitlements = await prisma.entitlement.findMany({
    where: {
      userId,
      status: "active",
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });

  const ids = entitlements.map((item) => item.planId as BookPlanId);
  if (ids.includes("pro")) return "pro";
  if (ids.includes("creator")) return "creator";
  if (ids.includes("starter")) return "starter";
  if (ids.includes("premium")) return "premium";
  return "free";
}

export async function canAccessFullBook(userId: string | null, slug: string) {
  if (!userId) return false;
  const entitlements = await prisma.entitlement.findMany({
    where: {
      userId,
      status: "active",
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
    select: {
      planId: true,
      kind: true,
      bookSlug: true,
    },
  });

  const hasSubscription = entitlements.some((item) => SUBSCRIPTION_PLANS.has(item.planId));
  if (hasSubscription) return true;

  return entitlements.some(
    (item) => item.kind === "one_time_book_unlock" && item.planId === "premium" && item.bookSlug === slug,
  );
}

export async function getAuthStateForUser(userId: string | null, email?: string | null) {
  if (!userId || !email) {
    return {
      authenticated: false,
      planId: "free" as BookPlanId,
      emailVerified: false,
      role: "USER" as const,
      account: {
        name: "Book Creator",
        email: "demo@example.com",
        goal: "İlk kitabımı hızlıca üretmek istiyorum.",
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      goal: true,
      emailVerified: true,
      role: true,
    },
  });

  if (!user) {
    return {
      authenticated: false,
      planId: "free" as BookPlanId,
      emailVerified: false,
      role: "USER" as const,
      account: {
        name: "Book Creator",
        email: normalizeEmail(email),
        goal: "İlk kitabımı hızlıca üretmek istiyorum.",
      },
    };
  }

  return {
    authenticated: true,
    planId: await getEffectivePlanId(user.id),
    emailVerified: Boolean(user.emailVerified),
    role: user.role,
    account: {
      name: user.name || "Book Creator",
      email: user.email,
      goal: user.goal || "",
    },
  };
}

export async function enrichPreviewEntitlements<T extends { entitlements?: Record<string, boolean> }>(
  payload: T,
  userId: string | null,
  slug: string,
) {
  const allowed = await canAccessFullBook(userId, slug);
  return {
    ...payload,
    entitlements: {
      can_download_pdf: allowed,
      can_download_epub: allowed,
      can_view_full_book: allowed,
    },
  };
}

export function extractSlugFromWorkspacePath(pathname: string) {
  const normalized = pathname.replace(/^\/+/, "");
  const parts = normalized.split("/");
  const bookOutputsIndex = parts.findIndex((part) => part === "book_outputs");
  if (bookOutputsIndex >= 0 && parts[bookOutputsIndex + 1]) {
    return parts[bookOutputsIndex + 1];
  }
  return "";
}

export function requestIp(request: Request | NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    ""
  );
}

export function viewerFromIds(userId?: string | null, guestIdentityId?: string | null): Viewer {
  return {
    userId: userId || null,
    guestIdentityId: guestIdentityId || null,
  };
}

export async function recordCheckoutEntitlement(input: {
  userId: string;
  planId: BookPlanId;
  bookSlug?: string | null;
}) {
  if (input.planId === "free") {
    throw new Error("Ücretsiz plan satın alma ile değiştirilemez.");
  }

  if (SUBSCRIPTION_PLANS.has(input.planId)) {
    await prisma.$transaction(async (tx) => {
      await tx.entitlement.updateMany({
        where: {
          userId: input.userId,
          kind: "subscription",
          status: "active",
        },
        data: {
          status: "replaced",
          endsAt: new Date(),
        },
      });

      const entitlement = await tx.entitlement.create({
        data: {
          userId: input.userId,
          planId: input.planId,
          kind: "subscription",
          status: "active",
          provider: "manual",
        },
      });

      await tx.billingRecord.create({
        data: {
          userId: input.userId,
          entitlementId: entitlement.id,
          planId: input.planId,
          kind: "subscription",
          status: "paid",
          amount: PLAN_PRICES_CENTS[input.planId] || 0,
          currency: PLAN_CURRENCY,
          description: `${input.planId} planı aktif edildi`,
        },
      });
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    const entitlement = await tx.entitlement.create({
      data: {
        userId: input.userId,
        planId: "premium",
        kind: "one_time_book_unlock",
        status: "active",
        provider: "manual",
        bookSlug: input.bookSlug || null,
      },
    });

    await tx.billingRecord.create({
      data: {
        userId: input.userId,
        entitlementId: entitlement.id,
        planId: "premium",
        kind: "one_time_book_unlock",
        status: "paid",
        amount: PLAN_PRICES_CENTS.premium,
        currency: PLAN_CURRENCY,
        description: input.bookSlug ? `${input.bookSlug} için premium erişim` : "Premium erişim",
        bookSlug: input.bookSlug || null,
      },
    });
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email: normalizeEmail(email),
    },
  });
}

export function authStateLabel(input: { authenticated: boolean; emailVerified: boolean }) {
  if (!input.authenticated) return "guest";
  if (!input.emailVerified) return "authenticated_unverified";
  return "authenticated_verified";
}

export async function buildAnalyticsContext(input: {
  userId?: string | null;
  guestIdentityId?: string | null;
  pathname?: string | null;
  properties?: Record<string, unknown>;
  emailVerified?: boolean;
}) {
  return {
    anonymous_id: input.guestIdentityId || null,
    auth_state: authStateLabel({
      authenticated: Boolean(input.userId),
      emailVerified: Boolean(input.userId && input.emailVerified),
    }),
    ...input.properties,
  };
}

export function requestMeta(request: Request | NextRequest) {
  return {
    ipHash: hashIp(requestIp(request)),
    userAgent: request.headers.get("user-agent") || "",
  };
}
