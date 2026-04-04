import type { Metadata } from "next";
import { Check, X, Minus } from "lucide-react";

import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { buildPageMetadata } from "@/lib/seo";
import { KDP_GUARANTEE_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

export const metadata: Metadata = buildPageMetadata({
  title: "Karşılaştırma | Kitap Oluşturucu ve Alternatifler",
  description:
    "Kitap Oluşturucu'yu manuel yazım, genel yapay zeka asistanları ve rakip araçlarla karşılaştır. Neden kitap üretimi için özel bir araç gerekir?",
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
  { feature: "Kullanıcı ayrıca API ödemez", bookGenerator: "yes", manualAI: "no", generalTools: "partial", note: "Book Generator'da model maliyeti planın içindedir; bazı genel araçlarda ayrı maliyet çıkar." },
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
              ChatGPT ile başlayabilirsin.{" "}
              <span className="text-primary">Bitirmek için yetmeyebilir.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              Sorun model kalitesi değil; her bölüm için yeniden komut yazmak, tonu korumak, kapağı ayrı çözmek ve çıktıyı ayrı tamamlamak. Kitap Oluşturucu bu dağınık zinciri tek akışta toplar.
            </p>
            <div className="mx-auto mt-8 max-w-3xl rounded-[24px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))] px-6 py-5 text-left shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">Kısa cevap</p>
              <p className="mt-2 text-sm leading-7 text-foreground">
                Kitap Oluşturucu, ChatGPT veya genel yapay zeka araçlarının yerine geçen genel bir sohbet aracı değil; tek bir fikirden bölüm planı, bölüm, kapak ve çıktı üreten özel bir kitap üretim sistemidir. Farkı model kalitesinden çok, kitap üretimine özel akış, editör ve yayına hazır çıktı sunmasıdır.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-14">
        <div className="shell">
          <div className="mx-auto max-w-4xl rounded-[24px] border border-border/80 bg-card/80 px-6 py-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Manuel yolun gizli maliyeti</p>
            <p className="mt-3 text-base leading-8 text-foreground">
              10–30 saatlik iş akışı tek araçta yönetilemiyor: araştırma bir yerde, taslak başka bir yerde, kapak ayrı, çıktı ayrı. Bu dağınıklık kitabın yarım kalmasının en yaygın nedeni. Kitap Oluşturucu bu zinciri tek bir akışta toplar.
            </p>
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
                  <th className="pb-4 text-center font-semibold text-foreground">Kitap Oluşturucu</th>
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
        title="Genel araçlarla vakit kaybetmek yerine kendi konunla farkı gör."
        description={`Önce önizlemeyi gör, sonra bu kitabı açmaya değer olup olmadığına karar ver. Asıl fark sohbet aracı değil, yayına hazır akıştır. ${NO_API_COST_CLAIM} ve kitaplar ${KDP_GUARANTEE_CLAIM} ile hazırlanır.`}
        items={[
          "Konu özeti → bölüm planı → kitap zinciri",
          "KDP uyumlu EPUB / PDF",
          "Türkçe kitap desteği",
          "Önce önizleme, sonra tam kitap",
        ]}
      />
    </MarketingPage>
  );
}
