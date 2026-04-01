import { NextResponse, type NextRequest } from "next/server";

import { recordCheckoutEntitlement } from "@/lib/auth/data";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { type BookPlanId } from "@/lib/auth/constants";

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

    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId as BookPlanId | undefined;
    const bookSlug = session.metadata?.bookSlug || null;

    if (!userId || !planId) {
      console.error("Webhook: metadata eksik", { userId, planId, sessionId: session.id });
      return NextResponse.json({ ok: false, error: "Metadata eksik." }, { status: 400 });
    }

    try {
      await recordCheckoutEntitlement({ userId, planId, bookSlug });

      await prisma.auditLog.create({
        data: {
          action: "checkout.completed",
          entityType: "user",
          entityId: userId,
          actorUserId: userId,
          metadata: {
            planId,
            bookSlug: bookSlug || null,
            stripeSessionId: session.id,
            source: "stripe_webhook",
          },
        },
      });

      console.log(`Stripe checkout tamamlandı: userId=${userId} planId=${planId} bookSlug=${bookSlug}`);
    } catch (err) {
      console.error("Entitlement kaydedilemedi:", err);
      return NextResponse.json({ ok: false, error: "Entitlement hatası." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
