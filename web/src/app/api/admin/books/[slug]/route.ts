import { detailResponse, requireAdminApiAccess } from "@/lib/admin/api";
import { getAdminBookDetail } from "@/lib/admin/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const detail = await getAdminBookDetail((await params).slug);
  if (!detail) {
    return Response.json({ ok: false, error: "Kitap bulunamadı." }, { status: 404 });
  }
  return detailResponse(detail);
}
