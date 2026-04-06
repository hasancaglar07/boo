"use client";

import { useEffect, useRef, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { runWorkflow } from "@/lib/dashboard-api";
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
) {
  const [titleOptions, setTitleOptions] = useState<TitleOption[]>([]);
  const [aiLoading, setAiLoading] = useState<"" | "title">("");
  const autoFillRef = useRef(false);

  async function handleTitleAi(forceReplace = false) {
    if (!draft.topic.trim()) {
      setError("Please clarify the topic first.");
      return;
    }

    setAiLoading("title");
    try {
      let suggestions = localTitleSuggestions(draft);

      const response = await runWorkflow({
        action: "topic_suggest",
        topic: draft.topic,
        audience: draft.audience || defaultAudience(draft.language),
        category: bookTypeLabel(draft.bookType),
        language: draft.language,
      });
      if (response.ok === false) {
        const message =
          (typeof response.output === "string" && response.output.trim()) ||
          "AI title suggestions failed.";
        throw new Error(message.split("\n").find(Boolean) || message);
      }

      const generatedPayload = response.generated as { titles?: Array<Record<string, unknown>> } | undefined;
      const generated = Array.isArray(generatedPayload?.titles) ? generatedPayload.titles : [];
      if (generated.length) {
        suggestions = generated.map((item) => ({
          title: String(item.title || "").trim(),
          subtitle: String(item.subtitle || "").trim(),
        }));
      }

      setTitleOptions(suggestions.filter((item) => item.title));
      if ((forceReplace || !draft.title.trim()) && suggestions[0]) {
        updateDraft({ title: suggestions[0].title, subtitle: suggestions[0].subtitle });
      }
      trackEvent("title_ai_used", { language: draft.language });
    } catch (error) {
      const suggestions = localTitleSuggestions(draft);
      setTitleOptions(suggestions);
      if (suggestions[0] && (forceReplace || !draft.title.trim())) {
        updateDraft({ title: suggestions[0].title, subtitle: suggestions[0].subtitle });
      }
      setError(error instanceof Error ? error.message : "AI title suggestions could not be retrieved.");
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