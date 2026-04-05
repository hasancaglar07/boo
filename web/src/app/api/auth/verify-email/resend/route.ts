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

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });
  if (!dbUser?.email) {
    return NextResponse.json({ ok: false, error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  if (dbUser.emailVerified) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: "E-posta zaten doğrulanmış.",
    });
  }

  const trustedProvider = await prisma.account.findFirst({
    where: {
      userId: dbUser.id,
      provider: {
        in: ["google", "email"],
      },
    },
    select: {
      id: true,
    },
  });
  if (trustedProvider) {
    const verifiedAt = new Date();
    await prisma.user.updateMany({
      where: {
        id: dbUser.id,
        emailVerified: null,
      },
      data: {
        emailVerified: verifiedAt,
      },
    });
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: "Bu giriş yöntemi için ek e-posta doğrulaması gerekmiyor.",
    });
  }

  const rateLimit = await consumeRateLimit({
    scope: "verify-email-resend",
    key: dbUser.email,
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
  await sendEmailVerificationEmail(dbUser.email, rawToken);
  await audit({
    action: "email-verification.sent",
    entityType: "user",
    entityId: session.user.id,
    actorUserId: session.user.id,
  });

  return NextResponse.json({ ok: true });
}
