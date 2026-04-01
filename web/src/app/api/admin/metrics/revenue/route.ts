import { requireAdminApiAccess } from "@/lib/admin/api";
import { getRevenueMetrics } from "@/lib/admin/queries";

export async function GET() {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  return Response.json(await getRevenueMetrics());
}
