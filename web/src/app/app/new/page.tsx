import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Yeni Kitap Sihirbazı | Book Generator",
  description: "Book Generator yeni kitap sihirbazı ile fikrini kısa adımlarda kitaba dönüştür.",
  path: "/app/new",
  noIndex: true,
});

export default async function NewBookPage() {
  await requireAuthenticatedUser("/app/new");
  redirect("/start/topic");
}
