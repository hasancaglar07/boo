import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  BOOK_CREATION_LIMITS,
  PLAN_CURRENCY,
  PLAN_PRICES_CENTS,
  PREVIEW_BONUS_WINDOW_DAYS,
  PREVIEW_CAMPAIGN_TOKEN_TTL_SECONDS,
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

export type BookStartReason =
  | "free_preview_used"
  | "premium_single_book_used"
  | "monthly_quota_reached"
  | null;

export type BookStartAllowance = {
  canStartBook: boolean;
  reason: BookStartReason;
  remainingBooks: number;
  resetAt: Date | null;
  limit: number | null;
  usedBooks: number;
};

export type PreviewCommercePayload = {
  primaryOffer: {
    planId: "premium";
    label: string;
    priceCents: number;
    originalPriceCents: number;
    badge: string;
    description: string;
  };
  secondaryOffer: {
    planId: "starter";
    label: string;
    priceCents: number;
    interval: string;
    quotaLabel: string;
    description: string;
  };
  bonusDeadlineAt: string | null;
  paywallState: "locked" | "unlocked";
  launchBonus: string[];
  trustPoints: string[];
  recoveryEmailEnabled: boolean;
};

const AUTO_VERIFIED_AUTH_PROVIDERS = ["google", "email"] as const;

async function hasAutoVerifiedProvider(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: {
        in: [...AUTO_VERIFIED_AUTH_PROVIDERS],
      },
    },
    select: {
      id: true,
    },
  });
  return Boolean(account);
}

async function resolveEffectiveEmailVerified(userId: string, currentValue: Date | null) {
  if (currentValue) {
    return true;
  }

  const trustedProvider = await hasAutoVerifiedProvider(userId);
  if (!trustedProvider) {
    return false;
  }

  const verifiedAt = new Date();
  await prisma.user.updateMany({
    where: {
      id: userId,
      emailVerified: null,
    },
    data: {
      emailVerified: verifiedAt,
    },
  });
  return true;
}

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

const PLAN_ALIASES: Record<string, BookPlanId> = {
  studio: "pro",
};

const NORMALIZED_PLAN_IDS: BookPlanId[] = ["free", "starter", "creator", "pro", "premium"];

function normalizePlanId(value: string | null | undefined): BookPlanId | null {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return null;
  if (PLAN_ALIASES[raw]) return PLAN_ALIASES[raw];
  if (NORMALIZED_PLAN_IDS.includes(raw as BookPlanId)) return raw as BookPlanId;
  return null;
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

  const ids = entitlements
    .map((item) => normalizePlanId(item.planId))
    .filter((item): item is BookPlanId => Boolean(item));
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

  const hasSubscription = entitlements.some((item) => {
    const planId = normalizePlanId(item.planId);
    return Boolean(planId && SUBSCRIPTION_PLANS.has(planId));
  });
  if (hasSubscription) return true;

  return entitlements.some(
    (item) =>
      item.kind === "one_time_book_unlock" &&
      normalizePlanId(item.planId) === "premium" &&
      item.bookSlug === slug,
  );
}

function currentUtcMonthWindow(now = new Date()) {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const nextResetAt = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );
  return { monthStart, nextResetAt };
}

