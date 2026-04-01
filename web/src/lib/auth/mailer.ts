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
