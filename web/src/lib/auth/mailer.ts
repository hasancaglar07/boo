import { Resend } from "resend";

import { absoluteUrl } from "@/lib/seo";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

export function authEmailFrom() {
  return process.env.AUTH_EMAIL_FROM || "Book Generator <noreply@bookgenerator.local>";
}

function textFromHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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

export async function sendMagicLinkEmail(to: string, url: string) {
  await deliverEmail({
    to,
    subject: "Book Generator giriş bağlantın",
    html: `<p>Book Generator'a giriş yapmak için aşağıdaki bağlantıyı kullan.</p><p><a href="${url}">${url}</a></p><p>Bağlantı 15 dakika boyunca geçerlidir.</p>`,
  });
}

export async function sendEmailVerificationEmail(to: string, token: string) {
  const url = absoluteUrl(`/api/auth/verify-email/confirm?token=${encodeURIComponent(token)}`);
  await deliverEmail({
    to,
    subject: "E-posta adresini doğrula",
    html: `<p>Satın alma ve export işlemlerini açmak için e-posta adresini doğrula.</p><p><a href="${url}">${url}</a></p><p>Bağlantı 24 saat boyunca geçerlidir.</p>`,
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
