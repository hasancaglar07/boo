import type { Metadata } from "next";
import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Style | Book Generator",
  description: "Choose language, tone, and cover direction to set preview quality.",
  path: "/start/style",
  noIndex: true,
});

export default function StartStylePage() {
  return <GuidedWizardScreen step="style" />;
}
