import { requireAdminApiAccess } from "@/lib/admin/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;

  const [codes, totalConversions, rewardedConversions] = await Promise.all([
    prisma.referralCode.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        conversions: {
          include: {
            newUser: { select: { id: true, name: true, email: true, createdAt: true } },
          },
        },
      },
      orderBy: { clicks: "desc" },
      take: 100,
    }),
    prisma.referralConversion.count(),
    prisma.referralConversion.count({ where: { rewardGranted: true } }),
  ]);

  const totalClicks = codes.reduce((sum, c) => sum + c.clicks, 0);
  const totalCodes = codes.length;

  // Fetch commission amounts per referrer
  const referrerIds = codes.map((c) => c.userId);

  const commissionRecords = await prisma.billingRecord.findMany({
    where: {
      userId: { in: referrerIds },
      planId: "affiliate_commission",
      status: "paid",
    },
  });

  const commissionByUser = new Map<string, number>();
  for (const r of commissionRecords) {
    const uid = r.userId ?? "";
    commissionByUser.set(uid, (commissionByUser.get(uid) || 0) + r.amount);
  }

  // Fetch payout requests
  const payoutRequests = await prisma.billingRecord.findMany({
    where: {
      userId: { in: referrerIds },
      planId: "affiliate_payout",
    },
    orderBy: { createdAt: "desc" },
  });

  const payoutsByUser = new Map<string, typeof payoutRequests>();
  for (const p of payoutRequests) {
    const uid = p.userId ?? "";
    const arr = payoutsByUser.get(uid) || [];
    arr.push(p);
    payoutsByUser.set(uid, arr);
  }

  const referrers = codes.map((code) => {
    const totalCommissionCents = commissionByUser.get(code.userId) || 0;
    const userPayouts = payoutsByUser.get(code.userId) || [];
    const paidOutCents = userPayouts
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Math.abs(p.amount), 0);
    const pendingPayoutCents = userPayouts
      .filter((p) => p.status === "open" || p.status === "draft")
      .reduce((sum, p) => sum + Math.abs(p.amount), 0);
    const balance = Math.max(0, totalCommissionCents - paidOutCents - pendingPayoutCents) / 100;

    return {
      id: code.id,
      code: code.code,
      clicks: code.clicks,
      conversions: code.conversions.length,
      rewardsGranted: code.conversions.filter((c) => c.rewardGranted).length,
      createdAt: code.createdAt.toISOString(),
      totalCommission: totalCommissionCents / 100,
      paidOut: paidOutCents / 100,
      pendingPayout: pendingPayoutCents / 100,
      balance,
      user: {
        id: code.user.id,
        name: code.user.name,
        email: code.user.email,
      },
      latestConversions: code.conversions.slice(-5).reverse().map((c) => ({
        newUserId: c.newUser.id,
        newUserEmail: c.newUser.email,
        newUserName: c.newUser.name,
        convertedAt: c.convertedAt.toISOString(),
        rewardGranted: c.rewardGranted,
      })),
      payoutRequests: userPayouts.slice(0, 10).map((p) => ({
        id: p.id,
        amount: Math.abs(p.amount) / 100,
        status: p.status,
        date: p.createdAt.toISOString(),
        description: p.description,
        metadata: p.metadata,
      })),
    };
  });

  return Response.json({
    summary: {
      totalCodes,
      totalClicks,
      totalConversions,
      rewardedConversions,
      conversionRate: totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 100) : 0,
      totalCommissionPaid: commissionRecords.reduce((sum, r) => sum + r.amount, 0) / 100,
    },
    referrers,
  });
}
