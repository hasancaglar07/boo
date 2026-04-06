import { z } from "zod";

import { mutationResponse, requireAdminApiAccess } from "@/lib/admin/api";
import { audit } from "@/lib/auth/audit";
import { PLAN_LABELS, PLAN_CURRENCY } from "@/lib/auth/constants";
import { changeUserPlan } from "@/lib/admin/queries";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  planId: z.enum(["free", "starter", "creator", "pro", "premium"]),
  reason: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;

  // Only ADMIN and SUPER_ADMIN can change plans
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return Response.json({ ok: false, error: "You don't have permission to change plans." }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid plan ID. Options: free, starter, creator, pro, premium" }, { status: 400 });
  }

  const userId = (await params).id;

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { entitlements: true } });
  if (!user) {
    return Response.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  const result = await changeUserPlan(userId, parsed.data.planId, session.user.id, parsed.data.reason);

  await audit({
    action: "admin.user.plan_changed",
    entityType: "user",
    entityId: userId,
    actorUserId: session.user.id,
    metadata: {
      oldPlan: result.oldPlan,
      newPlan: parsed.data.planId,
      newPlanLabel: PLAN_LABELS[parsed.data.planId] || parsed.data.planId,
      reason: parsed.data.reason || null,
    },
  });

  return mutationResponse({
    id: userId,
    plan: parsed.data.planId,
    planLabel: PLAN_LABELS[parsed.data.planId] || parsed.data.planId,
  });
}