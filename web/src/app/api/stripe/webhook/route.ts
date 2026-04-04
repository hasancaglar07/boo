import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { grantReferrerReward } from "@/lib/referral";
import { fulfillStripeCheckoutSession } from "@/lib/stripe/checkout-fulfillment";

export async function POST(request: NextRequest) {
  let stripe;
  try {
    stripe = getStripe();
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Stripe yapılandırması eksik." },
      { status: 503 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET tanımlı değil.");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ ok: false, error: "İmza eksik." }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook imza doğrulaması başarısız:", err);
    return NextResponse.json({ ok: false, error: "Geçersiz imza." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const fulfillment = await fulfillStripeCheckoutSession(session);
    if (!fulfillment.ok) {
      console.error("Stripe checkout fulfillment failed:", {
        sessionId: session.id,
        code: fulfillment.code,
        error: fulfillment.error,
      });
      return NextResponse.json({ ok: false, error: fulfillment.error }, { status: 400 });
    }

    if (fulfillment.fulfilled) {
      await prisma.auditLog.create({
        data: {
          action: "checkout.completed",
          entityType: "user",
          entityId: fulfillment.userId,
          actorUserId: fulfillment.userId,
          metadata: {
            planId: fulfillment.planId,
            bookSlug: fulfillment.bookSlug || null,
            stripeSessionId: fulfillment.stripeSessionId,
            source: "stripe_webhook",
            alreadyFulfilled: false,
          },
        },
      });
    }

    // Grant referral reward if this user was referred and reward not yet granted.
    try {
      const conversion = await prisma.referralConversion.findUnique({
        where: { newUserId: fulfillment.userId },
        include: { referralCode: true },
      });
      if (conversion && !conversion.rewardGranted) {
        await grantReferrerReward(prisma, conversion.id, conversion.referralCode.userId);
        await prisma.auditLog.create({
          data: {
            action: "referral_reward_granted",
            entityType: "user",
            entityId: conversion.referralCode.userId,
            actorUserId: fulfillment.userId,
            metadata: { conversionId: conversion.id },
          },
        });
      }
    } catch (referralErr) {
      console.error("Referral reward grant failed (non-critical):", referralErr);
    }

    console.log(
      `Stripe checkout işlendi: userId=${fulfillment.userId} planId=${fulfillment.planId} bookSlug=${fulfillment.bookSlug} alreadyFulfilled=${fulfillment.alreadyFulfilled}`,
    );
  }

  return NextResponse.json({ ok: true });
}
