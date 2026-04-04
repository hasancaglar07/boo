import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileOutput,
  Layers3,
  PencilRuler,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WandSparkles,
} from "lucide-react";

import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Kitap Oluşturucu Nasıl Çalışır? 3 Adımda Kitap Üretimi",
  description:
    "Kısa bir konu özetinden bölüm planına, önizlemeden EPUB/PDF çıktısına kadar kitap üretim sürecinin nasıl ilerlediğini adım adım görün.",
  path: "/how-it-works",
  keywords: ["kitap oluşturucu nasıl çalışır", "ai kitap üretimi", "epub pdf kitap oluşturma"],
});

const steps = [
  {
    step: "1",
    title: "Konunu ve hedef okurunu gir",
    text: "Kısa bir özet, hedef okur ve anlatmak istediğin sonucu paylaşırsın. Uzun formlar değil, yönlendirmeli sorularla başlarsın.",
    output: "Net kitap yönü, başlık açısı ve başlangıç çerçevesi",
    cta: "Konu özetini gir",
    icon: Target,
  },
  {
    step: "2",
    title: "Taslağı gözden geçir ve onayla",
    text: "Sistem başlık, bölüm akışı ve kitap omurgasını önerir. İstersen düzenler, netleştirir ve onaylayarak üretime geçersin.",
    output: "Görünür bölüm planı ve daha kontrollü üretim akışı",
    cta: "Bölüm planını oluştur",
    icon: Layers3,
  },
  {
    step: "3",
    title: "Önizlemeyi gör, çıktılarını al",
    text: "İlk sonucu görür, beğendiğinde kitabını tam çıktıya dönüştürürsün. EPUB ve PDF dosyaları tek akışta hazırlanır.",
    output: "Önizleme, düzenlenebilir içerik ve EPUB/PDF çıktıları",
    cta: "Üretime başla",
    icon: FileOutput,
  },
] as const;

const reassuranceItems = [
  {
    icon: Clock3,
    title: "Hızlı başlangıç",
    text: "Uzun hazırlık yapmadan birkaç kısa cevapla başlarsın.",
  },
  {
    icon: PencilRuler,
    title: "Kontrol sende",
    text: "Taslağı görmeden ve onaylamadan kör üretime geçmezsin.",
  },
  {
    icon: ShieldCheck,
    title: "Çıktı odaklı akış",
    text: "Süreç yalnızca yazı üretmez; sonunda EPUB/PDF teslimini hedefler.",
  },
  {
    icon: Users,
    title: "Uzmanlar için uygun",
    text: "Bilgisini kitaba dönüştürmek isteyen eğitmenler, danışmanlar ve üreticiler için tasarlanmıştır.",
  },
] as const;

const behindTheScenes = [
  {
    eyebrow: "Yön",
    title: "Önce ne yazacağını değil, neden yazdığını netleştirirsin",
    description:
      "Kime yazdığın, okura hangi sonucu vaat ettiğin ve hangi dilde ilerlemek istediğin baştan belirlenir. Böylece kitap daha ilk adımdan dağılmaz.",
    icon: Target,
  },
  {
    eyebrow: "Plan",
    title: "Bölüm yapısı görünür olur",
    description:
      "Başlık, alt başlık ve bölüm sırası birlikte şekillenir. Sonradan toparlanan bir metin yerine baştan planlanan bir omurga oluşur.",
    icon: Layers3,
  },
  {
    eyebrow: "Üretim",
    title: "Önizleme ile ilerlersin",
    description:
      "Sistem yalnızca metin dökmez. Önce görünür bir sonuç üretir; sen de üretimi neye dönüştürdüğünü daha erken görürsün.",
    icon: Sparkles,
  },
  {
    eyebrow: "Teslim",
    title: "Çıktılar sonradan değil, sürecin içinde hazırlanır",
    description:
      "EPUB, PDF ve temel yayın dosyaları işin sonuna eklenen ayrı bir uğraş olmaktan çıkar; üretimin doğal parçası haline gelir.",
    icon: FileOutput,
  },
] as const;

