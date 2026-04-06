"use client";

import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Lock,
  Mail,
  Palette,
  Shield,
  Sparkles,
  TimerReset,
  TrendingUp,
  Wand2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { AppFrame } from "@/components/app/app-frame";
import { BackendUnavailableState } from "@/components/app/backend-unavailable-state";
import { BookMockup } from "@/components/books/book-mockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";
import {
  buildBookAssetUrl,
  isBackendUnavailableError,
  loadBookPreview,
  loadBooks,
  runWorkflow,
  selectBookCoverVariant,
  startBookPreviewPipeline,
  type Book,
  type BookPreview,
  type BookPreviewCommerce,
  type BookPreviewCoverLab,
  type BookStatus,
} from "@/lib/dashboard-api";
import { languageLabel } from "@/lib/funnel-draft";
import { loadFunnelDraft } from "@/lib/funnel-draft";
import { syncPreviewAuthState } from "@/lib/preview-auth";
import { KDP_GUARANTEE_CLAIM, KDP_LIVE_BOOKS_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";
import { cn } from "@/lib/utils";

const EMPTY_GENERATION: BookStatus = {
  chapter_count: 0,
  asset_count: 0,
  extra_count: 0,
  research_count: 0,
  export_count: 0,
  active: false,
  stage: "idle",
  message: "",
  progress: 0,
  error: "",
  cover_ready: false,
  first_chapter_ready: false,
  product_ready: false,
  preview_ready: false,
  cover_state: "idle",
  first_chapter_state: "idle",
  started_at: "",
  updated_at: "",
  completed_at: "",
};

function normalizeLogoUrl(slug: string, value: string) {
  if (!value) return "";
  return /^(https?:\/\/|data:)/.test(value) ? value : buildBookAssetUrl(slug, value);
}

function formatUsd(cents = 0) {
  return `$${Math.round(cents / 100)}`;
}

function bonusDeadlineLabel(iso?: string | null) {
  if (!iso) return "";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "";
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  if (days <= 1) return "Ends today";
  return `${days} days left`;
}

function formatRemainingDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) {
    return `${hours}sa ${String(minutes).padStart(2, "0")}dk`;
  }
  if (minutes > 0) {
    return `${minutes}dk ${String(secs).padStart(2, "0")}sn`;
  }
  return `${secs}sn`;
}

function readableGenerationError(error?: string) {
  const value = String(error || "").trim();
  if (!value) return "";
  if (value.includes("/book_outputs/") || value.includes("\\book_outputs\\")) {
    return "Kapak üretimi tamamlanamadı. Mevcut preview ile devam edebilir veya cover lab’den yeni varyasyon üretebilirsin.";
  }
  return value;
}

// ─── Generation Status Banner ────────────────────────────────────────────────

function GenerationBanner({
  generation,
  coverReady,
  recoveryEmailEnabled,
}: {
  generation: BookStatus;
  coverReady: boolean;
  recoveryEmailEnabled: boolean;
}) {
  const fullGeneration = generation.full_generation || {};
  const fullTargetCount = Number(fullGeneration.target_count || 0);
  const fullReadyCount = Number(fullGeneration.ready_count || 0);
  const fullComplete = Boolean(fullGeneration.complete);
  const fullActive = Boolean(fullGeneration.active);
  const fullStage = String(fullGeneration.stage || "");
  const fullError = String(fullGeneration.error || "").trim();
  const etaFromServer = Math.max(0, Number(fullGeneration.eta_seconds || 0));
  const etaUpdatedAt = String(fullGeneration.eta_updated_at || "");
  const usingFullGeneration =
    fullTargetCount > 1 || fullActive || fullComplete || (fullStage && fullStage !== "idle");
  const [etaSecondsLeft, setEtaSecondsLeft] = useState(etaFromServer);

  useEffect(() => {
    if (!usingFullGeneration || fullComplete || etaFromServer <= 0) {
      setEtaSecondsLeft(0);
      return;
    }
    let nextEta = etaFromServer;
    if (etaUpdatedAt) {
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(etaUpdatedAt).getTime()) / 1000));
      nextEta = Math.max(0, etaFromServer - elapsedSeconds);
    }
    setEtaSecondsLeft(nextEta);
    const timer = window.setInterval(() => {
      setEtaSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [etaFromServer, etaUpdatedAt, fullComplete, usingFullGeneration]);

  if (generation.stage === "error" && !fullError) return null;

  const rawPreviewProgress = Math.max(0, Math.min(100, Number(generation.progress || 0)));
  const rawFullProgress = Math.max(0, Math.min(100, Number(fullGeneration.progress || 0)));
  const progress = usingFullGeneration
    ? fullComplete
      ? 100
      : rawFullProgress === 0
      ? Math.max(12, Math.min(95, Math.round((fullReadyCount / Math.max(1, fullTargetCount)) * 100)))
      : rawFullProgress
    : generation.product_ready
    ? 100
    : rawPreviewProgress === 0
    ? 25
    : rawPreviewProgress;

  const steps = [
    {
      label: "Kapak görseli",
      done: coverReady,
      live: generation.cover_state === "running" || generation.cover_state === "queued",
    },
    {
      label: "İlk okunabilir bölüm",
      done: Boolean(generation.preview_ready),
      live: generation.first_chapter_state === "running" || generation.first_chapter_state === "queued",
    },
    {
      label: "Full book",
      done: usingFullGeneration ? fullComplete : Boolean(generation.product_ready),
      live: usingFullGeneration
        ? fullActive && !fullComplete
        : Boolean(generation.active) && !generation.product_ready,
    },
  ];

  return (
    <div className="rounded-2xl border border-primary/20 border-l-4 border-l-primary bg-[linear-gradient(135deg,rgba(188,104,67,0.07),rgba(188,104,67,0.02))] px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            {usingFullGeneration
              ? fullComplete
                ? "Full book ready"
                : "Full book is being written in the background"
              : generation.product_ready
              ? "Üretim tamamlandı"
              : "Publishing stüdyosu çalışıyor"}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {usingFullGeneration
              ? fullComplete
                ? "Tüm bölümler tamamlandı. Aynı sayfadan PDF/EPUB indirebilir ve çalışma alanında düzenlemeye devam edebilirsin."
                : "Missing chapters for Pro access are being generated in the background. The process continues even if you close the page."
              : generation.product_ready
              ? "Preview, cover, and full book flow are ready. You can select the cover and make your purchase decision from the same page."
              : "Bu sayfayı kapatsan da üretim devam eder. Preview hazır olduğunda ilgili sayfaya e-posta ile dönebilirsin."}
          </p>
          {usingFullGeneration && fullGeneration.message ? (
            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted-foreground">
              {String(fullGeneration.message)}
            </p>
          ) : null}
          {usingFullGeneration && !fullComplete && etaSecondsLeft > 0 ? (
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
              Tahmini kalan süre: {formatRemainingDuration(etaSecondsLeft)}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 rounded-full border border-primary/20 bg-background/80 px-3 py-1.5 text-sm font-bold tabular-nums text-primary">
          %{progress}
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary/15">
        <div
          className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.label}
            className="rounded-[18px] border border-border/60 bg-background/75 px-3 py-3"
          >
            <div className="flex items-center gap-1.5 text-xs">
            {step.done ? (
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Loader2
                className={cn(
                  "size-3.5 shrink-0 text-muted-foreground",
                  step.live ? "animate-spin" : "",
                )}
              />
            )}
            <span className={cn("font-medium", step.done ? "text-foreground" : "text-muted-foreground")}>
              {step.label}
            </span>
          </div>
            <div className="mt-2 text-xs leading-5 text-muted-foreground">
              {step.done ? "Hazır" : step.live ? "Şu an hazırlanıyor" : "Sırada"}
            </div>
          </div>
        ))}
      </div>

      {recoveryEmailEnabled ? (
        <div className="mt-4 flex items-start gap-2 rounded-[18px] border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
          <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
          Güvenle çıkabilirsin. Preview ve geri dönüş teklifleri hazır olunca seni doğrudan bu sayfaya getiren mail göndeririz.
        </div>
      ) : null}

      {(fullError || generation.error) && (
        <div className="mt-3 rounded-[14px] border border-destructive/20 bg-destructive/8 px-4 py-2.5 text-sm leading-6 text-destructive">
          {readableGenerationError(fullError || generation.error)}
        </div>
      )}
    </div>
  );
}

