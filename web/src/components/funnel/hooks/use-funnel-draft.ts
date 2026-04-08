"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { trackEvent, trackEventOnce } from "@/lib/analytics";
import {
  canOpenStep,
  createDefaultFunnelDraft,
  FUNNEL_STEPS,
  inferFunnelLanguageFromText,
  languageLabel,
  loadFunnelDraft,
  nextStep,
  normalizeFunnelDraft,
  normalizeFunnelLanguage,
  previousStep,
  saveFunnelDraft,
  stepIndex,
  type FunnelDraft,
  type FunnelOutlineItem,
  type FunnelStep,
  type FunnelBookType,
} from "@/lib/funnel-draft";
import { getAccount } from "@/lib/preview-auth";

export type AiLoadingState = "" | "title" | "outline" | "style" | "generate";

function normalizeRouteBase(routeBase: string) {
  const normalized = routeBase.trim().replace(/\/+$/, "");
  return normalized || "/start";
}

function firstAllowedStep(draft: FunnelDraft, desired: FunnelStep) {
  const targetIndex = stepIndex(desired);
  for (let index = targetIndex; index >= 0; index -= 1) {
    const candidate = FUNNEL_STEPS[index];
    if (canOpenStep(draft, candidate)) return candidate;
  }
  return "topic";
}

