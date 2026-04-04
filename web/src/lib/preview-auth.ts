import type { UserRole } from "@prisma/client";

export type PreviewAccount = {
  name: string;
  email: string;
  goal: string;
  publisherImprint: string;
  publisherLogoUrl: string;
};

export type PreviewPlan = "free" | "starter" | "creator" | "pro" | "premium";

export type PreviewSession = {
  email: string;
  loggedInAt: string;
  userId?: string;
  emailVerified?: boolean;
};

export type PreviewAuthProviders = {
  google: boolean;
  magicLink: boolean;
  credentials: boolean;
};

export type PreviewUsage = {
  canStartBook: boolean;
  reason: "free_preview_used" | "premium_single_book_used" | "monthly_quota_reached" | null;
  remainingBooks: number;
  resetAt: string | null;
  limit: number | null;
  usedBooks: number;
};

export type PreviewViewer = {
  id: string;
  name: string;
  email: string;
  goal: string;
  publisherImprint: string;
  publisherLogoUrl: string;
  planId: PreviewPlan;
  emailVerified: boolean;
  role: UserRole;
  usage: PreviewUsage;
};

export type PreviewAuthStatePayload = {
  authenticated: boolean;
  session: PreviewSession | null;
  account: PreviewAccount;
  planId: PreviewPlan;
  emailVerified: boolean;
  providers?: PreviewAuthProviders;
  anonymousId?: string | null;
  viewer: PreviewViewer | null;
  usage: PreviewUsage;
};

export const DEFAULT_PREVIEW_GOAL = "İlk kitabımı hızlıca üretmek istiyorum.";
export const DEFAULT_PREVIEW_USAGE: PreviewUsage = {
  canStartBook: true,
  reason: null,
  remainingBooks: 1,
  resetAt: null,
  limit: 1,
  usedBooks: 0,
};
export const DEFAULT_PREVIEW_ACCOUNT = {
  name: "Book Creator",
  email: "demo@example.com",
  goal: DEFAULT_PREVIEW_GOAL,
  publisherImprint: "",
  publisherLogoUrl: "",
} satisfies PreviewAccount;

const SESSION_KEY = "book-product-session";
const ACCOUNT_KEY = "book-product-account";
const PLAN_KEY = "book-product-plan";
const VIEWER_KEY = "book-product-viewer";
const WIZARD_PREFIX = "book-dashboard-wizard:";
const AUTH_STATE_TIMEOUT_MS = 6_000;
const AUTH_STATE_CACHE_TTL_MS = 3_000;

type AuthJsSessionPayload = {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    goal?: string;
    emailVerified?: string | null;
    role?: UserRole;
  };
} | null;

let authStateInFlight: Promise<PreviewAuthStatePayload | null> | null = null;
let authStateCache:
  | {
      payload: PreviewAuthStatePayload;
      timestamp: number;
    }
  | null = null;

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function hasCustomPreviewAccount(account: PreviewAccount | null | undefined) {
  if (!account) return false;
  return (
    account.name !== DEFAULT_PREVIEW_ACCOUNT.name ||
    account.email !== DEFAULT_PREVIEW_ACCOUNT.email ||
    account.goal !== DEFAULT_PREVIEW_ACCOUNT.goal ||
    account.publisherImprint !== DEFAULT_PREVIEW_ACCOUNT.publisherImprint ||
    account.publisherLogoUrl !== DEFAULT_PREVIEW_ACCOUNT.publisherLogoUrl
  );
}

export function getSession() {
  if (!canUseStorage()) return null;
  return safeParse<PreviewSession | null>(localStorage.getItem(SESSION_KEY), null);
}

export function setSession(payload: PreviewSession) {
  if (!canUseStorage()) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function clearSession() {
  if (!canUseStorage()) return;
  localStorage.removeItem(SESSION_KEY);
}

export function clearClientAuthState() {
  if (!canUseStorage()) return;
  clearSession();
  clearViewer();
  localStorage.removeItem(ACCOUNT_KEY);
  localStorage.setItem(PLAN_KEY, "free");
}

export function getAccount() {
  if (!canUseStorage()) {
    return DEFAULT_PREVIEW_ACCOUNT;
  }
  return safeParse<PreviewAccount>(localStorage.getItem(ACCOUNT_KEY), DEFAULT_PREVIEW_ACCOUNT);
}

export function setAccount(payload: PreviewAccount) {
  if (!canUseStorage()) return;
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(payload));
}

export function getPlan() {
  if (!canUseStorage()) return "free";
  return (localStorage.getItem(PLAN_KEY) as PreviewPlan | null) || "free";
}

export function setPlan(planId: PreviewPlan) {
  if (!canUseStorage()) return;
  localStorage.setItem(PLAN_KEY, planId);
}

export function getViewer() {
  if (!canUseStorage()) return null;
  const parsed = safeParse<PreviewViewer | null>(localStorage.getItem(VIEWER_KEY), null);
  if (!parsed) return null;
  return {
    ...parsed,
    usage: parsed.usage || DEFAULT_PREVIEW_USAGE,
  };
}

