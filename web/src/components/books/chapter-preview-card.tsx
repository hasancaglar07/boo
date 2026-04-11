"use client";

import { ArrowRight, BookOpen, Clock, Edit, ChevronLeft, ChevronRight, Lock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(chapter.title);
  const [draftContent, setDraftContent] = useState(chapter.content || "");

  // Calculate word count from content if not provided
  const wordCount = chapter.wordCount || (chapter.content?.split(/\s+/).length || 0);
  const readingTime = Math.ceil(wordCount / 200); // Average 200 words per minute

  useEffect(() => {
    setIsEditing(false);
    setDraftTitle(chapter.title);
    setDraftContent(chapter.content || "");
  }, [chapter.number, chapter.title, chapter.content]);

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

  const handleSave = async () => {
    if (!onSaveEdit) return;
    await onSaveEdit({
      title: draftTitle.trim() || chapter.title,
      content: draftContent,
    });
    setIsEditing(false);
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden border-[#eadbce] bg-[linear-gradient(180deg,#fffdf9_0%,#fffaf5_100%)] shadow-[0_24px_80px_rgba(31,24,19,0.08)] transition-shadow duration-200 hover:shadow-[0_32px_90px_rgba(31,24,19,0.12)]">
        <CardContent className="p-6 md:p-8 lg:p-10">
        {/* Chapter header */}
        <div className="mb-6 flex items-start justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b6a59]">
              <BookOpen className="size-3.5 md:size-4" />
              Chapter {chapter.number || chapterIndex + 1}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1f1813]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {chapter.title}
            </h2>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {premium && (
              <Button variant="outline" size="sm" onClick={handleEdit} className="h-9 border-[#dcc5b4] bg-white/80 px-3 text-xs text-[#2f1f17] hover:bg-[#fff8f2]">
                <Edit className="mr-1.5 md:mr-2 size-3.5" />
                <span className="hidden sm:inline">{allowInlineEdit ? "Quick Edit" : "Edit"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-md md:prose-lg mb-6 max-w-none" style={{ fontFamily: "'Source Serif Pro', serif", lineHeight: "1.9" }}>
          {isEditing ? (
            <div className="not-prose space-y-4 rounded-[24px] border border-[#eadbce] bg-white/85 p-4 md:p-5">
              <div className="grid gap-3">
                <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} className="h-11 border-[#dcc5b4] bg-white" />
                <Textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  rows={14}
                  className="min-h-[320px] resize-y border-[#dcc5b4] bg-white text-sm leading-7 text-[#2f1f17]"
                />
              </div>
              <div className="flex flex-wrap justify-between gap-3">
                <div className="text-xs text-[#8b6a59]">{draftContent.split(/\s+/).filter(Boolean).length.toLocaleString()} words</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isSavingEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => void handleSave()} disabled={isSavingEdit}>
                    {isSavingEdit ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          ) : chapter.content ? (
            <>
              <div className="text-sm md:text-[17px] text-[#2f1f17] whitespace-pre-wrap">{chapter.content}</div>

              {/* Lock overlay for partial content */}
              {chapter.partial && !premium && (
                <div className="relative mt-8 md:mt-10">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fffaf5]/85 to-[#fff8f2]" />
                  <div className="relative rounded-[24px] border border-[#eadbce] bg-[linear-gradient(180deg,rgba(255,248,242,0.82),rgba(255,252,247,0.98))] px-5 py-8 text-center shadow-[0_20px_50px_rgba(31,24,19,0.08)] md:px-8 md:py-10">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border border-[#dcc5b4] bg-white/85">
                      <Lock className="size-5 text-[#7f5a46]" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-[#1f1813] md:text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                      This is where the full book opens.
                    </h3>
                    <p className="mx-auto mb-5 max-w-xl text-sm leading-6 text-[#6f5547] md:text-base">
                      Unlock the rest of this chapter, all {totalChapters} chapters, PDF + EPUB exports, and the premium editing workspace in one step.
                    </p>
                    <div className="mb-5 grid gap-2 text-left text-xs text-[#6f5547] sm:grid-cols-2 md:text-sm">
                      <div className="rounded-2xl border border-[#f0e3d8] bg-white/80 px-4 py-3">All remaining chapters</div>
                      <div className="rounded-2xl border border-[#f0e3d8] bg-white/80 px-4 py-3">PDF + EPUB downloads</div>
                      <div className="rounded-2xl border border-[#f0e3d8] bg-white/80 px-4 py-3">Front and back cover assets</div>
                      <div className="rounded-2xl border border-[#f0e3d8] bg-white/80 px-4 py-3">Book editing workspace</div>
                    </div>
                    <Button size="lg" onClick={handleUnlock} className="h-12 w-full sm:w-auto">
                      <Sparkles className="mr-2 size-4" />
                      Unlock Full Book for $4
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-10 text-center text-[#6f5547] md:py-12">
              <BookOpen className="mx-auto mb-3 size-6 md:size-8 opacity-50" />
              <div className="text-xs font-semibold uppercase tracking-[0.16em] md:text-sm">Sample is being prepared</div>
              <p className="mt-2 text-xs md:text-sm">This page refreshes automatically when the first readable section is ready.</p>
            </div>
          )}
        </div>

        {/* Chapter footer */}
        <div className="flex flex-col gap-3 border-t border-[#eadbce] pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:pt-6">
          {/* Word count and reading time */}
          <div className="flex items-center gap-3 text-xs text-[#8b6a59] md:gap-4">
            {wordCount > 0 && (
              <>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="size-3.5" />
                  <span>{wordCount.toLocaleString()} words</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span>{readingTime} min read</span>
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 sm:self-end">
            {onPreviousChapter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPreviousChapter}
                disabled={chapterIndex === 0}
                className="h-9 px-3 text-xs text-[#2f1f17] hover:bg-white/70"
              >
                <ChevronLeft className="mr-1 size-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
            )}
            {onNextChapter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNextChapter}
                disabled={chapterIndex >= totalChapters - 1}
                className="h-9 px-3 text-xs text-[#2f1f17] hover:bg-white/70"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="ml-1 size-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}
