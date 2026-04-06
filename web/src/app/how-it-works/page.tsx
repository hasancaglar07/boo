import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileOutput,
  Layers3,
  PencilRuler,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WandSparkles,
} from "lucide-react";

import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "How Book Creator Works | 3-Step Book Production",
  description:
    "See step-by-step how the book production process works — from a brief topic summary to chapter plans, previews, and EPUB/PDF output.",
  path: "/how-it-works",
  keywords: ["how book creator works", "ai book production", "epub pdf book creation"],
});

const steps = [
  {
    step: "1",
    title: "Enter your topic and target reader",
    text: "Share a brief summary, your target reader, and the outcome you want to convey. No long forms — you start with guided questions.",
    output: "Clear book direction, title angle, and starting framework",
    cta: "Enter your topic summary",
    icon: Target,
  },
  {
    step: "2",
    title: "Review and approve the outline",
    text: "The system suggests a title, chapter flow, and book structure. You can edit, refine, and approve before moving to production.",
    output: "Visible chapter plan and a more controlled production workflow",
    cta: "Build your chapter plan",
    icon: Layers3,
  },
  {
    step: "3",
    title: "Preview your book and get your outputs",
    text: "See the first result, and when you like it, convert your book to full output. EPUB and PDF files are prepared in a single workflow.",
    output: "Preview, editable content, and EPUB/PDF outputs",
    cta: "Start production",
    icon: FileOutput,
  },
] as const;

const reassuranceItems = [
  {
    icon: Clock3,
    title: "Quick start",
    text: "Start with a few short answers — no lengthy preparation needed.",
  },
  {
    icon: PencilRuler,
    title: "You're in control",
    text: "You never go into blind production without seeing and approving the outline first.",
  },
  {
    icon: ShieldCheck,
    title: "Output-focused workflow",
    text: "The process doesn't just generate text — it aims to deliver EPUB/PDF at the end.",
  },
  {
    icon: Users,
    title: "Built for experts",
    text: "Designed for instructors, consultants, and creators who want to turn their knowledge into a book.",
  },
] as const;

const behindTheScenes = [
  {
    eyebrow: "Direction",
    title: "Clarify why you're writing, not just what",
    description:
      "Who you're writing for, what outcome you promise the reader, and what language to use are determined upfront. So your book stays focused from the very first step.",
    icon: Target,
  },
  {
    eyebrow: "Plan",
    title: "The chapter structure becomes visible",
    description:
      "Title, subtitles, and chapter order take shape together. Instead of assembling text after the fact, you build a structured outline from the start.",
    icon: Layers3,
  },
  {
    eyebrow: "Production",
    title: "Move forward with a preview",
    description:
      "The system doesn't just dump text. It produces a visible result first — so you see what you're turning into a finished product much earlier.",
    icon: Sparkles,
  },
  {
    eyebrow: "Delivery",
    title: "Outputs are built into the process, not tacked on at the end",
    description:
      "EPUB, PDF, and basic publishing files stop being a separate chore added at the end — they become a natural part of production.",
    icon: FileOutput,
  },
] as const;

const audience = [
  "Consultants and instructors who want to turn their expertise into a book",
  "First-time authors who prefer a guided workflow over starting from a blank page",
  "Content creators who want fast drafts, visible chapter plans, and output-driven progress",
] as const;

const deliverables = [
  {
    icon: WandSparkles,
    label: "Book direction",
    text: "Title angle, positioning, and the book's core promise",
  },
  {
    icon: SearchCheck,
    label: "Plan",
    text: "Chapter-by-chapter visible outline and book structure",
  },
  {
    icon: BookOpenCheck,
    label: "Content",
    text: "Editable chapter content and preview output",
  },
  {
    icon: FileOutput,
    label: "Delivery",
    text: "EPUB, PDF, and essential files that simplify publishing preparation",
  },
] as const;

const faqs = [
  {
    question: "What do I need to get started?",
    answer:
      "Usually a brief topic summary, target reader information, and a few clear answers about what you want the book to achieve are enough.",
  },
  {
    question: "Do I go into production without seeing the outline?",
    answer:
      "No. The process is designed so you can see and approve your direction and chapter plan first.",
  },
  {
    question: "Do I only get text, or are there output files too?",
    answer:
      "The goal isn't just generating text — it's progressing all the way to preview and book outputs including EPUB/PDF delivery.",
  },
  {
    question: "Who is this product best suited for?",
    answer:
      "It's especially suited for experts, instructors, consultants, and creators who want to turn their knowledge, experience, or methodology into a book.",
  },
] as const;