export async function recordBookUsage(input: {
  userId: string;
  bookSlug: string;
  kind?: "preview_created" | "hard_gate_viewed" | "hard_gate_converted";
  planId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const kind = input.kind || "preview_created";
  await prisma.bookUsageLedger.upsert({
    where: {
      userId_bookSlug_kind: {
        userId: input.userId,
        bookSlug: input.bookSlug,
        kind,
      },
    },
    create: {
      userId: input.userId,
      bookSlug: input.bookSlug,
      kind,
      planId: input.planId || null,
      metadata: (input.metadata || {}) as never,
    },
    update: {
      planId: input.planId || undefined,
      metadata: input.metadata ? (input.metadata as never) : undefined,
    },
  });
}

export async function getBookStartAllowance(userId: string | null): Promise<BookStartAllowance> {
  if (!userId) {
    return {
      canStartBook: true,
      reason: null,
      remainingBooks: 1,
      resetAt: null,
      limit: 1,
      usedBooks: 0,
    };
  }

  const planId = await getEffectivePlanId(userId);
  const { monthStart, nextResetAt } = currentUtcMonthWindow();

  const [totalLedgerCount, monthLedgerCount, totalBookCount, monthBookCount] = await Promise.all([
    prisma.bookUsageLedger.count({
      where: {
        userId,
        kind: "preview_created",
      },
    }),
    prisma.bookUsageLedger.count({
      where: {
        userId,
        kind: "preview_created",
        createdAt: { gte: monthStart },
      },
    }),
    prisma.bookRecord.count({
      where: {
        ownerUserId: userId,
      },
    }),
    prisma.bookRecord.count({
      where: {
        ownerUserId: userId,
        createdAt: { gte: monthStart },
      },
    }),
  ]);

  const limit = BOOK_CREATION_LIMITS[planId] ?? null;
  const usedBooks = SUBSCRIPTION_PLANS.has(planId)
    ? Math.max(monthLedgerCount, monthBookCount)
    : Math.max(totalLedgerCount, totalBookCount);

  const remainingBooks = limit === null ? 9999 : Math.max(0, limit - usedBooks);
  const canStartBook = limit === null ? true : remainingBooks > 0;

  let reason: BookStartReason = null;
  if (!canStartBook) {
    if (planId === "premium") {
      reason = "premium_single_book_used";
    } else if (SUBSCRIPTION_PLANS.has(planId)) {
      reason = "monthly_quota_reached";
    } else {
      reason = "free_preview_used";
    }
  }

  return {
    canStartBook,
    reason,
    remainingBooks,
    resetAt: SUBSCRIPTION_PLANS.has(planId) ? nextResetAt : null,
    limit,
    usedBooks,
  };
}

export function usageReasonLabel(reason: BookStartReason) {
  if (reason === "premium_single_book_used") {
    return "Tek kitap erişimini mevcut kitabında kullandın. Yeni kitap için yeni bir plan seç.";
  }
  if (reason === "monthly_quota_reached") {
    return "Aylık kitap kotana ulaştın. Yeni kitap başlatmak için planını yükselt ya da dönem yenilenmesini bekle.";
  }
  if (reason === "free_preview_used") {
    return "Free plan ilk preview ile sınırlı. İkinci kitabı başlatmak için planını yükselt.";
  }
  return "";
}

export async function buildPreviewCommerce(userId: string | null, slug: string): Promise<PreviewCommercePayload> {
  const [fullAccess, bookRecord, user] = await Promise.all([
    canAccessFullBook(userId, slug),
    prisma.bookRecord.findUnique({
      where: { slug },
      select: {
        createdAt: true,
      },
    }),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            previewRecoveryOptOut: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const bonusDeadlineAt = bookRecord
    ? new Date(bookRecord.createdAt.getTime() + PREVIEW_BONUS_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    : null;

  return {
    primaryOffer: {
      planId: "premium",
      label: "Bu kitabı aç",
      priceCents: PLAN_PRICES_CENTS.premium,
      originalPriceCents: 2900,
      badge: "Tek kitap · anında erişim",
      description: "Bu kitap için tüm bölümleri, PDF/EPUB export'u ve workspace düzenlemelerini aç.",
    },
    secondaryOffer: {
      planId: "starter",
      label: "Starter",
      priceCents: PLAN_PRICES_CENTS.starter,
      interval: "monthly",
      quotaLabel: "Ayda 10 kitap",
      description: "Düzenli üretim ritmi için aylık kota, export ve kapak akışını aç.",
    },
    bonusDeadlineAt: bonusDeadlineAt?.toISOString() || null,
    paywallState: fullAccess ? "unlocked" : "locked",
    launchBonus: [
      "3 kapak konsepti seçimi",
      "1 ekstra cover reroll hakkı",
      "PDF + EPUB export paketi",
    ],
    trustPoints: [
      "30 gün iade garantisi",
      "KDP uyumlu export",
      "Abonelik zorunlu değil",
    ],
    recoveryEmailEnabled: Boolean(user?.email && !user?.previewRecoveryOptOut),
  };
}

export async function createPreviewCampaignToken(input: {
  userId: string;
  bookSlug: string;
  lifecycleType: "preview_ready" | "day10_recovery" | "monthly_nudge";
  metadata?: Record<string, unknown>;
}) {
  const rawToken = randomToken();
  await prisma.previewCampaignToken.create({
    data: {
      userId: input.userId,
      bookSlug: input.bookSlug,
      lifecycleType: input.lifecycleType,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + PREVIEW_CAMPAIGN_TOKEN_TTL_SECONDS * 1000),
      metadata: (input.metadata || {}) as never,
    },
  });
  return rawToken;
}

export async function markPreviewLifecycleSent(input: {
  userId: string;
  bookSlug: string;
  lifecycleType: "preview_ready" | "day10_recovery" | "monthly_nudge";
  metadata?: Record<string, unknown>;
}) {
  return prisma.previewLifecycleLog.upsert({
    where: {
      userId_bookSlug_lifecycleType: {
        userId: input.userId,
        bookSlug: input.bookSlug,
        lifecycleType: input.lifecycleType,
      },
    },
    create: {
      userId: input.userId,
      bookSlug: input.bookSlug,
      lifecycleType: input.lifecycleType,
      metadata: (input.metadata || {}) as never,
    },
    update: {
      sentAt: new Date(),
      metadata: input.metadata ? (input.metadata as never) : undefined,
    },
  });
}

export async function touchPreviewLifecycleClick(input: {
  userId: string;
  bookSlug: string;
  lifecycleType: "preview_ready" | "day10_recovery" | "monthly_nudge";
}) {
  await prisma.previewLifecycleLog.updateMany({
    where: {
      userId: input.userId,
      bookSlug: input.bookSlug,
      lifecycleType: input.lifecycleType,
    },
    data: {
      lastClickedAt: new Date(),
    },
  });
}

export async function resolvePreviewCampaignToken(rawToken: string) {
  if (!rawToken) return null;
  const tokenHash = hashToken(rawToken);
  const record = await prisma.previewCampaignToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          goal: true,
          role: true,
          emailVerified: true,
        },
      },
    },
  });

  if (!record || record.expiresAt <= new Date()) {
    return null;
  }

  await prisma.previewCampaignToken.update({
    where: { id: record.id },
    data: {
      clickCount: { increment: 1 },
      lastUsedAt: new Date(),
      consumedAt: record.consumedAt || new Date(),
    },
  });

  await touchPreviewLifecycleClick({
    userId: record.userId,
    bookSlug: record.bookSlug,
    lifecycleType: record.lifecycleType,
  });

  return record;
}

