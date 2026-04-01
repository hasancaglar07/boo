import { requireAdminApiAccess } from "@/lib/admin/api";
import { getFunnelAnalytics } from "@/lib/admin/queries";

export async function GET(request: Request) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const url = new URL(request.url);
  return Response.json(
    await getFunnelAnalytics({
      from: url.searchParams.get("from") || "",
      to: url.searchParams.get("to") || "",
    }),
  );
}
