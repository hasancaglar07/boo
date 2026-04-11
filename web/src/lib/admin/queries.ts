import type {
  BillingRecord,
  BillingRecordStatus,
  Entitlement,
  FeatureFlag,
  ModerationStatus,
  Prisma,
  UserRole,
} from "@prisma/client";

import { BACKEND_PUBLIC_ORIGIN, type Book } from "@/lib/dashboard-api";
import {
  PLAN_CURRENCY,
  PLAN_LABELS,
  PLAN_PRICES_CENTS,
} from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";

const DAY_MS = 1000 * 60 * 60 * 24;
const FUNNEL_STAGES = [
  "start_page_viewed",
  "wizard_started",
  "generate_started",
  "signup_completed",
  "preview_viewed",
  "checkout_started",
  "checkout_completed",
] as const;
const CACHE_TTL = {
  backendBooksMs: 5_000,
  adminOverviewMs: 10_000,
  revenueMetricsMs: 20_000,
  userMetricsMs: 20_000,
  bookMetricsMs: 20_000,
  funnelAnalyticsMs: 20_000,
  authAnalyticsMs: 20_000,
  cohortMs: 60_000,
  churnMs: 60_000,
  jobsMs: 5_000,
} as const;

type QueryCacheEntry<T> = {
  expiresAt: number;
  value?: T;
  promise?: Promise<T>;
};

declare global {
  var __adminQueryCache:
    | Map<string, QueryCacheEntry<unknown>>
    | undefined;
}

const queryCache =
  globalThis.__adminQueryCache ||
  new Map<string, QueryCacheEntry<unknown>>();

if (!globalThis.__adminQueryCache) {
  globalThis.__adminQueryCache = queryCache;
}

async function withTtlCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const cached = queryCache.get(key) as QueryCacheEntry<T> | undefined;
  if (cached?.value !== undefined && cached.expiresAt > now) {
    return cached.value;
  }
  if (cached?.promise) {
    return cached.promise;
  }

  const promise = loader()
    .then((value) => {
      queryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      } as QueryCacheEntry<unknown>);
      return value;
    })
    .catch((error) => {
      const fallback = queryCache.get(key) as QueryCacheEntry<T> | undefined;
      if (fallback?.value !== undefined) {
        return fallback.value;
      }
      throw error;
    })
    .finally(() => {
      const current = queryCache.get(key) as QueryCacheEntry<T> | undefined;
      if (current?.promise) {
        queryCache.set(key, {
          value: current.value,
          expiresAt: current.expiresAt || 0,
        } as QueryCacheEntry<unknown>);
      }
    });

  queryCache.set(key, {
    value: cached?.value,
    expiresAt: cached?.expiresAt || 0,
    promise,
  } as QueryCacheEntry<unknown>);

  return promise;
}

type DateRangeInput = {
  from?: string;
  to?: string;
};

function normalizeText(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function matchesQuery(query: string, ...values: Array<unknown>) {
  if (!query) return true;
  const normalized = normalizeText(query);
  return values.some((value) => normalizeText(value).includes(normalized));
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildCreatedAtRangeFilter(range?: DateRangeInput) {
  const createdAt: { gte?: Date; lte?: Date } = {};
  const from = parseDate(range?.from || null);
  const to = parseDate(range?.to || null);
  if (from) createdAt.gte = from;
  if (to) createdAt.lte = new Date(to.getTime() + DAY_MS);
  return Object.keys(createdAt).length > 0 ? createdAt : undefined;
}

function withinRange(value: Date | string | null | undefined, range?: DateRangeInput) {
  if (!value) return true;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  const from = parseDate(range?.from || null);
  const to = parseDate(range?.to || null);
  if (from && date < from) return false;
  if (to && date > new Date(to.getTime() + DAY_MS)) return false;
  return true;
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    totalItems,
    totalPages,
  };
}

function dateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function monthKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function getActiveEntitlements(entitlements: Entitlement[]) {
  const now = Date.now();
  return entitlements.filter((item) => {
    if (item.status !== "active" && item.status !== "trialing") return false;
    if (item.endsAt && item.endsAt.getTime() <= now) return false;
    return true;
  });
}

function planRank(planId: string) {
  const order: Record<string, number> = {
    free: 0,
    starter: 1,
    creator: 2,
    pro: 3,
    premium: 4,
  };
  return order[planId] ?? -1;
}

function derivePlan(entitlements: Entitlement[]) {
  const active = getActiveEntitlements(entitlements)
    .map((item) => item.planId)
    .sort((left, right) => planRank(right) - planRank(left));
  return active[0] || "free";
}

function deriveUserStatus(entitlements: Entitlement[]) {
  if (entitlements.some((item) => item.status === "past_due")) return "PAST_DUE";
  if (getActiveEntitlements(entitlements).length > 0) return "ACTIVE";
  if (entitlements.length > 0) return "CANCELED";
  return "ACTIVE";
}

function billingTotal(records: BillingRecord[], status: BillingRecordStatus[] = ["paid"]) {
  return sum(
    records
      .filter((record) => status.includes(record.status))
      .map((record) => record.amount),
  );
}

function toLineSeries(days: number, values: Map<string, number>) {
  const entries: Array<{ label: string; value: number }> = [];
  const today = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    day.setUTCDate(day.getUTCDate() - offset);
    const key = dateKey(day);
    entries.push({
      label: key.slice(5),
      value: values.get(key) || 0,
    });
  }

  return entries;
}

