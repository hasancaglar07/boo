"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getSession } from "@/lib/preview-auth";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const FAST_STAGES = [
  { id: "cover" as const, label: "Cover draft", durationMs: 2000, emoji: "🎨" },
  { id: "chapter" as const, label: "First chapter", durationMs: 3000, emoji: "✍️" },
];

type FastStageId = "cover" | "chapter";

interface GenerateLoadingScreenProps {
  onComplete?: () => void;
  redirectPath?: string;
}

export function GenerateLoadingScreen({ onComplete, redirectPath }: GenerateLoadingScreenProps) {
  const router = useRouter();
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState<FastStageId[]>([]);
  const [animationDone, setAnimationDone] = useState(false);
  const canNavigate = Boolean(onComplete || redirectPath);

  useEffect(() => {
    trackEvent("fast_preview_loading_started");

    const coverTimer = window.setTimeout(() => {
      setCompletedStages(["cover"]);
      setActiveStageIndex(1);
    }, FAST_STAGES[0].durationMs);

    const chapterTimer = window.setTimeout(() => {
      setCompletedStages(["cover", "chapter"]);
      setAnimationDone(true);
      trackEvent("fast_preview_loading_completed");
    }, FAST_STAGES[0].durationMs + FAST_STAGES[1].durationMs);

    return () => {
      window.clearTimeout(coverTimer);
      window.clearTimeout(chapterTimer);
    };
  }, []);

  useEffect(() => {
    if (!animationDone || !canNavigate) return;

    const navigationTimer = window.setTimeout(() => {
      if (onComplete) {
        onComplete();
      } else if (redirectPath) {
        router.push(redirectPath);
      }
    }, 600);

    return () => {
      window.clearTimeout(navigationTimer);
    };
  }, [animationDone, canNavigate, onComplete, redirectPath, router]);

  const totalMs = FAST_STAGES.reduce((sum, s) => sum + s.durationMs, 0);
  const elapsedMs = completedStages.reduce((sum, id) => {
    const stage = FAST_STAGES.find((s) => s.id === id);
    return sum + (stage?.durationMs ?? 0);
  }, 0);
  const done = animationDone && canNavigate;
  const progressPercent = done ? 100 : animationDone ? 92 : Math.round((elapsedMs / totalMs) * 100);

  // SVG circle params
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex min-h-[85dvh] items-center justify-center px-4" aria-busy={!done} aria-label="Book is being prepared">
      <style>{`
        @keyframes ring-pulse {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(var(--ring-rgb), 0.25)); }
          50% { filter: drop-shadow(0 0 18px rgba(var(--ring-rgb), 0.50)); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes check-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="w-full max-w-[400px] flex flex-col items-center gap-8">
        {/* ── Circular Progress Indicator ───────────────────────────────── */}
        <div
          className="relative flex items-center justify-center"
          style={
            {
              "--ring-rgb": done ? "16, 185, 129" : "124, 58, 237",
              animation: done ? "none" : "ring-pulse 2.4s ease-in-out infinite",
            } as React.CSSProperties
          }
        >
          <svg
            width="152"
            height="152"
            viewBox="0 0 152 152"
            className="-rotate-90"
            role="progressbar"
            aria-valuenow={progressPercent}
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
                done ? "stroke-emerald-500" : "stroke-primary"
              )}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeOffset,
              }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {done ? (
              <div style={{ animation: "check-pop 0.4s ease-out forwards" }}>
                <Check className="size-10 text-emerald-500" strokeWidth={2.5} aria-hidden="true" />
              </div>
            ) : (
              <span
                className={cn(
                  "text-4xl font-extralight tabular-nums tracking-tight transition-colors duration-500",
                  done ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                )}
              >
                {progressPercent}
                <span className="text-lg text-muted-foreground">%</span>
              </span>
            )}
          </div>
        </div>

        {/* ── Status Text ────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-lg font-medium text-foreground leading-tight">
            {done
              ? "Preview is ready!"
              : !canNavigate
                ? "Your book is being saved…"
                : "Your book preview is being generated…"}
          </p>
          <p className="text-sm text-muted-foreground">
            {done
              ? "Opening…"
              : `Step ${completedStages.length + 1} / ${FAST_STAGES.length}`}
          </p>
        </div>

        {/* ── Minimal Stage Pills ─────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3"
          style={{ animation: "fade-up 0.6s ease-out 0.3s both" }}
        >
          {FAST_STAGES.map((stage, index) => {
            const isDone = completedStages.includes(stage.id);
            const isActive = !isDone && index === activeStageIndex;

            return (
              <div key={stage.id} className="flex items-center gap-2">
                {index > 0 && (
                  <div
                    className={cn(
                      "h-px w-4 transition-colors duration-500",
                      completedStages.includes(FAST_STAGES[index - 1].id)
                        ? "bg-emerald-500/60"
                        : "bg-border"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-400",
                    isActive && "bg-primary/10 text-primary ring-1 ring-primary/20",
                    isDone && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                    !isDone && !isActive && "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                  ) : isActive ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="text-xs">{stage.emoji}</span>
                  )}
                  <span className="text-xs font-medium whitespace-nowrap">{stage.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}