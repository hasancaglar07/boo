import type { Metadata } from "next";
import { User, Users, Briefcase, GraduationCap, Globe, Mic, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildPageMetadata, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Kimler İçin? | Kitap Oluşturucu",
  description:
    "Kitap Oluşturucu'yu kimin kullandığını ve neden tercih ettiğini öğren. Yazarlar, danışmanlar, eğitmenler, kurs üreticileri ve içerik üreticileri için yapay zeka destekli kitap üretim sistemi.",
  path: "/use-cases",
  keywords: ["ai kitap üretimi", "danışman kitap yazma", "eğitmen kitap", "course creator kitap", "içerik üretici"],
});

const segments = [
  {
    icon: User,
    badge: "Bireysel Yazarlar",
    title: "İlk kitabını çıkarmak isteyen yazarlar",
    description:
      "Yazmak istediğin fikir var ama başlamak zor geliyor. Bölüm planı kafanda netleşmiyor, aylar geçiyor. Kitap Oluşturucu konu özetinden bölüm planına, bölüm planından bölüme senin yerine ilerliyor.",
    benefits: [
      "Fikrinden taslak bölüm planı 5 dakikada hazır",
      "Bölüm bölüm üretim — kaybolmadan ilerle",
      "Her seferinde tutarlı ses tonu",
      "EPUB ve PDF olarak doğrudan indir",
    ],
    outcome: "Uzun süredir ertelenen ilk rehber kitap, bölüm yapısı netleştiğinde haftalar içinde taslağa dönebilir.",
    cta: "Yazara özel başlangıç rehberi",
    ctaHref: "/resources",
    color: "bg-blue-50 border-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Briefcase,
    badge: "Danışmanlar & Koçlar",
    title: "Uzmanlığını kitaba dönüştürmek isteyen profesyoneller",
    description:
      "Yıllarca biriktirdiğin bilgiyi kitap haline getirmek hem güvenilirliğini artırır hem yeni müşteri kapısı açar. Ama zaman yok. Kitap Oluşturucu uzmanlığını yapılandırılmış içeriğe dönüştürür.",
    benefits: [
      "Müşteri çeken kısa tanıtım kitapları",
      "Marka kimliğine uygun ses tonu",
      "Metodolojini aktaran chapter yapısı",
      "Kısa sürede çok sayıda niş kitap",
    ],
    outcome: "Danışmanlık bilgisini kısa authority kitaba çevirmek, hizmete giriş ürünü ve güven yüzeyi olarak kullanılabilir.",
    cta: "Danışmanlar için rehber",
    ctaHref: "/resources",
    color: "bg-purple-50 border-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: GraduationCap,
    badge: "Eğitmenler & Kurs Üreticileri",
    title: "Eğitim içeriğini rehber kitaba dönüştüren eğitmenler",
    description:
      "Hazırladığın ders içerikleri, atölye notları ve kurs modülleri zaten var. Kitap Oluşturucu bunları tutarlı bir rehber kitap yapısına kavuşturur. Amaç akademik format değil; öğrencinin veya müşterinin okuyup uygulayacağı net, yayınlanabilir bir içerik çıkarmaktır.",
    benefits: [
      "Kurs modüllerinden kitap taslağı",
      "Öğretici ton ve bölüm yapısı",
      "Bölüm sonu özet ve aksiyon maddeleri",
      "Müşteri çeken kısa kitap veya ücretli rehber olarak kullanma",
    ],
    outcome: "Kurs veya workshop içeriği, öğrencinin okuyup uygulayabileceği rehber kitaba daha hızlı dönüşebilir.",
    cta: "Eğitimciler için başla",
    ctaHref: "/start/topic",
    color: "bg-green-50 border-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: Globe,
    badge: "KDP Yayıncılar",
    title: "Amazon KDP'de çok başlık yayınlayan yayıncılar",
    description:
      "Aylık birden fazla başlık hedefliyorsun. Elle yazmak bu hızı keser. Kitap Oluşturucu tüm yayın zincirini, yani araştırma, yazım ve çıktı akışını otomatikleştirir.",
    benefits: [
      "Aylık çok başlık üretim kapasitesi",
      "Niş araştırma ve bölüm planı önerisi",
      "KDP uyumlu EPUB/PDF çıktısı",
      "Maliyet-çıktı optimizasyonu",
    ],
    outcome: "KDP odaklı kullanıcı için aynı akışta araştırma, taslak ve çıktı almak tekrarlı üretim kapasitesini artırır.",
    cta: "KDP yayıncı planına bak",
    ctaHref: "/pricing",
    color: "bg-orange-50 border-orange-100",
    iconColor: "text-orange-600",
  },
  {
    icon: Mic,
    badge: "İçerik Üreticileri",
    title: "Blog, podcast ve kursunu kitapla büyüten yaratıcılar",
    description:
      "Yazdığın içerikler var, podcastin var, kurs materyalin var. Bunları bir araya getirip kitap olarak sunmak yeni bir gelir kapısı açar. Kitap Oluşturucu bu dönüşümü kolaylaştırır.",
    benefits: [
      "Mevcut içerikten kitap taslağı",
      "Okuyucu kitlesine hitap eden dil",
      "Ek gelir ve müşteri toplama imkânı",
      "Hızlı güncelleme ve yeni baskı",
    ],
    outcome: "Dağınık blog, podcast veya kurs parçacıkları tek bir kitap kurgusunda toplanıp yeni gelir yüzeyine dönüşebilir.",
    cta: "İçerik üreticisi olarak başla",
    ctaHref: "/start/topic",
    color: "bg-rose-50 border-rose-100",
    iconColor: "text-rose-600",
  },
  {
    icon: Users,
    badge: "Kurumlar & Ekipler",
    title: "Kurumsal bilgiyi yayına dönüştüren ekipler",
    description:
      "Şirketteki bilgi birikimi çalışanlarda dağınık duruyor. Oryantasyon rehberleri, süreç kitapları, iç eğitim materyalleri — hepsini tutarlı kitap formatına dönüştür.",
    benefits: [
      "Şirket içi bilgi aktarımı",
      "Standart oryantasyon materyali",
      "Kurum kültürü ve süreç kitapları",
      "Çok yazar desteği (ekip üretimi)",
    ],
    outcome: "Kurum içi bilgi, süreç veya oryantasyon akışı tek kitaba dönüştürüldüğünde tekrar kullanılabilir bir varlığa dahil olur.",
    cta: "Kurumsal plan için iletişime geç",
    ctaHref: "/contact",
    color: "bg-teal-50 border-teal-100",
    iconColor: "text-teal-600",
  },
] as const;