export function setViewer(payload: PreviewViewer) {
  if (!canUseStorage()) return;
  localStorage.setItem(VIEWER_KEY, JSON.stringify(payload));
}

export function clearViewer() {
  if (!canUseStorage()) return;
  localStorage.removeItem(VIEWER_KEY);
}

export function persistViewer(payload: PreviewViewer) {
  setViewer(payload);
  setAccount({
    name: payload.name,
    email: payload.email,
    goal: payload.goal,
    publisherImprint: payload.publisherImprint,
    publisherLogoUrl: payload.publisherLogoUrl,
  });
  setPlan(payload.planId);

  const session = getSession();
  if (session) {
    setSession({
      ...session,
      email: payload.email,
      emailVerified: payload.emailVerified,
    });
  }
}

export function hasPremiumAccess(planId?: string | null) {
  const plan = String(planId || getPlan()).trim().toLowerCase();
  return plan === "starter" || plan === "creator" || plan === "pro" || plan === "premium";
}

export function wizardStorageKey(slug = "draft") {
  return `${WIZARD_PREFIX}${slug || "draft"}`;
}

export function loadWizardState<T>(slug = "draft") {
  if (!canUseStorage()) return null as T | null;
  return safeParse<T | null>(localStorage.getItem(wizardStorageKey(slug)), null);
}

export function saveWizardState<T>(slug: string, payload: T) {
  if (!canUseStorage()) return;
  localStorage.setItem(wizardStorageKey(slug), JSON.stringify(payload));
}

export function removeWizardState(slug: string) {
  if (!canUseStorage()) return;
  localStorage.removeItem(wizardStorageKey(slug));
}

async function fetchAuthJsSession() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_STATE_TIMEOUT_MS);
  try {
    const response = await fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "include",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as AuthJsSessionPayload;
    return payload;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function applyAuthStatePayload(payload: PreviewAuthStatePayload) {
  const currentAccount = getAccount();
  if (payload.authenticated || !hasCustomPreviewAccount(currentAccount)) {
    setAccount(payload.account);
  }
  setPlan(payload.planId || "free");

  if (payload.authenticated && payload.session) {
    setSession({
      ...payload.session,
      emailVerified: payload.emailVerified,
    });
    if (payload.viewer) {
      setViewer(payload.viewer);
    }
  } else {
    clearSession();
    clearViewer();
  }
}

function buildFallbackAuthStatePayload(payload: AuthJsSessionPayload): PreviewAuthStatePayload {
  const authenticated = Boolean(payload?.user?.id && payload?.user?.email);
  const currentAccount = getAccount();
  const currentPlanId = getPlan();
  const currentViewer = getViewer();
  const fallbackUsage = currentViewer?.usage || DEFAULT_PREVIEW_USAGE;

  if (!authenticated) {
    return {
      authenticated: false,
      session: null,
      account: hasCustomPreviewAccount(currentAccount)
        ? currentAccount
        : DEFAULT_PREVIEW_ACCOUNT,
      planId: currentPlanId || "free",
      emailVerified: false,
      providers: undefined,
      anonymousId: null,
      viewer: null,
      usage: fallbackUsage,
    };
  }

  const email = String(payload?.user?.email || currentAccount.email || DEFAULT_PREVIEW_ACCOUNT.email);
  const name = String(payload?.user?.name || currentAccount.name || "Book Creator");
  const emailVerified = Boolean(payload?.user?.emailVerified);

  return {
    authenticated: true,
    session: {
      email,
      loggedInAt: new Date().toISOString(),
      userId: String(payload?.user?.id || ""),
      emailVerified,
    },
    account: {
      ...currentAccount,
      name,
      email,
    },
    planId: currentPlanId || "free",
    emailVerified,
    providers: undefined,
    anonymousId: null,
    viewer: currentViewer,
    usage: fallbackUsage,
  };
}

export async function syncPreviewAuthState() {
  if (!canUseStorage()) return null;

  const now = Date.now();
  if (authStateCache && now - authStateCache.timestamp < AUTH_STATE_CACHE_TTL_MS) {
    return authStateCache.payload;
  }
  if (authStateInFlight) {
    return authStateInFlight;
  }

  authStateInFlight = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AUTH_STATE_TIMEOUT_MS);
      let response: Response | null = null;
      try {
        response = await fetch("/api/auth/state", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });
      } catch {
        response = null;
      } finally {
        clearTimeout(timeout);
      }

      if (response?.ok) {
        const payload = (await response.json()) as PreviewAuthStatePayload;
        applyAuthStatePayload(payload);
        authStateCache = { payload, timestamp: Date.now() };
        return payload;
      }

      const authJsSession = await fetchAuthJsSession();
      if (!authJsSession) {
        return null;
      }

      const fallbackPayload = buildFallbackAuthStatePayload(authJsSession);
      applyAuthStatePayload(fallbackPayload);
      authStateCache = { payload: fallbackPayload, timestamp: Date.now() };
      return fallbackPayload;
    } catch {
      return null;
    } finally {
      authStateInFlight = null;
    }
  })();

  return authStateInFlight;
}
