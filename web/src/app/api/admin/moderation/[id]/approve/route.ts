import { z } from "zod";

import { mutationResponse, requireAdminApiAccess } from "@/lib/admin/api";
import { audit } from "@/lib/auth/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  action: z.enum(["approve", "reject", "request_revision"]).default("approve"),
  notes: z.string().trim().max(2000).optional().default(""),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Geçersiz moderasyon isteği." }, { status: 400 });
  }

  const id = (await params).id;
  const status =
    parsed.data.action === "approve"
      ? "approved"
      : parsed.data.action === "reject"
        ? "rejected"
        : "revision_requested";

  const updated = await prisma.moderationReview.update({
    where: { id },
    data: {
      status,
      notes: parsed.data.notes,
      reviewerUserId: session.user.id,
      reviewedAt: new Date(),
    },
  });

  await audit({
    action: `admin.moderation.${parsed.data.action}`,
    entityType: "moderation_review",
    entityId: updated.id,
    actorUserId: session.user.id,
    metadata: {
      bookSlug: updated.bookSlug,
    },
  });

  return mutationResponse({
    id: updated.id,
    status: updated.status,
  });
}
