"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

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
  runWorkflow,
  saveBook,
  startBookPreviewPipeline,
} from "@/lib/dashboard-api";
import { formatChapterReference } from "@/lib/book-language";
import { getAccount, getSession, getViewer, syncPreviewAuthState } from "@/lib/preview-auth";
import { pickRandomPublisherLogo } from "@/lib/publisher-logo-library";

const GENERATION_STAGES = [
  "Book showcase is being prepared",
  "Cover direction is being processed",
  "First readable chapter is being written",
  "Preview is being linked to library",
] as const;

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
    case "rehber":
      return "guidebook";
    case "is":
      return "business";
    case "egitim":
      return "educational";
    case "cocuk":
      return "children";
    default:
      return "general";
  }
}

function workflowStyleLabel(depth: FunnelDraft["depth"]) {
  switch (depth) {
    case "hizli":
      return "concise";
    case "detayli":
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

  const { titleOptions, aiLoading: titleAiLoading, handleTitleAi, handleSubtitleAi } = useTitleAi(
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
  const autoFillRef = useRef({ outline: false, style: false });
  const resumeAttemptRef = useRef(false);
  const shouldResumeGenerate = false;

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
      setGenerationStageIndex((current) => Math.min(GENERATION_STAGES.length - 1, current + 1));
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
    applyRandomStyleProfilee(false);
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
      setError("Please specify the topic first.");
      router.push(stepHref("topic"));
      return;
    }

    setAiLoading("outline");
    try {
      let chapters = localOutlineSuggestions(draft);
      let maybeTitle = draft.title;
      let maybeSubtitle = draft.subtitle;

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
      });

      if (response.ok === false) {
        const message =
          (typeof response.output === "string" && response.output.trim()) ||
          "Outline suggestions failed.";
        throw new Error(message.split("\n").find(Boolean) || message);
      }

      const generated = response.generated as
        | {
            title?: string;
            subtitle?: string;
            chapters?: Array<{ title?: string; summary?: string }>;
          }
        | undefined;

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

      updateDraft({
        title: maybeTitle || draft.title || localTitleSuggestions(draft)[0]?.title || "",
        subtitle: maybeSubtitle || draft.subtitle || localTitleSuggestions(draft)[0]?.subtitle || "",
        outline: chapters,
      });
      trackEvent("outline_ai_used", { language: draft.language, count: chapters.length });
    } catch (error) {
      const fallback = localOutlineSuggestions(draft);
      updateDraft({
        title: draft.title || localTitleSuggestions(draft)[0]?.title || "",
        subtitle: draft.subtitle || localTitleSuggestions(draft)[0]?.subtitle || "",
        outline: fallback,
      });
      setError(error instanceof Error ? error.message : "AI outline suggestions could not be retrieved.");
      trackEvent("outline_ai_used", { fallback: true, count: fallback.length });
    } finally {
      setAiLoading("");
    }
  }

  function applyRandomStyleProfilee(forceReplace = false) {
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

  function handleStyleAi() {
    const style = applyRandomStyleProfilee(true);
    setAiLoading("style");
    trackEvent("style_ai_used", {
      tone: style.tone,
      depth: style.depth,
      cover: style.coverDirection,
    });
    window.setTimeout(() => setAiLoading(""), 400);
  }

  async function runGenerateAfterAuth() {
    if (aiLoading === "generate") return;

    setAiLoading("generate");
    setError("");
    setPendingRedirect("");
    setAuthGateOpen(false);
    clearPendingGenerateIntent();

    try {
      const account = getAccount();
      const payload = buildGuidedBookPayload(draft, account.name);
      const book = await saveBook(payload);
      if (!book) throw new Error("Book could not be saved: server returned invalid response.");

      const nextDraft = {
        ...draft,
        currentStep: "generate" as const,
        status: "generating" as const,
        generatedSlug: book.slug,
        updatedAt: new Date().toISOString(),
      };
      saveFunnelDraft(nextDraft);
      trackEvent("generate_started", { slug: book.slug });
      void startBookPreviewPipeline(book.slug).catch(() => undefined);
      setPendingRedirect(`/app/book/${encodeURIComponent(book.slug)}/preview`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Book could not be created. Please try again.");
      setAiLoading("");
    }
  }

  async function requestGenerate(trigger: "manual" | "inline_auth" = "manual") {
    if (aiLoading === "generate") return;

    setError("");

    if (trigger === "manual") {
      trackEvent("wizard_generate_clicked", {
        language: draft.language,
        chapter_count: draft.outline.length,
      });
    }

    const authState = await syncPreviewAuthState().catch(() => null);
    const hasSession = Boolean(authState?.authenticated || getSession());

    if (!hasSession) {
      openGenerateAuthGate();
      return;
    }

    if (maybeRouteToUsageGate(authState?.usage || getViewer()?.usage)) return;

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
      <AppFrame current="new" title="New Book" books={[]} showBookShelf={false} hideHeader>
        {shell}
      </AppFrame>
    );
  }

  if (step === "topic") {
    return wrapInShell({
      title: "What is your book topic?",
      description: "1/5. First select the book language, then write the topic. This selection produces all AI suggestions in the same language.",
      children: <TopicStep draft={draft} onUpdate={updateDraft} onNext={goNext} error={error} onError={setError} />,
    });
  }

  if (step === "title") {
    return wrapInShell({
      title: "Title and subtitle",
      description: "2/5. Write it yourself or get AI suggestions. When this step is done, the book title and positioning become clear.",
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
          appShell={appShellEnabled}
        />
      ),
    });
  }

  if (step === "outline") {
    return wrapInShell({
      title: "Chapter plan",
      description: "3/5. Auto-generate with AI or edit manually. When this step is done, your book's skeleton becomes visible.",
      children: (
        <OutlineStep
          draft={draft}
          onUpdate={updateDraft}
          onUpdateOutline={updateOutline}
          onNext={goNext}
          onBack={goBack}
          onAiGenerate={handleOutlineAi}
          error={error}
          aiLoading={aiLoading === "outline" ? "outline" : ""}
          wordEstimate={outlineWordEstimate}
        />
      ),
    });
  }

  if (step === "style") {
    return wrapInShell({
      title: "Language and style",
      description: "4/5. This screen auto-filled. Select the language, brand, and overall feel of the cover; preview generation starts in the next step.",
      children: (
        <StyleStep
          draft={draft}
          onUpdate={updateDraft}
          onNext={goNext}
          onBack={goBack}
          onStyleAi={handleStyleAi}
          error={error}
          onError={setError}
          aiLoading={aiLoading === "style" ? "style" : ""}
          appShell={appShellEnabled}
        />
      ),
    });
  }

  return wrapInShell({
    title: "Start Preview",
    description: appShellEnabled
      ? "5/5. Book showcase is prepared in a single flow. Cover and first readable chapter enter live production in the background."
      : "5/5. To prevent losing the preview, we link it to your account at this stage. The book is saved directly to your library and production continues in the background.",
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
        onStartGenerate={() => void requestGenerate()}
        generationStages={GENERATION_STAGES}
        generationStageIndex={generationStageIndex}
      />
    ),
  });
}