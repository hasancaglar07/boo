import type { Metadata } from "next";
import { User, Users, Briefcase, GraduationCap, Globe, Mic, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { DirectAnswerBlock } from "@/components/site/direct-answer";
import { LastUpdated } from "@/components/site/last-updated";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildPageMetadata, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Who Is It For? | Book Generator",
  description:
    "Discover who uses Book Generator and why. An AI-powered book production system for authors, consultants, instructors, course creators, and content creators.",
  path: "/use-cases",
  keywords: ["ai book production", "consultant book writing", "instructor book", "course creator book", "content creator"],
});

const segments = [
  {
    icon: User,
    badge: "Individual Authors",
    title: "Authors looking to publish their first book",
    description:
      "You have an idea you want to write about, but getting started feels hard. The chapter outline isn't coming together in your head, and months keep passing by. Book Generator moves forward for you — from topic summary to chapter outline, from chapter outline to full chapters.",
    benefits: [
      "Draft chapter outline from your idea in 5 minutes",
      "Chapter-by-chapter production — stay on track without getting lost",
      "Consistent voice every time",
      "Download directly as EPUB and PDF",
    ],
    outcome: "A long-postponed first guide book can turn into a draft within weeks once the chapter structure is clarified.",
    cta: "Getting started guide for authors",
    ctaHref: "/resources",
    color: "bg-blue-50 border-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Briefcase,
    badge: "Consultants & Coaches",
    title: "Professionals who want to turn their expertise into a book",
    description:
      "Turning years of accumulated knowledge into a book both boosts your credibility and opens doors to new clients. But there's no time. Book Generator transforms your expertise into structured content.",
    benefits: [
      "Short lead-generating promotional books",
      "Brand-aligned tone of voice",
      "Chapter structure that conveys your methodology",
      "Multiple niche books in a short time",
    ],
    outcome: "Converting consulting knowledge into a short authority book can serve as an entry product and trust builder for your services.",
    cta: "Guide for consultants",
    ctaHref: "/resources",
    color: "bg-purple-50 border-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: GraduationCap,
    badge: "Instructors & Course Creators",
    title: "Educators who turn teaching content into guide books",
    description:
      "You already have course materials, workshop notes, and course modules prepared. Book Generator brings these together into a cohesive guide book structure. The goal isn't an academic format — it's producing clear, publishable content that students or clients can read and apply.",
    benefits: [
      "Book draft from course modules",
      "Instructional tone and chapter structure",
      "End-of-chapter summaries and action items",
      "Use as a lead-generating short book or paid guide",
    ],
    outcome: "Course or workshop content can more quickly be transformed into a guide book that students can read and apply.",
    cta: "Get started for educators",
    ctaHref: "/start/topic",
    color: "bg-green-50 border-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: Globe,
    badge: "KDP Publishers",
    title: "Publishers releasing multiple titles on Amazon KDP",
    description:
      "You're targeting multiple titles per month. Writing by hand slows you down. Book Generator automates the entire publishing pipeline — research, writing, and output workflow.",
    benefits: [
      "Monthly multi-title production capacity",
      "Niche research and chapter outline suggestions",
      "KDP-compliant EPUB/PDF output",
      "Cost-output optimization",
    ],
    outcome: "For KDP-focused users, getting research, draft, and output in a single workflow increases repetitive production capacity.",
    cta: "View KDP publisher plan",
    ctaHref: "/pricing",
    color: "bg-orange-50 border-orange-100",
    iconColor: "text-orange-600",
  },
  {
    icon: Mic,
    badge: "Content Creators",
    title: "Creators who grow their blog, podcast, and courses into a book",
    description:
      "You have written content, a podcast, course materials. Bringing them together and presenting them as a book opens up a new revenue stream. Book Generator makes this transformation easy.",
    benefits: [
      "Book draft from existing content",
      "Language that speaks to your reader audience",
      "Additional income and lead collection opportunity",
      "Quick updates and new editions",
    ],
    outcome: "Scattered blog, podcast, or course fragments can be gathered into a single book narrative and transformed into a new revenue surface.",
    cta: "Get started as a content creator",
    ctaHref: "/start/topic",
    color: "bg-rose-50 border-rose-100",
    iconColor: "text-rose-600",
  },
  {
    icon: Users,
    badge: "Organizations & Teams",
    title: "Teams that turn institutional knowledge into publications",
    description:
      "Company knowledge is scattered across employees. Orientation guides, process manuals, internal training materials — transform them all into a consistent book format.",
    benefits: [
      "Internal company knowledge transfer",
      "Standardized orientation materials",
      "Corporate culture and process manuals",
      "Multi-author support (team production)",
    ],
    outcome: "When internal company knowledge, processes, or orientation workflows are converted into a single book, they become a reusable asset.",
    cta: "Contact us for enterprise plans",
    ctaHref: "/contact",
    color: "bg-teal-50 border-teal-100",
    iconColor: "text-teal-600",
  },
] as const;

