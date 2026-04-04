import type { Metadata } from "next";

import { BookPreviewScreen } from "@/components/funnel/book-preview-screen";
import { requireBookPreviewAccess } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({
    title: `${slug} Preview | Book Generator`,
    description: "Kitabın kapağını, taslağını ve ilk %20 önizlemesini görüntüle.",
    path: `/app/book/${slug}/preview`,
    noIndex: true,
  });
}

export default async function BookPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireBookPreviewAccess(slug, `/app/book/${slug}/preview`);
  return <BookPreviewScreen slug={slug} />;
}
