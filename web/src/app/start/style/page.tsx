import type { Metadata } from "next";

import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Stil | Book Generator",
  description: "Dil, ton ve kapak yönünü seçerek preview kalitesini belirle.",
  path: "/start/style",
  noIndex: true,
});

export default function StartStylePage() {
  return <GuidedWizardScreen step="style" />;
}
