import { mutationResponse, requireAdminApiAccess } from "@/lib/admin/api";
import { audit } from "@/lib/auth/audit";

const BACKEND_ORIGIN =
  process.env.DASHBOARD_ORIGIN ||
  process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN ||
  "http://127.0.0.1:8765";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;

  const slug = (await params).slug;
  const response = await fetch(
    new URL(`/api/books/${encodeURIComponent(slug)}/preview-bootstrap`, BACKEND_ORIGIN),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trigger: "admin",
        bypass_manual_retry_limit: true,
      }),
      cache: "no-store",
    },
  ).catch(() => null);

  if (!response?.ok) {
    return Response.json({ ok: false, error: "Failed to restart the preview pipeline." }, { status: 502 });
  }

  await audit({
    action: "admin.book.preview_retried",
    entityType: "book",
    entityId: slug,
    actorUserId: session.user.id,
  });

  return mutationResponse({ slug, started: true });
}
