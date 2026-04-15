"use client";

import {
  CheckCircle2,
  Download,
  FileText,
  Lock,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

interface ProgressiveCTAProps {
  premium: boolean;
  slug: string;
  readingProgress?: number; // 0-100
  scrollDepth?: number; // 0-100
  className?: string;
  onUpgrade?: (trigger: "pdf" | "epub" | "full_unlock") => void;
}

type EngagementLevel = "low" | "medium" | "high";

interface CTAConfig {
  headline: string;
  subheadline: string;
  primaryAction: {
    text: string;
    icon: React.ElementType;
    trigger: "pdf" | "epub" | "full_unlock";
  };
  secondaryActions?: Array<{
    text: string;
    trigger: "pdf" | "epub" | "full_unlock";
  }>;
  showFeatures?: boolean;
  showPricing?: boolean;
  urgencyLevel?: "low" | "medium" | "high";
}

export function ProgressiveCTA({
  premium,
  slug,
  readingProgress = 0,
  scrollDepth = 0,
  className,
  onUpgrade,
}: ProgressiveCTAProps) {
  const t = useTranslations("ProgressiveCta");
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate engagement level directly without state
  const engagementLevel = calculateEngagementLevel(readingProgress, scrollDepth);

  const CTA_CONFIGS: Record<EngagementLevel, CTAConfig> = {
    low: {
      headline: "Unlock this book",
      subheadline: "Get full access, PDF, EPUB, and editing workspace",
      primaryAction: {
        text: "Publish for $4",
        icon: Sparkles,
        trigger: "full_unlock",
      },
      showFeatures: true,
      showPricing: true,
      urgencyLevel: "low",
    },
    medium: {
      headline: "Continue reading",
      subheadline: "You've started this book — unlock the full content",
      primaryAction: {
        text: "Unlock Full Book",
        icon: Lock,
        trigger: "full_unlock",
      },
      secondaryActions: [
        { text: "Download PDF", trigger: "pdf" },
        { text: "Download EPUB", trigger: "epub" },
      ],
      showFeatures: true,
      showPricing: true,
      urgencyLevel: "medium",
    },
    high: {
      headline: "Don't lose your progress",
      subheadline: "You're engaged with this content — unlock it all now",
      primaryAction: {
        text: "Get Full Access",
        icon: Zap,
        trigger: "full_unlock",
      },
      secondaryActions: [
        { text: "Download PDF", trigger: "pdf" },
        { text: "Download EPUB", trigger: "epub" },
      ],
      showFeatures: false,
      showPricing: true,
      urgencyLevel: "high",
    },
  };

  const FEATURES = [
    { icon: FileText, text: t("featureChapters") },
    { icon: Download, text: t("featureExport") },
    { icon: CheckCircle2, text: t("featureCover") },
    { icon: Zap, text: t("featureWorkspace") },
    { icon: Lock, text: t("featureRefund") },
  ];

  // Intersection Observer for visibility tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Track engagement when CTA is visible
  useEffect(() => {
    if (isVisible) {
      // Track CTA visibility using existing analytics events
      trackEvent("paywall_viewed", {
        slug,
        trigger: "progressive_cta",
        engagement_level: engagementLevel,
        reading_progress: readingProgress,
        scroll_depth: scrollDepth,
      });
    }
  }, [engagementLevel, isVisible, slug, readingProgress, scrollDepth]);

  const handleUpgrade = (trigger: "pdf" | "epub" | "full_unlock") => {
    if (trigger === "pdf") trackEvent("paywall_pdf_clicked", { slug });
    if (trigger === "epub") trackEvent("paywall_epub_clicked", { slug });
    if (trigger === "full_unlock") trackEvent("paywall_full_unlock_clicked", { slug });
    trackEvent("paywall_viewed", { slug, trigger, engagement_level: engagementLevel });
    onUpgrade?.(trigger);
  };

  // Premium state
  if (premium) {
    return (
      <Card className={cn("border-emerald-500/25 bg-emerald-500/8", className)}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {t("fullAccessActive")}
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("fullAccessDesc")}
          </p>
          <Button
            asChild
            size="lg"
            className="mt-4 w-full"
            onClick={() => trackEvent("paywall_pdf_clicked", { slug })}
          >
            <Link href={`/app/book/${encodeURIComponent(slug)}/workspace?tab=publish`}>
              <Download className="mr-2 size-4" aria-hidden="true" />
              {t("downloadPdfEpub")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const config = CTA_CONFIGS[engagementLevel];
  const PrimaryIcon = config.primaryAction.icon;
  const urgencyClass = {
    low: "border-primary/30",
    medium: "border-primary/40 shadow-lg shadow-primary/10",
    high: "border-primary/50 shadow-xl shadow-primary/20",
  }[config.urgencyLevel || "low"];

  return (
    <div
      ref={containerRef}
      className={cn("transition-all duration-500", className)}
      style={{
        opacity: isVisible ? 1 : 0.3,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
      }}
    >
      {/* Main CTA Card */}
      <Card className={cn("overflow-hidden", urgencyClass)}>
        {/* Pricing Header */}
        {config.showPricing && (
          <div className="bg-primary px-5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground/80">
                {t("launchPrice")}
              </span>
              <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-xs font-bold text-primary-foreground">
                {t("discountBadge")}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary-foreground">$4</span>
              <span className="text-sm text-primary-foreground/70 line-through">$29</span>
              <span className="text-xs text-primary-foreground/70">{t("oneTime")}</span>
            </div>
          </div>
        )}

        <CardContent className="p-5">
          {/* Headline */}
          <p className="text-sm font-semibold text-foreground">
            {config.headline}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {config.subheadline}
          </p>

          {/* Features */}
          {config.showFeatures && (
            <ul className="mt-4 space-y-2.5">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-sm text-foreground">
                  <Icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          )}

          {/* Primary Action */}
          <Button
            size="lg"
            className="mt-5 w-full text-base font-bold shadow-md shadow-primary/20"
            onClick={() => handleUpgrade(config.primaryAction.trigger)}
          >
            <PrimaryIcon className="mr-2 size-4" aria-hidden="true" />
            {config.primaryAction.text}
          </Button>

          {/* Secondary Actions */}
          {config.secondaryActions && config.secondaryActions.length > 0 && (
            <div className="mt-3 flex justify-center gap-4">
              {config.secondaryActions.map((action) => (
                <button
                  key={action.text}
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
                  onClick={() => handleUpgrade(action.trigger)}
                >
                  {action.text}
                </button>
              ))}
            </div>
          )}

          {/* Trust Signals */}
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {t("instantAccess")}
          </p>
        </CardContent>
      </Card>

      {/* Trust Badges */}
      <div className="mt-3 rounded-[18px] border border-border/60 bg-background/60 px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Lock, text: t("trustRefund") },
            { icon: Zap, text: t("trustInstant") },
            { icon: FileText, text: t("trustNoSub") },
            { icon: CheckCircle2, text: t("trustKdp") },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="size-3 shrink-0 text-primary" aria-hidden="true" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate engagement level
function calculateEngagementLevel(
  readingProgress: number,
  scrollDepth: number
): EngagementLevel {
  const averageProgress = (readingProgress + scrollDepth) / 2;

  if (averageProgress >= 60) return "high";
  if (averageProgress >= 30) return "medium";
  return "low";
}

// Hook to track reading progress and scroll depth
export function useEngagementTracking() {
  const [readingProgress, setReadingProgress] = useState(0);
  const [scrollDepth, setScrollDepth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
      setScrollDepth(Math.min(100, Math.max(0, scrollPercent)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return {
    readingProgress,
    scrollDepth,
    setReadingProgress,
  };
}
