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
  title: "Ücretsiz Kitap Araçları | Kitap Oluşturucu",
  description:
    "Fikrini puanla, taslak çıkar, KDP nişini test et. Yapay zeka destekli ücretsiz araçlarla kitabını yayına hazırla.",
  path: "/tools",
  keywords: [
    "ücretsiz kitap araçları",
    "kitap fikri test et",
    "kitap taslak oluşturucu",
    "KDP niş analizi",
    "kitap başlık kontrolü",
  ],
});

const pillars = [
  "Fikrini puanla, taslağını çıkar",
  "Anında skor, detaylı rapor e-postana gelsin",
  "Her araçtan kitap önizlemesine doğrudan geç",
];

export default function ToolsPage() {
  return (
    <MarketingPage>
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Ücretsiz Araçlar</Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Kitabını hızlandıran <span className="text-primary">ücretsiz araçlar</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              Fikrini puanla, taslağını çıkar, başlığını test et. Her araç seni kitap önizlemesine bir adım yaklaştırır.
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
            badge="Araç Kütüphanesi"
            title="Tek tek güçlü, birlikte bütünsel."
            description="Her araç aynı mantıkla çalışır: hızlı skor, net öneri, detaylı rapor ve önizleme akışına geçiş."
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
        title="Aracı kurcalama, kitabını başlat."
        description="Araçlarla yönü netleştir, sonra önizleme akışına geç. Karar burada, üretim sihirbazda."
        items={[
          "Fikirden taslağa tek tıkla geç",
          "KDP ve müşteri açılarını erkenden sına",
          "Detaylı rapor e-postana gelsin",
          "Önizleme → tam kitap → EPUB/PDF zinciri",
        ]}
      />
    </MarketingPage>
  );
}