const audience = [
  "Uzmanlığını kitaba dönüştürmek isteyen danışmanlar ve eğitmenler",
  "Boş sayfadan başlamak yerine yönlendirmeli bir akış isteyen ilk kitap yazarları",
  "Hızlı taslak, görünür bölüm planı ve çıktı odaklı ilerlemek isteyen içerik üreticileri",
] as const;

const deliverables = [
  {
    icon: WandSparkles,
    label: "Kitap yönü",
    text: "Başlık açısı, konumlandırma ve kitabın temel vaadi",
  },
  {
    icon: SearchCheck,
    label: "Plan",
    text: "Bölüm bölüm görünür taslak ve kitap omurgası",
  },
  {
    icon: BookOpenCheck,
    label: "İçerik",
    text: "Düzenlenebilir bölüm içerikleri ve önizleme çıktısı",
  },
  {
    icon: FileOutput,
    label: "Teslim",
    text: "EPUB, PDF ve yayın hazırlığını kolaylaştıran temel dosyalar",
  },
] as const;

const faqs = [
  {
    question: "Başlamak için neye ihtiyacım var?",
    answer:
      "Genelde kısa bir konu özeti, hedef okur bilgisi ve kitabın neyi başarmasını istediğine dair birkaç net cevap yeterlidir.",
  },
  {
    question: "Taslağı görmeden üretime geçiyor muyum?",
    answer:
      "Hayır. Süreç, yönünü ve bölüm planını görüp onaylamanı kolaylaştıracak şekilde tasarlanmıştır.",
  },
  {
    question: "Sadece metin mi alıyorum, yoksa çıktı dosyaları da var mı?",
    answer:
      "Amaç yalnızca metin üretmek değil; önizleme ve kitap çıktılarıyla birlikte EPUB/PDF teslimine kadar ilerlemektir.",
  },
  {
    question: "Bu ürün kimler için daha uygun?",
    answer:
      "Özellikle bilgi, deneyim veya yöntemini kitaplaştırmak isteyen uzmanlar, eğitmenler, danışmanlar ve üreticiler için uygundur.",
  },
] as const;

