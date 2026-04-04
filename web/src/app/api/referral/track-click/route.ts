import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : null;

  if (!code) {
    return NextResponse.json({ ok: false, error: "Code required" }, { status: 400 });
  }

  const referralCode = await prisma.referralCode.findUnique({ where: { code } });
  if (!referralCode) {
    return NextResponse.json({ ok: false, error: "Invalid code" }, { status: 404 });
  }

  await prisma.referralCode.update({
    where: { code },
    data: { clicks: { increment: 1 } },
  });

  await prisma.analyticsEvent.create({
    data: {
      eventName: "referral_code_clicked",
      properties: { code, referrerId: referralCode.userId },
    },
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("ref_code", code, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });

  return response;
}

