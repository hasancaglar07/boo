import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { generateUniqueCode } from "@/lib/referral";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://bookgenerator.net";

export async function GET(_request: NextRequest) {
  void _request;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let referralCode = await prisma.referralCode.findUnique({ where: { userId } });

  if (!referralCode) {
    const code = await generateUniqueCode(prisma);
    referralCode = await prisma.referralCode.create({
      data: { userId, code },
    });
  }

  // Fetch conversions for this affiliate
  const conversions = await prisma.referralConversion.findMany({
    where: { referralCodeId: referralCode.id },
    include: {
      newUser: { select: { name: true, email: true, createdAt: true } },
    },
    orderBy: { convertedAt: "desc" },
    take: 50,
  });

  // Calculate total earned commission from billing records
  const commissionRecords = await prisma.billingRecord.findMany({
    where: {
      userId,
      planId: "affiliate_commission",
      status: "paid",
    },
    orderBy: { createdAt: "desc" },
  });

  const totalEarnedCents = commissionRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalEarned = totalEarnedCents / 100;

  // Pending payouts: conversions where reward not yet granted
  const pendingCount = conversions.filter((c) => !c.rewardGranted).length;
  const rewardedCount = conversions.filter((c) => c.rewardGranted).length;

  // Payout requests
  const payoutRequests = await prisma.billingRecord.findMany({
    where: {
      userId,
      planId: "affiliate_payout",
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const paidOutCents = payoutRequests
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);
  const paidOut = paidOutCents / 100;

  const pendingPayoutCents = payoutRequests
    .filter((r) => r.status === "open" || r.status === "draft")
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);
  const pendingPayout = pendingPayoutCents / 100;

  const availableBalance = Math.max(0, totalEarned - paidOut - pendingPayout);

  return NextResponse.json({
    ok: true,
    code: referralCode.code,
    clicks: referralCode.clicks,
    referralUrl: `${BASE_URL}/?ref=${referralCode.code}`,
    // Earnings
    totalEarned,
    availableBalance,
    paidOut,
    pendingPayout,
    // Conversions
    totalConversions: conversions.length,
    rewardedConversions: rewardedCount,
    pendingConversions: pendingCount,
    conversions: conversions.map((c) => ({
      newUserEmail: c.newUser.email,
      newUserName: c.newUser.name,
      convertedAt: c.convertedAt.toISOString(),
      rewardGranted: c.rewardGranted,
    })),
    // Recent commissions
    recentCommissions: commissionRecords.slice(0, 20).map((r) => ({
      amount: r.amount / 100,
      description: r.description,
      date: r.createdAt.toISOString(),
    })),
    // Payout requests
    payoutRequests: payoutRequests.map((r) => ({
      id: r.id,
      amount: Math.abs(r.amount) / 100,
      status: r.status,
      date: r.createdAt.toISOString(),
      description: r.description,
    })),
  });
}
