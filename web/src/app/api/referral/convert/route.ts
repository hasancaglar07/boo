import { NextResponse, type NextRequest } from "next/server";

import { handleReferralConversion } from "@/lib/referral";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const newUserId = typeof body?.newUserId === "string" ? body.newUserId : null;
  const refCode = typeof body?.refCode === "string" ? body.refCode.trim().toUpperCase() : null;

  if (!newUserId || !refCode) {
    return NextResponse.json({ ok: false, error: "newUserId and refCode required" }, { status: 400 });
  }

  await handleReferralConversion(prisma, newUserId, refCode);

  return NextResponse.json({ ok: true });
}
