import type Stripe from "stripe";
import { Prisma } from "@prisma/client";

import { type BookPlanId } from "@/lib/auth/constants";
import { recordCheckoutEntitlement } from "@/lib/auth/data";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

type FulfillmentCode =
  | "MISSING_METADATA"
  | "INVALID_PLAN"
  | "USER_MISMATCH"
  | "SESSION_NOT_PAID";

type ParsedMetadata = {
  userId: string;
  planId: BookPlanId;
  bookSlug: string | null;
};

export type StripeCheckoutFulfillmentResult =
  | {
      ok: true;
      fulfilled: boolean;
      alreadyFulfilled: boolean;
      stripeSessionId: string;
      userId: string;
      planId: BookPlanId;
      bookSlug: string | null;
    }
  | {
      ok: false;
      code: FulfillmentCode;
      error: string;
      stripeSessionId: string;
      userId?: string;
      planId?: BookPlanId;
      bookSlug?: string | null;
    };

const PLAN_IDS = new Set<BookPlanId>(["starter", "creator", "pro", "premium"]);

function parseMetadata(session: Stripe.Checkout.Session): ParsedMetadata | null {
  const userId = session.metadata?.userId?.trim();
  const rawPlanId = session.metadata?.planId?.trim().toLowerCase() as BookPlanId | undefined;
  const bookSlug = session.metadata?.bookSlug?.trim() || null;

  if (!userId || !rawPlanId) return null;
  if (!PLAN_IDS.has(rawPlanId)) return null;

  return {
    userId,
    planId: rawPlanId,
    bookSlug,
  };
}

function isSessionPaid(session: Stripe.Checkout.Session) {
  if (session.payment_status === "paid") return true;
  if (session.mode === "subscription" && session.status === "complete") return true;
  return false;
}

export async function fulfillStripeCheckoutSession(
  session: Stripe.Checkout.Session,
  input?: { expectedUserId?: string | null },
): Promise<StripeCheckoutFulfillmentResult> {
  const metadata = parseMetadata(session);
  if (!metadata) {
    return {
      ok: false,
      code: "MISSING_METADATA",
      error: "Checkout metadata is missing.",
      stripeSessionId: session.id,
    };
  }

  if (!PLAN_IDS.has(metadata.planId)) {
    return {
      ok: false,
      code: "INVALID_PLAN",
      error: "Checkout plan information is invalid.",
      stripeSessionId: session.id,
      userId: metadata.userId,
      bookSlug: metadata.bookSlug,
    };
  }

  if (input?.expectedUserId && input.expectedUserId !== metadata.userId) {
    return {
      ok: false,
      code: "USER_MISMATCH",
      error: "Checkout session belongs to a different user.",
      stripeSessionId: session.id,
      userId: metadata.userId,
      planId: metadata.planId,
      bookSlug: metadata.bookSlug,
    };
  }

  if (!isSessionPaid(session)) {
    return {
      ok: false,
      code: "SESSION_NOT_PAID",
      error: "Checkout payment has not been completed.",
      stripeSessionId: session.id,
      userId: metadata.userId,
      planId: metadata.planId,
      bookSlug: metadata.bookSlug,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const marker = await tx.stripeCheckoutFulfillment.create({
        data: {
          stripeSessionId: session.id,
          userId: metadata.userId,
          planId: metadata.planId,
          bookSlug: metadata.bookSlug,
          status: "processing",
        },
      });

      const entitlement = await recordCheckoutEntitlement(
        {
          userId: metadata.userId,
          planId: metadata.planId,
          bookSlug: metadata.bookSlug,
        },
        tx,
      );

      await tx.stripeCheckoutFulfillment.update({
        where: { id: marker.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          entitlementId: entitlement.entitlementId,
        },
      });
    });

    return {
      ok: true,
      fulfilled: true,
      alreadyFulfilled: false,
      stripeSessionId: session.id,
      userId: metadata.userId,
      planId: metadata.planId,
      bookSlug: metadata.bookSlug,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        ok: true,
        fulfilled: false,
        alreadyFulfilled: true,
        stripeSessionId: session.id,
        userId: metadata.userId,
        planId: metadata.planId,
        bookSlug: metadata.bookSlug,
      };
    }
    throw error;
  }
}

export async function fulfillStripeCheckoutBySessionId(
  sessionId: string,
  input?: { expectedUserId?: string | null },
) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return fulfillStripeCheckoutSession(session, input);
}
