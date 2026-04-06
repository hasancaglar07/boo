import { z } from "zod";

import { mutationResponse, requireAdminApiAccess } from "@/lib/admin/api";
import { audit } from "@/lib/auth/audit";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  if (session.user.role !== "SUPER_ADMIN") {
    return Response.json({ ok: false, error: "Only SUPER_ADMIN can change roles." }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid role." }, { status: 400 });
  }

  const userId = (await params).id;
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
    select: { id: true, role: true },
  });

  await audit({
    action: "admin.user.role_changed",
    entityType: "user",
    entityId: userId,
    actorUserId: session.user.id,
    metadata: {
      role: parsed.data.role,
    },
  });

  return mutationResponse(updated);
}