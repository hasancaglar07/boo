import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getAuthStateForUser } from "@/lib/auth/data";
import { prisma } from "@/lib/prisma";
import { fulfillStripeCheckoutBySessionId } from "@/lib/stripe/checkout-fulfillment";

const schema = z.object({
  sessionId: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ ok: false, error: "Oturum gerekli." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid checkout verification request." }, { status: 400 });
  }

  const fulfillment = await fulfillStripeCheckoutBySessionId(parsed.data.sessionId, {
    expectedUserId: session.user.id,
  });

  if (!fulfillment.ok) {
    if (fulfillment.code === "USER_MISMATCH") {
      return NextResponse.json({ ok: false, error: fulfillment.error }, { status: 403 });
    }
    if (fulfillment.code === "SESSION_NOT_PAID") {
      return NextResponse.json({ ok: false, error: fulfillment.error }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: fulfillment.error }, { status: 400 });
  }

  if (fulfillment.fulfilled) {
    await prisma.auditLog.create({
      data: {
        action: "checkout.completed",
        entityType: "user",
        entityId: session.user.id,
        actorUserId: session.user.id,
        metadata: {
          planId: fulfillment.planId,
          bookSlug: fulfillment.bookSlug || null,
          stripeSessionId: fulfillment.stripeSessionId,
          source: "stripe_confirm",
          alreadyFulfilled: false,
        },
      },
    });
  }

  const state = await getAuthStateForUser(session.user.id, session.user.email);
  return NextResponse.json({
    ok: true,
    fulfilled: fulfillment.fulfilled,
    alreadyFulfilled: fulfillment.alreadyFulfilled,
    planId: state.planId,
    usage: {
      ...state.usage,
      resetAt: state.usage.resetAt?.toISOString() || null,
    },
  });
}