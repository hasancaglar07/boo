"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Download,
  FileText,
  Globe,
  Layers,
  Sparkles,
} from "lucide-react";

import type { ExampleAsset, ExampleReaderEntry } from "@/lib/examples-shared";
import { trackEvent } from "@/lib/analytics";
import { ExampleCoverArtwork } from "@/components/site/example-cover-artwork";
import { cn } from "@/lib/utils";

function ExportButton({
  asset,
  label,
  slug,
  format,
}: {
  asset?: ExampleAsset;
  label: string;
  slug: string;
  format: "html" | "pdf" | "epub";
}) {
  const icon =
    format === "html" ? Globe : format === "pdf" ? FileText : BookOpen;
  const Icon = icon;

  if (!asset) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-4 opacity-55">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="size-4" />
          {label}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">Not ready yet for this book.</div>
      </div>
    );
  }

  return (
    <a
      href={asset.url}
      target="_blank"
      rel="noreferrer"
      className="group rounded-2xl border border-border/80 bg-background px-4 py-4 transition hover:bg-accent"
      onClick={() => trackEvent("examples_export_clicked", { slug, format, location: "reader_sidebar" })}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
        Open output <Download className="size-3.5 transition group-hover:translate-y-0.5" />
      </div>
    </a>
  );
}

