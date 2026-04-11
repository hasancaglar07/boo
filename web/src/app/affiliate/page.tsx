import type { Metadata } from "next";
import { AffiliatePage } from "@/components/site/affiliate-page";
import { MarketingPage } from "@/components/site/marketing-page";

export const metadata: Metadata = {
  title: "Affiliate Program — Book Generator",
  description:
    "Join the Book Generator affiliate program. Earn 30% commission for 3 months on every subscription you refer.",
};

export default function AffiliatePageRoute() {
  return (
    <MarketingPage>
      <AffiliatePage />
    </MarketingPage>
  );
}
