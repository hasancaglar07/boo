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
  title: "Ücretsiz Araçlar | Kitap Oluşturucu",
  description:
    "Kitap fikrini doğrulamak, outline çıkarmak, KDP nişini test etmek ve başlıklarını sıkılaştırmak için ücretsiz araçları kullan.",
  path: "/tools",
  keywords: [
    "ücretsiz kitap araçları",
    "book idea validator",
    "book outline starter",
    "kdp niche score",
    "kitap başlığı aracı",
  ],
});

const pillars = [
  "Idea -> outline -> title -> preview zinciri",
  "Skor açık, tam rapor email ile",
  "Her tool doğrudan start funnel'a bağlanır",
];

export default function ToolsPage() {
  return (
    <MarketingPage>
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Free Tools</Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Kitap kararını hızlandıran <span className="text-primary">ücretsiz araçlar</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              Fikri puanla, outline çıkar, KDP nişini daralt, müşteri çeken açı bul ve başlığını sıkılaştır. Amaç yalnız okumak değil; seni daha hızlı şekilde preview ve gerçek kitap akışına taşımak.
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
            title="Tek tek faydalı, birlikte daha güçlü."
            description="Her araç aynı funnel mantığıyla çalışır: hızlı skor, net öneri, tam rapor ve preview akışına geçiş."
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
        title="Araçta vakit kaybetme, kitabı başlat."
        description="Tool'larla yönü netleştir, sonra aynı konu özetini preview akışına taşı. En iyi kullanım biçimi bu: karar burada, üretim wizard içinde."
        items={[
          "Fikirden outline'a hızlı geçiş",
          "KDP ve lead magnet açılarını erkenden test et",
          "Tam rapor e-posta ile açılır",
          "Preview -> tam kitap -> EPUB/PDF zinciri",
        ]}
      />
    </MarketingPage>
  );
}
