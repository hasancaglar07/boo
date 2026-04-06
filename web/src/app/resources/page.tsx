import type { Metadata } from "next";
import { Download, BookOpen, FileText, Search, Lightbulb, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

import { LeadMagnetSignupCard } from "@/components/site/lead-magnet-signup-card";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { featuredLeadMagnet } from "@/lib/lead-magnets";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Free Resources | Book Generator",
  description:
    "Practical guides, checklists, and templates for writing books with AI. Explore free resources to accelerate your book writing process.",
  path: "/resources",
  keywords: ["free book writing guide", "epub template", "book chapter plan template", "ai book checklist"],
});

const resources = [
  {
    icon: FileText,
    badge: "Email Starter Pack",
    title: "AI Book Writing Starter Pack",
    description:
      "A short guide, quality filter, and pre-publish check notes to start your first book without staring at a blank page. Delivered via email, then routes directly into the wizard flow.",
    highlights: [
      "Topic summary creation techniques",
      "How to set up a chapter plan",
      "What to watch during chapter generation",
      "EPUB/PDF delivery pipeline",
    ],
    cta: "Apply step by step in the wizard",
    href: "/start/topic",
    featured: true,
  },
  {
    icon: Sparkles,
    badge: "Tool Library",
    title: "Free Book Tools",
    description:
      "Score your book idea, generate an outline, test your KDP niche, find a customer-attracting angle, and refine your title. Browse all free interactive tools in one place.",
    highlights: [
      "6 different interactive tools",
      "Partial free score + full report via email",
      "CTA chain leading to start funnel",
      "Validator, outline, KDP, and title tools",
    ],
    cta: "Open Tool Hub",
    href: "/tools",
    featured: false,
  },
  {
    icon: CheckCircle2,
    badge: "Checklist",
    title: "Pre-Publish Book Checklist",
    description:
      "A comprehensive 30-item checklist to review before publishing on Amazon KDP or any other platform. Get your wizard-generated book publish-ready.",
    highlights: [
      "Metadata and description checks",
      "Cover design standards",
      "EPUB validation steps",
      "KDP upload requirements",
    ],
    cta: "Create and check your book",
    href: "/start/topic",
    featured: false,
  },
  {
    icon: Search,
    badge: "Template",
    title: "Niche Research Worksheet",
    description:
      "A fillable worksheet designed to help you find the right niche and target audience for your book. Keep it as a reference to use in the wizard.",
    highlights: [
      "Target reader profile template",
      "Competition analysis table",
      "Keyword research framework",
      "Pricing and market notes",
    ],
    cta: "Define your niche in the wizard",
    href: "/start/topic",
    featured: false,
  },
  {
    icon: BookOpen,
    badge: "Guide",
    title: "Book Generator Quick Start (15 min)",
    description:
      "A step-by-step guide covering the entire process from your first login to generating your first book. Fill in the wizard, approve the chapter plan, and get your output.",
    highlights: [
      "Filling in the wizard",
      "Chapter plan approval and editing",
      "Chapter generation and saving",
      "Output and download steps",
    ],
    cta: "Apply the guide — start now",
    href: "/start/topic",
    featured: false,
  },
  {
    icon: Lightbulb,
    badge: "Idea List",
    title: "100 Profitable Book Ideas List",
    description:
      "100 book ideas researched across best-selling niche categories on Amazon KDP. Each idea includes target audience and estimated evaluation notes. Get inspired to choose your own topic.",
    highlights: [
      "100 ideas across 10 categories",
      "Target audience notes for each idea",
      "Competition level assessment",
      "Price range suggestions",
    ],
    cta: "Pick an idea and get started",
    href: "/start/topic",
    featured: false,
  },
  {
    icon: Download,
    badge: "KDP Toolkit",
    title: "KDP Starter Toolkit",
    description:
      "A starter path that combines the templates and guides you need to publish your first book on Amazon KDP in one streamlined flow. Optimize for KDP with Book Generator.",
    highlights: [
      "Book description template",
      "Category selection guide",
      "Pricing strategy notes",
      "Publishing starter checklist",
    ],
    cta: "Create your KDP book now",
    href: "/start/topic",
    featured: false,
  },
] as const;

export default function ResourcesPage() {
  return (
    <MarketingPage>
      {/* Hero */}
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Free Resources</Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Free resources to accelerate{" "}
              <span className="text-primary">your book decision</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              Guides, templates, checklists, and tutorials. The goal isn't just reading — it's moving you faster into previewing, chapter planning, and the real book flow.
            </p>
          </div>
        </div>
      </section>

      {/* Featured resource */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <LeadMagnetSignupCard leadMagnet={featuredLeadMagnet} />
        </div>
      </section>

      {/* All resources */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading
            badge="All Resources"
            title="Tools that simplify the process."
            description="Resources prepared for every stage, from guides to templates, checklists to video tutorials."
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.filter((r) => !r.featured).map((resource) => {
              const Icon = resource.icon;
              return (
                <Card key={resource.title} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <Badge>{resource.badge}</Badge>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">{resource.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{resource.description}</p>
                    </div>
                    <ul className="space-y-2 border-t border-border/60 pt-4">
                      {resource.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={resource.href}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      {resource.cta}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <section className="border-b border-border/80 py-10">
        <div className="shell flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span>Looking for more content:</span>
          <Link href="/tools" className="font-medium text-foreground underline-offset-4 hover:underline">
            Tools → Interactive tool library
          </Link>
          <Link href="/blog" className="font-medium text-foreground underline-offset-4 hover:underline">
            Blog → Writing and AI guides
          </Link>
          <Link href="/faq" className="font-medium text-foreground underline-offset-4 hover:underline">
            FAQ → Frequently asked questions
          </Link>
          <Link href="/how-it-works" className="font-medium text-foreground underline-offset-4 hover:underline">
            How It Works → Step-by-step process
          </Link>
        </div>
      </section>

      <MarketingCtaSection
        title="Start your own book instead of just reading."
        description="You've explored the guides and seen the templates. Now test the same logic with your own topic summary: preview first, then decide whether to continue. 30-day money-back guarantee."
        items={[
          "Quick start with the wizard",
          "Chapter plan + chapter generation",
          "Preview first, then full book",
          "EPUB and PDF output",
        ]}
      />
    </MarketingPage>
  );
}
