import type { Metadata } from "next";
import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Chapters | Book Generator",
  description: "Build your book's chapter plan and flow.",
  path: "/start/outline",
  noIndex: true,
});

export default function StartOutlinePage() {
  return <GuidedWizardScreen step="outline" />;
}
