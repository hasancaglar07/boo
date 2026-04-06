import type { Metadata } from "next";

import { AffiliateDashboard } from "@/components/app/affiliate-dashboard";
import { requireAuthenticatedUser } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Affiliate Paneli | Book Generator",
  description: "Affiliate linkini kopyala, paylaş ve %30 komisyon kazan.",
  path: "/app/affiliate",
  noIndex: true,
});

export default async function AppAffiliatePage() {
  await requireAuthenticatedUser("/app/affiliate");
  return <AffiliateDashboard />;
}
