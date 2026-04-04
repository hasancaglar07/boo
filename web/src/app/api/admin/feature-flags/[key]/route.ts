import { requireAdminApiAccess } from "@/lib/admin/api";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;

  const { key } = await params;
  const body = await request.json().catch(() => null);

  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  if (!flag) {
    return Response.json({ ok: false, error: "Flag bulunamadı." }, { status: 404 });
  }

  const updated = await prisma.featureFlag.update({
    where: { key },
    data: {
      enabled: typeof body?.enabled === "boolean" ? body.enabled : !flag.enabled,
    },
  });

  return Response.json({ ok: true, flag: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;

  const { key } = await params;
  await prisma.featureFlag.delete({ where: { key } }).catch(() => null);
  return Response.json({ ok: true });
}
