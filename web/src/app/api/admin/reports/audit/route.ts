import { csvResponse, parseListParams, requireAdminApiAccess } from "@/lib/admin/api";
import { toCsv } from "@/lib/admin/format";
import { listAdminAuditLogs } from "@/lib/admin/queries";

export async function GET(request: Request) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const base = parseListParams(url);
  const report = await listAdminAuditLogs({
    ...base,
    page: 1,
    pageSize: 1000,
    action: url.searchParams.get("action") || "all",
  });
  return csvResponse("admin-audit-log.csv", toCsv(report.items));
}