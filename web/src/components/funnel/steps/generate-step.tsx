"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { GenerateAuthGateDialog } from "@/components/funnel/generate-auth-gate-dialog";
import { GenerateLoadingScreen } from "@/components/funnel/generate-loading-screen";
import {
  clearFunnelDraft,
  languageLabel,
  type FunnelDraft,
  type FunnelStep,
} from "@/lib/funnel-draft";
import { getSession } from "@/lib/preview-auth";

export function GenerateStep({
  draft,
  error,
  onError,
  onBack,
  stepHref,
  appShell,
  aiLoading,
  pendingRedirect,
  authGateOpen,
  onAuthGateOpenChange,
  onAuthGateMethodSelected,
  onAuthenticated,
  onOpenSavePrompt,
  onStartGenerate,
  generationStages,
}: {
  draft: FunnelDraft;
  error: string;
  onError: (msg: string) => void;
  onBack: () => void;
  stepHref: (step: FunnelStep) => string;
  appShell: boolean;
  aiLoading: "" | "generate";
  pendingRedirect: string;
  authGateOpen: boolean;
  onAuthGateOpenChange: (open: boolean) => void;
  onAuthGateMethodSelected: (input: { method: "google" | "magic" | "credentials"; mode: "login" | "register" }) => void;
  onAuthenticated: () => void;
  onOpenSavePrompt: () => void;
  onStartGenerate: () => void;
  generationStages: readonly string[];
  generationStageIndex: number;
}) {
  const router = useRouter();
  const hasSession = Boolean(getSession());

  if (aiLoading === "generate") {
    return <GenerateLoadingScreen redirectPath={pendingRedirect || undefined} />;
  }

  return (
    <div className="space-y-4">
      <GenerateAuthGateDialog
        open={authGateOpen}
        onOpenChange={onAuthGateOpenChange}
        resumePath={`${stepHref("generate")}?resume=1`}
        onMethodSelected={onAuthGateMethodSelected}
        onAuthenticated={onAuthenticated}
      />

      {/* Summary card — compact */}
      <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
          Final review
        </div>

        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {draft.title}
        </h2>
        {draft.subtitle ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground/70">
            {draft.subtitle}
          </p>
        ) : null}

        {/* Inline pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-border/60 bg-card/80 px-2.5 py-1 text-xs text-muted-foreground">
            {languageLabel(draft.language)}
          </span>
          <span className="rounded-full border border-border/60 bg-card/80 px-2.5 py-1 text-xs text-muted-foreground">
            {draft.outline.length} chapter
          </span>
          <span className="rounded-full border border-border/60 bg-card/80 px-2.5 py-1 text-xs text-muted-foreground">
            {draft.imprint || draft.logoText || "Book Generator"}
          </span>
        </div>
      </div>

      {/* Condensed check items */}
      <div className="flex items-start gap-2.5 rounded-xl border border-primary/10 bg-primary/[0.03] px-3.5 py-3">
        <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <p className="text-[13px] leading-5 text-muted-foreground/70">
          Real cover comes first · First readable pages unlock automatically · Full PDF/EPUB comes later · No payment required to start
        </p>
      </div>

      {!hasSession ? (
        <div className="rounded-2xl border border-[#d8bfac]/60 bg-[linear-gradient(180deg,#fffaf4_0%,#fff7ef_100%)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7f5a46]">
                Optional free account
              </div>
              <p className="mt-2 text-sm leading-6 text-[#6f5547]">
                Start as guest now. If you want to keep this preview in your library, save it to a free account before or after generation.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onOpenSavePrompt}>
              Save to account
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
          This preview will also stay in your library while the remaining chapters continue in the background.
        </div>
      )}

      {error ? (
        <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Actions — dominant primary CTA */}
      <div className="space-y-2">
        <Button
          size="lg"
          onClick={onStartGenerate}
          className="w-full text-base font-semibold h-12 rounded-xl"
        >
          {appShell ? "Create Live Preview" : "Start Guest Preview"}
        </Button>
        <div className="flex justify-center">
          <button
            type="button"
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            onClick={() => {
              clearFunnelDraft();
              router.push(stepHref("topic"));
            }}
          >
            Start Over
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/50 text-center">
        {appShell
          ? "See the cover and first pages first · Upgrade only after you like the result"
          : "Guest preview opens first · Save to account anytime · Upgrade later if you want the full book"}
      </p>
    </div>
  );
}
