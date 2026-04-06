import type { Metadata } from "next";
import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { requireBookStartAccess } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Title | Book Generator",
  description: "Refine your book title and subtitle with AI assistance within the app.",
  path: "/app/new/title",
  noIndex: true,
});

export default async function AppNewTitlePage() {
  await requireBookStartAccess("/app/new/title");
  return <GuidedWizardScreen step="title" routeBase="/app/new" shellMode="app" />;
}
