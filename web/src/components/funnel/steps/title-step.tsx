"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FunnelDraft } from "@/lib/funnel-draft";
import type { TitleOption, TitleSuggestionSource } from "@/components/funnel/hooks/use-title-ai";

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
  suggestionSource,
  suggestionIsRefining,
  appShell,
  onDraftTouched,
  onSuggestionApplied,
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
  suggestionSource: TitleSuggestionSource;
  suggestionIsRefining: boolean;
  appShell: boolean;
  onDraftTouched: () => void;
  onSuggestionApplied: () => void;
}) {
  const t = useTranslations("FunnelTitleStep");

  const suggestionStatusLabel =
    suggestionSource === "glm_refined"
      ? t("aiRefined")
      : suggestionIsRefining
        ? t("aiIsRefining")
        : t("fastSuggestionsReady");

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
            {t("titleLabel")}
          </label>
          <button
            type="button"
            onClick={() => void onAiSuggest()}
            disabled={aiLoading === "title"}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 border border-primary/15 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15 active:scale-[0.97] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            ✨
            <Sparkles className="size-3.5" />
            {aiLoading === "title" ? t("suggesting") : t("aiSuggest")}
          </button>
        </div>
        <Input
          id="title"
          value={draft.title}
          onChange={(event) => {
            onDraftTouched();
            onUpdate({ title: event.target.value });
          }}
          placeholder={t("titlePlaceholder")}
          className="h-14 sm:h-16 text-lg sm:text-xl font-semibold rounded-2xl px-5"
          autoFocus
        />
      </div>

      {/* ── AI-generated title option cards ── */}
      {titleOptions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">
              {t("aiSuggestions")}
            </p>
            <span className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              {suggestionStatusLabel}
            </span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
            {titleOptions.map((option) => {
              const isSelected =
                draft.title === option.title &&
                draft.subtitle === option.subtitle;

              return (
                <button
                  key={`${option.title}-${option.subtitle}`}
                  type="button"
                  aria-pressed={isSelected}
                  title={isSelected ? t("selectedSuggestion") : t("applySuggestion")}
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
                  onClick={() => {
                    onSuggestionApplied();
                    onUpdate({ title: option.title, subtitle: option.subtitle })
                  }}
                >
                  <div className="text-base sm:text-lg font-medium text-foreground leading-snug whitespace-nowrap">
                    {option.title}
                  </div>
                  {option.subtitle ? (
                    <div className="mt-1 text-sm leading-relaxed text-muted-foreground/80 max-w-[240px] truncate">
                      {option.subtitle}
                    </div>
                  ) : null}
                  <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/55">
                    {isSelected ? t("selected") : t("tapToApply")}
                  </div>
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
            {t("subtitleLabel")}{" "}
            <span className="font-normal text-muted-foreground/60">
              {t("subtitleOptional")}
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
            {t("getSuggestions")}
          </button>
        </div>
        <Textarea
          id="subtitle"
          value={draft.subtitle}
          onChange={(event) => {
            onDraftTouched();
            onUpdate({ subtitle: event.target.value });
          }}
          placeholder={t("subtitlePlaceholder")}
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
