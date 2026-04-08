"use client";

import { ChevronDown, ChevronUp, Copy, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/admin/status-badge";
import { ChapterComments } from "@/components/writing/chapter-comments";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Chapter, ChapterState } from "@/lib/dashboard-api";

interface ChapterEditorProps {
  chapters: Chapter[];
  targetWords?: number;
  slug?: string;
  author?: string;
  onUpdate: (chapters: Chapter[]) => void;
  onChapterAction?: (action: string, index: number) => void;
}

const CHAPTER_STATE_OPTIONS: { value: ChapterState; label: string; status: string }[] = [
  { value: "draft", label: "Draft", status: "queued" },
  { value: "writing", label: "Writing", status: "processing" },
  { value: "review", label: "Review", status: "warning" },
  { value: "done", label: "Done", status: "completed" },
];

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function formatWordCount(count: number): string {
  if (count < 1000) return `${count}`;
  return `${(count / 1000).toFixed(1)}k`;
}

export function ChapterEditor({ chapters, targetWords = 2000, slug = "", author = "Author", onUpdate, onChapterAction }: ChapterEditorProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>(() => chapters.length > 0 ? [0] : []);

  function toggleChapter(index: number) {
    setOpenIndexes((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    );
  }

  function updateChapter(index: number, changes: Partial<Chapter>) {
    const next = [...chapters];
    next[index] = { ...next[index], ...changes };
    onUpdate(next);
  }

  function addChapter() {
    const nextIndex = chapters.length;
    const newChapter: Chapter = {
      title: `Chapter ${nextIndex + 1}`,
      content: "",
      state: "draft",
      target_words: targetWords,
    };
    onUpdate([...chapters, newChapter]);
    setOpenIndexes((current) => [...new Set([...current, nextIndex])]);
    onChapterAction?.("add", nextIndex);
  }

  function duplicateChapter(index: number) {
    const chapter = chapters[index];
    const newChapter: Chapter = {
      ...chapter,
      title: `${chapter.title} (copy)`,
    };
    const next = [...chapters];
    next.splice(index + 1, 0, newChapter);
    onUpdate(next);
    onChapterAction?.("duplicate", index);
  }

  function deleteChapter(index: number) {
    if (!confirm("Are you sure you want to delete this chapter?")) return;
    const next = chapters.filter((_, i) => i !== index);
    onUpdate(next);
    setOpenIndexes((current) => current.filter((item) => item !== index).map((item) => (item > index ? item - 1 : item)));
    onChapterAction?.("delete", index);
  }

  function moveChapter(index: number, direction: "up" | "down") {
    const next = [...chapters];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;

    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onUpdate(next);

    setOpenIndexes((current) => {
      const updated = current.map((item) => {
        if (item === index) return targetIndex;
        if (item === targetIndex) return index;
        return item;
      });
      return updated;
    });

    onChapterAction?.("move", index);
  }

  function expandAll() {
    setOpenIndexes(chapters.map((_, i) => i));
  }

  function collapseAll() {
    setOpenIndexes([]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">
          Chapters ({chapters.length})
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={expandAll} className="gap-1.5">
            <ChevronDown className="size-3.5" />
            Expand All
          </Button>
          <Button size="sm" variant="outline" onClick={collapseAll} className="gap-1.5">
            <ChevronUp className="size-3.5" />
            Collapse All
          </Button>
          <Button size="sm" onClick={addChapter} className="gap-1.5">
            <Plus className="size-3.5" />
            Add Chapter
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {chapters.map((chapter, index) => {
          const isOpen = openIndexes.includes(index);
          const wordCount = countWords(chapter.content || "");
          const target = chapter.target_words || targetWords;
          const progress = Math.min((wordCount / target) * 100, 100);
          const state = chapter.state || "draft";

          return (
            <Card key={index}>
              <CardContent className="p-4">
                {/* Chapter Header */}
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleChapter(index)}
                    className="shrink-0 rounded-lg border border-border/60 bg-muted/30 p-2 hover:bg-muted/50 transition-colors"
                  >
                    {isOpen ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </button>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Ch. {index + 1}
                      </span>
                      <StatusBadge status={CHAPTER_STATE_OPTIONS.find((s) => s.value === state)?.status || "queued"} size="sm" />
                      {wordCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {formatWordCount(wordCount)} / {formatWordCount(target)} words
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-medium text-foreground">
                      {chapter.title || "Untitled"}
                    </div>

                    {/* Progress Bar */}
                    {wordCount > 0 && (
                      <div className="space-y-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              progress >= 100
                                ? "bg-green-500"
                                : progress >= 50
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chapter Actions */}
                  <div className="flex items-center gap-1">
                    <ChapterComments
                      slug={slug}
                      chapterIndex={index}
                      chapterTitle={chapter.title || `Chapter ${index + 1}`}
                      author={author}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateChapter(index)}
                      className="h-8 w-8 p-0"
                      title="Duplicate chapter"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveChapter(index, "up")}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                      title="Move up"
                    >
                      <ChevronUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveChapter(index, "down")}
                      disabled={index === chapters.length - 1}
                      className="h-8 w-8 p-0"
                      title="Move down"
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteChapter(index)}
                      disabled={chapters.length === 1}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Delete chapter"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isOpen && (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Chapter Title</Label>
                        <Input
                          value={chapter.title}
                          onChange={(e) => updateChapter(index, { title: e.target.value })}
                          placeholder="Chapter title"
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <select
                          value={state}
                          onChange={(e) => updateChapter(index, { state: e.target.value as ChapterState })}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {CHAPTER_STATE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label>Content</Label>
                      <Textarea
                        value={chapter.content}
                        onChange={(e) => updateChapter(index, { content: e.target.value })}
                        placeholder="Start writing your chapter..."
                        rows={12}
                        className="resize-y"
                      />
                      <div className="mt-2 text-xs text-muted-foreground">
                        {formatWordCount(wordCount)} words · {formatWordCount(target)} target
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {chapters.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-sm text-muted-foreground">No chapters yet. Add your first chapter to get started.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
