import { z } from "zod";

import { mutationResponse, requireAdminApiAccess } from "@/lib/admin/api";
import { audit } from "@/lib/auth/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  action: z.enum(["cancel", "reactivate"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Geçersiz abonelik işlemi." }, { status: 400 });
  }

  const id = (await params).id;
  const updated = await prisma.entitlement.update({
    where: { id },
    data:
      parsed.data.action === "cancel"
        ? { status: "canceled", endsAt: new Date() }
        : { status: "active", endsAt: null },
  });

  await audit({
    action: `admin.subscription.${parsed.data.action}`,
    entityType: "entitlement",
    entityId: id,
    actorUserId: session.user.id,
    metadata: {
      planId: updated.planId,
      userId: updated.userId,
    },
  });

  return mutationResponse({
    id: updated.id,
    status: updated.status,
  });
}