function ReaderCta({
  slug,
  location,
  compact = false,
}: {
  slug: string;
  location: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[#d2a95a]/35 bg-[linear-gradient(180deg,rgba(210,169,90,0.16),rgba(255,255,255,0.78))] p-6",
        compact && "p-4",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-[#1a140d] text-[#d2a95a]">
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Write Your Own Version
          </div>
          <p className="mt-2 text-sm leading-7 text-foreground/82">
            If this structure looks publish-ready to you, start with your own topic and produce the same workflow:
            chapter plan, chapters, cover, and outputs.
          </p>
          <Link
            href="/start/topic"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
            onClick={() => trackEvent("examples_sticky_cta_clicked", { slug, location })}
          >
            Write Your Own Book <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ExampleReader({ item }: { item: ExampleReaderEntry }) {
  const [activeChapter, setActiveChapter] = useState(item.chaptersContent[0]?.anchorId || "");
  const midpoint = Math.max(1, Math.floor(item.chaptersContent.length / 2));

  useEffect(() => {
    trackEvent("examples_reader_viewed", { slug: item.slug, chapters: item.chapters });
  }, [item.chapters, item.slug]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reader-chapter]"));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveChapter(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0.1, 0.3, 0.55],
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [item.chaptersContent]);

  return (
    <>
      <section
        className="relative overflow-hidden border-b border-border/80"
        style={{ background: item.coverGradient }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,13,10,0.88),rgba(24,18,13,0.56)_42%,rgba(0,0,0,0.08))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_top_left,rgba(210,169,90,0.22),transparent_22%)]" />
        <div className="shell relative py-16 text-white md:py-20">
          <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-end">
            <ExampleCoverArtwork
              title={item.title}
              brandingMark={item.brandingMark}
              primaryUrl={item.coverImages.primaryUrl}
              fallbackUrl={item.coverImages.fallbackUrl}
              spineColor={item.spineColor}
              coverGradient={item.coverGradient}
              textAccent={item.textAccent}
              className="mx-auto h-[390px] w-[260px]"
              coverClassName="h-full"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72">
                  {item.category}
                </span>
                <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72">
                  {item.language}
                </span>
                <span className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72">
                  {item.toneArchetype}
                </span>
              </div>

              <h1 className="mt-5 max-w-4xl font-serif text-4xl font-semibold leading-[0.94] tracking-tight md:text-6xl">
                {item.title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/78 md:text-lg">{item.subtitle}</p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Author", value: item.author },
                  { label: "Publisher", value: item.publisher || "Studio" },
                  { label: "Chapters", value: String(item.chapters) },
                  { label: "Formats", value: ["HTML", item.exports.pdf ? "PDF" : "", item.exports.epub ? "EPUB" : ""].filter(Boolean).join(" + ") },
                ].map((meta) => (
                  <div key={`${item.slug}-${meta.label}`} className="rounded-[22px] border border-white/12 bg-white/8 px-4 py-4 backdrop-blur">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">{meta.label}</div>
                    <div className="mt-2 text-sm font-semibold text-white">{meta.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/start/topic"
                  className="inline-flex items-center gap-2 rounded-full bg-[#d2a95a] px-5 py-3 text-sm font-semibold text-[#140f09] transition hover:opacity-90"
                  onClick={() => trackEvent("examples_sticky_cta_clicked", { slug: item.slug, location: "reader_hero" })}
                >
                  Write Your Book <ArrowRight className="size-4" />
                </Link>
                {item.exports.html ? (
                  <a
                    href={item.exports.html.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
                    onClick={() => trackEvent("examples_export_clicked", { slug: item.slug, format: "html", location: "reader_hero" })}
                  >
                    Read Exact HTML <Globe className="size-4" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 bg-[#f7f3ed]">
        <div className="shell py-12 md:py-14">
          <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <div className="rounded-[32px] border border-border/80 bg-background px-6 py-8 shadow-sm md:px-8">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Opening Note
                </div>
                <p className="mt-4 max-w-3xl font-serif text-2xl leading-[1.28] text-foreground md:text-3xl">
                  {item.openingNote}
                </p>
                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  <div className="rounded-[24px] border border-border/70 bg-[#fcfaf6] p-5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Author
                    </div>
                    <div className="mt-3 text-base font-semibold text-foreground">{item.author}</div>
                    {item.authorBio ? (
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.authorBio}</p>
                    ) : null}
                  </div>
                  <div className="rounded-[24px] border border-border/70 bg-[#fcfaf6] p-5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Cover Direction
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.coverBrief}</p>
                    <p className="mt-3 text-sm leading-7 text-foreground/82">{item.readerHook}</p>
                  </div>
                </div>

                <div className="mt-8 rounded-[26px] border border-border/70 bg-[#fcfaf6] px-5 py-6" dir={item.direction}>
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <Layers className="size-3.5" />
                    Introduction
                  </div>
                  <div className="mt-4 space-y-4">
                    {item.introductionText.split("\n\n").map((paragraph, index) => (
                      <p
                        key={`${item.slug}-intro-${index}`}
                        className={cn("text-sm leading-8 text-foreground/82", item.direction === "rtl" && "text-right")}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <ReaderCta slug={item.slug} location="reader_after_intro" />
                </div>
              </div>

              <div className="mt-10 space-y-8">
                {item.chaptersContent.map((chapter, index) => (
                  <div key={`${item.slug}-${chapter.anchorId}`}>
                    <article
                      id={chapter.anchorId}
                      data-reader-chapter
                      className="scroll-mt-28 rounded-[32px] border border-border/80 bg-background px-6 py-8 shadow-sm md:px-8"
                      dir={item.direction}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <div
                          className="rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground"
                          style={{ backgroundColor: item.spineColor }}
                        >
                          {chapter.reference}
                        </div>
                        {chapter.pages ? (
                          <div className="rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                            {chapter.pages}
                          </div>
                        ) : null}
                      </div>
                      <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight text-foreground">{chapter.title}</h2>
                      <div className="mt-5 space-y-4">
                        {chapter.text.split("\n\n").map((paragraph, paragraphIndex) => (
                          <p
                            key={`${chapter.anchorId}-paragraph-${paragraphIndex}`}
                            className={cn("text-base leading-8 text-foreground/82", item.direction === "rtl" && "text-right")}
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </article>

                    {index + 1 === midpoint ? (
                      <div className="mt-8">
                        <ReaderCta slug={item.slug} location="reader_midpoint" compact />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <ReaderCta slug={item.slug} location="reader_end" />
              </div>
            </div>

            <aside className="hidden xl:block">
              <div className="sticky top-24 space-y-5">
                <div className="rounded-[28px] border border-border/80 bg-background p-5 shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Table of Contents
                  </div>
                  <div className="mt-4 space-y-2" dir={item.direction}>
                    {item.chaptersContent.map((chapter) => (
                      <a
                        key={`${item.slug}-toc-${chapter.anchorId}`}
                        href={`#${chapter.anchorId}`}
                        className={cn(
                          "block rounded-2xl border px-4 py-3 transition",
                          activeChapter === chapter.anchorId
                            ? "border-foreground bg-foreground text-background"
                            : "border-border/70 bg-background hover:bg-accent",
                        )}
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
                          {chapter.reference}
                        </div>
                        <div className="mt-1 text-sm font-semibold leading-6">{chapter.title}</div>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-border/80 bg-background p-5 shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Exact Outputs
                  </div>
                  <div className="mt-4 space-y-3">
                    <ExportButton asset={item.exports.html} label="Full HTML Openç" slug={item.slug} format="html" />
                    <ExportButton asset={item.exports.pdf} label="PDF'i görüntüle" slug={item.slug} format="pdf" />
                    <ExportButton asset={item.exports.epub} label="Download EPUB" slug={item.slug} format="epub" />
                  </div>
                </div>

                <ReaderCta slug={item.slug} location="reader_sticky_sidebar" compact />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/96 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{item.title}</div>
            <div className="truncate text-xs text-muted-foreground">{item.author}</div>
          </div>
          <Link
            href="/start/topic"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
            onClick={() => trackEvent("examples_sticky_cta_clicked", { slug: item.slug, location: "reader_mobile_sticky" })}
          >
            Start Your Own Book <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </>
  );
}