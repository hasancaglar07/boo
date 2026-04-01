import type { Metadata } from "next";

import { MarketingPage } from "@/components/site/marketing-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Generator Kullanım Şartları | Hizmet Koşulları",
  description:
    "Book Generator kullanım şartlarını okuyun. Hizmet kapsamı, kullanıcı sorumluluğu, plan limitleri ve yayın süreçlerinde geçerli temel koşulları inceleyin.",
  path: "/terms",
  keywords: ["kullanım şartları", "book generator koşullar", "hizmet sözleşmesi"],
});

export default function TermsPage() {
  return (
    <MarketingPage>
      <section className="shell py-20">
        <Badge>Şartlar</Badge>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">Kullanım şartları</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          Ürün sana kitap üretimini hızlandıran araçlar sunar; yayın kararı ve son kalite sorumluluğu ise kullanıcıda kalır.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ["Hizmet kapsamı", "Araç, outline, bölüm üretimi, araştırma ve çıktı akışları gibi üretim yardımcıları sağlar."],
            ["Kullanıcı sorumluluğu", "İçerik doğruluğu, hak uygunluğu, yayın kararı ve platform uyumu kullanıcı tarafından kontrol edilmelidir."],
            ["Plan ve limitler", "Kullanım hakları plan bazında tanımlanır, ay bazında yenilenir ve tek hesap için geçerlidir."],
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