export default function UseCasesPage() {
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Book Generator Use Cases",
    description: "AI-powered book production use cases for authors, consultants, educators, and KDP publishers.",
    numberOfItems: segments.length,
    itemListElement: segments.map((seg, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: seg.title,
      description: seg.description,
      url: absoluteUrl(`/use-cases#${seg.badge.toLowerCase().replace(/\s+/g, "-").replace(/[&]/g, "and")}`),
    })),
  };

  return (
    <MarketingPage>
      {/* Hero */}
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Who Uses It?</Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Not for everyone.{" "}
              <span className="text-primary">Incredibly powerful for the right user.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              From individual authors to enterprise teams, consultants to KDP publishers. Book Generator works differently for different purposes — but it's strongest where there's a publish-ready knowledge book workflow.
            </p>

            {/* Direct Answer Block for AI Extraction */}
            <div className="mt-8 text-left">
              <DirectAnswerBlock
                question="Who should use Book Generator?"
                answer="Book Generator is ideal for anyone with expertise to share: first-time authors overcoming writer's block, consultants and coaches building authority, instructors transforming course content into books, KDP publishers scaling production, and content creators repurposing existing material. It's especially powerful for experts who know their topic but struggle with structure, consistency, or finding time to write."
              />
              <LastUpdated date="2026-04-09" className="mt-4 text-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Segment cards */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading
            badge="Use Cases"
            title="Which scenario fits you?"
            description="Find the closest match among six different user profiles."
          />
          <div className="space-y-8">
            {segments.map((segment, i) => {
              const Icon = segment.icon;
              const isEven = i % 2 === 0;
              return (
                <div
                  key={segment.title}
                  className="rounded-3xl border border-border/80 bg-background p-8 md:p-10"
                >
                  <div className={`grid gap-10 md:grid-cols-2 md:items-start ${!isEven ? "md:[&>*:first-child]:order-2" : ""}`}>
                    {/* Text */}
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${segment.color}`}>
                          <Icon className={`size-5 ${segment.iconColor}`} />
                        </div>
                        <Badge>{segment.badge}</Badge>
                      </div>
                      <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        {segment.title}
                      </h2>
                      <p className="mt-3 text-base leading-8 text-muted-foreground">{segment.description}</p>
                      <Link
                        href={segment.ctaHref}
                        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        {segment.cta}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>

                    {/* Benefits + outcome */}
                    <div className="space-y-6">
                      <ul className="space-y-3">
                        {segment.benefits.map((b) => (
                          <li key={b} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                            {b}
                          </li>
                        ))}
                      </ul>
                      <Card className="border-border/60 bg-muted/40">
                        <CardContent className="p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Typical outcome
                          </p>
                          <p className="mt-3 text-sm leading-7 text-foreground">{segment.outcome}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <MarketingCtaSection
        title="No matter which segment you belong to, the first step is the same — and it's free."
        description="Preview without a credit card. Create your topic summary, see the chapter outline — clarify whether this book is truly worth publishing. 30-day money-back guarantee."
        items={[
          "First topic summary in 5 minutes",
          "Instant chapter outline generation",
          "Preview first, then the full book",
          "EPUB/PDF output",
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
    </MarketingPage>
  );
}
