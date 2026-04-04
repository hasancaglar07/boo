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

  const referrers = codes.map((code) => ({
    id: code.id,
    code: code.code,
    clicks: code.clicks,
    conversions: code.conversions.length,
    rewardsGranted: code.conversions.filter((c) => c.rewardGranted).length,
    createdAt: code.createdAt.toISOString(),
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
  }));

  return Response.json({
    summary: {
      totalCodes,
      totalClicks,
      totalConversions,
      rewardedConversions,
      conversionRate: totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 100) : 0,
    },
    referrers,
  });
}
