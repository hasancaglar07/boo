"use client";

import { Clock, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ETACalculation, Stage } from "@/lib/eta-calculator";
import { generateActionableFeedback, getStageMessage } from "@/lib/eta-calculator";

interface ETAIndicatorProps {
  eta: ETACalculation;
  currentStage: Stage;
  totalStages: number;
  showDetailed?: boolean;
  className?: string;
}

export function ETAIndicator({
  eta,
  currentStage,
  totalStages,
  showDetailed = false,
  className,
}: ETAIndicatorProps) {
  const actionableFeedback = generateActionableFeedback(currentStage, eta, totalStages);
  const stageMessage = getStageMessage(currentStage.id, eta.progressPercent);

  return (
    <div
      className={cn(
        "w-full rounded-xl border bg-background/60 backdrop-blur-sm px-4 py-3 transition-all duration-300",
        eta.isComplete
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-primary/20 bg-primary/5",
        className
      )}
    >
      {/* Main ETA Display */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock
            className={cn(
              "size-4",
              eta.isComplete ? "text-emerald-500" : "text-primary"
            )}
          />
          <span className="text-sm font-medium text-foreground">
            {eta.isComplete ? "Tamamlandı" : `ETA: ${eta.etaFormatted}`}
          </span>
        </div>

        {/* Progress Badge */}
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
            eta.isComplete
              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : "bg-primary/20 text-primary"
          )}
        >
          {eta.isComplete ? (
            <>✓ %100</>
          ) : (
            <>{eta.progressPercent}%</>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full transition-all duration-500 ease-out",
              eta.isComplete ? "bg-emerald-500" : "bg-primary"
            )}
            style={{ width: `${eta.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stage Information */}
      <div className="space-y-1.5">
        {/* Current Stage Message */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="size-3" />
          <span>{stageMessage}</span>
        </div>

        {/* Actionable Feedback */}
        <div className="text-xs font-medium text-foreground">
          {actionableFeedback}
        </div>

        {/* Detailed Stats */}
        {showDetailed && !eta.isComplete && (
          <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="size-3" />
              <span>{eta.stagesRemaining} aşama kaldı</span>
            </div>
            {eta.averageTimePerStage > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="size-3" />
                <span>Ort. {eta.averageTimePerStage}s/aşama</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function ETAIndicatorCompact({
  eta,
  className,
}: Pick<ETAIndicatorProps, "eta" | "className">) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs",
        eta.isComplete
          ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
          : "border-primary/20 bg-primary/5 text-primary",
        className
      )}
    >
      <Clock className="size-3" />
      <span className="font-medium">
        {eta.isComplete ? "✓ Tamamlandı" : `~${eta.etaFormatted}`}
      </span>
    </div>
  );
}

// Minimal version for very small spaces
export function ETAIndicatorMinimal({
  eta,
  className,
}: Pick<ETAIndicatorProps, "eta" | "className">) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-[10px] font-medium",
        eta.isComplete
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-muted-foreground",
        className
      )}
    >
      <Clock className="size-3" />
      <span>{eta.isComplete ? "Tamamlandı" : `~${eta.etaFormatted}`}</span>
    </div>
  );
}
