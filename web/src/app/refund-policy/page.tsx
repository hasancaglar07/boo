import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/site/marketing-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Generator Refund Policy | Plan and Payment Process",
  description:
    "Review the Book Generator refund policy. Learn step by step about plan changes, support requests, and the refund evaluation process based on usage.",
  path: "/refund-policy",
  keywords: ["refund policy", "book generator payment", "subscription change"],
});

export default function RefundPolicyPage() {
  return (
    <MarketingPage>
      <section className="shell py-20">
        <Badge>Refund</Badge>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">Refund policy</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          We keep the refund process open so you can try Book Generator risk-free. You see the preview first, then unlock the full book; if you&apos;re not satisfied, you can request a refund within the first 30 days.
        </p>
        <div className="mt-8 rounded-[24px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_7%,var(--card)),var(--card))] px-6 py-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">Short answer</p>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground">
            For all plans including the Single Book plan, you can open a refund request through support within the first 30 days from the date of purchase if you are not satisfied. This page is meant to clarify the trust message in pricing and checkout language — not to leave things ambiguous.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ["30-day window", "You can create a refund request within the first 30 days from the date of purchase. All plans including the $4 Single Book plan are covered by this window."],
            ["Request via support", "In case of billing issues, wrong plan selection, or dissatisfaction, simply send a brief and clear refund request to our support team."],
            ["Fast and transparent process", "We focus on clarity rather than dragging out the refund process. The preview logic already reduces risk; the refund policy complements this approach."],
          ].map(([title, text]) => (
            <Card key={title}>
              <CardContent>
                <h2 className="text-lg font-medium text-foreground">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-sm leading-7 text-muted-foreground">
          If you&apos;d like to see the product flow first,{" "}
          <Link href="/start/topic" className="text-foreground underline-offset-4 hover:underline">
            start the free preview
          </Link>
          , or to compare plans, go to the{" "}
          <Link href="/pricing" className="text-foreground underline-offset-4 hover:underline">
            pricing
          </Link>{" "}
          page.
        </div>
      </section>
    </MarketingPage>
  );
}
