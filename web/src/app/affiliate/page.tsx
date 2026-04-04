import type { Metadata } from "next";

import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { AffiliatePage } from "@/components/site/affiliate-page";

export const metadata: Metadata = {
  title: "Affiliate Programı — Kitap Oluşturucu",
  description:
    "Kitap Oluşturucu affiliate programına katıl. Her abonelikten 3 ay boyunca %30 komisyon kazan.",
};

export default function AffiliatePageRoute() {
  return (
    <>
      <SiteHeader />
      <main>
        <AffiliatePage />
      </main>
      <SiteFooter />
    </>
  );
}
