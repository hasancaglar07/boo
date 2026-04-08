import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/admin/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;

  const { key } = await params;
  // TODO: Implement feature flag retrieval
  return NextResponse.json({ key, value: null, enabled: false });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;

  const { key } = await params;
  const body = await request.json();
  // TODO: Implement feature flag update
  return NextResponse.json({ key, ...body, updated: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const session = await requireAdminApiAccess();
  if (session instanceof Response) return session;

  const { key } = await params;
  // TODO: Implement feature flag deletion
  return NextResponse.json({ key, deleted: true });
}
