"use client";

import { ChevronDown, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import { formatChapterReference } from "@/lib/book-language";
import {
  bookLengthLabel,
  chapterLengthLabel,
  chapterRoleLabel,
  chapterWordRange,
  CHAPTER_LENGTHS,
  CHAPTER_ROLES,
  isTurkishLanguage,
  type FunnelBookLength,
  type FunnelChapterLength,
  type FunnelChapterRole,
  type FunnelDraft,
  type FunnelOutlineItem,
} from "@/lib/funnel-draft";
import { cn } from "@/lib/utils";

const BOOK_LENGTHS: FunnelBookLength[] = ["compact", "standard", "extended"];

const BOOK_LENGTH_ESTIMATES: Record<FunnelBookLength, string> = {
  compact: "~15k",
  standard: "~30k",
  extended: "~50k",
};

function formatWordCount(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.max(0, Math.round(value)));
}

function defaultChapterReference(language: string, number: number) {
  return formatChapterReference(language, number);
}

function clampOpenIndexes(length: number, current: number[]) {
  return current.filter((index) => index >= 0 && index < length);
}

export function OutlineStep({
  draft,
  onUpdate,
  onUpdateOutline,
  onNext,
  onBack,
  onAiGenerate,
  error,
  aiLoading,
  wordEstimate,
}: {
  draft: FunnelDraft;
  onUpdate: (changes: Partial<FunnelDraft>) => void;
  onUpdateOutline: (index: number, changes: Partial<FunnelOutlineItem>) => void;
  onNext: () => void;
  onBack: () => void;
  onAiGenerate: () => Promise<void>;
  error: string;
  aiLoading: "" | "outline";
  wordEstimate: { min: number; max: number };
}) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  useEffect(() => {
    setOpenIndexes((current) => {
      const next = clampOpenIndexes(draft.outline.length, current);
      if (!next.length && draft.outline.length) return [0];
      return next;
    });
  }, [draft.outline.length]);

  function toggleChapter(index: number) {
    setOpenIndexes((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    );
  }

  function addChapter() {
    const nextIndex = draft.outline.length;
    onUpdate({
      outline: [
        ...draft.outline,
        {
          title: defaultChapterReference(draft.language, nextIndex + 1),
          summary: isTurkishLanguage(draft.language) ? "Brief purpose of this chapter." : "Short purpose of this chapter.",
          role: "core",
          length: draft.bookLength === "extended" ? "long" : "medium",
        },
      ],
    });
    setOpenIndexes((current) => [...new Set([...current, nextIndex])]);
    trackEvent("outline_manual_edited", { action: "add" });
  }

  function removeChapter(index: number) {
    onUpdate({
      outline: draft.outline.filter((_, itemIndex) => itemIndex !== index),
    });
    setOpenIndexes((current) => current.filter((item) => item !== index).map((item) => (item > index ? item - 1 : item)));
    trackEvent("outline_manual_edited", { action: "remove", index });
  }

  const avgWordEstimate = Math.round((wordEstimate.min + wordEstimate.max) / 2);
  const estimatedPages = Math.round(avgWordEstimate / 167);

  return (
    <form
      id="wizard-form"
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
      className="space-y-6"
    >
      {/* ── Word Count Estimate ── */}
      <p className="text-base font-medium text-muted-foreground rounded-xl bg-muted/50 px-4 py-3">
        📊 ~{formatWordCount(avgWordEstimate)} words · {draft.outline.length} chapter · ~{estimatedPages} pages
      </p>

      {/* ── Book Length Selector — Horizontal Pill Buttons ── */}
      <div>
        <label className="text-base sm:text-lg font-bold text-foreground mb-2 block">
          Book length target
        </label>
        <div className="flex flex-wrap gap-2">
          {BOOK_LENGTHS.map((value) => {
            const isSelected = draft.bookLength === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isSelected}
                className={cn(
                  "h-12 rounded-2xl px-5 text-sm sm:text-base font-semibold border transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border/60 hover:border-primary/30",
                )}
                onClick={() => onUpdate({ bookLength: value })}
              >
                {bookLengthLabel(value, draft.language)}{" "}
                <span className="opacity-60">({BOOK_LENGTH_ESTIMATES[value]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chapter Plan Header ── */}
      <div className="flex items-center justify-between gap-3">
        <label className="text-base sm:text-lg font-bold text-foreground">
          Chapter Plan
        </label>
        <button
          type="button"
          onClick={() => void onAiGenerate()}
          disabled={aiLoading === "outline"}
          className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary/8 border border-primary/20 px-5 text-sm sm:text-base font-semibold text-primary hover:bg-primary/15 active:scale-[0.97] transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          <Sparkles className="size-4" />
          {aiLoading === "outline" ? "Generateuluyor…" : "✨ AI ile Generate"}
        </button>
      </div>

      {/* ── Chapter Accordion ── */}
      <div className="space-y-2">
        {draft.outline.map((item, index) => {
          const isOpen = openIndexes.includes(index);
          const wordRange = chapterWordRange(item.length, draft.bookLength);

          return (
            <div
              key={`${index}-${item.title}`}
              className={cn(
                "rounded-2xl border transition-all duration-200",
                isOpen
                  ? "border-primary/30 bg-card"
                  : "border-border/50 bg-card hover:border-primary/15",
              )}
            >
              {/* Collapsed / Expandable header */}
              <button
                type="button"
                onClick={() => toggleChapter(index)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3.5 text-left",
                  isOpen && "border-b border-border/40",
                )}
                aria-expanded={isOpen}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-base font-medium text-foreground">
                  {item.title || defaultChapterReference(draft.language, index + 1)}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground/50 transition-transform duration-200",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              {/* Expanded content */}
              {isOpen ? (
                <div className="px-4 pb-5 pt-4">
                  <div className="space-y-5">
                    {/* Title */}
                    <div>
                      <label
                        htmlFor={`outline-title-${index}`}
                        className="text-sm font-bold text-muted-foreground mb-2 block"
                      >
                        Title
                      </label>
                      <Input
                        id={`outline-title-${index}`}
                        value={item.title}
                        onChange={(event) => onUpdateOutline(index, { title: event.target.value })}
                        placeholder="Chapter title"
                        className="h-11 text-sm px-3 rounded-xl"
                      />
                    </div>

                    {/* Summary */}
                    <div>
                      <label
                        htmlFor={`outline-summary-${index}`}
                        className="text-sm font-bold text-muted-foreground mb-2 block"
                      >
                        Summary
                      </label>
                      <Textarea
                        id={`outline-summary-${index}`}
                        value={item.summary}
                        onChange={(event) => onUpdateOutline(index, { summary: event.target.value })}
                        placeholder="What will be covered in this chapter?"
                        rows={3}
                        className="min-h-[80px] text-sm px-3 py-2.5 rounded-xl resize-none leading-relaxed"
                      />
                    </div>

                    {/* Role + Length row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor={`outline-role-${index}`}
                          className="text-sm font-bold text-muted-foreground mb-2 block"
                        >
                          Rol
                        </label>
                        <select
                          id={`outline-role-${index}`}
                          value={item.role}
                          onChange={(event) => onUpdateOutline(index, { role: event.target.value as FunnelChapterRole })}
                          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring/50 focus:ring-2 focus:ring-ring/20"
                        >
                          {CHAPTER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {chapterRoleLabel(role, draft.language)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor={`outline-length-${index}`}
                          className="text-sm font-bold text-muted-foreground mb-2 block"
                        >
                          Derinlik
                        </label>
                        <select
                          id={`outline-length-${index}`}
                          value={item.length}
                          onChange={(event) => onUpdateOutline(index, { length: event.target.value as FunnelChapterLength })}
                          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring/50 focus:ring-2 focus:ring-ring/20"
                        >
                          {CHAPTER_LENGTHS.map((length) => (
                            <option key={length} value={length}>
                              {chapterLengthLabel(length, draft.language)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Bottom row: word estimate + delete */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">
                        ≈ {formatWordCount(wordRange.min)}–{formatWordCount(wordRange.max)} words
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto gap-1 px-2 text-sm text-destructive/60 hover:text-destructive"
                        disabled={draft.outline.length <= 3}
                        onClick={() => removeChapter(index)}
                      >
                        <Trash2 className="size-3.5" />
                        🗑️ Sil
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* ── Add Chapter Button ── */}
      <button
        type="button"
        onClick={addChapter}
        className="w-full h-12 rounded-2xl border border-dashed border-border/60 px-5 text-base font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
      >
        <Plus className="size-4 inline-block mr-1.5 -mt-0.5" />
        Add Chapter
      </button>

      {/* ── Error ── */}
      {error ? (
        <p role="alert" className="text-sm text-red-500 rounded-xl px-4 py-3 bg-destructive/5">
          {error}
        </p>
      ) : null}
    </form>
  );
}