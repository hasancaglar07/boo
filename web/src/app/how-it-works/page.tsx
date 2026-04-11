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
import { getTranslations } from "next-intl/server";

import { DirectAnswerBlock } from "@/components/site/direct-answer";
import { LastUpdated } from "@/components/site/last-updated";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { buildHowToSchema } from "@/lib/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const t = await getTranslations("HowItWorksPage.metadata");
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/how-it-works",
    keywords: ["how book creator works", "ai book production", "epub pdf book creation"],
  });
}

const stepIcons = [Target, Layers3, FileOutput];
const reassuranceIcons = [Clock3, PencilRuler, ShieldCheck, Users];
const behindScenesIcons = [Target, Layers3, Sparkles, FileOutput];
const deliverableIcons = [WandSparkles, SearchCheck, BookOpenCheck, FileOutput];

export default async function HowItWorksPage() {
  const t = await getTranslations("HowItWorksPage");

  const steps = [0, 1, 2].map((i) => ({
    step: t(`steps.${i}.step`),
    title: t(`steps.${i}.title`),
    text: t(`steps.${i}.text`),
    output: t(`steps.${i}.output`),
    cta: t(`steps.${i}.cta`),
    icon: stepIcons[i],
  }));

  const reassuranceItems = [0, 1, 2, 3].map((i) => ({
    title: t(`reassurance.items.${i}.title`),
    text: t(`reassurance.items.${i}.text`),
    icon: reassuranceIcons[i],
  }));

  const behindTheScenes = [0, 1, 2, 3].map((i) => ({
    eyebrow: t(`behindScenes.items.${i}.eyebrow`),
    title: t(`behindScenes.items.${i}.title`),
    description: t(`behindScenes.items.${i}.description`),
    icon: behindScenesIcons[i],
  }));

  const audience = [0, 1, 2].map((i) => t(`whoFor.audience.${i}`));

  const deliverables = [0, 1, 2, 3].map((i) => ({
    label: t(`deliverables.items.${i}.label`),
    text: t(`deliverables.items.${i}.text`),
    icon: deliverableIcons[i],
  }));

  const faqs = [0, 1, 2, 3].map((i) => ({
    question: t(`faq.items.${i}.question`),
    answer: t(`faq.items.${i}.answer`),
  }));

  const howToSchema = buildHowToSchema({
    name: "How to Generate a Book with AI",
    description: "Complete guide to creating a publication-ready book using Book Generator's AI-powered platform in 3 simple steps",
    estimatedTime: "PT30M",
    steps: steps.map((item) => ({ name: item.title, text: item.text })),
  });

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
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
              {t("hero.badge")}
            </div>
            <h1 className="mt-8 text-balance font-serif text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
              {t("hero.title")} <span className="text-primary">{t("hero.titleHighlight")}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground md:text-lg">
              {t("hero.description")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/start/topic"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
              >
                {t("hero.cta")}
                <ArrowRight className="size-4" />
              </Link>
              <span className="text-sm text-muted-foreground">{t("hero.ctaSubtext")}</span>
            </div>
            <div className="mt-8 text-left">
              <DirectAnswerBlock question={t("directAnswer.question")} answer={t("directAnswer.answer")} />
              <LastUpdated date="2026-04-09" className="mt-4 text-sm" />
            </div>
            <div className="mt-12 grid gap-3 md:grid-cols-3">
              {steps.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="rounded-[24px] border border-border/80 bg-card/80 p-5 text-left backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary/70">
                        {t("stepsSection.stepPrefix")} {item.step}
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
          <SectionHeading badge={t("stepsSection.badge")} title={t("stepsSection.title")} description={t("stepsSection.description")} />
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.step} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col space-y-4 p-6">
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-sm font-medium text-primary">{item.step}</span>
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-2xl font-semibold tracking-tight text-foreground">{item.title}</h3>
                      <p className="text-sm leading-8 text-muted-foreground">{item.text}</p>
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/70">{t("stepsSection.resultLabel")}</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{item.output}</p>
                    </div>
                    <div className="border-t border-border/60 pt-4">
                      <Link href="/start/topic" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
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
          <SectionHeading badge={t("reassurance.badge")} title={t("reassurance.title")} description={t("reassurance.description")} />
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
          <SectionHeading badge={t("behindScenes.badge")} title={t("behindScenes.title")} description={t("behindScenes.description")} />
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
            <SectionHeading badge={t("whoFor.badge")} title={t("whoFor.title")} description={t("whoFor.description")} />
            <div className="space-y-3">
              {audience.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card px-4 py-4">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <p className="text-sm leading-7 text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionHeading badge={t("deliverables.badge")} title={t("deliverables.title")} description={t("deliverables.description")} />
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
                        <div className="text-xs font-medium uppercase tracking-[0.16em] text-primary/80">{item.label}</div>
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
          <SectionHeading badge={t("faq.badge")} title={t("faq.title")} description={t("faq.description")} />
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
                {t("cta.badge")}
              </div>
              <h2 className="mt-6 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                {t("cta.title")} <span className="text-primary">{t("cta.titleHighlight")}</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                {t("cta.description")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/start/topic"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                >
                  {t("cta.button")}
                  <ArrowRight className="size-4" />
                </Link>
                <span className="text-sm text-muted-foreground">{t("cta.buttonSubtext")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </MarketingPage>
  );
}
