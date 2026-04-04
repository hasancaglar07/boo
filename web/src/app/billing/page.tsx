import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Faturalama | Kitap Oluşturucu",
  description: "Eski faturalama URL'i. Yeni yol /app/settings/billing.",
  path: "/billing",
  noIndex: true,
});

export default async function BillingPage({
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

  redirect(`/app/settings/billing${params.size ? `?${params.toString()}` : ""}`);
}
