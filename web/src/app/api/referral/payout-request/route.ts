import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { AFFILIATE_MIN_PAYOUT_USD } from "@/lib/referral";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const body = await request.json().catch(() => null);
  const payoutMethod = typeof body?.method === "string" ? body.method : "paypal";
  const payoutEmail = typeof body?.email === "string" ? body.email.trim() : "";

  if (!payoutEmail) {
    return NextResponse.json({ ok: false, error: "Payment email address is required." }, { status: 400 });
  }

  // Check referral code exists
  const referralCode = await prisma.referralCode.findUnique({ where: { userId } });
  if (!referralCode) {
    return NextResponse.json({ ok: false, error: "You don't have an affiliate code." }, { status: 400 });
  }

  // Calculate available balance
  const commissionRecords = await prisma.billingRecord.findMany({
    where: { userId, planId: "affiliate_commission", status: "paid" },
  });
  const totalEarnedCents = commissionRecords.reduce((sum, r) => sum + r.amount, 0);

  const payoutRecords = await prisma.billingRecord.findMany({
    where: { userId, planId: "affiliate_payout" },
  });
  const alreadyRequestedCents = payoutRecords
    .filter((r) => r.status === "paid" || r.status === "open" || r.status === "draft")
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);

  const availableCents = totalEarnedCents - alreadyRequestedCents;
  const available = availableCents / 100;

  if (available < AFFILIATE_MIN_PAYOUT_USD) {
    return NextResponse.json({
      ok: false,
      error: `Minimum payout amount is ${AFFILIATE_MIN_PAYOUT_USD}. Current balance: ${available.toFixed(2)}`,
    }, { status: 400 });
  }

  // Check for existing open/draft payout request
  const existingOpen = await prisma.billingRecord.findFirst({
    where: { userId, planId: "affiliate_payout", status: { in: ["open", "draft"] } },
  });
  if (existingOpen) {
    return NextResponse.json({
      ok: false,
      error: "You already have a pending payout request. Please wait until it's processed.",
    }, { status: 400 });
  }

  // Create payout request as a negative billing record with "open" status
  const payout = await prisma.billingRecord.create({
    data: {
      userId,
      planId: "affiliate_payout",
      kind: "manual_adjustment",
      status: "open",
      amount: -availableCents,
      currency: "USD",
      description: `Affiliate payout request — $${available.toFixed(2)} via ${payoutMethod} (${payoutEmail})`,
      metadata: {
        method: payoutMethod,
        email: payoutEmail,
        requestedAt: new Date().toISOString(),
      },
    },
  });

  await prisma.analyticsEvent.create({
    data: {
      userId,
      eventName: "affiliate_payout_requested",
      properties: {
        amount: available,
        method: payoutMethod,
        email: payoutEmail,
        payoutId: payout.id,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    payout: {
      id: payout.id,
      amount: available,
      method: payoutMethod,
      email: payoutEmail,
      status: payout.status,
      date: payout.createdAt.toISOString(),
    },
  });
}