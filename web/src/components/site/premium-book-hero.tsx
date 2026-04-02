"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

// Terracotta marka paletine uyumlu kitap tonları
type PremiumBookCover = {
  id: number;
  title: string;
  author: string;
  category: string;
  language?: string;
  imageUrl?: string;
  fallbackImageUrl?: string;
  palette: [string, string, string];
  rotation: number;
  position: { x: string; y: string };
  scale: number;
  zIndex: number;
};

function exampleCoverUrl(slug: string, assetName = "front_cover_final.png") {
  return `/api/examples/assets/${encodeURIComponent(slug)}/assets/${encodeURIComponent(assetName)}`;
}

const premiumBooks: PremiumBookCover[] = [
  // Sol taraf - üst
  {
    id: 1,
    title: "Authority in 100 Pages",
    author: "Mina Hart",
    category: "Business",
    language: "English",
    imageUrl: exampleCoverUrl("authority-in-100-pages", "homepage_hero_cover.png"),
    fallbackImageUrl: exampleCoverUrl("authority-in-100-pages"),
    palette: ["#c96442", "#a0522d", "#7c3a1e"],
    rotation: -15,
    position: { x: "5%", y: "10%" },
    scale: 1.2,
    zIndex: 10,
  },
  // Sağ taraf - üst
  {
    id: 2,
    title: "Prompt Systems for Small Teams",
    author: "Owen Vale",
    category: "AI & Systems",
    language: "English",
    imageUrl: exampleCoverUrl("prompt-systems-for-small-teams", "homepage_hero_cover.png"),
    fallbackImageUrl: exampleCoverUrl("prompt-systems-for-small-teams"),
    palette: ["#1f2937", "#374151", "#111827"],
    rotation: 12,
    position: { x: "80%", y: "8%" },
    scale: 1.15,
    zIndex: 15,
  },
  // Sol taraf - orta
  {
    id: 3,
    title: "Uzmanlığını Kitaba Dönüştür",
    author: "Derya Tan",
    category: "Expertise",
    language: "Türkçe",
    imageUrl: exampleCoverUrl("uzmanligini-kitaba-donustur", "homepage_hero_cover.png"),
    fallbackImageUrl: exampleCoverUrl("uzmanligini-kitaba-donustur"),
    palette: ["#7c2d12", "#c2410c", "#ea580c"],
    rotation: -8,
    position: { x: "3%", y: "45%" },
    scale: 1.0,
    zIndex: 12,
  },
  // Sağ taraf - orta
  {
    id: 4,
    title: "Focus by Design",
    author: "Noah Sel",
    category: "Personal Growth",
    language: "English",
    imageUrl: exampleCoverUrl("focus-by-design", "homepage_hero_cover.png"),
    fallbackImageUrl: exampleCoverUrl("focus-by-design"),
    palette: ["#292524", "#57534e", "#78716c"],
    rotation: 10,
    position: { x: "82%", y: "42%" },
    scale: 1.05,
    zIndex: 18,
  },
  // Sol taraf - alt
  {
    id: 5,
    title: "Tu Método Hecho Libro",
    author: "Lucía Ferrer",
    category: "Authority",
    language: "Español",
    imageUrl: exampleCoverUrl("tu-metodo-hecho-libro", "homepage_hero_cover.png"),
    fallbackImageUrl: exampleCoverUrl("tu-metodo-hecho-libro"),
    palette: ["#431407", "#9a3412", "#c2410c"],
    rotation: -10,
    position: { x: "8%", y: "72%" },
    scale: 0.95,
    zIndex: 14,
  },
  // Sağ taraf - alt
  {
    id: 6,
    title: "IA Prática para Negócios Pequenos",
    author: "Lia Monteiro",
    category: "AI",
    language: "Português",
    imageUrl: exampleCoverUrl("ia-pratica-para-negocios-pequenos", "homepage_hero_cover.png"),
    fallbackImageUrl: exampleCoverUrl("ia-pratica-para-negocios-pequenos"),
    palette: ["#1c1917", "#3d3929", "#57534e"],
    rotation: 8,
    position: { x: "78%", y: "75%" },
    scale: 1.0,
    zIndex: 16,
  },
  // Ekstra kitaplar - sol orta-üst
  {
    id: 7,
    title: "Parent-Friendly STEM at Home",
    author: "Amelia Stone",
    category: "Education",
    language: "English",
    imageUrl: exampleCoverUrl("parent-friendly-stem-at-home", "homepage_hero_cover.png"),
    fallbackImageUrl: exampleCoverUrl("parent-friendly-stem-at-home"),
    palette: ["#7c3a1e", "#a0522d", "#c96442"],
    rotation: -18,
    position: { x: "15%", y: "25%" },
    scale: 0.85,
    zIndex: 11,
  },
  // Ekstra kitaplar - sağ orta-alt
  {
    id: 8,
    title: "Clarté, Calme, Exécution",
    author: "Claire Dumas",
    category: "Mindset",
    language: "Français",
    imageUrl: exampleCoverUrl("clarte-calme-execution", "homepage_hero_cover.png"),
    fallbackImageUrl: exampleCoverUrl("clarte-calme-execution"),
    palette: ["#111827", "#1f2937", "#374151"],
    rotation: 14,
    position: { x: "70%", y: "65%" },
    scale: 0.9,
    zIndex: 17,
  },
];

