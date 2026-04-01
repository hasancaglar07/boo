import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { EMAIL_ACTION_RATE_LIMIT, EMAIL_VERIFICATION_TTL_SECONDS } from "@/lib/auth/constants";
import { audit } from "@/lib/auth/audit";
import { hashToken, randomToken } from "@/lib/auth/crypto";
import { sendEmailVerificationEmail } from "@/lib/auth/mailer";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ ok: false, error: "Oturum gerekli." }, { status: 401 });
  }

  const rateLimit = await consumeRateLimit({
    scope: "verify-email-resend",
    key: session.user.email,
    ...EMAIL_ACTION_RATE_LIMIT,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "Doğrulama maili sınırına ulaşıldı." }, { status: 429 });
  }

  const rawToken = randomToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: session.user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_SECONDS * 1000),
    },
  });
  await sendEmailVerificationEmail(session.user.email, rawToken);
  await audit({
    action: "email-verification.sent",
    entityType: "user",
    entityId: session.user.id,
    actorUserId: session.user.id,
  });

  return NextResponse.json({ ok: true });
}
