import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Account Settings | Book Generator",
  description: "Legacy account URL. New settings path: /app/settings/profile.",
  path: "/account",
  noIndex: true,
});

export default function AccountPage() {
  redirect("/app/settings/profile");
}
