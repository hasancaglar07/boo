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
  KDP_LIVE_BOOK_COUNT,
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
    `Evet. EPUB ve PDF çıktıları Amazon KDP yükleme gereksinimlerini karşılayacak şekilde üretiliyor. ${KDP_LIVE_BOOKS_CLAIM} ve kitaplarımız ${KDP_GUARANTEE_CLAIM} ile hazırlanır.`,
  ],
  [
    "Türkçe yazıp İngilizce kitap üretebilir miyim?",
    "Evet. Arayüz Türkçe kalır, kitap içeriği İngilizce veya seçtiğin başka dilde üretilir. KDP'nin en büyük pazarı İngilizce; bunu avantaja çevirebilirsin.",
  ],
  [
    "AI içeriği kaliteli çıkar mı?",
    `Sistem taslak üretir, kaliteyi sen belirlersin. Bölüm editörüyle her bölümü düzenleyebilir veya yeniden üretebilirsin. Üstelik ${KDP_LIVE_BOOKS_CLAIM} ve yayın hedefi KDP ise kitaplar ${KDP_GUARANTEE_CLAIM} ile ilerler.`,
  ],
  [
    "Planımı değiştirebilir miyim?",
    "Evet. İstediğin zaman yükselt, düşür veya iptal et. Faturalama alanından tek tıkla yönetilir, onay beklemez.",
  ],
  [
    "30 gün garantisi nasıl işliyor?",
    `Kitaplar ${KDP_GUARANTEE_CLAIM} ile hazırlanır. Ayrıca ilk 30 gün içinde memnun kalmazsan soru sormadan tam iade yapıyoruz. $4 Tek Kitap dahil tüm planlar kapsanıyor.`,
  ],
  [
    "Kullanılmayan kitap hakları devredyor mu?",
    "Hayır, aylık haklar sonraki aya taşınmaz. Bu yüzden ihtiyacın olan planı seç — gereğinden büyük plan almana gerek yok.",
  ],
];

