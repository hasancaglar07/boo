"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  Target,
  Zap,
  Shield,
  CheckCircle2,
  ArrowRight,
  Layers,
  FileText,
  Download,
  Users,
  Award,
  Lightbulb,
  Settings,
  MessageCircle,
  Clock,
} from "lucide-react";

import type { ExampleCardEntry } from "@/lib/examples-shared";
import { ExampleCoverArtwork } from "@/components/site/example-cover-artwork";
import { SITE_REAL_BOOKS, siteExampleAssetUrl, siteExamplePublicCoverUrl } from "@/lib/site-real-books";
import { cn } from "@/lib/utils";

// Shared decorative floating book mini cards for hero backgrounds
const DECORATIVE_ACCENT_COVERS = [
  "authority-in-100-pages",
  "silent-offers",
  "prompt-systems-for-small-teams",
  "parent-friendly-stem-at-home",
  "focus-by-design",
  "quiet-leadership-for-remote-teams",
  "uzmanligini-kitaba-donustur",
  "tu-metodo-hecho-libro",
] as const;

function pickAccentCover(className: string, delay: number) {
  const key = `${className}:${delay}`;
  let hash = 0;
  for (const character of key) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  const slug = DECORATIVE_ACCENT_COVERS[hash % DECORATIVE_ACCENT_COVERS.length];
  return siteExamplePublicCoverUrl(slug);
}

