import type { Metadata } from "next";
import { Download, BookOpen, FileText, Search, Lightbulb, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

import { LeadMagnetSignupCard } from "@/components/site/lead-magnet-signup-card";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { featuredLeadMagnet } from "@/lib/lead-magnets";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Ücretsiz Kaynaklar | Kitap Oluşturucu",
  description:
    "Yapay zeka ile kitap yazmak için pratik rehberler, kontrol listeleri ve şablonlar. Kitap yazma sürecini hızlandıracak ücretsiz kaynakları inceleyin.",
  path: "/resources",
  keywords: ["ücretsiz kitap yazma rehberi", "epub şablonu", "kitap bölüm planı şablonu", "ai kitap kontrol listesi"],
});

const resources = [
  {
    icon: FileText,
    badge: "Email Starter Pack",
    title: "AI ile Kitap Yazma Başlangıç Paketi",
    description:
      "Boş sayfaya düşmeden ilk kitabını başlatmak için kısa rehber, kalite filtresi ve yayın öncesi kontrol notları. Email ile gelir, sonra doğrudan wizard akışına taşır.",
    highlights: [
      "Konu özeti oluşturma teknikleri",
      "Bölüm planı nasıl kurulur",
      "Bölüm üretiminde dikkat edilecekler",
      "EPUB/PDF teslim zinciri",
    ],
    cta: "Sihirbazda adım adım uygula",
    href: "/start/topic",
    featured: true,
  },
  {
    icon: Sparkles,
    badge: "Tool Library",
    title: "Ücretsiz Kitap Araçları",
    description:
      "Kitap fikrini puanla, outline çıkar, KDP nişini test et, müşteri çeken açı bul ve başlığını sıkılaştır. Tüm ücretsiz interactive tool'ları tek merkezde gör.",
    highlights: [
      "6 farklı interactive tool",
      "Kısmi açık skor + email ile tam rapor",
      "Start funnel'a giden CTA zinciri",
      "Validator, outline, KDP ve title araçları",
    ],
    cta: "Tool Hub'ı Aç",
    href: "/tools",
    featured: false,
  },
  {
    icon: CheckCircle2,
    badge: "Checklist",
    title: "Kitap Yayın Öncesi Kontrol Listesi",
    description:
      "Amazon KDP veya başka bir platformda yayınlamadan önce kontrol etmen gereken 30 maddelik kapsamlı liste. Wizard ile ürettiğin kitabı yayına hazır hale getir.",
    highlights: [
      "Metadata ve açıklama kontrolleri",
      "Kapak tasarımı standartları",
      "EPUB validasyon adımları",
      "KDP yükleme gereksinimleri",
    ],
    cta: "Kitabını oluştur ve kontrol et",
    href: "/start/topic",
    featured: false,
  },
  {
    icon: Search,
    badge: "Şablon",
    title: "Niş Araştırma Çalışma Sayfası",
    description:
      "Kitabın için doğru niş ve hedef kitleyi bulmak üzere tasarlanmış doldurulabilir çalışma sayfası. Wizard'da kullanmak için referans olarak sakla.",
    highlights: [
      "Hedef okur profili şablonu",
      "Rekabet analizi tablosu",
      "Anahtar kelime araştırma çerçevesi",
      "Fiyatlama ve pazar notları",
    ],
    cta: "Wizard'da nişini tanımla",
    href: "/start/topic",
    featured: false,
  },
  {
    icon: BookOpen,
    badge: "Rehber",
    title: "Kitap Oluşturucu Hızlı Başlangıç (15 dk)",
    description:
      "Platforma ilk girişten ilk kitabın üretimine kadar tüm süreci anlatan adım adım rehber. Sihirbazı doldurma, bölüm planı onayı ve çıktı almak için.",
    highlights: [
      "Sihirbazı doldurmak",
      "Bölüm planı onayı ve düzenleme",
      "Bölüm üretme ve kaydetme",
      "Çıktı ve indirme adımları",
    ],
    cta: "Rehberi uygula — şimdi başla",
    href: "/start/topic",
    featured: false,
  },
  {
    icon: Lightbulb,
    badge: "Fikir Listesi",
    title: "100 Karlı Kitap Fikri Listesi",
    description:
      "Amazon KDP'de iyi satan niş kategorilerde araştırılmış 100 kitap fikri. Her fikir için hedef kitle ve tahmini değerlendirme notu. Kendi konunu seçmek için ilham al.",
    highlights: [
      "10 farklı kategoride 100 fikir",
      "Her fikir için hedef kitle notu",
      "Rekabet seviyesi değerlendirmesi",
      "Fiyat aralığı önerileri",
    ],
    cta: "Bir fikir seç ve başlat",
    href: "/start/topic",
    featured: false,
  },
  {
    icon: Download,
    badge: "KDP Toolkit",
    title: "KDP Başlangıç Toolkit",
    description:
      "Amazon KDP'de ilk kitabını yayınlamak için ihtiyaç duyduğun şablon ve rehberleri tek akışta kullanan başlangıç yolu. Kitap oluşturucuyla KDP için optimize et.",
    highlights: [
      "Kitap açıklaması şablonu",
      "Kategori seçim rehberi",
      "Fiyatlama stratejisi notu",
      "Yayın başlangıç kontrol listesi",
    ],
    cta: "KDP kitabını şimdi oluştur",
    href: "/start/topic",
    featured: false,
  },
] as const;

