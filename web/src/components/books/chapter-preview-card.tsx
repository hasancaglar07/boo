"use client";

import { ArrowRight, BookOpen, Clock, Edit, ChevronLeft, ChevronRight, Lock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ChapterPreviewCardProps {
  chapter: {
    number?: number;
    title: string;
    content?: string;
    partial?: boolean;
    wordCount?: number;
  };
  chapterIndex: number;
  totalChapters: number;
  bookSlug: string;
  premium: boolean;
  onPreviousChapter?: () => void;
  onNextChapter?: () => void;
  allowInlineEdit?: boolean;
  onSaveEdit?: (draft: { title: string; content: string }) => Promise<void>;
  isSavingEdit?: boolean;
}

export function ChapterPreviewCard({
  chapter,
  chapterIndex,
  totalChapters,
  bookSlug,
  premium,
  onPreviousChapter,
  onNextChapter,
  allowInlineEdit = false,
  onSaveEdit,
  isSavingEdit = false,
}: ChapterPreviewCardProps) {
  const t = useTranslations("ChapterPreviewCard");
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [draftTitle, setDraftTitle] = useState(chapter.title);
  const [draftContent, setDraftContent] = useState(chapter.content || "");

  // Word count — only from saved data for footer (not draft)
  const wordCount = chapter.wordCount ?? (chapter.content ? chapter.content.split(/\s+/).filter(Boolean).length : 0);
  // Only show reading time for complete (non-partial) chapters
  const readingTime = !chapter.partial && wordCount > 0 ? Math.ceil(wordCount / 200) : null;

  // Sync draft when chapter changes externally — but only when not dirty
  useEffect(() => {
    if (!isDirty) {
      setDraftTitle(chapter.title);
      setDraftContent(chapter.content || "");
    }
    // Reset editing state on chapter switch regardless (guard below handles dirty)
    setIsEditing(false);
    setIsDirty(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter.number]);

  // Guard navigation with unsaved changes prompt
  const guardNavigation = (callback?: () => void) => {
    if (!callback) return undefined;
    return () => {
      if (isEditing && isDirty) {
        // Simple, reliable guard — browser native
        // eslint-disable-next-line no-alert
        const confirmed = window.confirm(t("unsavedChangesWarning"));
        if (!confirmed) return;
        setIsDirty(false);
        setIsEditing(false);
      }
      callback();
    };
  };

  const handleEdit = () => {
    if (allowInlineEdit) {
      setIsEditing(true);
      return;
    }
    router.push(`/app/book/${bookSlug}/workspace?tab=writing&subtab=editor&chapter=${chapter.number || chapterIndex + 1}`);
  };

  const handleUnlock = () => {
    router.push(`/app/book/${bookSlug}/upgrade`);
  };

  const handleCancel = () => {
    setDraftTitle(chapter.title);
    setDraftContent(chapter.content || "");
    setIsDirty(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!onSaveEdit) return;
    await onSaveEdit({
      title: draftTitle.trim() || chapter.title,
      content: draftContent,
    });
    setIsDirty(false);
    setIsEditing(false);
  };

  const editLabel = allowInlineEdit ? t("quickEdit") : t("edit");

  return (
    <Card className="overflow-hidden border-[#eadbce] bg-[linear-gradient(180deg,#fffdf9_0%,#fffaf5_100%)] shadow-[0_24px_80px_rgba(31,24,19,0.08)]">
      <CardContent className="p-6 md:p-8 lg:p-10">
        {/* Chapter header */}
        <div className="mb-6 flex items-start justify-between gap-3 md:gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b6a59]">
              <BookOpen className="size-3.5 md:size-4" />
              {t("chapterLabel", { number: chapter.number || chapterIndex + 1 })}
            </div>
            {/* h3 — the page already has h1 (title) and h2 ("Read the Sample"), so chapter title is h3 */}
            <h3 className="text-2xl font-bold text-[#1f1813] md:text-3xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              {isEditing ? draftTitle : chapter.title}
            </h3>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {premium && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                aria-label={editLabel}
                className="h-9 border-[#dcc5b4] bg-white/80 px-3 text-xs text-[#2f1f17] hover:bg-[#fff8f2]"
              >
                <Edit className="size-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">{editLabel}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="mb-6" style={{ fontFamily: "'Source Serif Pro', serif", lineHeight: "1.9" }}>
          {isEditing ? (
            <div className="space-y-4 rounded-[24px] border border-[#eadbce] bg-white/85 p-4 md:p-5">
              <div className="grid gap-3">
                <Input
                  value={draftTitle}
                  onChange={(e) => { setDraftTitle(e.target.value); setIsDirty(true); }}
                  className="h-11 border-[#dcc5b4] bg-white text-base font-semibold"
                  aria-label={t("titleInputLabel")}
                />
                <Textarea
                  value={draftContent}
                  onChange={(e) => { setDraftContent(e.target.value); setIsDirty(true); }}
                  rows={14}
                  className="min-h-[320px] resize-y border-[#dcc5b4] bg-white text-sm leading-7 text-[#2f1f17]"
                  aria-label={t("contentInputLabel")}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#8b6a59]">
                  {draftContent.split(/\s+/).filter(Boolean).length.toLocaleString()} {t("words")}
                  {isDirty && <span className="ml-2 text-amber-600">· {t("unsaved")}</span>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSavingEdit}>
                    {t("cancel")}
                  </Button>
                  <Button size="sm" onClick={() => void handleSave()} disabled={isSavingEdit || !isDirty}>
                    {isSavingEdit ? t("saving") : t("save")}
                  </Button>
                </div>
              </div>
            </div>
          ) : chapter.content ? (
            <>
              {/* Text content — wrap in relative for gradient overlay */}
              <div className={chapter.partial && !premium ? "relative" : ""}>
                <div className="text-sm text-[#2f1f17] whitespace-pre-wrap md:text-[17px]">
                  {chapter.content}
                </div>
                {/* Gradient fade over bottom of truncated text */}
                {chapter.partial && !premium && (
                  <div
                    className="pointer-events-none absolute bottom-0 left-0 right-0 h-40"
                    style={{ background: "linear-gradient(to bottom, transparent, #fffaf5)" }}
                    aria-hidden
                  />
                )}
              </div>

              {/* Lock card — appears below the faded content */}
              {chapter.partial && !premium && (
                <div className="mt-4 rounded-[24px] border border-[#eadbce] bg-[linear-gradient(180deg,rgba(255,248,242,0.82),rgba(255,252,247,0.98))] px-5 py-8 text-center shadow-[0_20px_50px_rgba(31,24,19,0.08)] md:px-8 md:py-10">
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-[#dcc5b4] bg-white/85">
                    <Lock className="size-5 text-[#7f5a46]" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-[#1f1813] md:text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {t("lockTitle")}
                  </h3>
                  <p className="mx-auto mb-6 max-w-xl text-sm leading-6 text-[#6f5547] md:text-base">
                    {t("lockDescription", { total: totalChapters })}
                  </p>
                  {/* CTA first on mobile for conversion, then feature grid */}
                  <Button size="lg" onClick={handleUnlock} className="mb-5 h-12 w-full sm:w-auto">
                    <Sparkles className="mr-2 size-4" />
                    {t("unlockFullBook")}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                  <div className="grid gap-2 text-left text-xs text-[#6f5547] sm:grid-cols-2 md:text-sm">
                    <div className="rounded-2xl border border-[#f0e3d8] bg-white/80 px-4 py-3">{t("featureAllChapters")}</div>
                    <div className="rounded-2xl border border-[#f0e3d8] bg-white/80 px-4 py-3">{t("featurePdfEpub")}</div>
                    <div className="rounded-2xl border border-[#f0e3d8] bg-white/80 px-4 py-3">{t("featureCovers")}</div>
                    <div className="rounded-2xl border border-[#f0e3d8] bg-white/80 px-4 py-3">{t("featureWorkspace")}</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-10 text-center text-[#6f5547] md:py-12">
              <BookOpen className="mx-auto mb-3 size-6 opacity-50 md:size-8" />
              <div className="text-xs font-semibold uppercase tracking-[0.16em] md:text-sm">{t("samplePreparing")}</div>
              <p className="mt-2 text-xs md:text-sm">{t("samplePreparingDesc")}</p>
            </div>
          )}
        </div>

        {/* Chapter footer */}
        <div className="flex flex-col gap-3 border-t border-[#eadbce] pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:pt-6">
          {/* Word count and reading time */}
          <div className="flex items-center gap-3 text-xs text-[#8b6a59] md:gap-4">
            {wordCount > 0 && (
              <div className="flex items-center gap-1.5">
                <BookOpen className="size-3.5" />
                <span>{wordCount.toLocaleString()} {t("words")}</span>
              </div>
            )}
            {/* Only show reading time for complete chapters */}
            {readingTime !== null && (
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                <span>{readingTime} {t("minRead")}</span>
              </div>
            )}
            {chapter.partial && !premium && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
                {t("partialPreview")}
              </span>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 sm:self-end">
            {onPreviousChapter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={guardNavigation(onPreviousChapter)}
                disabled={chapterIndex === 0}
                className="h-9 px-3 text-xs text-[#2f1f17] hover:bg-white/70"
              >
                <ChevronLeft className="mr-1 size-4" />
                <span className="hidden sm:inline">{t("previous")}</span>
              </Button>
            )}
            {onNextChapter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={guardNavigation(onNextChapter)}
                disabled={chapterIndex >= totalChapters - 1}
                className="h-9 px-3 text-xs text-[#2f1f17] hover:bg-white/70"
              >
                <span className="hidden sm:inline">{t("next")}</span>
                <ChevronRight className="ml-1 size-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
