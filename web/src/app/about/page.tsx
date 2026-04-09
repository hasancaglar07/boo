import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenCheck,
  Eye,
  FilePenLine,
  Layers3,
  ShieldCheck,
  Sparkles,
  BookMarked,
} from "lucide-react";

import { AboutPageHero } from "@/components/site/page-heroes";
import { DirectAnswerBlock } from "@/components/site/direct-answer";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { CyberneticBentoGrid } from "@/components/ui/cybernetic-bento-grid";
import { Features4 } from "@/components/ui/features-4";
import { Card, CardContent } from "@/components/ui/card";
import { buildReviewSchema } from "@/lib/schema";
import { buildPageMetadata, absoluteUrl, siteConfig } from "@/lib/seo";
import { customerReviews, aggregateRating } from "@/lib/reviews-data";
import { KDP_GUARANTEE_CLAIM, KDP_LIVE_BOOKS_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

export const metadata: Metadata = buildPageMetadata({
  title: "About Book Generator | Our AI Book Production Approach",
  description:
    "Learn why Book Generator works with a simple interface, what principles guide our AI book production, and how we help first-time authors move faster.",
  path: "/about",
  keywords: ["book generator about", "ai book production", "book writing platform"],
});

const principles = [
  {
    title: "Fewer words",
    description: "Short, clear steps that lead the user to the result — instead of long instructions and technical jargon.",
    icon: <Eye className="size-4" />,
  },
  {
    title: "Single path",
    description: "For first-time users, the visible flow follows a simple create, write, publish logic.",
    icon: <Layers3 className="size-4" />,
  },
  {
    title: "Editable content",
    description: "Every generated chapter can be revisited, expanded, and improved.",
    icon: <FilePenLine className="size-4" />,
  },
  {
    title: "Publishing-focused",
    description: "The goal isn't just writing — it's producing real output with EPUB, PDF, and delivery folders.",
    icon: <BookOpenCheck className="size-4" />,
  },
  {
    title: "Confidence-building quality",
    description: "Research, review, and correction layers work behind the scenes without overwhelming the first-time user.",
    icon: <ShieldCheck className="size-4" />,
  },
  {
    title: "AI but simple",
    description: "Artificial intelligence doesn't create visible chaos; it simply provides speed and clarity where needed.",
    icon: <Sparkles className="size-4" />,
  },
] as const;

const aboutBentoItems = [
  {
    eyebrow: "Why like this?",
    title: "Simple on the surface because complexity is handled behind the scenes",
    description:
      "For someone producing a book for the first time, the biggest problem is too many options. So instead of making advanced tasks visible one by one, we built a backbone that manages the flow.",
    metric: "First-time user friendly",
    className: "md:col-span-2 md:row-span-2",
    bullets: ["Wizard first", "Panel later", "Enhanced background", "Clean delivery logic"],
  },
  {
    eyebrow: "Product decision",
    title: "We reduce decision fatigue instead of adding buttons",
    description: "We don't want users to think about what to do first — we want them to just do it.",
    className: "md:col-span-2",
    bullets: ["Single starting point", "Single main CTA", "Clear ordering", "Short texts"],
  },
  {
    eyebrow: "Publishing",
    title: "The first goal is always real output",
    description: "That's why we placed output and book information flows at the center of the product.",
    className: "md:col-span-1",
    bullets: ["EPUB", "PDF"],
  },
  {
    eyebrow: "Enhanced",
    title: "Research and review tools can stay hidden",
    description: "They open when needed; on the first screen, they don't overwhelm the user.",
    className: "md:col-span-1",
    bullets: ["Keywords", "KDP", "Review"],
  },
  {
    eyebrow: "Result",
    title: "The goal isn't to show more features — it's to help more books get finished",
    description: "That's why we treated the product not as a showcase panel, but as a result-oriented publishing system.",
    className: "md:col-span-2",
    bullets: ["High completion feeling", "Clean progress", "You're in control", "System works behind the scenes"],
  },
] as const;

const metrics = [
  {
    icon: <BookMarked className="size-5 text-primary" />,
    value: "KDP-focused",
    label: KDP_LIVE_BOOKS_CLAIM,
  },
  {
    icon: <Sparkles className="size-5 text-primary" />,
    value: "30 examples",
    label: "multilingual showcase books",
  },
  {
    icon: <Eye className="size-5 text-primary" />,
    value: "Free preview",
    label: "visible before payment",
  },
  {
    icon: <ShieldCheck className="size-5 text-primary" />,
    value: "Guided delivery",
    label: "an approach that simplifies the publishing process",
  },
];

export default function AboutPage() {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    logo: absoluteUrl("/logo.png"),
    description: siteConfig.description,
  };

  const reviewSchema = buildReviewSchema({
    itemName: siteConfig.name,
    itemUrl: absoluteUrl("/about"),
    reviews: customerReviews,
    aggregateRating,
  });

  return (
    <MarketingPage>
      <AboutPageHero />

      {/* Metrics strip */}
      <section className="border-b border-border/80 bg-accent/30 py-8">
        <div className="shell grid grid-cols-2 gap-4 md:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card/80 px-4 py-5 text-center shadow-sm"
            >
              {m.icon}
              <div className="text-2xl font-bold tracking-tight text-foreground">{m.value}</div>
              <div className="text-xs leading-5 text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Direct Answer Block for AI Extraction */}
      <section className="border-b border-border/80 py-12">
        <div className="shell">
          <DirectAnswerBlock
            question="What is Book Generator?"
            answer="Book Generator is an AI-powered publishing platform that transforms your expertise into publication-ready books in 5 questions. It generates complete manuscripts, professional covers, and KDP-compliant EPUB/PDF output, handling research, outlining, writing, and formatting automatically. {NO_API_COST_CLAIM} and {KDP_LIVE_BOOKS_CLAIM} with {KDP_GUARANTEE_CLAIM} focus."
          />
        </div>
      </section>

      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <h1 className="sr-only">About Book Generator</h1>
          <SectionHeading
            badge="About"
            title="This product was designed for people who want to publish their book but don't want to drown in complex tools."
            description="Our goal isn't to show more panels — it's to help more people actually finish their books. That's why we built a simple surface with a powerful production system behind it."
          />
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            For us, the real competitor isn't another AI tool — it's procrastination, blank page fear, and scattered workflows. We made product decisions specifically to reduce these psychological barriers.
          </p>
        </div>
      </section>

      <section className="border-b border-border/80">
        <Features4
          badge="Principles"
          title="What principles did we build the product on?"
          description="Both the marketing page and the in-app experience are based on the same decision: even a first-time user should be able to move forward without wondering where to click."
          items={principles}
        />
      </section>

      <section className="border-b border-border/80">
        <CyberneticBentoGrid
          badge="Approach"
          title="It looks simple because the power is collected behind the scenes."
          description="Research, chapter planning, cover, chapter generation, and output are all organized around the same book. This gives both a professional and understandable product feel."
          items={aboutBentoItems}
        />
      </section>

      <section className="border-b border-border/80 py-18">
        <div className="shell grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Mission</h2>
              <p className="text-sm leading-8 text-muted-foreground">
                To enable anyone with knowledge, expertise, or experience to turn it into a book without getting stuck on technical barriers.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Approach</h2>
              <p className="text-sm leading-8 text-muted-foreground">
                First, a confidence-building message, then clear onboarding, then a book production flow that actually works. {NO_API_COST_CLAIM} and if the publishing target is KDP, the delivery package is prepared with {KDP_GUARANTEE_CLAIM} focus.
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="shell mt-6 text-center text-sm text-muted-foreground">
          Have questions or suggestions?{" "}
          <Link href="/contact" className="font-medium text-primary/80 underline-offset-4 hover:underline">
            Get in touch with us →
          </Link>
        </div>
      </section>

      <MarketingCtaSection
        title="This product exists for publishing books, not for showing off."
        description="So all design decisions serve one purpose: making it easier for the user to finish their first book. See the preview first, then move on to the full book."
        items={[
          "Fewer words, clear guidance",
          "Simple panel on the surface",
          "Powerful production system behind the scenes",
          "Preview first, then full book",
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
      />
    </MarketingPage>
  );
}