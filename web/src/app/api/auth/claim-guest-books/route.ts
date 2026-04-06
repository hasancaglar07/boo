import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { audit } from "@/lib/auth/audit";
import { getGuestIdentityFromCookies, claimGuestBooksForUser } from "@/lib/auth/data";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Session required." }, { status: 401 });
  }

  const guest = await getGuestIdentityFromCookies();
  if (!guest) {
    return NextResponse.json({ ok: true, claimed: false });
  }

  const claimedCount = await claimGuestBooksForUser({
    userId: session.user.id,
    guestIdentityId: guest.id,
  });

  if (claimedCount > 0) {
    await audit({
      action: "guest-book.claimed",
      entityType: "guest_identity",
      entityId: guest.id,
      actorUserId: session.user.id,
      guestIdentityId: guest.id,
      metadata: {
        claimedCount,
      },
    });

    await prisma.analyticsEvent.create({
      data: {
        eventName: "draft_merged_to_user",
        pathname: "/api/auth/claim-guest-books",
        properties: {
          claimed_count: claimedCount,
          flow_id: guest.id,
        } as never,
        userId: session.user.id,
        guestIdentityId: guest.id,
      },
    });
  }

  return NextResponse.json({ ok: true, claimed: claimedCount > 0, claimedCount });
}