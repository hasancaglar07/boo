import type { Metadata } from "next";
import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Title | Book Generator",
  description: "Refine your book title and subtitle with AI assistance.",
  path: "/start/title",
  noIndex: true,
});

export default function StartTitlePage() {
  return <GuidedWizardScreen step="title" />;
}
