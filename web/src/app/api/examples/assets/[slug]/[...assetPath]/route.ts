import { readFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { resolvePublicExampleAsset } from "@/lib/examples-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".epub": "application/epub+zip",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; assetPath: string[] }> },
) {
  const { slug, assetPath } = await context.params;
  const asset = await resolvePublicExampleAsset(slug, assetPath);

  if (!asset) {
    return NextResponse.json({ ok: false, error: "Asset bulunamadı." }, { status: 404 });
  }

  const ext = path.extname(asset.relativePath).toLowerCase();
  const buffer = await readFile(asset.absolutePath);
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
  const disposition = ext === ".epub" ? "attachment" : "inline";

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(asset.size),
      "Content-Disposition": `${disposition}; filename="${path.basename(asset.absolutePath)}"`,
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