export async function listPreviewLifecycleCandidates() {
  const [previewReadyLogs, recoveryLogs, nudgeLogs, records] = await Promise.all([
    prisma.previewLifecycleLog.findMany({
      where: { lifecycleType: "preview_ready" },
      select: { userId: true, bookSlug: true },
    }),
    prisma.previewLifecycleLog.findMany({
      where: { lifecycleType: "day10_recovery" },
      select: { userId: true, bookSlug: true },
    }),
    prisma.previewLifecycleLog.findMany({
      where: { lifecycleType: "monthly_nudge" },
      select: { userId: true, bookSlug: true, sentAt: true },
    }),
    prisma.bookRecord.findMany({
      where: {
        ownerUserId: { not: null },
      },
      select: {
        slug: true,
        ownerUserId: true,
        createdAt: true,
        ownerUser: {
          select: {
            email: true,
            name: true,
            previewRecoveryOptOut: true,
          },
        },
      },
    }),
  ]);

  const readySent = new Set(previewReadyLogs.map((item) => `${item.userId}:${item.bookSlug}`));
  const recoverySent = new Set(recoveryLogs.map((item) => `${item.userId}:${item.bookSlug}`));
  const nudgeSent = new Map(
    nudgeLogs.map((item) => [`${item.userId}:${item.bookSlug}`, item.sentAt] as const),
  );

  return Promise.all(
    records
      .filter((record) => record.ownerUserId && record.ownerUser?.email)
      .map(async (record) => {
        const userId = record.ownerUserId as string;
        const paid = await canAccessFullBook(userId, record.slug);
        return {
          slug: record.slug,
          userId,
          email: record.ownerUser?.email || "",
          name: record.ownerUser?.name || "",
          createdAt: record.createdAt,
          previewReadySent: readySent.has(`${userId}:${record.slug}`),
          recoverySent: recoverySent.has(`${userId}:${record.slug}`),
          lastMonthlyNudgeAt: nudgeSent.get(`${userId}:${record.slug}`) || null,
          optedOut: Boolean(record.ownerUser?.previewRecoveryOptOut),
          paid,
        };
      }),
  );
}

