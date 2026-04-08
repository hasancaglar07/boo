"use client";

import {
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { useMemo } from "react";

import { cn, formatEta } from "@/lib/utils";

interface UnifiedProgressIndicatorProps {
  generation: {
    product_ready?: boolean;
    preview_ready?: boolean;
    cover_ready?: boolean;
    active?: boolean;
    stage?: string;
    error?: string;
    chapter_ready_count?: number;
    chapter_target_count?: number;
    full_generation?: {
      progress?: number;
      ready_count?: number;
      target_count?: number;
      eta_seconds?: number;
      error?: string;
      stage?: string;
    };
  };
  coverUrl?: string;
  compact?: boolean;
  className?: string;
}

export function UnifiedProgressIndicator({
  generation,
  coverUrl,
  compact = false,
  className,
}: UnifiedProgressIndicatorProps) {
  const isProductReady = Boolean(generation.product_ready);
  const isPreviewReady = Boolean(generation.preview_ready);
  const isCoverReady = Boolean(generation.cover_ready || coverUrl);

  // Extract full generation data
  const fullGeneration = generation.full_generation;
  const fullProgress = useMemo(() => {
    const rawProgress = typeof fullGeneration?.progress === "number"
      ? fullGeneration.progress
      : 0;
    return Math.max(0, Math.min(100, rawProgress));
  }, [fullGeneration?.progress]);

  const chapterReadyCount = Math.max(
    0,
    Number(fullGeneration?.ready_count ?? generation.chapter_ready_count ?? 0),
  );
  const chapterTargetCount = Math.max(
    0,
    Number(fullGeneration?.target_count ?? generation.chapter_target_count ?? 0),
  );
  const remainingChapters = chapterTargetCount > 0
    ? Math.max(0, chapterTargetCount - chapterReadyCount)
    : 0;
  const eta = formatEta(fullGeneration?.eta_seconds);
  const fullError = String(fullGeneration?.error || "").trim();
  const generationError = String(generation.error || "").trim();
  const hasError = !!(generationError || fullError);

  // Define stages
  const stages = useMemo(() => [
    {
      id: "cover" as const,
      label: "Cover",
      done: isCoverReady,
      icon: isCoverReady ? CheckCircle2 : Loader2,
    },
    {
      id: "preview" as const,
      label: "First chapter",
      done: isPreviewReady,
      icon: isPreviewReady ? CheckCircle2 : Loader2,
    },
    {
      id: "full" as const,
      label: "Full book",
      done: isProductReady,
      icon: isProductReady ? CheckCircle2 : Loader2,
    },
  ], [isCoverReady, isPreviewReady, isProductReady]);

  // Determine overall status
  const overallStatus = useMemo(() => {
    if (hasError) return "error";
    if (isProductReady) return "complete";
    if (generation.active) return "in_progress";
    return "waiting";
  }, [hasError, isProductReady, generation.active]);

  // SVG circle params
  const radius = compact ? 36 : 58;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (fullProgress / 100) * circumference;

  // Don't show anything if product is ready
  if (isProductReady && !compact) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-[20px] border border-primary/15 bg-primary/5 px-5 py-4",
        hasError && "border-destructive/20 bg-destructive/8",
        className,
      )}
      role="status"
      aria-label={overallStatus === "error" ? "Error generating book" : "Book generation progress"}
    >
      {/* Error State */}
      {hasError && (
        <div className="mb-4 flex items-start gap-3 rounded-[14px] border border-destructive/20 bg-destructive/8 px-4 py-3">
          <XCircle className="mt-0.5 shrink-0 size-5 text-destructive" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive">
              Generation encountered an issue
            </p>
            {generationError && (
              <p className="mt-1 text-xs leading-5 text-destructive/90">
                {generationError}
              </p>
            )}
            {fullError && !generationError && (
              <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-300">
                {fullError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Progress Header */}
      {!hasError && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
            {overallStatus === "in_progress" && (
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
            )}
            {overallStatus === "complete" && (
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            )}
            {overallStatus === "waiting" && (
              <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
            )}
            <span>
              {overallStatus === "complete"
                ? "Book ready!"
                : overallStatus === "in_progress"
                  ? "Book is being prepared"
                  : "Waiting to start"}
            </span>
          </div>
          <div className="shrink-0 text-sm font-bold tabular-nums text-primary">
            {Math.round(fullProgress)}%
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {!hasError && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary/15">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out",
              overallStatus === "complete" ? "bg-emerald-500" : "bg-primary"
            )}
            style={{ width: `${fullProgress}%` }}
          />
        </div>
      )}

      {/* Stage Indicators */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {stages.map((stage) => (
            <div key={stage.id} className="flex items-center gap-1.5 text-xs">
              {stage.done ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              ) : (
                <Loader2 className={cn("size-3.5 shrink-0", stage.id === stages.find(s => !s.done)?.id ? "animate-spin text-primary" : "text-muted-foreground")} aria-hidden="true" />
              )}
              <span className={cn("font-medium", stage.done ? "text-foreground" : "text-muted-foreground")}>
                {stage.label}
              </span>
            </div>
          ))}
      </div>

      {/* Chapter Progress */}
      {!hasError && !isProductReady && (chapterTargetCount > 0 || remainingChapters > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {chapterTargetCount > 0 && (
            <span className="font-medium">
              Chapters: {chapterReadyCount}/{chapterTargetCount}
            </span>
          )}
          {remainingChapters > 0 && (
            <span>{remainingChapters} remaining</span>
          )}
          {eta && <span>ETA {eta}</span>}
        </div>
      )}

      {/* Compact View - Circular Progress */}
      {compact && !hasError && !isProductReady && (
        <div className="mt-3 flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            <svg
              width={radius * 2 + 16}
              height={radius * 2 + 16}
              viewBox="0 0 152 152"
              className="-rotate-90"
              role="progressbar"
              aria-valuenow={fullProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {/* Track */}
              <circle
                cx="76"
                cy="76"
                r={radius}
                fill="none"
                strokeWidth="5"
                className="stroke-muted/40"
              />
              {/* Progress arc */}
              <circle
                cx="76"
                cy="76"
                r={radius}
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-700 ease-out",
                  overallStatus === "complete" ? "stroke-emerald-500" : "stroke-primary"
                )}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeOffset,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {overallStatus === "complete" ? (
                <CheckCircle2 className="size-8 text-emerald-500" strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  {Math.round(fullProgress)}<span className="text-sm text-muted-foreground">%</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-foreground">
              {remainingChapters > 0
                ? `${remainingChapters} chapters remaining`
                : "Finalizing..."}
            </p>
            {eta && <p className="text-xs text-muted-foreground">ETA {eta}</p>}
          </div>
        </div>
      )}
    </div>
  );
}