export default function UseCasesPage() {
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Book Generator Kullanım Senaryoları",
    description: "Yazarlar, danışmanlar, eğitimciler ve KDP yayıncıları için AI destekli kitap üretimi kullanım senaryoları.",
    numberOfItems: segments.length,
    itemListElement: segments.map((seg, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: seg.title,
      description: seg.description,
      url: absoluteUrl(`/use-cases#${seg.badge.toLowerCase().replace(/\s+/g, "-").replace(/[&]/g, "ve")}`),
    })),
  };

  return (
    <MarketingPage>
      {/* Hero */}
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Kimler Kullanıyor?</Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Herkes için değil.{" "}
              <span className="text-primary">Doğru kullanıcı için çok güçlü.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              Bireysel yazardan kurumsal ekibe, danışmandan KDP yayıncısına. Kitap Oluşturucu farklı amaçlar için farklı şekillerde çalışır; ama en güçlü olduğu yer yayına hazır bilgi kitabı akışıdır.
            </p>
            <div className="mx-auto mt-8 max-w-3xl rounded-[24px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))] px-6 py-5 text-left shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">Kısa cevap</p>
              <p className="mt-2 text-sm leading-7 text-foreground">
                Kitap Oluşturucu; uzmanlar, koçlar, eğitmenler, kurs üreticileri ve KDP yayıncıları için tasarlanmış çok dilli bir yapay zeka destekli kitap üretim sistemidir. Teknik dokümantasyon veya akademik tez üretiminden çok, uzmanlık kitabı, rehber kitap, müşteri çeken kısa kitap ve yayına hazır bilgi kitabı üretiminde güçlüdür.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Segment cards */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading
            badge="Kullanım Senaryoları"
            title="Senin için hangi senaryo?"
            description="Altı farklı kullanıcı profilinden kendine en yakın olanı bul."
          />
          <div className="space-y-8">
            {segments.map((segment, i) => {
              const Icon = segment.icon;
              const isEven = i % 2 === 0;
              return (
                <div
                  key={segment.title}
                  className="rounded-3xl border border-border/80 bg-background p-8 md:p-10"
                >
                  <div className={`grid gap-10 md:grid-cols-2 md:items-start ${!isEven ? "md:[&>*:first-child]:order-2" : ""}`}>
                    {/* Text */}
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${segment.color}`}>
                          <Icon className={`size-5 ${segment.iconColor}`} />
                        </div>
                        <Badge>{segment.badge}</Badge>
                      </div>
                      <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        {segment.title}
                      </h2>
                      <p className="mt-3 text-base leading-8 text-muted-foreground">{segment.description}</p>
                      <Link
                        href={segment.ctaHref}
                        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        {segment.cta}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>

                    {/* Benefits + outcome */}
                    <div className="space-y-6">
                      <ul className="space-y-3">
                        {segment.benefits.map((b) => (
                          <li key={b} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                            {b}
                          </li>
                        ))}
                      </ul>
                      <Card className="border-border/60 bg-muted/40">
                        <CardContent className="p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Tipik çıktı
                          </p>
                          <p className="mt-3 text-sm leading-7 text-foreground">{segment.outcome}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <MarketingCtaSection
        title="Hangi segmentten olursan ol, ilk adım aynı ve ücretsiz."
        description="Kredi kartı olmadan önizlemeyi gör. Konu özetini oluştur, bölüm planını gör — bu kitabın gerçekten çıkmaya değer olup olmadığını netleştir. 30 gün iade garantisi."
        items={[
          "5 dakikada ilk konu özeti",
          "Anında bölüm planı üretimi",
          "Önce önizleme, sonra tam kitap",
          "EPUB/PDF çıktısı",
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
    </MarketingPage>
  );
}
