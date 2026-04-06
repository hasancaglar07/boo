import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { audit } from "@/lib/auth/audit";
import { hashPassword, hashToken } from "@/lib/auth/crypto";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid reset request." }, { status: 400 });
  }

  const tokenHash = hashToken(parsed.data.token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken || resetToken.consumedAt || resetToken.expiresAt <= new Date()) {
    return NextResponse.json({ ok: false, error: "Password reset link is invalid or expired." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash: await hashPassword(parsed.data.password),
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { consumedAt: new Date() },
    }),
  ]);

  await audit({
    action: "password-reset.completed",
    entityType: "user",
    entityId: resetToken.userId,
    actorUserId: resetToken.userId,
    request,
  });

  return NextResponse.json({ ok: true });
}