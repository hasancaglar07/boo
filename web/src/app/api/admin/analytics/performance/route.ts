import { notConfigured, requireAdminApiAccess } from "@/lib/admin/api";

export async function GET() {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  return notConfigured("performance_metrics");
}
