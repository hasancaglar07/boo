import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { canAccessBookPreview, viewerFromIds } from "@/lib/auth/data";
import { audit } from "@/lib/auth/audit";
import { PLAN_PRICES_CENTS, PLAN_LABELS, SUBSCRIPTION_PLANS, type BookPlanId } from "@/lib/auth/constants";
import { getStripe } from "@/lib/stripe";

const schema = z.object({
  planId: z.enum(["starter", "creator", "pro", "premium"]),
  bookSlug: z.string().trim().optional(),
});

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

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ ok: false, error: "Session required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid plan request." }, { status: 400 });
  }

  const planId = parsed.data.planId as BookPlanId;
  const bookSlug = parsed.data.bookSlug || null;

  if (planId === "premium" && !bookSlug) {
    return NextResponse.json({ ok: false, error: "Slug required for single book premium." }, { status: 400 });
  }

  if (
    bookSlug &&
    !(await canAccessBookPreview(viewerFromIds(session.user.id, null), bookSlug))
  ) {
    return NextResponse.json({ ok: false, error: "You don't have payment permission for this book." }, { status: 403 });
  }

  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const successUrl = bookSlug
    ? `${appUrl}/app/book/${encodeURIComponent(bookSlug)}/preview?checkout=success&session_id={CHECKOUT_SESSION_ID}`
    : `${appUrl}/app/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = bookSlug
    ? `${appUrl}/app/book/${encodeURIComponent(bookSlug)}/upgrade?checkout=cancelled`
    : `${appUrl}/app/settings/billing?checkout=cancelled`;

  const amountCents = PLAN_PRICES_CENTS[planId];
  const planLabel = PLAN_LABELS[planId] || planId;
  const isSubscription = SUBSCRIPTION_PLANS.has(planId);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    customer_email: session.user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Book Generator — ${planLabel}`,
            description: bookSlug
              ? `"${bookSlug}" full access for book`
              : `${planLabel} plan aktivasyonu`,
          },
          ...(isSubscription
            ? { recurring: { interval: "month" }, unit_amount: amountCents }
            : { unit_amount: amountCents }),
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: session.user.id,
      planId,
      bookSlug: bookSlug || "",
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });

  await audit({
    action: "checkout.started",
    entityType: "user",
    entityId: session.user.id,
    actorUserId: session.user.id,
    request,
    metadata: { planId, bookSlug, stripeSessionId: checkoutSession.id },
  });

  return NextResponse.json({ ok: true, url: checkoutSession.url });
}