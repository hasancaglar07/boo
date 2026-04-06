import { z } from "zod";

import { mutationResponse, notConfigured, requireAdminApiAccess } from "@/lib/admin/api";
import { audit } from "@/lib/auth/audit";
import { getAdminSettingsPayload, updateFeatureFlag } from "@/lib/admin/queries";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("feature_flag"),
    id: z.string().min(1),
    enabled: z.boolean(),
  }),
  z.object({
    action: z.literal("backend_settings"),
    payload: z.record(z.string(), z.unknown()),
  }),
]);

const BACKEND_ORIGIN =
  process.env.DASHBOARD_ORIGIN ||
  process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN ||
  "http://127.0.0.1:8765";

export async function GET() {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  return Response.json(await getAdminSettingsPayload());
}

export async function POST(request: Request) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Invalid admin setting." }, { status: 400 });
  }

  if (parsed.data.action === "feature_flag") {
    const flag = await updateFeatureFlag({
      id: parsed.data.id,
      enabled: parsed.data.enabled,
    });
    await audit({
      action: "admin.settings.feature_flag_updated",
      entityType: "feature_flag",
      entityId: flag.id,
      actorUserId: session.user.id,
      metadata: {
        key: flag.key,
        enabled: flag.enabled,
      },
    });
    return mutationResponse(flag);
  }

  const response = await fetch(new URL("/api/settings", BACKEND_ORIGIN), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parsed.data.payload),
    cache: "no-store",
  }).catch(() => null);

  if (!response?.ok) {
    return notConfigured("backend_settings_write");
  }

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  await audit({
    action: "admin.settings.backend_updated",
    entityType: "settings",
    entityId: "backend",
    actorUserId: session.user.id,
  });
  return mutationResponse(payload || {});
}