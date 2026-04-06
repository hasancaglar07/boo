"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  bookTypeLabel,
  languageDescription,
  languageLabel,
  isTurkishLanguage,
  SUPPORTED_LANGUAGES,
  type FunnelBookType,
  type FunnelDraft,
  type FunnelLanguage,
} from "@/lib/funnel-draft";
import { ChoiceGrid } from "@/components/funnel/shared/choice-grid";

const BOOK_TYPES: FunnelBookType[] = ["rehber", "is", "egitim", "cocuk", "diger"];

const BOOK_TYPE_DESCRIPTIONS: Record<FunnelBookType, string> = {
  rehber: "Step-by-step, clear and actionable flow.",
  is: "Strong narrative for expertise, consulting, or brand authority.",
  egitim: "Instructive, example-based and more systematic approach.",
  cocuk: "Warmer, rhythmic and simpler narrative style.",
  diger: "Flexible space for custom topics or hybrid narratives.",
};

export function TopicStep({
  draft,
  onUpdate,
  onNext,
  error,
}: {
  draft: FunnelDraft;
  onUpdate: (changes: Partial<FunnelDraft>) => void;
  onNext: () => void;
  error: string;
  onError: (msg: string) => void;
}) {
  const topicPlaceholder = isTurkishLanguage(draft.language)
    ? "Write your book topic... E.g.: AI content generation, Digital marketing guide..."
    : "Write your book topic... e.g. AI-assisted content creation, practical digital marketing playbook...";
  const audiencePlaceholder = isTurkishLanguage(draft.language)
    ? "e.g.: beginner players and parents"
    : "example: first-time founders and content creators";

  return (
    <form id="wizard-form" onSubmit={(e) => { e.preventDefault(); onNext(); }} className="space-y-8">
      {/* ─── Language selector — FIRST REQUIRED STEP ─── */}
      <div className="space-y-2.5">
        <label htmlFor="language" className="text-base sm:text-lg font-bold text-foreground">
          Book language
        </label>
        <select
          id="language"
          value={draft.language}
          onChange={(event) =>
            onUpdate({
              language: event.target.value as FunnelLanguage,
              languageLocked: true,
            })}
          className="h-14 w-full rounded-2xl px-4 text-base bg-card text-foreground outline-none border-2 border-border/70 shadow-sm focus-visible:border-primary/40 focus-visible:shadow-md"
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <option key={language.value} value={language.value}>
              {language.label}
            </option>
          ))}
        </select>
        <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-2.5">
          <span className="font-medium text-foreground/80">{languageLabel(draft.language)}</span> — {languageDescription(draft.language)}
        </p>
      </div>

      {/* ─── Topic textarea — HERO of the page ─── */}
      <div className="space-y-2.5">
        <label
          htmlFor="topic"
          className="text-base sm:text-lg font-bold text-foreground"
        >
          What is your book about?
        </label>
        <Textarea
          id="topic"
          name="topic"
          value={draft.topic}
          onChange={(event) => onUpdate({ topic: event.target.value })}
          placeholder={topicPlaceholder}
          rows={4}
          autoFocus
          className="resize-none text-lg sm:text-xl leading-8 placeholder:text-lg placeholder:text-muted-foreground/50 min-h-[200px] sm:min-h-[240px] px-5 py-4 rounded-2xl border-2 border-border/70 bg-background shadow-sm focus-visible:border-primary/40 focus-visible:shadow-md focus-visible:ring-primary/20 transition-all duration-200"
        />
        <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-2.5">
          💡 When you write a clear topic, title suggestions and chapter plan are generated automatically.
        </p>
      </div>

      {/* ─── Book type — visual cards ─── */}
      <div className="space-y-3">
        <div className="text-base font-bold text-foreground">
          Book type
        </div>
        <ChoiceGrid
          values={BOOK_TYPES}
          selected={draft.bookType}
          labelFor={(value) => bookTypeLabel(value)}
          descriptionFor={(value) => BOOK_TYPE_DESCRIPTIONS[value]}
          onSelect={(value) => onUpdate({ bookType: value })}
          columns="grid-cols-2"
        />
      </div>

      {/* ─── Target audience — optional ─── */}
      <div className="space-y-2.5">
        <label
          htmlFor="audience"
          className="text-base sm:text-lg font-bold text-foreground"
        >
          Hedef okur{" "}
          <span className="font-normal text-muted-foreground/50">
            (isteğe bağlı)
          </span>
        </label>
        <Input
          id="audience"
          name="audience"
          value={draft.audience}
          onChange={(event) => onUpdate({ audience: event.target.value })}
          placeholder={audiencePlaceholder}
          className="h-14 text-base rounded-2xl px-4 border-2"
        />
        <button
          type="button"
          className="text-sm py-2 px-4 text-muted-foreground underline underline-offset-2 decoration-muted-foreground/30 hover:text-foreground hover:decoration-foreground transition-all duration-200 rounded-lg hover:bg-muted/50"
          onClick={() =>
            onUpdate({
              topic:
                draft.topic ||
                (isTurkishLanguage(draft.language)
                  ? "an authority book guide for consultants who want to turn their expertise into a book"
                  : "authority book playbook for consultants who want to turn expertise into a book"),
              audience:
                draft.audience ||
                (isTurkishLanguage(draft.language)
                  ? "coaches, consultants, and course creators"
                  : "coaches, consultants, and course creators"),
            })
          }
        >
          Fill Example
        </button>
      </div>

      {/* ─── Error display ─── */}
      {error ? (
        <div role="alert" className="text-sm sm:text-base text-destructive bg-destructive/5 rounded-xl px-4 py-3 flex items-start gap-2">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      ) : null}
    </form>
  );
}