export async function getAuthStateForUser(userId: string | null, email?: string | null) {
  if (!userId || !email) {
    return {
      authenticated: false,
      planId: "free" as BookPlanId,
      emailVerified: false,
      role: "USER" as const,
      usage: {
        canStartBook: true,
        reason: null,
        remainingBooks: 1,
        resetAt: null,
        limit: 1,
        usedBooks: 0,
      },
      account: {
        name: "Book Creator",
        email: "demo@example.com",
        goal: "İlk kitabımı hızlıca üretmek istiyorum.",
        publisherImprint: "",
        publisherLogoUrl: "",
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
      publisherImprint: true,
      publisherLogoUrl: true,
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
      usage: {
        canStartBook: true,
        reason: null,
        remainingBooks: 1,
        resetAt: null,
        limit: 1,
        usedBooks: 0,
      },
      account: {
        name: "Book Creator",
        email: normalizeEmail(email),
        goal: "İlk kitabımı hızlıca üretmek istiyorum.",
        publisherImprint: "",
        publisherLogoUrl: "",
      },
    };
  }

  const [planId, usage, effectiveEmailVerified] = await Promise.all([
    getEffectivePlanId(user.id),
    getBookStartAllowance(user.id),
    resolveEffectiveEmailVerified(user.id, user.emailVerified),
  ]);

  return {
    authenticated: true,
    planId,
    emailVerified: effectiveEmailVerified,
    role: user.role,
    usage,
    account: {
      name: user.name || "Book Creator",
      email: user.email,
      goal: user.goal || "",
      publisherImprint: user.publisherImprint || "",
      publisherLogoUrl: user.publisherLogoUrl || "",
    },
  };
}

export async function enrichPreviewEntitlements<
  T extends {
    entitlements?: Record<string, boolean>;
    commerce?: PreviewCommercePayload;
  },
>(
  payload: T,
  userId: string | null,
  slug: string,
) {
  const allowed = await canAccessFullBook(userId, slug);
  const commerce = await buildPreviewCommerce(userId, slug);
  return {
    ...payload,
    entitlements: {
      can_download_pdf: allowed,
      can_download_epub: allowed,
      can_view_full_book: allowed,
    },
    commerce,
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
}, dbClient: PrismaClient | Prisma.TransactionClient = prisma) {
  async function runWithDb(db: Prisma.TransactionClient) {
    if (input.planId === "free") {
      throw new Error("Ücretsiz plan satın alma ile değiştirilemez.");
    }

    if (SUBSCRIPTION_PLANS.has(input.planId)) {
      await db.entitlement.updateMany({
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

      const entitlement = await db.entitlement.create({
        data: {
          userId: input.userId,
          planId: input.planId,
          kind: "subscription",
          status: "active",
          provider: "manual",
        },
      });

      const billingRecord = await db.billingRecord.create({
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

      return {
        entitlementId: entitlement.id,
        billingRecordId: billingRecord.id,
      };
    }

    const entitlement = await db.entitlement.create({
      data: {
        userId: input.userId,
        planId: "premium",
        kind: "one_time_book_unlock",
        status: "active",
        provider: "manual",
        bookSlug: input.bookSlug || null,
      },
    });

    const billingRecord = await db.billingRecord.create({
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

    return {
      entitlementId: entitlement.id,
      billingRecordId: billingRecord.id,
    };
  }

  if (input.planId === "free") {
    throw new Error("Ücretsiz plan satın alma ile değiştirilemez.");
  }

  if ("$transaction" in dbClient) {
    return dbClient.$transaction(async (tx) => runWithDb(tx));
  }

  return runWithDb(dbClient);
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
