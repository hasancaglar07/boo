"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/site/section-heading";
import { KDP_GUARANTEE_CLAIM, KDP_LIVE_BOOKS_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

const proofCards = [
  {
    title: "Gerçek yayın kanıtı",
    text: `Ürün yalnız demo değil. ${KDP_LIVE_BOOKS_CLAIM} publishing pipeline'ın gerçek yayında çalıştığını gösteriyor.`,
  },
  {
    title: "Vaat değil çıktı",
    text: "Examples vitrini, 30 çok dilli showcase kitapla ürünün ne ürettiğini gerçek kapaklar ve yapılarla gösteriyor.",
  },
  {
    title: "Garanti net",
    text: `Kullanıcı ödeme öncesi kapağı, bölüm planını ve preview mantığını görüp karar verebiliyor. Üstelik kitaplar ${KDP_GUARANTEE_CLAIM} ile sunuluyor.`,
  },
  {
    title: "Ek API faturası yok",
    text: `Wizard, preview, upgrade ve export zinciri aynı ürün içinde ilerliyor; ${NO_API_COST_CLAIM.toLowerCase()} ve dağınık araç ihtiyacı azalıyor.`,
  },
] as const;

export function HomeTestimonialsSection() {
  return (
    <section className="border-b border-border/80 bg-background py-20">
      <div className="shell">
        <SectionHeading
          badge="Kanıt"
          title="Launch için kullanabileceğin net proof katmanları."
          description="Bu alan artık kanıtsız yorumlar yerine, repoda ve üründe gerçekten gösterebildiğin proof katmanlarını öne çıkarıyor."
          align="center"
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {proofCards.map((item) => (
            <Card key={item.title} className="rounded-[28px]">
              <CardContent className="space-y-3">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">{item.title}</h3>
                <p className="text-sm leading-8 text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
