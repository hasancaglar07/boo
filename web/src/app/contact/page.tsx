import type { Metadata } from "next";

import { ContactPageHero } from "@/components/site/page-heroes";
import { ContactForm } from "@/components/site/contact-form";
import { MarketingPage } from "@/components/site/marketing-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supportChannels } from "@/lib/marketing-data";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Kitap Oluşturucu İletişim | Destek ve Faturalama",
  description:
    "Kitap Oluşturucu destek, teknik yardım, hesap erişimi ve faturalama talepleri için iletişim kanallarını tek sayfada bulun ve hızlı yanıt alın.",
  path: "/contact",
  keywords: ["book generator iletişim", "kitap yazma desteği", "faturalama desteği"],
});

export default function ContactPage() {
  return (
    <MarketingPage>
      <ContactPageHero />

      {/* Destek kanalları şeridi */}
      <section className="border-b border-border/80 bg-accent/20 py-8">
        <div className="shell grid gap-4 md:grid-cols-3">
          {supportChannels.map((channel) => (
            <Card key={channel.title}>
              <CardContent className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{channel.title}</h3>
                <p className="text-xs leading-6 text-muted-foreground">{channel.text}</p>
                <p className="text-sm font-medium text-primary">{channel.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Form + başlık */}
      <section className="shell py-12">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[
            { title: "Genel yanıt süresi", text: "Çoğu mesajı aynı iş günü içinde yanıtlamayı hedefliyoruz." },
            { title: "En hızlı çözüm için", text: "Kitap slug’ı, preview linki veya ekran görüntüsü paylaş." },
            { title: "Konu seçimi önemli", text: "Faturalama, erişim ve teknik destek için doğru konu başlığı seçimi süreci hızlandırır." },
          ].map(({ title, text }) => (
            <Card key={title}>
              <CardContent className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-xs leading-6 text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mb-8">
          <Badge>İletişim</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            Takıldığın yeri yaz. Hızlıca çözelim.
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Konu başlığını net yaz, doğru ekip daha hızlı yanıt versin.
          </p>
        </div>
        <ContactForm />
      </section>
    </MarketingPage>
  );
}
