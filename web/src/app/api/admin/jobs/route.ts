import { requireAdminApiAccess } from "@/lib/admin/api";
import { listAdminJobs } from "@/lib/admin/queries";

export async function GET(request: Request) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const summaryOnly = url.searchParams.get("summary") === "1";
  return Response.json(await listAdminJobs({ summaryOnly }));
}