export default function HowItWorksPage() {
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to produce a book with Book Creator?",
    description:
      "Enter your topic summary, approve the outline, preview it, and get EPUB/PDF outputs.",
    inLanguage: "en-US",
    totalTime: "PT30M",
    url: absoluteUrl("/how-it-works"),
    step: steps.map((item) => ({
      "@type": "HowToStep",
      position: Number(item.step),
      name: item.title,
      text: item.text,
    })),
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
      <section className="relative overflow-hidden border-b border-border/80 py-20 md:py-28">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_7%,var(--background)),var(--background)_68%)]" />
        <div className="hero-glow" />
        <div className="shell relative">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              How it works
            </div>

            <h1 className="mt-8 text-balance font-serif text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
              Enter your topic, approve your plan, <span className="text-primary">turn your book into output.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground md:text-lg">
              Book Creator is a guided book production workflow that turns a brief topic summary into a visible chapter plan, preview, and EPUB/PDF output.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/start/topic"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
              >
                Start building your book
                <ArrowRight className="size-4" />
              </Link>
              <span className="text-sm text-muted-foreground">
                Start with short answers. See the outline, then proceed.
              </span>
            </div>

            <div className="mt-12 grid gap-3 md:grid-cols-3">
              {steps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="rounded-[24px] border border-border/80 bg-card/80 p-5 text-left backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary/70">
                        Step {item.step}
                      </span>
                      <Icon className="size-4 text-primary" />
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-foreground">{item.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            badge="3-step process"
            title="How exactly does the process work?"
            description="As a new visitor, you should see not only what happens but also what you get at the end of each step. This page exists for that reason."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.step} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col space-y-4 p-6">
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-sm font-medium text-primary">
                        {item.step}
                      </span>
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-2xl font-semibold tracking-tight text-foreground">{item.title}</h3>
                      <p className="text-sm leading-8 text-muted-foreground">{item.text}</p>
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/70">
                        Result of this step
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">{item.output}</p>
                    </div>
                    <div className="border-t border-border/60 pt-4">
                      <Link
                        href="/start/topic"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        {item.cta}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            badge="Trust and clarity"
            title="Guides you with a visible workflow, not blank page anxiety"
            description="This page isn't just about showcasing features — it clarifies how much effort you'll invest, how much control you'll have, and what you'll receive at the end."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {reassuranceItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardContent className="p-6">
                    <Icon className="size-5 text-primary" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            badge="Why is it clearer?"
            title="Breaks the path from brief to publish into visible pieces"
            description='The process is not just a single "generate" button. Direction is established first, then the plan solidifies, then output-driven production begins.'
          />

          <div className="grid gap-4 md:grid-cols-2">
            {behindTheScenes.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary/80">
                      <Icon className="size-4" />
                      {item.eyebrow}
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground">{item.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-8 text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <SectionHeading
              badge="Who is it for?"
              title="Especially for those who want to turn their expertise into a book"
              description="This workflow is not just for those who want to write — it is better suited for those who want to productize, systematize, and turn their knowledge into concrete output."
            />

            <div className="space-y-3">
              {audience.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card px-4 py-4"
                >
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <p className="text-sm leading-7 text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading
              badge="At the end of the process"
              title="What do you end up with?"
              description="Not just ideas — you get visible intermediate outputs that enable progress and files ready for delivery."
            />

            <div className="grid gap-4">
              {deliverables.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.label}>
                    <CardContent className="flex items-start gap-4 p-5">
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase tracking-[0.16em] text-primary/80">
                          {item.label}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-foreground">{item.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            badge="Frequently asked questions"
            title="Most asked questions before deciding"
            description="A how-it-works page should not leave uncertainty while trying to persuade. These short answers fill that gap."
          />

          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <Card key={item.question}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground">{item.question}</h3>
                  <p className="mt-3 text-sm leading-8 text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="shell">
          <div className="rounded-[32px] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_7%,var(--background)),var(--background))] p-8 md:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Ready to start
              </div>
              <h2 className="mt-6 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Don't stare at a blank screen — <span className="text-primary">start with a guided system.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                Clarify your topic, see your chapter plan, review the preview, and convert your book to output.
                Instead of building the process piece by piece, move forward with visible steps.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/start/topic"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                >
                  Start your free preview
                  <ArrowRight className="size-4" />
                </Link>
                <span className="text-sm text-muted-foreground">Start with a brief intro · See the plan · Then decide</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </MarketingPage>
  );
}