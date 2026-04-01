import { NextResponse, type NextRequest } from "next/server";

import { audit } from "@/lib/auth/audit";
import { hashToken } from "@/lib/auth/crypto";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  if (!token) {
    return NextResponse.redirect(new URL("/login?verified=0", request.url));
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
  });

  if (!record || record.expiresAt <= new Date()) {
    return NextResponse.redirect(new URL("/login?verified=0", request.url));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.delete({
      where: { id: record.id },
    }),
  ]);
  await audit({
    action: "email-verification.completed",
    entityType: "user",
    entityId: record.userId,
    actorUserId: record.userId,
    request,
  });

  return NextResponse.redirect(new URL("/login?verified=1", request.url));
}
