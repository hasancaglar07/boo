import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, BookOpen, CheckCircle2, Globe, Layers3, Sparkles } from "lucide-react";

import { ExamplesPageHero } from "@/components/site/page-heroes";
import { DirectAnswerBlock } from "@/components/site/direct-answer";
import { LastUpdated } from "@/components/site/last-updated";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { ExamplesShowcase } from "@/components/site/examples-showcase";
import { loadExamplesShowcaseData } from "@/lib/examples-data";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const t = await getTranslations("ExamplesPage.metadata");
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/examples",
    keywords: ["example books", "ai book examples", "epub pdf html book examples"],
  });
}

export const revalidate = 86400;

const introItemIcons = [Layers3, Sparkles, BookOpen, Globe];

export default async function ExamplesPage() {
  const t = await getTranslations("ExamplesPage");
  const { items, categories, languages } = await loadExamplesShowcaseData();

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Example Books and Real Outputs",
    description: "An example book showcase with real covers, visible chapter plans, first chapter previews, and output files.",
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
    mainEntity: [0, 1, 2, 3].map((i) => ({
      "@type": "Question",
      name: t(`faqs.${i}.question`),
      acceptedAnswer: { "@type": "Answer", text: t(`faqs.${i}.answer`) },
    })),
  };

  return (
    <MarketingPage>
      <ExamplesPageHero items={items} />

      <section className="border-b border-border/80 py-12">
        <div className="shell">
          <DirectAnswerBlock question={t("directAnswer.question")} answer={t("directAnswer.answer")} />
          <LastUpdated date="2026-04-09" className="mt-4 text-sm" />
        </div>
      </section>

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell">
          <SectionHeading badge={t("intro.badge")} title={t("intro.title")} description={t("intro.description")} />
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div className="rounded-[28px] border border-border/80 bg-card p-6 md:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t("intro.fourThingsHeading")}</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[0, 1, 2, 3].map((i) => {
                  const Icon = introItemIcons[i];
                  return (
                    <div key={i} className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                      <Icon className="size-5 text-primary" />
                      <h3 className="mt-3 text-base font-semibold text-foreground">{t(`intro.items.${i}.title`)}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{t(`intro.items.${i}.text`)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-[28px] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_6%,var(--background)),var(--background))] p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">{t("intro.usageBadge")}</p>
              <ul className="mt-4 space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {t(`intro.instructions.${i}`)}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-col gap-2">
                <Link href="#ornek-vitrini" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  {t("nextStep.btn1")} <ArrowRight className="size-3.5" />
                </Link>
                <Link href="/start/topic" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline">
                  {t("nextStep.btn1")} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ExamplesShowcase items={items} categories={categories} languages={languages} />

      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">{t("nextStep.badge")}</p>
            <h2 className="text-center font-serif text-3xl font-semibold tracking-tight text-foreground">{t("nextStep.heading")}</h2>
            <p className="mt-4 text-center text-sm leading-7 text-muted-foreground">{t("nextStep.description")}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/start/topic" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                {t("nextStep.btn1")} <ArrowRight className="size-4" />
              </Link>
              <Link href="/how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:bg-accent">
                {t("nextStep.btn2")}
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-primary hover:underline">
                {t("nextStep.btn3")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </MarketingPage>
  );
}
