import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FAQPageHero } from "@/components/site/page-heroes";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Faq5 } from "@/components/ui/faq-5";
import { Card, CardContent } from "@/components/ui/card";
import { faqSections } from "@/lib/marketing-data";
import { buildPageMetadata } from "@/lib/seo";

// Her FAQ bölümüne ilgili CTA — objection'ı direkt kapatır
const sectionCtas: Record<string, { label: string; href: string }> = {
  "Genel": { label: "Nasıl çalıştığını gör", href: "/how-it-works" },
  "Kitap Üretimi": { label: "Örnekleri incele", href: "/examples" },
  "Kapak ve Tasarım": { label: "Örneklere bak", href: "/examples" },
  "Teslim ve Çıktılar": { label: "Planları karşılaştır", href: "/pricing" },
  "Haklar ve Yayın": { label: "Ücretsiz önizleme başlat", href: "/start/topic" },
  "Abonelik ve Ödeme": { label: "Fiyatları gör", href: "/pricing" },
  "Destek": { label: "İletişime geç", href: "/contact" },
};

export const metadata: Metadata = buildPageMetadata({
  title: "Kitap Oluşturucu SSS | Yapay Zeka ile Kitap Yazma Soruları",
  description:
    "Kitap Oluşturucu kullanım akışı, planlar, çıktı formatları, haklar, kapak, ödeme ve destek süreçleri hakkında en sık sorulan soruların kısa cevaplarını inceleyin.",
  path: "/faq",
  keywords: ["book generator sss", "ai kitap yazma soruları", "epub pdf çıktı"],
});

export default function FaqPage() {
  const topFaqs = faqSections
    .slice(0, 2)
    .reduce<Array<{ question: string; answer: string }>>((all, section) => {
      section.items.forEach(([question, answer]) => {
        all.push({ question, answer });
      });
      return all;
    }, [])
    .slice(0, 4);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqSections.flatMap((section) =>
      section.items.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    ),
  };

  return (
    <MarketingPage>
      <FAQPageHero />
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <h1 className="sr-only">Kitap Oluşturucu sık sorulan sorular</h1>
          <SectionHeading
            badge="SSS"
            title="Kararı geciktiren temel sorular."
            description="Ne üretildiği, nasıl çalıştığı, hangi çıktıları verdiği ve ilk kez kullanan biri için ne kadar anlaşılır olduğu burada netlenir."
            align="center"
          />
          <p className="mx-auto max-w-2xl text-center text-sm leading-7 text-muted-foreground">
            Teknik sorular için{" "}
            <Link href="/contact" className="text-foreground underline-offset-4 hover:underline">
              iletişim
            </Link>
            , plan detayları için{" "}
            <Link href="/pricing" className="text-foreground underline-offset-4 hover:underline">
              fiyatlar
            </Link>{" "}
            ve süreç adımları için{" "}
            <Link href="/how-it-works" className="text-foreground underline-offset-4 hover:underline">
              nasıl çalışır
            </Link>{" "}
            sayfalarını da inceleyebilirsin.
          </p>
        </div>
      </section>

      <section className="border-b border-border/80">
        <Faq5
          badge="Hızlı cevaplar"
          heading="İlk bakışta bilmek isteyeceğin 4 cevap"
          description="Bunlar genelde kullanıcının satın alma veya deneme kararını belirleyen ilk sorulardır."
          faqs={topFaqs}
        />
      </section>

      <section className="py-18">
        <div className="shell space-y-10">
          <SectionHeading
            badge="Tüm sorular"
            title="Konulara göre ayrılmış daha detaylı cevaplar."
            description="Genel kullanım, kitap üretimi, kapak, teslim, haklar, ödeme ve destek başlıkları altında toplandı."
          />

          {faqSections.map((section) => {
            const cta = sectionCtas[section.title];
            return (
              <section key={section.title} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                    {section.title}
                  </h2>
                  {cta && (
                    <Link
                      href={cta.href}
                      className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      {cta.label} <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {section.items.map(([question, answer]) => (
                    <Card key={question}>
                      <CardContent className="space-y-3">
                        <h3 className="text-lg font-semibold tracking-tight text-foreground">{question}</h3>
                        <p className="text-sm leading-8 text-muted-foreground">{answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                Kimler için doğru değil?
              </h2>
              <Link
                href="/use-cases"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Kimler için olduğunu gör <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="space-y-3">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">Bizim güçlü olduğumuz alan</h3>
                  <p className="text-sm leading-8 text-muted-foreground">
                    Rehber kitap, uzmanlık kitabı, müşteri çeken kısa kitap ve yayına hazır bilgi kitabı üretimi. Özellikle uzmanlar, eğitmenler, içerik üreticileri ve KDP odaklı kullanıcılar için.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-3">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">Doğru fit olmayan kullanım</h3>
                  <p className="text-sm leading-8 text-muted-foreground">
                    Roman, akademik tez, ağır dipnotlu çalışma veya teknik dokümantasyon için tasarlanmadı. Bu sınırlamayı açık söylemek güveni artırır; ürünü olduğundan farklı göstermeyiz.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </section>

      <MarketingCtaSection
        title="Soruların bittiyse şimdi kendi kitabını başlat."
        description="Konu fikrini yaz, taslağı gör ve ilk EPUB akışını dene. Kararı sayfa üzerinde değil, ürün içinde netleştir. 30 gün iade garantisi, kredi kartı gerekmez."
        items={[
          "İlk akışta net yönlendirme",
          "Türkçe panel, İngilizce içerik",
          "Bölüm planı ve çıktı sistemi",
          "Önce önizleme, sonra tam kitap",
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </MarketingPage>
  );
}
