import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { audit } from "@/lib/auth/audit";
import { canAccessBookPreview, getGuestIdentityFromCookies, requestMeta, viewerFromIds } from "@/lib/auth/data";

const schema = z.object({
  variantId: z.string().trim().min(1),
});

const BACKEND_ORIGIN =
  process.env.DASHBOARD_ORIGIN ||
  process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN ||
  "http://127.0.0.1:8765";

async function backendJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(new URL(path, BACKEND_ORIGIN), {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const payload = (await response.json().catch(() => null)) as T | null;
  if (!response.ok || !payload) {
    throw new Error(
      (payload as { error?: string } | null)?.error || "Kapak seçimi güncellenemedi.",
    );
  }
  return payload;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Geçersiz kapak seçimi." }, { status: 400 });
  }

  const session = await auth();
  const guest = await getGuestIdentityFromCookies();
  const allowed = await canAccessBookPreview(
    viewerFromIds(session?.user?.id || null, guest?.id || null),
    slug,
  );

  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Bu kitap için kapak seçimi yapamazsın." }, { status: 403 });
  }

  const existing = await backendJson<Record<string, unknown>>(`/api/books/${encodeURIComponent(slug)}`);
  const updated = await backendJson<Record<string, unknown>>("/api/books", {
    method: "POST",
    body: JSON.stringify({
      ...existing,
      slug,
      selected_cover_variant: parsed.data.variantId,
    }),
  });

  await audit({
    action: "preview.cover_variant.selected",
    entityType: "book",
    entityId: slug,
    actorUserId: session?.user?.id || null,
    guestIdentityId: guest?.id || null,
    request,
    metadata: {
      variantId: parsed.data.variantId,
      ipHash: requestMeta(request).ipHash,
    },
  });

  return NextResponse.json({
    ok: true,
    selectedVariantId: parsed.data.variantId,
    book: updated,
  });
}
