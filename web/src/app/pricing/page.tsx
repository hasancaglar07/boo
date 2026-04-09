import type { Metadata } from "next";
import { ShieldCheck, Check, ArrowRight, Zap, BookOpen, Layers, Sparkles, X } from "lucide-react";
import Link from "next/link";

import { PricingPageHero } from "@/components/site/page-heroes";
import { DirectAnswerBlock } from "@/components/site/direct-answer";
import { LastUpdated } from "@/components/site/last-updated";
import { MarketingPage } from "@/components/site/marketing-page";
import { PricingCreativeSection } from "@/components/site/pricing-creative-section";
import { PricingComparisonTable } from "@/components/site/pricing-comparison-table";
import { plans, premiumPlan } from "@/lib/marketing-data";
import { buildPageMetadata, buildOgImageUrl, absoluteUrl, siteConfig } from "@/lib/seo";
import {
  KDP_GUARANTEE_CLAIM,
  KDP_LIVE_BOOKS_CLAIM,
  NO_API_COST_CLAIM,
  REFUND_GUARANTEE_CLAIM,
} from "@/lib/site-claims";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Generator Pricing | AI Book Writing Plans",
  description:
    "Compare Book Generator pricing plans. Try with a $4 one-time payment, grow with monthly plans. From your first book to full production workflows, there's a plan for every level.",
  path: "/pricing",
  keywords: ["book generator pricing", "ai book writing plans", "book production subscription", "kdp book pricing"],
  ogImage: buildOgImageUrl(
    "Book Generator Pricing",
    "Compare Book Generator pricing plans. Try with a $4 one-time payment, grow with monthly plans."
  ),
});

const pricingFaq = [
  [
    "Which plan should I choose?",
    "If you're testing your first book, start with the Single Book plan ($4) — zero risk, no subscription. If you plan to produce a few books per month, Starter ($19/mo, 10 books) is far more economical. If you want to publish regularly, Creator ($39/mo, 30 books) is the sweet spot — including the research hub and KDP analytics.",
  ],
  [
    "Is the preview really free?",
    "Yes. You can access the wizard without signing up. Viewing the outline, cover preview, and first chapters requires no payment. You only pay for the full book + export.",
  ],
  [
    "Can I upload directly to KDP?",
    `Yes. EPUB and PDF outputs are produced to meet Amazon KDP upload requirements. The production workflow is designed around ${KDP_LIVE_BOOKS_CLAIM} logic, and the delivery package is prepared with a ${KDP_GUARANTEE_CLAIM} focus.`,
  ],
  [
    "Can I write in one language and produce a book in another?",
    "Yes. The interface stays in your preferred language, while the book content is produced in English or any other language you choose. English is KDP's largest market — you can turn that to your advantage.",
  ],
  [
    "Can I change my plan?",
    "Yes. Upgrade, downgrade, or cancel anytime. Manage everything with one click from the billing area — no approval needed.",
  ],
  [
    "Do unused book credits carry over?",
    "No, monthly credits do not roll over to the next month. That's why you should choose the plan you need — there's no reason to get a bigger plan than necessary.",
  ],
];

const whoForItems = [
  {
    icon: BookOpen,
    plan: "Single Book — $4",
    title: "First-time user",
    description:
      "Pay once, the book is yours. Experience the entire process for $4 — get a full refund within 30 days if you're not satisfied.",
    bullets: ["No writing experience needed", "Draft ready in 5 minutes", "Zero risk"],
  },
  {
    icon: Sparkles,
    plan: "Starter — $19/mo",
    title: "Regular content creator",
    description:
      "Build your series with 10 books per month, expand your niche on KDP. Just $1.90 per book.",
    bullets: ["10 books/month, 20 covers", "EPUB + PDF for every book", "$1.90 per book"],
  },
  {
    icon: Zap,
    plan: "Creator — $39/mo",
    title: "Growing on KDP",
    description:
      "Know which book will sell with the research hub, and produce fast with 30 books per month.",
    bullets: ["KDP keyword + market analysis", "30 books/mo, 60 covers", "Additional export options"],
  },
  {
    icon: Layers,
    plan: "Studio — $79/mo",
    title: "High-volume production / agency",
    description:
      "80 books/month, with API and automation workflows unlocked. No extra costs.",
    bullets: ["80 books/mo, 200 covers", "API and automation access", NO_API_COST_CLAIM],
  },
];

const competitorComparison = [
  { label: "Ghostwriter / Agency", price: "$500–$5,000", perBook: "per book", highlight: false },
  { label: "Scrivener + ChatGPT + Canva + Calibre", price: "Free but…", perBook: "10–30 hours / book", highlight: false },
  { label: "Book Generator — Single Book", price: "$4", perBook: "one-time, no subscription", highlight: true },
  { label: "Book Generator — Starter", price: "$1.90", perBook: "per book ($19/mo, 10 books)", highlight: true },
];

