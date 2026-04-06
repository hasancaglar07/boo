import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers3, Magnet, PenSquare, Search, Sparkles, type LucideIcon } from "lucide-react";

import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/seo";
import { marketingToolCatalog, type ToolIconKey } from "@/lib/marketing-tools";

const iconMap: Record<ToolIconKey, LucideIcon> = {
  sparkles: Sparkles,
  target: Sparkles,
  compass: Sparkles,
  trending: Sparkles,
  layers: Layers3,
  search: Search,
  magnet: Magnet,
  book: BookOpen,
  pen: PenSquare,
};

export const metadata: Metadata = buildPageMetadata({
  title: "Free Book Tools | Book Generator",
  description:
    "Score your idea, generate an outline, test your KDP niche. Prepare your book for publishing with AI-powered free tools.",
  path: "/tools",
  keywords: [
    "free book tools",
    "book idea test",
    "book outline generator",
    "KDP niche analysis",
    "book title checker",
  ],
});

const pillars = [
  "Score your idea, generate your outline",
  "Get instant scores and a detailed report delivered to your email",
  "Jump straight to a book preview from any tool",
];

export default function ToolsPage() {
  return (
    <MarketingPage>
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Free Tools</Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              <span className="text-primary">Free tools</span> to accelerate your book
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              Score your idea, generate your outline, test your title. Every tool brings you one step closer to a finished book preview.
            </p>
            <div className="mx-auto mt-8 grid max-w-3xl gap-3 md:grid-cols-3">
              {pillars.map((item) => (
                <div key={item} className="rounded-[22px] border border-border/80 bg-card/70 px-4 py-4 text-sm text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading
            badge="Tool Library"
            title="Powerful individually, comprehensive together."
            description="Every tool works the same way: quick score, clear recommendations, detailed report, and a seamless path to preview."
          />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {marketingToolCatalog.map((tool) => {
              const Icon = iconMap[tool.icon];
              return (
                <Card key={tool.slug} className="flex flex-col border-border/80">
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <Badge>{tool.badge}</Badge>
                    </div>

                    <div className="flex-1">
                      <h2 className="text-xl font-semibold tracking-tight text-foreground">{tool.name}</h2>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{tool.description}</p>
                    </div>

                    <Link href={tool.path} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                      {tool.ctaLabel}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <MarketingCtaSection
        title="Done exploring? Start writing your book."
        description="Use the tools to clarify your direction, then move into the preview flow. Decide here, produce in the wizard."
        items={[
          "Go from idea to outline in a single click",
          "Test KDP and customer angles early on",
          "Get a detailed report delivered to your email",
          "Preview → full book → EPUB/PDF pipeline",
        ]}
      />
    </MarketingPage>
  );
}