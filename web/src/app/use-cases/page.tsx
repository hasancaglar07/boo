import type { Metadata } from "next";
import { User, Users, Briefcase, GraduationCap, Globe, Mic, ArrowRight, CheckCircle2, Quote } from "lucide-react";
import Link from "next/link";

import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildPageMetadata, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Kimler İçin? | Book Generator",
  description:
    "Book Generator'ı kimin kullandığını ve neden tercih ettiğini öğren. Yazarlar, danışmanlar, eğitimciler ve içerik üreticileri için AI destekli kitap üretimi.",
  path: "/use-cases",
  keywords: ["ai kitap üretimi", "danışman kitap yazma", "eğitimci kitap", "içerik üretici", "indiebook"],
});

const segments = [
  {
    icon: User,
    badge: "Bireysel Yazarlar",
    title: "İlk kitabını çıkarmak isteyen yazarlar",
    description:
      "Yazmak istediğin fikir var ama başlamak zor geliyor. Outline kafanda netleşmiyor, aylar geçiyor. Book Generator brief'inden outline'a, outline'dan bölüme senin yerine ilerliyor.",
    benefits: [
      "Fikrinden taslak outline 5 dakikada hazır",
      "Bölüm bölüm üretim — kaybolmadan ilerle",
      "Her seferinde tutarlı ses tonu",
      "EPUB ve PDF olarak doğrudan indir",
    ],
    quote: "Üç yıldır kafamda olan kitabı 2 haftada taslak olarak çıkardım.",
    quoteName: "Selin A.",
    quoteRole: "İlk kez yayımlayan yazar",
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
      "Yıllarca biriktirdiğin bilgiyi kitap haline getirmek hem güvenilirliğini artırır hem yeni müşteri kapısı açar. Ama zaman yok. Book Generator uzmanlığını yapılandırılmış içeriğe dönüştürür.",
    benefits: [
      "Müşteri çeken lead magnet kitaplar",
      "Marka kimliğine uygun ses tonu",
      "Metodolojini aktaran chapter yapısı",
      "Kısa sürede çok sayıda niş kitap",
    ],
    quote: "6 farklı niş konuda birer kitap ürettim. Hepsini lead magnet olarak kullanıyorum.",
    quoteName: "Kerem T.",
    quoteRole: "İş geliştirme danışmanı",
    cta: "Danışmanlar için rehber",
    ctaHref: "/resources",
    color: "bg-purple-50 border-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: GraduationCap,
    badge: "Eğitimciler & Akademisyenler",
    title: "Ders materyallerini kitaba dönüştüren eğitimciler",
    description:
      "Hazırladığın ders içerikleri, notlar ve slaytlar zaten var. Book Generator bunları tutarlı bir kitap yapısına kavuşturur. Akademik dil, kaynak notları ve bölüm bütünlüğü korunur.",
    benefits: [
      "Ders notlarından kitap taslağı",
      "Akademik ton ve yapı desteği",
      "Bölüm sonu özet ve sorular",
      "Kaynakça uyumlu format",
    ],
    quote: "Öğrencilerime dağıttığım ders kitabını Book Generator ile hazırladım. Profesyonel görünüyor.",
    quoteName: "Dr. Ayşe K.",
    quoteRole: "Üniversite öğretim görevlisi",
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
      "Aylık birden fazla başlık hedefliyorsun. Manuel yazmak bu hızı kesmez. Book Generator tüm yayın zincirini — araştırma, yazım, çıktı — otomatize eder.",
    benefits: [
      "Aylık çok başlık üretim kapasitesi",
      "Niş araştırma ve outline önerisi",
      "KDP uyumlu EPUB/PDF çıktısı",
      "Maliyet-çıktı optimizasyonu",
    ],
    quote: "Ayda ortalama 4-5 kitap çıkarıyorum. Book Generator bu hızı mümkün kıldı.",
    quoteName: "Mehmet B.",
    quoteRole: "Bağımsız KDP yayıncısı",
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
      "Yazdığın içerikler var, podcastini var, kurs materyalin var. Bunları bir araya getirip kitap olarak sunmak yeni bir gelir kapısı açar. Book Generator bu dönüşümü kolaylaştırır.",
    benefits: [
      "Mevcut içerikten kitap taslağı",
      "Okuyucu kitlesine hitap eden dil",
      "Ek gelir ve lead magnet imkânı",
      "Hızlı güncelleme ve yeni baskı",
    ],
    quote: "Podcast bölümlerimden oluşan bir kitap çıkardım. Dinleyicilerim çok sevdi.",
    quoteName: "Zeynep M.",
    quoteRole: "Podcast yapımcısı ve yazar",
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
    quote: "Tüm oryantasyon sürecimizi bir kitaba aktardık. Yeni çalışanlar çok daha hızlı adapte oluyor.",
    quoteName: "Alp D.",
    quoteRole: "İK ve eğitim müdürü",
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
              Kitap yazmak isteyen{" "}
              <span className="text-primary">herkes için</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              Bireysel yazardan kurumsal ekibe, danışmandan KDP yayıncısına. Book Generator farklı amaçlar için farklı şekillerde çalışır.
            </p>
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

                    {/* Benefits + quote */}
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
                          <Quote className="mb-2 size-5 text-muted-foreground/60" />
                          <p className="text-sm italic leading-7 text-foreground">{segment.quote}</p>
                          <div className="mt-3">
                            <p className="text-sm font-medium text-foreground">{segment.quoteName}</p>
                            <p className="text-xs text-muted-foreground">{segment.quoteRole}</p>
                          </div>
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
        title="Hangi segmentten olursan ol, başlangıç aynı."
        description="14 gün ücretsiz dene. Kredi kartı yok, kurulum yok. İlk kitabın için brief oluştur ve nasıl çalıştığını gör."
        items={[
          "5 dakikada ilk brief",
          "Anında outline üretimi",
          "EPUB/PDF çıktısı",
          "14 gün ücretsiz",
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
    </MarketingPage>
  );
}
