import { requireAdminApiAccess } from "@/lib/admin/api";
import { getCohortAnalysis } from "@/lib/admin/queries";

export async function GET(request: Request) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const months = Math.max(3, Number(url.searchParams.get("months") || 6));
  return Response.json(await getCohortAnalysis(months));
}
