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
import { loadExamplesShowcaseData } from "@/lib/examples-data";
import { buildPageMetadata, buildOgImageUrl } from "@/lib/seo";
import { KDP_GUARANTEE_CLAIM, KDP_LIVE_BOOKS_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

export const metadata: Metadata = buildPageMetadata({
  title: "Yapay Zeka Kitap Yazma Aracı: Fikirden EPUB’a Kitap Oluşturucu",
  description:
    "Kitap Oluşturucu ile konunu yaz, kitap taslağını çıkar, bölümleri oluştur ve EPUB ile PDF dosyanı al. İlk kitabını daha hızlı ve daha net hazırla.",
  path: "/",
  keywords: [
    "ai kitap yazma",
    "kitap oluşturma aracı",
    "epub oluşturma",
    "kdp kitap hazırlama",
    "book generator",
  ],
  ogImage: buildOgImageUrl(
    "Yapay Zeka Kitap Yazma Aracı",
    "Kitap Oluşturucu ile konunu yaz, kitap taslağını çıkar, bölümleri oluştur ve EPUB ile PDF dosyanı al."
  ),
});

const HOME_SHOWCASE_SLUGS = [
  "authority-in-100-pages",
  "silent-offers",
  "prompt-systems-for-small-teams",
  "parent-friendly-stem-at-home",
  "focus-by-design",
  "tu-metodo-hecho-libro",
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
      "AI ile yazılan içerik gerçekten kaliteli oluyor mu?",
      `AI taslak oluşturur, kaliteyi sen belirlersin. Her bölümü düzenleyebilir, beğenmediğini yeniden üretebilirsin. ${KDP_LIVE_BOOKS_CLAIM} ve kitaplarımız ${KDP_GUARANTEE_CLAIM} ile hazırlanır.`,
    ],
    [
      "Hiç kitap yazmadan çıktı alabilir miyim?",
      "Evet. Araç yön ve kararı senden alır, metni o üretir. Sihirbaz 5 kısa soruyla başlar, boş sayfa görmezsin.",
    ],
    [
      "Baştan sona ne kadar sürer?",
      "Konunu gir, bir oturumda ilk EPUB'a ulaş. Çoğu kitap 30–90 dakika içinde tamamlanır; bölüm sayısı arttıkça üretim süresi de uzar.",
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
      "Evet. Arayüz Türkçe kalır, kitap içeriği İngilizce veya seçtiğin başka dilde üretilebilir.",
    ],
    [
      "Taslağı beğenmezsem ne yaparım?",
      "Taslak üzerinde değişiklik yap, bölümleri yeniden üret ya da direkt çalışma alanında düzenle — yeniden başlamak zorunda değilsin.",
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
            Konunu yaz. Kitabın önüne gelsin.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
            Kitap Oluşturucu, tek bir fikirden çok dilli ve yayına hazır bilgi kitabı üretmeni sağlayan yapay zeka destekli kitap üretim sistemidir. Bölüm planı, bölüm yazımı, kapak ve EPUB ile PDF çıktısı aynı yönlendirmeli akışta birleşir; süreç farklı araçlar arasında dağılmaz.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Önce ücretsiz önizlemeyi görürsün. Kitabın gerçekten çıkmaya değer olup olmadığı birkaç adımda netleşir; ödeme kararını daha sonra verirsin.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">Kimler için?</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Uzmanlığını rehber kitaba çevirmek isteyen eğitmenler, danışmanlar ve ilk kitabını çıkarmak isteyen içerik üreticileri.
              </p>
              <Link href="/use-cases" className="mt-3 inline-block text-xs font-medium text-primary/80 underline-offset-4 hover:underline">
                Tüm kullanım alanlarını gör →
              </Link>
            </div>
            <div className="rounded-[24px] border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">Hangi sorunu çözer?</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Boş sayfa korkusunu ve dağınık araç zincirini kaldırır. Hangi araçta ne var diye uğraşmak yerine tek akışta ilerler, kitabın tamamlanır.
              </p>
              <Link href="/compare" className="mt-3 inline-block text-xs font-medium text-primary/80 underline-offset-4 hover:underline">
                Alternatiflere göre farkımız →
              </Link>
            </div>
            <div className="rounded-[24px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))] px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">Elinde ne kalır?</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Düzenlenebilir bölüm içerikleri, kitap bilgileri ve yayına hazır EPUB + PDF dosyaları. KDP mantığı ürünün içinde düşünülür.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-18">
        <div className="shell">
          <SectionHeading
            badge="Preview nasıl çalışır?"
            title="Önce preview görürsün, tam kitaba sonra geçersin."
            description="Ücretsiz kısım karar vermek içindir; tam erişim ise düzenleme ve teslim dosyalarını açar. Kullanıcı neyi ücretsiz gördüğünü, neyi ödeme sonrası açtığını ilk bakışta anlar."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-[28px] border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))]">
              <CardContent className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Ücretsiz preview</p>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">Karar vermek için yeterli görünürlük</h3>
                <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
                  <li>• Konu özeti ve kitap yönü</li>
                  <li>• Bölüm planı ve ilk yapı</li>
                  <li>• Kapak yönü / önizleme</li>
                  <li>• İlk içerik örneğini görme</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="rounded-[28px]">
              <CardContent className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Tam erişim</p>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">Kitabı tamamlama ve dışa aktarma</h3>
                <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
                  <li>• Tüm bölümleri açma ve düzenleme</li>
                  <li>• Kapak ve kitap bilgilerini netleştirme</li>
                  <li>• EPUB + PDF teslim dosyaları</li>
                  <li>• Aynı kitap üzerinde çalışmaya devam etme</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <HomeHowItWorksSection />
      <InteractiveBookShowcase books={fallbackShowcaseBooks} />

      {/* Pricing: "pahalı mı?" sorusunu testimonials’tan önce cevapla */}
      <section className="border-b border-border/80 py-18">
        <PricingCreativeSection
          tag="Planlar"
          title="İlk kitabını $4 ile aç. Bekleme, bu hafta çıkar."
          description="Tek kitap için $4 erişim: tam içerik, EPUB + PDF çıktısı ve tam düzenleme erişimi. Önce önizlemeyi gör, sonra bu kitabı açmaya değer olup olmadığına karar ver."
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
        title="Aklındaki kitabı bir yıl daha beklettirme."
        description={`Konunu gir, bölüm planını gör, önizlemeyi aç — aynı akışta kapağın ve yayın dosyan hazır olur. ${NO_API_COST_CLAIM}, kredi kartı gerekmez ve teslim paketi ${KDP_GUARANTEE_CLAIM} odağında hazırlanır.`}
        items={[
          "5 soruluk hızlı sihirbaz",
          "Otomatik bölüm planı + bölüm akışı",
          "Önce önizleme, sonra tam kitap",
          "Kapak + çıktı sistemi",
          "EPUB önce, PDF sonra",
          "Türkçe panel, İngilizce kitap desteği",
        ]}
      />
    </MarketingPage>
  );
}
