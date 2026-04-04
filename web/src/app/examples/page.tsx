import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CheckCircle2, Globe, Layers3, Sparkles } from "lucide-react";

import { ExamplesPageHero } from "@/components/site/page-heroes";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { ExamplesShowcase } from "@/components/site/examples-showcase";
import { loadExamplesShowcaseData } from "@/lib/examples-data";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Örnek Kitaplar ve Gerçek Çıktılar | Kitap Oluşturucu",
  description:
    "Gerçek kapaklar, bölüm planları, ilk bölüm önizlemeleri ve EPUB/PDF/HTML çıktılarıyla örnek kitapları inceleyin. Sonra aynı akışla kendi kitabınızı başlatın.",
  path: "/examples",
  keywords: [
    "örnek kitaplar",
    "ai kitap örnekleri",
    "epub pdf html kitap örnekleri",
    "kitap oluşturucu örnekler",
  ],
});

export const revalidate = 86400;

const faqs = [
  {
    question: "Buradaki örnekler gerçek mi, yoksa demo tasarımlar mı?",
    answer:
      "Bu sayfadaki örnekler; konu özeti, taslak, bölüm üretimi, kapak ve çıktı akışının gerçek ürün akışından gelen örnekleridir. Amaç sadece görsel göstermek değil, ortaya çıkan yapıyı görünür kılmaktır.",
  },
  {
    question: "Her örnekte neyi inceleyebilirim?",
    answer:
      "Kapak, kategori, dil, bölüm sayısı, özet, hızlı bak önizlemesi, ilk bölümden metin örneği ve uygun olan örneklerde HTML/PDF/EPUB çıktıları inceleyebilirsin.",
  },
  {
    question: "Bu örnekler benim sonucumla birebir aynı olur mu?",
    answer:
      "Hayır, birebir aynı olmaz. Ama bu sayfa sana bekleyebileceğin kalite seviyesini, yapı mantığını ve teslim biçimini gösterir. Kendi konu özeti ve hedef kitlenle sana özel bir kitap akışı oluşur.",
  },
  {
    question: "Beğendiğim bir örneğe benzer kitap başlatabilir miyim?",
    answer:
      "Evet. Her örnekten sonra aynı başlangıç akışına geçebilir, kendi konunla benzer bir üretim süreci başlatabilirsin.",
  },
] as const;

