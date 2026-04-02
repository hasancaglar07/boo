import type { Metadata } from "next";
import { Download, BookOpen, FileText, Search, Lightbulb, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Ücretsiz Kaynaklar | Book Generator",
  description:
    "AI ile kitap yazmak için pratik rehberler, kontrol listeleri ve şablonlar. Kitap yazma sürecinizi hızlandıracak ücretsiz kaynakları indirin.",
  path: "/resources",
  keywords: ["ücretsiz kitap yazma rehberi", "epub şablonu", "kitap outline şablonu", "ai kitap checklist"],
});

const resources = [
  {
    icon: FileText,
    badge: "PDF Rehber",
    title: "AI ile Kitap Yazma: Başlangıç Rehberi",
    description:
      "Sıfırdan ilk EPUB çıktına kadar tüm süreci anlatan 15 sayfalık pratik rehber. Brief oluşturma, outline onayı ve bölüm üretimi adım adım.",
    highlights: [
      "Brief oluşturma teknikleri",
      "Outline yapısı nasıl kurulur",
      "Bölüm üretiminde dikkat edilecekler",
      "EPUB/PDF teslim zinciri",
    ],
    cta: "Ücretsiz İndir",
    href: "/start/topic",
    featured: true,
  },
  {
    icon: Sparkles,
    badge: "Interactive Tool",
    title: "Book Idea Validator",
    description:
      "Kitap fikrini puanla, doğru formatı gör ve mini outline önerisi al. Özellikle authority book, lead magnet ve KDP odaklı fikirleri netleştirmek için tasarlandı.",
    highlights: [
      "Audience clarity score",
      "Title idea önerileri",
      "Mini outline başlangıcı",
      "Format ve angle tavsiyesi",
    ],
    cta: "Aracı Aç",
    href: "/tools/book-idea-validator",
    featured: false,
  },
  {
    icon: CheckCircle2,
    badge: "Checklist",
    title: "Kitap Yayın Öncesi Kontrol Listesi",
    description:
      "Amazon KDP veya başka bir platformda yayınlamadan önce kontrol etmen gereken 30 maddelik kapsamlı liste.",
    highlights: [
      "Metadata ve açıklama kontrolleri",
      "Kapak tasarımı standartları",
      "EPUB validasyon adımları",
      "KDP yükleme gereksinimleri",
    ],
    cta: "Listeyi Al",
    href: "/start/topic",
    featured: false,
  },
  {
    icon: Search,
    badge: "Şablon",
    title: "Niş Araştırma Çalışma Sayfası",
    description:
      "Kitabın için doğru niş ve hedef kitleyi bulmak üzere tasarlanmış doldurulabilir çalışma sayfası.",
    highlights: [
      "Hedef okur profili şablonu",
      "Rekabet analizi tablosu",
      "Keyword araştırma çerçevesi",
      "Fiyatlama ve pazar notları",
    ],
    cta: "Şablonu İndir",
    href: "/start/topic",
    featured: false,
  },
  {
    icon: BookOpen,
    badge: "Video Eğitim",
    title: "Book Generator Hızlı Başlangıç (15 dk)",
    description:
      "Platforma ilk girişten ilk kitabın üretimine kadar tüm süreci gösteren ekran kaydı eğitimi.",
    highlights: [
      "Wizard'ı doldurmak",
      "Outline onayı ve düzenleme",
      "Bölüm üretme ve kaydetme",
      "Export ve indirme adımları",
    ],
    cta: "Eğitime Katıl",
    href: "/start/topic",
    featured: false,
  },
  {
    icon: Lightbulb,
    badge: "Rehber",
    title: "100 Karlı Kitap Fikri Listesi",
    description:
      "Amazon KDP'de iyi satan niş kategorilerde araştırılmış 100 kitap fikri. Her fikir için hedef kitle ve tahmini değerlendirme notu.",
    highlights: [
      "10 farklı kategoride 100 fikir",
      "Her fikir için hedef kitle notu",
      "Rekabet seviyesi değerlendirmesi",
      "Fiyat aralığı önerileri",
    ],
    cta: "Listeye Eriş",
    href: "/start/topic",
    featured: false,
  },
  {
    icon: Download,
    badge: "Toolkit",
    title: "KDP Başlangıç Toolkit",
    description:
      "Amazon KDP'de ilk kitabını yayınlamak için ihtiyaç duyduğun tüm şablon ve rehberlerin bir arada olduğu başlangıç paketi.",
    highlights: [
      "Kitap açıklaması şablonu",
      "Kategori seçim rehberi",
      "Fiyatlama stratejisi notu",
      "Launch kontrol listesi",
    ],
    cta: "Paketi İndir",
    href: "/start/topic",
    featured: false,
  },
] as const;

const freeGuideChecklist = [
  "AI brief'ini nasıl etkili doldurursun",
  "Outline onayında nelere dikkat etmeli",
  "Bölüm üretiminde tutarlılığı nasıl korursun",
  "İlk EPUB'unu nasıl doğrularsın",
  "KDP'ye yüklemeden önce son kontroller",
];

export default function ResourcesPage() {
  return (
    <MarketingPage>
      {/* Hero */}
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Ücretsiz Kaynaklar</Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Kitap yazma yolculuğunu hızlandıracak{" "}
              <span className="text-primary">ücretsiz araçlar</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              Rehberler, şablonlar, kontrol listeleri ve eğitimler. Hepsi ücretsiz, hepsi Book Generator kullanıcıları için hazırlandı.
            </p>
          </div>
        </div>
      </section>

      {/* Featured resource */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 md:p-12">
            <div className="grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-center">
              <div>
                <Badge className="mb-4">Öne Çıkan Kaynak</Badge>
                <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  AI ile Kitap Yazma: Başlangıç Rehberi
                </h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground">
                  Sıfırdan ilk EPUB çıktına kadar tüm süreci anlatan 15 sayfalık pratik rehber. Hem Book Generator'ı hem de genel AI kitap yazma sürecini öğrenmek isteyenler için.
                </p>
                <Link
                  href="/start/topic"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  <Download className="size-4" />
                  Ücretsiz İndir
                </Link>
              </div>
              <div className="rounded-2xl border border-border bg-background p-6">
                <p className="mb-4 text-sm font-medium text-foreground">Bu rehberde:</p>
                <ul className="space-y-3">
                  {freeGuideChecklist.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
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
          <span>Daha fazla içerik arıyorsanız:</span>
          <Link href="/blog" className="font-medium text-foreground underline-offset-4 hover:underline">
            Blog → Yazarlık ve AI rehberleri
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
        title="Kaynakları kullan, kitabını üret."
        description="Rehberleri okudun, şablonları indirdin. Şimdi gerçek kitabını Book Generator ile oluşturmanın zamanı."
        items={[
          "Wizard ile hızlı başlangıç",
          "Outline + bölüm üretimi",
          "EPUB ve PDF çıktısı",
          "14 gün ücretsiz",
        ]}
      />
    </MarketingPage>
  );
}
