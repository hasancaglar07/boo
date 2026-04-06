import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Production Center | Book Generator",
  description: "Manage your book process from brief to export in the Book Generator production center.",
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