import type { Metadata } from "next";
import Link from "next/link";

import { PremiumBookHero } from "@/components/site/premium-book-hero";
import { InteractiveBookShowcase } from "@/components/site/interactive-book-showcase";

import { HomeTestimonialsSection } from "@/components/site/home-testimonials-section";
import { HomeBlogPreviewSection } from "@/components/site/home-blog-preview-section";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { PricingCreativeSection } from "@/components/site/pricing-creative-section";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { buildReviewSchema, buildWebSiteSchema } from "@/lib/schema";
import { loadExamplesShowcaseData } from "@/lib/examples-data";
import { buildPageMetadata, buildOgImageUrl, absoluteUrl, siteConfig } from "@/lib/seo";
import { customerReviews, aggregateRating } from "@/lib/reviews-data";
import { KDP_GUARANTEE_CLAIM, KDP_LIVE_BOOKS_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

export const metadata: Metadata = buildPageMetadata({
  title: "Write a Book with AI | Create KDP-Ready EPUB in 15 Minutes",
  description:
    "Turn your expertise into a publish-ready book with AI. Generate drafts, covers, and EPUB/PDF output in 5 questions. Preview for free — no credit card required.",
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
    "Write a Book with AI",
    "Turn your expertise into a publish-ready book in 15 minutes. Preview for free."
  ),
});

const HOME_SHOWCASE_SLUGS = [
  "authority-in-100-pages",
  "silent-offers",
  "prompt-systems-for-small-teams",
] as const;

export default async function HomePage() {
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

  const starterFaq: Array<[string, string]> = [
    [
      "Can an AI-written book really be high quality?",
      `AI creates the draft — you control the quality. Edit every chapter, regenerate what you don't like. ${KDP_LIVE_BOOKS_CLAIM} of our books are live with a ${KDP_GUARANTEE_CLAIM} guarantee.`,
    ],
    [
      "How long does it take to write a book with AI?",
      "Enter your topic and get a publish-ready EPUB and PDF in 30–90 minutes. Most books are completed in a single session.",
    ],
    [
      "Can I upload the EPUB and PDF outputs directly to KDP?",
      "Yes. You get KDP-compatible EPUB and PDF outputs. We recommend a final review with your own checklist before uploading.",
    ],
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
      <section className="border-b border-border/80 py-18">
        <div className="shell">
          <h2 className="text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Write a Book with AI: Turn Your Idea into EPUB and PDF
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
            Turn your expertise into a publish-ready book with Book Creator. AI-powered draft generation, cover design, and KDP-compatible EPUB/PDF output in a single workflow.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Preview your book for free, unlock full access when you like it. Start immediately — no credit card required.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">For Educators, Consultants, and Content Creators</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                An AI-powered book writing platform for anyone who wants to turn their expertise into a KDP book. E-book creation is now a single workflow.
              </p>
              <Link href="/use-cases" className="mt-3 inline-block text-xs font-medium text-primary/80 underline-offset-4 hover:underline">
                See all use cases →
              </Link>
            </div>
            <div className="rounded-[24px] border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">No More Blank Page or Scattered Tools</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Write your book with AI — draft, content, and output all on one platform. Complete your book without needing different tools.
              </p>
              <Link href="/compare" className="mt-3 inline-block text-xs font-medium text-primary/80 underline-offset-4 hover:underline">
                See how we compare →
              </Link>
            </div>
            <div className="rounded-[24px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))] px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">KDP-Compatible EPUB and PDF Files</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Editable chapters, professional cover, and publish-ready EPUB + PDF outputs. Compatible with Kindle and KDP.
              </p>
            </div>
          </div>
        </div>
      </section>

      <HomeTestimonialsSection />
      <InteractiveBookShowcase books={fallbackShowcaseBooks} />

      {/* Pricing: Answer "is it expensive?" before blog */}
      <section className="border-b border-border/80 py-18">
        <PricingCreativeSection
          tag="Book Pricing"
          title="Prepare Your First Book for $4 — KDP-Ready EPUB and PDF Included"
          description="Access a complete book for $4: AI-powered draft, professional cover, EPUB and PDF outputs. Preview for free, then unlock full access."
        />
      </section>

      <HomeBlogPreviewSection />

      <section className="border-b border-border/80 py-18">
        <div className="shell">
          <SectionHeading
            badge="Book Writing FAQ"
            title="Frequently Asked Questions About Writing a Book with AI"
            description="How does the AI book creator work, what's the output quality, and is it KDP-compatible? The most critical questions about the book writing process."
            actionHref="/faq"
            actionLabel="All questions"
          />

          <div className="grid gap-4 md:grid-cols-2">
            {starterFaq.map(([question, answer]) => (
              <Card key={question} className="rounded-[28px]">
                <CardContent className="space-y-3">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    {question}
                  </h3>
                  <p className="text-sm leading-8 text-muted-foreground">{answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <MarketingCtaSection
        title="Start Writing Your Book with AI Today"
        description={`Enter your topic and create your free preview in 15 minutes. ${NO_API_COST_CLAIM}, no credit card required.`}
        items={[
          "AI-powered draft, cover, and content ready",
          "Free preview — unlock full access when you like it",
          "KDP-compatible EPUB + PDF output",
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
