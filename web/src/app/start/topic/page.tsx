import type { Metadata } from "next";

import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Konu | Book Generator",
  description: "Konu, hedef okur ve kitap yönünü kayıtsız başlat.",
  path: "/start/topic",
  noIndex: true,
});

export default function StartTopicPage() {
  return <GuidedWizardScreen step="topic" />;
}
