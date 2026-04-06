"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { GenerateAuthGateDialog } from "@/components/funnel/generate-auth-gate-dialog";
import { GenerateLoadingScreen } from "@/components/funnel/generate-loading-screen";
import { trackEvent } from "@/lib/analytics";
import {
  clearFunnelDraft,
  clearPendingGenerateIntent,
  languageLabel,
  loadPendingGenerateIntent,
  savePendingGenerateIntent,
  type FunnelDraft,
  type FunnelStep,
} from "@/lib/funnel-draft";
import { getAccount } from "@/lib/preview-auth";

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
  onStartGenerate: () => void;
  generationStages: readonly string[];
  generationStageIndex: number;
}) {
  const router = useRouter();

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
          Son kontrol
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
          Preview starts immediately · Book is saved to your account · Full book (PDF/EPUB) unlocks later · No payment required
        </p>
      </div>

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
          {appShell ? "Preview Generate" : "Hesabını Generate ve Preview Başlat"}
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
            Baştan başla
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/50 text-center">
        {appShell
          ? "Önce previewyi gör · Tam kitabı sonra aç"
          : "No payment required · Book is saved to your account · Appears in your library when ready"}
      </p>
    </div>
  );
}