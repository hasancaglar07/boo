import { Check, X, ArrowRight, Zap, BookOpen, Layers, Sparkles } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

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

export async function generateMetadata() {
  const t = await getTranslations("PricingPage.metadata");
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/pricing",
    keywords: ["book generator pricing", "ai book writing plans", "book production subscription", "kdp book pricing"],
    ogImage: buildOgImageUrl(t("title"), t("description")),
  });
}

export default async function PricingPage() {
  const t = await getTranslations("PricingPage");

  const whoForIcons = [BookOpen, Sparkles, Zap, Layers];

  const pricingFaq = [0, 1, 2, 3, 4, 5].map((i) => [
    t(`faq.items.${i}.q`),
    t(`faq.items.${i}.a`),
  ] as [string, string]);

  const whoForItems = [0, 1, 2, 3].map((i) => ({
    icon: whoForIcons[i],
    plan: t(`whoFor.items.${i}.plan`),
    title: t(`whoFor.items.${i}.title`),
    description: t(`whoFor.items.${i}.description`),
    bullets: [0, 1, 2].map((j) => t(`whoFor.items.${i}.bullets.${j}`)),
  }));

  const competitorComparison = [0, 1, 2, 3].map((i) => ({
    label: t(`comparison.items.${i}.label`),
    price: t(`comparison.items.${i}.price`),
    perBook: t(`comparison.items.${i}.perBook`),
    highlight: i >= 2,
  }));

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

      <section className="border-b border-border/80 py-12">
        <div className="shell">
          <DirectAnswerBlock
            question="How much does Book Generator cost?"
            answer={`Book Generator offers flexible pricing starting at $4 for a single book with no subscription required. Monthly plans range from $19-$79, including 10-80 books per month with ${NO_API_COST_CLAIM}. All plans include EPUB/PDF output, cover generation, and KDP-compliant formatting. ${REFUND_GUARANTEE_CLAIM} within 30 days.`}
          />
          <LastUpdated date="2026-04-09" className="mt-4 text-sm" />
        </div>
      </section>

      <section className="shell pt-6 pb-0">
        <p className="text-center text-sm font-medium text-muted-foreground">
          {t("summary")}
        </p>
      </section>

      <PricingCreativeSection
        className="py-12"
        tag={t("plans.tag")}
        title={t("plans.title")}
        description={t("plans.description")}
      />

      <section className="border-y border-border/80 bg-muted/30 py-14">
        <div className="shell">
          <h2 className="mb-2 text-center font-serif text-2xl font-semibold tracking-tight text-foreground">
            {t("comparison.title")}
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            {t("comparison.description")}
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
              {t("comparison.link")}
            </Link>
          </p>
        </div>
      </section>

      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <h2 className="mb-2 text-center font-serif text-2xl font-semibold tracking-tight text-foreground">
            {t("whoFor.title")}
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            {t("whoFor.description")}
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

      <section className="border-b border-border/80 py-14">
        <div className="shell">
          <h2 className="mb-2 text-center font-serif text-2xl font-semibold tracking-tight text-foreground">
            {t("featureTable.title")}
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            {t("featureTable.description")}
          </p>
          <PricingComparisonTable />
        </div>
      </section>

      <section className="border-b border-border/80 bg-accent/20 py-16">
        <div className="shell">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-2 text-center font-serif text-3xl font-semibold tracking-tight text-foreground">
              {t("faq.title")}
            </h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {t("faq.description")}
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
              {t("faq.stillQuestions")}{" "}
              <Link href="/faq" className="font-medium text-foreground underline-offset-4 hover:underline">
                {t("faq.fullFaq")}
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="font-medium text-foreground underline-offset-4 hover:underline">
                {t("faq.contactUs")}
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="shell text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
            {t("cta.title")}{" "}
            <span className="text-primary">{t("cta.titleHighlight")}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
            {t("cta.description")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/start/topic?plan=single-book"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
            >
              {t("cta.btn1")}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/billing?plan=starter&autostart=1"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-7 py-3.5 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              {t("cta.btn2")}
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/70">
            {[t("cta.items.0"), t("cta.items.1"), KDP_GUARANTEE_CLAIM, REFUND_GUARANTEE_CLAIM].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="size-3 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqSchema) }} />
    </MarketingPage>
  );
}
