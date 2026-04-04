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
    <div className="mx-auto max-w-2xl space-y-5">
      <GenerateAuthGateDialog
        open={authGateOpen}
        onOpenChange={onAuthGateOpenChange}
        resumePath={`${stepHref("generate")}?resume=1`}
        onMethodSelected={onAuthGateMethodSelected}
        onAuthenticated={onAuthenticated}
      />

      {/* Summary card */}
      <div className="rounded-[24px] border border-border/80 bg-background/72 p-5 sm:p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Son kontrol
        </div>

        <div className="mt-3">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[30px]">
            {draft.title}
          </h2>
          {draft.subtitle ? (
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {draft.subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-border/80 bg-card px-3 py-1.5 text-sm text-foreground">
            {languageLabel(draft.language)}
          </span>
          <span className="rounded-full border border-border/80 bg-card px-3 py-1.5 text-sm text-foreground">
            {draft.outline.length} bölüm
          </span>
          <span className="rounded-full border border-border/80 bg-card px-3 py-1.5 text-sm text-foreground">
            {draft.imprint || draft.logoText || "Kitap Oluşturucu"}
          </span>
        </div>

        {/* Timeline check items */}
        <div className="mt-5 space-y-3 border-t border-border/70 pt-5">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-full bg-primary/10 p-1 text-primary">
              <Check className="size-3.5" />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Ön izleme üretimi hemen başlar. Kapak, başlık vitrini ve ilk okunabilir bölüm arka planda hazırlanır.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-full bg-primary/10 p-1 text-primary">
              <Check className="size-3.5" />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Kitap hesabına kaydolur. Hazır olduğunda kütüphanende aynı yerden devam edersin.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-full bg-primary/10 p-1 text-primary">
              <Check className="size-3.5" />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Tam kitap, PDF ve EPUB daha sonra açılır. Bu adım yalnızca ön izleme üretimini başlatır; ödeme istemez.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="lg" onClick={onBack}>
          Geri
        </Button>
        <Button size="lg" onClick={onStartGenerate}>
          {appShell ? "Ön İzlemeyi Oluştur" : "Hesabını Oluştur ve Ön İzlemeyi Başlat"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            clearFunnelDraft();
            router.push(stepHref("topic"));
          }}
        >
          Baştan Kur
        </Button>
      </div>
      <p className="text-xs text-muted-foreground/70">
        {appShell
          ? "Aynı hesapta devam et · Önce ön izlemeyi gör · Tam kitabı sonra aç"
          : "Bu adım ödeme istemez · Kitap hesabına yazılır · Hazır olunca kütüphanende görünür"}
      </p>
    </div>
  );
}
