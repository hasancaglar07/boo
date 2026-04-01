import type { Metadata } from "next";

import { WorkspaceScreen } from "@/components/app/workspace-screen";
import { requireBookWorkspaceAccess } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({
    title: `${slug} Workspace | Book Generator`,
    description: "Kitabın tam çalışma alanı.",
    path: `/app/book/${slug}/workspace`,
    noIndex: true,
  });
}

export default async function BookWorkspaceRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;
  await requireBookWorkspaceAccess(slug, `/app/book/${slug}/workspace`);
  return <WorkspaceScreen slug={slug} initialTab={tab} />;
}