export default function ResourcesPage() {
  return (
    <MarketingPage>
      {/* Hero */}
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Ücretsiz Kaynaklar</Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Kitap kararını hızlandıracak{" "}
              <span className="text-primary">ücretsiz kaynaklar</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              Rehberler, şablonlar, kontrol listeleri ve eğitimler. Amaç sadece okumak değil; seni daha hızlı şekilde önizleme, bölüm planı ve gerçek kitap akışına taşımak.
            </p>
          </div>
        </div>
      </section>

      {/* Featured resource */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <LeadMagnetSignupCard leadMagnet={featuredLeadMagnet} />
        </div>
      </section>

      {/* All resources */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading
            badge="Tüm Kaynaklar"
            title="Süreci kolaylaştıran araçlar."
            description="Rehberden şablona, kontrol listesinden video eğitime kadar her aşama için hazırlanmış kaynaklar."
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.filter((r) => !r.featured).map((resource) => {
              const Icon = resource.icon;
              return (
                <Card key={resource.title} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <Badge>{resource.badge}</Badge>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">{resource.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{resource.description}</p>
                    </div>
                    <ul className="space-y-2 border-t border-border/60 pt-4">
                      {resource.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={resource.href}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      {resource.cta}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <section className="border-b border-border/80 py-10">
        <div className="shell flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <span>Daha fazla içerik arıyorsan:</span>
          <Link href="/tools" className="font-medium text-foreground underline-offset-4 hover:underline">
            Araçlar → Interactive tool library
          </Link>
          <Link href="/blog" className="font-medium text-foreground underline-offset-4 hover:underline">
            Blog → Yazarlık ve yapay zeka rehberleri
          </Link>
          <Link href="/faq" className="font-medium text-foreground underline-offset-4 hover:underline">
            SSS → Sık sorulan sorular
          </Link>
          <Link href="/how-it-works" className="font-medium text-foreground underline-offset-4 hover:underline">
            Nasıl Çalışır → Adım adım süreç
          </Link>
        </div>
      </section>

      <MarketingCtaSection
        title="Okumak yerine kendi kitabını başlat."
        description="Rehberleri inceledin, şablonları gördün. Şimdi aynı mantığı kendi konu özetinle test et: önce önizlemeyi gör, sonra devam etmeye karar ver. 30 gün iade garantisi."
        items={[
          "Sihirbaz ile hızlı başlangıç",
          "Bölüm planı + bölüm üretimi",
          "Önce önizleme, sonra tam kitap",
          "EPUB ve PDF çıktısı",
        ]}
      />
    </MarketingPage>
  );
}