// ─── Premium CTA Card ─────────────────────────────────────────────────────────

function PremiumCTA({
  premium,
  commerce,
  bonusLabel,
  onUpgrade,
  onPrimaryAction,
}: {
  premium: boolean;
  commerce?: BookPreviewCommerce;
  bonusLabel: string;
  onUpgrade: (trigger: "pdf" | "epub" | "full_unlock") => void;
  onPrimaryAction: () => void;
}) {
  if (premium) {
    return (
      <Card className="border-emerald-500/25 bg-emerald-500/8">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Tam Erişim Aktif
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Kitabın tamamı, PDF, EPUB ve çalışma alanı açık.
          </p>
          <Button
            size="lg"
            className="mt-4 w-full"
            onClick={onPrimaryAction}
          >
            <Download className="mr-2 size-4" aria-hidden="true" />
            PDF / EPUB İndir
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Premium Pricing Card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 shadow-xl shadow-primary/15 bg-card">
        {/* Top accent gradient line */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />

        {/* Price header */}
        <div className="bg-gradient-to-br from-primary/12 via-primary/6 to-transparent px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              {commerce?.primaryOffer.badge || "Launch price"}
            </span>
            {bonusLabel ? (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                {bonusLabel}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-5xl font-extrabold tracking-tight text-foreground">
              {formatUsd(commerce?.primaryOffer.priceCents || 400)}
            </span>
            <span className="text-lg text-muted-foreground line-through">
              {formatUsd(commerce?.primaryOffer.originalPriceCents || 2900)}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Tek seferlik • Abonelik yok</p>
        </div>

        {/* Features */}
        <div className="px-6 pb-5 pt-4">
          <p className="text-sm font-semibold text-foreground">
            {commerce?.primaryOffer.description || "Full access for this book - no subscription"}
          </p>

          <ul className="mt-4 space-y-3">
            {[
              { icon: FileText, text: "Tüm bölümler kilitsiz" },
              { icon: Download, text: "PDF + EPUB export" },
              { icon: BookOpen, text: "Kapak ve arka kapak" },
              { icon: Zap, text: "Çalışma alanı ve düzenleme" },
              { icon: Shield, text: "30 gün iade garantisi" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-foreground">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="size-3.5 text-primary" aria-hidden="true" />
                </div>
                {text}
              </li>
            ))}
          </ul>

          {/* Main CTA */}
          <Button
            size="lg"
            className="mt-6 w-full text-base font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
            onClick={() => onUpgrade("full_unlock")}
          >
            <Sparkles className="mr-2 size-4" aria-hidden="true" />
            {commerce?.primaryOffer.label || "Bu kitabı aç"}
            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Anında erişim • Kredi kartı güvenli
          </p>
          <div className="mt-2 flex justify-center gap-6">
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
              onClick={() => onUpgrade("pdf")}
            >
              PDF indir
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
              onClick={() => onUpgrade("epub")}
            >
              EPUB indir
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-border/60 bg-background/60 px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          {(commerce?.trustPoints || ["30 gün iade", "Anında teslim", "Abonelik yok", "KDP uyumlu"]).map((text) => {
            const Icon =
              text.includes("iade")
                ? Shield
                : text.includes("KDP")
                  ? CheckCircle2
                  : text.includes("Abonelik")
                    ? BookOpen
                    : Zap;
            return (
            <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="size-3 shrink-0 text-primary" aria-hidden="true" />
              {text}
            </div>
            );
          })}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Alternatif yol
          </div>
          <div className="rounded-[16px] border border-border/60 bg-background/60 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {commerce?.secondaryOffer.label || "Starter"}
                </div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  {commerce?.secondaryOffer.quotaLabel || "Ayda 10 kitap"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">
                  {formatUsd(commerce?.secondaryOffer.priceCents || 1900)}
                </div>
                <div className="text-[11px] text-muted-foreground">aylık</div>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={onPrimaryAction}>
            Planları karşılaştır
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PaywallDialog({
  open,
  onOpenChange,
  slug,
  commerce,
  authenticated,
  onCheckoutSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  commerce?: BookPreviewCommerce;
  authenticated: boolean;
  onCheckoutSuccess: (planId?: string) => void;
}) {
  const router = useRouter();
  const [submittingPlan, setSubmittingPlan] = useState<string>("");

  async function handleBuy(planId: "premium" | "starter") {
    trackEvent("paywall_cta_clicked", { slug, planId, surface: "preview_modal" });
    trackEvent("checkout_started", { slug, planId, source: "preview_modal" });

    if (!authenticated) {
      router.push(
        `/signup/continue?slug=${encodeURIComponent(slug)}&next=${encodeURIComponent(`/app/book/${slug}/preview?paywall=open`)}`,
      );
      return;
    }

    setSubmittingPlan(planId);
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, bookSlug: planId === "premium" ? slug : undefined }),
    }).catch(() => null);

    const payload = response
      ? ((await response.json().catch(() => null)) as { url?: string } | null)
      : null;

    if (payload?.url) {
      window.location.href = payload.url;
      return;
    }

    setSubmittingPlan("");
    onCheckoutSuccess(planId);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bu kitabı aç</DialogTitle>
          <DialogDescription>
            Preview’ı gördün. Şimdi aynı kitap için tam bölümleri, PDF/EPUB export’u ve workspace erişimini açabilirsin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-[18px] border border-primary/25 bg-primary/6 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {commerce?.primaryOffer.label || "Bu kitabı aç"}
                </div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  {commerce?.primaryOffer.description ||
                    "Full access for a single book, PDF/EPUB export, and workspace."}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">
                  {formatUsd(commerce?.primaryOffer.priceCents || 400)}
                </div>
                <div className="text-[11px] text-muted-foreground line-through">
                  {formatUsd(commerce?.primaryOffer.originalPriceCents || 2900)}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {[
                "All chapters for this book",
                "PDF + EPUB export",
                "Kapak, arka kapak, workspace",
                "30 gün iade garantisi",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="size-3.5 text-primary" />
                  {item}
                </div>
              ))}
            </div>

            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={() => void handleBuy("premium")}
              disabled={Boolean(submittingPlan)}
            >
              {submittingPlan === "premium" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
              {formatUsd(commerce?.primaryOffer.priceCents || 400)} ile bu kitabı aç
            </Button>
          </div>

          <div className="rounded-[18px] border border-border/70 bg-background/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {commerce?.secondaryOffer.label || "Starter"}
                </div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  {commerce?.secondaryOffer.description || "Monthly plan for producing new books every month."}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-foreground">
                  {formatUsd(commerce?.secondaryOffer.priceCents || 1900)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {commerce?.secondaryOffer.quotaLabel || "Ayda 10 kitap"}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => void handleBuy("starter")}
              disabled={Boolean(submittingPlan)}
            >
              {submittingPlan === "starter" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <TrendingUp className="mr-2 size-4" />}
              Starter ile devam et
            </Button>
          </div>

          <div className="rounded-[16px] border border-border/60 bg-background/50 px-4 py-3 text-sm text-muted-foreground">
            Bonus: 3 cover concept, ekstra reroll ve KDP-ready export aynı checkout içinde açılır.
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Şimdilik preview’da kal
          </Button>
          <Button variant="outline" onClick={() => router.push(`/app/book/${encodeURIComponent(slug)}/upgrade`)}>
            Tüm planları gör
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CoverLabCard({
  slug,
  title,
  author,
  logoText,
  logoUrl,
  coverBrief,
  coverLab,
  onSelect,
  onGenerate,
  selectingVariantId,
  generating,
  targetCount,
}: {
  slug: string;
  title: string;
  author: string;
  logoText: string;
  logoUrl?: string;
  coverBrief: string;
  coverLab?: BookPreviewCoverLab;
  onSelect: (variantId: string) => void;
  onGenerate: () => void;
  selectingVariantId: string;
  generating: boolean;
  targetCount: number;
}) {
  const variants = coverLab?.variants || [];
  const selectedVariantId = coverLab?.selectedVariantId || "";
  const showSkeletons = generating || coverLab?.generationState === "running";
  const slotCount = Math.max(1, variants.length, coverLab?.slots || 1, showSkeletons ? targetCount : 1);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Cover Lab
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {variants.length ? "Kapak konseptini seç" : "Kapak konseptleri hazırlanıyor"}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerate}
              disabled={generating}
            >
              {generating ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <Wand2 className="mr-2 size-3.5" />}
              AI ile yeniden üret
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {Array.from({ length: slotCount }).map((_, index) => {
              const variant = variants[index];
              const active = Boolean(variant && variant.id === selectedVariantId);
              const readyImage = variant?.front_image
                ? buildBookAssetUrl(slug, variant.front_image)
                : "";

              return (
                <button
                  type="button"
                  key={variant?.id || `cover-slot-${index}`}
                  className={cn(
                    "rounded-[20px] border p-3 text-left transition",
                    active
                      ? "border-primary bg-primary/6 shadow-md shadow-primary/10"
                      : "border-border/70 bg-background/60 hover:border-primary/25 hover:bg-accent/40",
                    !variant && "cursor-default",
                  )}
                  onClick={() => (variant ? onSelect(variant.id) : undefined)}
                  disabled={!variant || selectingVariantId === variant.id}
                >
                  <div className="relative overflow-hidden rounded-[16px] border border-border/60 bg-muted/20">
                    {readyImage ? (
                      <BookMockup
                        title={title}
                        subtitle=""
                        author={author}
                        brand={logoText}
                        logoUrl={logoUrl}
                        imageUrl={readyImage}
                        accentLabel={coverBrief || variant.label}
                        size="md"
                      />
                    ) : (
                      <div className="aspect-[4/5] animate-pulse bg-muted/60" />
                    )}
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {variant?.label || `Concept ${index + 1}`}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        {variant ? `${variant.family} · ${variant.provider || "AI studio"}` : showSkeletons ? "Yolda" : "Hazır olduğunda burada görünür"}
                      </div>
                    </div>
                    {variant ? (
                      <div className="flex size-7 items-center justify-center rounded-full border border-border bg-background">
                        {selectingVariantId === variant.id ? (
                          <Loader2 className="size-3.5 animate-spin text-primary" />
                        ) : active ? (
                          <CheckCircle2 className="size-3.5 text-primary" />
                        ) : (
                          <Palette className="size-3.5 text-muted-foreground" />
                        )}
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            İlk üretimde 1 ön + 1 arka konsept gelir. Beğenmezsen AI ile yeniden üret&apos;e basıp alternatif set alabilirsin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function NextStepsCard({
  premium,
  coverReady,
  previewReady,
  productReady,
  onUnlock,
}: {
  premium: boolean;
  coverReady: boolean;
  previewReady: boolean;
  productReady: boolean;
  onUnlock: () => void;
}) {
  const items = premium
    ? [
        { label: "Tam kitabı workspace’te aç", ready: true },
        { label: "PDF / EPUB export al", ready: true },
        { label: "KDP yükleme dosyalarını indir", ready: true },
      ]
    : [
        { label: "Kapak konseptini seç", ready: coverReady },
        { label: "İlk okunabilir bölümü incele", ready: previewReady },
        { label: "Tam kitabı aç ve export al", ready: productReady },
      ];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Sonraki 3 adım
        </div>
        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <div
              key={item.label}
              className="flex items-start gap-3 rounded-[16px] border border-border/60 bg-background/60 px-3 py-3"
            >
              <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[11px] font-semibold text-muted-foreground">
                {index + 1}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{item.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {item.ready ? "Hazır" : "Hazırlanıyor"}
                </div>
              </div>
            </div>
          ))}
        </div>
        {!premium ? (
          <Button className="mt-4 w-full" variant="outline" onClick={onUnlock}>
            <Sparkles className="mr-2 size-4" />
            Tam kitabı aç
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─── Book Meta Strip ──────────────────────────────────────────────────────────

function BookMetaStrip({
  authorName,
  imprint,
  language,
  ratio,
}: {
  authorName: string;
  imprint: string;
  language: string;
  ratio: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        { label: "Yazar", value: authorName },
        { label: "İmprint", value: imprint },
        { label: "Language", value: `${languageLabel(language)} book` },
        { label: "Önizleme", value: `İlk %${ratio}` },
      ].map(({ label, value }) => (
        <div
          key={label}
          className="rounded-xl bg-muted/50 px-3 py-2 border-0"
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Section Reader ───────────────────────────────────────────────────────────

function VisibleSection({
  section,
  index,
  previewReady,
  premium,
}: {
  section: { number?: number | string; title: string; content?: string; partial?: boolean };
  index: number;
  previewReady: boolean;
  premium: boolean;
}) {
  const isFirst = index === 0;
  const isLive = !previewReady && isFirst;

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {isLive ? "Canlı hazırlanan bölüm" : "Okunabilir bölüm"}
            </div>
            <h2 className="mt-1.5 text-2xl font-bold text-foreground md:text-3xl tracking-tight">
              {section.number ? `${section.number}. ` : ""}
              {section.title}
            </h2>
          </div>
          {isFirst && previewReady && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-3" />
              Hazır
            </span>
          )}
          {isLive && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              <Loader2 className="size-3 animate-spin" />
              Yazılıyor
            </span>
          )}
        </div>

        <div className="text-base leading-[1.85] text-muted-foreground md:text-lg">
          {section.content || (
            <span className="italic">İçerik hazırlanıyor, sayfayı açık bırak...</span>
          )}
        </div>

        {section.partial && !premium && (
          <div className="relative mt-6">
            {/* Blur gradient overlay */}
            <div className="pointer-events-none absolute inset-x-0 -top-16 h-20 bg-gradient-to-t from-card to-transparent" />
            {/* CTA */}
            <div className="rounded-[18px] border border-primary/25 bg-gradient-to-br from-primary/10 to-primary/5 px-5 py-5 text-center">
              <Lock className="mx-auto mb-2 size-5 text-primary" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">
                Devamını okumak için Premium&apos;a geç
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tüm bölümler, PDF, EPUB ve çalışma alanı açılır
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Locked Section Card ──────────────────────────────────────────────────────

function LockedSectionCard({
  section,
  onClick,
}: {
  section: { number?: number | string; title: string; teaser?: string };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="w-full text-left"
      onClick={onClick}
    >
      <div className="group rounded-2xl border border-border/40 bg-gradient-to-r from-muted/60 to-muted/30 px-5 py-4 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:from-muted/80 hover:to-muted/50 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Kilitli bölüm
            </div>
            <div className="mt-1 truncate text-base font-semibold text-foreground">
              {section.number ? `${section.number}. ` : ""}
              {section.title}
            </div>
          </div>
          <div className="mt-0.5 flex shrink-0 size-7 items-center justify-center rounded-full border border-border bg-background group-hover:border-primary/30 group-hover:bg-primary/8 transition">
            <Lock className="size-3.5 text-muted-foreground group-hover:text-primary transition" />
          </div>
        </div>
        {section.teaser && (
          <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">
            {section.teaser}
          </p>
        )}
        <div className="mt-3 text-xs font-semibold text-primary opacity-80">
          Premium ile aç →
        </div>
      </div>
    </button>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function BookPreviewScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [preview, setPreview] = useState<BookPreview | null>(null);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [coverGenerating, setCoverGenerating] = useState(false);
  const [coverTargetCount, setCoverTargetCount] = useState(1);
  const [bootstrapRetryNonce, setBootstrapRetryNonce] = useState(0);
  const [selectingVariantId, setSelectingVariantId] = useState("");
  const trackedRef = useRef(false);
  const bootstrapRequestedRef = useRef(false);
  const bootstrapRetryCountRef = useRef(0);
  const bootstrapRetryTimerRef = useRef<number | null>(null);
  const previewReadyTrackedRef = useRef(false);
  const coverLabRequestedRef = useRef(false);
  const hydrateInFlightRef = useRef(false);
  const hasLoadedPreviewRef = useRef(false);

  // Stripe başarılı ödeme sonrası auth state güncelle
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      const checkoutSessionId = searchParams.get("session_id") || "";
      trackEvent("checkout_completed", { slug, source: "stripe_return" });
      void (async () => {
        if (checkoutSessionId) {
          await fetch("/api/stripe/checkout/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: checkoutSessionId }),
          }).catch(() => null);
        }
        const payload = await syncPreviewAuthState();
        setAuthenticated(Boolean(payload?.authenticated));
        const url = new URL(window.location.href);
        url.searchParams.delete("checkout");
        url.searchParams.delete("session_id");
        router.replace(url.pathname + (url.search || ""));
      })();
    }
  }, [searchParams, router, slug]);

  const hydrate = useCallback(async () => {
    if (hydrateInFlightRef.current) return;
    hydrateInFlightRef.current = true;
    try {
      const previewPayload = await loadBookPreview(slug);
      setPreview(previewPayload);
      hasLoadedPreviewRef.current = true;
      setBackendUnavailable(false);
      if (!trackedRef.current) {
        trackedRef.current = true;
        trackEvent("preview_viewed", { slug });
      }
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        if (!hasLoadedPreviewRef.current) {
          setBackendUnavailable(true);
        }
        return;
      }
      console.error(error);
    } finally {
      hydrateInFlightRef.current = false;
    }
  }, [slug]);

  const hydrateBooksShelf = useCallback(async () => {
    try {
      const bookList = await loadBooks();
      setBooks(bookList);
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        return;
      }
      console.error(error);
    }
  }, []);

  const draftMeta = useMemo(() => {
    const stored = loadFunnelDraft();
    if (stored.generatedSlug !== slug) {
      return null;
    }

    return {
      authorName: stored.authorName || "",
      imprint: stored.imprint || "",
      logoText: stored.logoText || "",
      logoUrl: stored.logoUrl || "",
      authorBio: stored.authorBio || "",
      coverBrief: stored.coverBrief || "",
    };
  }, [slug]);

  useEffect(() => {
    trackedRef.current = false;
    bootstrapRequestedRef.current = false;
    bootstrapRetryCountRef.current = 0;
    if (bootstrapRetryTimerRef.current !== null) {
      window.clearTimeout(bootstrapRetryTimerRef.current);
      bootstrapRetryTimerRef.current = null;
    }
    previewReadyTrackedRef.current = false;
    coverLabRequestedRef.current = false;
    hasLoadedPreviewRef.current = false;
    setBootstrapRetryNonce(0);
    setCoverTargetCount(1);
    setBackendUnavailable(false);
  }, [slug]);

  useEffect(
    () => () => {
      if (bootstrapRetryTimerRef.current !== null) {
        window.clearTimeout(bootstrapRetryTimerRef.current);
        bootstrapRetryTimerRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    const slots = Number(preview?.coverLab?.slots || 0);
    if (!slots) return;
    setCoverTargetCount(Math.max(1, Math.min(3, slots)));
  }, [preview?.coverLab?.slots]);

  useEffect(() => {
    void syncPreviewAuthState().then((payload) => {
      setAuthenticated(Boolean(payload?.authenticated));
    });
  }, []);

  useEffect(() => {
    const frame = window.setTimeout(() => {
      void hydrate();
    }, 0);
    return () => window.clearTimeout(frame);
  }, [hydrate]);

  useEffect(() => {
    void hydrateBooksShelf();
  }, [hydrateBooksShelf, slug]);

  useEffect(() => {
    if (!backendUnavailable) return;
    const retryTimer = window.setTimeout(() => {
      void hydrate();
    }, 2000);
    return () => window.clearTimeout(retryTimer);
  }, [backendUnavailable, hydrate]);

  useEffect(() => {
    if (!preview || bootstrapRequestedRef.current) return;
    if (preview.generation.product_ready) return;
    bootstrapRequestedRef.current = true;
    void startBookPreviewPipeline(slug)
      .then(() => {
        bootstrapRetryCountRef.current = 0;
        if (bootstrapRetryTimerRef.current !== null) {
          window.clearTimeout(bootstrapRetryTimerRef.current);
          bootstrapRetryTimerRef.current = null;
        }
        return hydrate();
      })
      .catch((error) => {
        bootstrapRequestedRef.current = false;
        if (!isBackendUnavailableError(error)) {
          console.error(error);
        }
        bootstrapRetryCountRef.current += 1;
        const retryDelayMs = Math.min(
          15000,
          (isBackendUnavailableError(error) ? 1500 : 2500) * bootstrapRetryCountRef.current,
        );
        if (bootstrapRetryTimerRef.current !== null) {
          window.clearTimeout(bootstrapRetryTimerRef.current);
        }
        bootstrapRetryTimerRef.current = window.setTimeout(() => {
          setBootstrapRetryNonce((value) => value + 1);
        }, retryDelayMs);
      });
  }, [bootstrapRetryNonce, hydrate, preview, slug]);

  useEffect(() => {
    if (!preview) return;
    const generation = preview.generation || EMPTY_GENERATION;
    const fullGeneration = generation.full_generation || {};
    const fullTargetCount = Number(fullGeneration.target_count || 0);
    const fullComplete = Boolean(fullGeneration.complete);
    const fullErrored = String(fullGeneration.stage || "") === "error";
    const keepPollingForFullBook = fullTargetCount > 1 && !fullComplete && !fullErrored;
    if (
      (generation.product_ready && !keepPollingForFullBook) ||
      generation.stage === "error" ||
      generation.stage === "needs_attention"
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      void hydrate();
    }, 3500);
    return () => window.clearInterval(timer);
  }, [hydrate, preview]);

  useEffect(() => {
    if (searchParams.get("paywall") === "open") {
      setPaywallOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!preview) return;
    if (previewReadyTrackedRef.current) return;
    if (preview.generation.preview_ready || preview.generation.product_ready) {
      previewReadyTrackedRef.current = true;
      trackEvent("preview_ready_seen", { slug });
    }
  }, [preview, slug]);

  const generateCoverLab = useCallback(async (force = false, variantCount = 1) => {
    setCoverGenerating(true);
    setCoverTargetCount(Math.max(1, Math.min(3, variantCount)));
    try {
      await runWorkflow({
        action: "cover_variants_generate",
        slug,
        force,
        variant_count: variantCount,
      });
      await hydrate();
    } catch (error) {
      console.error(error);
    } finally {
      setCoverGenerating(false);
    }
  }, [hydrate, slug]);

  useEffect(() => {
    if (!preview || coverGenerating || coverLabRequestedRef.current) return;
    if (!preview.book.cover_image) return;
    if ((preview.coverLab?.readyCount || 0) > 0) return;
    coverLabRequestedRef.current = true;
    void generateCoverLab(false, 1).finally(() => {
      coverLabRequestedRef.current = false;
    });
  }, [preview, coverGenerating, generateCoverLab]);

  async function handleSelectVariant(variantId: string) {
    setSelectingVariantId(variantId);
    try {
      await selectBookCoverVariant(slug, variantId);
      trackEvent("cover_variant_selected", { slug, variantId });
      await hydrate();
    } catch (error) {
      console.error(error);
    } finally {
      setSelectingVariantId("");
    }
  }

  if (backendUnavailable) {
    return (
      <AppFrame
        current="preview"
        layout="book"
        currentBookSlug={slug}
        title="Önizleme"
        subtitle="Bağlantı sorunu oluştu."
        books={books}
      >
        <BackendUnavailableState onRetry={() => void hydrate()} />
      </AppFrame>
    );
  }

  // ── Loading Skeleton ──────────────────────────────────────────────────────

  if (!preview) {
    return (
      <AppFrame
        current="preview"
        layout="book"
        currentBookSlug={slug}
        title="Kitabın vitrini hazırlanıyor"
        subtitle="Kapak, ilk bölüm ve satış yüzeyi yerleştiriliyor."
        books={books}
      >
        <div className="space-y-4">
          {/* Generation status placeholder */}
          <div className="h-[72px] animate-pulse rounded-[20px] bg-muted" />

          <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_288px]">
            {/* Cover column */}
            <div className="space-y-4">
              <div className="aspect-[3/4] animate-pulse rounded-[24px] bg-muted" />
              <div className="h-40 animate-pulse rounded-[20px] bg-muted" />
            </div>

            {/* Content column */}
            <div className="space-y-4">
              <div className="h-48 animate-pulse rounded-[20px] bg-muted" />
              <div className="h-72 animate-pulse rounded-[20px] bg-muted" />
              <div className="h-32 animate-pulse rounded-[20px] bg-muted" />
            </div>

            {/* Right column */}
            <div className="hidden space-y-4 xl:block">
              <div className="h-56 animate-pulse rounded-[20px] bg-muted" />
              <div className="h-36 animate-pulse rounded-[20px] bg-muted" />
            </div>
          </div>
        </div>
      </AppFrame>
    );
  }

  // ── Derived Values ────────────────────────────────────────────────────────

  const premium = Boolean(preview.entitlements?.can_view_full_book);
  const generation = preview.generation || EMPTY_GENERATION;
  const fullGeneration = generation.full_generation;
  const effectiveProductReady = premium
    ? Boolean(fullGeneration?.complete || generation.product_ready)
    : Boolean(generation.product_ready);
  const ratio = Math.round((preview.preview.ratio || 0.2) * 100);
  const authorName = preview.book.author || draftMeta?.authorName || "Book Creator";
  const imprint = preview.book.publisher || draftMeta?.imprint || "Book Generator";
  const logoText = preview.book.branding_mark || draftMeta?.logoText || imprint;
  const rawLogoUrl = preview.book.branding_logo_url || draftMeta?.logoUrl || "";
  const logoUrl = normalizeLogoUrl(slug, rawLogoUrl);
  const authorBio = preview.book.author_bio || draftMeta?.authorBio || "";
  const coverBrief = preview.book.cover_brief || draftMeta?.coverBrief || "";
  const coverUrl = preview.book.cover_image
    ? buildBookAssetUrl(slug, preview.book.cover_image)
    : "";
  const backCoverUrl = preview.book.back_cover_image
    ? buildBookAssetUrl(slug, preview.book.back_cover_image)
    : "";
  const coverLab = preview.coverLab;
  const commerce = preview.commerce;
  const bonusLabel = bonusDeadlineLabel(commerce?.bonusDeadlineAt);

  const pageSubtitle = premium
    ? "Full access active. Book, cover, and export surface are open."
    : generation.product_ready
      ? `Book ready — first ${ratio}% readable preview open.`
      : generation.preview_ready
        ? "İlk bölüm hazır. Kapak ve tam içerik tamamlanıyor."
        : generation.active
          ? "Kitabın üretimi devam ediyor. Sayfa otomatik güncellenir."
          : "Kitabın vitrini hazırlanıyor.";

  function openUpgrade(trigger: "pdf" | "epub" | "full_unlock") {
    if (trigger === "pdf") trackEvent("paywall_pdf_clicked", { slug });
    if (trigger === "epub") trackEvent("paywall_epub_clicked", { slug });
    if (trigger === "full_unlock") trackEvent("paywall_full_unlock_clicked", { slug });
    trackEvent("paywall_viewed", { slug, trigger });
    trackEvent("paywall_opened", { slug, trigger });
    setPaywallOpen(true);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppFrame
      current="preview"
      layout="book"
      currentBookSlug={slug}
      title={preview.book.title}
      subtitle={pageSubtitle}
      books={books}
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/app/library" className="hover:text-foreground transition-colors">
          Kütüphane
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">{preview.book.title}</span>
      </nav>

      <GenerationBanner
        generation={generation}
        coverReady={Boolean(coverUrl)}
        recoveryEmailEnabled={Boolean(commerce?.recoveryEmailEnabled)}
      />

      {/* Main grid: cover | content | sidebar */}
      <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_272px]">

        {/* ── LEFT: Cover + TOC ─────────────────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          <CoverLabCard
            slug={slug}
            title={preview.book.title}
            author={authorName}
            logoText={logoText}
            logoUrl={logoUrl || undefined}
            coverBrief={coverBrief}
            coverLab={coverLab}
            onSelect={handleSelectVariant}
            onGenerate={() => void generateCoverLab(true, 3)}
            selectingVariantId={selectingVariantId}
            generating={coverGenerating}
            targetCount={coverTargetCount}
          />

          {/* Back cover */}
          {backCoverUrl && (
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Arka Kapak
                </div>
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[16px]">
                  <Image
                    src={backCoverUrl}
                    alt={`${preview.book.title} arka kapak`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* TOC */}
          {preview.preview.toc.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    İçindekiler
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {preview.preview.toc.length} bölüm
                  </span>
                </div>
                <div className="space-y-1.5">
                  {preview.preview.toc.map((item) => (
                    <div
                      key={`${item.number}-${item.title}`}
                      className="rounded-lg px-3 py-2 text-sm border-0 hover:bg-muted/60 transition-colors leading-6 text-foreground"
                    >
                      {item.number ? (
                        <span className="mr-1.5 font-semibold text-muted-foreground">{item.number}.</span>
                      ) : null}
                      {item.title}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── CENTER: Book info + Content ───────────────────────────────────── */}
        <div className="space-y-5">
          {/* Book header card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent">
            <CardContent className="p-6 md:p-8">
              {/* Badges */}
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-primary/12 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-primary border-0">
                  Preview
                </span>
                {generation.active && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    <Clock className="size-3" />
                    Canlı üretim
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl xl:text-5xl md:text-4xl xl:text-5xl">
                {preview.book.title}
              </h2>
              {preview.book.subtitle && (
                <p className="mt-3 text-base leading-7 text-muted-foreground md:text-lg">
                  {preview.book.subtitle}
                </p>
              )}
              {preview.book.description && (
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {preview.book.description}
                </p>
              )}

              {/* Meta strip */}
              <div className="mt-5">
                <BookMetaStrip
                  authorName={authorName}
                  imprint={imprint}
                  language={preview.book.language || "English"}
                  ratio={ratio}
                />
              </div>

              {/* Primary actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="min-w-[160px]"
                  onClick={() => {
                    if (premium) {
                      trackEvent("full_book_viewed", { slug });
                      router.push(
                        `/app/book/${encodeURIComponent(slug)}/workspace?tab=writing`,
                      );
                      return;
                    }
                    openUpgrade("full_unlock");
                  }}
                >
                  <BookOpen className="mr-2 size-4" />
                  {premium ? "Tam Kitabı Oku" : "Tam Kitabı Aç"}
                </Button>

                {premium ? (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      trackEvent("pdf_export_started", { slug });
                      router.push(
                        `/app/book/${encodeURIComponent(slug)}/workspace?tab=publish`,
                      );
                    }}
                  >
                    <Download className="mr-2 size-4" />
                    PDF / EPUB İndir
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => openUpgrade("pdf")}
                  >
                    <Download className="mr-2 size-4" />
                    PDF İndir
                  </Button>
                )}
              </div>

              {!premium ? (
                <div className="mt-6 rounded-[18px] border border-border/70 bg-background/70 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <TimerReset className="size-3.5 text-primary" />
                    Stüdyo notu
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Preview’ı deneyimledin. Şimdi kapağı seç, ilk okunabilir bölümü incele ve hazır olduğunda aynı sayfadan tek-kitap unlock ya da Starter ile devam et.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Readable sections */}
          {preview.preview.visible_sections.map((section, index) => (
            <VisibleSection
              key={`visible-${section.number}-${section.title}`}
              section={section}
              index={index}
              previewReady={Boolean(generation.preview_ready)}
              premium={premium}
            />
          ))}

          {/* Empty state while writing */}
          {!preview.preview.visible_sections.length && (
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/8">
                    <Loader2 className="size-4 animate-spin text-primary" />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      İlk okunabilir bölüm
                    </div>
                    <div className="mt-1 text-xl font-semibold text-foreground">Yazılıyor</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Sayfayı açık bırak — ilk bölüm gelince otomatik güncellenir. Genellikle 1–2 dakika sürer.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Locked sections */}
          {!premium && preview.preview.locked_sections.length > 0 && (
            <div>
              <div className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Kilitli bölümler ({preview.preview.locked_sections.length})
              </div>
              <div className="space-y-2">
                {preview.preview.locked_sections.map((section) => (
                  <LockedSectionCard
                    key={`locked-${section.number}-${section.title}`}
                    section={section}
                    onClick={() => {
                      trackEvent("preview_locked_section_clicked", {
                        slug,
                        section: section.title,
                      });
                      openUpgrade("full_unlock");
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Premium CTA + Author info ──────────────────────────────── */}
        <div className="space-y-4 xl:sticky xl:top-6 xl:h-fit">
          <PremiumCTA
            premium={premium}
            commerce={commerce}
            bonusLabel={bonusLabel}
            onUpgrade={openUpgrade}
            onPrimaryAction={() =>
              premium
                ? router.push(`/app/book/${encodeURIComponent(slug)}/workspace?tab=publish`)
                : router.push(`/app/book/${encodeURIComponent(slug)}/upgrade`)
            }
          />

          <NextStepsCard
            premium={premium}
            coverReady={Boolean(coverUrl)}
            previewReady={Boolean(generation.preview_ready)}
            productReady={effectiveProductReady}
            onUnlock={() => openUpgrade("full_unlock")}
          />

          {!premium ? (
            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Kanıt
                </div>
                {[
                  KDP_LIVE_BOOKS_CLAIM,
                  KDP_GUARANTEE_CLAIM,
                  NO_API_COST_CLAIM,
                  "Kapağı ve preview'i görmeden ödeme yapmazsın",
                  "Tek akışta preview, upgrade ve export kararı",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5 text-sm leading-6 text-foreground"
                  >
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {/* Author identity card */}
          {(authorBio || logoUrl || coverBrief) && (
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Book ID
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl bg-muted/30 px-3 py-3 border-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Yazar
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{authorName}</div>
                  </div>

                  {logoUrl && (
                    <div className="rounded-xl bg-muted/30 px-3 py-3 border-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Logo
                      </div>
                      <div className="relative mt-2 h-10 w-[120px] overflow-hidden rounded-md bg-muted/30">
                        <Image
                          src={logoUrl}
                          alt={`${logoText} logosu`}
                          fill
                          className="object-contain p-1"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}

                  {coverBrief && (
                    <div className="rounded-xl bg-muted/30 px-3 py-3 border-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Kapak vurgusu
                      </div>
                      <div className="mt-1 text-sm leading-6 text-foreground">{coverBrief}</div>
                    </div>
                  )}

                  {authorBio && (
                    <div className="rounded-xl bg-muted/30 px-3 py-3 border-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Yazar biyografisi
                      </div>
                      <div className="mt-1 text-sm leading-6 text-muted-foreground">{authorBio}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Mobile fixed bottom bar (non-premium only) ─────────────────────── */}
      {!premium && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/98 px-4 pb-safe pt-3 pb-4 backdrop-blur-lg shadow-[0_-8px_30px_rgba(0,0,0,0.08)] xl:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">
                {formatUsd(commerce?.primaryOffer.priceCents || 400)} ile tam kitabı aç
              </p>
              <p className="text-xs text-muted-foreground">
                PDF · EPUB · Tüm bölümler · 30 gün iade
              </p>
            </div>
            <Button
              size="default"
              className="shrink-0 font-bold shadow-md"
              onClick={() => openUpgrade("full_unlock")}
            >
              <Sparkles className="mr-1.5 size-3.5" aria-hidden="true" />
              $4 ile Yayınla
            </Button>
          </div>
        </div>
      )}

      {/* Bottom padding so content isn't hidden behind fixed bar */}
      {!premium && <div className="h-20 xl:hidden" />}

      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        slug={slug}
        commerce={commerce}
        authenticated={authenticated}
        onCheckoutSuccess={() => router.push(`/app/book/${encodeURIComponent(slug)}/upgrade`)}
      />
    </AppFrame>
  );
}
