import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { EMAIL_ACTION_RATE_LIMIT, PASSWORD_RESET_TTL_SECONDS } from "@/lib/auth/constants";
import { audit } from "@/lib/auth/audit";
import { findUserByEmail } from "@/lib/auth/data";
import { hashToken, normalizeEmail, randomToken } from "@/lib/auth/crypto";
import { sendPasswordResetEmail } from "@/lib/auth/mailer";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Geçersiz e-posta." }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const rateLimit = await consumeRateLimit({
    scope: "password-reset-request",
    key: email,
    ...EMAIL_ACTION_RATE_LIMIT,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "Çok fazla sıfırlama denemesi yapıldı." }, { status: 429 });
  }

  const user = await findUserByEmail(email);
  if (user?.passwordHash) {
    const rawToken = randomToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_SECONDS * 1000),
      },
    });
    await sendPasswordResetEmail(user.email, rawToken);
    await audit({
      action: "password-reset.requested",
      entityType: "user",
      entityId: user.id,
      actorUserId: user.id,
      request,
    });
  }

  return NextResponse.json({ ok: true });
}
