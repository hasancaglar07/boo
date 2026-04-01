import type { Metadata } from "next";

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
          İade akışı, satın alınan planın kullanım durumu ve talebin zamanlamasına göre değerlendirilir.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ["Plan değişikliği", "Paket yükseltme, düşürme veya iptal talepleri önce faturalama alanından yönetilmelidir."],
            ["Destek talebi", "Ödeme veya yanlış plan sorunlarında destek ekibine kısa, net bir talep ile başvurulmalıdır."],
            ["Değerlendirme", "İade kararı kullanım durumu, hesap geçmişi ve talebin niteliğine göre verilir."],
          ].map(([title, text]) => (
            <Card key={title}>
              <CardContent>
                <h2 className="text-lg font-medium text-foreground">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </MarketingPage>
  );
}