export default function PricingPage() {
  const pricingSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: siteConfig.name,
    description: siteConfig.description,
    url: absoluteUrl("/pricing"),
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: [
      {
        "@type": "Offer",
        name: premiumPlan.name,
        price: "4",
        priceCurrency: "USD",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "4", priceCurrency: "USD", unitText: "one-time" },
        availability: "https://schema.org/InStock",
        url: absoluteUrl("/pricing"),
      },
      ...plans.map((p) => ({
        "@type": "Offer",
        name: p.name,
        price: p.price.replace("$", ""),
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: p.price.replace("$", ""),
          priceCurrency: "USD",
          unitText: p.interval,
          billingDuration: "P1M",
        },
        availability: "https://schema.org/InStock",
        url: absoluteUrl("/pricing"),
      })),
    ],
  };

  const pricingFaqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pricingFaq.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <MarketingPage>
      <PricingPageHero />

      {/* Direct Answer Block for AI Extraction */}
      <section className="border-b border-border/80 py-12">
        <div className="shell">
          <DirectAnswerBlock
            question="How much does Book Generator cost?"
            answer="Book Generator offers flexible pricing starting at $4 for a single book with no subscription required. Monthly plans range from $19-$79, including 10-80 books per month with {NO_API_COST_CLAIM}. All plans include EPUB/PDF output, cover generation, and KDP-compliant formatting. {REFUND_GUARANTEE_CLAIM} within 30 days."
          />
          <LastUpdated date="2026-04-09" className="mt-4 text-sm" />
        </div>
      </section>

      {/* One-line summary + Plans — right below hero */}
      <section className="shell pt-6 pb-0">
        <p className="text-center text-sm font-medium text-muted-foreground">
          Your first book is $4, subsequent books start at $19/month — preview is free.
        </p>
      </section>

      {/* Plans — just above */}
      <PricingCreativeSection
        className="py-12"
        tag="Plans"
        title="Pay once or produce with a monthly plan."
        description="Open your first book for $4, build a rhythm with 10 books a month, or transform into a publishing system with 30 or 80 books."
      />

      {/* Competitor comparison */}
      <section className="border-y border-border/80 bg-muted/30 py-14">
        <div className="shell">
          <h2 className="mb-2 text-center font-serif text-2xl font-semibold tracking-tight text-foreground">
            Same book, very different price.
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            The cost of producing a book with other methods.
          </p>
          <div className="mx-auto max-w-2xl divide-y divide-border/80 overflow-hidden rounded-[24px] border border-border/80 bg-card shadow-sm">
            {competitorComparison.map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between gap-4 px-6 py-4 ${
                  row.highlight
                    ? "bg-[linear-gradient(90deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))]"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {row.highlight ? (
                    <Check className="size-4 shrink-0 text-primary" />
                  ) : (
                    <X className="size-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className={`text-sm ${row.highlight ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {row.label}
                  </span>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${row.highlight ? "text-primary" : "text-foreground"}`}>
                    {row.price}
                  </p>
                  <p className="text-xs text-muted-foreground">{row.perBook}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/compare" className="text-primary/80 underline-offset-4 hover:underline">
              See detailed feature comparison →
            </Link>
          </p>
        </div>
      </section>

      {/* Who is it for? */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <h2 className="mb-2 text-center font-serif text-2xl font-semibold tracking-tight text-foreground">
            Which plan is right for you?
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Find the right starting point based on your goals.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {whoForItems.map((item) => (
              <div
                key={item.plan}
                className="rounded-[24px] border border-border/80 bg-card/80 p-5 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-accent text-primary">
                  <item.icon className="size-5" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">{item.plan}</p>
                <h3 className="mt-1 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                <ul className="mt-4 space-y-1.5">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="size-3 shrink-0 text-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

            {/* Comparison table */}
      <section className="border-b border-border/80 py-14">
        <div className="shell">
          <h2 className="mb-2 text-center font-serif text-2xl font-semibold tracking-tight text-foreground">
            Feature comparison
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            See what's included in each plan, side by side.
          </p>
          <PricingComparisonTable />
        </div>
      </section>
{/* FAQ */}
      <section className="border-b border-border/80 bg-accent/20 py-16">
        <div className="shell">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-2 text-center font-serif text-3xl font-semibold tracking-tight text-foreground">
              Questions on your mind
            </h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Everything you need to know before choosing a plan.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {pricingFaq.map(([question, answer]) => (
                <div
                  key={question}
                  className="rounded-[20px] border border-border/80 bg-card/80 px-5 py-4"
                >
                  <h3 className="text-sm font-semibold text-foreground">{question}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{answer}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Still have questions?{" "}
              <Link href="/faq" className="font-medium text-foreground underline-offset-4 hover:underline">
                Full FAQ
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="font-medium text-foreground underline-offset-4 hover:underline">
                contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14">
        <div className="shell text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
            See your book first —{" "}
            <span className="text-primary">then pay $4.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
            Outline and cover preview are free. Full book + EPUB/PDF for $4 — pay once, it's yours.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/start/topic?plan=single-book"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
            >
              Start Free Preview
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/billing?plan=starter&autostart=1"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-7 py-3.5 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              Start with a Monthly Plan
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/70">
            {[
              "Free preview",
              "$4 one-time",
              KDP_GUARANTEE_CLAIM,
              REFUND_GUARANTEE_CLAIM,
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="size-3 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqSchema) }}
      />
    </MarketingPage>
  );
}
