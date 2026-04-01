import type { Metadata } from "next";

import { MarketingPage } from "@/components/site/marketing-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Generator Gizlilik Politikası | Veri Kullanımı",
  description:
    "Book Generator gizlilik politikasını inceleyin. Hesap verileri, içerik verileri, API anahtarları ve üçüncü taraf hizmetlerle veri işleme prensiplerini öğrenin.",
  path: "/privacy",
  keywords: ["gizlilik politikası", "book generator veri kullanımı", "ai içerik güvenliği"],
});

export default function PrivacyPage() {
  return (
    <MarketingPage>
      <section className="shell py-20">
        <Badge>Gizlilik</Badge>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">Gizlilik politikası</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          Bu ürün, kitap üretim sürecinde gereken hesap, ayar ve çıktı verilerini olabildiğince sınırlı biçimde işler.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {[
            ["Hesap verileri", "Ad, e-posta, plan ve kullanım akışı gibi temel bilgiler hesap deneyimi için tutulabilir."],
            ["İçerik verileri", "Kitap brief'i, bölüm içerikleri, metadata ve export dosyaları kitap üretim sürecinin parçasıdır."],
            ["API anahtarları", "Anahtarlar yalnızca kullanıcı tarafından kaydedildiğinde ilgili iş akışlarında kullanılır."],
            ["Üçüncü taraf sağlayıcılar", "AI veya çıktı sağlayıcıları kullanıldığında, ilgili sağlayıcının kendi şartları ayrıca geçerlidir."],
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
