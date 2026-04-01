import { listResponse, parseListParams, requireAdminApiAccess } from "@/lib/admin/api";
import { listAdminSubscriptions } from "@/lib/admin/queries";

export async function GET(request: Request) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const base = parseListParams(url);
  return listResponse(
    await listAdminSubscriptions({
      ...base,
      plan: url.searchParams.get("plan") || "all",
      status: url.searchParams.get("status") || "all",
    }),
  );
}
