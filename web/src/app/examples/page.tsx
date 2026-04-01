import type { Metadata } from "next";

import { ExamplesPageHero } from "@/components/site/page-heroes";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { ExamplesShowcase } from "@/components/site/examples-showcase";
import { loadExamplesShowcaseData } from "@/lib/examples-data";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Örnek Çıktılar | Book Generator",
  description:
    "Book Generator'ın global publishing studio vitrini: 30 çok dilli branded kitap, gerçek kapaklar, outline yapıları ve export dosyaları.",
  path: "/examples",
  keywords: ["book generator örnekler", "epub örnek çıktı", "ai kitap kapak örnekleri"],
});

export const dynamic = "force-dynamic";

export default async function ExamplesPage() {
  const { items, categories, languages } = await loadExamplesShowcaseData();

  return (
    <MarketingPage>
      <ExamplesPageHero />

      {/* Header */}
      <section className="border-b border-border/80 py-20">
        <div className="shell">
          <SectionHeading
            badge="Örnekler"
            title="Vaat değil, görülebilir çıktı."
            description="Bu sayfa ürünün gerçek teslim yüzeyini gösterir: çok dilli branded kitaplar, kapaklar, bölüm yapısı ve export zinciri."
          />
        </div>
      </section>

      {/* Filter + showcase + pipeline (client) */}
      <ExamplesShowcase items={items} categories={categories} languages={languages} />

      <MarketingCtaSection
        title="Örnekleri gördüysen şimdi kendi kitabını başlat."
        description="Aynı akışı kendi konu brief'inle dene: wizard, outline, bölüm ve export."
        items={[
          "5 soruluk hızlı wizard",
          "Outline + bölüm üretimi",
          "Kapak ve metadata akışı",
          "EPUB/PDF teslim zinciri",
        ]}
      />
    </MarketingPage>
  );
}
