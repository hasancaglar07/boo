import Link from "next/link";
import { ArrowRight, BookOpen, Layers3, Magnet, PenSquare, Search, Sparkles, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { DirectAnswerBlock } from "@/components/site/direct-answer";
import { LastUpdated } from "@/components/site/last-updated";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildItemListSchema, buildBreadcrumbSchema } from "@/lib/schema";
import { buildPageMetadata, absoluteUrl } from "@/lib/seo";
import { marketingToolCatalog, type ToolIconKey } from "@/lib/marketing-tools";

const iconMap: Record<ToolIconKey, LucideIcon> = {
  sparkles: Sparkles, target: Sparkles, compass: Sparkles, trending: Sparkles,
  layers: Layers3, search: Search, magnet: Magnet, book: BookOpen, pen: PenSquare,
};

export async function generateMetadata() {
  const t = await getTranslations("ToolsPage.metadata");
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/tools",
    keywords: ["free book tools", "book idea test", "book outline creator", "KDP niche analysis"],
  });
}

export default async function ToolsPage() {
  const t = await getTranslations("ToolsPage");

  const toolsListSchema = buildItemListSchema({
    name: "Book Generator Free Tools",
    description: "AI-powered book tools: idea scoring, outline extraction, KDP niche analysis, and more",
    numberOfItems: marketingToolCatalog.length,
    itemListElement: marketingToolCatalog.map((tool, index) => ({
      position: index + 1,
      name: tool.name,
      description: tool.description,
      url: absoluteUrl(tool.path),
    })),
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", item: absoluteUrl("/") },
    { name: "Tools", item: absoluteUrl("/tools") },
  ]);

  return (
    <MarketingPage>
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">{t("hero.badge")}</Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              <span className="text-primary">{t("hero.titleHighlight")}</span> {t("hero.title")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">{t("hero.description")}</p>
            <div className="mt-8 text-left">
              <DirectAnswerBlock question={t("directAnswer.question")} answer={t("directAnswer.answer")} />
              <LastUpdated date="2026-04-09" className="mt-4 text-sm" />
            </div>
            <div className="mx-auto mt-8 grid max-w-3xl gap-3 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-[22px] border border-border/80 bg-card/70 px-4 py-4 text-sm text-muted-foreground">
                  {t(`pillars.${i}`)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading badge={t("toolsSection.badge")} title={t("toolsSection.title")} description={t("toolsSection.description")} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marketingToolCatalog.map((tool) => {
              const Icon = iconMap[tool.icon] ?? Sparkles;
              return (
                <Card key={tool.path} className="group">
                  <CardContent className="flex flex-col gap-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-accent text-primary">
                        <Icon className="size-5" />
                      </div>
                      <Badge className="text-xs">{tool.badge}</Badge>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground">{tool.name}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{tool.description}</p>
                    </div>
                    <Link href={tool.path} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                      Try it free <ArrowRight className="size-3.5" />
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </MarketingPage>
  );
}
