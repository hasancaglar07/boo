import type { Metadata } from "next";

import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Başlık | Book Generator",
  description: "Kitap başlığını ve alt başlığını AI yardımıyla netleştir.",
  path: "/start/title",
  noIndex: true,
});

export default function StartTitlePage() {
  return <GuidedWizardScreen step="title" />;
}
