import { detailResponse, requireAdminApiAccess } from "@/lib/admin/api";
import { getAdminUserDetail } from "@/lib/admin/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;

  const detail = await getAdminUserDetail((await params).id, session.user.role);
  if (!detail) {
    return Response.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  return detailResponse(detail);
}
