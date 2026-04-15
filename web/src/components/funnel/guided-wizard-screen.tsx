"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { AppFrame } from "@/components/app/app-frame";
import { FunnelShell } from "@/components/funnel/funnel-shell";
import { useFunnelDraft } from "@/components/funnel/hooks/use-funnel-draft";
import { useTitleAi } from "@/components/funnel/hooks/use-title-ai";
import { GenerateStep } from "@/components/funnel/steps/generate-step";
import { OutlineStep } from "@/components/funnel/steps/outline-step";
import { StyleStep } from "@/components/funnel/steps/style-step";
import { TitleStep } from "@/components/funnel/steps/title-step";
import { TopicStep } from "@/components/funnel/steps/topic-step";
import { trackEvent } from "@/lib/analytics";
import {
  buildGuidedBookPayload,
  clearPendingGenerateIntent,
  clearFunnelDraft,
  enrichOutlineItems,
  isTurkishLanguage,
  loadPendingGenerateIntent,
  localOutlineSuggestions,
  localTitleSuggestions,
  outlineWordRange,
  saveFunnelDraft,
  savePendingGenerateIntent,
  suggestedStyleProfile,
  type FunnelDraft,
  type FunnelLanguage,
  type FunnelStep,
} from "@/lib/funnel-draft";
import {
  isBackendUnavailableError,
  runWorkflow,
  saveBook,
  startBookPreviewPipeline,
} from "@/lib/dashboard-api";
import { formatChapterReference } from "@/lib/book-language";
import { getAccount, getSession, getViewer, syncPreviewAuthState } from "@/lib/preview-auth";
import { pickRandomPublisherLogo } from "@/lib/publisher-logo-library";

const GENERATION_STAGES_COUNT = 4;

type OutlineSuggestionState = "idle" | "local_fast" | "glm_refined" | "failed";

const RANDOM_COVER_BRIEFS = [
  "Build • Launch • Grow",
  "Think • Design • Ship",
  "Guide • Practice • Improve",
  "Plan • Create • Publish",
];

const STYLE_COPY_BY_LANGUAGE: Partial<Record<FunnelLanguage, { authors: string[]; briefs: string[]; bios: string[] }>> = {
  Turkish: {
    authors: ["John Smith", "Emily Carter", "David Brooks", "Sarah Mitchell"],
    briefs: ["Clear • Strong • Fluent", "Learn • Apply • Grow", "Build • Strengthen • Advance"],
    bios: [
      "Independent author and content designer working on {topic}.",
      "Produces clear, actionable, and strong narratives in the {topic} field.",
      "Designs readable, modern, and result-oriented book workflows.",
    ],
  },
  English: {
    authors: ["Mina Cole", "Adrian West", "Lena Hart", "Noah Reed"],
    briefs: ["Clear • Modern • Useful", "Learn • Apply • Grow", "Build • Launch • Scale"],
    bios: [
      "Independent author creating practical frameworks around {topic}.",
      "Writes clear, modern and actionable books for ambitious readers.",
      "Focused on readable systems, strategy and execution-driven publishing.",
    ],
  },
};

function normalizeRouteBase(routeBase: string) {
  const normalized = routeBase.trim().replace(/\/+$/, "");
  return normalized || "/start";
}

function defaultAudience(language: FunnelLanguage) {
  return isTurkishLanguage(language) ? "general readers" : "general readers";
}

function defaultChapterReference(language: FunnelLanguage, number: number) {
  return formatChapterReference(language, number);
}

function workflowGenreLabel(bookType: FunnelDraft["bookType"]) {
  switch (bookType) {
    case "guide":
      return "guidebook";
    case "business":
      return "business";
    case "education":
      return "educational";
    case "children":
      return "children";
    default:
      return "general";
  }
}

function workflowStyleLabel(depth: FunnelDraft["depth"]) {
  switch (depth) {
    case "quick":
      return "concise";
    case "detailed":
      return "comprehensive";
    default:
      return "balanced";
  }
}

function workflowToneLabel(tone: FunnelDraft["tone"]) {
  switch (tone) {
    case "professional":
      return "professional";
    case "warm":
      return "warm";
    case "inspiring":
      return "inspiring";
    default:
      return "clear";
  }
}

function randomFrom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomCoverBrief() {
  return randomFrom(RANDOM_COVER_BRIEFS);
}

function normalizeTone(value: unknown, fallback: FunnelDraft["tone"]): FunnelDraft["tone"] {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "clear" || normalized === "professional" || normalized === "warm" || normalized === "inspiring") {
    return normalized;
  }
  return fallback;
}