export default function HowItWorksPage() {
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Kitap Oluşturucu ile nasıl kitap üretilir?",
    description:
      "Konu özetini gir, taslağı onayla, önizlemeyi gör ve EPUB/PDF çıktıları al.",
    inLanguage: "tr-TR",
    totalTime: "PT30M",
    url: absoluteUrl("/how-it-works"),
    step: steps.map((item) => ({
      "@type": "HowToStep",
      position: Number(item.step),
      name: item.title,
      text: item.text,
    })),
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
      <section className="relative overflow-hidden border-b border-border/80 py-20 md:py-28">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_7%,var(--background)),var(--background)_68%)]" />
        <div className="hero-glow" />
        <div className="shell relative">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Nasıl çalışır
            </div>

            <h1 className="mt-8 text-balance font-serif text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
              Konunu gir, planını onayla, <span className="text-primary">kitabını çıktıya dönüştür.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground md:text-lg">
              Kitap Oluşturucu; kısa bir konu özetini görünür bölüm planına, önizlemeye ve EPUB/PDF
              çıktısına taşıyan yönlendirmeli bir kitap üretim akışıdır.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/start/topic"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
              >
                Kitabını oluşturmaya başla
                <ArrowRight className="size-4" />
              </Link>
              <span className="text-sm text-muted-foreground">
                Kısa cevaplarla başlarsın. Taslağı görür, sonra ilerlersin.
              </span>
            </div>

            <div className="mt-12 grid gap-3 md:grid-cols-3">
              {steps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="rounded-[24px] border border-border/80 bg-card/80 p-5 text-left backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-primary/70">
                        Adım {item.step}
                      </span>
                      <Icon className="size-4 text-primary" />
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-foreground">{item.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            badge="3 adımda süreç"
            title="Süreç tam olarak nasıl ilerler?"
            description="Yeni bir ziyaretçi olarak yalnızca ne olacağını değil, her adımın sonunda elinde ne olacağını da görmelisin. Bu sayfa bunun için var."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.step} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col space-y-4 p-6">
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-sm font-medium text-primary">
                        {item.step}
                      </span>
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-2xl font-semibold tracking-tight text-foreground">{item.title}</h3>
                      <p className="text-sm leading-8 text-muted-foreground">{item.text}</p>
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/70">
                        Bu adımın sonucu
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">{item.output}</p>
                    </div>
                    <div className="border-t border-border/60 pt-4">
                      <Link
                        href="/start/topic"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        {item.cta}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            badge="Güven ve netlik"
            title="Seni boş sayfa stresiyle değil, görünür bir akışla ilerletir"
            description="Bu sayfanın amacı sadece özellik göstermek değil; ne kadar emek vereceğini, ne kadar kontrolün olacağını ve sonunda ne alacağını netleştirmektir."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {reassuranceItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardContent className="p-6">
                    <Icon className="size-5 text-primary" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            badge="Neden daha anlaşılır?"
            title="Kısa özetten yayına giden yolu görünür parçalara ayırır"
            description="Süreç tek bir “üret” düğmesinden ibaret değildir. Önce yön kurulur, sonra plan netleşir, ardından çıktı odaklı üretim yapılır."
          />

          <div className="grid gap-4 md:grid-cols-2">
            {behindTheScenes.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary/80">
                      <Icon className="size-4" />
                      {item.eyebrow}
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground">{item.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-8 text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <SectionHeading
              badge="Kimler için?"
              title="Özellikle uzmanlığını kitaba dönüştürmek isteyenler için"
              description="Bu akış, yalnızca yazı yazmak isteyenler için değil; bilgisini ürünleştirmek, sistemleştirmek ve somut çıktıya çevirmek isteyenler için daha uygundur."
            />

            <div className="space-y-3">
              {audience.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card px-4 py-4"
                >
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <p className="text-sm leading-7 text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading
              badge="Sürecin sonunda"
              title="Elinde ne olur?"
              description="Yalnızca fikir değil; ilerlemeyi mümkün kılan görünür ara çıktılar ve teslime yakın dosyalar oluşur."
            />

            <div className="grid gap-4">
              {deliverables.map((item) => {
                const Icon = item.icon;
                return (
                  <Card key={item.label}>
                    <CardContent className="flex items-start gap-4 p-5">
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase tracking-[0.16em] text-primary/80">
                          {item.label}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-foreground">{item.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-16 md:py-20">
        <div className="shell">
          <SectionHeading
            badge="Sık sorulan sorular"
            title="Karar vermeden önce en çok merak edilenler"
            description="How-it-works sayfası ikna etmeye çalışırken belirsizlik bırakmamalı. Bu kısa cevaplar da o boşluğu kapatır."
          />

          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <Card key={item.question}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground">{item.question}</h3>
                  <p className="mt-3 text-sm leading-8 text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="shell">
          <div className="rounded-[32px] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_7%,var(--background)),var(--background))] p-8 md:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Başlamaya hazır
              </div>
              <h2 className="mt-6 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Boş ekrana bakarak değil, <span className="text-primary">yönlendirilmiş bir sistemle başla.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                Konunu netleştir, bölüm planını gör, önizlemeyi incele ve kitabını çıktıya dönüştür.
                Süreci tek tek kurmak yerine görünür adımlarla ilerle.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/start/topic"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                >
                  Ücretsiz önizlemeyi başlat
                  <ArrowRight className="size-4" />
                </Link>
                <span className="text-sm text-muted-foreground">Kısa girişle başla · Planı gör · Sonra karar ver</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </MarketingPage>
  );
}
