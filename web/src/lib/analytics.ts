"use client";

export type AnalyticsEventName =
  | "landing_hero_cta_click"
  | "landing_cta_click"
  | "pricing_cta_click"
  | "examples_book_clicked"
  | "examples_reader_viewed"
  | "examples_export_clicked"
  | "examples_sticky_cta_clicked"
  | "examples_cta_click"
  | "faq_cta_click"
  | "quick_start_clicked"
  | "start_page_completion"
  | "register_completion"
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
  | "auth_bridge_skipped"
  | "signup_google_clicked"
  | "login_google_clicked"
  | "signup_magic_link_clicked"
  | "login_magic_link_clicked"
  | "signup_completed"
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
  | "fast_preview_loading_started"
  | "fast_preview_loading_completed"
  | "start_page_viewed"
  | "start_option_clicked";

type AnalyticsPayload = {
  event: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null | undefined>;
  pathname: string;
  timestamp: string;
};

const EVENT_ENDPOINT = "/api/events";

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

  const win = window as Window & { dataLayer?: Array<Record<string, unknown>> };
  if (Array.isArray(win.dataLayer)) {
    win.dataLayer.push(payload);
  } else {
    win.dataLayer = [payload];
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
