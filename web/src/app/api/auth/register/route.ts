import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

import { resolveBootstrapRole } from "@/lib/auth/bootstrap";
import { EMAIL_ACTION_RATE_LIMIT, EMAIL_VERIFICATION_TTL_SECONDS } from "@/lib/auth/constants";
import { audit } from "@/lib/auth/audit";
import { findUserByEmail } from "@/lib/auth/data";
import { hashPassword, hashToken, normalizeEmail, randomToken } from "@/lib/auth/crypto";
import { sendEmailVerificationEmail } from "@/lib/auth/mailer";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { prisma } from "@/lib/prisma";
import { handleReferralConversion } from "@/lib/referral";

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  goal: z.string().trim().max(500).optional().default(""),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Geçersiz kayıt alanları." }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const rateLimit = await consumeRateLimit({
    scope: "register",
    key: email,
    ...EMAIL_ACTION_RATE_LIMIT,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "Çok fazla kayıt denemesi yapıldı." }, { status: 429 });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ ok: false, error: "Bu e-posta ile zaten bir hesap var." }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const role = await resolveBootstrapRole(email);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash,
      goal: parsed.data.goal.trim(),
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      goal: true,
      role: true,
    },
  });

  const verificationToken = randomToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(verificationToken),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_SECONDS * 1000),
    },
  });
  await sendEmailVerificationEmail(user.email, verificationToken);
  await audit({
    action: "email-verification.sent",
    entityType: "user",
    entityId: user.id,
    actorUserId: user.id,
    request,
  });
  await audit({
    action: "signup.completed",
    entityType: "user",
    entityId: user.id,
    actorUserId: user.id,
    request,
  });

  // Non-blocking referral conversion
  try {
    const cookieStore = await cookies();
    const refCode = cookieStore.get("ref_code")?.value;
    if (refCode) {
      void handleReferralConversion(prisma, user.id, refCode);
    }
  } catch {
    // never fail registration due to referral errors
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      goal: user.goal,
      role: user.role,
    },
  });
}
