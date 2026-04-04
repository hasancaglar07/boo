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

export default async function AppSettingsBillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "string" && value) {
      params.set(key, value);
    }
  }

  const nextPath = `/app/settings/billing${params.size ? `?${params.toString()}` : ""}`;
  await requireAuthenticatedUser(nextPath);
  return <BillingScreen />;
}
