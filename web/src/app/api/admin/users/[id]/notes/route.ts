import { z } from "zod";

import { mutationResponse, requireAdminApiAccess } from "@/lib/admin/api";
import { audit } from "@/lib/auth/audit";
import { createAdminNote } from "@/lib/admin/queries";

const schema = z.object({
  body: z.string().trim().min(2).max(2000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Geçersiz not." }, { status: 400 });
  }

  const userId = (await params).id;
  const note = await createAdminNote({
    entityType: "user",
    entityId: userId,
    body: parsed.data.body,
    createdByUserId: session.user.id,
  });

  await audit({
    action: "admin.user.note_created",
    entityType: "user",
    entityId: userId,
    actorUserId: session.user.id,
    metadata: {
      noteId: note.id,
    },
  });

  return mutationResponse({
    id: note.id,
    body: note.body,
    createdAt: note.createdAt.toISOString(),
  });
}