function FloatingBookAccent({
  gradient,
  className,
  delay = 0,
}: {
  gradient: string;
  className: string;
  delay?: number;
}) {
  const imageUrl = React.useMemo(() => pickAccentCover(className, delay), [className, delay]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
      transition={{
        opacity: { delay, duration: 0.6 },
        scale: { delay, duration: 0.6 },
        y: { delay: delay + 0.6, duration: 4, repeat: Infinity, ease: "easeInOut" },
      }}
      className={cn(
        "pointer-events-none absolute hidden overflow-hidden rounded-[14px] shadow-xl md:block",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.12)), url(${imageUrl}), ${gradient}`,
        backgroundSize: "cover, cover, cover",
        backgroundPosition: "center, center, center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent" />
      <div className="absolute left-0 top-0 h-full w-1.5 bg-black/20" />
      <div className="absolute inset-0 ring-1 ring-white/10" />
    </motion.div>
  );
}

// ============================================
// ABOUT PAGE HERO
// ============================================

interface AboutPageHeroProps {
  className?: string;
}

export const AboutPageHero = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & AboutPageHeroProps
>(({ className, ...props }, ref) => {
  const principles = [
    { icon: Target, label: "Az Kelime" },
    { icon: Layers, label: "Tek Yol" },
    { icon: FileText, label: "Editable" },
    { icon: BookOpen, label: "Publishing-Focused" },
    { icon: Shield, label: "Reliable" },
    { icon: Sparkles, label: "AI + Sade" },
  ];

  return (
    <section
      ref={ref}
      className={cn(
        "relative flex min-h-[680px] w-full items-center justify-center overflow-hidden border-b border-border/80",
        className,
      )}
      {...props}
    >
      {/* Brand-compatible background */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_6%,var(--background)),var(--background)_60%)]" />
      <div className="absolute inset-0 grid-overlay opacity-40" />
      <div className="hero-glow" />

      {/* Decorative book cards */}
      <FloatingBookAccent
        gradient="linear-gradient(135deg,#c96442,#8e4a30)"
        className="left-[6%] top-[18%] h-28 w-20"
        delay={0.2}
      />
      <FloatingBookAccent
        gradient="linear-gradient(135deg,#1f2937,#374151)"
        className="right-[8%] top-[22%] h-32 w-22"
        delay={0.4}
      />
      <FloatingBookAccent
        gradient="linear-gradient(135deg,#075985,#0369a1)"
        className="left-[10%] bottom-[20%] h-24 w-18"
        delay={0.6}
      />
      <FloatingBookAccent
        gradient="linear-gradient(135deg,#14532d,#15803d)"
        className="right-[12%] bottom-[18%] h-20 w-16"
        delay={0.8}
      />

      <div className="relative z-10 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-sm"
        >
          <Lightbulb className="h-3.5 w-3.5 text-primary" />
          About
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mx-auto mt-8 max-w-4xl text-balance font-serif text-5xl font-semibold tracking-tight text-foreground md:text-6xl"
        >
          Not more panels,{" "}
          <span className="text-primary">more completed books.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground md:text-lg"
        >
          Our single goal: remove unnecessary complexity and enable anyone with expertise to actually finish their book.
        </motion.p>

        {/* Principles Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6"
        >
          {principles.map((principle, index) => (
            <motion.div
              key={principle.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.07, duration: 0.4 }}
              className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-5 backdrop-blur-sm transition-shadow hover:shadow-md"
            >
              <principle.icon className="h-6 w-6 text-primary" />
              <p className="mt-3 text-sm font-semibold text-foreground">{principle.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
});

AboutPageHero.displayName = "AboutPageHero";

// ============================================
// PRICING PAGE HERO
// ============================================

interface PricingPageHeroProps {
  className?: string;
}

export const PricingPageHero = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & PricingPageHeroProps
>(({ className, ...props }, ref) => {
  return (
    <section
      ref={ref}
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden border-b border-border/80 py-10",
        className,
      )}
      {...props}
    >
      {/* Brand background */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,var(--background)),var(--background)_70%)]" />
      <div className="hero-glow" />

      <div className="relative z-10 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-sm"
        >
          <Award className="h-3.5 w-3.5 text-primary" />
          Pricing
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mx-auto mt-5 max-w-3xl text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl"
        >
          Your book will be ready this weekend.{" "}
          <span className="text-primary">Start for $4, download your EPUB.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-7 text-muted-foreground md:text-base"
        >
          See your draft for free, full book $4. No subscription, 30-day refund guarantee.
        </motion.p>

        {/* Ghostwriter anchor comparison */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mx-auto mt-4 inline-flex items-center justify-center gap-5 rounded-2xl border border-border/80 bg-card/80 px-5 py-2.5 backdrop-blur-sm text-sm"
        >
          <div className="text-center">
            <p className="font-semibold text-muted-foreground line-through">$500–$5,000</p>
            <p className="text-[11px] text-muted-foreground/60">Agency / ghostwriter</p>
          </div>
          <div className="h-7 w-px bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold text-primary">$4</p>
            <p className="text-[11px] text-muted-foreground/60">Book Creator</p>
          </div>
        </motion.div>

        {/* Trust Badges — kompakt */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-4 flex flex-wrap items-center justify-center gap-2"
        >
          {[
            { icon: Shield, text: "30-Day Refund" },
            { icon: CheckCircle2, text: "Preview First" },
            { icon: Zap, text: "$4 Tek Seferlik" },
            { icon: BookOpen, text: "No CC Required" },
          ].map((badge) => (
            <span
              key={badge.text}
              className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm"
            >
              <badge.icon className="h-3 w-3 text-primary" />
              <span className="font-medium">{badge.text}</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

PricingPageHero.displayName = "PricingPageHero";

// ============================================
// EXAMPLES PAGE HERO
// ============================================

interface ExamplesPageHeroProps {
  className?: string;
  items?: ExampleCardEntry[];
}

type HeroExampleCard = Pick<
  ExampleCardEntry,
  "slug" | "title" | "category" | "coverGradient" | "spineColor" | "textAccent" | "coverImages" | "brandingMark" | "language"
>;

export const ExamplesPageHero = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & ExamplesPageHeroProps
>(({ className, ...props }, ref) => {
  const { items, ...rest } = props;
  const fallbackExamples: HeroExampleCard[] = [
    ...SITE_REAL_BOOKS.slice(0, 3).map((book) => ({
      slug: book.slug,
      title: book.title,
      category: book.category,
      coverGradient: `linear-gradient(135deg,${book.palette[0]},${book.palette[1]})`,
      spineColor: book.palette[0],
      textAccent: book.palette[2],
      coverImages: {
        primaryUrl: siteExamplePublicCoverUrl(book.slug),
        fallbackUrl: undefined,
        backUrl: siteExampleAssetUrl(book.slug, "back_cover_final.png"),
      },
      brandingMark: book.author
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      language: book.language,
    })),
  ];
  const examples: HeroExampleCard[] =
    items?.slice(0, 3).length
      ? items.slice(0, 3)
      : fallbackExamples;

  return (
    <section
      ref={ref}
      className={cn(
        "relative flex min-h-[680px] w-full items-center justify-center overflow-hidden border-b border-border/80",
        className,
      )}
      {...rest}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_6%,var(--background)),var(--background)_60%)]" />
      <div className="hero-glow" />

      <div className="relative z-10 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-sm"
        >
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          Examples
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mx-auto mt-8 max-w-4xl text-balance font-serif text-5xl font-semibold tracking-tight text-foreground md:text-6xl"
        >
          Not promises,{" "}
          <span className="text-primary">real outputs.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground md:text-lg"
        >
          Book titles, draft structures, and EPUB output examples generated from real topics.
        </motion.p>

        {/* Example Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 grid gap-4 md:grid-cols-3"
        >
          {examples.map((example, index) => (
            <motion.div
              key={example.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              className="group relative overflow-hidden rounded-[28px] border border-border/80 bg-card/80 p-6 text-left backdrop-blur-sm transition-shadow hover:shadow-lg"
            >
              <ExampleCoverArtwork
                title={example.title}
                brandingMark={example.brandingMark}
                primaryUrl={example.coverImages.primaryUrl}
                fallbackUrl={example.coverImages.fallbackUrl}
                spineColor={example.spineColor}
                coverGradient={example.coverGradient}
                textAccent={example.textAccent}
                className="mb-4 h-[88px] w-[62px]"
                coverClassName="h-full"
              />
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {example.category}
              </span>
              <h3 className="mt-3 text-base font-semibold text-foreground">{example.title}</h3>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Download className="h-4 w-4" />
                <span>{example.language}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
});

ExamplesPageHero.displayName = "ExamplesPageHero";

// ============================================
// HOW IT WORKS PAGE HERO
// ============================================

interface HowItWorksPageHeroProps {
  className?: string;
}

export const HowItWorksPageHero = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & HowItWorksPageHeroProps
>(({ className, ...props }, ref) => {
  const steps = [
    { number: "01", title: "Topic", icon: FileText, description: "Topic and target reader" },
    { number: "02", title: "Draft", icon: Settings, description: "Chapter architecture" },
    { number: "03", title: "Production", icon: Sparkles, description: "Chapter writing" },
    { number: "04", title: "Cover", icon: BookOpen, description: "Visual workflow" },
    { number: "05", title: "Output", icon: Download, description: "EPUB + PDF" },
  ];

  return (
    <section
      ref={ref}
      className={cn(
        "relative flex min-h-[680px] w-full items-center justify-center overflow-hidden border-b border-border/80",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_7%,var(--background)),var(--background)_65%)]" />
      <div className="hero-glow" />

      <FloatingBookAccent
        gradient="linear-gradient(135deg,#c96442,#8e4a30)"
        className="left-[5%] top-[16%] h-32 w-22"
        delay={0.3}
      />
      <FloatingBookAccent
        gradient="linear-gradient(135deg,#1f2937,#374151)"
        className="right-[7%] top-[20%] h-28 w-20"
        delay={0.5}
      />

      <div className="relative z-10 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-sm"
        >
          <Zap className="h-3.5 w-3.5 text-primary" />
          How It Works
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mx-auto mt-8 max-w-4xl text-balance font-serif text-5xl font-semibold tracking-tight text-foreground md:text-6xl"
        >
          Not from a blank page,{" "}
          <span className="text-primary">start with a guided preview.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground md:text-lg"
        >
          First topic, then outline, then preview. You progress knowing what happens at each step.
        </motion.p>

        {/* Steps Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 grid gap-3 md:grid-cols-5"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.08, duration: 0.4 }}
              className="relative group"
            >
              <div className="relative overflow-hidden rounded-[20px] border border-border/80 bg-card/80 p-5 backdrop-blur-sm transition-shadow hover:shadow-md">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="text-xs font-medium text-primary/60">{step.number}</span>
                <step.icon className="mt-3 h-7 w-7 text-primary" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{step.description}</p>
              </div>

              {/* Arrow connector */}
              {index < steps.length - 1 && (
                <div className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 md:flex">
                  <ArrowRight className="h-4 w-4 text-primary/30" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
});

HowItWorksPageHero.displayName = "HowItWorksPageHero";

// ============================================
// FAQ PAGE HERO
// ============================================

interface FAQPageHeroProps {
  className?: string;
}

export const FAQPageHero = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & FAQPageHeroProps
>(({ className, ...props }, ref) => {
  const stats = [
    { value: "7", label: "Kategori" },
    { value: "30+", label: "Q&A" },
    { value: "1 dk", label: "Ortalama okuma" },
  ];

  return (
    <section
      ref={ref}
      className={cn(
        "relative flex min-h-[540px] w-full items-center justify-center overflow-hidden border-b border-border/80",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_6%,var(--background)),var(--background)_70%)]" />
      <div className="hero-glow" />

      <div className="relative z-10 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-sm"
        >
          <Lightbulb className="h-3.5 w-3.5 text-primary" />
          SSS
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mx-auto mt-8 max-w-4xl text-balance font-serif text-5xl font-semibold tracking-tight text-foreground md:text-6xl"
        >
          Before deciding,{" "}
          <span className="text-primary">commonly asked questions.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground md:text-lg"
        >
          What the product does, who it's for, how it works, and what you get — short and clear answers.
        </motion.p>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-foreground">{stat.value}</span>
              <span className="text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
});

FAQPageHero.displayName = "FAQPageHero";

// ============================================
// CONTACT PAGE HERO
// ============================================

interface ContactPageHeroProps {
  className?: string;
}

export const ContactPageHero = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & ContactPageHeroProps
>(({ className, ...props }, ref) => {
  const contactMethods = [
    { icon: MessageCircle, label: "Support", description: "Usage and technical questions" },
    { icon: Clock, label: "1 Business Day", description: "Average response time" },
    { icon: Shield, label: "Secure", description: "Your data is safe with us" },
  ];

  return (
    <section
      ref={ref}
      className={cn(
        "relative flex min-h-[540px] w-full items-center justify-center overflow-hidden border-b border-border/80",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_6%,var(--background)),var(--background)_70%)]" />
      <div className="hero-glow" />

      <FloatingBookAccent
        gradient="linear-gradient(135deg,#c96442,#8e4a30)"
        className="left-[8%] top-[22%] h-28 w-20"
        delay={0.3}
      />
      <FloatingBookAccent
        gradient="linear-gradient(135deg,#1f2937,#374151)"
        className="right-[10%] top-[20%] h-24 w-18"
        delay={0.5}
      />

      <div className="relative z-10 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-sm"
        >
          <Users className="h-3.5 w-3.5 text-primary" />
          Contact
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mx-auto mt-8 max-w-3xl text-balance font-serif text-5xl font-semibold tracking-tight text-foreground md:text-6xl"
        >
          For support{" "}
          <span className="text-primary">shortcut.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mx-auto mt-5 max-w-xl text-pretty text-base leading-8 text-muted-foreground md:text-lg"
        >
          Technical issues, account, payment, or delivery — whatever the topic, write briefly and clearly.
        </motion.p>

        {/* Contact Method Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {contactMethods.map((method, index) => (
            <motion.div
              key={method.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.08, duration: 0.4 }}
              className="flex items-center gap-3 rounded-full border border-border/80 bg-card/80 px-4 py-2.5 text-sm backdrop-blur-sm"
            >
              <method.icon className="h-4 w-4 text-primary" />
              <div className="text-left">
                <div className="font-medium text-foreground">{method.label}</div>
                <div className="text-xs text-muted-foreground">{method.description}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
});

ContactPageHero.displayName = "ContactPageHero";