async function fetchBackendJson<T>(path: string) {
  try {
    const response = await fetch(new URL(path, BACKEND_PUBLIC_ORIGIN), {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchBackendBooks() {
  return withTtlCache("backend-books", CACHE_TTL.backendBooksMs, async () => {
    const payload = await fetchBackendJson<{ books?: Book[] }>("/api/books");
    return payload?.books || [];
  });
}

export async function fetchBackendBook(slug: string) {
  const books = await fetchBackendBooks();
  const fromCache = books.find((item) => item.slug === slug);
  if (fromCache) return fromCache;
  return fetchBackendJson<Book>(`/api/books/${encodeURIComponent(slug)}`);
}

export function adminBookAssetUrl(slug: string, relativePath?: string | null) {
  if (!relativePath) return "";
  if (/^(https?:\/\/|data:)/.test(relativePath)) return relativePath;
  const cleaned = relativePath.replace(/^\/+/, "");
  const rooted = cleaned.startsWith("book_outputs/") ? cleaned : `book_outputs/${slug}/${cleaned}`;
  const encoded = rooted
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${BACKEND_PUBLIC_ORIGIN}/workspace/${encoded}`;
}

export async function getAdminOverviewData() {
  return withTtlCache("admin-overview", CACHE_TTL.adminOverviewMs, async () => {
    const [users, entitlements, paidBillingRecords, recentAuditLogs, analyticsEvents, totalBooks, funnels] =
      await Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            createdAt: true,
            entitlements: {
              select: {
                planId: true,
                status: true,
                endsAt: true,
              },
            },
          },
        }),
        prisma.entitlement.findMany({
          select: {
            userId: true,
            planId: true,
            kind: true,
            status: true,
            endsAt: true,
          },
        }),
        prisma.billingRecord.findMany({
          where: { status: "paid" },
          select: { createdAt: true, amount: true },
        }),
        prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            metadata: true,
            createdAt: true,
            actorUser: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        }),
        prisma.analyticsEvent.findMany({
          where: {
            eventName: {
              in: [...FUNNEL_STAGES],
            },
            createdAt: {
              gte: new Date(Date.now() - 90 * DAY_MS),
            },
          },
          orderBy: { createdAt: "asc" },
          select: {
            eventName: true,
            createdAt: true,
          },
        }),
        prisma.bookRecord.count(),
        getFunnelAnalytics({ from: "", to: "" }),
      ]);

    const activeSubscriptions = entitlements.filter(
      (item) =>
        item.kind === "subscription" &&
        (item.status === "active" || item.status === "trialing") &&
        (!item.endsAt || item.endsAt > new Date()),
    );

    const paidUserIds = new Set(
      entitlements
        .filter((item) => item.status === "active" || item.status === "trialing")
        .map((item) => item.userId),
    );
    const mrr = sum(activeSubscriptions.map((item) => PLAN_PRICES_CENTS[item.planId] || 0));
    const arr = mrr * 12;

    const revenueByDay = new Map<string, number>();
    for (const record of paidBillingRecords) {
      const key = dateKey(record.createdAt);
      revenueByDay.set(key, (revenueByDay.get(key) || 0) + record.amount);
    }

    const userGrowthByDay = new Map<string, number>();
    for (const user of users) {
      const key = dateKey(user.createdAt);
      userGrowthByDay.set(key, (userGrowthByDay.get(key) || 0) + 1);
    }

    const signupByWeek = new Map<string, number>();
    const paidByWeek = new Map<string, number>();
    for (const event of analyticsEvents) {
      const weekKey = monthKey(event.createdAt) + `-w${Math.ceil(event.createdAt.getUTCDate() / 7)}`;
      if (event.eventName === "signup_completed") {
        signupByWeek.set(weekKey, (signupByWeek.get(weekKey) || 0) + 1);
      }
      if (event.eventName === "checkout_completed") {
        paidByWeek.set(weekKey, (paidByWeek.get(weekKey) || 0) + 1);
      }
    }

    const recentWeeks = Array.from(new Set([...signupByWeek.keys(), ...paidByWeek.keys()]))
      .sort()
      .slice(-8);

    const landingStage = funnels.stages.find((stage) => stage.name === "start_page_viewed");
    const paidStage = funnels.stages.find((stage) => stage.name === "checkout_completed");

    const planDistributionMap = new Map<string, number>();
    for (const user of users) {
      const plan = derivePlan(user.entitlements as Entitlement[]);
      planDistributionMap.set(plan, (planDistributionMap.get(plan) || 0) + 1);
    }

    return {
      cards: {
        totalUsers: users.length,
        freeUsers: Math.max(0, users.length - paidUserIds.size),
        paidUsers: paidUserIds.size,
        activeSubscriptions: activeSubscriptions.length,
        totalBooks,
        mrr,
        arr,
        funnelConversionRate:
          landingStage && paidStage && landingStage.count > 0
            ? Number(((paidStage.count / landingStage.count) * 100).toFixed(1))
            : 0,
      },
      revenueTrend: toLineSeries(30, revenueByDay),
      userGrowth: toLineSeries(30, userGrowthByDay),
      conversionSeries: recentWeeks.map((label) => ({
        label,
        signups: signupByWeek.get(label) || 0,
        paid: paidByWeek.get(label) || 0,
      })),
      planDistribution: Array.from(planDistributionMap.entries()).map(([label, value]) => ({
        label: PLAN_LABELS[label] || label,
        value,
      })),
      recentActivity: recentAuditLogs.map((item) => ({
        id: item.id,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        actor: item.actorUser?.email || item.actorUser?.name || "Sistem",
        createdAt: item.createdAt.toISOString(),
        metadata: (item.metadata || null) as Record<string, unknown> | null,
      })),
    };
  });
}

export async function getRevenueMetrics() {
  return withTtlCache("metrics-revenue", CACHE_TTL.revenueMetricsMs, async () => {
    const [records, entitlements] = await Promise.all([
      prisma.billingRecord.findMany({
        where: { status: "paid" },
        orderBy: { createdAt: "asc" },
        select: {
          createdAt: true,
          amount: true,
          planId: true,
        },
      }),
      prisma.entitlement.findMany({
        select: {
          planId: true,
          kind: true,
          status: true,
          endsAt: true,
        },
      }),
    ]);

    const monthly: Map<string, number> = new Map();
    const byPlan = new Map<string, number>();

    for (const record of records) {
      const key = monthKey(record.createdAt);
      monthly.set(key, (monthly.get(key) || 0) + record.amount);
      byPlan.set(record.planId, (byPlan.get(record.planId) || 0) + record.amount);
    }

    const activeSubscriptions = entitlements.filter(
      (item) =>
        item.kind === "subscription" &&
        (item.status === "active" || item.status === "trialing") &&
        (!item.endsAt || item.endsAt > new Date()),
    );
    const mrr = sum(activeSubscriptions.map((item) => PLAN_PRICES_CENTS[item.planId] || 0));

    return {
      mrr,
      arr: mrr * 12,
      totalRevenue: sum(records.map((record) => record.amount)),
      revenueByPlan: Array.from(byPlan.entries()).map(([planId, amount]) => ({
        planId,
        label: PLAN_LABELS[planId] || planId,
        amount,
      })),
      revenueTrend: Array.from(monthly.entries()).map(([label, amount]) => ({ label, amount })),
    };
  });
}

export async function getUserMetrics() {
  return withTtlCache("metrics-users", CACHE_TTL.userMetricsMs, async () => {
    const [users, events, billingRecords] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          createdAt: true,
          entitlements: {
            select: {
              planId: true,
              status: true,
              endsAt: true,
            },
          },
        },
      }),
      prisma.analyticsEvent.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 90 * DAY_MS),
          },
        },
        select: {
          userId: true,
          createdAt: true,
        },
      }),
      prisma.billingRecord.findMany({
        where: { status: "paid" },
        select: { amount: true },
      }),
    ]);

    const todayKey = dateKey(new Date());
    const monthAgo = new Date(Date.now() - 30 * DAY_MS);
    const dauUsers = new Set(
      events
        .filter((event) => dateKey(event.createdAt) === todayKey)
        .map((event) => event.userId)
        .filter(Boolean),
    );
    const mauUsers = new Set(
      events
        .filter((event) => event.createdAt >= monthAgo)
        .map((event) => event.userId)
        .filter(Boolean),
    );

    return {
      dau: dauUsers.size,
      mau: mauUsers.size,
      totalUsers: users.length,
      newUsers30d: users.filter((user) => user.createdAt >= monthAgo).length,
      arpu: users.length ? Math.round(sum(billingRecords.map((record) => record.amount)) / users.length) : 0,
      paidUsers: users.filter((user) => derivePlan(user.entitlements as Entitlement[]) !== "free").length,
    };
  });
}

export async function getBookMetrics() {
  return withTtlCache("metrics-books", CACHE_TTL.bookMetricsMs, async () => {
    const [bookCount, backendBooks] = await Promise.all([
      prisma.bookRecord.count(),
      fetchBackendBooks(),
    ]);

    const statusDistribution = new Map<string, number>();
    let chapters = 0;
    let words = 0;

    for (const book of backendBooks) {
      const status =
        Number(book.status?.export_count || 0) > 0
          ? "EXPORTED"
          : book.status?.product_ready
            ? "PREVIEW_READY"
            : book.status?.active
              ? "GENERATING"
              : "DRAFT";
      statusDistribution.set(status, (statusDistribution.get(status) || 0) + 1);
      chapters += Number(book.status?.chapter_count || book.chapters?.length || 0);
      words += sum(
        (book.chapters || []).map((chapter) =>
          String(chapter.content || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean).length,
        ),
      );
    }

    return {
      totalBooks: Math.max(bookCount, backendBooks.length),
      avgChapters: backendBooks.length ? Number((chapters / backendBooks.length).toFixed(1)) : 0,
      avgWordCount: backendBooks.length ? Math.round(words / backendBooks.length) : 0,
      byStatus: Array.from(statusDistribution.entries()).map(([status, count]) => ({ status, count })),
    };
  });
}

export async function getFunnelAnalytics(range: DateRangeInput) {
  const cacheKey = `analytics-funnel:${range.from || ""}:${range.to || ""}`;
  return withTtlCache(cacheKey, CACHE_TTL.funnelAnalyticsMs, async () => {
    const events = await prisma.analyticsEvent.findMany({
      where: {
        eventName: { in: [...FUNNEL_STAGES] },
        createdAt: {
          ...(range.from ? { gte: new Date(range.from) } : {}),
          ...(range.to ? { lte: new Date(new Date(range.to).getTime() + DAY_MS) } : {}),
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        guestIdentityId: true,
        sessionId: true,
        eventName: true,
        createdAt: true,
        properties: true,
      },
    });

    const flowMap = new Map<string, Map<string, Date>>();
    for (const event of events) {
      const properties = (event.properties || {}) as Record<string, unknown>;
      const flowId =
        String(properties.flow_id || event.userId || event.guestIdentityId || event.sessionId || event.id);
      const flow = flowMap.get(flowId) || new Map<string, Date>();
      if (!flow.has(event.eventName)) {
        flow.set(event.eventName, event.createdAt);
      }
      flowMap.set(flowId, flow);
    }

    const stages = FUNNEL_STAGES.map((stageName, index) => {
      const count = Array.from(flowMap.values()).filter((flow) => flow.has(stageName)).length;
      const previousStage = index > 0 ? FUNNEL_STAGES[index - 1] : null;
      const previousCount = previousStage
        ? Array.from(flowMap.values()).filter((flow) => flow.has(previousStage)).length
        : count;

      const nextStage = FUNNEL_STAGES[index + 1] || null;
      const durations = nextStage
        ? Array.from(flowMap.values())
            .filter((flow) => flow.has(stageName) && flow.has(nextStage))
            .map((flow) => {
              const current = flow.get(stageName);
              const next = flow.get(nextStage);
              if (!current || !next) return 0;
              return Math.round((next.getTime() - current.getTime()) / (1000 * 60));
            })
            .filter((value) => value >= 0)
        : [];

      return {
        name: stageName,
        count,
        conversionRate: previousCount > 0 ? Number(((count / previousCount) * 100).toFixed(1)) : 0,
        dropOffRate:
          previousStage && previousCount > 0
            ? Number((((previousCount - count) / previousCount) * 100).toFixed(1))
            : 0,
        avgTimeToNext: durations.length ? Math.round(sum(durations) / durations.length) : 0,
      };
    });

    return { stages };
  });
}

export async function getAuthAnalytics(range: DateRangeInput) {
  const cacheKey = `analytics-auth:${range.from || ""}:${range.to || ""}`;
  const events = await withTtlCache(cacheKey, CACHE_TTL.authAnalyticsMs, async () =>
    prisma.analyticsEvent.findMany({
      where: {
        eventName: {
          in: [
            "signup_google_clicked",
            "login_google_clicked",
            "signup_magic_link_clicked",
            "login_magic_link_clicked",
            "continue_auth_password_clicked",
            "auth_bridge_skipped",
            "auth_form_submitted",
            "auth_form_failed",
            "magic_link_sent",
            "verification_resend_clicked",
            "checkout_blocked_unverified",
            "signup_completed",
          ],
        },
        createdAt: {
          ...(range.from ? { gte: new Date(range.from) } : {}),
          ...(range.to ? { lte: new Date(new Date(range.to).getTime() + DAY_MS) } : {}),
        },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        id: true,
        eventName: true,
        createdAt: true,
        properties: true,
      },
    }),
  );

  const countByEvent = new Map<string, number>();
  const methodMap = new Map<string, number>();
  const reasonMap = new Map<string, number>();
  const sourceMap = new Map<string, number>();

  for (const event of events) {
    countByEvent.set(event.eventName, (countByEvent.get(event.eventName) || 0) + 1);

    const properties = (event.properties || {}) as Record<string, unknown>;
    const method = String(properties.method || "").trim();
    const reason = String(properties.reason || "").trim();
    const source = String(properties.source || "").trim();

    if (method) {
      methodMap.set(method, (methodMap.get(method) || 0) + 1);
    }
    if (reason) {
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    }
    if (source) {
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    }
  }

  return {
    summary: {
      signupsCompleted: countByEvent.get("signup_completed") || 0,
      magicLinksSent: countByEvent.get("magic_link_sent") || 0,
      verificationResends: countByEvent.get("verification_resend_clicked") || 0,
      checkoutBlockedUnverified: countByEvent.get("checkout_blocked_unverified") || 0,
      authBridgeSkipped: countByEvent.get("auth_bridge_skipped") || 0,
    },
    miniFunnel: [
      {
        name: "Credentials submit",
        count: countByEvent.get("auth_form_submitted") || 0,
      },
      {
        name: "Magic link sent",
        count: countByEvent.get("magic_link_sent") || 0,
      },
      {
        name: "Signup completed",
        count: countByEvent.get("signup_completed") || 0,
      },
      {
        name: "Bridge skipped",
        count: countByEvent.get("auth_bridge_skipped") || 0,
      },
    ].map((stage, index, list) => {
      const previous = index === 0 ? stage.count : list[index - 1]?.count || 0;
      return {
        ...stage,
        conversionRate: previous > 0 ? Number(((stage.count / previous) * 100).toFixed(1)) : 0,
      };
    }),
    methods: Array.from(methodMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    failureReasons: Array.from(reasonMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    sources: Array.from(sourceMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    recentEvents: events.slice(0, 12).map((event) => ({
      id: event.id,
      eventName: event.eventName,
      createdAt: event.createdAt.toISOString(),
      properties: (event.properties || {}) as Record<string, unknown>,
    })),
  };
}

export async function getCohortAnalysis(months = 6) {
  const cacheKey = `analytics-cohort:${months}`;
  return withTtlCache(cacheKey, CACHE_TTL.cohortMs, async () => {
    const start = new Date();
    start.setUTCMonth(start.getUTCMonth() - months + 1, 1);
    start.setUTCHours(0, 0, 0, 0);

    const [users, events, billingRecords] = await Promise.all([
      prisma.user.findMany({
        where: {
          createdAt: { gte: start },
        },
        select: {
          id: true,
          createdAt: true,
        },
      }),
      prisma.analyticsEvent.findMany({
        where: {
          userId: { not: null },
          createdAt: { gte: start },
        },
        select: {
          userId: true,
          createdAt: true,
        },
      }),
      prisma.billingRecord.findMany({
        where: {
          userId: { not: null },
          createdAt: { gte: start },
          status: "paid",
        },
        select: {
          userId: true,
          amount: true,
          createdAt: true,
        },
      }),
    ]);

    const grouped = new Map<string, Array<{ id: string; createdAt: Date }>>();
    for (const user of users) {
      const key = monthKey(user.createdAt);
      grouped.set(key, [...(grouped.get(key) || []), user]);
    }

    return Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([cohort, cohortUsers]) => {
        const size = cohortUsers.length;
        const userIds = new Set(cohortUsers.map((user) => user.id));
        const retention = Array.from({ length: 3 }, (_, offset) => {
          const month = new Date(`${cohort}-01T00:00:00.000Z`);
          month.setUTCMonth(month.getUTCMonth() + offset);
          const key = monthKey(month);
          const activeUsers = new Set(
            events
              .filter((event) => event.userId && userIds.has(event.userId) && monthKey(event.createdAt) === key)
              .map((event) => event.userId),
          );
          return size ? Number(((activeUsers.size / size) * 100).toFixed(1)) : 0;
        });

        const revenue = Array.from({ length: 3 }, (_, offset) => {
          const month = new Date(`${cohort}-01T00:00:00.000Z`);
          month.setUTCMonth(month.getUTCMonth() + offset);
          const key = monthKey(month);
          return sum(
            billingRecords
              .filter((record) => record.userId && userIds.has(record.userId) && monthKey(record.createdAt) === key)
              .map((record) => record.amount),
          );
        });

        return { cohort, size, retention, revenue };
      });
  });
}

export async function getChurnAnalytics() {
  return withTtlCache("analytics-churn", CACHE_TTL.churnMs, async () => {
    const entitlements = await prisma.entitlement.findMany({
      where: {
        kind: "subscription",
        createdAt: {
          gte: new Date(Date.now() - 180 * DAY_MS),
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    const months = new Map<string, { active: number; churned: number }>();
    for (const item of entitlements) {
      const key = monthKey(item.createdAt);
      const current = months.get(key) || { active: 0, churned: 0 };
      current.active += 1;
      if (item.status === "canceled" || item.status === "refunded" || item.status === "replaced") {
        current.churned += 1;
      }
      months.set(key, current);
    }

    return {
      byMonth: Array.from(months.entries()).map(([month, metrics]) => ({
        month,
        active: metrics.active,
        churned: metrics.churned,
        churnRate: metrics.active ? Number(((metrics.churned / metrics.active) * 100).toFixed(1)) : 0,
      })),
      reasons: [],
    };
  });
}

export async function listAdminUsers(input: {
  page: number;
  pageSize: number;
  q: string;
  sort: string;
  order: "asc" | "desc";
  plan?: string;
  status?: string;
  role?: string;
  from?: string;
  to?: string;
}) {
  const createdAtRange = buildCreatedAtRangeFilter(input);
  const where: Prisma.UserWhereInput = {};

  if (input.role && input.role !== "all") {
    where.role = input.role as UserRole;
  }
  if (createdAtRange) {
    where.createdAt = createdAtRange;
  }
  if (input.q) {
    where.OR = [
      { id: { contains: input.q } },
      { email: { contains: input.q } },
      { name: { contains: input.q } },
    ];
  }

  const mapUser = (user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: UserRole;
    createdAt: Date;
    emailVerified: Date | null;
    entitlements: Array<{ planId: string; status: Entitlement["status"]; endsAt: Date | null }>;
    _count: { ownedBooks: number };
    billingRecords: Array<{ amount: number; status: BillingRecordStatus }>;
  }) => {
    const plan = derivePlan(user.entitlements as Entitlement[]);
    const status = deriveUserStatus(user.entitlements as Entitlement[]);
    const revenue = billingTotal(user.billingRecords as BillingRecord[]);
    return {
      id: user.id,
      name: user.name || "Anonymous user",
      email: user.email,
      image: user.image,
      role: user.role,
      plan,
      planLabel: PLAN_LABELS[plan] || plan,
      status,
      books: user._count.ownedBooks,
      revenue,
      createdAt: user.createdAt.toISOString(),
      emailVerified: Boolean(user.emailVerified),
    };
  };

  const canUseDbPagination =
    (input.plan === "all" || !input.plan) &&
    (input.status === "all" || !input.status) &&
    (input.sort === "createdAt" || input.sort === "books");

  if (canUseDbPagination) {
    const orderBy: Prisma.UserOrderByWithRelationInput =
      input.sort === "books"
        ? { ownedBooks: { _count: input.order } }
        : { createdAt: input.order };

    const [count, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          emailVerified: true,
          entitlements: {
            select: {
              planId: true,
              status: true,
              endsAt: true,
            },
          },
          _count: {
            select: {
              ownedBooks: true,
            },
          },
          billingRecords: {
            select: {
              amount: true,
              status: true,
            },
          },
        },
        orderBy,
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);

    return {
      items: users.map(mapUser),
      page: input.page,
      pageSize: input.pageSize,
      totalItems: count,
      totalPages: Math.max(1, Math.ceil(count / input.pageSize)),
      appliedFilters: {
        q: input.q || null,
        plan: input.plan || null,
        status: input.status || null,
        role: input.role || null,
        from: input.from || null,
        to: input.to || null,
        sort: input.sort,
        order: input.order,
      },
    };
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      entitlements: {
        select: {
          planId: true,
          status: true,
          endsAt: true,
        },
      },
      _count: {
        select: {
          ownedBooks: true,
        },
      },
      billingRecords: {
        select: {
          amount: true,
          status: true,
        },
      },
    },
  });

  let items = users.map(mapUser);

  items = items.filter((item) => {
    if (input.plan && input.plan !== "all" && item.plan !== input.plan) return false;
    if (input.status && input.status !== "all" && item.status !== input.status) return false;
    return true;
  });

  items.sort((left, right) => {
    const direction = input.order === "asc" ? 1 : -1;
    if (input.sort === "revenue") return (left.revenue - right.revenue) * direction;
    if (input.sort === "books") return (left.books - right.books) * direction;
    if (input.sort === "plan") return left.plan.localeCompare(right.plan) * direction;
    return (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) * direction;
  });

  const page = paginate(items, input.page, input.pageSize);
  return {
    items: page.items,
    page: input.page,
    pageSize: input.pageSize,
    totalItems: page.totalItems,
    totalPages: page.totalPages,
    appliedFilters: {
      q: input.q || null,
      plan: input.plan || null,
      status: input.status || null,
      role: input.role || null,
      from: input.from || null,
      to: input.to || null,
      sort: input.sort,
      order: input.order,
    },
  };
}

export async function getAdminUserDetail(userId: string, actorRole: UserRole) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      entitlements: true,
      ownedBooks: true,
      billingRecords: {
        orderBy: { createdAt: "desc" },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!user) return null;

  const [notes, backendBooks] = await Promise.all([
    prisma.adminNote.findMany({
      where: { entityType: "user", entityId: userId },
      include: { createdByUser: true },
      orderBy: { createdAt: "desc" },
    }),
    fetchBackendBooks(),
  ]);

  const bookMap = new Map(backendBooks.map((book) => [book.slug, book]));
  return {
    item: {
      id: user.id,
      name: user.name || "Anonymous user",
      email: user.email,
      image: user.image,
      goal: user.goal,
      role: user.role,
      emailVerified: Boolean(user.emailVerified),
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      currentPlan: derivePlan(user.entitlements),
      currentStatus: deriveUserStatus(user.entitlements),
      totalRevenue: billingTotal(user.billingRecords),
    },
    related: {
      subscriptions: user.entitlements.map((item) => ({
        id: item.id,
        planId: item.planId,
        status: item.status,
        kind: item.kind,
        startsAt: item.startsAt.toISOString(),
        endsAt: item.endsAt?.toISOString() || null,
      })),
      books: user.ownedBooks.map((item) => ({
        slug: item.slug,
        title: bookMap.get(item.slug)?.title || item.slug,
        status:
          bookMap.get(item.slug)?.status?.active
            ? "GENERATING"
            : bookMap.get(item.slug)?.status?.preview_ready
              ? "PREVIEW_READY"
              : "DRAFT",
        createdAt: item.createdAt.toISOString(),
      })),
      billingRecords: user.billingRecords.map((item) => ({
        id: item.id,
        planId: item.planId,
        amount: item.amount,
        currency: item.currency,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      })),
      activity: user.auditLogs.map((item) => ({
        id: item.id,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        createdAt: item.createdAt.toISOString(),
        metadata: item.metadata,
      })),
      notes: notes.map((note) => ({
        id: note.id,
        body: note.body,
        createdAt: note.createdAt.toISOString(),
        author: note.createdByUser.email || note.createdByUser.name || "Admin",
      })),
    },
    permissions: {
      canChangeRole: actorRole === "SUPER_ADMIN",
      canAddNote: true,
      canResendVerification: true,
    },
  };
}

function deriveBookStatus(book: Book | null | undefined, premiumUnlocked: boolean) {
  if (!book) return "DRAFT";
  if (Number(book.status?.export_count || 0) > 0) return "EXPORTED";
  if (premiumUnlocked) return "PREMIUM_UNLOCKED";
  if (book.status?.preview_ready || book.status?.product_ready) return "PREVIEW_READY";
  if (book.status?.active) return "GENERATING";
  return "DRAFT";
}

export async function listAdminBooks(input: {
  page: number;
  pageSize: number;
  q: string;
  sort: string;
  order: "asc" | "desc";
  status?: string;
  language?: string;
  user?: string;
  from?: string;
  to?: string;
}) {
  const [bookRecords, premiumEntitlements, backendBooks] = await Promise.all([
    prisma.bookRecord.findMany({
      select: {
        slug: true,
        ownerUserId: true,
        createdAt: true,
      },
    }),
    prisma.entitlement.findMany({
      where: {
        planId: "premium",
        status: "active",
        bookSlug: { not: null },
      },
      select: { bookSlug: true },
    }),
    fetchBackendBooks(),
  ]);

  const ownerIds = Array.from(
    new Set(bookRecords.map((item) => item.ownerUserId).filter((id): id is string => Boolean(id))),
  );
  const users = ownerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: ownerIds } },
        select: { id: true, email: true, name: true },
      })
    : [];

  const userMap = new Map(users.map((user) => [user.id, user]));
  const recordMap = new Map(bookRecords.map((record) => [record.slug, record]));
  const backendMap = new Map(backendBooks.map((book) => [book.slug, book]));
  const premiumSlugs = new Set(premiumEntitlements.map((item) => item.bookSlug).filter(Boolean));
  const slugSet = new Set([
    ...bookRecords.map((item) => item.slug),
    ...backendBooks.map((item) => item.slug),
  ]);

  let items = Array.from(slugSet).map((slug) => {
    const record = recordMap.get(slug) || null;
    const book = backendMap.get(slug) || null;
    const owner = record?.ownerUserId ? userMap.get(record.ownerUserId) : null;
    const premiumUnlocked = premiumSlugs.has(slug);

    return {
      slug,
      title: book?.title || slug,
      author: book?.author || owner?.name || "Bilinmiyor",
      language: book?.language || "English",
      status: deriveBookStatus(book, premiumUnlocked),
      chapters: Number(book?.status?.chapter_count || book?.chapters?.length || 0),
      exports: Number(book?.status?.export_count || 0),
      ownerName: owner?.name || "",
      ownerEmail: owner?.email || "",
      createdAt: record?.createdAt.toISOString() || book?.status?.started_at || new Date().toISOString(),
      coverUrl: adminBookAssetUrl(slug, book?.cover_image || ""),
      premiumUnlocked,
    };
  });

  items = items.filter((item) => {
    if (!matchesQuery(input.q, item.slug, item.title, item.author, item.ownerEmail, item.ownerName)) return false;
    if (input.status && input.status !== "all" && item.status !== input.status) return false;
    if (input.language && input.language !== "all" && item.language !== input.language) return false;
    if (input.user && input.user !== "all" && !matchesQuery(input.user, item.ownerEmail, item.ownerName)) return false;
    if (!withinRange(item.createdAt, input)) return false;
    return true;
  });

  items.sort((left, right) => {
    const direction = input.order === "asc" ? 1 : -1;
    if (input.sort === "title") return left.title.localeCompare(right.title) * direction;
    if (input.sort === "status") return left.status.localeCompare(right.status) * direction;
    return (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) * direction;
  });

  const page = paginate(items, input.page, input.pageSize);
  return {
    items: page.items,
    page: input.page,
    pageSize: input.pageSize,
    totalItems: page.totalItems,
    totalPages: page.totalPages,
    appliedFilters: {
      q: input.q || null,
      status: input.status || null,
      language: input.language || null,
      user: input.user || null,
      from: input.from || null,
      to: input.to || null,
      sort: input.sort,
      order: input.order,
    },
  };
}

export async function getAdminBookDetail(slug: string) {
  const [record, book, moderation, notes, auditLogs] = await Promise.all([
    prisma.bookRecord.findUnique({ where: { slug } }),
    fetchBackendBook(slug),
    prisma.moderationReview.findMany({
      where: { bookSlug: slug },
      orderBy: { createdAt: "desc" },
    }),
    prisma.adminNote.findMany({
      where: { entityType: "book", entityId: slug },
      include: { createdByUser: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      where: { entityType: "book", entityId: slug },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actorUser: true },
    }),
  ]);

  if (!record && !book) return null;

  const [owner, unlocked] = await Promise.all([
    record?.ownerUserId
      ? prisma.user.findUnique({
          where: { id: record.ownerUserId },
          select: { id: true, email: true, name: true },
        })
      : Promise.resolve(null),
    prisma.entitlement.findFirst({
      where: {
        planId: "premium",
        bookSlug: slug,
        status: "active",
      },
      select: { id: true },
    }),
  ]);

  const pipelineActivity = Array.isArray(book?.status?.activity_log)
    ? book.status.activity_log.map((item, index) => ({
        id: `pipeline-${index}-${item.code || "event"}`,
        action: item.label || item.code || "Pipeline event",
        createdAt: String(item.timestamp || record?.createdAt.toISOString() || new Date().toISOString()),
        actor: "Pipeline",
        metadata: item.detail ? { detail: item.detail, status: item.status, code: item.code } : { status: item.status, code: item.code },
      }))
    : [];
  const mergedActivity = [...pipelineActivity, ...auditLogs.map((item) => ({
    id: item.id,
    action: item.action,
    createdAt: item.createdAt.toISOString(),
    actor: item.actorUser?.email || item.actorUser?.name || "Sistem",
    metadata: item.metadata,
  }))].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return {
    item: {
      slug,
      title: book?.title || slug,
      subtitle: book?.subtitle || "",
      author: book?.author || owner?.name || "",
      language: book?.language || "English",
      status: deriveBookStatus(book || null, Boolean(unlocked)),
      description: book?.description || "",
      ownerName: owner?.name || "",
      ownerEmail: owner?.email || "",
      coverUrl: adminBookAssetUrl(slug, book?.cover_image || ""),
      backCoverUrl: adminBookAssetUrl(slug, book?.back_cover_image || ""),
      createdAt: record?.createdAt.toISOString() || new Date().toISOString(),
      generation: book?.status || null,
    },
    related: {
      outline: (book?.chapters || []).map((chapter, index) => ({
        id: chapter.filename || `${index + 1}`,
        number: chapter.number || index + 1,
        title: chapter.title,
        wordCount: String(chapter.content || "")
          .trim()
          .split(/\s+/)
          .filter(Boolean).length,
      })),
      moderation: moderation.map((item) => ({
        id: item.id,
        status: item.status,
        qualityScore: item.qualityScore,
        plagiarismScore: item.plagiarismScore,
        notes: item.notes,
        createdAt: item.createdAt.toISOString(),
      })),
      notes: notes.map((note) => ({
        id: note.id,
        body: note.body,
        createdAt: note.createdAt.toISOString(),
        author: note.createdByUser.email || note.createdByUser.name || "Admin",
      })),
      activity: mergedActivity,
    },
    permissions: {
      canUnlockPremium: Boolean(record?.ownerUserId),
      canRetryPreview: true,
    },
  };
}

export async function listAdminSubscriptions(input: {
  page: number;
  pageSize: number;
  q: string;
  sort: string;
  order: "asc" | "desc";
  plan?: string;
  status?: string;
  from?: string;
  to?: string;
}) {
  const startedAtRange = buildCreatedAtRangeFilter({ from: input.from, to: input.to });
  const where: Prisma.EntitlementWhereInput = {
    kind: "subscription",
  };

  if (input.plan && input.plan !== "all") {
    where.planId = input.plan;
  }
  if (input.status && input.status !== "all") {
    where.status = input.status.toLowerCase() as Entitlement["status"];
  }
  if (startedAtRange) {
    where.startsAt = startedAtRange;
  }
  if (input.q) {
    where.OR = [
      { id: { contains: input.q } },
      { user: { email: { contains: input.q } } },
      { user: { name: { contains: input.q } } },
    ];
  }

  const mapSubscriptionRow = (
    item: {
      id: string;
      planId: string;
      status: Entitlement["status"];
      startsAt: Date;
      endsAt: Date | null;
      user: { id: string; email: string; name: string | null };
    },
  ) => ({
    id: item.id,
    userId: item.user.id,
    userName: item.user.name || "Anonymous user",
    userEmail: item.user.email,
    planId: item.planId,
    planLabel: PLAN_LABELS[item.planId] || item.planId,
    status: String(item.status).toUpperCase(),
    amount: PLAN_PRICES_CENTS[item.planId] || 0,
    nextBilling:
      item.status === "active"
        ? new Date(item.startsAt.getTime() + 30 * DAY_MS).toISOString()
        : item.endsAt?.toISOString() || null,
    startedAt: item.startsAt.toISOString(),
  });

  let items: Array<ReturnType<typeof mapSubscriptionRow>> = [];
  let totalItems = 0;

  if (input.sort === "amount") {
    const subscriptions = await prisma.entitlement.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
    items = subscriptions
      .map(mapSubscriptionRow)
      .sort((left, right) =>
        input.order === "asc"
          ? left.amount - right.amount
          : right.amount - left.amount,
      );
    totalItems = items.length;
    items = paginate(items, input.page, input.pageSize).items;
  } else {
    const orderBy: Prisma.EntitlementOrderByWithRelationInput =
      input.sort === "status"
        ? { status: input.order }
        : { startsAt: input.order };
    const [count, subscriptions] = await Promise.all([
      prisma.entitlement.count({ where }),
      prisma.entitlement.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy,
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);
    totalItems = count;
    items = subscriptions.map(mapSubscriptionRow);
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / input.pageSize));
  return {
    items,
    page: input.page,
    pageSize: input.pageSize,
    totalItems,
    totalPages,
    appliedFilters: {
      q: input.q || null,
      plan: input.plan || null,
      status: input.status || null,
      from: input.from || null,
      to: input.to || null,
      sort: input.sort,
      order: input.order,
    },
  };
}

export async function listAdminBillingRecords(input: {
  page: number;
  pageSize: number;
  q: string;
  sort: string;
  order: "asc" | "desc";
  status?: string;
  from?: string;
  to?: string;
}) {
  const createdAtRange = buildCreatedAtRangeFilter(input);
  const where: Prisma.BillingRecordWhereInput = {};
  if (input.status && input.status !== "all") {
    where.status = input.status as BillingRecordStatus;
  }
  if (createdAtRange) {
    where.createdAt = createdAtRange;
  }
  if (input.q) {
    where.OR = [
      { id: { contains: input.q } },
      { bookSlug: { contains: input.q } },
      { user: { email: { contains: input.q } } },
      { user: { name: { contains: input.q } } },
    ];
  }

  let orderBy: Prisma.BillingRecordOrderByWithRelationInput = { createdAt: input.order };
  if (input.sort === "amount") {
    orderBy = { amount: input.order };
  } else if (input.sort === "status") {
    orderBy = { status: input.order };
  }

  const [count, records] = await Promise.all([
    prisma.billingRecord.count({ where }),
    prisma.billingRecord.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy,
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
  ]);

  const items = records.map((item) => ({
    id: item.id,
    invoiceId: item.id,
    userId: item.userId,
    userEmail: item.user?.email || "—",
    userName: item.user?.name || "—",
    planId: item.planId,
    amount: item.amount,
    currency: item.currency,
    status: item.status,
    kind: item.kind,
    createdAt: item.createdAt.toISOString(),
    bookSlug: item.bookSlug,
  }));

  const totalPages = Math.max(1, Math.ceil(count / input.pageSize));
  return {
    items,
    page: input.page,
    pageSize: input.pageSize,
    totalItems: count,
    totalPages,
    appliedFilters: {
      q: input.q || null,
      status: input.status || null,
      from: input.from || null,
      to: input.to || null,
      sort: input.sort,
      order: input.order,
    },
  };
}

export async function getAdminBillingRecord(recordId: string) {
  return prisma.billingRecord.findUnique({
    where: { id: recordId },
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
      entitlement: true,
    },
  });
}

export async function listAdminAuditLogs(input: {
  page: number;
  pageSize: number;
  q: string;
  sort: string;
  order: "asc" | "desc";
  action?: string;
  from?: string;
  to?: string;
}) {
  const createdAtRange = buildCreatedAtRangeFilter(input);
  const where: Prisma.AuditLogWhereInput = {};
  if (input.action && input.action !== "all") {
    where.action = input.action;
  }
  if (createdAtRange) {
    where.createdAt = createdAtRange;
  }
  if (input.q) {
    where.OR = [
      { action: { contains: input.q } },
      { entityType: { contains: input.q } },
      { entityId: { contains: input.q } },
      { actorUser: { email: { contains: input.q } } },
      { actorUser: { name: { contains: input.q } } },
    ];
  }

  const [count, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        actorUser: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: input.order },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
  ]);

  const items = logs.map((item) => ({
    id: item.id,
    timestamp: item.createdAt.toISOString(),
    user: item.actorUser?.email || item.actorUser?.name || "Sistem",
    action: item.action,
    details: item.metadata,
    ipAddress: item.ipHash || "—",
    entityType: item.entityType,
    entityId: item.entityId,
  }));

  const totalPages = Math.max(1, Math.ceil(count / input.pageSize));
  return {
    items,
    page: input.page,
    pageSize: input.pageSize,
    totalItems: count,
    totalPages,
    appliedFilters: {
      q: input.q || null,
      action: input.action || null,
      from: input.from || null,
      to: input.to || null,
      sort: input.sort,
      order: input.order,
    },
  };
}

export async function listAdminModerationQueue(input: {
  page: number;
  pageSize: number;
  q: string;
  sort: string;
  order: "asc" | "desc";
  status?: string;
  summaryOnly?: boolean;
}) {
  const where: Prisma.ModerationReviewWhereInput = {};
  if (input.status && input.status !== "all") {
    where.status = input.status as ModerationStatus;
  }

  if (input.summaryOnly) {
    const totalItems = await prisma.moderationReview.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalItems / input.pageSize));
    return {
      items: [],
      page: input.page,
      pageSize: input.pageSize,
      totalItems,
      totalPages,
      appliedFilters: {
        q: input.q || null,
        status: input.status || null,
        sort: input.sort,
        order: input.order,
      },
    };
  }

  let items: Array<{
    id: string;
    bookSlug: string;
    bookTitle: string;
    status: string;
    qualityScore: number | null;
    plagiarismScore: number | null;
    createdAt: string;
  }> = [];
  let totalItems = 0;

  if (input.q) {
    const [reviews, books] = await Promise.all([
      prisma.moderationReview.findMany({
        where,
        orderBy: { createdAt: input.order },
      }),
      fetchBackendBooks(),
    ]);
    const bookMap = new Map(books.map((book) => [book.slug, book]));
    const filtered = reviews
      .filter((item) =>
        matchesQuery(input.q, item.bookSlug, bookMap.get(item.bookSlug)?.title),
      )
      .map((item) => ({
        id: item.id,
        bookSlug: item.bookSlug,
        bookTitle: bookMap.get(item.bookSlug)?.title || item.bookSlug,
        status: item.status,
        qualityScore: item.qualityScore,
        plagiarismScore: item.plagiarismScore,
        createdAt: item.createdAt.toISOString(),
      }));
    totalItems = filtered.length;
    items = paginate(filtered, input.page, input.pageSize).items;
  } else {
    const [count, reviews, books] = await Promise.all([
      prisma.moderationReview.count({ where }),
      prisma.moderationReview.findMany({
        where,
        orderBy: { createdAt: input.order },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      fetchBackendBooks(),
    ]);
    totalItems = count;
    const bookMap = new Map(books.map((book) => [book.slug, book]));
    items = reviews.map((item) => ({
      id: item.id,
      bookSlug: item.bookSlug,
      bookTitle: bookMap.get(item.bookSlug)?.title || item.bookSlug,
      status: item.status,
      qualityScore: item.qualityScore,
      plagiarismScore: item.plagiarismScore,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / input.pageSize));
  return {
    items,
    page: input.page,
    pageSize: input.pageSize,
    totalItems,
    totalPages,
    appliedFilters: {
      q: input.q || null,
      status: input.status || null,
      sort: input.sort,
      order: input.order,
    },
  };
}

export async function listAdminJobs(options?: { summaryOnly?: boolean }) {
  const cacheKey = options?.summaryOnly ? "admin-jobs:summary" : "admin-jobs:full";
  return withTtlCache(cacheKey, CACHE_TTL.jobsMs, async () => {
    const books = await fetchBackendBooks();
    const items = books
      .filter((book) => {
        const status = book.status || {};
        return Boolean(status.active || status.error || status.started_at || status.updated_at);
      })
      .map((book) => {
        const status = book.status || {};
        let lifecycle = "completed";
        if (status.error) lifecycle = "failed";
        else if (status.active) lifecycle = "processing";
        else if (!status.product_ready) lifecycle = "pending";

        return {
          id: book.slug,
          type: status.cover_ready || status.first_chapter_ready ? "preview_pipeline" : "book_generation",
          bookSlug: book.slug,
          title: book.title,
          status: lifecycle,
          progress: Number(status.progress || 0),
          startedAt: status.started_at || status.updated_at || new Date().toISOString(),
          message: status.message || status.error || "Ready",
        };
      });

    const summary = {
      active: items.filter((item) => item.status === "processing").length,
      pending: items.filter((item) => item.status === "pending").length,
      failed: items.filter((item) => item.status === "failed").length,
      queueDepth: items.filter((item) => item.status !== "completed").length,
    };

    if (options?.summaryOnly) {
      return { items: [], summary };
    }

    return {
      items: items.sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime()),
      summary,
    };
  });
}

export async function getAdminSettingsPayload() {
  const [featureFlags, backendSettings] = await Promise.all([
    prisma.featureFlag.findMany({
      orderBy: { key: "asc" },
    }),
    fetchBackendJson<Record<string, unknown>>("/api/settings"),
  ]);

  return {
    featureFlags: featureFlags.map((flag: FeatureFlag) => ({
      id: flag.id,
      key: flag.key,
      label: flag.label,
      description: flag.description,
      enabled: flag.enabled,
    })),
    backendSettings: backendSettings || {},
    notConfigured: ["pricing", "email_templates", "api_keys", "webhooks", "rate_limits"],
  };
}

export async function createAdminNote(input: {
  entityType: string;
  entityId: string;
  body: string;
  createdByUserId: string;
}) {
  return prisma.adminNote.create({
    data: input,
    include: { createdByUser: true },
  });
}

export async function updateFeatureFlag(input: { id: string; enabled: boolean }) {
  return prisma.featureFlag.update({
    where: { id: input.id },
    data: { enabled: input.enabled },
  });
}

export async function unlockBookPremium(slug: string, actorUserId: string) {
  const book = await prisma.bookRecord.findUnique({
    where: { slug },
  });
  if (!book?.ownerUserId) {
    throw new Error("Book has no associated user owner.");
  }

  const entitlement = await prisma.entitlement.create({
    data: {
      userId: book.ownerUserId,
      planId: "premium",
      kind: "one_time_book_unlock",
      status: "active",
      provider: "admin_manual",
      bookSlug: slug,
    },
  });

  const billingRecord = await prisma.billingRecord.create({
    data: {
      userId: book.ownerUserId,
      entitlementId: entitlement.id,
      planId: "premium",
      kind: "manual_adjustment",
      status: "paid",
      amount: 0,
      currency: PLAN_CURRENCY,
      description: `Premium unlocked by admin for ${slug}`,
      bookSlug: slug,
      metadata: {
        actorUserId,
      } as never,
    },
  });

  return { entitlement, billingRecord };
}

export async function changeUserPlan(
  userId: string,
  newPlanId: string,
  actorUserId: string,
  reason?: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { entitlements: true },
  });
  if (!user) {
    throw new Error("User not found..");
  }

  // Derive current plan before changes
  const oldPlan = derivePlan(user.entitlements);

  // If already on this plan, nothing to do
  if (oldPlan === newPlanId) {
    return { oldPlan, newPlan: newPlanId, entitlement: null, billingRecord: null };
  }

  // Cancel existing active entitlements
  const activeEntitlements = user.entitlements.filter(
    (item) =>
      item.status === "active" ||
      item.status === "trialing",
  );

  if (activeEntitlements.length > 0) {
    await prisma.entitlement.updateMany({
      where: {
        id: { in: activeEntitlements.map((e) => e.id) },
      },
      data: {
        status: "replaced",
        endsAt: new Date(),
      },
    });
  }

  // If upgrading to a paid plan, create a new active entitlement
  let entitlement = null;
  let billingRecord = null;

  if (newPlanId !== "free") {
    entitlement = await prisma.entitlement.create({
      data: {
        userId,
        planId: newPlanId,
        kind: "subscription",
        status: "active",
        provider: "admin_manual",
      },
    });

    billingRecord = await prisma.billingRecord.create({
      data: {
        userId,
        entitlementId: entitlement.id,
        planId: newPlanId,
        kind: "manual_adjustment",
        status: "paid",
        amount: 0,
        currency: PLAN_CURRENCY,
        description: `Plan changed by admin: ${PLAN_LABELS[oldPlan] || oldPlan} → ${PLAN_LABELS[newPlanId] || newPlanId}${reason ? ` | Reason: ${reason}` : ""}`,
        metadata: {
          actorUserId,
          oldPlan,
          newPlan: newPlanId,
          reason: reason || null,
        } as never,
      },
    });
  }

  return { oldPlan, newPlan: newPlanId, entitlement, billingRecord };
}
