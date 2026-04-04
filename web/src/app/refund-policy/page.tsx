import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPage } from "@/components/site/marketing-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Generator İade Politikası | Plan ve Ödeme Süreci",
  description:
    "Book Generator iade politikasını inceleyin. Plan değişikliği, destek talebi ve kullanım durumuna göre iade değerlendirme sürecini adım adım öğrenin.",
  path: "/refund-policy",
  keywords: ["iade politikası", "book generator ödeme", "abonelik değişikliği"],
});

export default function RefundPolicyPage() {
  return (
    <MarketingPage>
      <section className="shell py-20">
        <Badge>İade</Badge>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">İade politikası</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          Kitap Oluşturucu&apos;yu risk almadan denemen için iade akışını açık tutuyoruz. Önce önizlemeyi görür, sonra tam kitabı açarsın; memnun kalmazsan ilk 30 gün içinde iade isteyebilirsin.
        </p>
        <div className="mt-8 rounded-[24px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_7%,var(--card)),var(--card))] px-6 py-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">Kısa cevap</p>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground">
            Tek Kitap dahil tüm planlarda, satın alma tarihinden itibaren ilk 30 gün içinde memnun kalmazsan destek üzerinden iade talebi açabilirsin. Bu sayfa, pricing ve checkout dilindeki güven mesajını netleştirmek içindir; muğlak bırakmak için değil.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ["30 gün pencere", "Satın alma tarihinden itibaren ilk 30 gün içinde iade talebi oluşturabilirsin. $4 Tek Kitap dahil tüm planlar bu pencereye dahildir."],
            ["Destek üzerinden talep", "Ödeme, yanlış plan seçimi veya memnuniyetsizlik durumunda destek ekibine kısa ve net bir iade talebi ile yazman yeterlidir."],
            ["Hızlı ve açık süreç", "İade sürecini uzatmak yerine netleştiriyoruz. Önizleme mantığı zaten riski düşürür; iade politikası da bu yaklaşımı tamamlar."],
          ].map(([title, text]) => (
            <Card key={title}>
              <CardContent>
                <h2 className="text-lg font-medium text-foreground">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-sm leading-7 text-muted-foreground">
          Önce ürün akışını görmek istersen{" "}
          <Link href="/start/topic" className="text-foreground underline-offset-4 hover:underline">
            ücretsiz önizlemeyi başlat
          </Link>
          , plan karşılaştırması görmek istersen{" "}
          <Link href="/pricing" className="text-foreground underline-offset-4 hover:underline">
            fiyatlar
          </Link>{" "}
          sayfasına dön.
        </div>
      </section>
    </MarketingPage>
  );
}
