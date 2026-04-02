import type { Metadata } from "next";

import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { requireBookStartAccess } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Oluştur | Book Generator",
  description: "Kitap önizlemesini uygulama içinde üret ve hesabınla devam et.",
  path: "/app/new/generate",
  noIndex: true,
});

export default async function AppNewGeneratePage() {
  await requireBookStartAccess("/app/new/generate");
  return <GuidedWizardScreen step="generate" routeBase="/app/new" shellMode="app" />;
}
