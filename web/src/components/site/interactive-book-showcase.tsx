"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  ArrowRight,
  FileText,
  Download,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ExampleCardEntry } from "@/lib/examples-shared";

/* ── Helpers ────────────────────────────────────────────── */

function coverBackground(gradient: string) {
  const fallback = "linear-gradient(135deg, #c96442 0%, #a0522d 50%, #7c3a1e 100%)";
  return gradient?.trim() || fallback;
}

function bookCoverUrl(book: ExampleCardEntry) {
  return book.coverImages.primaryUrl || book.coverImages.fallbackUrl || "";
}

function bookFormats(book: ExampleCardEntry) {
  const labels: string[] = [];
  if (book.exports.pdf) labels.push("PDF");
  if (book.exports.epub) labels.push("EPUB");
  if (book.exports.html) labels.push("HTML");
  return labels;
}

/* ── Single Book Card ───────────────────────────────────── */

function BookCard({
  book,
  index,
}: {
  book: ExampleCardEntry;
  index: number;
}) {
  const coverUrl = bookCoverUrl(book);
  const formats = bookFormats(book);
  const hasExport = book.exports.pdf || book.exports.epub || book.exports.html;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group/book flex w-[170px] shrink-0 snap-center flex-col gap-3 sm:w-[190px] md:w-[200px]"
    >
      {/* Cover */}
      <div className="perspective-[800px]">
        <motion.div
          whileHover={{ rotateY: -6, rotateX: 2, scale: 1.04 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border/40 bg-neutral-950 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow duration-300 group-hover/book:shadow-[0_16px_48px_rgba(188,104,67,0.18)]"
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={book.title}
              fill
              className="object-cover"
              sizes="200px"
              unoptimized
            />
          ) : (
            <div
              className="absolute inset-0 flex flex-col justify-between p-3"
              style={{ background: coverBackground(book.coverGradient) }}
            >
              <span className="inline-flex w-fit rounded-full bg-black/25 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-white/80">
                {book.language}
              </span>
              <div>
                <p className="text-xs font-semibold leading-tight text-white">
                  {book.title}
                </p>
                <p className="mt-1 text-[10px] text-white/70">{book.author}</p>
              </div>
            </div>
          )}

          {/* Spine shadow */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-black/20" />

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover/book:bg-black/8">
            <Link
              href={`/examples/${encodeURIComponent(book.slug)}`}
              className="flex h-10 w-10 scale-75 items-center justify-center rounded-full bg-white/90 text-neutral-900 opacity-0 shadow-lg transition-all duration-300 group-hover/book:scale-100 group-hover/book:opacity-100"
              aria-label={`View ${book.title}`}
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-0.5">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {book.title}
        </h3>
        <p className="truncate text-xs text-muted-foreground">
          {book.author}
        </p>
        {/* Format badges */}
        <div className="mt-1 flex items-center gap-1.5">
          {formats.map((fmt) => (
            <span
              key={fmt}
              className="rounded bg-primary/8 px-1.5 py-0.5 text-[10px] font-medium text-primary"
            >
              {fmt}
            </span>
          ))}
          <span className="text-[10px] text-muted-foreground">
            {book.chapters} ch.
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Showcase Section ──────────────────────────────── */

type InteractiveBookShowcaseProps = {
  books: ExampleCardEntry[];
  badge?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function InteractiveBookShowcase({
  books,
  badge = "Real Books, Real Covers",
  title = "AI-Generated Real Book Examples",
  description = "Each went from topic summary to draft, from draft to EPUB and PDF workflow. You can start your own book this week with the same process.",
  ctaLabel = "Start Free Book Preview",
  ctaHref = "/start/topic",
}: InteractiveBookShowcaseProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const showcaseBooks = React.useMemo(() => books.filter(Boolean), [books]);

  if (!showcaseBooks.length) return null;

  return (
    <section className="border-b border-border/80 bg-gradient-to-b from-background via-accent/20 to-background py-12 md:py-16">
      <div className="shell">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-8 flex max-w-[540px] flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            {badge}
          </div>
          <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        </motion.div>

        {/* Book shelf — horizontal scroll */}
        <div
          ref={scrollRef}
          className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 md:mx-0 md:justify-center md:overflow-visible md:px-0"
        >
          {showcaseBooks.map((book, i) => (
            <BookCard key={book.slug} book={book} index={i} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <Button asChild size="lg" className="shadow-xl">
            <Link href={ctaHref} className="inline-flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {ctaLabel}
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
