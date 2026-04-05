import type { Metadata } from "next";
import Link from "next/link";

import { PremiumBookHero } from "@/components/site/premium-book-hero";
import { InteractiveBookShowcase } from "@/components/site/interactive-book-showcase";

import { HomeHowItWorksSection } from "@/components/site/home-how-it-works-section";
import { HomeTestimonialsSection } from "@/components/site/home-testimonials-section";
import { HomeBlogPreviewSection } from "@/components/site/home-blog-preview-section";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { PricingCreativeSection } from "@/components/site/pricing-creative-section";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { loadExamplesShowcaseData } from "@/lib/examples-data";
import { buildPageMetadata, buildOgImageUrl } from "@/lib/seo";
import { KDP_GUARANTEE_CLAIM, KDP_LIVE_BOOKS_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

export const metadata: Metadata = buildPageMetadata({
  title: "Yapay Zeka ile Kitap Yaz | 15 Dakikada KDP Uyumlu EPUB Oluştur",
  description:
    "Uzmanlığını yapay zeka ile yayına hazır kitaba dönüştür. Taslak, kapak ve EPUB/PDF çıktısı 5 soruda oluştur. Kredi kartı gerekmeden ücretsiz önizle.",
  path: "/",
  keywords: [
    "yapay zeka kitap yazma",
    "ai ile kitap yaz",
    "kitap oluşturucu",
    "kdp kitap hazırlama",
    "epub oluşturma",
    "kitap yazma aracı",
    "pdf kitap oluşturma",
    "kindle kitap hazırlama",
    "yapay zeka ile kitap",
    "online kitap yazma",
    "e kitap oluşturucu",
    "kitap taslak oluşturma",
    "self publishing aracı",
  ],
  ogImage: buildOgImageUrl(
    "Yapay Zeka ile Kitap Yaz",
    "Uzmanlığını 15 dakikada yayına hazır kitaba dönüştür. Ücretsiz önizle."
  ),
});

const HOME_SHOWCASE_SLUGS = [
  "authority-in-100-pages",
  "silent-offers",
  "prompt-systems-for-small-teams",
] as const;

export default async function HomePage() {
  const { items: exampleItems } = await loadExamplesShowcaseData();
  const showcaseMap = new Map(exampleItems.map((item) => [item.slug, item] as const));
  const curatedHomeShowcaseBooks = HOME_SHOWCASE_SLUGS
    .map((slug) => showcaseMap.get(slug))
    .filter(
      (item): item is (typeof exampleItems)[number] =>
        Boolean(item && (item.coverImages.primaryUrl || item.coverImages.fallbackUrl)),
    );
  const homeShowcaseBooks = curatedHomeShowcaseBooks;
  const fallbackShowcaseBooks =
    homeShowcaseBooks.length >= 4
      ? homeShowcaseBooks
      : exampleItems.filter((item) => Boolean(item.coverImages.primaryUrl || item.coverImages.fallbackUrl)).slice(0, 6);

  const starterFaq: Array<[string, string]> = [
    [
      "Yapay zeka ile yazılan kitap gerçekten kaliteli olur mu?",
      `Yapay zeka taslak oluşturur, kaliteyi sen belirlersin. Her bölümü düzenleyebilir, beğenmediğini yeniden üretebilirsin. ${KDP_LIVE_BOOKS_CLAIM} kitabımız ${KDP_GUARANTEE_CLAIM} ile yayında.`,
    ],
    [
      "Yapay zeka ile kitap yazmak ne kadar sürer?",
      "Konunu gir, 30-90 dakika içinde yayına hazır EPUB ve PDF al. Çoğu kitap tek oturumda tamamlanır.",
    ],
    [
      "EPUB ve PDF çıktılarını KDP'ye doğrudan yükleyebilir miyim?",
      "Evet. EPUB ve PDF formatında KDP uyumlu çıktı alırsın. Yükleme öncesi kendi kontrol listenle son bir gözden geçirme önerilir.",
    ],
  ];

  return (
    <MarketingPage>
      <PremiumBookHero />

      {/* MiddleBlock: "Bu ne?" sorusunu erkenden cevapla */}
      <section className="border-b border-border/80 py-18">
        <div className="shell">
          <h2 className="text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Yapay Zeka ile Kitap Yaz: Fikrinden EPUB ve PDF Kitap Hazırla
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
            Kitap Oluşturucu ile uzmanlığını yayına hazır kitaba dönüştür. Yapay zeka destekli taslak oluşturma, kapak tasarımı ve KDP uyumlu EPUB/PDF çıktısı tek akışta.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Ücretsiz önizleme ile kitabını gör, beğenirsen tam erişim aç. Kredi kartı gerekmeden hemen başla.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">Eğitmenler, Danışmanlar ve İçerik Üreticileri İçin</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Uzmanlığını KDP kitaba çevirmek isteyenler için yapay zeka destekli kitap yazma platformu. E-kitap hazırlama artık tek akışta.
              </p>
              <Link href="/use-cases" className="mt-3 inline-block text-xs font-medium text-primary/80 underline-offset-4 hover:underline">
                Tüm kullanım alanlarını gör →
              </Link>
            </div>
            <div className="rounded-[24px] border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">Boş Sayfa ve Dağınık Araç Sorunu Biter</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Yapay zeka ile kitap yazarken taslak, içerik ve çıktı tek platformda. Farklı araçlara gerek kalmadan kitabını tamamla.
              </p>
              <Link href="/compare" className="mt-3 inline-block text-xs font-medium text-primary/80 underline-offset-4 hover:underline">
                Alternatiflere göre farkımız →
              </Link>
            </div>
            <div className="rounded-[24px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))] px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">KDP Uyumlu EPUB ve PDF Dosyaları</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Düzenlenebilir bölümler, profesyonel kapak ve yayına hazır EPUB + PDF çıktıları. Kindle ve KDP ile uyumlu.
              </p>
            </div>
          </div>
        </div>
      </section>

      <HomeHowItWorksSection />
      <InteractiveBookShowcase books={fallbackShowcaseBooks} />

      {/* Pricing: "pahalı mı?" sorusunu testimonials'tan önce cevapla */}
      <section className="border-b border-border/80 py-18">
        <PricingCreativeSection
          tag="Kitap Fiyatlandırması"
          title="İlk Kitabını $4 ile Hazırla — KDP Uyumlu EPUB ve PDF Dahil"
          description="$4 ile bir kitabın tam içeriğine eriş: yapay zeka destekli taslak, profesyonel kapak, EPUB ve PDF çıktıları. Ücretsiz önizleme ile karar ver, sonra tam erişim aç."
        />
      </section>

      <HomeTestimonialsSection />
      <HomeBlogPreviewSection />

      <section className="border-b border-border/80 py-18">
        <div className="shell">
          <SectionHeading
            badge="Kitap Yazma Hakkında SSS"
            title="Yapay Zeka ile Kitap Yazma Hakkında Sık Sorulan Sorular"
            description="AI kitap oluşturucu nasıl çalışır, çıktı kalitesi nasıl ve KDP'ye uygun mu? Kitap yazma sürecindeki en kritik sorular."
            actionHref="/faq"
            actionLabel="Tüm sorular"
          />

          <div className="grid gap-4 md:grid-cols-2">
            {starterFaq.map(([question, answer]) => (
              <Card key={question} className="rounded-[28px]">
                <CardContent className="space-y-3">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    {question}
                  </h3>
                  <p className="text-sm leading-8 text-muted-foreground">{answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <MarketingCtaSection
        title="Yapay Zeka ile Kitap Yazmaya Bugün Başla"
        description={`Konunu yaz, 15 dakikada ücretsiz önizlemeni oluştur. ${NO_API_COST_CLAIM}, kredi karti gerekmez.`}
        items={[
          "Yapay zeka ile taslak, kapak ve içerik hazır",
          "Ücretsiz önizleme, beğenirsen tam erişim",
          "KDP uyumlu EPUB + PDF çıktı",
        ]}
      />
    </MarketingPage>
  );
}