export function useFunnelDraft(step: FunnelStep, routeBase = "/start", appShellEnabled = false) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<FunnelDraft>(() => createDefaultFunnelDraft());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const normalizedRouteBase = normalizeRouteBase(routeBase);

  const topicPrefillRef = useRef(false);

  function stepHref(target: FunnelStep) {
    return `${normalizedRouteBase}/${target}`;
  }

  // Load draft from localStorage on mount
  useEffect(() => {
    const stored = normalizeFunnelDraft(loadFunnelDraft());
    const allowedStep = firstAllowedStep(stored, step);
    if (allowedStep !== step) {
      router.replace(stepHref(allowedStep));
      return;
    }
    const account = getAccount();
    const nextDraft = {
      ...stored,
      currentStep: step,
      authorName: stored.authorName || account.name || "",
      imprint: stored.imprint || "Book Generator",
    };
    setDraft(nextDraft);
    saveFunnelDraft(nextDraft);
    setReady(true);
  }, [router, step, normalizedRouteBase]);

  // Save draft whenever it changes
  useEffect(() => {
    if (!ready) return;
    saveFunnelDraft({ ...draft, currentStep: step });
  }, [draft, ready, step]);

  // Prefill topic from URL params
  useEffect(() => {
    if (!ready || step !== "topic" || topicPrefillRef.current) return;
    topicPrefillRef.current = true;
    const topic = (searchParams.get("topic") || "").trim();
    const audience = (searchParams.get("audience") || "").trim();
    const languageParam = searchParams.get("language");
    const hasLanguageQuery = Boolean(languageParam);
    const language = normalizeFunnelLanguage(languageParam || undefined);
    const bookTypeParam = searchParams.get("bookType");
    // Map Turkish URL values to English type values
    const bookTypeMapping: Record<string, FunnelBookType> = {
      rehber: "guide",
      is: "business",
      egitim: "education",
      cocuk: "children",
      diger: "other",
    };
    const bookType: FunnelBookType = bookTypeParam
      ? (bookTypeMapping[bookTypeParam] || bookTypeParam as FunnelBookType)
      : "other";
    if (!topic && !audience && !bookTypeParam && !searchParams.get("language")) return;
    setDraft((current) => {
      const hasContent = Boolean(current.topic.trim() || current.audience.trim());
      return {
        ...current,
        topic: current.topic.trim() || topic,
        audience: current.audience.trim() || audience,
        language: hasLanguageQuery ? language : current.language,
        languageLocked: hasLanguageQuery ? true : current.languageLocked,
        bookType:
          hasContent
            ? current.bookType
            : bookType,
        updatedAt: new Date().toISOString(),
      };
    });
  }, [ready, searchParams, step]);

  // Auto-detect language from text inputs
  useEffect(() => {
    if (!ready || draft.languageLocked) return;
    const inferredLanguage = inferFunnelLanguageFromText(
      draft.title,
      draft.subtitle,
      draft.topic,
      draft.audience,
    );
    if (!inferredLanguage || inferredLanguage === draft.language) return;
    setDraft((current) => {
      if (current.languageLocked || current.language === inferredLanguage) return current;
      return {
        ...current,
        language: inferredLanguage,
        updatedAt: new Date().toISOString(),
      };
    });
  }, [
    draft.audience,
    draft.language,
    draft.languageLocked,
    draft.subtitle,
    draft.title,
    draft.topic,
    ready,
  ]);

  // Track wizard start
  useEffect(() => {
    if (step === "topic") {
      const source = appShellEnabled ? "app_new_topic" : "start_topic";
      trackEventOnce("wizard_started", { source }, { key: `wizard_started:${source}`, ttlMs: 15_000 });
    }
  }, [appShellEnabled, step]);

  const summary = useMemo(
    () => [
      { label: "Topic", value: draft.topic || "Not yet selected" },
      { label: "Title", value: draft.title || "Not yet selected" },
      { label: "Author", value: draft.authorName || "Not yet entered" },
      { label: "Dil", value: languageLabel(draft.language) },
      { label: "Length", value: draft.outline.length ? `${draft.outline.length} chapters` : "Not yet generated" },
    ],
    [draft.topic, draft.title, draft.authorName, draft.language, draft.outline.length],
  );

  function updateDraft(changes: Partial<FunnelDraft>) {
    setDraft((current) => {
      const currentTopic = current.topic.trim();
      const incomingTopic = typeof changes.topic === "string" ? changes.topic.trim() : currentTopic;
      const topicChanged = typeof changes.topic === "string" && incomingTopic !== currentTopic;
      const hasLanguageChange =
        typeof changes.language === "string" && changes.language !== current.language;
      const nextLanguageLocked =
        typeof changes.languageLocked === "boolean"
          ? changes.languageLocked
          : hasLanguageChange
            ? true
            : current.languageLocked;
      const shouldResetTopicDependents =
        topicChanged &&
        !Object.prototype.hasOwnProperty.call(changes, "title") &&
        !Object.prototype.hasOwnProperty.call(changes, "subtitle") &&
        !Object.prototype.hasOwnProperty.call(changes, "outline");
      return {
        ...current,
        ...changes,
        ...(shouldResetTopicDependents
          ? {
              title: "",
              subtitle: "",
              outline: [],
              generatedSlug: "",
              status: "draft" as const,
            }
          : topicChanged
            ? { generatedSlug: "" }
            : {}),
        languageLocked: nextLanguageLocked,
        updatedAt: new Date().toISOString(),
      };
    });
    setError("");
  }

  function updateOutline(index: number, changes: Partial<FunnelOutlineItem>) {
    setDraft((current) => ({
      ...current,
      outline: current.outline.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
      updatedAt: new Date().toISOString(),
    }));
    trackEvent("outline_manual_edited", { index });
  }

  function goBack() {
    const prev = previousStep(step);
    if (prev) router.push(stepHref(prev));
  }

  function goNext() {
    if (step === "topic") {
      if (!draft.languageLocked) {
        setError("Please select the book language first.");
        return;
      }
      if (!draft.topic.trim()) {
        setError("Topic cannot be empty.");
        return;
      }
      trackEvent("wizard_topic_completed", { language: draft.language });
    }

    if (step === "title" && !draft.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (step === "outline" && draft.outline.filter((item) => item.title.trim()).length < 3) {
      setError("At least 3 chapters are required.");
      return;
    }

    const next = nextStep(step);
    if (next) router.push(stepHref(next));
  }

  return {
    draft,
    ready,
    error,
    setError,
    updateDraft,
    updateOutline,
    goBack,
    goNext,
    summary,
    stepHref,
    normalizedRouteBase,
    router,
  };
}