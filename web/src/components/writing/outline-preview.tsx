"use client";

import { ChevronDown, ChevronUp, Download, Edit, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BookChapterPlan } from "@/lib/dashboard-api";
import { cn } from "@/lib/utils";

interface OutlinePreviewProps {
  chapterPlan?: BookChapterPlan[];
  outlineFile?: string;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onExport?: () => void;
}

export function OutlinePreview({
  chapterPlan,
  outlineFile,
  onEdit,
  onRegenerate,
  onExport,
}: OutlinePreviewProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  const hasOutline = outlineFile || (chapterPlan && chapterPlan.length > 0);

  function toggleChapter(index: number) {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  if (!hasOutline) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-sm text-muted-foreground">
            No outline generated yet. Use the "Generate Outline" button to create your book structure.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Book Outline</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {chapterPlan?.length || 0} chapters planned
            </p>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
                <Edit className="size-3.5" />
                Edit
              </Button>
            )}
            {onRegenerate && (
              <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-1.5">
                <Sparkles className="size-3.5" />
                Regenerate
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5">
                <Download className="size-3.5" />
                Export
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {chapterPlan?.map((chapter, index) => {
            const isExpanded = expandedChapters.has(index);
            const wordRange = chapter.target_min_words && chapter.target_max_words
              ? `${chapter.target_min_words}-${chapter.target_max_words}`
              : chapter.length || 'Standard';

            return (
              <div
                key={index}
                className="rounded-lg border border-border/60 bg-background/50 hover:bg-background/80 transition-colors"
              >
                <button
                  onClick={() => toggleChapter(index)}
                  className="flex w-full items-start gap-3 p-3 text-left"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-primary">
                        Ch. {index + 1}
                      </span>
                      {chapter.role && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {chapter.role}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {wordRange} words
                      </span>
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {chapter.title}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && chapter.summary && (
                  <div className="px-3 pb-3">
                    <p className="text-sm leading-7 text-muted-foreground">
                      {chapter.summary}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
