import type { Metadata } from "next";

import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { requireBookStartAccess } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Stil | Book Generator",
  description: "Dil, ton ve kapak yönünü uygulama içinde seçerek preview kalitesini belirle.",
  path: "/app/new/style",
  noIndex: true,
});

export default async function AppNewStylePage() {
  await requireBookStartAccess("/app/new/style");
  return <GuidedWizardScreen step="style" routeBase="/app/new" shellMode="app" />;
}
