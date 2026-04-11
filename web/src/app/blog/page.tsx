import Link from "next/link";
import { ArrowRight, BookOpenText, BriefcaseBusiness, FileType2, KeyRound, Palette, SearchCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Features4 } from "@/components/ui/features-4";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buildItemListSchema, buildBreadcrumbSchema } from "@/lib/schema";
import { blogPosts } from "@/lib/marketing-data";
import { buildPageMetadata, absoluteUrl } from "@/lib/seo";

export async function generateMetadata() {
  const t = await getTranslations("BlogPage.metadata");
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/blog",
    keywords: ["ai book writing blog", "kdp guide", "epub pdf publishing"],
  });
}

const topicIcons = [
  <BriefcaseBusiness key="0" className="size-4" />,
  <BookOpenText key="1" className="size-4" />,
  <FileType2 key="2" className="size-4" />,
  <SearchCheck key="3" className="size-4" />,
  <KeyRound key="4" className="size-4" />,
  <Palette key="5" className="size-4" />,
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BlogPage() {
  const t = await getTranslations("BlogPage");

  const blogFeatureItems = [0, 1, 2, 3, 4, 5].map((i) => ({
    title: t(`topics.items.${i}.title`),
    description: t(`topics.items.${i}.description`),
    icon: topicIcons[i],
  }));

  const [featured, ...restPosts] = blogPosts;

  const blogListSchema = buildItemListSchema({
    name: "Book Generator Blog Articles",
    description: "Collection of AI book writing guides, KDP preparation, and publishing tutorials",
    numberOfItems: blogPosts.length,
    itemListElement: blogPosts.map((post, index) => ({
      position: index + 1,
      name: post.title,
      description: post.summary,
      url: absoluteUrl(`/blog/${post.slug}`),
    })),
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", item: absoluteUrl("/") },
    { name: "Blog", item: absoluteUrl("/blog") },
  ]);

  return (
    <MarketingPage>
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <h1 className="sr-only">Book Generator blog articles</h1>
          <SectionHeading
            badge={t("hero.badge")}
            title={t("hero.title")}
            description={t("hero.description")}
          />
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            {t("introText")}{" "}
            <Link href="/how-it-works" className="text-foreground underline-offset-4 hover:underline">how it works</Link>{", "}
            <Link href="/faq" className="text-foreground underline-offset-4 hover:underline">FAQ</Link>{" "}
            and{" "}
            <Link href="/pricing" className="text-foreground underline-offset-4 hover:underline">pricing</Link>{" "}
            pages.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            {t("introText2")}
          </p>
        </div>
      </section>

      <section className="border-b border-border/80">
        <Features4
          badge={t("topics.badge")}
          title={t("topics.title")}
          description={t("topics.description")}
          items={blogFeatureItems}
        />
      </section>

      <section className="py-18">
        <div className="shell">
          <SectionHeading
            badge={t("articles.badge")}
            title={t("articles.title")}
            description={t("articles.description")}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <Link href={`/blog/${featured.slug}`} className="group lg:col-span-2">
              <Card className="h-full border-primary/20 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_55%)] transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col space-y-5">
                  <div className="flex items-center gap-2">
                    <Badge>{featured.category}</Badge>
                    <span className="text-xs text-muted-foreground/70">{t("articles.featuredLabel")}</span>
                  </div>
                  <h2 className="max-w-2xl text-balance font-serif text-4xl font-semibold tracking-tight text-foreground">
                    {featured.title}
                  </h2>
                  <p className="max-w-2xl flex-1 text-base leading-8 text-muted-foreground">{featured.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <time dateTime={featured.datePublished}>{formatDate(featured.datePublished)}</time>
                      <span className="size-1 rounded-full bg-border" />
                      <span>{featured.readTime} {t("articles.readLabel")}</span>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Read <ArrowRight className="size-3.5" />
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
        title={t("cta.title")}
        description={t("cta.description")}
        items={[t("cta.items.0"), t("cta.items.1"), t("cta.items.2"), t("cta.items.3")]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </MarketingPage>
  );
}
