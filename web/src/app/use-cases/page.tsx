import { User, Users, Briefcase, GraduationCap, Globe, Mic, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { DirectAnswerBlock } from "@/components/site/direct-answer";
import { LastUpdated } from "@/components/site/last-updated";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildPageMetadata, absoluteUrl } from "@/lib/seo";

export async function generateMetadata() {
  const t = await getTranslations("UseCasesPage.metadata");
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/use-cases",
    keywords: ["ai book production", "consultant book writing", "instructor book", "course creator book"],
  });
}

const segmentIcons = [User, Briefcase, GraduationCap, Globe, Mic, Users];
const segmentColors = [
  { color: "bg-blue-50 border-blue-100", iconColor: "text-blue-600" },
  { color: "bg-purple-50 border-purple-100", iconColor: "text-purple-600" },
  { color: "bg-green-50 border-green-100", iconColor: "text-green-600" },
  { color: "bg-orange-50 border-orange-100", iconColor: "text-orange-600" },
  { color: "bg-rose-50 border-rose-100", iconColor: "text-rose-600" },
  { color: "bg-teal-50 border-teal-100", iconColor: "text-teal-600" },
];
const segmentHrefs = ["/resources", "/resources", "/start/topic", "/pricing", "/start/topic", "/contact"];

export default async function UseCasesPage() {
  const t = await getTranslations("UseCasesPage");

  const segments = [0, 1, 2, 3, 4, 5].map((i) => ({
    icon: segmentIcons[i],
    badge: t(`segments.${i}.badge`),
    title: t(`segments.${i}.title`),
    description: t(`segments.${i}.description`),
    benefits: [0, 1, 2, 3].map((j) => t(`segments.${i}.benefits.${j}`)),
    outcome: t(`segments.${i}.outcome`),
    cta: t(`segments.${i}.cta`),
    ctaHref: segmentHrefs[i],
    ...segmentColors[i],
  }));

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
      <section className="border-b border-border/80 py-12">
        <div className="shell">
          <DirectAnswerBlock question={t("directAnswer1.question")} answer={t("directAnswer1.answer")} />
          <LastUpdated date="2026-04-09" className="mt-4 text-sm" />
        </div>
      </section>

      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">{t("hero.badge")}</Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {t("hero.title")}{" "}
              <span className="text-primary">{t("hero.titleHighlight")}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              {t("hero.description")}
            </p>
            <div className="mt-8 text-left">
              <DirectAnswerBlock question={t("directAnswer2.question")} answer={t("directAnswer2.answer")} />
              <LastUpdated date="2026-04-09" className="mt-4 text-sm" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading badge={t("segmentsSection.badge")} title={t("segmentsSection.title")} description={t("segmentsSection.description")} />
          <div className="space-y-8">
            {segments.map((segment, i) => {
              const Icon = segment.icon;
              const isEven = i % 2 === 0;
              return (
                <div key={segment.title} className="rounded-3xl border border-border/80 bg-background p-8 md:p-10">
                  <div className={`grid gap-10 md:grid-cols-2 md:items-start ${!isEven ? "md:[&>*:first-child]:order-2" : ""}`}>
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${segment.color}`}>
                          <Icon className={`size-5 ${segment.iconColor}`} />
                        </div>
                        <Badge>{segment.badge}</Badge>
                      </div>
                      <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{segment.title}</h2>
                      <p className="mt-3 text-base leading-8 text-muted-foreground">{segment.description}</p>
                      <Link href={segment.ctaHref} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                        {segment.cta}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
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
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("segmentsSection.outcomeLabel")}</p>
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
        title={t("cta.title")}
        description={t("cta.description")}
        items={[t("cta.items.0"), t("cta.items.1"), t("cta.items.2"), t("cta.items.3")]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
    </MarketingPage>
  );
}
