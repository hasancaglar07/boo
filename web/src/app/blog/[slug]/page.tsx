import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketingPage } from "@/components/site/marketing-page";
import { Badge } from "@/components/ui/badge";
import { blogPosts } from "@/lib/marketing-data";
import { absoluteUrl, buildPageMetadata, siteConfig } from "@/lib/seo";

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
      section: post.category,
      tags: [post.category, "AI kitap yazma", "Book Generator"],
    },
  };
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({
  params,
}: BlogPostPageProps) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) notFound();

  const postUrl = absoluteUrl(`/blog/${post.slug}`);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    inLanguage: "tr-TR",
    mainEntityOfPage: postUrl,
    url: postUrl,
    author: {
      "@type": "Organization",
      name: siteConfig.name,
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
      <article className="shell py-20">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-foreground">
                Anasayfa
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/blog" className="hover:text-foreground">
                Blog
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground">{post.title}</li>
          </ol>
        </nav>
        <Badge>{post.category}</Badge>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-foreground">{post.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{post.summary}</p>
        <div className="mt-3 text-sm text-muted-foreground">{post.readTime}</div>
        <div className="mt-12 space-y-10 rounded-[28px] border border-border bg-card/90 p-8">
          <p className="text-base leading-8 text-foreground">{post.intro}</p>
          {post.sections.map(([title, text]) => (
            <section key={title}>
              <h2 className="text-2xl font-medium text-foreground">{title}</h2>
              <p className="mt-3 max-w-3xl text-base leading-8 text-muted-foreground">{text}</p>
            </section>
          ))}
        </div>

        {/* ── Post-article CTA ───────────────────────────────────────────── */}
        <div className="mt-12 rounded-[28px] border border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_6%,var(--card)),var(--card))] px-8 py-8">
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
