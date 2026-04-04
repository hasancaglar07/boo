import { requireAdminApiAccess } from "@/lib/admin/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;

  const flags = await prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
  return Response.json({ flags });
}

export async function POST(request: Request) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;

  const body = await request.json().catch(() => null);
  const { key, label, description } = body || {};
  if (!key || !label) {
    return Response.json({ ok: false, error: "key ve label zorunlu." }, { status: 400 });
  }

  const flag = await prisma.featureFlag.create({
    data: { key, label, description: description || "", enabled: false },
  });

  return Response.json({ ok: true, flag });
}
