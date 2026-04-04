import type { Metadata } from "next";
import { ShieldCheck, Check, ArrowRight, Zap, BookOpen, Layers, Sparkles, X } from "lucide-react";
import Link from "next/link";

import { PricingPageHero } from "@/components/site/page-heroes";
import { MarketingPage } from "@/components/site/marketing-page";
import { PricingCreativeSection } from "@/components/site/pricing-creative-section";
import { PricingComparisonTable } from "@/components/site/pricing-comparison-table";
import { plans, premiumPlan } from "@/lib/marketing-data";
import { buildPageMetadata, buildOgImageUrl, absoluteUrl, siteConfig } from "@/lib/seo";
import {
  KDP_GUARANTEE_CLAIM,
  KDP_LIVE_BOOKS_CLAIM,
  NO_API_COST_CLAIM,
  REFUND_GUARANTEE_CLAIM,
} from "@/lib/site-claims";

export const metadata: Metadata = buildPageMetadata({
  title: "Kitap Oluşturucu Fiyatları | Yapay Zeka Kitap Yazma Planları",
  description:
    "Kitap Oluşturucu fiyat planlarını karşılaştırın. $4 tek seferlik erişimle deneyin, aylık planlarla büyüyün. İlk kitabından tam üretim akışına kadar her seviyede plan var.",
  path: "/pricing",
  keywords: ["book generator fiyat", "ai kitap yazma planları", "kitap üretim aboneliği", "kdp kitap fiyat"],
  ogImage: buildOgImageUrl(
    "Kitap Oluşturucu Fiyatları",
    "Kitap Oluşturucu fiyat planlarını karşılaştırın. $4 tek seferlik erişimle deneyin, aylık planlarla büyüyün."
  ),
});

const pricingFaq = [
  [
    "Hangi planı seçmeliyim?",
    "İlk kitabını test ediyorsan Tek Kitap ($4) ile başla — risk sıfır, abonelik yok. Ayda birkaç kitap çıkaracaksan Temel ($19/ay, 10 kitap) çok daha ekonomik. Düzenli yayıncı olmak istiyorsan Yazar ($39/ay, 30 kitap) kırılım noktası — araştırma merkezi ve KDP analizi de dahil.",
  ],
  [
    "Önizleme gerçekten ücretsiz mi?",
    "Evet. Sihirbaza kayıt olmadan girebilirsin. Taslak, kapak önizlemesi ve ilk bölümleri görmek için ödeme gerekmez. Sadece tam kitap + çıktı için ödeme yaparsın.",
  ],
  [
    "KDP'ye direkt yükleyebilir miyim?",
    `Evet. EPUB ve PDF çıktıları Amazon KDP yükleme gereksinimlerini karşılayacak şekilde üretiliyor. Üretim akışı ${KDP_LIVE_BOOKS_CLAIM} mantığıyla tasarlanır ve teslim paketi ${KDP_GUARANTEE_CLAIM} odağında hazırlanır.`,
  ],
  [
    "Türkçe yazıp İngilizce kitap üretebilir miyim?",
    "Evet. Arayüz Türkçe kalır, kitap içeriği İngilizce veya seçtiğin başka dilde üretilir. KDP'nin en büyük pazarı İngilizce; bunu avantaja çevirebilirsin.",
  ],
  [
    "Planımı değiştirebilir miyim?",
    "Evet. İstediğin zaman yükselt, düşür veya iptal et. Faturalama alanından tek tıkla yönetilir, onay beklemez.",
  ],
  [
    "Kullanılmayan kitap hakları devrediyor mu?",
    "Hayır, aylık haklar sonraki aya taşınmaz. Bu yüzden ihtiyacın olan planı seç — gereğinden büyük plan almana gerek yok.",
  ],
];

const whoForItems = [
  {
    icon: BookOpen,
    plan: "Tek Kitap — $4",
    title: "İlk kez deneyen",
    description:
      "Bir kez öde, kitabın senin. $4 ile tüm süreci yaşa, beğenmezsen 30 gün içinde iade.",
    bullets: ["Yazarlık deneyimi gerekmez", "5 dakikada taslak hazır", "Risk sıfır"],
  },
  {
    icon: Sparkles,
    plan: "Başlangıç — $19/ay",
    title: "Düzenli içerik üreten",
    description:
      "Ayda 10 kitapla serini oluştur, KDP'de nişini genişlet. Kitap başına $1.90.",
    bullets: ["Ayda 10 kitap, 20 kapak", "EPUB + PDF her kitap için", "Kitap başına $1.90"],
  },
  {
    icon: Zap,
    plan: "Yazar — $39/ay",
    title: "KDP'de büyümek isteyen",
    description:
      "Araştırma merkezi ile hangi kitabın satacağını bil, 30 kitapla hızlı üret.",
    bullets: ["KDP anahtar kelime + pazar analizi", "30 kitap/ay, 60 kapak", "Ek dışa aktarma seçenekleri"],
  },
  {
    icon: Layers,
    plan: "Stüdyo — $79/ay",
    title: "Yoğun üretim / ajans",
    description:
      "80 kitap/ay, API ve otomasyon akışı açık. Ek fatura yok.",
    bullets: ["80 kitap/ay, 200 kapak", "API ve otomasyon erişimi", NO_API_COST_CLAIM],
  },
];

const competitorComparison = [
  { label: "Hayalet yazar / Ajans", price: "$500–$5,000", perBook: "kitap başına", highlight: false },
  { label: "Scrivener + ChatGPT + Canva + Calibre", price: "Ücretsiz ama…", perBook: "10–30 saat / kitap", highlight: false },
  { label: "Kitap Oluşturucu — Tek Kitap", price: "$4", perBook: "tek seferlik, abonelik yok", highlight: true },
  { label: "Kitap Oluşturucu — Başlangıç", price: "$1.90", perBook: "kitap başına ($19/ay, 10 kitap)", highlight: true },
];

