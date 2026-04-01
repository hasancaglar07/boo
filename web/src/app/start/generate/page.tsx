import type { Metadata } from "next";

import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Oluştur | Book Generator",
  description: "Kitap önizlemesini üret ve signup bridge ile hesabına bağla.",
  path: "/start/generate",
  noIndex: true,
});

export default function StartGeneratePage() {
  return <GuidedWizardScreen step="generate" />;
}
