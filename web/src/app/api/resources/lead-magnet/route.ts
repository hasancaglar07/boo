import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { EMAIL_ACTION_RATE_LIMIT } from "@/lib/auth/constants";
import { audit } from "@/lib/auth/audit";
import { normalizeEmail } from "@/lib/auth/crypto";
import { getGuestIdentityFromCookies } from "@/lib/auth/data";
import { sendLeadMagnetDeliveryEmail } from "@/lib/auth/mailer";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { getLeadMagnetBySlug } from "@/lib/lead-magnets";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  leadMagnetSlug: z.string().min(1),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Invalid lead magnet request." },
      { status: 400 },
    );
  }

  const leadMagnet = getLeadMagnetBySlug(parsed.data.leadMagnetSlug);
  if (!leadMagnet) {
    return NextResponse.json({ ok: false, error: "Resource not found." }, { status: 404 });
  }

  const session = await auth();
  const guest = await getGuestIdentityFromCookies();
  const email = normalizeEmail(parsed.data.email);

  const rateLimit = await consumeRateLimit({
    scope: "lead-magnet-delivery",
    key: `${leadMagnet.slug}:${email}:${guest?.id || session?.user?.id || "anon"}`,
    ...EMAIL_ACTION_RATE_LIMIT,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  await sendLeadMagnetDeliveryEmail({
    to: email,
    leadMagnetSlug: leadMagnet.slug,
  });

  await prisma.analyticsEvent.create({
    data: {
      eventName: "lead_magnet_delivered",
      pathname: "/resources",
      userId: session?.user?.id || null,
      guestIdentityId: guest?.id || null,
      properties: {
        leadMagnet: leadMagnet.slug,
        email,
      } as never,
    },
  });

  await audit({
    action: `lead_magnet.${leadMagnet.slug}.requested`,
    entityType: "lead_magnet",
    entityId: email,
    actorUserId: session?.user?.id || null,
    guestIdentityId: guest?.id || null,
    request,
    metadata: {
      leadMagnet: leadMagnet.slug,
      title: leadMagnet.title,
    },
  });

  return NextResponse.json({ ok: true });
}