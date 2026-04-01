import { csvResponse, parseListParams, requireAdminApiAccess } from "@/lib/admin/api";
import { toCsv } from "@/lib/admin/format";
import { listAdminBillingRecords } from "@/lib/admin/queries";

export async function GET(request: Request) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const base = parseListParams(url);
  const report = await listAdminBillingRecords({
    ...base,
    page: 1,
    pageSize: 1000,
    status: url.searchParams.get("status") || "all",
  });
  return csvResponse("admin-revenue.csv", toCsv(report.items));
}
