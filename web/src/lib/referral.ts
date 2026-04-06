import { PrismaClient } from "@prisma/client";

// ── Affiliate Commission Constants ──
// Every registered user can earn 30% commission from their affiliate link.
// The referred user MUST sign up via the affiliate link — this is mandatory.
export const AFFILIATE_COMMISSION_RATE = 0.30; // 30%
export const AFFILIATE_MIN_PAYOUT_USD = 50;

// Excludes visually ambiguous characters: 0, O, I, l
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export async function generateUniqueCode(prisma: PrismaClient): Promise<string> {
  let code = generateCode();
  let exists = await prisma.referralCode.findUnique({ where: { code } });
  while (exists) {
    code = generateCode();
    exists = await prisma.referralCode.findUnique({ where: { code } });
  }
  return code;
}

/**
 * Ensures a user has a referral/affiliate code.
 * Called during signup and on first visit to the affiliate panel.
 * Every registered member automatically gets an affiliate link.
 */
export async function ensureReferralCode(
  prisma: PrismaClient,
  userId: string,
): Promise<{ code: string; clicks: number }> {
  const existing = await prisma.referralCode.findUnique({ where: { userId } });
  if (existing) return { code: existing.code, clicks: existing.clicks };

  const code = await generateUniqueCode(prisma);
  const created = await prisma.referralCode.create({
    data: { userId, code },
  });
  return { code: created.code, clicks: created.clicks };
}

/**
 * Called when a new user signs up or visits with a ?ref= parameter.
 * The ref code is mandatory for affiliate conversion — users must be
 * referred via an affiliate link to be tracked.
 */
export async function handleReferralConversion(
  prisma: PrismaClient,
  newUserId: string,
  refCode: string,
): Promise<void> {
  const referralCode = await prisma.referralCode.findUnique({
    where: { code: refCode },
  });

  if (!referralCode) return;
  if (referralCode.userId === newUserId) return; // self-referral guard

  try {
    await prisma.referralConversion.create({
      data: {
        referralCodeId: referralCode.id,
        newUserId,
        rewardGranted: false,
        rewardType: "commission_30pct",
      },
    });

    await prisma.analyticsEvent.create({
      data: {
        userId: newUserId,
        eventName: "referral_converted",
        properties: { refCode, referrerId: referralCode.userId },
      },
    });
  } catch (err: unknown) {
    // P2002 = unique constraint violation (user already converted)
    if ((err as { code?: string }).code !== "P2002") {
      console.error("[referral] convert error:", err);
    }
  }
}

/**
 * Grants the referrer a 30% commission reward when the referred user
 * completes a qualifying payment (subscription).
 */
export async function grantReferrerReward(
  prisma: PrismaClient,
  conversionId: string,
  referrerId: string,
  commissionAmountCents: number,
): Promise<void> {
  await prisma.$transaction([
    prisma.billingRecord.create({
      data: {
        userId: referrerId,
        planId: "affiliate_commission",
        kind: "manual_adjustment",
        status: "paid",
        amount: commissionAmountCents,
        description: `Affiliate commission — 30% (${(commissionAmountCents / 100).toFixed(2)} USD)`,
      },
    }),
    prisma.referralConversion.update({
      where: { id: conversionId },
      data: { rewardGranted: true },
    }),
  ]);

  await prisma.analyticsEvent.create({
    data: {
      userId: referrerId,
      eventName: "referral_reward_granted",
      properties: { conversionId, commissionAmountCents },
    },
  });
}

/**
 * Calculate 30% commission from a subscription amount (in cents).
 */
export function calculateCommission(subscriptionAmountCents: number): number {
  return Math.round(subscriptionAmountCents * AFFILIATE_COMMISSION_RATE);
}
