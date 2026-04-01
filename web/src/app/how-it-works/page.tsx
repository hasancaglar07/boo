import type { Metadata } from "next";
import { ArrowRight, BookOpenCheck, FileOutput, SearchCheck, WandSparkles } from "lucide-react";
import Link from "next/link";

import { HowItWorksPageHero } from "@/components/site/page-heroes";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Features11 } from "@/components/ui/features-11";
import { Card, CardContent } from "@/components/ui/card";
import { deliverables, howItWorksPageSteps } from "@/lib/marketing-data";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Generator Nasıl Çalışır? 3 Adımda Kitap Üretimi",
  description:
    "Book Generator ile kitap üretim sürecini adım adım keşfedin: brief oluşturma, outline onayı, bölüm üretimi ve EPUB/PDF teslim akışını tek sayfada görün.",
  path: "/how-it-works",
  keywords: ["kitap yazma süreci", "ai kitap üretimi adımları", "epub hazırlama"],
});

const workflowCards = [
  {
    eyebrow: "Brief",
    title: "Kısa cevaplardan net kitap yönü",
    description:
      "Kime yazdığını, hangi sonucu vaat ettiğini ve hangi dilde üretmek istediğini sisteme verirsin. Geri kalan akışı sistem toplar.",
    visual: "editor",
  },
  {
    eyebrow: "Konumlandırma",
    title: "Kitap rafta nasıl görünecekse o yöne kurulur",
    description:
      "Başlık, alt başlık ve kitap açıklaması daha en başta uyumlu hale gelir. Bu da sonradan düzeltme ihtiyacını azaltır.",
    visual: "library",
  },
  {
    eyebrow: "Araştırma",
    title: "Outline ve keyword aynı mantıkta ilerler",
    description:
      "Konu araştırması ve bölüm mantığı kopuk kalmaz. Okur ihtiyacı doğrudan outline sistemine taşınır.",
    visual: "outline",
  },
  {
    eyebrow: "Yayın",
    title: "Export dosyaları sonradan değil, baştan düşünülür",
    description:
      "EPUB, PDF ve metadata akışı kitap üretiminin ayrılmaz parçası olarak ilerler.",
    visual: "exports",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <MarketingPage>
      <HowItWorksPageHero />
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <h1 className="sr-only">Book Generator nasıl çalışır</h1>
          <SectionHeading
            badge="Nasıl çalışır"
            title="Fikirden ilk EPUB dosyasına uzanan tek yol."
            description="Bu ürün önce kararı netleştirir, sonra outline kurar, sonra bölümleri üretir. Yani önce yön, sonra yazı, sonra teslim."
          />

          {/* Progress bar kaldırıldı — statik sayfada current step kavramı yok */}

          <div className="grid gap-4 md:grid-cols-3">
            {howItWorksPageSteps.map((item) => (
              <Card key={item.step} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-sm font-medium text-primary">
                    {item.step}
                  </span>
                  <div className="flex-1 space-y-3">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">{item.title}</h2>
                    <p className="text-sm leading-8 text-muted-foreground">{item.text}</p>
                  </div>
                  <div className="border-t border-border/60 pt-4">
                    <Link
                      href="/start/topic"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      Başla
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80">
        <Features11
          badge="Akış detayı"
          title="Kısa brief nasıl yayınlanabilir kitaba dönüşüyor?"
          description="Aynı kitap içinde outline, araştırma, kapak ve export birbirini tamamlayan parçalar gibi işler."
          cards={workflowCards}
        />
      </section>

      <section className="border-b border-border/80 py-18">
        <div className="shell">
          <SectionHeading
            badge="Teslim"
            title="Sürecin sonunda ne alırsın?"
            description="Yazı sadece ekranda kalmaz. Kitap klasörü, dosya çıktıları ve yayın için gerekli temel paketler birlikte oluşur."
          />

          <div className="grid gap-4">
            <Card>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {deliverables.map((item, index) => (
                  <div key={item} className="rounded-2xl border border-border/80 bg-background px-4 py-4 text-sm text-foreground">
                    <div className="mb-3 flex items-center gap-2 text-primary">
                      {index % 4 === 0 ? (
                        <WandSparkles className="size-4" />
                      ) : index % 4 === 1 ? (
                        <SearchCheck className="size-4" />
                      ) : index % 4 === 2 ? (
                        <BookOpenCheck className="size-4" />
                      ) : (
                        <FileOutput className="size-4" />
                      )}
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-primary/80">Çıktı</span>
                    </div>
                    <div className="leading-7">{item}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <MarketingCtaSection
        title="Boş ekrana bakarak değil, yönlendirilmiş bir sistemle başla."
        description="Fikri netleştir, outline'i onayla ve ilk kitabı çıkar. Üretim süreci senin yerine düşünsün, sen yönü belirle."
        items={[
          "Kısa ve yönlendirilmiş başlangıç",
          "Outline + bölüm akışı",
          "Araştırma ve kapak destekleri",
          "EPUB önce teslim mantığı",
        ]}
      />
    </MarketingPage>
  );
}
