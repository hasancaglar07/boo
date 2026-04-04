"use client";

import { useEffect, useRef, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { loadSettings, providerLooksReady, runWorkflow } from "@/lib/dashboard-api";
import {
  bookTypeLabel,
  isTurkishLanguage,
  localTitleSuggestions,
  type FunnelDraft,
  type FunnelLanguage,
} from "@/lib/funnel-draft";

function defaultAudience(language: FunnelLanguage) {
  return isTurkishLanguage(language) ? "genel okur" : "general readers";
}

export type TitleOption = { title: string; subtitle: string };

export function useTitleAi(
  draft: FunnelDraft,
  ready: boolean,
  step: string,
  updateDraft: (changes: Partial<FunnelDraft>) => void,
  setError: (msg: string) => void,
  stepHref: (step: "topic" | "title" | "outline" | "style" | "generate") => string,
) {
  const [titleOptions, setTitleOptions] = useState<TitleOption[]>([]);
  const [aiLoading, setAiLoading] = useState<"" | "title">("");
  const autoFillRef = useRef(false);

  async function handleTitleAi(forceReplace = false) {
    if (!draft.topic.trim()) {
      setError("Önce konuyu netleştir.");
      return;
    }

    setAiLoading("title");
    try {
      const settings = await loadSettings().catch(() => null);
      let suggestions = localTitleSuggestions(draft);

      if (settings && providerLooksReady(settings)) {
        const response = await runWorkflow({
          action: "topic_suggest",
          topic: draft.topic,
          audience: draft.audience || defaultAudience(draft.language),
          category: bookTypeLabel(draft.bookType),
          language: draft.language,
        });
        const generatedPayload = response.generated as { titles?: Array<Record<string, unknown>> } | undefined;
        const generated = Array.isArray(generatedPayload?.titles) ? generatedPayload.titles : [];
        if (generated.length) {
          suggestions = generated.map((item) => ({
            title: String(item.title || "").trim(),
            subtitle: String(item.subtitle || "").trim(),
          }));
        }
      }

      setTitleOptions(suggestions.filter((item) => item.title));
      if ((forceReplace || !draft.title.trim()) && suggestions[0]) {
        updateDraft({ title: suggestions[0].title, subtitle: suggestions[0].subtitle });
      }
      trackEvent("title_ai_used", { language: draft.language });
    } catch {
      const suggestions = localTitleSuggestions(draft);
      setTitleOptions(suggestions);
      if (suggestions[0] && (forceReplace || !draft.title.trim())) {
        updateDraft({ title: suggestions[0].title, subtitle: suggestions[0].subtitle });
      }
      trackEvent("title_ai_used", { fallback: true });
    } finally {
      setAiLoading("");
    }
  }

  async function handleSubtitleAi() {
    if (!titleOptions.length) {
      await handleTitleAi();
      return;
    }
    const nextOption = titleOptions.find((item) => item.subtitle && item.subtitle !== draft.subtitle) || titleOptions[0];
    updateDraft({ subtitle: nextOption.subtitle });
    trackEvent("subtitle_ai_used", { language: draft.language });
  }

  // Auto-fill title on first visit
  useEffect(() => {
    if (!ready || step !== "title" || autoFillRef.current) return;
    autoFillRef.current = true;
    const local = localTitleSuggestions(draft);
    if (!draft.title.trim() && local[0]) {
      setTitleOptions(local);
      updateDraft({ title: local[0].title, subtitle: local[0].subtitle || draft.subtitle });
    } else if (!titleOptions.length) {
      setTitleOptions(local);
    }
    if (!draft.topic.trim()) return;
    void handleTitleAi(true);
  }, [ready, step]);

  return {
    titleOptions,
    setTitleOptions,
    aiLoading,
    handleTitleAi,
    handleSubtitleAi,
  };
}
