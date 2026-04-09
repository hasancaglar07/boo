"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { formatEta } from "@/lib/utils";

interface CompactProgressCardProps {
  coverReady: boolean;
  previewReady: boolean;
  chapterReadyCount: number;
  chapterTargetCount: number;
  remainingChapterCount: number;
  generationEta?: string;
  generationActive: boolean;
}

export function CompactProgressCard({
  coverReady,
  previewReady,
  chapterReadyCount,
  chapterTargetCount,
  remainingChapterCount,
  generationEta,
  generationActive,
}: CompactProgressCardProps) {
  const progress = chapterTargetCount > 0 ? (chapterReadyCount / chapterTargetCount) * 100 : 0;

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

        {/* Checkmarks */}
        <div className="space-y-1.5 md:space-y-2">
          {/* Cover */}
          <div className="flex items-center gap-2 text-xs">
            {coverReady ? (
              <CheckCircle2 className="size-3.5 md:size-4 text-emerald-600 shrink-0" />
            ) : (
              <div className="size-3.5 md:size-4 rounded-full border-2 border-border shrink-0" />
            )}
            <span className={coverReady ? "text-foreground" : "text-muted-foreground"}>
              Cover designed
            </span>
          </div>

          {/* Chapters */}
          <div className="flex items-center gap-2 text-xs">
            {previewReady ? (
              <CheckCircle2 className="size-3.5 md:size-4 text-emerald-600 shrink-0" />
            ) : (
              <div className="size-3.5 md:size-4 rounded-full border-2 border-border shrink-0" />
            )}
            <span className={previewReady ? "text-foreground" : "text-muted-foreground"}>
              {chapterReadyCount} of {chapterTargetCount} chapters ready
            </span>
          </div>

          {/* Writing progress */}
          {remainingChapterCount > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <Loader2 className="size-3.5 md:size-4 text-primary animate-spin shrink-0" />
              <span className="text-muted-foreground">
                Writing {remainingChapterCount} more...
              </span>
            </div>
          )}
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
