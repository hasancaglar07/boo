import { Resend } from "resend";

import { absoluteUrl } from "@/lib/seo";
import {
  evaluateBookIdea,
  mapValidatorIntentToBookType,
  mapValidatorLanguageToFunnelLanguage,
  type BookIdeaValidatorInput,
} from "@/lib/book-idea-validator";
import { type ContactSubject, PUBLIC_BILLING_EMAIL, PUBLIC_SUPPORT_EMAIL, contactSubjectLabel } from "@/lib/contact-shared";
import { getLeadMagnetBySlug } from "@/lib/lead-magnets";
import { getGenericMarketingToolBySlug, type MarketingToolValues } from "@/lib/marketing-tools";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

export function authEmailFrom() {
  return process.env.AUTH_EMAIL_FROM || "Book Generator <noreply@bookgenerator.local>";
}

function textFromHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function supportInboxForSubject(subject: ContactSubject) {
  if (subject === "billing") {
    return process.env.BILLING_EMAIL_TO || process.env.SUPPORT_EMAIL_TO || PUBLIC_BILLING_EMAIL;
  }
  return process.env.SUPPORT_EMAIL_TO || PUBLIC_SUPPORT_EMAIL;
}

async function deliverEmail(input: { to: string; subject: string; html: string }) {
  if (resendClient) {
    await resendClient.emails.send({
      from: authEmailFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: textFromHtml(input.html),
    });
    return;
  }

  console.info("[auth-email]", {
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}

function extractCheckoutContinuationPath(url: string) {
  try {
    const parsed = new URL(url);
    const callback = parsed.searchParams.get("callbackUrl");
    if (!callback) return null;

    const target = new URL(callback, parsed.origin);
    if (target.pathname !== "/app/settings/billing") return null;
    if (target.searchParams.get("autostart") !== "1") return null;

    return `${target.pathname}${target.search}`;
  } catch {
    return null;
  }
}

export async function sendMagicLinkEmail(to: string, url: string) {
  const checkoutPath = extractCheckoutContinuationPath(url);
  const checkoutUrl = checkoutPath ? absoluteUrl(checkoutPath) : "";

  await deliverEmail({
    to,
    subject: checkoutPath ? "Book Generator login + payment link" : "Book Generator login link",
    html: checkoutPath
      ? `
      <p>Use the login link below to continue with Book Generator.</p>
      <p>If you don't have an account, you'll get a quick signup. If you do, you'll be logged in and the payment window will open automatically.</p>
      <p><a href="${url}">Quick signup / login link</a></p>
      <p><a href="${checkoutUrl}">Direct payment screen</a></p>
      <p>The link is valid for 15 minutes.</p>
    `
      : `
      <p>Use the link below to log in to Book Generator.</p>
      <p>If you don't have an account, the same link will give you a quick signup. If you do, you'll be logged in directly.</p>
      <p><a href="${url}">${url}</a></p>
      <p>The link is valid for 15 minutes.</p>
    `,
  });
}

export async function sendEmailVerificationEmail(to: string, token: string) {
  const url = absoluteUrl(`/api/auth/verify-email/confirm?token=${encodeURIComponent(token)}`);
  await deliverEmail({
    to,
    subject: "Verify your email address",
    html: `<p>Verify your email address for account security and billing notifications.</p><p><a href="${url}">${url}</a></p><p>The link is valid for 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = absoluteUrl(`/reset-password?token=${encodeURIComponent(token)}`);
  await deliverEmail({
    to,
    subject: "Reset your password",
    html: `<p>Open the link below to reset your password.</p><p><a href="${url}">${url}</a></p><p>The link is valid for 30 minutes.</p>`,
  });
}

function previewCampaignUrl(token: string) {
  return absoluteUrl(`/api/auth/preview-campaign/consume?token=${encodeURIComponent(token)}`);
}

export async function sendPreviewReadyEmail(input: {
  to: string;
  name?: string | null;
  title: string;
  slug: string;
  token: string;
}) {
  const url = previewCampaignUrl(input.token);
  await deliverEmail({
    to: input.to,
    subject: `${input.title} preview is ready`,
    html: `
      <p>${input.name ? `${input.name}, ` : ""}the first readable chapter and preview surface for your book is ready.</p>
      <p>You can review the cover for <strong>${input.title}</strong>, see locked chapters, and return to your preview page with one click.</p>
      <p><a href="${url}">Return to preview</a></p>
      <p>When ready, you can unlock the full book, PDF and EPUB export from the same page.</p>
    `,
  });
}

export async function sendPreviewRecoveryEmail(input: {
  to: string;
  name?: string | null;
  title: string;
  token: string;
  stage: "day10" | "monthly";
}) {
  const url = previewCampaignUrl(input.token);
  const subject =
    input.stage === "day10"
      ? `${input.title} bonus is still active`
      : `${input.title} preview is waiting for you`;
  const bonusLine =
    input.stage === "day10"
      ? "Bonus cover reroll and export package are waiting for you on your return."
      : "You can return to your ready preview, select a cover, and complete your book."

  await deliverEmail({
    to: input.to,
    subject,
    html: `
      <p>${input.name ? `${input.name}, ` : ""}the preview you created for ${input.title} is still ready.</p>
      <p>${bonusLine}</p>
      <p><a href="${url}">Preview'a geri dön</a></p>
      <p>These emails are sent at most once per month. You can turn them off in your account settings if you wish.</p>
    `,
  });
}

export async function sendBookIdeaReportEmail(input: {
  to: string;
  payload: BookIdeaValidatorInput;
}) {
  const result = evaluateBookIdea(input.payload);
  const previewUrl = new URL(absoluteUrl("/start/topic"));
  previewUrl.searchParams.set("topic", input.payload.topic);
  previewUrl.searchParams.set("audience", input.payload.audience);
  previewUrl.searchParams.set("language", mapValidatorLanguageToFunnelLanguage(input.payload.language));
  previewUrl.searchParams.set("bookType", mapValidatorIntentToBookType(input.payload.intent));

  const titleIdeas = result.titleIdeas.map((item) => `<li>${item}</li>`).join("");
  const outlineItems = result.miniOutline.map((item) => `<li>${item}</li>`).join("");
  const strongItems = result.strongestPoints.map((item) => `<li>${item}</li>`).join("");
  const riskItems = result.risks.map((item) => `<li>${item}</li>`).join("");

  await deliverEmail({
    to: input.to,
    subject: `Your Book Idea Validator report is ready: ${result.overallScore}/100`,
    html: `
      <p>Your Book Idea Validator report is ready.</p>
      <p><strong>Skor:</strong> ${result.overallScore}/100<br /><strong>Verdict:</strong> ${result.verdict}<br /><strong>Recommended format:</strong> ${result.recommendedFormat}</p>
      <p><strong>Recommended angle:</strong><br />${result.recommendedAngle}</p>
      <p><strong>Strengths</strong></p>
      <ul>${strongItems}</ul>
      <p><strong>Risks</strong></p>
      <ul>${riskItems}</ul>
      <p><strong>Title suggestions</strong></p>
      <ul>${titleIdeas}</ul>
      <p><strong>Mini outline</strong></p>
      <ol>${outlineItems}</ol>
      <p><strong>Next step:</strong> ${result.nextStep}</p>
      <p><a href="${previewUrl.toString()}">Move this idea to the free preview flow now</a></p>
    `,
  });
}

export async function sendGenericMarketingToolReportEmail(input: {
  to: string;
  toolSlug: string;
  values: MarketingToolValues;
}) {
  const tool = getGenericMarketingToolBySlug(input.toolSlug);
  if (!tool) {
    throw new Error("Invalid tool report request.");
  }

  const result = tool.evaluate(input.values);
  const previewUrl = absoluteUrl(tool.buildPreviewHref(input.values));
  const strongItems = result.strongestPoints.map((item) => `<li>${item}</li>`).join("");
  const riskItems = result.risks.map((item) => `<li>${item}</li>`).join("");
  const sectionHtml = result.reportSections
    .map((section) => {
      const listTag = section.ordered ? "ol" : "ul";
      const items = section.items.map((item) => `<li>${item}</li>`).join("");
      return `<p><strong>${section.title}</strong></p><${listTag}>${items}</${listTag}>`;
    })
    .join("");

  await deliverEmail({
    to: input.to,
    subject: `Your ${tool.name} report is ready: ${result.overallScore}/100`,
    html: `
      <p>Your ${tool.name} report is ready.</p>
      <p><strong>Skor:</strong> ${result.overallScore}/100<br /><strong>Verdict:</strong> ${result.verdict}<br /><strong>Recommended format:</strong> ${result.recommendedFormat}</p>
      <p><strong>Recommended angle:</strong><br />${result.recommendedAngle}</p>
      <p><strong>Strengths</strong></p>
      <ul>${strongItems}</ul>
      <p><strong>Risks</strong></p>
      <ul>${riskItems}</ul>
      ${sectionHtml}
      <p><strong>Next step:</strong> ${result.nextStep}</p>
      <p><a href="${previewUrl}">Move this angle to the free preview flow now</a></p>
    `,
  });
}

export async function sendLeadMagnetDeliveryEmail(input: {
  to: string;
  leadMagnetSlug: string;
}) {
  const leadMagnet = getLeadMagnetBySlug(input.leadMagnetSlug);
  if (!leadMagnet) {
    throw new Error("Invalid lead magnet request.");
  }

  const deliveryHtml = leadMagnet.deliverySections
    .map((section) => {
      const tag = section.ordered ? "ol" : "ul";
      const items = section.items.map((item) => `<li>${item}</li>`).join("");
      return `<p><strong>${section.title}</strong></p><${tag}>${items}</${tag}>`;
    })
    .join("");

  const instantAccessHtml = leadMagnet.instantAccessItems.map((item) => `<li>${item}</li>`).join("");
  const nextStepUrl = absoluteUrl(leadMagnet.nextStepHref);
  const secondaryUrl = absoluteUrl(leadMagnet.secondaryCtaHref);

  await deliverEmail({
    to: input.to,
    subject: `Your ${leadMagnet.title} is ready`,
    html: `
      <p>Your ${leadMagnet.title} is ready.</p>
      <p>${leadMagnet.description}</p>
      ${deliveryHtml}
      <p><strong>Quick steps you can apply right now</strong></p>
      <ul>${instantAccessHtml}</ul>
      <p><a href="${nextStepUrl}">${leadMagnet.nextStepLabel}</a></p>
      <p><a href="${secondaryUrl}">${leadMagnet.secondaryCtaLabel}</a></p>
    `,
  });
}

export async function sendContactRequestEmails(input: {
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
}) {
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safeMessage = escapeHtml(input.message).replace(/\n/g, "<br />");
  const subjectLabel = contactSubjectLabel(input.subject);
  const safeSubjectLabel = escapeHtml(subjectLabel);
  const inbox = supportInboxForSubject(input.subject);

  await deliverEmail({
    to: inbox,
    subject: `[Contact] ${subjectLabel} - ${input.name}`,
    html: `
      <p>A new contact request has been submitted.</p>
      <p><strong>Name:</strong> ${safeName}<br /><strong>Email:</strong> ${safeEmail}<br /><strong>Subject:</strong> ${safeSubjectLabel}</p>
      <p><strong>Message</strong></p>
      <p>${safeMessage}</p>
    `,
  });

  await deliverEmail({
    to: input.email,
    subject: "We received your message",
    html: `
      <p>We received your message.</p>
      <p><strong>Subject:</strong> ${safeSubjectLabel}</p>
      <p>Our team will get back to you as soon as possible. You can share additional context from the contact page if needed.</p>
      <p><strong>Your submitted message</strong></p>
      <p>${safeMessage}</p>
    `,
  });
}