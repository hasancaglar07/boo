import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenCheck,
  Eye,
  FilePenLine,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
  Star,
  BookMarked,
} from "lucide-react";

import { AboutPageHero } from "@/components/site/page-heroes";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { CyberneticBentoGrid } from "@/components/ui/cybernetic-bento-grid";
import { Features4 } from "@/components/ui/features-4";
import { Card, CardContent } from "@/components/ui/card";
import { buildPageMetadata, absoluteUrl, siteConfig } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Generator Hakkında | AI Kitap Üretim Yaklaşımımız",
  description:
    "Book Generator neden sade arayüzle çalışıyor, AI kitap üretiminde hangi ilkelere odaklanıyor ve ilk kez kitap yazanlara nasıl hız kazandırdığını öğrenin.",
  path: "/about",
  keywords: ["book generator hakkında", "ai kitap üretimi", "kitap yazma platformu"],
});

const principles = [
  {
    title: "Az kelime",
    description: "Uzun yönerge ve teknik jargon yerine kullanıcıyı sonuca götüren kısa, net adımlar.",
    icon: <Eye className="size-4" />,
  },
  {
    title: "Tek yol",
    description: "İlk kullanıcı için görünür akışta sadece oluştur, yaz, yayınla mantığı.",
    icon: <Layers3 className="size-4" />,
  },
  {
    title: "Düzenlenebilir yazı",
    description: "Üretilen her bölüm tekrar ele alınabilir, genişletilebilir ve daha iyi hale getirilebilir.",
    icon: <FilePenLine className="size-4" />,
  },
  {
    title: "Yayın odaklı",
    description: "Amaç sadece yazı değil; EPUB, PDF ve teslim klasörleriyle gerçek çıktı almak.",
    icon: <BookOpenCheck className="size-4" />,
  },
  {
    title: "Güven veren kalite",
    description: "Araştırma, kontrol ve düzeltme katmanları ilk kullanıcıyı yormadan arkada çalışır.",
    icon: <ShieldCheck className="size-4" />,
  },
  {
    title: "AI ama sade",
    description: "Yapay zeka görünürde karmaşa yaratmaz; sadece doğru yerde hız ve netlik sağlar.",
    icon: <Sparkles className="size-4" />,
  },
] as const;

const aboutBentoItems = [
  {
    eyebrow: "Neden böyle?",
    title: "Görünürde sade çünkü karmaşayı arka tarafta çözer",
    description:
      "İlk kez kitap üreten biri için en büyük sorun seçenek çokluğu. Biz de gelişmiş işleri tek tek bağırtmak yerine akışı yöneten bir omurga kurduk.",
    metric: "First-time friendly",
    className: "md:col-span-2 md:row-span-2",
    bullets: ["Sihirbaz önce", "Panel sonra", "Geliştirilmiş arka plan", "Temiz teslim mantığı"],
  },
  {
    eyebrow: "Ürün kararı",
    title: "Buton yerine karar yorgunluğunu azaltıyoruz",
    description: "Kullanıcının neyi önce yapacağını düşünmesini değil, yapmasını istiyoruz.",
    className: "md:col-span-2",
    bullets: ["Tek başlangıç", "Tek ana CTA", "Net sıralama", "Kısa metinler"],
  },
  {
    eyebrow: "Yayın",
    title: "İlk hedef her zaman gerçek çıktı",
    description: "Bu yüzden export ve metadata akışlarını ürünün merkezine koyduk.",
    className: "md:col-span-1",
    bullets: ["EPUB", "PDF"],
  },
  {
    eyebrow: "Geliştirilmiş",
    title: "Araştırma ve kontrol araçları gizli kalabilir",
    description: "İhtiyaç olduğunda açılır; ilk ekranda ise kullanıcıyı boğmaz.",
    className: "md:col-span-1",
    bullets: ["Keyword", "KDP", "Review"],
  },
  {
    eyebrow: "Sonuç",
    title: "Amaç daha fazla özellik göstermek değil, daha çok kitabın bitmesi",
    description: "Bu yüzden ürünü gösteri paneli gibi değil, sonuca odaklı bir yayın sistemi gibi ele aldık.",
    className: "md:col-span-2",
    bullets: ["Yüksek tamamlama hissi", "Temiz ilerleme", "Kontrol sende", "Sistem arkada"],
  },
] as const;

