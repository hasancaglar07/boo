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
  title: "Book Generator Blog | AI Book Writing Guides",
  description:
    "Read practical guides on AI book writing, KDP preparation, EPUB/PDF publishing steps, and content planning on the Book Generator blog.",
  path: "/blog",
  keywords: ["ai book writing blog", "kdp guide", "epub pdf publishing"],
});

const blogFeatureItems = [
  {
    title: "Rights",
    description: "How control, ownership, and user role are positioned in AI-generated content?",
    icon: <BriefcaseBusiness className="size-4" />,
  },
  {
    title: "Getting Started",
    description: "How to choose topic, chapter count, and scope for your first book?",
    icon: <BookOpenText className="size-4" />,
  },
  {
    title: "Publishing",
    description: "Short answers to delivery questions like EPUB, PDF, and platform compatibility.",
    icon: <FileType2 className="size-4" />,
  },
  {
    title: "Research",
    description: "Simple decision articles for topic selection, keyword logic, and demand validation.",
    icon: <SearchCheck className="size-4" />,
  },
  {
    title: "Prompt Writing",
    description: "Practical tips for English topic summary, tone, target reader, and chapter plan clarity.",
    icon: <KeyRound className="size-4" />,
  },
  {
    title: "Cover",
    description: "What to keep in mind so your cover isn't just pretty but serves sales.",
    icon: <Palette className="size-4" />,
  },
] as const;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
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
          <h1 className="sr-only">Book Generator blog articles</h1>
          <SectionHeading
            badge="Blog"
            title="Articles that overcome objections and speed up decisions."
            description="This page is not a news feed; it's a collection of short articles that quickly clear up the critical questions of a first-time book author."
          />
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            To get started, you can first check{" "}
            <Link href="/how-it-works" className="text-foreground underline-offset-4 hover:underline">
              how it works
            </Link>{", "}
            then clarify your decision with the{" "}
            <Link href="/faq" className="text-foreground underline-offset-4 hover:underline">
              FAQ
            </Link>{" "}
            and{" "}
            <Link href="/pricing" className="text-foreground underline-offset-4 hover:underline">
              pricing
            </Link>{" "}
            pages.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            But real clarity usually comes not from reading, but from entering your own topic idea and seeing the preview.
          </p>
        </div>
      </section>

      <section className="border-b border-border/80">
        <Features4
          badge="Topics"
          title="What questions does the blog answer?"
          description="Categories that speed up different decision points — from rights to initial planning, format selection to cover decisions."
          items={blogFeatureItems}
        />
      </section>

      <section className="py-18">
        <div className="shell">
          <SectionHeading
            badge="Articles"
            title="All articles"
            description="Straightforward content that addresses the main objections first, then covers more detailed decision points."
          />

          {/* Featured post */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Link href={`/blog/${featured.slug}`} className="group lg:col-span-2">
              <Card className="h-full border-primary/20 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_55%)] transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col space-y-5">
                  <div className="flex items-center gap-2">
                    <Badge>{featured.category}</Badge>
                    <span className="text-xs text-muted-foreground/70">Featured</span>
                  </div>
                  <h2 className="max-w-2xl text-balance font-serif text-4xl font-semibold tracking-tight text-foreground">
                    {featured.title}
                  </h2>
                  <p className="max-w-2xl flex-1 text-base leading-8 text-muted-foreground">{featured.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <time dateTime={featured.datePublished}>{formatDate(featured.datePublished)}</time>
                      <span className="size-1 rounded-full bg-border" />
                      <span>{featured.readTime} read</span>
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
        title="After reading, the next best step is to see your own preview."
        description="The blog speeds up your decision, but real clarity comes when you enter your own book idea into the system. See the preview first, then decide to unlock the full book."
        items={[
          "Topic and target reader input",
          "Outline and chapter plan creation",
          "Chapter generation and editing",
          "Preview first, then full book",
        ]}
      />
    </MarketingPage>
  );
}
