import type { Metadata } from "next";
import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Generate | Book Generator",
  description: "Generate your book preview and link it to your account via the signup bridge.",
  path: "/start/generate",
  noIndex: true,
});

export default function StartGeneratePage() {
  return <GuidedWizardScreen step="generate" />;
}
