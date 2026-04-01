import { listResponse, parseListParams, requireAdminApiAccess } from "@/lib/admin/api";
import { listAdminAuditLogs } from "@/lib/admin/queries";

export async function GET(request: Request) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const base = parseListParams(url);
  return listResponse(
    await listAdminAuditLogs({
      ...base,
      action: url.searchParams.get("action") || "all",
    }),
  );
}
