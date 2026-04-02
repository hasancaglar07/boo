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

function coverBackground(gradient: string) {
  const fallback = "linear-gradient(135deg, #c96442 0%, #a0522d 50%, #7c3a1e 100%)";
  return gradient?.trim() || fallback;
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
  }, [isPlaying]);

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

  const currentCoverUrl = currentBook.coverImages.primaryUrl || currentBook.coverImages.fallbackUrl;
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
                "relative mx-auto max-w-6xl rounded-[40px] border border-border/80 bg-card/60 backdrop-blur-xl shadow-2xl transition-all duration-500",
                isExpanded ? "p-8 md:p-12" : "p-6 md:p-8"
              )}
            >
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
                "grid gap-8 md:grid-cols-2",
                isExpanded ? "md:grid-cols-[1fr_1.2fr]" : "md:grid-cols-[0.8fr_1.2fr]"
              )}>
                {/* Book Cover */}
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={cn(
                      "relative mx-auto overflow-hidden rounded-r-2xl rounded-bl-2xl shadow-2xl",
                      isExpanded ? "h-[400px] w-[280px]" : "h-[320px] w-[220px]"
                    )}
                    style={{
                      background: coverBackground(currentBook.coverGradient),
                      transform: "perspective(1000px) rotateY(-5deg)",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {currentCoverUrl ? (
                      <Image
                        src={currentCoverUrl}
                        alt={currentBook.title}
                        fill
                        className="object-cover"
                        sizes={isExpanded ? "280px" : "220px"}
                      />
                    ) : null}

                    {/* Glossy overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />

                    {/* Spine shadow */}
                    <div className="absolute left-0 top-0 h-full w-3 bg-black/20" />

                    {/* Content */}
                    <div className="relative flex h-full w-full flex-col justify-between p-6">
                      <div>
                        <div className="mb-2 inline-block rounded-full bg-black/35 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                          {currentBook.language}
                        </div>
                      </div>

                      {!currentCoverUrl ? (
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold leading-tight text-white drop-shadow-lg">
                            {currentBook.title}
                          </h3>
                          <p className="text-sm font-medium text-white/90">{currentBook.author}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                      { icon: Languages, label: "Dil", value: currentBook.language },
                      { icon: BookOpen, label: "Bölüm", value: `${currentBook.chapters}` },
                      { icon: FileText, label: "Çıktı", value: exportFormats.join(" + ") || "Yakında" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="flex flex-col items-center rounded-xl border border-border/80 bg-background/80 p-3 text-center backdrop-blur-sm"
                      >
                        <stat.icon className="h-4 w-4 text-primary" />
                        <span className="mt-1 text-xs font-semibold text-foreground">{stat.value}</span>
                        <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Book Details */}
                <div className="space-y-6">
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
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{currentBook.publisher || "Book Generator"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{currentBook.chapters} bölüm</span>
                    </div>
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
