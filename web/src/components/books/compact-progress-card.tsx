"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";

interface CompactProgressCardProps {
  coverReady: boolean;
  previewReady: boolean;
  chapterReadyCount: number;
  chapterTargetCount: number;
  remainingChapterCount: number;
  generationEta?: string;
  generationActive: boolean;
  currentStepLabel?: string;
  stages?: Array<{
    code: string;
    label: string;
    status: "done" | "active" | "queued" | "waiting" | "error";
    detail?: string;
  }>;
}

export function CompactProgressCard({
  coverReady,
  previewReady,
  chapterReadyCount,
  chapterTargetCount,
  remainingChapterCount,
  generationEta,
  generationActive,
  currentStepLabel,
  stages = [],
}: CompactProgressCardProps) {
  const progress = chapterTargetCount > 0 ? (chapterReadyCount / chapterTargetCount) * 100 : 0;
  const visibleStages = stages.length
    ? stages
    : [
        {
          code: "cover",
          label: "Cover",
          status: coverReady ? "done" : "active",
          detail: coverReady ? "Real cover ready" : "Creating your real book cover",
        },
        {
          code: "first_chapter",
          label: "First chapter",
          status: previewReady ? "done" : coverReady ? "active" : "queued",
          detail: previewReady ? "First readable chapter ready" : "First readable chapter is next",
        },
        {
          code: "full_book",
          label: "Full book",
          status: remainingChapterCount === 0 && chapterTargetCount > 0 ? "done" : generationActive ? "active" : "queued",
          detail:
            remainingChapterCount === 0 && chapterTargetCount > 0
              ? "All chapters are complete"
              : `${Math.max(0, remainingChapterCount)} chapter remaining`,
        },
      ];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
        <Card className="border-border/50 bg-card transition-shadow duration-200 hover:shadow-md">
        <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-foreground">Book Progress</div>
          <div className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        {currentStepLabel ? (
          <div className="rounded-xl border border-primary/10 bg-primary/[0.03] px-3 py-2 text-xs font-medium text-foreground">
            {currentStepLabel}
          </div>
        ) : null}

        <div className="space-y-2">
          {visibleStages.map((stage) => (
            <div key={stage.code} className="rounded-xl border border-border/60 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs">
                {stage.status === "done" ? (
                  <CheckCircle2 className="size-3.5 md:size-4 text-emerald-600 shrink-0" />
                ) : stage.status === "active" || stage.status === "waiting" ? (
                  <Loader2 className="size-3.5 md:size-4 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="size-3.5 md:size-4 rounded-full border-2 border-border shrink-0" />
                )}
                <span className={stage.status === "done" ? "text-foreground" : "text-muted-foreground"}>
                  {stage.label}
                </span>
              </div>
              {stage.detail ? (
                <div className="mt-1 pl-5 text-[11px] leading-5 text-muted-foreground">
                  {stage.detail}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {/* ETA */}
        {generationEta && (
          <div className="pt-2 border-t">
            <div className="text-[10px] md:text-xs text-muted-foreground">
              ⏱️ About {generationEta} left
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
}
