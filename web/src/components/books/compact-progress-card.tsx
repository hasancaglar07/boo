"use client";

import { CheckCircle2, Clock, Loader2, MinusCircle } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("CompactProgressCard");
  const progress = chapterTargetCount > 0 ? Math.round((chapterReadyCount / chapterTargetCount) * 100) : 0;

  const visibleStages = stages.length
    ? stages
    : [
        {
          code: "cover",
          label: t("coverLabel"),
          status: coverReady ? ("done" as const) : ("active" as const),
          detail: coverReady ? t("coverDoneDetail") : t("coverActiveDetail"),
        },
        {
          code: "first_chapter",
          label: t("firstChapterLabel"),
          status: previewReady ? ("done" as const) : coverReady ? ("active" as const) : ("queued" as const),
          detail: previewReady ? t("firstChapterDoneDetail") : t("firstChapterActiveDetail"),
        },
        {
          code: "full_book",
          label: t("fullBookLabel"),
          status:
            remainingChapterCount === 0 && chapterTargetCount > 0
              ? ("done" as const)
              : generationActive
                ? ("active" as const)
                : ("queued" as const),
          detail:
            remainingChapterCount === 0 && chapterTargetCount > 0
              ? t("fullBookDoneDetail")
              : t("fullBookActiveDetail", { remaining: Math.max(0, remainingChapterCount) }),
        },
      ];

  const getStageIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 md:size-4" />;
      case "active":
        // Actively running — spinner
        return <Loader2 className="size-3.5 shrink-0 animate-spin text-primary md:size-4" />;
      case "waiting":
        // Queued behind another task — clock icon, not spinner
        return <Clock className="size-3.5 shrink-0 text-amber-500 md:size-4" />;
      case "error":
        return <MinusCircle className="size-3.5 shrink-0 text-destructive md:size-4" />;
      default:
        // queued / pending
        return <div className="size-3.5 shrink-0 rounded-full border-2 border-border md:size-4" />;
    }
  };

  const allDone = visibleStages.every((s) => s.status === "done");
  const activeStageDetail = visibleStages.find((s) => s.status === "active")?.detail;

  return (
    // No whileHover lift — this is a status card, not a clickable element
    <Card className="border-border/50 bg-card">
      <CardContent className="space-y-3 p-3 md:p-4">
        {/* Progress bar — single source of truth for completion percentage */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="text-xs font-semibold text-foreground">{t("bookProgress")}</div>
            <div className="text-xs tabular-nums text-muted-foreground">{progress}%</div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        {/* Current step — only show when different from active stage detail */}
        {currentStepLabel && !allDone && currentStepLabel !== activeStageDetail && (
          <div className="rounded-xl border border-primary/10 bg-primary/[0.03] px-3 py-2 text-xs font-medium text-foreground">
            {currentStepLabel}
          </div>
        )}

        {/* Stage list */}
        <div className="space-y-1.5">
          {visibleStages.map((stage) => (
            <div key={stage.code} className="flex items-start gap-2.5 rounded-xl border border-border/50 px-3 py-2.5">
              <div className="mt-0.5">{getStageIcon(stage.status)}</div>
              <div className="min-w-0 flex-1">
                <div className={`text-xs font-medium ${stage.status === "done" ? "text-foreground" : stage.status === "active" ? "text-foreground" : "text-muted-foreground"}`}>
                  {stage.label}
                  {stage.status === "waiting" && (
                    <span className="ml-1.5 text-[10px] font-normal text-amber-600">{t("waitingLabel") || "waiting"}</span>
                  )}
                </div>
                {stage.detail && stage.status !== "queued" && (
                  <div className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
                    {stage.detail}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ETA — minimum text-xs (12px) for readability */}
        {generationEta && (
          <div className="border-t pt-2.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5 shrink-0" />
              {t("etaLabel", { eta: generationEta })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
