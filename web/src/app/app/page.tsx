import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Uretim Merkezi | Book Generator",
  description: "Book Generator uretim merkezinde kitap surecini brief'ten export'a kadar yonet.",
  path: "/app",
  noIndex: true,
});

export default async function AppHomePage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/app/library");
  }

  redirect("/start/topic");
}
