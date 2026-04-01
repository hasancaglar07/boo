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

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Shared decorative floating book mini cards for hero backgrounds
function FloatingBookAccent({
  gradient,
  className,
  delay = 0,
}: {
  gradient: string;
  className: string;
  delay?: number;
}) {
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
      style={{ background: gradient }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent" />
      <div className="absolute left-0 top-0 h-full w-1.5 bg-black/20" />
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
    { icon: FileText, label: "Düzenlenebilir" },
    { icon: BookOpen, label: "Yayın Odaklı" },
    { icon: Shield, label: "Güvenilir" },
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
      {/* Marka uyumlu arka plan */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_6%,var(--background)),var(--background)_60%)]" />
      <div className="absolute inset-0 grid-overlay opacity-40" />
      <div className="hero-glow" />

      {/* Dekoratif kitap kartları */}
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
          Hakkında
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mx-auto mt-8 max-w-4xl text-balance font-serif text-5xl font-semibold tracking-tight text-foreground md:text-6xl"
        >
          Daha fazla panel değil,{" "}
          <span className="text-primary">daha fazla biten kitap.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground md:text-lg"
        >
          Amacımız tek: daha az karmaşıkla daha fazla insanın gerçekten kitabını tamamlamasını sağlamak.
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
        "relative flex min-h-[560px] w-full items-center justify-center overflow-hidden border-b border-border/80",
        className,
      )}
      {...props}
    >
      {/* Marka arka plan */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,var(--background)),var(--background)_70%)]" />
      <div className="hero-glow" />

      {/* Dekoratif kitaplar */}
      <FloatingBookAccent
        gradient="linear-gradient(135deg,#c96442,#8e4a30)"
        className="left-[8%] top-[20%] h-32 w-22"
        delay={0.3}
      />
      <FloatingBookAccent
        gradient="linear-gradient(135deg,#312e81,#4338ca)"
        className="right-[10%] top-[18%] h-28 w-20"
        delay={0.5}
      />

      <div className="relative z-10 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur-sm"
        >
          <Award className="h-3.5 w-3.5 text-primary" />
          Fiyatlar
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mx-auto mt-8 max-w-4xl text-balance font-serif text-5xl font-semibold tracking-tight text-foreground md:text-6xl"
        >
          Ghostwriter yerine{" "}
          <span className="text-primary">$4.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground md:text-lg"
        >
          Bir kitap için ajans $500–$5,000 alır. Book Generator ile aynı çıktıyı, kendi kontrolünde, tek seferlik $4'e üretirsin.
          Önce kitabını gör — beğenmezsen ödemezsin.
        </motion.p>

        {/* Ghostwriter anchor karşılaştırması */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.6 }}
          className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-6 rounded-2xl border border-border/80 bg-card/80 px-6 py-3 backdrop-blur-sm text-sm"
        >
          <div className="text-center">
            <p className="font-semibold text-muted-foreground line-through">$500–$5,000</p>
            <p className="text-xs text-muted-foreground/60">Ajans / ghostwriter</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="font-semibold text-primary">$4</p>
            <p className="text-xs text-muted-foreground/60">Book Generator</p>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { icon: Shield, text: "30 Gün İade Garantisi" },
            { icon: CheckCircle2, text: "İstediğin Zaman İptal" },
            { icon: Zap, text: "Anında Erişim" },
            { icon: BookOpen, text: "Kredi Kartı Gerekmez" },
          ].map((badge, index) => (
            <motion.div
              key={badge.text}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.07, duration: 0.4 }}
              className="flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm"
            >
              <badge.icon className="h-4 w-4 text-primary" />
              <span className="font-medium">{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
});

PricingPageHero.displayName = "PricingPageHero";

// ============================================
// EXAMPLES PAGE HERO
// ============================================

interface ExamplesPageHeroProps {
  className?: string;
}

export const ExamplesPageHero = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & ExamplesPageHeroProps
>(({ className, ...props }, ref) => {
  const examples = [
    { title: "Practical Prompting", category: "Rehber Kitap", gradient: "linear-gradient(135deg,#c96442,#8e4a30)" },
    { title: "Niche Offer OS", category: "Business", gradient: "linear-gradient(135deg,#312e81,#4338ca)" },
    { title: "Coaching Program", category: "Uzmanlık", gradient: "linear-gradient(135deg,#14532d,#15803d)" },
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
          Örnekler
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mx-auto mt-8 max-w-4xl text-balance font-serif text-5xl font-semibold tracking-tight text-foreground md:text-6xl"
        >
          Vaat değil,{" "}
          <span className="text-primary">gerçek çıktılar.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground md:text-lg"
        >
          Gerçek brief'lerden üretilmiş kitap başlıkları, outline yapıları ve EPUB export örnekleri.
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
              key={example.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              className="group relative overflow-hidden rounded-[28px] border border-border/80 bg-card/80 p-6 text-left backdrop-blur-sm transition-shadow hover:shadow-lg"
            >
              <div
                className="mb-4 h-12 w-10 overflow-hidden rounded-[10px] shadow-md"
                style={{ background: example.gradient }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              </div>
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {example.category}
              </span>
              <h3 className="mt-3 text-base font-semibold text-foreground">{example.title}</h3>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Download className="h-4 w-4" />
                <span>EPUB + PDF</span>
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
    { number: "01", title: "Brief", icon: FileText, description: "Konu ve hedef okur" },
    { number: "02", title: "Outline", icon: Settings, description: "Bölüm mimarisi" },
    { number: "03", title: "Üretim", icon: Sparkles, description: "Bölüm yazımı" },
    { number: "04", title: "Kapak", icon: BookOpen, description: "Görsel akış" },
    { number: "05", title: "Export", icon: Download, description: "EPUB + PDF" },
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
          Nasıl Çalışır
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mx-auto mt-8 max-w-4xl text-balance font-serif text-5xl font-semibold tracking-tight text-foreground md:text-6xl"
        >
          Fikirden ilk EPUB'a{" "}
          <span className="text-primary">tek net yol.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground md:text-lg"
        >
          Önce yön, sonra yazı, sonra teslim. Her adım bir sonrakini hazırlar, hiçbir şey ayrı araçta kaybolmaz.
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
    { value: "30+", label: "Soru-Cevap" },
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
          Karar vermeden önce{" "}
          <span className="text-primary">sorulan sorular.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-muted-foreground md:text-lg"
        >
          Ürün ne yapıyor, kimin için uygun, nasıl çalışıyor ve ne alırsın — kısa ve net cevaplar.
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
    { icon: MessageCircle, label: "Destek", description: "Kullanım ve teknik sorular" },
    { icon: Clock, label: "1 İş Günü", description: "Ortalama yanıt süresi" },
    { icon: Shield, label: "Güvenli", description: "Verin bizimle güvende" },
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
          İletişim
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mx-auto mt-8 max-w-3xl text-balance font-serif text-5xl font-semibold tracking-tight text-foreground md:text-6xl"
        >
          Destek için{" "}
          <span className="text-primary">kısa yol.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mx-auto mt-5 max-w-xl text-pretty text-base leading-8 text-muted-foreground md:text-lg"
        >
          Teknik sorun, hesap, ödeme ya da teslim — hangi konu olursa olsun kısa ve net yaz.
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
