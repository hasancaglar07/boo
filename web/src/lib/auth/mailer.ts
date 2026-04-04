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
    subject: checkoutPath ? "Book Generator giriş + ödeme bağlantın" : "Book Generator giriş bağlantın",
    html: checkoutPath
      ? `
      <p>Book Generator'a devam etmek için aşağıdaki giriş bağlantısını kullan.</p>
      <p>Hesabın yoksa hızlı kayıt, hesabın varsa giriş yapılır ve ödeme penceresi otomatik açılır.</p>
      <p><a href="${url}">Hızlı kayıt / giriş bağlantısı</a></p>
      <p><a href="${checkoutUrl}">Doğrudan ödeme ekranı</a></p>
      <p>Bağlantı 15 dakika boyunca geçerlidir.</p>
    `
      : `
      <p>Book Generator'a giriş yapmak için aşağıdaki bağlantıyı kullan.</p>
      <p>Hesabın yoksa aynı bağlantı ile hızlı kayıt olur, varsa doğrudan giriş yaparsın.</p>
      <p><a href="${url}">${url}</a></p>
      <p>Bağlantı 15 dakika boyunca geçerlidir.</p>
    `,
  });
}

export async function sendEmailVerificationEmail(to: string, token: string) {
  const url = absoluteUrl(`/api/auth/verify-email/confirm?token=${encodeURIComponent(token)}`);
  await deliverEmail({
    to,
    subject: "E-posta adresini doğrula",
    html: `<p>Hesap güvenliği ve fatura bildirimleri için e-posta adresini doğrula.</p><p><a href="${url}">${url}</a></p><p>Bağlantı 24 saat boyunca geçerlidir.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = absoluteUrl(`/reset-password?token=${encodeURIComponent(token)}`);
  await deliverEmail({
    to,
    subject: "Şifreni sıfırla",
    html: `<p>Şifreni sıfırlamak için aşağıdaki bağlantıyı aç.</p><p><a href="${url}">${url}</a></p><p>Bağlantı 30 dakika boyunca geçerlidir.</p>`,
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
    subject: `${input.title} preview'ın hazır`,
    html: `
      <p>${input.name ? `${input.name}, ` : ""}kitabın için ilk okunabilir bölüm ve preview yüzeyi hazır.</p>
      <p><strong>${input.title}</strong> için kapağı inceleyebilir, kilitli bölümleri görebilir ve tek tıkla kaldığın preview sayfasına dönebilirsin.</p>
      <p><a href="${url}">Preview'a dön</a></p>
      <p>Hazır olunca tam kitabı, PDF ve EPUB export'u aynı sayfadan açabilirsin.</p>
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
      ? `${input.title} için bonus hâlâ aktif`
      : `${input.title} preview'ın seni bekliyor`;
  const bonusLine =
    input.stage === "day10"
      ? "Dönüşünde bonus cover reroll ve export paketi seni bekliyor."
      : "Hazır preview'ına geri dönüp kapağı seçebilir ve kitabını tamamlayabilirsin.";

  await deliverEmail({
    to: input.to,
    subject,
    html: `
      <p>${input.name ? `${input.name}, ` : ""}${input.title} için hazırladığın preview hâlâ hazır durumda.</p>
      <p>${bonusLine}</p>
      <p><a href="${url}">Preview'a geri dön</a></p>
      <p>Bu e-postalar ayda en fazla bir kez gönderilir. İstersen hesap ayarlarından kapatabilirsin.</p>
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
    subject: `Book Idea Validator raporun hazır: ${result.overallScore}/100`,
    html: `
      <p>Book Idea Validator raporun hazır.</p>
      <p><strong>Skor:</strong> ${result.overallScore}/100<br /><strong>Verdict:</strong> ${result.verdict}<br /><strong>Önerilen format:</strong> ${result.recommendedFormat}</p>
      <p><strong>Önerilen açı:</strong><br />${result.recommendedAngle}</p>
      <p><strong>Güçlü yönler</strong></p>
      <ul>${strongItems}</ul>
      <p><strong>Riskler</strong></p>
      <ul>${riskItems}</ul>
      <p><strong>Başlık önerileri</strong></p>
      <ul>${titleIdeas}</ul>
      <p><strong>Mini outline</strong></p>
      <ol>${outlineItems}</ol>
      <p><strong>Sonraki adım:</strong> ${result.nextStep}</p>
      <p><a href="${previewUrl.toString()}">Bu fikri şimdi ücretsiz preview akışına taşı</a></p>
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
    throw new Error("Geçersiz tool report isteği.");
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
    subject: `${tool.name} raporun hazır: ${result.overallScore}/100`,
    html: `
      <p>${tool.name} raporun hazır.</p>
      <p><strong>Skor:</strong> ${result.overallScore}/100<br /><strong>Verdict:</strong> ${result.verdict}<br /><strong>Önerilen format:</strong> ${result.recommendedFormat}</p>
      <p><strong>Önerilen açı:</strong><br />${result.recommendedAngle}</p>
      <p><strong>Güçlü yönler</strong></p>
      <ul>${strongItems}</ul>
      <p><strong>Riskler</strong></p>
      <ul>${riskItems}</ul>
      ${sectionHtml}
      <p><strong>Sonraki adım:</strong> ${result.nextStep}</p>
      <p><a href="${previewUrl}">Bu açıyı şimdi ücretsiz preview akışına taşı</a></p>
    `,
  });
}

export async function sendLeadMagnetDeliveryEmail(input: {
  to: string;
  leadMagnetSlug: string;
}) {
  const leadMagnet = getLeadMagnetBySlug(input.leadMagnetSlug);
  if (!leadMagnet) {
    throw new Error("Geçersiz lead magnet isteği.");
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
    subject: `${leadMagnet.title} hazır`,
    html: `
      <p>${leadMagnet.title} hazır.</p>
      <p>${leadMagnet.description}</p>
      ${deliveryHtml}
      <p><strong>Hemen uygulayabileceğin hızlı adımlar</strong></p>
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
      <p>Yeni bir iletişim talebi gönderildi.</p>
      <p><strong>Ad:</strong> ${safeName}<br /><strong>E-posta:</strong> ${safeEmail}<br /><strong>Konu:</strong> ${safeSubjectLabel}</p>
      <p><strong>Mesaj</strong></p>
      <p>${safeMessage}</p>
    `,
  });

  await deliverEmail({
    to: input.email,
    subject: "Mesajını aldık",
    html: `
      <p>Mesajını aldık.</p>
      <p><strong>Konu:</strong> ${safeSubjectLabel}</p>
      <p>Ekibimiz en kısa sürede sana geri dönecek. Gerekirse iletişim sayfasından ek bağlam paylaşabilirsin.</p>
      <p><strong>Gönderdiğin mesaj</strong></p>
      <p>${safeMessage}</p>
    `,
  });
}
