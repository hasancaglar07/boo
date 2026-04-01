import { listResponse, parseListParams, requireAdminApiAccess } from "@/lib/admin/api";
import { listAdminUsers } from "@/lib/admin/queries";

export async function GET(request: Request) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const base = parseListParams(url);
  return listResponse(
    await listAdminUsers({
      ...base,
      plan: url.searchParams.get("plan") || "all",
      status: url.searchParams.get("status") || "all",
      role: url.searchParams.get("role") || "all",
    }),
  );
}
