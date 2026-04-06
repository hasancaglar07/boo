"use client";

import { Sparkles } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FunnelDraft } from "@/lib/funnel-draft";
import type { TitleOption } from "@/components/funnel/hooks/use-title-ai";

export function TitleStep({
  draft,
  onUpdate,
  onNext,
  onBack,
  error,
  titleOptions,
  onAiSuggest,
  onSubtitleAi,
  aiLoading,
  appShell,
}: {
  draft: FunnelDraft;
  onUpdate: (changes: Partial<FunnelDraft>) => void;
  onNext: () => void;
  onBack: () => void;
  error: string;
  titleOptions: TitleOption[];
  onAiSuggest: () => Promise<void>;
  onSubtitleAi: () => Promise<void>;
  aiLoading: "" | "title";
  appShell: boolean;
}) {
  return (
    <form
      id="wizard-form"
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
      className="space-y-7"
    >
      {/* ── Title input ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="title"
            className="text-base sm:text-lg font-bold text-foreground"
          >
            Title
          </label>
          <button
            type="button"
            onClick={() => void onAiSuggest()}
            disabled={aiLoading === "title"}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 border border-primary/15 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15 active:scale-[0.97] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            ✨
            <Sparkles className="size-3.5" />
            {aiLoading === "title" ? "Suggesting…" : "AI Suggest"}
          </button>
        </div>
        <Input
          id="title"
          value={draft.title}
          onChange={(event) => onUpdate({ title: event.target.value })}
          placeholder="Write your book title..."
          className="h-14 sm:h-16 text-lg sm:text-xl font-semibold rounded-2xl px-5"
          autoFocus
        />
      </div>

      {/* ── AI-generated title option cards ── */}
      {titleOptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            AI Suggestions
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
            {titleOptions.map((option) => {
              const isSelected =
                draft.title === option.title &&
                draft.subtitle === option.subtitle;

              return (
                <button
                  key={`${option.title}-${option.subtitle}`}
                  type="button"
                  className={`
                    group shrink-0 snap-start text-left
                    rounded-2xl border px-5 py-4 min-w-[200px]
                    cursor-pointer transition-all active:scale-[0.97]
                    ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border/60 bg-card hover:border-primary/40"
                    }
                  `}
                  onClick={() =>
                    onUpdate({ title: option.title, subtitle: option.subtitle })
                  }
                >
                  <div className="text-base sm:text-lg font-medium text-foreground leading-snug whitespace-nowrap">
                    {option.title}
                  </div>
                  {option.subtitle ? (
                    <div className="mt-1 text-sm leading-relaxed text-muted-foreground/80 max-w-[240px] truncate">
                      {option.subtitle}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Subtitle input ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="subtitle"
            className="text-base sm:text-lg font-bold text-foreground"
          >
            Subtitle{" "}
            <span className="font-normal text-muted-foreground/60">
              (optional)
            </span>
          </label>
          <button
            type="button"
            onClick={() => void onSubtitleAi()}
            disabled={aiLoading === "title"}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 border border-primary/15 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15 active:scale-[0.97] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            ✨
            <Sparkles className="size-3.5" />
            Get Suggestions
          </button>
        </div>
        <Textarea
          id="subtitle"
          value={draft.subtitle}
          onChange={(event) => onUpdate({ subtitle: event.target.value })}
          placeholder="Alt başlık ekle (optional)..."
          rows={3}
          className="min-h-[120px] text-base sm:text-lg font-medium rounded-2xl px-5 py-4 resize-none"
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <p
          role="alert"
          className="text-sm sm:text-base text-red-500 rounded-xl px-4 py-3 bg-destructive/5 mt-2"
        >
          ⚠️ {error}
        </p>
      )}
    </form>
  );
}