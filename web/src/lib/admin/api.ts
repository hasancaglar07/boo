import { NextResponse } from "next/server";

import { auth } from "@/auth";
import type { AdminDetailResponse, AdminListResponse } from "@/lib/admin/types";

const MAX_PAGE_SIZE = 100;

export async function requireAdminApiAccess() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Admin oturumu gerekli." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, error: "Admin yetkisi gerekli." }, { status: 403 });
  }

  return session;
}

export function parseListParams(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(10, Number(url.searchParams.get("pageSize") || 25)),
  );
  const order: "asc" | "desc" = url.searchParams.get("order") === "asc" ? "asc" : "desc";

  return {
    page,
    pageSize,
    q: url.searchParams.get("q")?.trim() || "",
    sort: url.searchParams.get("sort")?.trim() || "createdAt",
    order,
    from: url.searchParams.get("from") || "",
    to: url.searchParams.get("to") || "",
  };
}

export function listResponse<T>(payload: AdminListResponse<T>) {
  return NextResponse.json(payload);
}

export function detailResponse<T, R>(payload: AdminDetailResponse<T, R>) {
  return NextResponse.json(payload);
}

export function mutationResponse<T>(item?: T) {
  return NextResponse.json({ ok: true, ...(item ? { item } : {}) });
}

export function notConfigured(feature: string) {
  return NextResponse.json(
    { ok: false, code: "NOT_CONFIGURED", feature },
    { status: 501 },
  );
}

export function csvResponse(filename: string, content: string) {
  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
