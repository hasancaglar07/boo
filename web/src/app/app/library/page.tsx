import type { Metadata } from "next";

import { HomeScreen } from "@/components/app/home-screen";
import { requireAuthenticatedUser } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Kitaplarım | Book Generator",
  description: "Kitaplarını, önizlemelerini ve dışa aktarma akışını yönet.",
  path: "/app/library",
  noIndex: true,
});

export default async function AppLibraryPage() {
  await requireAuthenticatedUser("/app/library");
  return <HomeScreen />;
}
