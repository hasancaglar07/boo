import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Hesap Ayarları | Book Generator",
  description: "Eski hesap URL'i. Yeni ayarlar yolu /app/settings/profile.",
  path: "/account",
  noIndex: true,
});

export default function AccountPage() {
  redirect("/app/settings/profile");
}
