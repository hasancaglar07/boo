"use client";

import { Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LiveBookCard } from "@/components/funnel/shared/live-book-card";
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
    <div className="space-y-8">
      {!appShell ? <LiveBookCard draft={draft} /> : null}

      {/* AI action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => void onAiSuggest()} isLoading={aiLoading === "title"}>
          <Sparkles className="mr-1.5 size-3.5" />
          Başlık öner
        </Button>
        <Button size="sm" variant="outline" onClick={() => void onSubtitleAi()}>
          <Wand2 className="mr-1.5 size-3.5" />
          Alt başlık öner
        </Button>
      </div>

      {/* Title input */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-semibold text-foreground">
          Başlık
        </label>
        <Input
          id="title"
          value={draft.title}
          onChange={(event) => onUpdate({ title: event.target.value })}
          placeholder="örnek: Minecraft Oyun Rehberi"
          className="h-12 text-base font-medium"
          autoFocus
        />
      </div>

      {/* Subtitle input */}
      <div className="space-y-2">
        <label htmlFor="subtitle" className="text-sm font-semibold text-foreground">
          Alt başlık <span className="font-normal text-muted-foreground">(isteğe bağlı)</span>
        </label>
        <Textarea
          id="subtitle"
          value={draft.subtitle}
          onChange={(event) => onUpdate({ subtitle: event.target.value })}
          placeholder="örnek: Hayatta kalma, inşa ve macera için başlangıçtan ileri seviyeye Türkçe rehber"
          rows={3}
          className="resize-none leading-7"
        />
      </div>

      {/* AI suggestions */}
      {titleOptions.length ? (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">AI önerileri</div>
          <div className="grid gap-2">
            {titleOptions.slice(0, 4).map((option) => (
              <button
                key={`${option.title}-${option.subtitle}`}
                type="button"
                className="group rounded-[20px] border border-border/70 bg-background/72 px-4 py-4 text-left transition-all duration-150 hover:scale-[1.005] hover:border-primary/25 hover:bg-accent hover:shadow-sm active:scale-[0.998]"
                onClick={() => onUpdate({ title: option.title, subtitle: option.subtitle })}
              >
                <div className="text-[15px] font-semibold text-foreground group-hover:text-foreground">{option.title}</div>
                {option.subtitle ? (
                  <div className="mt-1.5 text-sm leading-6 text-muted-foreground">{option.subtitle}</div>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="rounded-[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Navigation */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button variant="ghost" size="lg" onClick={onBack}>
          Geri
        </Button>
        <Button size="lg" onClick={onNext}>
          Bölüm Planını Oluştur
        </Button>
      </div>
    </div>
  );
}
