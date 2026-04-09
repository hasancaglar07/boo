"use client";

export type AnalyticsEventName =
  | "contact_form_viewed"
  | "contact_form_failed"
  | "contact_form_submitted"
  | "lead_magnet_viewed"
  | "lead_magnet_email_capture_viewed"
  | "lead_magnet_requested"
  | "lead_magnet_delivered"
  | "lead_magnet_cta_clicked"
  | "tool_page_viewed"
  | "tool_started"
  | "tool_result_generated"
  | "tool_email_capture_viewed"
  | "tool_email_submitted"
  | "tool_full_report_delivered"
  | "tool_cta_clicked"
  | "landing_hero_cta_click"
  | "landing_cta_click"
  | "pricing_cta_click"
  | "examples_book_clicked"
  | "examples_reader_viewed"
  | "examples_export_clicked"
  | "examples_sticky_cta_clicked"
  | "examples_start_similar_clicked"
  | "examples_cta_click"
  | "faq_cta_click"
  | "quick_start_clicked"
  | "start_page_completion"
  | "register_completion"
  | "auth_form_submitted"
  | "auth_form_failed"
  | "magic_link_sent"
  | "wizard_started"
  | "wizard_completed"
  | "wizard_topic_completed"
  | "title_ai_used"
  | "subtitle_ai_used"
  | "outline_ai_used"
  | "outline_manual_edited"
  | "style_ai_used"
  | "wizard_generate_clicked"
  | "generate_started"
  | "signup_prompt_shown"
  | "signup_prompt_clicked"
  | "signup_prompt_skipped"
  | "generate_auth_gate_viewed"
  | "generate_auth_gate_closed"
  | "generate_auth_gate_method_selected"
  | "generate_auth_gate_completed"
  | "generate_auth_gate_resumed"
  | "generate_auth_gate_failed"
  | "auth_bridge_skipped"
  | "signup_google_clicked"
  | "login_google_clicked"
  | "signup_magic_link_clicked"
  | "login_magic_link_clicked"
  | "signup_completed"
  | "continue_auth_password_clicked"
  | "verification_resend_clicked"
  | "checkout_blocked_unverified"
  | "draft_merged_to_user"
  | "preview_viewed"
  | "preview_ready_seen"
  | "preview_locked_section_clicked"
  | "cover_variant_selected"
  | "paywall_viewed"
  | "paywall_opened"
  | "paywall_cta_clicked"
  | "paywall_pdf_clicked"
  | "paywall_epub_clicked"
  | "paywall_full_unlock_clicked"
  | "outline_generated"
  | "first_chapter_generated"
  | "cover_generated"
  | "first_export_success"
  | "billing_page_opened"
  | "checkout_started"
  | "checkout_completed"
  | "checkout_cancelled"
  | "full_book_viewed"
  | "recovery_email_sent"
  | "recovery_email_clicked"
  | "affiliate_link_copied"
  | "affiliate_whatsapp_clicked"
  | "affiliate_twitter_clicked"
  | "affiliate_email_clicked"
  | "affiliate_payout_requested"
  | "referral_link_copied"
  | "referral_share_dialog_dismissed"
  | "referral_share_dialog_shown"
  | "referral_twitter_clicked"
  | "referral_whatsapp_clicked"
  | "second_book_gate_viewed"
  | "second_book_gate_converted"
  | "pdf_export_started"
  | "pdf_export_completed"
  | "epub_export_started"
  | "epub_export_completed"
  | "onboarding_checklist_item_completed"
  | "onboarding_checklist_completed"
  | "profile_completion_rate"
  | "profile_checklist_item_completed"
  | "profile_next_step_clicked"
  | "profile_celebration_shown"
  | "plan_selected"
  | "billing_period_toggled"
  | "fast_preview_loading_started"
  | "fast_preview_loading_completed"
  | "start_page_viewed"
  | "start_option_clicked"
  | "preview_custom_front_cover_uploaded"
  // Performance monitoring events
  | "performance_lcp"
  | "performance_fid"
  | "performance_cls"
  | "performance_fcp"
  | "performance_page_load"
  | "performance_resource_load"
  | "performance_custom_mark"
  // Preview engagement events
  | "preview_time_on_page"
  | "preview_scroll_depth"
  | "preview_chapter_changed"
  | "preview_error_caught"
  | "preview_error_retry"
  | "preview_manual_error"
  | "global_error_caught"
  | "global_error_reset"
  | "global_error_go_home"
  | "manual_error_reported";

type AnalyticsPayload = {
  event: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null | undefined>;
  pathname: string;
  timestamp: string;
};

const EVENT_ENDPOINT = "/api/events";
const EVENT_ONCE_STORAGE_PREFIX = "book-generator:analytics-once:";
const eventOnceCache = new Map<string, number>();

function shouldTrackEventOnce(key: string, ttlMs: number) {
  if (typeof window === "undefined") return false;

  const now = Date.now();
  const storageKey = `${EVENT_ONCE_STORAGE_PREFIX}${key}`;
  const cachedAt = eventOnceCache.get(storageKey);
  if (typeof cachedAt === "number" && now - cachedAt < ttlMs) {
    return false;
  }

  try {
    const storedAt = Number(window.sessionStorage.getItem(storageKey));
    if (Number.isFinite(storedAt) && now - storedAt < ttlMs) {
      eventOnceCache.set(storageKey, storedAt);
      return false;
    }
    window.sessionStorage.setItem(storageKey, String(now));
  } catch {
    // no-op
  }

  eventOnceCache.set(storageKey, now);
  return true;
}

export function trackEvent(
  event: AnalyticsEventName,
  properties: AnalyticsPayload["properties"] = {},
) {
  if (typeof window === "undefined") return;

  const payload: AnalyticsPayload = {
    event,
    properties,
    pathname: window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  const win = window as Window & { dataLayer?: Array<Record<string, unknown>>; gtag?: (...args: unknown[]) => void };
  if (Array.isArray(win.dataLayer)) {
    win.dataLayer.push(payload);
  } else {
    win.dataLayer = [payload];
  }

  if (typeof win.gtag === "function") {
    win.gtag("event", event, properties ?? {});
  }

  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(EVENT_ENDPOINT, blob);
      return;
    }
  } catch {
    // no-op
  }

  void fetch(EVENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // no-op
  });
}

export function trackEventOnce(
  event: AnalyticsEventName,
  properties: AnalyticsPayload["properties"] = {},
  options: {
    key?: string;
    ttlMs?: number;
  } = {},
) {
  const key = options.key || event;
  const ttlMs = options.ttlMs ?? 30 * 60 * 1000; // 30 minutes default

  if (!shouldTrackEventOnce(key, ttlMs)) {
    return;
  }

  trackEvent(event, properties);
}
