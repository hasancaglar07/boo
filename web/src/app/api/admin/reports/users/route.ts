import { csvResponse, parseListParams, requireAdminApiAccess } from "@/lib/admin/api";
import { toCsv } from "@/lib/admin/format";
import { listAdminUsers } from "@/lib/admin/queries";

export async function GET(request: Request) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const base = parseListParams(url);
  const report = await listAdminUsers({
    ...base,
    page: 1,
    pageSize: 1000,
    plan: url.searchParams.get("plan") || "all",
    status: url.searchParams.get("status") || "all",
    role: url.searchParams.get("role") || "all",
  });
  return csvResponse("admin-users.csv", toCsv(report.items));
}
