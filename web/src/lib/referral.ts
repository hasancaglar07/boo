import { PrismaClient } from "@prisma/client";

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

export async function grantReferrerReward(
  prisma: PrismaClient,
  conversionId: string,
  referrerId: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.billingRecord.create({
      data: {
        userId: referrerId,
        planId: "referral",
        kind: "manual_adjustment",
        status: "paid",
        amount: 0,
        description: "Referral reward — 1 ücretsiz kitap kredisi",
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
      properties: { conversionId },
    },
  });
}
