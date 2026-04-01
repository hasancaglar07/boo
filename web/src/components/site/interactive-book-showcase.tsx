"use client";

import * as React from "react";
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
  Eye,
  Clock,
  Star
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type BookShowcaseItem = {
  id: string;
  title: string;
  author: string;
  category: string;
  rating: number;
  readTime: string;
  pageCount: number;
  description: string;
  coverGradient: [string, string, string];
  features: string[];
  stats: {
    downloads: string;
    rating: string;
    reviews: string;
  };
};

const showcaseBooks: BookShowcaseItem[] = [
  {
    id: "1",
    title: "Email to Income",
    author: "Baran K.",
    category: "Danışmanlık",
    rating: 4.9,
    readTime: "3 saat",
    pageCount: 165,
    description: "Freelance danışmanların e-mail üzerinden güven inşa edip ilk bilgi ürününü nasıl sattığını anlatan rehber.",
    coverGradient: ["#c96442", "#a0522d", "#7c3a1e"],
    features: ["Email Stratejisi", "Güven İnşası", "Ürün Lansmanı"],
    stats: { downloads: "2.1K+", rating: "4.9/5", reviews: "118" },
  },
  {
    id: "2",
    title: "Solo Founder OS",
    author: "Kerem S.",
    category: "Business",
    rating: 4.8,
    readTime: "4 saat",
    pageCount: 195,
    description: "Tek kişilik iş modelini sistem haline getirmek için pratik çerçeve ve uygulamalı iş akışları.",
    coverGradient: ["#1f2937", "#374151", "#111827"],
    features: ["İş Sistemi", "Verimlilik", "Ölçekleme"],
    stats: { downloads: "1.9K+", rating: "4.8/5", reviews: "97" },
  },
  {
    id: "3",
    title: "Coaching Playbook",
    author: "Merve D.",
    category: "Eğitim",
    rating: 4.9,
    readTime: "3.5 saat",
    pageCount: 178,
    description: "Koçluk hizmetini paketleyip dijital ürüne dönüştürmenin en kısa ve en net yolu.",
    coverGradient: ["#7c2d12", "#c2410c", "#ea580c"],
    features: ["Paket Tasarımı", "Fiyatlama", "Satış Sistemi"],
    stats: { downloads: "2.4K+", rating: "4.9/5", reviews: "143" },
  },
  {
    id: "4",
    title: "Niche Authority",
    author: "Onur B.",
    category: "Creator",
    rating: 4.7,
    readTime: "2.5 saat",
    pageCount: 142,
    description: "Dar bir niş içinde otorite olmak ve bunu ücretli bilgi ürününe dönüştürmek için adım adım rehber.",
    coverGradient: ["#292524", "#57534e", "#78716c"],
    features: ["Niş Seçimi", "İçerik Yapısı", "Monetizasyon"],
    stats: { downloads: "1.6K+", rating: "4.7/5", reviews: "84" },
  },
];

export function InteractiveBookShowcase() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const currentBook = showcaseBooks[currentIndex];

  // Auto-play logic
  React.useEffect(() => {
    if (!isPlaying) return;
    
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
            Bunlar gerçek kullanıcıların{" "}
            <span className="text-primary">bu sistemle çıkardığı kitaplar.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-8 text-muted-foreground">
            Her biri brief → outline → EPUB akışından geçti. Sen de aynı akışla bu hafta başlayabilirsin.
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
                      background: `linear-gradient(135deg, ${currentBook.coverGradient[0]} 0%, ${currentBook.coverGradient[1]} 50%, ${currentBook.coverGradient[2]} 100%)`,
                      transform: "perspective(1000px) rotateY(-5deg)",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* Glossy overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                    
                    {/* Spine shadow */}
                    <div className="absolute left-0 top-0 h-full w-3 bg-black/20" />
                    
                    {/* Content */}
                    <div className="relative flex h-full w-full flex-col justify-between p-6">
                      <div>
                        <div className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                          {currentBook.category}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold leading-tight text-white drop-shadow-lg">
                          {currentBook.title}
                        </h3>
                        <p className="text-sm font-medium text-white/90">{currentBook.author}</p>
                      </div>
                    </div>

                    {/* Floating particles */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute h-2 w-2 rounded-full bg-white/40"
                        animate={{
                          y: [0, -20, 0],
                          x: [0, (i - 1) * 10, 0],
                          opacity: [0.4, 0.8, 0.4],
                        }}
                        transition={{
                          duration: 3 + i,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        style={{
                          top: `${20 + i * 25}%`,
                          left: `${10 + i * 15}%`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                      { icon: Download, label: "İndirme", value: currentBook.stats.downloads },
                      { icon: Star, label: "Puan", value: currentBook.stats.rating },
                      { icon: Eye, label: "İnceleme", value: currentBook.stats.reviews },
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
                  {/* Category & Rating */}
                  <div className="flex items-center justify-between">
                    <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                      {currentBook.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-foreground">{currentBook.rating}</span>
                    </div>
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h3 className="text-3xl font-bold tracking-tight text-foreground">
                      {currentBook.title}
                    </h3>
                    <p className="mt-2 text-lg text-muted-foreground">{currentBook.author}</p>
                  </div>

                  {/* Description */}
                  <p className="text-base leading-7 text-muted-foreground">
                    {currentBook.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {currentBook.features.map((feature) => (
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
                      <span>{currentBook.readTime} okuma</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{currentBook.pageCount} sayfa</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Button size="lg" className="flex-1 shadow-xl">
                      <Play className="mr-2 h-4 w-4" />
                      Önizleme
                    </Button>
                    <Button size="lg" variant="outline" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Örnek İndir
                    </Button>
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      <Maximize2 className="h-5 w-5" />
                    </Button>
                  </div>
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
            Bu kitaplar gerçek kullanıcılar tarafından{" "}
            <span className="font-semibold text-foreground">bu sistemle üretildi.</span>{" "}
            Aynı akışı kendi konunda bu hafta dene.
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
