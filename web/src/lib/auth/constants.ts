export const GUEST_COOKIE_NAME = "book_guest";
export const GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const MAGIC_LINK_TTL_SECONDS = 15 * 60;
export const EMAIL_VERIFICATION_TTL_SECONDS = 24 * 60 * 60;
export const PASSWORD_RESET_TTL_SECONDS = 30 * 60;
export const PREVIEW_CAMPAIGN_TOKEN_TTL_SECONDS = 15 * 24 * 60 * 60;
export const PREVIEW_BONUS_WINDOW_DAYS = 3;
export const PREVIEW_RECOVERY_DELAY_DAYS = 10;
export const PREVIEW_MONTHLY_NUDGE_DAYS = 30;

export const LOGIN_RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 };
export const EMAIL_ACTION_RATE_LIMIT = { max: 3, windowMs: 15 * 60 * 1000 };
export const GUEST_GENERATE_RATE_LIMIT = { max: 10, windowMs: 60 * 60 * 1000 };

export const BOOK_PLAN_ORDER = ["free", "starter", "creator", "pro", "premium"] as const;
export const PAID_PLANS = new Set(["starter", "creator", "pro", "premium"]);
export const SUBSCRIPTION_PLANS = new Set(["starter", "creator", "pro"]);

export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  creator: "Creator",
  pro: "Stüdyo",
  premium: "Single Book",
};

export const PLAN_PRICES_CENTS: Record<string, number> = {
  starter: 1900,
  creator: 3900,
  pro: 7900,
  premium: 400,
};

export const PLAN_CURRENCY = "USD";
export const BOOK_CREATION_LIMITS: Record<string, number | null> = {
  free: 1,
  premium: 1,
  starter: 10,
  creator: 30,
  pro: 80,
};

export type BookPlanId = (typeof BOOK_PLAN_ORDER)[number];