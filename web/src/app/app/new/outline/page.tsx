import type { Metadata } from "next";

import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { requireBookStartAccess } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Bölümler | Book Generator",
  description: "Kitabın bölüm planını ve akışını uygulama içinde oluştur.",
  path: "/app/new/outline",
  noIndex: true,
});

export default async function AppNewOutlinePage() {
  await requireBookStartAccess("/app/new/outline");
  return <GuidedWizardScreen step="outline" routeBase="/app/new" shellMode="app" />;
}
