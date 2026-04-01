export type PreviewAccount = {
  name: string;
  email: string;
  goal: string;
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

export const DEFAULT_PREVIEW_GOAL = "İlk kitabımı hızlıca üretmek istiyorum.";
export const DEFAULT_PREVIEW_ACCOUNT = {
  name: "Book Creator",
  email: "demo@example.com",
  goal: DEFAULT_PREVIEW_GOAL,
} satisfies PreviewAccount;

const SESSION_KEY = "book-product-session";
const ACCOUNT_KEY = "book-product-account";
const PLAN_KEY = "book-product-plan";
const WIZARD_PREFIX = "book-dashboard-wizard:";

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
    account.goal !== DEFAULT_PREVIEW_ACCOUNT.goal
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

export async function syncPreviewAuthState() {
  if (!canUseStorage()) return null;

  try {
    const response = await fetch("/api/auth/state", {
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      authenticated: boolean;
      session: PreviewSession | null;
      account: PreviewAccount;
      planId: PreviewPlan;
      emailVerified: boolean;
      providers?: PreviewAuthProviders;
      anonymousId?: string | null;
    };

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
    } else {
      clearSession();
    }

    return payload;
  } catch {
    return null;
  }
}
