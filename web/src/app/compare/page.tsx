import type { Metadata } from "next";
import { Check, X, Minus } from "lucide-react";

import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Karşılaştırma | Book Generator vs Alternatifler",
  description:
    "Book Generator'ı manuel yazım, genel AI asistanları ve rakip araçlarla karşılaştır. Neden kitap üretimi için özel bir araç gerekir?",
  path: "/compare",
  keywords: ["book generator karşılaştırma", "ai kitap yazma alternatifleri", "chatgpt kitap", "jasper alternatifleri"],
});

type Support = "yes" | "no" | "partial";

interface CompareRow {
  feature: string;
  bookGenerator: Support;
  manualAI: Support;
  generalTools: Support;
  note?: string;
}

const rows: CompareRow[] = [
  { feature: "Kitap odaklı konu giriş sistemi", bookGenerator: "yes", manualAI: "no", generalTools: "no", note: "Diğer araçlar genel komut kabul eder; kitap yapısı bilmez." },
  { feature: "Otomatik taslak üretimi", bookGenerator: "yes", manualAI: "partial", generalTools: "partial" },
  { feature: "Bölüm bölüm tutarlı üretim", bookGenerator: "yes", manualAI: "no", generalTools: "no", note: "Uzun içeriklerde bağlam kopukluğu yaşanır." },
  { feature: "EPUB çıktısı", bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { feature: "KDP uyumlu PDF", bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { feature: "Kapak görseli üretimi", bookGenerator: "yes", manualAI: "no", generalTools: "partial" },
  { feature: "Kaynakça / referans desteği", bookGenerator: "yes", manualAI: "partial", generalTools: "partial" },
  { feature: "Çoklu AI provider (maliyet opt.)", bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { feature: "Yayın geçmişi ve revizyon", bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { feature: "Türkçe kitap üretimi", bookGenerator: "yes", manualAI: "partial", generalTools: "partial", note: "Genel AI araçları Türkçe üretebilir ama yapı bozulabilir." },
  { feature: "KDP niş araştırma", bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { feature: "Kurulum gerektirmez (web tabanlı)", bookGenerator: "yes", manualAI: "partial", generalTools: "yes" },
  { feature: "Ücret modeli — kitap başı değer", bookGenerator: "yes", manualAI: "no", generalTools: "no", note: "Token bazlı araçlarda uzun kitap = yüksek maliyet." },
];

function SupportIcon({ value }: { value: Support }) {
  if (value === "yes") return <Check className="mx-auto size-5 text-green-600" />;
  if (value === "no") return <X className="mx-auto size-5 text-red-500" />;
  return <Minus className="mx-auto size-5 text-yellow-500" />;
}

const alternatives = [
  {
    name: "ChatGPT / Claude (manuel)",
    pros: ["Güçlü dil modeli", "Esneklik"],
    cons: [
      "Kitap yapısı yok",
      "Her bölüm için yeni komut yazman gerek",
      "Bağlam sürüklenmesi ile tutarsızlık",
      "EPUB/PDF çıktısı yok",
      "Uzun kitaplarda token maliyeti yüksek",
    ],
  },
  {
    name: "Jasper / Copy.ai",
    pros: ["İyi kısa içerik üretimi", "Şablon desteği"],
    cons: [
      "Kitap uzunluğu içerik için tasarlanmamış",
      "KDP çıktısı yok",
      "Türkçe kalitesi değişken",
      "Pahalı abonelik",
    ],
  },
  {
    name: "Scrivener + AI eklentiler",
    pros: ["Güçlü yazar aracı", "Yapılandırılmış yazım"],
    cons: [
      "Öğrenme eğrisi yüksek",
      "AI entegrasyonu karmaşık",
      "Ücretli + eklenti maliyetleri",
      "KDP çıktısı manuel ayar gerektirir",
    ],
  },
  {
    name: "Manuel yazım",
    pros: ["Tam kontrol", "AI bağımlılığı yok"],
    cons: [
      "Aylar / yıllar sürebilir",
      "Başlamak zor",
      "Düzenleme maliyeti yüksek",
      "Outline oluşturmak başlı başına iş",
    ],
  },
];

export default function ComparePage() {
  return (
    <MarketingPage>
      {/* Hero */}
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Karşılaştırma</Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Book Generator vs{" "}
              <span className="text-primary">alternatifler</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              Genel AI araçları veya manuel yazımla neden aynı sonucu alamazsın? İşte dürüst bir karşılaştırma.
            </p>
            <div className="mx-auto mt-8 max-w-3xl rounded-[24px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))] px-6 py-5 text-left shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">Kısa cevap</p>
              <p className="mt-2 text-sm leading-7 text-foreground">
                Book Generator, ChatGPT veya genel AI araçlarının yerine geçen genel bir chatbot değil; tek bir fikirden outline, chapter, cover ve export üreten özel bir AI publishing studio'dur. Farkı model kalitesinden çok, kitap üretimine özel workflow, editör ve publish-ready çıktı sunmasıdır.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature table */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading
            badge="Özellik Tablosu"
            title="Ne yapabilir, ne yapamaz?"
            description="Kitap üretimine özel özellikler — genel AI araçlarında yoklar."
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-4 pl-2 text-left font-medium text-muted-foreground">Özellik</th>
                  <th className="pb-4 text-center font-semibold text-foreground">Book Generator</th>
                  <th className="pb-4 text-center font-medium text-muted-foreground">Manuel AI</th>
                  <th className="pb-4 pr-2 text-center font-medium text-muted-foreground">Genel Araçlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.feature} className="group">
                    <td className="py-3.5 pl-2">
                      <div>
                        <span className="font-medium text-foreground">{row.feature}</span>
                        {row.note && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{row.note}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <SupportIcon value={row.bookGenerator} />
                    </td>
                    <td className="py-3.5 text-center">
                      <SupportIcon value={row.manualAI} />
                    </td>
                    <td className="py-3.5 pr-2 text-center">
                      <SupportIcon value={row.generalTools} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-green-600" /> Tam destek</span>
            <span className="flex items-center gap-1.5"><Minus className="size-3.5 text-yellow-500" /> Kısmi / manuel</span>
            <span className="flex items-center gap-1.5"><X className="size-3.5 text-red-500" /> Yok</span>
          </div>
        </div>
      </section>

      {/* Alternative cards */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading
            badge="Alternatifleri Anlamak"
            title="Neden başka araçlar yetmez?"
          />
          <div className="grid gap-6 sm:grid-cols-2">
            {alternatives.map((alt) => (
              <div key={alt.name} className="rounded-2xl border border-border/80 bg-background p-6">
                <h3 className="font-serif text-lg font-semibold text-foreground">{alt.name}</h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Artıları</p>
                    <ul className="space-y-1.5">
                      {alt.pros.map((p) => (
                        <li key={p} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-green-500" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Eksileri</p>
                    <ul className="space-y-1.5">
                      {alt.cons.map((c) => (
                        <li key={c} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                          <X className="mt-0.5 size-3.5 shrink-0 text-red-400" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingCtaSection
        title="Kitap üretimine özel bir araç dene."
        description="Book Generator'ı 14 gün ücretsiz dene. Kurulum yok, kredi kartı yok. Genel araçlarla kaybettiğin zamanı geri al."
        items={[
          "Brief → Outline → Kitap zinciri",
          "KDP uyumlu EPUB / PDF",
          "Türkçe kitap desteği",
          "14 gün ücretsiz",
        ]}
      />
    </MarketingPage>
  );
}
