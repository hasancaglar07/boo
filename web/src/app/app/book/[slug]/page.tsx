import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({
    title: `${slug} | Book Generator Workspace`,
    description: "Book Generator book workspace.",
    path: `/app/book/${slug}`,
    noIndex: true,
  });
}

export default async function BookWorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/app/book/${encodeURIComponent(slug)}/preview`);
}