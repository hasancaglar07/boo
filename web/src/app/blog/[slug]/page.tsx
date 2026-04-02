import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ChevronRight, Clock } from "lucide-react";

import { BlogReadingProgress } from "@/components/site/blog-reading-progress";
import { BlogToc } from "@/components/site/blog-toc";
import { MarketingPage } from "@/components/site/marketing-page";
import { Badge } from "@/components/ui/badge";
import { blogPosts } from "@/lib/marketing-data";
import { absoluteUrl, buildPageMetadata, buildOgImageUrl, siteConfig } from "@/lib/seo";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    return buildPageMetadata({
      title: "Yazı Bulunamadı",
      description: "Aradığınız blog yazısı bulunamadı.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  const base = buildPageMetadata({
    title: post.title,
    description: post.summary,
    path: `/blog/${post.slug}`,
    keywords: [
      post.category.toLowerCase(),
      "book generator blog",
      "ai kitap yazma",
      "kitap üretimi",
    ],
    type: "article",
  });

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      authors: [siteConfig.name],
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      section: post.category,
      tags: [post.category, "AI kitap yazma", "Book Generator"],
      images: [{ url: buildOgImageUrl(post.title, post.summary), width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      ...base.twitter,
      images: [buildOgImageUrl(post.title, post.summary)],
    },
  };
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

function toSectionId(title: string) {
  return title
    .toLowerCase()
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function firstSentence(text: string) {
  const sentence = text.split(". ")[0]?.trim();
  if (!sentence) return text;
  return sentence.endsWith(".") ? sentence : `${sentence}.`;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) notFound();

  const postUrl = absoluteUrl(`/blog/${post.slug}`);

  const tocItems = post.sections.map(([title]) => ({
    id: toSectionId(title),
    title,
  }));
  const quickAnswer = firstSentence(post.intro);
  const takeawayItems = post.sections.slice(0, 3).map(([title]) => title);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    inLanguage: "tr-TR",
    mainEntityOfPage: postUrl,
    url: postUrl,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    author: {
      "@type": "Person",
      name: "Book Generator Ekibi",
      url: absoluteUrl("/about"),
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png"),
      },
    },
    articleSection: post.category,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Anasayfa",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: absoluteUrl("/blog"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  return (
    <MarketingPage>
      <BlogReadingProgress />
      <article className="shell py-16 md:py-20">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Anasayfa
          </Link>
          <ChevronRight className="size-3.5 shrink-0" />
          <Link href="/blog" className="transition-colors hover:text-foreground">
            Blog
          </Link>
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="line-clamp-1 text-foreground">{post.title}</span>
        </nav>

        {/* Two-column layout: content + TOC */}
        <div className="flex items-start gap-14 xl:gap-16">
          {/* ── Main article content ───────────────────────────────── */}
          <div className="min-w-0 flex-1">
            {/* Article header */}
            <header className="mb-10">
              <Badge className="mb-4">{post.category}</Badge>
              <h1 className="max-w-[700px] font-serif text-4xl font-semibold leading-[1.15] tracking-tight text-foreground md:text-5xl">
                {post.title}
              </h1>
              <p className="mt-5 max-w-[600px] text-lg leading-relaxed text-muted-foreground">
                {post.summary}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 shrink-0" />
                  <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
                </span>
                <span className="size-1 rounded-full bg-border" />
                <span>Son güncelleme: {formatDate(post.dateModified)}</span>
                <span className="size-1 rounded-full bg-border" />
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 shrink-0" />
                  {post.readTime} okuma
                </span>
              </div>
              <div className="mt-6 rounded-[20px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">Kısa cevap</p>
                <p className="mt-2 text-sm leading-7 text-foreground">{quickAnswer}</p>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-[20px] border border-border/70 bg-card/80 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Öne çıkanlar</p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-foreground">
                    {takeawayItems.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[20px] border border-border/70 bg-card/80 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Yayın notu</p>
                  <p className="mt-2 text-sm leading-7 text-foreground">Book Generator editör ekibi tarafından hazırlanıp gözden geçirildi.</p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">Amaç hukuki veya profesyonel tavsiye vermek değil; publishing kararlarını daha net almanı sağlamaktır.</p>
                </div>
              </div>
            </header>

            {/* Article body */}
            <div className="rounded-[24px] border border-border bg-card/80 px-6 py-8 md:px-10 md:py-10">
              {/* Intro paragraph */}
              <p className="text-[17px] leading-[1.85] text-foreground/90">
                {post.intro}
              </p>

              {/* Sections */}
              {post.sections.map(([title, text]) => {
                const id = toSectionId(title);
                return (
                  <section
                    key={title}
                    id={id}
                    className="mt-10 scroll-mt-20 border-t border-border/50 pt-10"
                  >
                    <h2 className="font-serif text-2xl font-semibold leading-snug text-foreground">
                      {title}
                    </h2>
                    <p className="mt-4 text-[17px] leading-[1.85] text-muted-foreground">
                      {text}
                    </p>
                  </section>
                );
              })}
            </div>

            {/* Back to blog */}
            <div className="mt-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronRight className="size-3.5 rotate-180" />
                Tüm yazılara dön
              </Link>
            </div>

            {/* Post-article CTA */}
            <div className="mt-4 rounded-[24px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))] px-8 py-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Sıradaki adım</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                Kendi kitabını oluşturmaya hazır mısın?
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Hesap gerekmez. Konunu gir, 30 saniyede outline ve kapak önizlemeni gör.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/start/topic"
                  className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Ücretsiz Önizlemeyi Başlat →
                </Link>
                <Link
                  href="/examples"
                  className="inline-flex items-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  Örnek Çıktıları Gör
                </Link>
              </div>
            </div>
          </div>

          {/* ── Sticky TOC sidebar (xl+) ───────────────────────────── */}
          <aside className="hidden w-52 shrink-0 xl:block">
            <BlogToc items={tocItems} />
          </aside>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      </article>
    </MarketingPage>
  );
}
