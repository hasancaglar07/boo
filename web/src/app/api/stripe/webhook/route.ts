import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing stripe signature" }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    // TODO: Verify webhook signature
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    return NextResponse.json({ ok: true, received: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 },
    );
  }
}
