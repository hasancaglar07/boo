import { ArrowRight, Clock } from "lucide-react";

import { blogPosts } from "@/lib/marketing-data";
import { SectionHeading } from "@/components/site/section-heading";

export function HomeBlogPreviewSection() {
  const featured = blogPosts.slice(0, 3);

  return (
    <section className="border-b border-border/80 py-18">
      <div className="shell">
        <SectionHeading
          badge="Book Writing Guide"
          title="AI Book Writing Guide: Read This Before Publishing Your First Book"
          description="Quick and clear answers to the most frequently asked questions about preparing your first book with an AI book creator."
          actionHref="/blog"
          actionLabel="View all posts"
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {featured.map((post) => (
            <a
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-[28px] border border-border/80 bg-card/80 p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-border/80 bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
                  {post.category}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {post.readTime}
                </div>
              </div>

              <h3 className="mt-4 text-base font-semibold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-7 text-muted-foreground">{post.summary}</p>

              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                Read
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
