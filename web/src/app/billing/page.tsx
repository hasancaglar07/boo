import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Billing | Book Generator",
  description: "Billing redirect page. Redirecting to /app/settings/billing.",
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

  const checkoutPath = `/app/settings/billing${params.size ? `?${params.toString()}` : ""}`;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/signup?next=${encodeURIComponent(checkoutPath)}`);
  }

  redirect(checkoutPath);
}
