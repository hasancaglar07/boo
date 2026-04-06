import type { Metadata } from "next";

import { AccountScreen } from "@/components/app/account-screen";
import { requireAuthenticatedUser } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Account Settings | Book Generator",
  description: "Manage your Book Generator account and profile settings.",
  path: "/app/settings/profile",
  noIndex: true,
});

export default async function AppSettingsProfilePage() {
  await requireAuthenticatedUser("/app/settings/profile");
  return <AccountScreen />;
}
