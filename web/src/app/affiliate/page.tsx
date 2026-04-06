import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { AffiliatePage } from "@/components/site/affiliate-page";

export const metadata: Metadata = {
  title: "Affiliate Program — Book Generator",
  description:
    "Join the Book Generator affiliate program. Earn 30% commission for 3 months on every subscription you refer.",
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
