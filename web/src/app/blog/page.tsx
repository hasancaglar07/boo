import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, BriefcaseBusiness, FileType2, KeyRound, Palette, SearchCheck } from "lucide-react";

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
    description: "Yapay zeka ile üretilen içerikte kontrol, sahiplik ve kullanıcı rolü nasıl konumlanır?",
    icon: <BriefcaseBusiness className="size-4" />,
  },
  {
    title: "Başlangıç",
    description: "İlk kitaba başlarken konu, bölüm sayısı ve kapsam nasıl seçilir?",
    icon: <BookOpenText className="size-4" />,
  },
  {
    title: "Yayın",
    description: "EPUB, PDF ve platform uyumu gibi teslim sorularına kısa cevaplar.",
    icon: <FileType2 className="size-4" />,
  },
  {
    title: "Araştırma",
    description: "Konu seçimi, anahtar kelime mantığı ve talep doğrulama için basit karar yazıları.",
    icon: <SearchCheck className="size-4" />,
  },
  {
    title: "Komut Yazımı",
    description: "İngilizce konu özeti, ton, hedef okur ve bölüm planı netliği için pratik yönlendirmeler.",
    icon: <KeyRound className="size-4" />,
  },
  {
    title: "Kapak",
    description: "Kapağın sadece güzel değil, satışa hizmet eden bir yüz olması için dikkat edilmesi gerekenler.",
    icon: <Palette className="size-4" />,
  },
] as const;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogPage() {
  const [featured, ...restPosts] = blogPosts;

  return (
    <MarketingPage>
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <h1 className="sr-only">Book Generator blog yazıları</h1>
          <SectionHeading
            badge="Blog"
            title="İtiraz kıran, kararı hızlandıran yazılar."
            description="Bu sayfa haber akışı değil; ilk kez kitap çıkaran birinin aklındaki kritik soruları hızla temizleyen kısa yazılar koleksiyonu."
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
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Ama asıl netlik çoğu zaman okumaktan değil, kendi konu fikrini sisteme girip önizlemeyi görmekten gelir.
          </p>
        </div>
      </section>

      <section className="border-b border-border/80">
        <Features4
          badge="Konular"
          title="Blogda hangi sorulara cevap var?"
          description="Haklardan ilk planlamaya, format seçiminden kapak kararına kadar farklı karar eşiklerini hızlandıran kategoriler."
          items={blogFeatureItems}
        />
      </section>

      <section className="py-18">
        <div className="shell">
          <SectionHeading
            badge="Yazilar"
            title="Tüm yazılar"
            description="Önce ana itirazları, sonra daha detaylı karar noktalarını ele alan sade içerikler."
          />

          {/* Featured post */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Link href={`/blog/${featured.slug}`} className="group lg:col-span-2">
              <Card className="h-full border-primary/20 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_55%)] transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col space-y-5">
                  <div className="flex items-center gap-2">
                    <Badge>{featured.category}</Badge>
                    <span className="text-xs text-muted-foreground/70">Öne Çıkan</span>
                  </div>
                  <h2 className="max-w-2xl text-balance font-serif text-4xl font-semibold tracking-tight text-foreground">
                    {featured.title}
                  </h2>
                  <p className="max-w-2xl flex-1 text-base leading-8 text-muted-foreground">{featured.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <time dateTime={featured.datePublished}>{formatDate(featured.datePublished)}</time>
                      <span className="size-1 rounded-full bg-border" />
                      <span>{featured.readTime} okuma</span>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Oku <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <div className="grid gap-4">
              {restPosts.slice(0, 2).map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                  <Card className="h-full transition hover:bg-accent hover:shadow-sm">
                    <CardContent className="flex h-full flex-col space-y-3">
                      <Badge>{post.category}</Badge>
                      <h2 className="flex-1 text-xl font-semibold tracking-tight text-foreground">{post.title}</h2>
                      <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{post.summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
                          <span className="size-1 rounded-full bg-border" />
                          <span>{post.readTime}</span>
                        </div>
                        <ArrowRight className="size-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Remaining posts */}
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {restPosts.slice(2).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <Card className="h-full transition hover:bg-accent hover:shadow-sm">
                  <CardContent className="flex h-full flex-col space-y-3">
                    <Badge>{post.category}</Badge>
                    <h2 className="flex-1 text-xl font-semibold tracking-tight text-foreground">{post.title}</h2>
                    <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{post.summary}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
                        <span className="size-1 rounded-full bg-border" />
                        <span>{post.readTime}</span>
                      </div>
                      <ArrowRight className="size-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <MarketingCtaSection
        title="Okuduktan sonra sıradaki en iyi adım kendi önizlemeni görmek."
        description="Blog kararını hızlandırır ama asıl netlik ancak kendi kitap fikrini sisteme girdiğinde gelir. Önce önizlemeyi gör, sonra kitabı açmaya karar ver."
        items={[
          "Konu ve hedef okur girişi",
          "Taslak ve bölüm planı oluşturma",
          "Bölüm üretimi ve düzenleme",
          "Önce önizleme, sonra tam kitap",
        ]}
      />
    </MarketingPage>
  );
}