const whoForItems = [
  {
    icon: BookOpen,
    plan: "Tek Kitap — $4",
    title: "İlk kez deneyen",
    description:
      "Uzmanlığın kitap olur mu diye merak ediyorsun. $4 ile gir, tüm süreci yaşa, kitabını çıkar. Beğenmezsen 30 gün içinde iade.",
    bullets: ["Yazarlık deneyimi gerekmiyor", "5 dakikada taslak hazır", "Risk sıfır"],
  },
  {
    icon: Sparkles,
    plan: "Temel — $19/ay",
    title: "Düzenli içerik üreten",
    description:
      "Her ay yeni bilgi ürünü çıkarmak istiyorsun. 10 kitap/ay ile serini oluştur, KDP'de nişini genişlet.",
    bullets: ["Ayda 10 kitap, 20 kapak", "EPUB + PDF her kitap için", "Kitap başına $1.90"],
  },
  {
    icon: Zap,
    plan: "Yazar — $39/ay",
    title: "KDP'de büyümek isteyen",
    description:
      "Hangi konu satar? Hangi anahtar kelime boş? Araştırma merkezi ve pazar analizi ile karar ver, 30 kitapla hızlı üret.",
    bullets: ["KDP anahtar kelime + pazar analizi", "30 kitap/ay, 60 kapak", "HTML çıktısı dahil"],
  },
  {
    icon: Layers,
    plan: "Stüdyo — $79/ay",
    title: "Yoğun üretim / ajans",
    description:
      "Birden fazla nişte, yüksek hacimde üretiyorsun. API ve otomasyon akışını aç, özel ton profilleri oluştur; kullanıcı tarafında ek API faturası çıkmaz.",
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

      <section className="shell pt-10 pb-0">
        <div className="rounded-[24px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))] px-6 py-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">Kısa cevap</p>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-foreground">
            Kitap Oluşturucu fiyatlandırması iki ihtiyaca göre ayrılır: ilk kitabı düşük riskle açmak için $4 tek seferlik erişim veya düzenli üretim için aylık planlar. Tek Kitap planı en düşük giriş noktasıdır; Başlangıç, Yazar ve Stüdyo ise yayın hacmi arttığında kitap başına maliyeti düşürür.
          </p>
        </div>
      </section>

      {/* Güven şeridi */}
      <section className="border-b border-border/80 bg-accent/30 py-5">
        <div className="shell flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
          {[
            { icon: Check, text: KDP_LIVE_BOOKS_CLAIM },
            { icon: ShieldCheck, text: KDP_GUARANTEE_CLAIM },
            { icon: Check, text: NO_API_COST_CLAIM },
            { icon: ShieldCheck, text: REFUND_GUARANTEE_CLAIM },
            { icon: Check, text: "Kredi kartı gerekmez — önce dene" },
            { icon: Check, text: "KDP yükleme gereksinimlerine uygun EPUB + PDF çıktısı" },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 text-muted-foreground">
              <Icon className="size-3.5 text-primary" />
              <span className="font-medium text-foreground">{text}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Garanti — fiyattan önce */}
      <section className="shell pt-10 pb-0">
        <div className="flex items-start gap-4 rounded-[24px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_8%,var(--card)),var(--card))] px-6 py-5 shadow-sm">
          <ShieldCheck className="size-8 shrink-0 text-primary mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">{KDP_GUARANTEE_CLAIM} + {REFUND_GUARANTEE_CLAIM}</p>
            <p className="mt-1 text-sm leading-7 text-muted-foreground">
              Önce önizlemeyi gör, sonra bu kitabı aç. KDP hedefliyorsan kitaplar {KDP_GUARANTEE_CLAIM} ile hazırlanır. Ayrıca {NO_API_COST_CLAIM.toLowerCase()} ve beğenmezsen ilk 30 gün içinde soru sormadan tam iade alırsın. $4 Tek Kitap dahil tüm planlar kapsanıyor.{" "}
              <Link href="/refund-policy" className="text-primary/80 underline-offset-4 hover:underline">
                İade koşullarını oku →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Planlar */}
      <PricingCreativeSection
        className="py-20"
        tag="Planlar"
        title="İlk kitap için en düşük riskli giriş, düzenli üretim için net planlar."
        description="$4 ile ilk kitabını aç, ayda 10 kitapla ritim kur, 30 veya 80 kitapla yayın sistemine dönüştür. Her planın değeri ve sınırı net."
      />

      {/* Rakip karşılaştırma */}
      <section className="border-y border-border/80 bg-muted/30 py-14">
        <div className="shell">
          <h2 className="mb-2 text-center font-serif text-3xl font-semibold tracking-tight text-foreground">
            Neden Kitap Oluşturucu?
          </h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
            Aynı çıktıyı başka yollarla almanın maliyeti ve süresi.
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
          <h2 className="mb-2 text-center font-serif text-3xl font-semibold tracking-tight text-foreground">
            Hangi plan kimin için?
          </h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
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

      {/* KDP Kanıt Bölümü */}
      <section className="border-b border-border/80 bg-[linear-gradient(180deg,rgba(233,230,220,0.3),transparent)] py-14">
        <div className="shell">
          <h2 className="mb-8 text-center text-base font-medium text-muted-foreground">
            Kanıtlanmış süreç — {KDP_LIVE_BOOKS_CLAIM}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: BookOpen,
                stat: `${KDP_LIVE_BOOK_COUNT} kitap`,
                label: "KDP onaylı kitap canlıda",
                sub: "Gerçek yayın proof'u ve satışta olan kitap akışı",
              },
              {
                icon: Check,
                stat: "%100",
                label: "KDP onay garantisi",
                sub: "Platformdan çıkan kitaplar yayın hedefinde onay garantisiyle hazırlanır",
              },
              {
                icon: Zap,
                stat: "Ek API cost yok",
                label: "Kullanıcı ayrıca API ödemez",
                sub: "Model ve altyapı maliyeti planın içinde kalır",
              },
            ].map((item) => (
              <div key={item.stat} className="rounded-[24px] border border-border/80 bg-card/80 p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-accent text-primary">
                  <item.icon className="size-5" />
                </div>
                <p className="text-2xl font-bold text-foreground">{item.stat}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plan detay bilgileri */}
      <section className="border-b border-border/80 py-12">
        <div className="shell grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Aylık haklar",
              text: "Kitap ve kapak hakları sonraki aya devretmez. Her ay temiz başlar — gereğinden büyük plan almanı gerektirmez.",
            },
            {
              title: "İptal ve yükseltme",
              text: "Plan iptali ve değişimi faturalama alanından tek tıkla. Onay beklenmez, ekstra ücret kesilmez.",
            },
            {
              title: "Çıktı formatları",
              text: "EPUB ve PDF her planda dahil. HTML ve Markdown Yazar planından itibaren. Tüm formatlar KDP ve e-kitap platformlarına uyumlu.",
            },
          ].map(({ title, text }) => (
            <div key={title} className="rounded-[24px] border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <h2 className="mb-2 text-center font-serif text-3xl font-semibold tracking-tight text-foreground">
            Özellik karşılaştırması
          </h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
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
            <p className="mb-8 text-center text-sm text-muted-foreground">
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
      <section className="py-16">
        <div className="shell text-center">
          <h2 className="font-serif text-4xl font-semibold tracking-tight text-foreground">
            Önce kitabını gör —
            <span className="text-primary"> sonra karar ver.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-muted-foreground">
            Outline ve kapak önizlemesi ücretsiz. Tam kitap + EPUB/PDF için $4 — bir kez öde, senindir.
            Aylık planlarda ayda 10 kitaba kadar $19.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/start/topic"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90"
            >
              Ücretsiz Önizlemeyi Başlat
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-7 py-3.5 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              Nasıl çalışıyor?
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground/70">
            {[
              "Önizleme ücretsiz",
              "$4 tek seferlik — abonelik yok",
              KDP_GUARANTEE_CLAIM,
              REFUND_GUARANTEE_CLAIM,
              NO_API_COST_CLAIM,
              "Kredi kartı gerekmez",
              "Anında erişim",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="size-3 text-primary" />
                {item}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Ya da doğrudan{" "}
            <Link href="/start/topic?plan=tek-kitap" className="font-semibold text-foreground underline-offset-4 hover:underline">
              $4 Tek Kitap ile başla →
            </Link>
          </p>
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
