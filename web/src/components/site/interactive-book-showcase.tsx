"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Maximize2,
  Download,
  Clock,
  Languages,
  FileText,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ExampleCardEntry } from "@/lib/examples-shared";

type InteractiveBookShowcaseProps = {
  books: ExampleCardEntry[];
};

type ShowcaseBookCoverProps = {
  book: ExampleCardEntry;
  className?: string;
  sizes: string;
  priority?: boolean;
  compact?: boolean;
};

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

function primaryExport(book: ExampleCardEntry) {
  return book.exports.pdf || book.exports.epub || book.exports.html;
}

function ShowcaseBookCover({ book, className, sizes, priority = false, compact = false }: ShowcaseBookCoverProps) {
  const coverUrl = bookCoverUrl(book);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[26px] border border-white/12 bg-neutral-950 shadow-[0_30px_70px_rgba(12,10,8,0.35)]",
        className,
      )}
      style={{ background: coverBackground(book.coverGradient) }}
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={book.title}
          fill
          priority={priority}
          className="object-cover"
          sizes={sizes}
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent_24%,transparent_72%,rgba(0,0,0,0.14))]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-black/14" />
      {!coverUrl ? (
        <div className="relative flex h-full flex-col justify-between p-4 text-white">
          <span className="inline-flex w-fit rounded-full bg-black/25 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/80">
            {book.language}
          </span>
          <div>
            <h3 className={cn("font-serif font-semibold leading-tight", compact ? "text-sm" : "text-xl")}>{book.title}</h3>
            {!compact ? <p className="mt-2 text-sm text-white/80">{book.author}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function InteractiveBookShowcase({ books }: InteractiveBookShowcaseProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const showcaseBooks = React.useMemo(() => books.filter(Boolean), [books]);

  React.useEffect(() => {
    if (!showcaseBooks.length) return;
    setCurrentIndex((prev) => Math.min(prev, showcaseBooks.length - 1));
  }, [showcaseBooks]);

  const currentBook = showcaseBooks[currentIndex];

  // Auto-play logic
  React.useEffect(() => {
    if (!isPlaying || showcaseBooks.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % showcaseBooks.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, showcaseBooks.length]);

  // Parallax effect on scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1, 0]);

  const nextBook = () => {
    setCurrentIndex((prev) => (prev + 1) % showcaseBooks.length);
  };

  const prevBook = () => {
    setCurrentIndex((prev) => (prev - 1 + showcaseBooks.length) % showcaseBooks.length);
  };

  if (!currentBook) {
    return null;
  }

  const totalBooks = showcaseBooks.length;
  const prevBookItem = showcaseBooks[(currentIndex - 1 + totalBooks) % totalBooks];
  const nextBookItem = showcaseBooks[(currentIndex + 1) % totalBooks];
  const currentCoverUrl = bookCoverUrl(currentBook);
  const exportAsset = primaryExport(currentBook);
  const exportFormats = bookFormats(currentBook);

  return (
    <section ref={containerRef} className="relative overflow-hidden border-b border-border/80 py-20 md:py-28">
      {/* Marka uyumlu terracotta arka plan */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(201,100,66,0.18) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(160,82,45,0.14) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 80%, rgba(124,58,30,0.12) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(201,100,66,0.18) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="shell relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-sm">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Gerçek Çıktılar
          </div>
          <h2 className="mt-8 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Bunlar bu sistemle üretilmiş{" "}
            <span className="text-primary">gerçek kitap çıktıları.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-8 text-muted-foreground">
            Kapak, metadata, bölüm akışı ve export dosyaları hazır. Aşağıdaki örnekler özellikle English ağırlıklı gerçek kitap setinden geliyor.
          </p>
        </motion.div>

        {/* Interactive Showcase */}
        <motion.div
          style={{ y, opacity }}
          className="mt-16"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "relative mx-auto max-w-6xl overflow-hidden rounded-[40px] border border-[#d6c2ae]/70 bg-[linear-gradient(180deg,#f5ede2_0%,#efe5d7_100%)] shadow-[0_36px_120px_rgba(90,56,34,0.18)] transition-all duration-500",
                isExpanded ? "p-8 md:p-10" : "p-6 md:p-8"
              )}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,100,66,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(124,58,30,0.08),transparent_28%)]" />
              {/* Progress Bar — marka rengi */}
              <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden rounded-t-[40px]">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/60"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                  onAnimationComplete={() => {
                    if (isPlaying) nextBook();
                  }}
                />
              </div>

              <div className={cn(
                "relative grid gap-8 lg:grid-cols-[1.05fr_1fr]",
                isExpanded ? "lg:gap-12" : "lg:gap-10"
              )}>
                <div className="relative">
                  <div className="rounded-[34px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.66),rgba(255,255,255,0.24))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary/70">Curated Shelf</p>
                        <p className="mt-1 text-sm text-muted-foreground">Gerçek kapaklar, gerçek export seti</p>
                      </div>
                      <div className="rounded-full border border-[#dcc6b1] bg-white/70 px-3 py-1 text-xs text-foreground/80">
                        {currentIndex + 1}/{showcaseBooks.length}
                      </div>
                    </div>

                    <div className="relative min-h-[420px] overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,#251b16_0%,#130f0d_100%)] px-4 py-8 sm:px-8">
                      {currentCoverUrl ? (
                        <div className="pointer-events-none absolute inset-0">
                          <Image
                            src={currentCoverUrl}
                            alt=""
                            fill
                            className="scale-110 object-cover opacity-[0.18] blur-3xl"
                            sizes="(min-width: 1024px) 520px, 100vw"
                          />
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,rgba(10,8,7,0.55)_70%)]" />
                        </div>
                      ) : null}

                      {prevBookItem ? (
                        <motion.div
                          key={`${prevBookItem.slug}-side-left`}
                          initial={{ opacity: 0.5, x: -20 }}
                          animate={{ opacity: 0.72, x: 0 }}
                          className="absolute left-0 top-14 hidden lg:block"
                        >
                          <ShowcaseBookCover
                            book={prevBookItem}
                            className="h-[260px] w-[176px] rotate-[-9deg] opacity-70"
                            sizes="176px"
                            compact
                          />
                        </motion.div>
                      ) : null}

                      {nextBookItem ? (
                        <motion.div
                          key={`${nextBookItem.slug}-side-right`}
                          initial={{ opacity: 0.5, x: 20 }}
                          animate={{ opacity: 0.72, x: 0 }}
                          className="absolute right-0 top-16 hidden lg:block"
                        >
                          <ShowcaseBookCover
                            book={nextBookItem}
                            className="h-[260px] w-[176px] rotate-[8deg] opacity-72"
                            sizes="176px"
                            compact
                          />
                        </motion.div>
                      ) : null}

                      <motion.div
                        className="relative mx-auto w-fit"
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.25 }}
                      >
                        <ShowcaseBookCover
                          book={currentBook}
                          className={cn(
                            "relative z-10 mx-auto",
                            isExpanded ? "h-[430px] w-[290px]" : "h-[360px] w-[246px]",
                          )}
                          sizes={isExpanded ? "290px" : "246px"}
                          priority
                        />
                        <div className="absolute inset-x-8 bottom-[-28px] h-10 rounded-full bg-black/40 blur-2xl" />
                      </motion.div>

                      <div className="pointer-events-none absolute inset-x-6 bottom-20 h-px bg-[linear-gradient(90deg,transparent,rgba(255,233,214,0.65),transparent)]" />

                      <div className="absolute inset-x-4 bottom-4 sm:inset-x-6">
                        <div className="rounded-[24px] border border-white/10 bg-black/[0.28] p-3 backdrop-blur-sm">
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                            {showcaseBooks.map((book, index) => {
                              const thumbnailUrl = bookCoverUrl(book);
                              return (
                                <button
                                  key={book.slug}
                                  type="button"
                                  onClick={() => setCurrentIndex(index)}
                                  className={cn(
                                    "group relative overflow-hidden rounded-[16px] border transition-all duration-300",
                                    index === currentIndex
                                      ? "border-primary/80 shadow-[0_0_0_1px_rgba(201,100,66,0.35)]"
                                      : "border-white/10 opacity-70 hover:opacity-100",
                                  )}
                                >
                                  <div className="relative aspect-[2/3] bg-neutral-900">
                                    {thumbnailUrl ? (
                                      <Image
                                        src={thumbnailUrl}
                                        alt={book.title}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                        sizes="96px"
                                      />
                                    ) : (
                                      <div
                                        className="absolute inset-0"
                                        style={{ background: coverBackground(book.coverGradient) }}
                                      />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Book Details */}
                <div className="space-y-6 rounded-[34px] border border-[#dcc6b1]/80 bg-white/[0.72] p-6 shadow-[0_18px_60px_rgba(89,58,36,0.08)] backdrop-blur-sm sm:p-8">
                  {/* Category & Type */}
                  <div className="flex items-center justify-between">
                    <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                      {currentBook.category}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Languages className="h-4 w-4" />
                      <span>{currentBook.type}</span>
                    </div>
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h3 className="text-3xl font-bold tracking-tight text-foreground">
                      {currentBook.title}
                    </h3>
                    <p className="mt-2 text-lg text-muted-foreground">{currentBook.author}</p>
                    {currentBook.subtitle ? (
                      <p className="mt-3 text-base leading-7 text-foreground/80">{currentBook.subtitle}</p>
                    ) : null}
                  </div>

                  {/* Description */}
                  <p className="text-base leading-7 text-muted-foreground">
                    {currentBook.summary}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {currentBook.tags.map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full border border-border/80 bg-background px-3 py-1.5 text-sm text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Meta Info */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { icon: Languages, label: "Dil", value: currentBook.language },
                      { icon: BookOpen, label: "Bölüm", value: `${currentBook.chapters}` },
                      { icon: FileText, label: "Çıktı", value: exportFormats.join(" + ") || "Yakında" },
                      { icon: Clock, label: "Yayıncı", value: currentBook.publisher || "Book Generator" },
                    ].map((item, index) => (
                      <div
                        key={`${item.label}-${index}`}
                        className={cn(
                          "rounded-[22px] border border-[#e4d2bf] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(249,243,235,0.72))] px-4 py-3",
                          index === 3 ? "sm:col-span-3" : "",
                        )}
                      >
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          <item.icon className="h-3.5 w-3.5 text-primary/70" />
                          {item.label}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg" className="flex-1 shadow-xl">
                      <Link href={`/examples/${encodeURIComponent(currentBook.slug)}`}>
                        <Play className="mr-2 h-4 w-4" />
                        Kitabı Oku
                      </Link>
                    </Button>
                    {exportAsset ? (
                      <Button asChild size="lg" variant="outline" className="flex-1">
                        <a href={exportAsset.url} target="_blank" rel="noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          {exportAsset.label || "Örnek İndir"}
                        </a>
                      </Button>
                    ) : (
                      <Button size="lg" variant="outline" className="flex-1" disabled>
                        <Download className="mr-2 h-4 w-4" />
                        Export Hazırlanıyor
                      </Button>
                    )}
                    <Button
                      asChild
                      size="lg"
                      variant="ghost"
                    >
                      <Link href={`/examples/${encodeURIComponent(currentBook.slug)}`}>
                        <ExternalLink className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-fit"
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    {isExpanded ? "Kompakt görünüm" : "Detaylı görünüm"}
                  </Button>
                </div>
              </div>

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-center gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={prevBook}
                  className="rounded-full"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-2">
                  {showcaseBooks.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        index === currentIndex
                          ? "w-8 bg-primary"
                          : "w-2 bg-border/60 hover:bg-border"
                      )}
                    />
                  ))}
                </div>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={nextBook}
                  className="rounded-full"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Play/Pause Control */}
              <div className="absolute bottom-4 right-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="rounded-full bg-background/80 backdrop-blur-sm"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 text-center"
        >
          <p className="text-base leading-8 text-muted-foreground">
            Bu bölüm artık mock değil.{" "}
            <span className="font-semibold text-foreground">Gerçek kapaklı gerçek kitaplar</span>{" "}
            doğrudan output klasörlerinden geliyor.
          </p>
          <Button asChild size="lg" className="mt-6 shadow-xl">
            <a href="/start/topic" className="inline-flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              14 Gün Ücretsiz Başla
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
