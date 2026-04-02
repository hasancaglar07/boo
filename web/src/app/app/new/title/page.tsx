import type { Metadata } from "next";

import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { requireBookStartAccess } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Başlık | Book Generator",
  description: "Kitap başlığını ve alt başlığını uygulama içinde AI yardımıyla netleştir.",
  path: "/app/new/title",
  noIndex: true,
});

export default async function AppNewTitlePage() {
  await requireBookStartAccess("/app/new/title");
  return <GuidedWizardScreen step="title" routeBase="/app/new" shellMode="app" />;
}
