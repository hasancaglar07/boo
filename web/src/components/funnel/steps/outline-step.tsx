"use client";

import { ChevronDown, GripVertical, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { ChoiceGrid } from "@/components/funnel/shared/choice-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import { formatChapterReference } from "@/lib/book-language";
import {
  bookLengthDescription,
  bookLengthLabel,
  chapterLengthLabel,
  chapterRoleDescription,
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
          summary: isTurkishLanguage(draft.language) ? "Bu bölümün kısa amacı." : "Short purpose of this chapter.",
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[24px] border border-border/80 bg-background/72 p-5">
          <div className="text-sm font-semibold text-foreground">Kitap uzunluğu hedefi</div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Önce kitabın toplam ritmini belirle. Sonra bölümler bu hedefe göre daha dengeli dağılır.
          </p>
          <div className="mt-4">
            <ChoiceGrid
              values={BOOK_LENGTHS}
              selected={draft.bookLength}
              labelFor={(value) => bookLengthLabel(value, draft.language)}
              descriptionFor={(value) => bookLengthDescription(value, draft.language)}
              onSelect={(value) => onUpdate({ bookLength: value })}
              columns="sm:grid-cols-3"
            />
          </div>
        </div>

        <div className="rounded-[24px] border border-primary/12 bg-primary/5 p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Tahmini toplam hacim
          </div>
          <div className="mt-3 text-3xl font-semibold text-foreground">
            {formatWordCount(wordEstimate.min)}-{formatWordCount(wordEstimate.max)}
          </div>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">kelime</div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-border/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
              style={{ width: `${Math.min(100, (wordEstimate.max / 80000) * 100)}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[18px] border border-border/60 bg-background/60 px-3 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Bölüm sayısı</div>
              <div className="mt-1 font-semibold text-foreground">{draft.outline.length} bölüm</div>
            </div>
            <div className="rounded-[18px] border border-border/60 bg-background/60 px-3 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Durum</div>
              <div className="mt-1 font-semibold text-foreground">
                {draft.outline.filter((item) => item.title.trim()).length >= 3 ? "Hazır görünüyor" : "Biraz daha netleştir"}
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {isTurkishLanguage(draft.language)
              ? "Açılış ve kapanış bölümleri daha kısa olabilir. Taşıyıcı bölümler doğal olarak daha fazla alan alır."
              : "Opening and closing chapters can stay shorter. Core chapters naturally take more room."}
          </p>
        </div>
      </div>

      <div className="rounded-[24px] border border-border/80 bg-card/60 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">Bölüm planı editörü</div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              AI ile iskeleti oluştur, sonra sadece gerekli bölümleri açıp düzenle. Böylece ekran daha sakin kalır.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void onAiGenerate()} isLoading={aiLoading === "outline"}>
              <Sparkles className="mr-1.5 size-3.5" />
              AI ile oluştur
            </Button>
            <Button size="sm" variant="outline" onClick={addChapter}>
              + Bölüm ekle
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {draft.outline.map((item, index) => {
          const isOpen = openIndexes.includes(index);
          const wordRange = chapterWordRange(item.length, draft.bookLength);

          return (
            <div
              key={`${index}-${item.title}`}
              className={cn(
                "overflow-hidden rounded-[24px] border transition-all duration-200",
                isOpen ? "border-primary/25 bg-primary/[0.035] shadow-sm" : "border-border/70 bg-card hover:border-primary/15",
              )}
            >
              <button
                type="button"
                onClick={() => toggleChapter(index)}
                className="flex w-full items-start gap-4 px-4 py-4 text-left sm:px-5"
                aria-expanded={isOpen}
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-[15px] font-semibold text-foreground">
                      {item.title || defaultChapterReference(draft.language, index + 1)}
                    </div>
                    <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {chapterRoleLabel(item.role, draft.language)}
                    </span>
                    <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {chapterLengthLabel(item.length, draft.language)}
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {item.summary || (isTurkishLanguage(draft.language) ? "Bu bölüm için kısa bir amaç yazısı ekleyebilirsin." : "Add a short purpose summary for this chapter.")}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-primary/12 bg-primary/[0.06] px-3 py-1 text-[11px] font-semibold text-primary">
                      {formatWordCount(wordRange.min)}-{formatWordCount(wordRange.max)} kelime
                    </span>
                    <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[11px] text-muted-foreground">
                      {chapterRoleDescription(item.role, draft.language)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2">
                  <GripVertical className="hidden size-4 text-muted-foreground/45 sm:block" />
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </div>
              </button>

              {isOpen ? (
                <div className="border-t border-border/60 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label htmlFor={`outline-title-${index}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Bölüm başlığı
                        </label>
                        <Input
                          id={`outline-title-${index}`}
                          value={item.title}
                          onChange={(event) => onUpdateOutline(index, { title: event.target.value })}
                          placeholder="Bölüm başlığı"
                          className="h-11 font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor={`outline-summary-${index}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Bölüm özeti
                        </label>
                        <Textarea
                          id={`outline-summary-${index}`}
                          value={item.summary}
                          onChange={(event) => onUpdateOutline(index, { summary: event.target.value })}
                          placeholder="Bu bölümde ne anlatılacak?"
                          rows={4}
                          className="resize-none text-sm leading-6"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-[20px] border border-border/60 bg-background/70 p-3">
                        <label htmlFor={`outline-role-${index}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Bölüm rolü
                        </label>
                        <select
                          id={`outline-role-${index}`}
                          value={item.role}
                          onChange={(event) => onUpdateOutline(index, { role: event.target.value as FunnelChapterRole })}
                          className="mt-2 flex h-10 w-full rounded-[14px] border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring/50 focus:ring-2 focus:ring-ring/20"
                        >
                          {CHAPTER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {chapterRoleLabel(role, draft.language)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rounded-[20px] border border-border/60 bg-background/70 p-3">
                        <label htmlFor={`outline-length-${index}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Bölüm derinliği
                        </label>
                        <select
                          id={`outline-length-${index}`}
                          value={item.length}
                          onChange={(event) => onUpdateOutline(index, { length: event.target.value as FunnelChapterLength })}
                          className="mt-2 flex h-10 w-full rounded-[14px] border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring/50 focus:ring-2 focus:ring-ring/20"
                        >
                          {CHAPTER_LENGTHS.map((length) => (
                            <option key={length} value={length}>
                              {chapterLengthLabel(length, draft.language)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rounded-[20px] border border-primary/12 bg-primary/[0.05] p-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Tahmini bölüm hacmi
                        </div>
                        <div className="mt-2 text-sm font-semibold text-foreground">
                          {formatWordCount(wordRange.min)}-{formatWordCount(wordRange.max)} kelime
                        </div>
                        <div className="mt-1 text-xs leading-5 text-muted-foreground">
                          {chapterRoleDescription(item.role, draft.language)}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 justify-start px-3 text-destructive hover:text-destructive"
                        disabled={draft.outline.length <= 3}
                        onClick={() => removeChapter(index)}
                      >
                        Bölümü sil
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {error ? (
        <div role="alert" className="rounded-[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button variant="ghost" size="lg" onClick={onBack}>
          Geri
        </Button>
        <Button size="lg" onClick={onNext}>
          Stil ve Kapak Yönünü Seç
        </Button>
      </div>
    </div>
  );
}