export default function PricingPage() {
  const pricingSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: siteConfig.name,
    description: siteConfig.description,
    url: absoluteUrl("/pricing"),
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: [
      {
        "@type": "Offer",
        name: premiumPlan.name,
        price: "4",
        priceCurrency: "USD",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "4", priceCurrency: "USD", unitText: "tek seferlik" },
        availability: "https://schema.org/InStock",
        url: absoluteUrl("/pricing"),
      },
      ...plans.map((p) => ({
        "@type": "Offer",
        name: p.name,
        price: p.price.replace("$", ""),
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: p.price.replace("$", ""),
          priceCurrency: "USD",
          unitText: p.interval,
          billingDuration: "P1M",
        },
        availability: "https://schema.org/InStock",
        url: absoluteUrl("/pricing"),
      })),
    ],
  };

  const pricingFaqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pricingFaq.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <MarketingPage>
      <PricingPageHero />

      {/* Tek satırlık özet + Planlar — hemen hero altında */}
      <section className="shell pt-6 pb-0">
        <p className="text-center text-sm font-medium text-muted-foreground">
          İlk kitabın $4, sonraki kitaplar ayda $19&apos;dan başlıyor — önizleme ücretsiz.
        </p>
      </section>

      {/* Planlar — hemen yukarıda */}
      <PricingCreativeSection
        className="py-12"
        tag="Planlar"
        title="Bir kez öde veya aylık planla üret."
        description="$4 ile ilk kitabını aç, ayda 10 kitapla ritim kur, 30 veya 80 kitapla yayın sistemine dönüştür."
      />

      {/* Rakip karşılaştırma */}
      <section className="border-y border-border/80 bg-muted/30 py-14">
        <div className="shell">
          <h2 className="mb-2 text-center font-serif text-2xl font-semibold tracking-tight text-foreground">
            Aynı kitap, çok farklı fiyat.
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Başka yöntemlerle kitap çıkarmanın maliyeti.
          </p>
          <div className="mx-auto max-w-2xl divide-y divide-border/80 overflow-hidden rounded-[24px] border border-border/80 bg-card shadow-sm">
            {competitorComparison.map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between gap-4 px-6 py-4 ${
                  row.highlight
                    ? "bg-[linear-gradient(90deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))]"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {row.highlight ? (
                    <Check className="size-4 shrink-0 text-primary" />
                  ) : (
                    <X className="size-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className={`text-sm ${row.highlight ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {row.label}
                  </span>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${row.highlight ? "text-primary" : "text-foreground"}`}>
                    {row.price}
                  </p>
                  <p className="text-xs text-muted-foreground">{row.perBook}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/compare" className="text-primary/80 underline-offset-4 hover:underline">
              Detaylı özellik karşılaştırmasını gör →
            </Link>
          </p>
        </div>
      </section>

      {/* Kim için? */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <h2 className="mb-2 text-center font-serif text-2xl font-semibold tracking-tight text-foreground">
            Hangi plan sana uygun?
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Hedefine göre doğru başlangıç noktasını bul.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {whoForItems.map((item) => (
              <div
                key={item.plan}
                className="rounded-[24px] border border-border/80 bg-card/80 p-5 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-accent text-primary">
                  <item.icon className="size-5" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/80">{item.plan}</p>
                <h3 className="mt-1 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                <ul className="mt-4 space-y-1.5">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="size-3 shrink-0 text-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

            {/* Comparison table */}
      <section className="border-b border-border/80 py-14">
        <div className="shell">
          <h2 className="mb-2 text-center font-serif text-2xl font-semibold tracking-tight text-foreground">
            Özellik karşılaştırması
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Hangi planda ne var, yan yana gör.
          </p>
          <PricingComparisonTable />
        </div>
      </section>
{/* FAQ */}
      <section className="border-b border-border/80 bg-accent/20 py-16">
        <div className="shell">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-2 text-center font-serif text-3xl font-semibold tracking-tight text-foreground">
              Aklındaki sorular
            </h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Plan seçmeden önce bilmen gerekenler.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {pricingFaq.map(([question, answer]) => (
                <div
                  key={question}
                  className="rounded-[20px] border border-border/80 bg-card/80 px-5 py-4"
                >
                  <h3 className="text-sm font-semibold text-foreground">{question}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{answer}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Başka sorun var mı?{" "}
              <Link href="/faq" className="font-medium text-foreground underline-offset-4 hover:underline">
                Tüm SSS
              </Link>{" "}
              veya{" "}
              <Link href="/contact" className="font-medium text-foreground underline-offset-4 hover:underline">
                iletişim
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14">
        <div className="shell text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
            Önce kitabını gör —{" "}
            <span className="text-primary">sonra $4 öde.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
            Taslak ve kapak önizlemesi ücretsiz. Tam kitap + EPUB/PDF için $4 — bir kez öde, senindir.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/start/topic?plan=tek-kitap"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
            >
              Ücretsiz Önizleme Başlat
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/billing?plan=starter&autostart=1"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-7 py-3.5 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              Aylık Planla Başla
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/70">
            {[
              "Önizleme ücretsiz",
              "$4 tek seferlik",
              KDP_GUARANTEE_CLAIM,
              REFUND_GUARANTEE_CLAIM,
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="size-3 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqSchema) }}
      />
    </MarketingPage>
  );
}
