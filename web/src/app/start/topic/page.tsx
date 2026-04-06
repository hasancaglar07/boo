import type { Metadata } from "next";
import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Topic | Book Generator",
  description: "Set your topic, target reader, and book direction to get started without signing up.",
  path: "/start/topic",
  noIndex: true,
});

export default function StartTopicPage() {
  return <GuidedWizardScreen step="topic" />;
}
