import type { Metadata } from "next";
import Link from "next/link";

import { PremiumBookHero } from "@/components/site/premium-book-hero";
import { InteractiveBookShowcase } from "@/components/site/interactive-book-showcase";
import { HomeLogoCloudSection } from "@/components/site/home-logo-cloud-section";
import { HomeHowItWorksSection } from "@/components/site/home-how-it-works-section";
import { HomeTestimonialsSection } from "@/components/site/home-testimonials-section";
import { HomeWorkspaceShowcaseSection } from "@/components/site/home-workspace-showcase-section";
import { HomePricingTestimonials } from "@/components/site/home-pricing-testimonials";
import { HomeBlogPreviewSection } from "@/components/site/home-blog-preview-section";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { PricingCreativeSection } from "@/components/site/pricing-creative-section";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "AI Kitap Yazma Aracı: Fikirden EPUB’a Book Generator",
  description:
    "Book Generator ile fikirden outline’a, bölüm yazımından EPUB/PDF çıktısına kadar tüm kitap üretim sürecini tek akışta yönet. İlk kitabını daha hızlı çıkar.",
  path: "/",
  keywords: [
    "ai kitap yazma",
    "kitap oluşturma aracı",
    "epub oluşturma",
    "kdp kitap hazırlama",
    "book generator",
  ],
});

export default function HomePage() {
  const starterFaq: Array<[string, string]> = [
    [
      "AI ile yazılan içerik gerçekten kaliteli oluyor mu?",
      "AI taslak oluşturur, kaliteyi sen belirlersin. Her bölümü düzenleyebilir, beğenmediğini yeniden üretebilirsin. Ürettiğimiz 2 kitap Amazon KDP kalite denetimini geçti ve şu an satışta.",
    ],
    [
      "Hiç kitap yazmadan çıktı alabilir miyim?",
      "Evet. Araç yön ve kararı senden alır, metni o üretir. Sihirbaz 5 kısa soruyla başlar, boş sayfa görmezsin.",
    ],
    [
      "Baştan sona ne kadar sürer?",
      "Brief'ten ilk EPUB'a kadar kısa bir oturum yeterlidir. Bölüm sayısına göre çıktı hızı değişir.",
    ],
    [
      "Çıktıyı KDP'ye direkt yükleyebilir miyim?",
      "Evet. EPUB ve PDF formatında alırsın; yükleme öncesi kendi kontrol listenle bir gözden geçirmen önerilir.",
    ],
    [
      "İçerik bana mı ait?",
      "Evet. Üretilen tüm içerik sana aittir. Platform hiçbir telif hakkı talep etmez. Konu, yön ve içerik kararları da sende olduğu için kitabın tamamen sana aittir.",
    ],
    [
      "İngilizce kitap üretebilir miyim?",
      "Evet. Arayüz Türkçe kalır, kitap içeriği English veya seçtiğin başka dilde üretilebilir.",
    ],
    [
      "Taslağı beğenmezsem ne yaparım?",
      "Outline üzerinde değişiklik yap, bölümleri yeniden üret ya da direkt çalışma alanında düzenle — yeniden başlamak zorunda değilsin.",
    ],
  ];

  return (
    <MarketingPage>
      <PremiumBookHero />
      <HomeLogoCloudSection />

      {/* MiddleBlock: "Bu ne?" sorusunu erkenden cevapla */}
      <section className="border-b border-border/80 py-18">
        <div className="shell">
          <h2 className="text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Book Generator ne yapar? Bir cümlede.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
            Konu fikrinden yayına hazır EPUB/PDF dosyasına kadar tüm süreci tek akışta yönetirsin — outline, bölüm yazımı, kapak ve export ayrı araçlara dağılmaz.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">Kimler için?</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Uzmanlığını rehber kitaba çevirmek isteyen eğitmenler, danışmanlar ve ilk kitabını çıkarmak isteyen creator’lar.
              </p>
              <Link href="/use-cases" className="mt-3 inline-block text-xs font-medium text-primary/80 underline-offset-4 hover:underline">
                Tüm kullanım alanlarını gör →
              </Link>
            </div>
            <div className="rounded-[24px] border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">Hangi sorunu çözer?</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Boş sayfa korkusunu ve dağınık araç zincirini kaldırır. Konu kararından teslim dosyasına tek yerde ilerlersin.
              </p>
              <Link href="/compare" className="mt-3 inline-block text-xs font-medium text-primary/80 underline-offset-4 hover:underline">
                Alternatiflere göre farkımız →
              </Link>
            </div>
            <div className="rounded-[24px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))] px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">Elinde ne kalır?</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Düzenlenebilir bölüm içerikleri, kitap metadata’sı ve yayına hazır EPUB + PDF dosyaları.
              </p>
            </div>
          </div>
        </div>
      </section>

      <HomeHowItWorksSection />
      <InteractiveBookShowcase />

      {/* Pricing: "pahalı mı?" sorusunu testimonials’tan önce cevapla */}
      <section className="border-b border-border/80 py-18">
        <PricingCreativeSection
          tag="Planlar"
          title="İlk kitabın için $29. Ghostwriter için $5.000."
          description="Tek kitap için $29 Premium — tam içerik, EPUB+PDF export, sınırsız düzenleme. Ajans tutmak yerine bu hafta yayında ol."
        />
      </section>

      <HomeTestimonialsSection />
      <HomeWorkspaceShowcaseSection />
      <HomePricingTestimonials />

      <HomeBlogPreviewSection />

      <section className="border-b border-border/80 py-18">
        <div className="shell">
          <SectionHeading
            badge="SSS"
            title="Sık sorulan sorular."
            description="Ürün ne yapıyor, kimin için uygun ve ilk çıktını nasıl alıyorsun? Satın alma kararında en kritik soruları burada kısa tutuyoruz."
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
        title="Uzmanlığın kitap olacak. Bu hafta."
        description="Brief gir, outline onayla, bölümleri üret, kapağı ekle. Yayın dosyan hazır — başka araç gerekmez."
        items={[
          "5 soruluk hızlı sihirbaz",
          "Otomatik outline + bölüm akışı",
          "Kapak + export sistemi",
          "EPUB önce, PDF sonra",
          "Türkçe panel, English kitap desteği",
        ]}
      />
    </MarketingPage>
  );
}
