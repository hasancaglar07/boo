"use client";

import { BookOpen, Clock, Edit, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
}

export function ChapterPreviewCard({
  chapter,
  chapterIndex,
  totalChapters,
  bookSlug,
  premium,
  onPreviousChapter,
  onNextChapter,
}: ChapterPreviewCardProps) {
  const router = useRouter();

  // Calculate word count from content if not provided
  const wordCount = chapter.wordCount || (chapter.content?.split(/\s+/).length || 0);
  const readingTime = Math.ceil(wordCount / 200); // Average 200 words per minute

  const handleEdit = () => {
    router.push(
      `/app/book/${bookSlug}/workspace?tab=writing&subtab=editor&chapter=${chapter.number || chapterIndex + 1}`
    );
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="shadow-lg transition-shadow duration-200 hover:shadow-xl">
        <CardContent className="p-6 md:p-8">
        {/* Chapter header */}
        <div className="mb-4 md:mb-6 flex items-start justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              <BookOpen className="size-3.5 md:size-4" />
              Chapter {chapter.number || chapterIndex + 1}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              {chapter.title}
            </h2>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {premium && (
              <Button variant="outline" size="sm" onClick={handleEdit} className="h-9 px-3 text-xs">
                <Edit className="mr-1.5 md:mr-2 size-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-md md:prose-lg max-w-none mb-4 md:mb-6" style={{ fontFamily: "'Source Serif Pro', serif", lineHeight: "1.8" }}>
          {chapter.content ? (
            <>
              <div className="text-sm md:text-base text-foreground whitespace-pre-wrap">{chapter.content}</div>

              {/* Lock overlay for partial content */}
              {chapter.partial && !premium && (
                <div className="relative mt-6 md:mt-8">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
                  <div className="relative flex flex-col items-center justify-center py-8 md:py-12 text-center px-4">
                    <Lock className="size-10 md:size-12 text-muted-foreground mb-3 md:mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
                      Continue Reading
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-4 max-w-sm">
                      Unlock full access to read the complete chapter and all {totalChapters} chapters
                    </p>
                    <Button
                      size="lg"
                      onClick={() => router.push(`/app/book/${bookSlug}/checkout?from=preview`)}
                      className="w-full sm:w-auto"
                    >
                      <Lock className="mr-2 size-4" />
                      Unlock Full Book
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 md:py-12 text-muted-foreground">
              <BookOpen className="mx-auto mb-3 size-6 md:size-8 opacity-50" />
              <div className="text-xs md:text-sm font-semibold">Content is being generated...</div>
              <p className="mt-2 text-xs">This will appear automatically when ready.</p>
            </div>
          )}
        </div>

        {/* Chapter footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-4 md:pt-6 border-t">
          {/* Word count and reading time */}
          <div className="flex items-center gap-3 md:gap-4 text-xs text-muted-foreground">
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
                className="h-9 px-3 text-xs"
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
                className="h-9 px-3 text-xs"
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
