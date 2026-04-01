import type { Metadata } from "next";

import { BillingScreen } from "@/components/app/billing-screen";
import { requireAuthenticatedUser } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Faturalama | Book Generator",
  description: "Planını ve premium erişimini yönet.",
  path: "/app/settings/billing",
  noIndex: true,
});

export default async function AppSettingsBillingPage() {
  await requireAuthenticatedUser("/app/settings/billing");
  return <BillingScreen />;
}
