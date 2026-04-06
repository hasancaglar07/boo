import type { Metadata } from "next";
import { GuidedWizardScreen } from "@/components/funnel/guided-wizard-screen";
import { requireBookStartAccess } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Topic | Book Generator",
  description: "Set the topic, target reader, and book direction within the app.",
  path: "/app/new/topic",
  noIndex: true,
});

export default async function AppNewTopicPage() {
  await requireBookStartAccess("/app/new/topic");
  return <GuidedWizardScreen step="topic" routeBase="/app/new" shellMode="app" />;
}