const PremiumBookCard = ({
  book,
  mouseX,
  mouseY,
  index,
}: {
  book: PremiumBookCover;
  mouseX: React.MutableRefObject<number>;
  mouseY: React.MutableRefObject<number>;
  index: number;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [imageSrc, setImageSrc] = React.useState(book.imageUrl);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 300, damping: 25, mass: 0.8 });
  const springY = useSpring(y, { stiffness: 300, damping: 25, mass: 0.8 });
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 25, mass: 0.8 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 25, mass: 0.8 });

  React.useEffect(() => {
    setImageSrc(book.imageUrl);
  }, [book.imageUrl]);

  React.useEffect(() => {
    let frame = 0;
    const update = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(mouseX.current - centerX, mouseY.current - centerY);

        if (distance < 250) {
          const angle = Math.atan2(mouseY.current - centerY, mouseX.current - centerX);
          const force = (1 - distance / 250) * 40;
          x.set(-Math.cos(angle) * force);
          y.set(-Math.sin(angle) * force);
          const rotateForce = (1 - distance / 250) * 8;
          rotateX.set(((mouseY.current - centerY) / rect.height) * rotateForce);
          rotateY.set(-(((mouseX.current - centerX) / rect.width) * rotateForce));
        } else {
          x.set(0);
          y.set(0);
          rotateX.set(0);
          rotateY.set(0);
        }
      }
      frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [mouseX, mouseY, x, y, rotateX, rotateY]);

  const scaleTransform = useTransform([springX, springY], ([lx, ly]) => {
    const d = Math.hypot(lx as number, ly as number);
    return 1 + Math.min(d / 200, 0.08);
  });

  return (
    <motion.div
      ref={ref}
      style={{
        x: springX,
        y: springY,
        rotateX: springRotateX,
        rotateY: springRotateY,
        scale: scaleTransform,
        zIndex: book.zIndex,
        left: book.position.x,
        top: book.position.y,
      }}
      initial={{ opacity: 0, y: 100, rotateZ: book.rotation * 2 }}
      animate={{ opacity: 1, y: 0, rotateZ: book.rotation }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="absolute"
    >
      <motion.div
        className="relative"
        style={{ transform: `scale(${book.scale})` }}
        animate={{ y: [0, -10, 0, 8, 0] }}
        transition={{
          duration: 5 + index * 0.4,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      >
        <div
          className="relative overflow-hidden rounded-r-lg rounded-bl-lg shadow-2xl"
          style={{
            height: book.scale > 1 ? "180px" : "150px",
            width: book.scale > 1 ? "126px" : "105px",
            background: imageSrc
              ? undefined
              : `linear-gradient(145deg, ${book.palette[0]} 0%, ${book.palette[1]} 50%, ${book.palette[2]} 100%)`,
            transform: "perspective(1200px) rotateY(-8deg) rotateX(2deg)",
            transformStyle: "preserve-3d",
          }}
        >
          {imageSrc ? (
            <>
              <Image
                src={imageSrc}
                alt={`${book.title} cover`}
                fill
                sizes="(min-width: 768px) 126px, 105px"
                className="absolute inset-0 h-full w-full object-cover"
                priority={index < 4}
                onError={() => {
                  if (imageSrc !== book.fallbackImageUrl && book.fallbackImageUrl) {
                    setImageSrc(book.fallbackImageUrl);
                    return;
                  }
                  setImageSrc(undefined);
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-black/8" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
              <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/40 px-2 py-1 text-[7px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                {book.language || book.category}
              </div>
            </>
          ) : null}
          {/* Premium overlay effects */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-white/5" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Book spine */}
          <div className="absolute left-0 top-0 h-full w-3 bg-black/30 shadow-inner" />
          <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-r from-black/50 to-transparent" />

          {/* Content */}
          {!imageSrc ? (
            <div className="relative flex h-full w-full flex-col justify-between p-3">
              <div className="inline-block rounded-full bg-white/20 px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-white backdrop-blur-md shadow-sm">
                {book.category}
              </div>
              <div className="space-y-1">
                <h3 className="text-[11px] font-bold leading-tight text-white drop-shadow-md md:text-[13px]">
                  {book.title}
                </h3>
                <p className="text-[9px] font-semibold text-white/90 md:text-[10px]">{book.author}</p>
              </div>
            </div>
          ) : null}

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Shine effect */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-60" />
        </div>
        {/* Enhanced drop shadow */}
        <div
          className="absolute -bottom-4 left-1/2 rounded-full bg-black/25 blur-xl"
          style={{ 
            width: "90%", 
            height: "12px",
            transform: "translateX(-50%) scaleY(0.6)" 
          }}
        />
      </motion.div>
    </motion.div>
  );
};

interface PremiumBookHeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  badge?: string;
  trustNote?: string;
  socialProof?: { count: string; rating: string };
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
}

export const PremiumBookHero = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & PremiumBookHeroProps
>((
  {
    className,
    title = "Kitabını bugün çıkar.",
    subtitle = "Konunu gir, taslağını gör, beğenirsen $4 ile tam kitabı al.",
    ctaText = "Taslağımı Ücretsiz Gör",
    ctaHref = "/start/topic",
    badge = "✨ Ücretsiz Başla",
    trustNote = "✓ Kredi kartı gerekmez · ✓ Kayıt zorunlu değil · ✓ 30 saniye",
    socialProof = { count: "4.291 kitap üretildi", rating: "Amazon'da satışta" },
    secondaryCtaText = "Örnekleri Gör",
    secondaryCtaHref = "/examples",
    ...props
  },
  ref,
) => {
  const mouseX = React.useRef(0);
  const mouseY = React.useRef(0);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    mouseX.current = event.clientX;
    mouseY.current = event.clientY;
  };

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative flex min-h-[600px] md:min-h-[820px] w-full items-center justify-center overflow-hidden border-b border-border/80",
        className,
      )}
      {...props}
    >
      {/* Marka uyumlu terracotta arka plan */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_10%,var(--background)),var(--background)_55%)]" />

      {/* Animasyonlu terracotta glow — marka rengi */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-25"
          animate={{
            background: [
              "radial-gradient(circle at 25% 45%, rgba(201,100,66,0.22) 0%, transparent 55%)",
              "radial-gradient(circle at 75% 45%, rgba(160,82,45,0.18) 0%, transparent 55%)",
              "radial-gradient(circle at 50% 75%, rgba(124,58,30,0.16) 0%, transparent 55%)",
              "radial-gradient(circle at 25% 45%, rgba(201,100,66,0.22) 0%, transparent 55%)",
            ],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Grid overlay */}
      <div className="grid-overlay absolute inset-0 opacity-50" />
      {/* Hero glow */}
      <div className="hero-glow" />

      {/* Floating Books — masaüstünde görünür, mobilde gizli */}
      <div className="absolute inset-0 hidden md:block">
        {premiumBooks.map((book, index) => (
          <PremiumBookCard
            key={book.id}
            book={book}
            mouseX={mouseX}
            mouseY={mouseY}
            index={index}
          />
        ))}
      </div>

      {/* Hero içerik */}
      <div className="relative z-20 px-4 text-center">
        {/* Social Proof Bar */}
        {socialProof && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mx-auto mb-7 inline-flex items-center gap-3 rounded-full border border-border/80 bg-card/80 px-5 py-2.5 text-sm text-muted-foreground shadow-lg backdrop-blur-sm"
          >
            <span className="flex items-center gap-1.5">
              <span className="flex size-2 rounded-full bg-green-500" />
              <span className="font-semibold text-foreground">{socialProof.count}</span>
            </span>
            <span className="h-3.5 w-px bg-border" />
            <span className="text-muted-foreground">{socialProof.rating}</span>
          </motion.div>
        )}

        {/* Badge — Daha minimal ve vurucu */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border-2 border-primary/30 bg-primary/5 px-5 py-2 text-sm font-bold uppercase tracking-wider text-primary shadow-lg"
        >
          <Sparkles className="h-4 w-4" />
          {badge}
        </motion.div>

        {/* H1 — Daha büyük ve vurucu */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mx-auto max-w-5xl text-balance font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-7xl lg:text-8xl"
        >
          {title}
        </motion.h1>

        {/* Subtitle — Daha kısa ve net */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="mx-auto mt-6 max-w-xl text-pretty text-xl font-semibold leading-tight text-foreground/90 md:text-2xl"
        >
          {subtitle}
        </motion.p>

        {/* CTA Butonları — Daha büyük ve belirgin */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button
            asChild
            size="lg"
            className="h-12 px-7 text-base font-bold shadow-2xl transition-all hover:scale-105 hover:shadow-3xl md:h-16 md:px-10 md:text-lg"
          >
            <a
              href={ctaHref}
              className="inline-flex items-center gap-2"
              onClick={() => trackEvent("landing_hero_cta_click", { href: ctaHref })}
            >
              {ctaText}
              <ArrowRight className="h-5 w-5" />
            </a>
          </Button>

          {secondaryCtaText && secondaryCtaHref && (
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="h-12 px-7 text-base font-semibold backdrop-blur-sm hover:bg-primary/10 md:h-16 md:px-10 md:text-lg"
            >
              <a href={secondaryCtaHref} className="inline-flex items-center gap-2">
                {secondaryCtaText}
              </a>
            </Button>
          )}
        </motion.div>

        {/* Trust Microcopy — Daha belirgin */}
        {trustNote && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-6 text-sm font-medium text-muted-foreground/80"
          >
            {trustNote}
          </motion.p>
        )}
      </div>

      {/* Alt gradient geçiş */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
});

PremiumBookHero.displayName = "PremiumBookHero";
