import type { Metadata } from "next";

import { UpgradeScreen } from "@/components/funnel/upgrade-screen";
import { requireBookPreviewAccess } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({
    title: `${slug} Upgrade | Book Generator`,
    description: "Upgrade to premium to unlock the full book, PDF and EPUB exports.",
    path: `/app/book/${slug}/upgrade`,
    noIndex: true,
  });
}

export default async function BookUpgradePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireBookPreviewAccess(slug, `/app/book/${slug}/upgrade`);
  return <UpgradeScreen slug={slug} />;
}