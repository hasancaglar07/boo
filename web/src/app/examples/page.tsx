import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CheckCircle2, Globe, Layers3, Sparkles } from "lucide-react";

import { ExamplesPageHero } from "@/components/site/page-heroes";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { ExamplesShowcase } from "@/components/site/examples-showcase";
import { loadExamplesShowcaseData } from "@/lib/examples-data";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Example Books and Real Outputs | Book Creator",
  description:
    "Explore example books with real covers, chapter plans, first chapter previews, and EPUB/PDF/HTML outputs. Then start your own book with the same workflow.",
  path: "/examples",
  keywords: [
    "example books",
    "ai book examples",
    "epub pdf html book examples",
    "book creator examples",
  ],
});

export const revalidate = 86400;

const faqs = [
  {
    question: "Are these examples real, or just demo designs?",
    answer:
      "The examples on this page come from the real production workflow — topic summary, outline, chapter generation, cover, and output. The goal is not just visual display, but making the resulting structure visible.",
  },
  {
    question: "What can I examine in each example?",
    answer:
      "You can explore the cover, category, language, chapter count, summary, quick-look preview, text sample from the first chapter, and — where available — HTML/PDF/EPUB outputs.",
  },
  {
    question: "Will my results be exactly the same as these examples?",
    answer:
      "No, they won't be identical. But this page shows you the quality level, structural logic, and delivery format you can expect. Your own topic summary and target audience will generate a unique book workflow.",
  },
  {
    question: "Can I start a book similar to an example I like?",
    answer:
      "Yes. From any example, you can jump into the same starting workflow and begin a similar production process with your own topic.",
  },
] as const;

export default async function ExamplesPage() {
  const { items, categories, languages } = await loadExamplesShowcaseData();
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Example Books and Real Outputs",
    description:
      "An example book showcase with real covers, visible chapter plans, first chapter previews, and output files.",
    url: absoluteUrl("/examples"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/examples/${item.slug}`),
        name: item.title,
      })),
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <MarketingPage>
      <ExamplesPageHero items={items} />

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            badge="What do the examples prove?"
            title="This page is not just a showcase — it's a decision-making tool"
            description="A first-time visitor doesn't just look at covers here. Every example exists to help you quickly understand the real level of structure, content, and delivery format."
          />

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div className="rounded-[28px] border border-border/80 bg-card p-6 md:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                These examples show you 4 things
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  {
                    icon: Layers3,
                    title: "Structural quality",
                    text: "Is the chapter plan actually readable? Does the topic fit a logical backbone?",
                  },
                  {
                    icon: Sparkles,
                    title: "Content level",
                    text: "Thanks to first chapter previews, you see not just covers but also a real sense of the content.",
                  },
                  {
                    icon: BookOpen,
                    title: "Cover and positioning",
                    text: "Does the cover, title, and category alignment give you a sense of publishability? That's what you test.",
                  },
                  {
                    icon: Globe,
                    title: "Delivery format",
                    text: "Where available, you can see whether HTML, PDF, and EPUB outputs are truly ready.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                      <Icon className="size-5 text-primary" />
                      <h3 className="mt-3 text-base font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_6%,var(--background)),var(--background))] p-6 md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <CheckCircle2 className="size-3.5 text-primary" />
                How to use this page?
              </div>
              <ol className="mt-5 space-y-4">
                {[
                  "First, use category, language, and search filters to find examples close to your topic.",
                  "Use quick look to explore the table of contents, first chapter, and output tabs.",
                  "Open the full page of any example that catches your eye for a deeper look.",
                  "Then start your own book with the same workflow using your topic.",
                ].map((item, index) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-7 text-foreground">{item}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="#ornek-vitrini"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                >
                  Explore examples
                </Link>
                <Link
                  href="/start/topic"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
                >
                  Start your own book
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-12">
        <div className="shell grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: `${items.length}+ real examples`,
              text: "Not a gallery approach — examples selected to show the real delivery level.",
            },
            {
              title: `${Math.max(0, categories.length - 1)} categories`,
              text: "Compare across different use cases and find examples closer to your needs faster.",
            },
            {
              title: `${Math.max(0, languages.length - 1)} languages shown`,
              text: "See multilingual production levels not just in words, but through actual example books.",
            },
            {
              title: "Preview first, then decide",
              text: "This page exists so you can see quality and structure before committing to production, making your decision easier.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <ExamplesShowcase items={items} categories={categories} languages={languages} />

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionHeading
              badge="Why does it build trust?"
              title="Not just good-looking covers"
              description="If an examples page wants to be convincing, it must show not only aesthetics but also content and delivery level."
            />

            <div className="space-y-3">
              {[
                "Every example has a visible book identity: title, category, language, and summary.",
                "The quick-look workflow lets you get a sense of the table of contents and first chapter before leaving the page.",
                "Where available, output formats are clearly shown — not just promised.",
                "After an example you like, you can jump into the same starting workflow.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card px-4 py-4">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <p className="text-sm leading-7 text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading
              badge="Quick answers before you decide"
              title="Most frequently asked questions while browsing examples"
              description="This section reduces remaining uncertainties as you browse the page and clarifies what you're looking at."
            />

            <div className="grid gap-4">
              {faqs.map((item) => (
                <div key={item.question} className="rounded-[24px] border border-border/80 bg-card p-6">
                  <h3 className="text-lg font-semibold text-foreground">{item.question}</h3>
                  <p className="mt-3 text-sm leading-8 text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="shell">
          <div className="rounded-[32px] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_7%,var(--background)),var(--background))] p-8 md:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Next step
              </div>
              <h2 className="mt-6 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                If the examples look good enough, <span className="text-primary">try your own topic now.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                You start with the same workflow: topic summary, chapter plan, preview, cover, and output. You've seen the examples;
                now you can run the same process for your own book.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/start/topic"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                >
                  Start your own book
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
                >
                  See how it works first
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
                >
                  View pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </MarketingPage>
  );
}
