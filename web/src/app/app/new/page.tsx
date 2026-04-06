import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireBookStartAccess } from "@/lib/auth/server-access";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "New Book Wizard | Book Generator",
  description: "Turn your idea into a book in a few simple steps with the Book Generator new book wizard.",
  path: "/app/new",
  noIndex: true,
});

export default async function NewBookPage() {
  await requireBookStartAccess("/app/new");
  redirect("/app/new/topic");
}