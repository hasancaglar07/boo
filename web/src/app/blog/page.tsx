import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, BriefcaseBusiness, FileType2, KeyRound, Palette, SearchCheck } from "lucide-react";

import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Features4 } from "@/components/ui/features-4";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { blogPosts } from "@/lib/marketing-data";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Generator Blog | AI Kitap Yazma Rehberleri",
  description:
    "AI ile kitap yazma, KDP hazırlığı, EPUB/PDF yayın adımları ve içerik planlama hakkında pratik rehberleri Book Generator blog sayfasında okuyun.",
  path: "/blog",
  keywords: ["ai kitap yazma blog", "kdp rehberi", "epub pdf yayın"],
});

const blogFeatureItems = [
  {
    title: "Haklar",
    description: "AI ile uretilen icerikte kontrol, sahiplik ve kullanici rolu nasil konumlanir?",
    icon: <BriefcaseBusiness className="size-4" />,
  },
  {
    title: "Baslangic",
    description: "Ilk kitaba baslarken konu, bolum sayisi ve kapsam nasil secilir?",
    icon: <BookOpenText className="size-4" />,
  },
  {
    title: "Yayin",
    description: "EPUB, PDF ve platform uyumu gibi teslim sorularina kisa cevaplar.",
    icon: <FileType2 className="size-4" />,
  },
  {
    title: "Arastirma",
    description: "Konu secimi, keyword mantigi ve talep dogrulama icin basit karar yazilari.",
    icon: <SearchCheck className="size-4" />,
  },
  {
    title: "Prompting",
    description: "English brief, ton, hedef okur ve outline netligi icin pratik yonlendirmeler.",
    icon: <KeyRound className="size-4" />,
  },
  {
    title: "Kapak",
    description: "Kapagin guzel degil, islevsel olmasi icin dikkat edilmesi gerekenler.",
    icon: <Palette className="size-4" />,
  },
] as const;

export default function BlogPage() {
  const [featured, ...restPosts] = blogPosts;

  return (
    <MarketingPage>
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <h1 className="sr-only">Book Generator blog yazıları</h1>
          <SectionHeading
            badge="Blog"
            title="Itiraz kiran ve karar hizlandiran yazilar."
            description="Bu sayfa haber akisi degil; ilk kez kitap cikaran birinin aklindaki kritik sorulari hizla temizleyen kisa yazilar koleksiyonu."
          />
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Başlangıç için önce{" "}
            <Link href="/how-it-works" className="text-foreground underline-offset-4 hover:underline">
              nasıl çalıştığını
            </Link>{" "}
            inceleyebilir, sonra{" "}
            <Link href="/faq" className="text-foreground underline-offset-4 hover:underline">
              SSS
            </Link>{" "}
            ve{" "}
            <Link href="/pricing" className="text-foreground underline-offset-4 hover:underline">
              fiyatlar
            </Link>{" "}
            sayfalarıyla kararını netleştirebilirsin.
          </p>
        </div>
      </section>

      <section className="border-b border-border/80">
        <Features4
          badge="Konular"
          title="Blogda hangi sorulara cevap var?"
          description="Haklardan ilk planlamaya, format seciminden kapak kararina kadar farkli karar esiklerini hizlandiran kategoriler."
          items={blogFeatureItems}
        />
      </section>

      <section className="py-18">
        <div className="shell">
          <SectionHeading
            badge="Yazilar"
            title="Tum yazilar"
            description="Once ana itirazlari, sonra daha detayli karar noktalarini ele alan sade icerikler."
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <Link href={`/blog/${featured.slug}`} className="lg:col-span-2">
              <Card className="h-full border-primary/20 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_55%)]">
                <CardContent className="space-y-5">
                  <Badge>{featured.category}</Badge>
                  <h2 className="max-w-2xl text-balance font-serif text-4xl font-semibold tracking-tight text-foreground">
                    {featured.title}
                  </h2>
                  <p className="max-w-2xl text-base leading-8 text-muted-foreground">{featured.summary}</p>
                  <div className="text-sm text-muted-foreground">{featured.readTime}</div>
                </CardContent>
              </Card>
            </Link>

            <div className="grid gap-4">
              {restPosts.slice(0, 2).map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`}>
                  <Card className="h-full transition hover:bg-accent">
                    <CardContent className="space-y-4">
                      <Badge>{post.category}</Badge>
                      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{post.title}</h2>
                      <p className="text-sm leading-8 text-muted-foreground">{post.summary}</p>
                      <div className="text-sm text-muted-foreground">{post.readTime}</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {restPosts.slice(2).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="h-full transition hover:bg-accent">
                  <CardContent className="space-y-4">
                    <Badge>{post.category}</Badge>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">{post.title}</h2>
                    <p className="text-sm leading-8 text-muted-foreground">{post.summary}</p>
                    <div className="text-sm text-muted-foreground">{post.readTime}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <MarketingCtaSection
        title="Okuduktan sonra sıradaki en iyi adım ürünü denemek."
        description="Blog kararını hızlandırır ama asıl netlik ancak kendi kitap fikrini sisteme girdiğinde gelir."
        items={[
          "Konu ve hedef okur girişi",
          "Taslak ve outline oluşturma",
          "Bölüm üretimi ve düzenleme",
          "EPUB odaklı teslim akışı",
        ]}
      />
    </MarketingPage>
  );
}
