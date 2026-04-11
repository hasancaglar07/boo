import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { PremiumBookHero } from "@/components/site/premium-book-hero";
import { InteractiveBookShowcase } from "@/components/site/interactive-book-showcase";

import { HomeTestimonialsSection } from "@/components/site/home-testimonials-section";
import { HomeBlogPreviewSection } from "@/components/site/home-blog-preview-section";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { PricingCreativeSection } from "@/components/site/pricing-creative-section";

import { HomeFaqSection, type FaqItem } from "@/components/site/home-faq-section";
import { buildReviewSchema, buildWebSiteSchema } from "@/lib/schema";
import { loadExamplesShowcaseData } from "@/lib/examples-data";
import { buildPageMetadata, buildOgImageUrl, absoluteUrl, siteConfig } from "@/lib/seo";
import { customerReviews, aggregateRating } from "@/lib/reviews-data";
import { KDP_GUARANTEE_CLAIM, KDP_LIVE_BOOKS_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

type PageParams = {
  params?: Promise<{ locale?: string }>;
};

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const locale = (await params)?.locale ?? "en";
  const t = await getTranslations({ locale, namespace: "HomePage.metadata" });

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/",
    keywords: [
      "ai book writing",
      "write a book with ai",
      "book creator",
      "kdp book preparation",
      "epub creator",
      "book writing tool",
      "pdf book creator",
      "kindle book preparation",
      "ai book generator",
      "online book writing",
      "ebook creator",
      "book draft generator",
      "self publishing tool",
    ],
    ogImage: buildOgImageUrl(
      t("ogTitle"),
      t("ogDescription")
    ),
  });
}

const HOME_SHOWCASE_SLUGS = [
  "authority-in-100-pages",
  "silent-offers",
  "prompt-systems-for-small-teams",
] as const;

export default async function HomePage() {
  const t = await getTranslations("HomePage");

  const { items: exampleItems } = await loadExamplesShowcaseData();
  const showcaseMap = new Map(exampleItems.map((item) => [item.slug, item] as const));
  const curatedHomeShowcaseBooks = HOME_SHOWCASE_SLUGS
    .map((slug) => showcaseMap.get(slug))
    .filter(
      (item): item is (typeof exampleItems)[number] =>
        Boolean(item && (item.coverImages.primaryUrl || item.coverImages.fallbackUrl)),
    );
  const homeShowcaseBooks = curatedHomeShowcaseBooks;
  const fallbackShowcaseBooks =
    homeShowcaseBooks.length >= 4
      ? homeShowcaseBooks
      : exampleItems.filter((item) => Boolean(item.coverImages.primaryUrl || item.coverImages.fallbackUrl)).slice(0, 6);

  const homeFaqItems: FaqItem[] = [
    {
      question: t("faq.quality.question"),
      answer: t("faq.quality.answer", { kdpLiveBooksClaim: KDP_LIVE_BOOKS_CLAIM, kdpGuaranteeClaim: KDP_GUARANTEE_CLAIM }),
      iconKey: "quality",
      claims: [
        { label: t("faq.claims.kdpAccept"), value: KDP_LIVE_BOOKS_CLAIM },
        { label: t("faq.claims.guarantee"), value: KDP_GUARANTEE_CLAIM },
      ],
    },
    {
      question: t("faq.duration.question"),
      answer: t("faq.duration.answer"),
      iconKey: "duration",
    },
    {
      question: t("faq.kdp.question"),
      answer: t("faq.kdp.answer"),
      iconKey: "kdp",
    },
    {
      question: t("faq.creditCard.question"),
      answer: t("faq.creditCard.answer"),
      iconKey: "creditCard",
    },
    {
      question: t("faq.formats.question"),
      answer: t("faq.formats.answer"),
      iconKey: "formats",
    },
  ];

  const reviewSchema = buildReviewSchema({
    itemName: siteConfig.name,
    itemUrl: absoluteUrl("/"),
    reviews: customerReviews,
    aggregateRating,
  });

  const webSiteSchema = buildWebSiteSchema({
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.siteUrl,
    searchAction: {
      target: absoluteUrl("/search?q={search_term_string}"),
      queryInput: "required name=search_term_string",
    },
  });

  return (
    <MarketingPage>
      <PremiumBookHero />

      {/* MiddleBlock: Answer "What is this?" early */}
      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell">
          <h2 className="text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {t("middleBlock.title")}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
            {t("middleBlock.description")}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            {t("middleBlock.subDescription")}
          </p>
          <div className="mt-8 grid gap-4 md:gap-5 md:grid-cols-3">
            <div className="flex h-full flex-col rounded-[24px] border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">{t("middleBlock.cards.a.title")}</h3>
              <p className="mt-2 flex-1 text-sm leading-7 text-muted-foreground">
                {t("middleBlock.cards.a.description")}
              </p>
              <Link href="/use-cases" className="mt-4 inline-block text-xs font-medium text-primary/80 underline-offset-4 hover:underline">
                {t("middleBlock.cards.a.cta")}
              </Link>
            </div>
            <div className="flex h-full flex-col rounded-[24px] border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">{t("middleBlock.cards.b.title")}</h3>
              <p className="mt-2 flex-1 text-sm leading-7 text-muted-foreground">
                {t("middleBlock.cards.b.description")}
              </p>
              <Link href="/compare" className="mt-4 inline-block text-xs font-medium text-primary/80 underline-offset-4 hover:underline">
                {t("middleBlock.cards.b.cta")}
              </Link>
            </div>
            <div className="flex h-full flex-col rounded-[24px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))] px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">{t("middleBlock.cards.c.title")}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {t("middleBlock.cards.c.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <HomeTestimonialsSection />
      <InteractiveBookShowcase
        books={fallbackShowcaseBooks}
        badge={t("showcase.badge")}
        title={t("showcase.title")}
        description={t("showcase.description")}
        ctaLabel={t("showcase.ctaLabel")}
        ctaHref="/start/topic"
      />

      {/* Pricing: Answer "is it expensive?" before blog */}
      <section className="border-b border-border/80 py-16 md:py-20">
        <PricingCreativeSection
          tag={t("pricing.tag")}
          title={t("pricing.title")}
          description={t("pricing.description")}
        />
      </section>

      <HomeBlogPreviewSection />

      <HomeFaqSection
        items={homeFaqItems}
        badge={t("faq.heading.badge")}
        title={t("faq.heading.title")}
        description={t("faq.heading.description")}
        allQuestionsHref="/faq"
        allQuestionsLabel={t("faq.heading.actionLabel")}
        ctaLabel={t("faq.ctaLabel")}
        ctaHref="/start/topic"
      />

      <MarketingCtaSection
        title={t("cta.title")}
        description={t("cta.description", { noApiCostClaim: NO_API_COST_CLAIM })}
        items={[
          t("cta.items.0"),
          t("cta.items.1"),
          t("cta.items.2"),
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
    </MarketingPage>
  );
}
