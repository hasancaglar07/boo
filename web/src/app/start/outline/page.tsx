import type { Metadata } from "next";

import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Bölümler | Book Generator",
  description: "Kitabın bölüm planını ve akışını oluştur.",
  path: "/start/outline",
  noIndex: true,
});

export default function StartOutlinePage() {
  return <GuidedWizardScreen step="outline" />;
}
