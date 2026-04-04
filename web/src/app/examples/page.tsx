import type { Metadata } from "next";

import { ExamplesPageHero } from "@/components/site/page-heroes";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { ExamplesShowcase } from "@/components/site/examples-showcase";
import { loadExamplesShowcaseData } from "@/lib/examples-data";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Örnek Çıktılar | Kitap Oluşturucu",
  description:
    "Kitap Oluşturucu'nun örnek vitrini: 30 çok dilli kitap, gerçek kapaklar, bölüm planları ve çıktı dosyaları.",
  path: "/examples",
  keywords: ["book generator örnekler", "epub örnek çıktı", "ai kitap kapak örnekleri"],
});

export const revalidate = 86400;

export default async function ExamplesPage() {
  const { items, categories, languages } = await loadExamplesShowcaseData();
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Örnek Çıktılar",
    description:
      "Kitap Oluşturucu'nun çok dilli örnek kitap vitrini: gerçek kapaklar, bölüm yapıları ve çıktı yüzeyleri.",
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

  return (
    <MarketingPage>
      <ExamplesPageHero items={items} />

      <section className="border-b border-border/80 py-20">
        <div className="shell">
          <SectionHeading
            badge="Örnekler"
            title="Vaat değil, gerçek çıktı."
            description="Bu sayfa ürünün gerçek teslim yüzeyini gösterir: çok dilli kitaplar, gerçek kapaklar, bölüm yapısı ve çıktı zinciri."
          />
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            Buradaki amaç ilham vermek değil, güven vermek. Bir örnek sana yakın geliyorsa aynı akışı kendi konu özetinle birkaç adım içinde başlatabilirsin.
          </p>
        </div>
      </section>

      <ExamplesShowcase items={items} categories={categories} languages={languages} />

      <MarketingCtaSection
        title="Örnekleri gördüysen şimdi kendi önizlemeni gör."
        description="Aynı akışı kendi konu özetinle dene: sihirbaz, bölüm planı, bölüm, kapak ve çıktı. Önce önizleme gelir, sonra tam kitabı açmaya karar verirsin."
        items={[
          "5 soruluk hızlı sihirbaz",
          "Bölüm planı + bölüm üretimi",
          "Kapak ve kitap bilgileri akışı",
          "Önce önizleme, sonra tam kitap",
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
    </MarketingPage>
  );
}
