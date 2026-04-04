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
import { buildPageMetadata, absoluteUrl, siteConfig } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Kitap Oluşturucu Nasıl Çalışır? 3 Adımda Kitap Üretimi",
  description:
    "Kitap Oluşturucu ile kitap üretim sürecini adım adım keşfedin: konu özeti oluşturma, bölüm planı onayı, bölüm üretimi ve EPUB/PDF teslim akışını tek sayfada görün.",
  path: "/how-it-works",
  keywords: ["kitap yazma süreci", "ai kitap üretimi adımları", "epub hazırlama"],
});

const workflowCards = [
  {
    eyebrow: "Konu Özeti",
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
    title: "Taslak ve anahtar kelimeler aynı mantıkta ilerler",
    description:
      "Konu araştırması ve bölüm mantığı kopuk kalmaz. Okur ihtiyacı doğrudan taslak sistemine taşınır.",
    visual: "outline",
  },
  {
    eyebrow: "Yayın",
    title: "Çıktı dosyaları sonradan değil, baştan düşünülür",
    description:
      "EPUB, PDF ve metadata akışı kitap üretiminin ayrılmaz parçası olarak ilerler.",
    visual: "exports",
  },
] as const;

export default function HowItWorksPage() {
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Kitap Oluşturucu ile Nasıl Kitap Üretilir?",
    description: "Yapay zeka destekli Kitap Oluşturucu ile 3 adımda kitap üretin: konu özetini girin, taslağı onaylayın, EPUB/PDF alın.",
    inLanguage: "tr-TR",
    totalTime: "PT30M",
    url: absoluteUrl("/how-it-works"),
    supply: deliverables.map((d) => ({ "@type": "HowToSupply", name: d })),
    step: howItWorksPageSteps.map((s) => ({
      "@type": "HowToStep",
      position: Number(s.step),
      name: s.title,
      text: s.text,
    })),
  };

  return (
    <MarketingPage>
      <HowItWorksPageHero />
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <h1 className="sr-only">Kitap Oluşturucu nasıl çalışır</h1>
          <SectionHeading
            badge="Nasıl çalışır"
            title="Fikirden ilk EPUB dosyasına uzanan tek yol."
            description="Bu ürün önce kararı netleştirir, sonra bölüm planını kurar, sonra bölümleri üretir. Yani önce yön, sonra yazı, sonra teslim."
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
                  {"output" in item && item.output ? (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/70">Bu adımda elde edersin</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{item.output}</p>
                    </div>
                  ) : null}
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
          title="Kısa konu özeti nasıl yayınlanabilir kitaba dönüşüyor?"
          description="Aynı kitap içinde bölüm planı, araştırma, kapak ve çıktı birbirini tamamlayan parçalar gibi işler."
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
        description="Fikri netleştir, bölüm planını onayla ve ilk kitabı çıkar. Üretim süreci senin yerine düşünsün, sen yönü belirle."
        items={[
          "Kısa ve yönlendirilmiş başlangıç",
          "Bölüm planı + bölüm akışı",
          "Araştırma ve kapak destekleri",
          "EPUB önce teslim mantığı",
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
    </MarketingPage>
  );
}
