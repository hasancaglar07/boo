import { Download, BookOpen, FileText, Search, Lightbulb, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LeadMagnetSignupCard } from "@/components/site/lead-magnet-signup-card";
import { DirectAnswerBlock } from "@/components/site/direct-answer";
import { LastUpdated } from "@/components/site/last-updated";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { featuredLeadMagnet } from "@/lib/lead-magnets";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const t = await getTranslations("ResourcesPage.metadata");
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/resources",
    keywords: ["free book writing guide", "epub template", "book chapter plan template", "ai book checklist"],
  });
}

const resourceIcons = [FileText, Sparkles, CheckCircle2, Search, BookOpen, Lightbulb, Download];
const resourceHrefs = ["/start/topic", "/tools", "/start/topic", "/start/topic", "/start/topic", "/start/topic", "/start/topic"];

export default async function ResourcesPage() {
  const t = await getTranslations("ResourcesPage");

  const resources = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
    icon: resourceIcons[i],
    badge: t(`resources.${i}.badge`),
    title: t(`resources.${i}.title`),
    description: t(`resources.${i}.description`),
    highlights: [0, 1, 2, 3].map((j) => t(`resources.${i}.highlights.${j}`)),
    cta: t(`resources.${i}.cta`),
    href: resourceHrefs[i],
    featured: i === 0,
  }));

  return (
    <MarketingPage>
      <section className="border-b border-border/80 py-12">
        <div className="shell">
          <DirectAnswerBlock question={t("directAnswer.question")} answer={t("directAnswer.answer")} />
          <LastUpdated date="2026-04-09" className="mt-4 text-sm" />
        </div>
      </section>

      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">{t("hero.badge")}</Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              {t("hero.description")}
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <LeadMagnetSignupCard leadMagnet={featuredLeadMagnet} />
        </div>
      </section>

      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading
            badge={t("allResourcesSection.badge")}
            title={t("allResourcesSection.title")}
            description={t("allResourcesSection.description")}
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
                    <ul className="space-y-1.5">
                      {resource.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="size-3 shrink-0 text-primary" />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <Link href={resource.href} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                      {resource.cta} <ArrowRight className="size-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <MarketingCtaSection
        title={t("cta.title")}
        description={t("cta.description")}
        items={[t("cta.items.0"), t("cta.items.1"), t("cta.items.2"), t("cta.items.3")]}
      />
    </MarketingPage>
  );
}