export default async function ExamplesPage() {
  const { items, categories, languages } = await loadExamplesShowcaseData();
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Örnek Kitaplar ve Gerçek Çıktılar",
    description:
      "Gerçek kapaklar, görünür bölüm planları, ilk bölüm önizlemeleri ve çıktı dosyalarıyla örnek kitap vitrini.",
    url: absoluteUrl("/examples"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/examples/${item.slug}`),
        name: item.title,
      })),
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <MarketingPage>
      <ExamplesPageHero items={items} />

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            badge="Örnekler neyi kanıtlıyor?"
            title="Bu sayfa sadece vitrin değil, karar verme aracı"
            description="İlk kez gelen bir ziyaretçi burada yalnızca kapaklara bakmaz. Her örnek; yapının, metnin ve teslim biçiminin gerçek seviyesini daha hızlı anlaman için vardır."
          />

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div className="rounded-[28px] border border-border/80 bg-card p-6 md:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Bu örnekler sana 4 şeyi gösterir
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  {
                    icon: Layers3,
                    title: "Yapı kalitesi",
                    text: "Bölüm planı gerçekten okunabilir mi, konu mantıklı bir omurgaya oturuyor mu?",
                  },
                  {
                    icon: Sparkles,
                    title: "Metin seviyesi",
                    text: "İlk bölüm önizlemeleri sayesinde yalnızca kapak değil, gerçek içerik hissi de görünür olur.",
                  },
                  {
                    icon: BookOpen,
                    title: "Kapak ve konumlandırma",
                    text: "Kapak, başlık ve kategori uyumu sana yayınlanabilirlik hissi verir mi, bunu test edersin.",
                  },
                  {
                    icon: Globe,
                    title: "Teslim biçimi",
                    text: "Uygun örneklerde HTML, PDF ve EPUB çıktılarının gerçekten hazır olup olmadığını görürsün.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                      <Icon className="size-5 text-primary" />
                      <h3 className="mt-3 text-base font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_6%,var(--background)),var(--background))] p-6 md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                <CheckCircle2 className="size-3.5 text-primary" />
                Bu sayfa nasıl kullanılır?
              </div>
              <ol className="mt-5 space-y-4">
                {[
                  "Önce konuna yakın örnekleri bulmak için kategori, dil ve aramayı kullan.",
                  "Hızlı bak ile içindekiler, ilk bölüm ve çıktı sekmelerini incele.",
                  "Uygun gördüğün örneğin tam sayfasını açıp daha derin oku.",
                  "Sonra aynı akışla kendi konunla kitabını başlat.",
                ].map((item, index) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-7 text-foreground">{item}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="#ornek-vitrini"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                >
                  Örnekleri keşfet
                </Link>
                <Link
                  href="/start/topic"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
                >
                  Kendi kitabını başlat
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-12">
        <div className="shell grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: `${items.length}+ gerçek örnek`,
              text: "Galeri mantığıyla değil, gerçek teslim seviyesini gösterecek şekilde seçilmiş örnekler.",
            },
            {
              title: `${Math.max(0, categories.length - 1)} kategori`,
              text: "Farklı kullanım alanları arasında karşılaştırma yapabilir, sana yakın örnekleri daha hızlı bulabilirsin.",
            },
            {
              title: `${Math.max(0, languages.length - 1)} dil görünümü`,
              text: "Çok dilli üretim seviyesini yalnızca sözle değil, örnek kitaplar üzerinden görürsün.",
            },
            {
              title: "Önce önizleme, sonra karar",
              text: "Bu sayfa, üretime geçmeden önce kaliteyi ve yapıyı görüp daha rahat karar vermen için var.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] border border-border/80 bg-card/80 px-5 py-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <ExamplesShowcase items={items} categories={categories} languages={languages} />

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionHeading
              badge="Neden güven verir?"
              title="Yalnızca güzel görünen kapaklar değil"
              description="Örnek sayfası ikna edici olmak istiyorsa sadece estetik değil, içerik ve teslim seviyesini de göstermelidir."
            />

            <div className="space-y-3">
              {[
                "Her örnekte görünür bir kitap kimliği vardır: başlık, kategori, dil ve özet.",
                "Hızlı bak akışı sayesinde sayfadan kopmadan önce içindekiler ve ilk bölüm hissi alınır.",
                "Uygun örneklerde çıktı formatları açıkça gösterilir; yalnızca vaat edilmez.",
                "Beğendiğin örnekten sonra aynı başlangıç akışına geçebilirsin.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card px-4 py-4">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <p className="text-sm leading-7 text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading
              badge="Karar öncesi kısa cevaplar"
              title="Örnekleri incelerken en çok sorulan sorular"
              description="Bu bölüm, sayfada dolaşırken kalan belirsizlikleri azaltır ve neye baktığını daha netleştirir."
            />

            <div className="grid gap-4">
              {faqs.map((item) => (
                <div key={item.question} className="rounded-[24px] border border-border/80 bg-card p-6">
                  <h3 className="text-lg font-semibold text-foreground">{item.question}</h3>
                  <p className="mt-3 text-sm leading-8 text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="shell">
          <div className="rounded-[32px] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_7%,var(--background)),var(--background))] p-8 md:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Bir sonraki adım
              </div>
              <h2 className="mt-6 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Örnekler yeterince iyi görünüyorsa, <span className="text-primary">şimdi kendi konunu dene.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                Aynı akışla başlarsın: konu özeti, bölüm planı, önizleme, kapak ve çıktı. Önce örnekleri gördün;
                şimdi aynı mantığı kendi kitabın için çalıştırabilirsin.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/start/topic"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                >
                  Kendi kitabını başlat
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
                >
                  Önce nasıl çalıştığını gör
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
                >
                  Fiyatları incele
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </MarketingPage>
  );
}
