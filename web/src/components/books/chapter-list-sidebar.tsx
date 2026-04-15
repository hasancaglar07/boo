"use client";

import { CheckCircle2, ImagePlus, Lock, Loader2, PenTool, List, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("ChapterListSidebar");
  const router = useRouter();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const handleEditChapter = (chapterIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const chapter = chapters[chapterIndex];
    if (chapter.status === "locked") {
      router.push(`/app/book/${bookSlug}/upgrade`);
      return;
    }
    router.push(
      `/app/book/${bookSlug}/workspace?tab=writing&subtab=editor&chapter=${chapter.number || chapterIndex + 1}`
    );
  };

  const handleChapterKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    chapterIndex: number,
    isLocked: boolean,
    closeSheet = false,
  ) => {
    if (isLocked) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectChapter(chapterIndex);
      if (closeSheet) setIsMobileSheetOpen(false);
    }
  };

  const getStatusIcon = (status?: ChapterItem["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />;
      case "writing":
        return <Loader2 className="size-4 shrink-0 animate-spin text-primary" />;
      case "locked":
        return <Lock className="size-4 shrink-0 text-amber-600" />;
      default:
        return <FileText className="size-4 shrink-0 text-muted-foreground" />;
    }
  };

  const getStatusText = (status?: ChapterItem["status"]) => {
    switch (status) {
      case "complete": return t("statusReady");
      case "writing":  return t("statusWriting");
      case "locked":   return t("statusLocked");
      default:         return t("statusPending");
    }
  };

  // Shared chapter item renderer — same structure for desktop and mobile
  const renderChapterItem = (
    chapter: ChapterItem,
    index: number,
    opts: { mobile?: boolean; closeSheet?: boolean } = {}
  ) => {
    const isSelected = selectedChapterIndex === index;
    const isLocked = chapter.status === "locked";
    const editLabel = `${t("editFullBook")}: ${chapter.title}`;

    return (
      <div
        key={chapter.number ?? index}
        role="button"
        tabIndex={isLocked ? -1 : 0}
        aria-disabled={isLocked}
        aria-pressed={isSelected}
        aria-label={chapter.title}
        onClick={() => {
          if (!isLocked) {
            onSelectChapter(index);
            if (opts.closeSheet) setIsMobileSheetOpen(false);
          }
        }}
        onKeyDown={(e) => handleChapterKeyDown(e, index, isLocked, opts.closeSheet)}
        className={`
          group w-full text-left rounded-xl border px-3 transition-all duration-150
          ${opts.mobile ? "py-3.5" : "py-2.5"}
          ${isSelected
            ? "border-primary/30 bg-primary/10 shadow-sm"
            : "border-transparent hover:border-border/50 hover:bg-accent/50"
          }
          ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
          ${opts.mobile ? "active:scale-[0.99]" : ""}
        `}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <div className="mt-0.5 shrink-0">{getStatusIcon(chapter.status)}</div>
            <div className="min-w-0 flex-1">
              <div className={`truncate font-medium text-foreground ${opts.mobile ? "text-sm" : "text-xs"}`}>
                {chapter.number && (
                  <span className="mr-1 text-muted-foreground">{chapter.number}.</span>
                )}
                {chapter.title}
              </div>
              <div className={`mt-0.5 flex items-center gap-1.5 text-muted-foreground ${opts.mobile ? "text-xs" : "text-[10px]"}`}>
                <span>{getStatusText(chapter.status)}</span>
                {chapter.wordCount ? (
                  <>
                    <span>·</span>
                    <span>{chapter.wordCount.toLocaleString()} {t("words")}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Edit button — always has aria-label, visible on focus/hover on desktop, always visible on mobile */}
          {premium && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleEditChapter(index, e)}
              aria-label={editLabel}
              className={`
                shrink-0 text-muted-foreground hover:text-foreground
                ${opts.mobile ? "h-9 w-9" : "h-7 w-7 opacity-0 focus:opacity-100 group-hover:opacity-100"}
              `}
            >
              <PenTool className={opts.mobile ? "size-4" : "size-3"} />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <>
        <Card className="hidden border-border/50 bg-card lg:block">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <SkeletonCard className="h-4 w-16" />
              <SkeletonCard className="h-4 w-12" />
            </div>
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <SkeletonCard key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="fixed bottom-6 right-4 z-50 lg:hidden">
          <SkeletonCard className="h-14 w-14 rounded-full" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <Card className="hidden border-border/50 bg-card lg:block">
        <CardContent className="flex flex-col gap-3 p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-foreground">{t("chaptersHeader")}</div>
            {chapters.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {t("visibleCount", { visible: visibleSectionCount, total: chapters.length })}
              </div>
            )}
          </div>

          {/* Chapter list — flex-col, no fixed max-height trap */}
          <div className="space-y-1">
            {chapters.map((chapter, index) => renderChapterItem(chapter, index))}
          </div>

          {/* Locked notice + CTA together — no gap between them */}
          {!premium && lockedSectionCount > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                <div className="text-xs text-amber-900 dark:text-amber-200">
                  <div className="font-medium">{t("whatUnlockAdds")}</div>
                  <div className="mt-0.5 leading-tight text-[10px]">
                    {t("lockedChaptersNotice", { count: lockedSectionCount })}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                className="mt-2 w-full h-8 text-xs"
                onClick={() => router.push(`/app/book/${bookSlug}/upgrade`)}
              >
                <Lock className="mr-1.5 size-3" />
                {t("unlockFullBook")}
              </Button>
            </div>
          )}

          {/* Quick actions */}
          <div className="space-y-2 border-t pt-3">
            {premium ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full justify-start"
                  onClick={() => router.push(`/app/book/${bookSlug}/workspace?tab=writing`)}
                >
                  <PenTool className="mr-2 size-4" />
                  {t("editFullBook")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full justify-start"
                  onClick={() => router.push(`/app/book/${bookSlug}/workspace?tab=book`)}
                >
                  {/* ImagePlus is semantically correct for cover/image operations */}
                  <ImagePlus className="mr-2 size-4" />
                  {t("customizeCovers")}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="h-9 w-full justify-start"
                onClick={() => router.push(`/app/book/${bookSlug}/upgrade`)}
              >
                <Lock className="mr-2 size-4" />
                {t("unlockFullBook")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Mobile ──────────────────────────────────────────── */}
      <div className="lg:hidden">
        {/* FAB — bottom-6 with safe-area, avoids browser toolbar collision */}
        <Button
          size="lg"
          className="fixed bottom-6 right-4 z-50 h-14 w-14 rounded-full shadow-lg shadow-primary/30 pb-safe"
          aria-label={t("viewChaptersAriaLabel")}
          onClick={() => setIsMobileSheetOpen(true)}
          style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}
        >
          <List className="size-6" />
        </Button>

        {/* Sheet — using Dialog but with proper sheet styling */}
        <Dialog open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <DialogContent className="bottom-0 mt-auto max-h-[85dvh] max-w-full overflow-y-auto rounded-b-none rounded-t-3xl border-b-0">
            <DialogHeader>
              <DialogTitle>{t("dialogTitle")}</DialogTitle>
              <DialogDescription>
                {t("dialogDescription", { visible: visibleSectionCount, total: chapters.length })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pb-8">
              {/* Chapter list */}
              <div className="space-y-2">
                {chapters.map((chapter, index) =>
                  renderChapterItem(chapter, index, { mobile: true, closeSheet: true })
                )}
              </div>

              {/* Locked notice */}
              {!premium && lockedSectionCount > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 size-5 shrink-0 text-amber-600" />
                    <div className="text-sm text-amber-900 dark:text-amber-200">
                      {/* Same translation key as desktop — no duplicated i18n */}
                      <div className="font-medium">{t("whatUnlockAdds")}</div>
                      <div className="mt-1 text-xs leading-tight">
                        {t("lockedChaptersNotice", { count: lockedSectionCount })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="space-y-3 border-t pt-4">
                {premium ? (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 w-full justify-start"
                      onClick={() => router.push(`/app/book/${bookSlug}/workspace?tab=writing`)}
                    >
                      <PenTool className="mr-3 size-5" />
                      <span className="text-sm font-medium">{t("editFullBook")}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 w-full justify-start"
                      onClick={() => router.push(`/app/book/${bookSlug}/workspace?tab=book`)}
                    >
                      <ImagePlus className="mr-3 size-5" />
                      <span className="text-sm font-medium">{t("customizeCovers")}</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    size="lg"
                    className="h-12 w-full justify-start"
                    onClick={() => router.push(`/app/book/${bookSlug}/upgrade`)}
                  >
                    <Lock className="mr-3 size-5" />
                    <span className="text-sm font-medium">{t("unlockFullBook")}</span>
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