function normalizeDepth(value: unknown, fallback: FunnelDraft["depth"]): FunnelDraft["depth"] {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "quick" || normalized === "balanced" || normalized === "detailed") {
    return normalized;
  }
  return fallback;
}

function normalizeCoverDirection(
  value: unknown,
  fallback: FunnelDraft["coverDirection"],
): FunnelDraft["coverDirection"] {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "editorial" || normalized === "tech" || normalized === "minimal" || normalized === "energetic") {
    return normalized;
  }
  if (normalized === "bold") {
    return "energetic";
  }
  return fallback;
}

function styleCopyForLanguage(language: FunnelLanguage) {
  return STYLE_COPY_BY_LANGUAGE[language] || STYLE_COPY_BY_LANGUAGE.English!;
}

function buildRandomStyleCopy(draft: FunnelDraft) {
  const copy = styleCopyForLanguage(draft.language);
  const topic = draft.topic.trim() || (isTurkishLanguage(draft.language) ? "your area of expertise" : "your topic");
  return {
    authorName: randomFrom(copy.authors),
    coverBrief: randomFrom(copy.briefs),
    authorBio: randomFrom(copy.bios).replace("{topic}", topic),
  };
}

export function GuidedWizardScreen({
  step,
  routeBase = "/start",
  shellMode = "funnel",
}: {
  step: FunnelStep;
  routeBase?: string;
  shellMode?: "funnel" | "app";
}) {
  const t = useTranslations("GuidedWizard");
  const appShellEnabled = shellMode === "app";
  const normalizedRouteBase = normalizeRouteBase(routeBase);
  const {
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
    router,
  } = useFunnelDraft(step, normalizedRouteBase, appShellEnabled);

  const {
    titleOptions,
    aiLoading: titleAiLoading,
    handleTitleAi,
    handleSubtitleAi,
    source: titleSuggestionSource,
    isRefining: titleSuggestionIsRefining,
    lockSelection: lockTitleSelection,
  } = useTitleAi(
    draft,
    ready,
    step,
    updateDraft,
    setError,
  );

  const [aiLoading, setAiLoading] = useState<"" | "outline" | "style" | "generate">("");
  const [generationStageIndex, setGenerationStageIndex] = useState(0);
  const [pendingRedirect, setPendingRedirect] = useState("");
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [outlineSuggestionState, setOutlineSuggestionState] = useState<OutlineSuggestionState>("idle");
  const [outlineSelectionLocked, setOutlineSelectionLocked] = useState(false);
  const autoFillRef = useRef({ outline: false, style: false });
  const resumeAttemptRef = useRef(false);
  const generateRequestInFlightRef = useRef(false);
  const draftRef = useRef(draft);
  const outlineRequestIdRef = useRef(0);
  const outlineSelectionLockedRef = useRef(outlineSelectionLocked);
  const shouldResumeGenerate = false;

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    outlineSelectionLockedRef.current = outlineSelectionLocked;
  }, [outlineSelectionLocked]);

  const outlineWordEstimate = useMemo(
    () => outlineWordRange(draft.outline.length ? draft.outline : localOutlineSuggestions(draft), draft.bookLength),
    [draft.outline, draft.bookLength, draft.language, draft.topic],
  );

  function generateResumePath() {
    return `${stepHref("generate")}?resume=1`;
  }

  function makePendingGenerateIntent(
    authMethod?: "google" | "magic" | "credentials" | null,
    authMode?: "login" | "register" | null,
  ) {
    return {
      source: "start_generate" as const,
      draftId: draft.id,
      step: "generate" as const,
      resumePath: generateResumePath(),
      createdAt: new Date().toISOString(),
      authMethod: authMethod || null,
      authMode: authMode || null,
    };
  }

  function usageBillingHref(reason?: string | null) {
    return `/app/settings/billing?intent=start-book${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`;
  }

  function maybeRouteToUsageGate(usage = getViewer()?.usage) {
    if (!usage || usage.canStartBook) return false;
    clearPendingGenerateIntent();
    setAuthGateOpen(false);
    trackEvent("second_book_gate_viewed", {
      source: appShellEnabled ? "app_new_generate" : "start_generate",
      reason: usage.reason || "unknown",
    });
    router.push(usageBillingHref(usage.reason));
    return true;
  }

  function openGenerateAuthGate() {
    savePendingGenerateIntent(makePendingGenerateIntent());
    setAuthGateOpen(true);
    trackEvent("generate_auth_gate_viewed", {
      source: appShellEnabled ? "app_new_generate" : "start_generate",
      language: draft.language,
    });
  }

  function handleAuthGateOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setAuthGateOpen(true);
      return;
    }

    const intent = loadPendingGenerateIntent();
    if (!intent?.authMethod) {
      clearPendingGenerateIntent();
    }

    setAuthGateOpen(false);
    trackEvent("generate_auth_gate_closed", {
      source: appShellEnabled ? "app_new_generate" : "start_generate",
      method: intent?.authMethod || "none",
    });
  }

  function handleAuthGateMethodSelected(input: {
    method: "google" | "magic" | "credentials";
    mode: "login" | "register";
  }) {
    savePendingGenerateIntent(makePendingGenerateIntent(input.method, input.mode));
  }

  useEffect(() => {
    if (aiLoading !== "generate") {
      setGenerationStageIndex(0);
      return;
    }

    setGenerationStageIndex(0);
    const timer = window.setInterval(() => {
      setGenerationStageIndex((current) => Math.min(GENERATION_STAGES_COUNT - 1, current + 1));
    }, 1400);
    return () => window.clearInterval(timer);
  }, [aiLoading]);

  useEffect(() => {
    if (step !== "generate") {
      setAuthGateOpen(false);
    }
  }, [step]);

  useEffect(() => {
    if (!ready || step !== "outline" || autoFillRef.current.outline) return;
    autoFillRef.current.outline = true;
    if (!draft.outline.length) {
      setOutlineSuggestionState("local_fast");
      updateDraft({
        title: draft.title || localTitleSuggestions(draft)[0]?.title || "",
        subtitle: draft.subtitle || localTitleSuggestions(draft)[0]?.subtitle || "",
        outline: localOutlineSuggestions(draft),
      });
    }
    if (!draft.topic.trim()) return;
    void handleOutlineAi();
  }, [draft, ready, step]);

  useEffect(() => {
    if (!ready || step !== "style" || autoFillRef.current.style) return;
    autoFillRef.current.style = true;
    applyRandomStyleProfile(false);
  }, [ready, step]);

  useEffect(() => {
    if (!ready || step !== "generate" || !shouldResumeGenerate || resumeAttemptRef.current) return;

    const intent = loadPendingGenerateIntent();
    if (!intent || intent.draftId !== draft.id || intent.resumePath !== generateResumePath()) return;

    resumeAttemptRef.current = true;

    void (async () => {
      const authState = await syncPreviewAuthState().catch(() => null);
      const hasSession = Boolean(authState?.authenticated || getSession());
      if (!hasSession) {
        resumeAttemptRef.current = false;
        return;
      }

      if (maybeRouteToUsageGate(authState?.usage || getViewer()?.usage)) return;

      trackEvent("generate_auth_gate_completed", {
        method: intent.authMethod || "resume",
        mode: intent.authMode || "register",
      });
      trackEvent("generate_auth_gate_resumed", {
        method: intent.authMethod || "resume",
      });

      await runGenerateAfterAuth();
    })();
  }, [draft.id, ready, step]);

  async function handleOutlineAi() {
    if (!draft.topic.trim()) {
      setError(t("errorSpecifyTopic"));
      router.push(stepHref("topic"));
      return;
    }

    const requestId = outlineRequestIdRef.current + 1;
    outlineRequestIdRef.current = requestId;
    const requestSnapshot = {
      title: draftRef.current.title.trim(),
      subtitle: draftRef.current.subtitle.trim(),
      outline: JSON.stringify(draftRef.current.outline),
    };
    // Accept both the pre-request outline and this request's own local-fast outline
    // as valid baseline states. This avoids racey "2nd/3rd click works" behavior
    // when local preview suggestions land before refined AI output.
    const acceptedOutlineSnapshots = new Set<string>([requestSnapshot.outline]);

    setAiLoading("outline");
    try {
      let chapters = localOutlineSuggestions(draftRef.current);
      let maybeTitle = draftRef.current.title;
      let maybeSubtitle = draftRef.current.subtitle;
      setOutlineSuggestionState("local_fast");
      trackEvent("outline_suggestions_fallback_shown", { language: draft.language, count: chapters.length });
      const canApplyLocalOutline = !outlineSelectionLockedRef.current || !draftRef.current.outline.length;
      if (canApplyLocalOutline) {
        acceptedOutlineSnapshots.add(JSON.stringify(chapters));
        updateDraft({
          title: maybeTitle || localTitleSuggestions(draftRef.current)[0]?.title || "",
          subtitle: maybeSubtitle || localTitleSuggestions(draftRef.current)[0]?.subtitle || "",
          outline: chapters,
        });
      }

      const response = await runWorkflow({
        action: "outline_suggest",
        topic: draft.topic,
        title: draft.title,
        subtitle: draft.subtitle,
        language: draft.language,
        audience: draft.audience || defaultAudience(draft.language),
        genre: workflowGenreLabel(draft.bookType),
        style: workflowStyleLabel(draft.depth),
        tone: workflowToneLabel(draft.tone),
      }, {
        timeoutMs: 90_000,
        retryDelaysMs: [],
      });

      if (response.ok === false) {
        const message =
          (typeof response.output === "string" && response.output.trim()) ||
          t("errorOutlineFailed");
        throw new Error(message.split("\n").find(Boolean) || message);
      }

      const generated = response.generated as
        | {
            title?: string;
            subtitle?: string;
            chapters?: Array<{ title?: string; summary?: string }>;
            fallback?: boolean;
            source?: string;
          }
        | undefined;
      const usedTemplateFallback =
        Boolean(generated?.fallback) ||
        String(generated?.source || "").trim() === "local_template";

      if (generated?.chapters?.length) {
        chapters = enrichOutlineItems(
          generated.chapters.map((item, index) => ({
            title: String(item.title || defaultChapterReference(draft.language, index + 1)).trim(),
            summary: String(item.summary || "").trim(),
          })),
          draft,
        );
        maybeTitle = String(generated.title || maybeTitle || "").trim();
        maybeSubtitle = String(generated.subtitle || maybeSubtitle || "").trim();
      }

      if (requestId !== outlineRequestIdRef.current) {
        return;
      }

      const currentDraft = draftRef.current;
      const outlineChangedByUser =
        outlineSelectionLockedRef.current ||
        !acceptedOutlineSnapshots.has(JSON.stringify(currentDraft.outline));

      if (!outlineChangedByUser || !currentDraft.outline.length) {
        updateDraft({
          title: maybeTitle || currentDraft.title || localTitleSuggestions(currentDraft)[0]?.title || "",
          subtitle: maybeSubtitle || currentDraft.subtitle || localTitleSuggestions(currentDraft)[0]?.subtitle || "",
          outline: chapters,
        });
      }
      setOutlineSuggestionState(usedTemplateFallback ? "local_fast" : "glm_refined");
      if (!usedTemplateFallback) {
        trackEvent("outline_suggestions_refined", { language: draft.language, count: chapters.length });
      }
      trackEvent("outline_ai_used", {
        language: draft.language,
        count: chapters.length,
        fallback: usedTemplateFallback,
      });
    } catch (error) {
      const fallback = localOutlineSuggestions(draft);
      if (requestId !== outlineRequestIdRef.current) {
        return;
      }
      setOutlineSuggestionState("failed");
      if (!outlineSelectionLockedRef.current || !draftRef.current.outline.length) {
        updateDraft({
          title: draftRef.current.title || localTitleSuggestions(draftRef.current)[0]?.title || "",
          subtitle: draftRef.current.subtitle || localTitleSuggestions(draftRef.current)[0]?.subtitle || "",
          outline: fallback,
        });
      }
      if (!isBackendUnavailableError(error)) {
        setError(error instanceof Error ? error.message : t("errorOutlineNotRetrieved"));
      } else {
        setError("");
      }
      trackEvent("workflow_timeout", { action: "outline_suggest" });
      trackEvent("outline_ai_used", { fallback: true, count: fallback.length });
    } finally {
      if (requestId === outlineRequestIdRef.current) {
        setAiLoading("");
      }
    }
  }

  function applyRandomStyleProfile(forceReplace = false) {
    const style = suggestedStyleProfile(draft);
    const preset = pickRandomPublisherLogo();
    const localized = buildRandomStyleCopy(draft);
    updateDraft({
      ...style,
      authorName: forceReplace ? localized.authorName : draft.authorName || getAccount().name || localized.authorName,
      imprint: forceReplace ? preset.imprint : draft.imprint && draft.imprint !== "Book Generator" ? draft.imprint : preset.imprint,
      logoText: forceReplace ? preset.mark : draft.logoText || preset.mark,
      logoUrl: forceReplace ? preset.url : draft.logoUrl || preset.url,
      coverBrief: forceReplace ? localized.coverBrief : draft.coverBrief || localized.coverBrief || randomCoverBrief(),
      authorBio: forceReplace ? localized.authorBio : draft.authorBio || localized.authorBio,
    });
    return style;
  }

  async function handleStyleAi() {
    const localStyle = applyRandomStyleProfile(true);
    setAiLoading("style");
    try {
      const response = await runWorkflow({
        action: "style_suggest",
        topic: draftRef.current.topic,
        audience: draftRef.current.audience || defaultAudience(draftRef.current.language),
        book_type: workflowGenreLabel(draftRef.current.bookType),
        language: draftRef.current.language,
        tone: draftRef.current.tone,
        depth: draftRef.current.depth,
        cover_direction: draftRef.current.coverDirection,
      }, {
        timeoutMs: 30_000,
        retryDelaysMs: [400, 900],
      });

      if (response.ok === false) {
        const message =
          (typeof response.output === "string" && response.output.trim()) ||
          t("errorStyleFailed");
        throw new Error(message.split("\n").find(Boolean) || message);
      }

      const generated = (response.generated || {}) as Record<string, unknown>;
      const nextTone = normalizeTone(generated.tone, localStyle.tone);
      const nextDepth = normalizeDepth(generated.depth, localStyle.depth);
      const nextCoverDirection = normalizeCoverDirection(generated.coverDirection, localStyle.coverDirection);

      updateDraft({
        tone: nextTone,
        depth: nextDepth,
        coverDirection: nextCoverDirection,
        authorName: String(generated.authorName || "").trim() || draftRef.current.authorName || buildRandomStyleCopy(draftRef.current).authorName,
        imprint: String(generated.imprint || "").trim() || draftRef.current.imprint,
        coverBrief: String(generated.coverBrief || "").trim() || draftRef.current.coverBrief || randomCoverBrief(),
        authorBio: String(generated.authorBio || "").trim() || draftRef.current.authorBio,
      });
      setError("");
      trackEvent("style_ai_used", {
        source: "api",
        tone: nextTone,
        depth: nextDepth,
        cover: nextCoverDirection,
      });
    } catch (error) {
      if (!isBackendUnavailableError(error)) {
        setError("");
      }
      trackEvent("workflow_timeout", { action: "style_suggest" });
      trackEvent("style_ai_used", {
        fallback: true,
        source: "local_fast",
        tone: localStyle.tone,
        depth: localStyle.depth,
        cover: localStyle.coverDirection,
      });
    } finally {
      setAiLoading("");
    }
  }

  async function runGenerateAfterAuth() {
    if (aiLoading === "generate" || generateRequestInFlightRef.current) return;
    generateRequestInFlightRef.current = true;

    setAiLoading("generate");
    setError("");
    setPendingRedirect("");
    setAuthGateOpen(false);
    clearPendingGenerateIntent();

    try {
      const existingSlug = String(draft.generatedSlug || "").trim();
      if (existingSlug) {
        trackEvent("generate_started", { slug: existingSlug, resumed: true });
        trackEvent("preview_cover_gate_started", { slug: existingSlug, resumed: true });
        await startBookPreviewPipeline(existingSlug, { trigger: "system" }).catch(() => undefined);
        setPendingRedirect(`/app/book/${encodeURIComponent(existingSlug)}/preview`);
        return;
      }

      const account = getAccount();
      const payload = buildGuidedBookPayload(draft, account.name);
      const book = await saveBook(payload);
      if (!book) throw new Error(t("errorBookSaveFailed"));

      const nextDraft = {
        ...draft,
        currentStep: "generate" as const,
        status: "generating" as const,
        generatedSlug: book.slug,
        updatedAt: new Date().toISOString(),
      };
      saveFunnelDraft(nextDraft);
      trackEvent("generate_started", { slug: book.slug });
      trackEvent("preview_cover_gate_started", { slug: book.slug });
      await startBookPreviewPipeline(book.slug, { trigger: "system" }).catch(() => undefined);
      setPendingRedirect(`/app/book/${encodeURIComponent(book.slug)}/preview`);
    } catch (cause) {
      if (isBackendUnavailableError(cause)) {
        setError(t("errorPreviewStarting"));
      } else {
        setError(cause instanceof Error ? cause.message : t("errorBookCreationFailed"));
      }
      setAiLoading("");
    } finally {
      generateRequestInFlightRef.current = false;
    }
  }

  async function requestGenerate(trigger: "manual" | "inline_auth" = "manual") {
    if (aiLoading === "generate" || generateRequestInFlightRef.current) return;

    setError("");

    if (trigger === "manual") {
      trackEvent("wizard_generate_clicked", {
        language: draft.language,
        chapter_count: draft.outline.length,
      });
    }

    const authState = await syncPreviewAuthState().catch(() => null);
    const hasSession = Boolean(authState?.authenticated || getSession());
    if (hasSession && maybeRouteToUsageGate(authState?.usage || getViewer()?.usage)) return;

    await runGenerateAfterAuth();
  }

  const stepKey = `${step}:${draft.outline.length}`;

  function renderAnimatedStep(children: ReactNode) {
    return (
      <div key={stepKey} className="wizard-step-enter wizard-step-stage">
        {children}
      </div>
    );
  }

  if (!ready) return null;

  function wrapInShell(input: { title: string; description: string; children: ReactNode }) {
    const shell = (
      <FunnelShell
        step={step}
        title={input.title}
        description={input.description}
        summary={summary}
        mode={appShellEnabled ? "embedded" : "funnel"}
      >
        {renderAnimatedStep(input.children)}
      </FunnelShell>
    );

    if (!appShellEnabled) return shell;

    return (
      <AppFrame current="new" title={t("appFrameTitle")} books={[]} showBookShelf={false} hideHeader>
        {shell}
      </AppFrame>
    );
  }

  if (step === "topic") {
    return wrapInShell({
      title: t("topicTitle"),
      description: t("topicDescription"),
      children: <TopicStep draft={draft} onUpdate={updateDraft} onNext={goNext} error={error} onError={setError} />,
    });
  }

  if (step === "title") {
    return wrapInShell({
      title: t("titleTitle"),
      description: t("titleDescription"),
      children: (
        <TitleStep
          draft={draft}
          onUpdate={updateDraft}
          onNext={goNext}
          onBack={goBack}
          error={error}
          titleOptions={titleOptions}
          onAiSuggest={() => handleTitleAi()}
          onSubtitleAi={() => handleSubtitleAi()}
          aiLoading={titleAiLoading}
          suggestionSource={titleSuggestionSource}
          suggestionIsRefining={titleSuggestionIsRefining}
          appShell={appShellEnabled}
          onDraftTouched={lockTitleSelection}
          onSuggestionApplied={lockTitleSelection}
        />
      ),
    });
  }

  if (step === "outline") {
    return wrapInShell({
      title: t("outlineTitle"),
      description: t("outlineDescription"),
      children: (
        <OutlineStep
          draft={draft}
          onUpdate={updateDraft}
          onUpdateOutline={updateOutline}
          onManualChange={() => setOutlineSelectionLocked(true)}
          onNext={goNext}
          onBack={goBack}
          onAiGenerate={async () => {
            setOutlineSelectionLocked(false);
            await handleOutlineAi();
          }}
          error={error}
          aiLoading={aiLoading === "outline" ? "outline" : ""}
          wordEstimate={outlineWordEstimate}
          suggestionState={outlineSuggestionState}
        />
      ),
    });
  }

  if (step === "style") {
    return wrapInShell({
      title: t("styleTitle"),
      description: t("styleDescription"),
      children: (
        <StyleStep
          draft={draft}
          onUpdate={updateDraft}
          onNext={goNext}
          onBack={goBack}
          onStyleAi={() => void handleStyleAi()}
          error={error}
          onError={setError}
          aiLoading={aiLoading === "style" ? "style" : ""}
          appShell={appShellEnabled}
        />
      ),
    });
  }

  const generationStages = [
    t("stages.0"),
    t("stages.1"),
    t("stages.2"),
    t("stages.3"),
  ] as const;

  return wrapInShell({
    title: t("generateTitle"),
    description: appShellEnabled
      ? t("generateDescriptionApp")
      : t("generateDescriptionFunnel"),
    children: (
      <GenerateStep
        draft={draft}
        error={error}
        onError={setError}
        onBack={goBack}
        stepHref={stepHref}
        appShell={appShellEnabled}
        aiLoading={aiLoading === "generate" ? "generate" : ""}
        pendingRedirect={pendingRedirect}
        authGateOpen={authGateOpen}
        onAuthGateOpenChange={handleAuthGateOpenChange}
        onAuthGateMethodSelected={handleAuthGateMethodSelected}
        onAuthenticated={() => void requestGenerate("inline_auth")}
        onOpenSavePrompt={openGenerateAuthGate}
        onStartGenerate={() => void requestGenerate()}
        generationStages={generationStages}
        generationStageIndex={generationStageIndex}
      />
    ),
  });
}
