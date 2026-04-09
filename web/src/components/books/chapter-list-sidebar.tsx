"use client";

import { CheckCircle2, FileText, Lock, Loader2, PenTool, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SkeletonCard } from "@/components/ui/loading";

export interface ChapterItem {
  number?: number;
  title: string;
  status?: "complete" | "writing" | "pending" | "locked";
  wordCount?: number;
}

interface ChapterListSidebarProps {
  chapters: ChapterItem[];
  selectedChapterIndex: number;
  onSelectChapter: (index: number) => void;
  bookSlug: string;
  premium: boolean;
  visibleSectionCount: number;
  lockedSectionCount: number;
  isLoading?: boolean;
}

export function ChapterListSidebar({
  chapters,
  selectedChapterIndex,
  onSelectChapter,
  bookSlug,
  premium,
  visibleSectionCount,
  lockedSectionCount,
  isLoading = false,
}: ChapterListSidebarProps) {
  const router = useRouter();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const handleEditChapter = (chapterIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const chapter = chapters[chapterIndex];

    // If locked, show upgrade prompt
    if (chapter.status === "locked") {
      router.push(`/app/book/${bookSlug}/checkout?from=preview`);
      return;
    }

    // Navigate to workspace writing tab
    router.push(
      `/app/book/${bookSlug}/workspace?tab=writing&subtab=editor&chapter=${chapter.number || chapterIndex + 1}`
    );
  };

  const getStatusIcon = (status?: ChapterItem["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />;
      case "writing":
        return <Loader2 className="size-4 text-primary animate-spin shrink-0" />;
      case "locked":
        return <Lock className="size-4 text-amber-600 shrink-0" />;
      default:
        return <FileText className="size-4 text-muted-foreground shrink-0" />;
    }
  };

  const getStatusText = (status?: ChapterItem["status"]) => {
    switch (status) {
      case "complete":
        return "Ready";
      case "writing":
        return "Writing...";
      case "locked":
        return "Locked";
      default:
        return "Pending";
    }
  };

  // Skeleton loader
  if (isLoading) {
    return (
      <>
        {/* Desktop Sidebar Skeleton */}
        <Card className="border-border/50 bg-card hidden lg:block">
          <CardContent className="p-4 space-y-3">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <SkeletonCard className="h-4 w-16" />
              <SkeletonCard className="h-4 w-12" />
            </div>

            {/* Chapter list skeleton */}
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <SkeletonCard key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mobile button skeleton */}
        <div className="lg:hidden fixed bottom-20 right-4 z-50">
          <SkeletonCard className="h-14 w-14 rounded-full" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <Card className="border-border/50 bg-card hidden lg:block">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-foreground">Chapters</div>
            <div className="text-xs text-muted-foreground">
              {visibleSectionCount}/{chapters.length} visible
            </div>
          </div>

          {/* Chapter list */}
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {chapters.map((chapter, index) => {
              const isSelected = selectedChapterIndex === index;
              const isLocked = chapter.status === "locked";

              return (
                <button
                  key={chapter.number || index}
                  type="button"
                  onClick={() => !isLocked && onSelectChapter(index)}
                  disabled={isLocked}
                  className={`
                    w-full text-left rounded-lg px-3 py-2.5 transition-all duration-150
                    ${isSelected
                      ? "bg-primary/10 border border-primary/30 shadow-sm"
                      : "hover:bg-accent/50 border border-transparent"
                    }
                    ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      {/* Status icon */}
                      <div className="mt-0.5 shrink-0">{getStatusIcon(chapter.status)}</div>

                      {/* Chapter info */}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground truncate">
                          {chapter.number && <span className="mr-1 text-muted-foreground">{chapter.number}.</span>}
                          {chapter.title}
                        </div>

                        {/* Status and word count */}
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{getStatusText(chapter.status)}</span>
                          {chapter.wordCount && (
                            <>
                              <span>·</span>
                              <span>{chapter.wordCount} words</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Edit button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEditChapter(index, e)}
                      className="h-7 px-2 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                    >
                      <PenTool className="size-3" />
                    </Button>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Locked chapters notice */}
          {!premium && lockedSectionCount > 0 && (
            <div className="pt-3 border-t">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
                <div className="flex items-start gap-2">
                  <Lock className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200">
                    <div className="font-medium">Premium chapters</div>
                    <div className="mt-0.5 text-[10px] leading-tight">
                      {lockedSectionCount} chapters locked. Unlock to read and edit all content.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="pt-3 border-t space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start h-9"
              onClick={() => router.push(`/app/book/${bookSlug}/workspace?tab=writing`)}
            >
              <PenTool className="mr-2 size-4" />
              Edit Full Book
            </Button>

            {premium && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-9"
                onClick={() => router.push(`/app/book/${bookSlug}/workspace?tab=book`)}
              >
                <FileText className="mr-2 size-4" />
                Customize Covers
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile Bottom Sheet Dialog */}
      <div className="lg:hidden">
        <Button
          size="lg"
          className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg shadow-primary/30"
          aria-label="View chapters"
          onClick={() => setIsMobileSheetOpen(true)}
        >
          <List className="size-6" />
        </Button>

        <Dialog open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <DialogContent className="max-h-[80vh] overflow-y-auto rounded-t-3xl border-t-0 bottom-0 mt-auto translate-y-0 max-w-full">
            <DialogHeader>
              <DialogTitle>Chapters</DialogTitle>
              <DialogDescription>
                {visibleSectionCount} of {chapters.length} chapters visible
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-4 pb-20">
              {/* Chapter list */}
              <div className="space-y-2">
                {chapters.map((chapter, index) => {
                  const isSelected = selectedChapterIndex === index;
                  const isLocked = chapter.status === "locked";

                  return (
                    <button
                      key={chapter.number || index}
                      type="button"
                      onClick={() => {
                        if (!isLocked) {
                          onSelectChapter(index);
                          setIsMobileSheetOpen(false);
                        }
                      }}
                      disabled={isLocked}
                      className={`
                        w-full text-left rounded-xl px-4 py-4 transition-all duration-150
                        ${isSelected
                          ? "bg-primary/10 border-2 border-primary/30 shadow-md"
                          : "bg-card border-2 border-border hover:border-primary/20"
                        }
                        ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer active:scale-[0.98]"}
                      `}
                      style={{ minHeight: "64px" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Status icon */}
                          <div className="mt-0.5 shrink-0">{getStatusIcon(chapter.status)}</div>

                          {/* Chapter info */}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-foreground">
                              {chapter.number && <span className="mr-1 text-muted-foreground">{chapter.number}.</span>}
                              {chapter.title}
                            </div>

                            {/* Status and word count */}
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{getStatusText(chapter.status)}</span>
                              {chapter.wordCount && (
                                <>
                                  <span>·</span>
                                  <span>{chapter.wordCount} words</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Edit button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditChapter(index, e);
                          }}
                          className="h-10 w-10 shrink-0"
                        >
                          <PenTool className="size-4" />
                        </Button>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Locked chapters notice */}
              {!premium && lockedSectionCount > 0 && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <Lock className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900 dark:text-amber-200">
                      <div className="font-semibold">Premium chapters</div>
                      <div className="mt-1 text-xs leading-tight">
                        {lockedSectionCount} chapters locked. Unlock to read and edit all content.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="pt-4 border-t space-y-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-start h-12"
                  onClick={() => router.push(`/app/book/${bookSlug}/workspace?tab=writing`)}
                >
                  <PenTool className="mr-3 size-5" />
                  <span className="text-sm font-medium">Edit Full Book</span>
                </Button>

                {premium && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start h-12"
                    onClick={() => router.push(`/app/book/${bookSlug}/workspace?tab=book`)}
                  >
                    <FileText className="mr-3 size-5" />
                    <span className="text-sm font-medium">Customize Covers</span>
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
