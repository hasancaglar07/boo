"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/site/section-heading";
import { KDP_GUARANTEE_CLAIM, KDP_LIVE_BOOKS_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

const proofCards = [
  {
    title: "Gerçek KDP yayın kanıtı",
    text: `Ürün yalnızca demo değil. ${KDP_LIVE_BOOKS_CLAIM} kitap Amazon KDP'de yayında ve yayınlama sisteminin gerçekten çalıştığını kanıtlıyor.`,
  },
  {
    title: "Vaadi değil, çıktıyı gör",
    text: "30'dan fazla çok dilli kitap vitrininde ürünün gerçekten ne ürettiğini gör: gerçek kapaklar, gerçek bölümler, gerçek EPUB dosyaları.",
  },
  {
    title: "Garanti net ve şeffaf",
    text: `Kullanıcı ödeme öncesi kapağı, bölüm planını ve önizlemeyi görüp karar veriyor. Üstelik kitaplar ${KDP_GUARANTEE_CLAIM} ile sunuluyor.`,
  },
  {
    title: "Ek API veya abonelik faturası yok",
    text: `Sihirbaz, önizleme, yükseltme ve dışa aktarma zinciri aynı ürün içinde. ${NO_API_COST_CLAIM.toLowerCase()} ve dağınık araç ihtiyacı yok.`,
  },
] as const;

export function HomeTestimonialsSection() {
  return (
    <section className="border-b border-border/80 bg-background py-20">
      <div className="shell">
        <SectionHeading
          badge="Kullanıcı Yorumları ve Kanıtlar"
          title="AI Kitap Oluşturucu Gerçekten Çalışıyor mu? İşte Kanıtlar"
          description="Yayınlanmış kitaplar, gerçek kapaklar ve KDP kanıtları. Kullanıcı deneyimi ve güvenilirlik hakkında merak edilenler."
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
