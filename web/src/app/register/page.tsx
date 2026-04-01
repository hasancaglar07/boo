import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Kayıt Ol | Book Generator",
  description: "Eski kayıt URL'i. Yeni akış için /signup kullanılır.",
  path: "/register",
  noIndex: true,
});

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  const resolved = await searchParams;

  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "string" && value) {
      params.set(key, value);
    }
  }

  redirect(`/signup${params.size ? `?${params.toString()}` : ""}`);
}
