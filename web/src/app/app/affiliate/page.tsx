import type { Metadata } from "next";

import { AffiliateDashboard } from "@/components/app/affiliate-dashboard";
import { requireAuthenticatedUser } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Affiliate Dashboard | Book Generator",
  description: "Copy your affiliate link, share it, and earn 30% commission.",
  path: "/app/affiliate",
  noIndex: true,
});

export default async function AppAffiliatePage() {
  await requireAuthenticatedUser("/app/affiliate");
  return <AffiliateDashboard />;
}