const metrics = [
  {
    icon: <Users className="size-5 text-primary" />,
    value: "1,240+",
    label: "Bu ay kitap çıkaran yazar",
  },
  {
    icon: <BookMarked className="size-5 text-primary" />,
    value: "3,800+",
    label: "Üretilen kitap",
  },
  {
    icon: <Star className="size-5 text-primary" />,
    value: "4.9/5",
    label: "Ortalama kullanıcı puanı",
  },
  {
    icon: <ShieldCheck className="size-5 text-primary" />,
    value: "30 gün",
    label: "Para iade garantisi",
  },
];

export default function AboutPage() {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.siteUrl,
    logo: absoluteUrl("/logo.png"),
    description: siteConfig.description,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      bestRating: "5",
      worstRating: "1",
      ratingCount: "1240",
      reviewCount: "1240",
    },
  };

  return (
    <MarketingPage>
      <AboutPageHero />

      {/* Metrics strip */}
      <section className="border-b border-border/80 bg-accent/30 py-8">
        <div className="shell grid grid-cols-2 gap-4 md:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card/80 px-4 py-5 text-center shadow-sm"
            >
              {m.icon}
              <div className="text-2xl font-bold tracking-tight text-foreground">{m.value}</div>
              <div className="text-xs leading-5 text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <h1 className="sr-only">Book Generator hakkında</h1>
          <SectionHeading
            badge="Hakkında"
            title="Bu ürün, kitabını çıkarmak isteyen ama karmaşık araçlarla boğulmak istemeyen insanlar için tasarlandı."
            description="Hedefimiz daha fazla panel göstermek değil, daha fazla insanın gerçekten kitabını bitirmesini sağlamak. Bu yüzden görünür tarafta sade, arka planda ise güçlü bir üretim sistemi kurduk."
          />
        </div>
      </section>

      <section className="border-b border-border/80">
        <Features4
          badge="İlkeler"
          title="Ürünü hangi ilkeye göre kurduk?"
          description="Pazarlama sayfası da, uygulama içi deneyim de aynı karara dayanır: ilk kullanıcı bile nereyi tıklayacağını düşünmeden ilerleyebilmeli."
          items={principles}
        />
      </section>

      <section className="border-b border-border/80">
        <CyberneticBentoGrid
          badge="Yaklaşım"
          title="Sade gösteriyor çünkü gücü arka planda topluyor."
          description="Araştırma, outline, kapak, bölüm üretimi ve export aynı kitap etrafında organize edilir. Bu da hem profesyonel hem anlaşılır bir ürün hissi verir."
          items={aboutBentoItems}
        />
      </section>

      <section className="border-b border-border/80 py-18">
        <div className="shell grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Misyon</h2>
              <p className="text-sm leading-8 text-muted-foreground">
                Bilgiyi, uzmanlığı veya deneyimi olan birinin teknik bariyerlere takılmadan bunu kitap haline
                getirebilmesini sağlamak.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">Yaklaşım</h2>
              <p className="text-sm leading-8 text-muted-foreground">
                Önce güven veren mesaj, sonra anlaşılır onboarding, sonra da gerçekten çalışan bir kitap üretim akışı.
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="shell mt-6 text-center text-sm text-muted-foreground">
          Soru veya öneriniz var mı?{" "}
          <Link href="/contact" className="font-medium text-primary/80 underline-offset-4 hover:underline">
            Bizimle iletişime geçin →
          </Link>
        </div>
      </section>

      <MarketingCtaSection
        title="Bu ürünü görmek için değil, kitap çıkarmak için kullansınlar istiyoruz."
        description="Yani tasarım kararlarının tamamı tek şeye hizmet ediyor: kullanıcı ilk kitabını daha kolay bitirebilsin."
        items={[
          "Az kelime, net yönlendirme",
          "Görünürde sade panel",
          "Arka planda güçlü üretim sistemi",
          "Yayın odaklı teslim mantığı",
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
    </MarketingPage>
  );
}
