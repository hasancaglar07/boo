import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { type BookPlanId } from "@/lib/auth/constants";
import { audit } from "@/lib/auth/audit";
import { canAccessBookPreview, recordCheckoutEntitlement, viewerFromIds } from "@/lib/auth/data";

const schema = z.object({
  planId: z.enum(["starter", "creator", "pro", "premium"]),
  bookSlug: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Oturum gerekli." }, { status: 401 });
  }

  if (!session.user.emailVerified) {
    return NextResponse.json(
      { ok: false, code: "EMAIL_NOT_VERIFIED", error: "Satın alma öncesi e-posta doğrulaması gerekli." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Geçersiz plan isteği." }, { status: 400 });
  }

  const planId = parsed.data.planId as BookPlanId;
  if (planId === "premium" && !parsed.data.bookSlug) {
    return NextResponse.json({ ok: false, error: "Tek kitap premium için slug gerekli." }, { status: 400 });
  }

  if (
    parsed.data.bookSlug &&
    !(await canAccessBookPreview(viewerFromIds(session.user.id, null), parsed.data.bookSlug))
  ) {
    return NextResponse.json({ ok: false, error: "Bu kitap için ödeme iznin yok." }, { status: 403 });
  }

  await audit({
    action: "checkout.started",
    entityType: "user",
    entityId: session.user.id,
    actorUserId: session.user.id,
    request,
    metadata: {
      planId,
      bookSlug: parsed.data.bookSlug || null,
    },
  });

  await recordCheckoutEntitlement({
    userId: session.user.id,
    planId,
    bookSlug: parsed.data.bookSlug || null,
  });
  await audit({
    action: "checkout.completed",
    entityType: "user",
    entityId: session.user.id,
    actorUserId: session.user.id,
    request,
    metadata: {
      planId,
      bookSlug: parsed.data.bookSlug || null,
    },
  });
  await audit({
    action: "entitlement.changed",
    entityType: "user",
    entityId: session.user.id,
    actorUserId: session.user.id,
    request,
    metadata: {
      planId,
      bookSlug: parsed.data.bookSlug || null,
    },
  });

  return NextResponse.json({ ok: true, planId });
}
