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
import { getTranslations } from "next-intl/server";

import { AboutPageHero } from "@/components/site/page-heroes";
import { DirectAnswerBlock } from "@/components/site/direct-answer";
import { LastUpdated } from "@/components/site/last-updated";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { CyberneticBentoGrid } from "@/components/ui/cybernetic-bento-grid";
import { Features4 } from "@/components/ui/features-4";
import { Card, CardContent } from "@/components/ui/card";
import { buildReviewSchema } from "@/lib/schema";
import { buildPageMetadata, absoluteUrl, siteConfig } from "@/lib/seo";
import { customerReviews, aggregateRating } from "@/lib/reviews-data";

export async function generateMetadata() {
  const t = await getTranslations("AboutPage.metadata");
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/about",
    keywords: ["book generator about", "ai book production", "book writing platform"],
  });
}

const principleIcons = [Eye, Layers3, FilePenLine, BookOpenCheck, ShieldCheck, Sparkles];

export default async function AboutPage() {
  const t = await getTranslations("AboutPage");

  const principles = [0, 1, 2, 3, 4, 5].map((i) => {
    const PIcon = principleIcons[i];
    return {
      title: t(`principles.items.${i}.title`),
      description: t(`principles.items.${i}.description`),
      icon: <PIcon className="size-4" />,
    };
  });

  const metrics = [0, 1, 2, 3].map((i, idx) => {
    const icons = [
      <BookMarked key="bm" className="size-5 text-primary" />,
      <Sparkles key="sp" className="size-5 text-primary" />,
      <Eye key="ey" className="size-5 text-primary" />,
      <ShieldCheck key="sc" className="size-5 text-primary" />,
    ];
    return {
      icon: icons[idx],
      value: t(`metrics.${i}.value`),
      label: t(`metrics.${i}.label`),
    };
  });

  const aboutBentoItems = [0, 1, 2, 3, 4].map((i) => ({
    eyebrow: t(`approach.items.${i}.eyebrow`),
    title: t(`approach.items.${i}.title`),
    description: t(`approach.items.${i}.description`),
    metric: i === 0 ? t(`approach.items.0.metric`) : undefined,
    bullets: Object.keys(
      (t.raw(`approach.items.${i}.bullets`) as Record<string, string>) ?? {}
    ).map((k) => t(`approach.items.${i}.bullets.${k}`)),
    className: ["md:col-span-2 md:row-span-2", "md:col-span-2", "md:col-span-1", "md:col-span-1", "md:col-span-2"][i],
  }));

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

      <section className="border-b border-border/80 py-12">
        <div className="shell">
          <DirectAnswerBlock question={t("directAnswer1.question")} answer={t("directAnswer1.answer")} />
          <LastUpdated date="2026-04-09" className="mt-4 text-sm" />
        </div>
      </section>

      <section className="border-b border-border/80 bg-accent/30 py-8">
        <div className="shell grid grid-cols-2 gap-4 md:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card/80 px-4 py-5 text-center shadow-sm">
              {m.icon}
              <div className="text-2xl font-bold tracking-tight text-foreground">{m.value}</div>
              <div className="text-xs leading-5 text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-border/80 py-12">
        <div className="shell">
          <DirectAnswerBlock question={t("directAnswer2.question")} answer={t("directAnswer2.answer")} />
        </div>
      </section>

      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <h1 className="sr-only">About Book Generator</h1>
          <SectionHeading badge={t("about.badge")} title={t("about.title")} description={t("about.description")} />
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{t("about.additionalText")}</p>
        </div>
      </section>

      <section className="border-b border-border/80">
        <Features4
          badge={t("principles.badge")}
          title={t("principles.title")}
          description={t("principles.description")}
          items={principles}
        />
      </section>

      <section className="border-b border-border/80">
        <CyberneticBentoGrid
          badge={t("approach.badge")}
          title={t("approach.title")}
          description={t("approach.description")}
          items={aboutBentoItems}
        />
      </section>

      <section className="border-b border-border/80 py-18">
        <div className="shell grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">{t("missionApproach.mission.title")}</h2>
              <p className="text-sm leading-8 text-muted-foreground">{t("missionApproach.mission.description")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">{t("missionApproach.approach.title")}</h2>
              <p className="text-sm leading-8 text-muted-foreground">{t("missionApproach.approach.description")}</p>
            </CardContent>
          </Card>
        </div>
        <div className="shell mt-6 text-center text-sm text-muted-foreground">
          <Link href="/contact" className="font-medium text-primary/80 underline-offset-4 hover:underline">
            {t("missionApproach.contact")}
          </Link>
        </div>
      </section>

      <MarketingCtaSection
        title={t("cta.title")}
        description={t("cta.description")}
        items={[t("cta.items.0"), t("cta.items.1"), t("cta.items.2"), t("cta.items.3")]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }} />
    </MarketingPage>
  );
}
