import { listResponse, parseListParams, requireAdminApiAccess } from "@/lib/admin/api";
import { listAdminBooks } from "@/lib/admin/queries";

export async function GET(request: Request) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  const base = parseListParams(url);

  return listResponse(
    await listAdminBooks({
      ...base,
      status: url.searchParams.get("status") || "all",
      language: url.searchParams.get("language") || "all",
      user: url.searchParams.get("user") || "all",
    }),
  );
}
