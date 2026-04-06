import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { authStateLabel, getGuestIdentityFromCookies } from "@/lib/auth/data";
import { prisma } from "@/lib/prisma";

type EventPayload = {
  event?: string;
  properties?: Record<string, unknown>;
  pathname?: string;
  timestamp?: string;
};

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let payload: EventPayload;

  try {
    payload = (await request.json()) as EventPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (!payload.event || typeof payload.event !== "string") {
    return NextResponse.json({ ok: false, error: "event field is required." }, { status: 400 });
  }

  const session = await auth();
  const guest = await getGuestIdentityFromCookies();
  const pathname = payload.pathname || "/";
  const matchedSlug =
    typeof payload.properties?.slug === "string"
      ? String(payload.properties.slug)
      : pathname.match(/\/app\/book\/([^/]+)/)?.[1] || null;
  const properties = {
    anonymous_id: guest?.id || null,
    auth_state: authStateLabel({
      authenticated: Boolean(session?.user?.id),
      emailVerified: Boolean(session?.user?.emailVerified),
    }),
    book_slug: matchedSlug,
    flow_id: matchedSlug || guest?.id || session?.user?.id || null,
    ...(payload.properties || {}),
  };

  await prisma.analyticsEvent.create({
    data: {
      eventName: payload.event,
      pathname,
      properties: properties as never,
      userId: session?.user?.id || null,
      guestIdentityId: guest?.id || null,
    },
  });

  console.info("[analytics]", {
    event: payload.event,
    pathname,
    timestamp: payload.timestamp || new Date().toISOString(),
    properties,
  });

  return NextResponse.json({ ok: true });
}