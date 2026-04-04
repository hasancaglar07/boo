import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { EMAIL_ACTION_RATE_LIMIT } from "@/lib/auth/constants";
import { audit } from "@/lib/auth/audit";
import { normalizeEmail } from "@/lib/auth/crypto";
import { getGuestIdentityFromCookies } from "@/lib/auth/data";
import { sendContactRequestEmails } from "@/lib/auth/mailer";
import { type ContactSubject, contactSubjectLabel } from "@/lib/contact-shared";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/auth/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(160),
  subject: z.enum(["technical", "billing", "account", "content", "other"]),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(200).optional().default(""),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Geçersiz iletişim isteği." },
      { status: 400 },
    );
  }

  if (parsed.data.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const session = await auth();
  const guest = await getGuestIdentityFromCookies();
  const email = normalizeEmail(parsed.data.email);

  const rateLimit = await consumeRateLimit({
    scope: "contact-form",
    key: `${email}:${guest?.id || session?.user?.id || "anon"}`,
    ...EMAIL_ACTION_RATE_LIMIT,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Çok sık mesaj gönderildi. Birkaç dakika sonra tekrar dene." },
      { status: 429 },
    );
  }

  await sendContactRequestEmails({
    name: parsed.data.name,
    email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  await prisma.analyticsEvent.create({
    data: {
      eventName: "contact_form_submitted",
      pathname: "/contact",
      userId: session?.user?.id || null,
      guestIdentityId: guest?.id || null,
      properties: {
        subject: parsed.data.subject,
        subjectLabel: contactSubjectLabel(parsed.data.subject as ContactSubject),
      } as never,
    },
  });

  await audit({
    action: `contact.${parsed.data.subject}.submitted`,
    entityType: "contact_message",
    entityId: email,
    actorUserId: session?.user?.id || null,
    guestIdentityId: guest?.id || null,
    request,
    metadata: {
      name: parsed.data.name,
      email,
      subject: parsed.data.subject,
      subjectLabel: contactSubjectLabel(parsed.data.subject as ContactSubject),
      message: parsed.data.message,
    },
  });

  return NextResponse.json({ ok: true });
}
