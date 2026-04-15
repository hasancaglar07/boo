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

function defaultTopic(language: FunnelLanguage) {
  return isTurkishLanguage(language) ? "kitap fikri" : "book idea";
}

export type TitleOption = { title: string; subtitle: string };
export type TitleSuggestionSource = "local_fast" | "glm_refined";

function normalizeTitleOptions(items: TitleOption[]) {
  const seen = new Set<string>();
  return items
    .map((item) => ({
      title: String(item.title || "").trim(),
      subtitle: String(item.subtitle || "").trim(),
    }))
    .filter((item) => {
      if (!item.title) return false;
      const key = `${item.title}::${item.subtitle}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function useTitleAi(
  draft: FunnelDraft,
  ready: boolean,
  step: string,
  updateDraft: (changes: Partial<FunnelDraft>) => void,
  setError: (msg: string) => void,
) {
  const [titleOptions, setTitleOptions] = useState<TitleOption[]>([]);
  const [aiLoading, setAiLoading] = useState<"" | "title">("");
  const [source, setSource] = useState<TitleSuggestionSource>("local_fast");
  const [isRefining, setIsRefining] = useState(false);
  const [selectionLocked, setSelectionLocked] = useState(false);
  const autoFillRef = useRef(false);
  const draftRef = useRef(draft);
  const selectionLockedRef = useRef(selectionLocked);
  const requestIdRef = useRef(0);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    selectionLockedRef.current = selectionLocked;
  }, [selectionLocked]);

  async function handleTitleAi(forceReplace = false) {
    const effectiveTopic =
      draftRef.current.topic.trim()
      || draftRef.current.title.trim()
      || defaultTopic(draftRef.current.language);

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const requestSnapshot = {
      title: draftRef.current.title.trim(),
      subtitle: draftRef.current.subtitle.trim(),
    };

    setAiLoading("title");
    setIsRefining(true);
    try {
      let suggestions = normalizeTitleOptions(localTitleSuggestions(draftRef.current));
      setTitleOptions(suggestions);
      setSource("local_fast");
      trackEvent("title_suggestions_fallback_shown", { language: draftRef.current.language, count: suggestions.length });
      if (suggestions[0] && (forceReplace || !requestSnapshot.title)) {
        updateDraft({ title: suggestions[0].title, subtitle: suggestions[0].subtitle });
      }

      const response = await runWorkflow({
        action: "topic_suggest",
        topic: effectiveTopic,
        audience: draftRef.current.audience || defaultAudience(draftRef.current.language),
        category: bookTypeLabel(draftRef.current.bookType),
        language: draftRef.current.language,
      }, {
        timeoutMs: 70_000,
        retryDelaysMs: [],
      });
      if (response.ok === false) {
        const message =
          (typeof response.output === "string" && response.output.trim()) ||
          "AI title suggestions failed.";
        throw new Error(message.split("\n").find(Boolean) || message);
      }

      const generatedPayload = response.generated as
        | {
            titles?: Array<Record<string, unknown>>;
            suggestions?: Array<Record<string, unknown>>;
            title_suggestions?: Array<Record<string, unknown>>;
            fallback?: boolean;
            source?: string;
          }
        | undefined;
      const usedTemplateFallback =
        Boolean(generatedPayload?.fallback) ||
        String(generatedPayload?.source || "").trim() === "local_template";
      const generatedRaw = generatedPayload?.titles
        || generatedPayload?.suggestions
        || generatedPayload?.title_suggestions
        || [];
      const generated = Array.isArray(generatedRaw) ? generatedRaw : [];
      if (generated.length) {
        suggestions = normalizeTitleOptions(generated.map((item) => ({
          title: String(item.title || "").trim(),
          subtitle: String(item.subtitle || "").trim(),
        })));
      }

      if (requestId !== requestIdRef.current) {
        return;
      }
      setTitleOptions(suggestions);
      setSource(usedTemplateFallback ? "local_fast" : "glm_refined");
      const currentDraft = draftRef.current;
      const selectionChanged =
        selectionLockedRef.current ||
        currentDraft.title.trim() !== requestSnapshot.title ||
        currentDraft.subtitle.trim() !== requestSnapshot.subtitle;
      if (
        suggestions[0] &&
        (
          !currentDraft.title.trim() ||
          (forceReplace && !selectionChanged)
        )
      ) {
        updateDraft({ title: suggestions[0].title, subtitle: suggestions[0].subtitle });
      }
      setError("");
      if (!usedTemplateFallback) {
        trackEvent("title_suggestions_refined", { language: draftRef.current.language, count: suggestions.length });
      }
      trackEvent("title_ai_used", { language: draftRef.current.language });
    } catch {
      const suggestions = normalizeTitleOptions(localTitleSuggestions(draftRef.current));
      if (requestId !== requestIdRef.current) {
        return;
      }
      setTitleOptions(suggestions);
      setSource("local_fast");
      if (suggestions[0] && (forceReplace || !draftRef.current.title.trim())) {
        updateDraft({ title: suggestions[0].title, subtitle: suggestions[0].subtitle });
      }
      setError("");
      trackEvent("workflow_timeout", { action: "topic_suggest" });
      trackEvent("title_ai_used", { fallback: true, language: draftRef.current.language });
    } finally {
      if (requestId === requestIdRef.current) {
        setAiLoading("");
        setIsRefining(false);
      }
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
    const local = normalizeTitleOptions(localTitleSuggestions(draft));
    if (!draft.title.trim() && local[0]) {
      setTitleOptions(local);
      setSource("local_fast");
      updateDraft({ title: local[0].title, subtitle: local[0].subtitle || draft.subtitle });
    } else if (!titleOptions.length) {
      setTitleOptions(local);
      setSource("local_fast");
    }
    if (!draft.topic.trim()) return;
    void handleTitleAi(true);
  }, [ready, step]);

  return {
    titleOptions,
    setTitleOptions,
    aiLoading,
    source,
    isRefining,
    selectionLocked,
    lockSelection: () => setSelectionLocked(true),
    unlockSelection: () => setSelectionLocked(false),
    handleTitleAi,
    handleSubtitleAi,
  };
}
