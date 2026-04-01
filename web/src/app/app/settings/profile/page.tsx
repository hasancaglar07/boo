import type { Metadata } from "next";

import { AccountScreen } from "@/components/app/account-screen";
import { requireAuthenticatedUser } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Hesap Ayarları | Book Generator",
  description: "Book Generator hesap ve profil ayarlarını yönetin.",
  path: "/app/settings/profile",
  noIndex: true,
});

export default async function AppSettingsProfilePage() {
  await requireAuthenticatedUser("/app/settings/profile");
  return <AccountScreen />;
}
