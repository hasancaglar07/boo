"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import {
  Check,
  Shield,
  Zap,
  Star,
  Sparkles,
  Lock,
  ArrowRight,
  Clock,
  ChevronDown,
  ChevronUp,
  Crown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AppFrame } from "@/components/app/app-frame";
import { BackendUnavailableState } from "@/components/app/backend-unavailable-state";
import { Badge } from "@/components/ui/badge";
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
import { trackEvent, trackEventOnce } from "@/lib/analytics";
import { isBackendUnavailableError, loadBooks, type Book } from "@/lib/dashboard-api";
import { plans, premiumPlan } from "@/lib/marketing-data";
import { getPlan, syncPreviewAuthState, type PreviewPlan, type PreviewUsage } from "@/lib/preview-auth";
import { cn, formatDate } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CheckoutNoticeTone = "info" | "success" | "warning";
type BillingPeriod = "monthly" | "annual";

type CheckoutConfirmPayload = {
  ok?: boolean;
  fulfilled?: boolean;
  alreadyFulfilled?: boolean;
  planId?: string;
  usage?: PreviewUsage | null;
  error?: string;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const KDP_GUARANTEE_CLAIM = "KDP Uyumlu Format";
const REFUND_GUARANTEE_CLAIM = "14 Gün Para İade Garantisi";

const ANNUAL_DISCOUNT = 0.2; // 20% discount for annual

const PLAN_HIGHLIGHT_ID = "creator"; // "En Popüler" badge gösterilecek plan

const COMPARISON_FEATURES = [
  { label: "Kitap Üretimi", starter: "10 kitap/ay", creator: "30 kitap/ay", pro: "80 kitap/ay" },
  { label: "AI Kapak Hakkı", starter: "20 kapak/ay", creator: "60 kapak/ay", pro: "200 kapak/ay" },
  { label: "AI Bölüm Üretimi", starter: true, creator: true, pro: true },
  { label: "Çıkış Formatları", starter: "EPUB + PDF", creator: "EPUB + PDF + HTML", pro: "EPUB + PDF + HTML + MD" },
  { label: "Araştırma Merkezi", starter: false, creator: true, pro: true },
  { label: "KDP Pazar Analizi", starter: false, creator: true, pro: true },
  { label: "Çok Dilli Üretim", starter: true, creator: true, pro: true },
  { label: "API & Otomasyon", starter: false, creator: false, pro: true },
  { label: "Öncelikli Destek", starter: false, creator: true, pro: true },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BillingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* state ---------------------------------------------------------- */
  const [books, setBooks] = useState<Book[]>([]);
  const [planId, setPlanId] = useState<PreviewPlan>(() => getPlan());
  const [usage, setUsage] = useState<PreviewUsage | null>(null);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<PreviewPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const [checkoutNoticeTone, setCheckoutNoticeTone] = useState<CheckoutNoticeTone>("info");
  const [submitting, setSubmitting] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [comparisonOpen, setComparisonOpen] = useState(true);

  /* query params --------------------------------------------------- */
  const returnBook = searchParams.get("book") || "";
  const selectedPlanFromQuery = searchParams.get("plan");
  const autoStartCheckout = searchParams.get("autostart") === "1";
  const checkoutStatus = searchParams.get("checkout");
  const checkoutSessionId = searchParams.get("session_id") || "";

  /* refs ----------------------------------------------------------- */
  const autoStartHandledRef = useRef(false);
  const checkoutHandledRef = useRef("");

  /* derived -------------------------------------------------------- */
  const availablePlans = useMemo(
    () => (returnBook ? [premiumPlan, ...plans] : plans),
    [returnBook],
  );
  const pendingPlan = availablePlans.find((plan) => plan.id === pendingPlanId);
  const activePlan = availablePlans.find((plan) => plan.id === planId);

  /* hooks ---------------------------------------------------------- */
  const refreshBooks = useCallback(async () => {
    try {
      const loaded = await loadBooks();
      setBooks(loaded);
      setBackendUnavailable(false);
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        setBackendUnavailable(true);
        return;
      }
      console.error(error);
    }
  }, []);

  const refreshAuthState = useCallback(async () => {
    const payload = await syncPreviewAuthState();
    if (payload?.planId) {
      setPlanId(payload.planId);
    }
    if (payload?.usage) {
      setUsage(payload.usage);
    }
    return payload;
  }, []);

  const clearCheckoutQueryParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("checkout");
    params.delete("session_id");
    const nextPath = `/app/settings/billing${params.size ? `?${params.toString()}` : ""}`;
    router.replace(nextPath);
  }, [router, searchParams]);

  const handleConfirmPlan = useCallback(async () => {
    if (!pendingPlanId) return;

    setCheckoutError("");
    setSubmitting(true);

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: pendingPlanId,
        bookSlug: pendingPlanId === "premium" ? returnBook : undefined,
      }),
    }).catch(() => null);

    const payload = response
      ? ((await response.json().catch(() => null)) as {
          ok?: boolean;
          url?: string;
          error?: string;
        } | null)
      : null;

    if (!response?.ok || !payload?.url) {
      setCheckoutError(payload?.error || "Ödeme başlatılamadı. Lütfen tekrar dene.");
      autoStartHandledRef.current = false;
      setSubmitting(false);
      return;
    }

    trackEvent("checkout_started", { plan: pendingPlanId, book_slug: returnBook || null });
    window.location.assign(payload.url);
  }, [pendingPlanId, returnBook]);

  /* effects -------------------------------------------------------- */

  useEffect(() => {
    void refreshBooks();
    void refreshAuthState();
  }, [refreshAuthState, refreshBooks]);

  useEffect(() => {
    trackEventOnce(
      "billing_page_opened",
      { book_slug: returnBook || null },
      { key: `billing_page_opened:${returnBook || "none"}`, ttlMs: 15_000 },
    );
  }, [returnBook]);

  useEffect(() => {
    if (!selectedPlanFromQuery) return;
    const matchingPlan = availablePlans.find((plan) => plan.id === selectedPlanFromQuery);
    if (!matchingPlan) return;

    setCheckoutError("");
    setPendingPlanId(matchingPlan.id as PreviewPlan);
  }, [availablePlans, selectedPlanFromQuery]);

  useEffect(() => {
    if (!autoStartCheckout || !pendingPlanId || submitting || autoStartHandledRef.current) return;
    autoStartHandledRef.current = true;
    void handleConfirmPlan();
  }, [autoStartCheckout, handleConfirmPlan, pendingPlanId, submitting]);

  useEffect(() => {
    if (!checkoutStatus) return;
    const queryKey = `${checkoutStatus}:${checkoutSessionId}`;
    if (checkoutHandledRef.current === queryKey) return;
    checkoutHandledRef.current = queryKey;

    if (checkoutStatus === "cancelled") {
      setCheckoutNotice("Ödeme iptal edildi.");
      setCheckoutNoticeTone("warning");
      setPendingPlanId(null);
      setSubmitting(false);
      autoStartHandledRef.current = false;
      trackEvent("checkout_cancelled", { source: "billing_return" });
      clearCheckoutQueryParams();
      return;
    }

    if (checkoutStatus !== "success" || !checkoutSessionId) {
      clearCheckoutQueryParams();
      return;
    }

    setCheckoutNotice("Ödeme doğrulanıyor...");
    setCheckoutNoticeTone("info");
    setSubmitting(true);

    void (async () => {
      const response = await fetch("/api/stripe/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: checkoutSessionId }),
      }).catch(() => null);

      const payload = response
        ? ((await response.json().catch(() => null)) as CheckoutConfirmPayload | null)
        : null;

      if (payload?.alreadyFulfilled) {
        setCheckoutNotice("Bu plan zaten aktif.");
        setCheckoutNoticeTone("success");
        setSubmitting(false);
        await refreshAuthState();
        clearCheckoutQueryParams();
        return;
      }

      if (!payload?.ok) {
        setCheckoutNotice(payload?.error || "Ödeme doğrulanamadı.");
        setCheckoutNoticeTone("warning");
        setSubmitting(false);
        clearCheckoutQueryParams();
        return;
      }

      trackEvent("checkout_completed", { plan: payload.planId || null });
      setCheckoutNotice("Planın başarıyla aktifleştirildi!");
      setCheckoutNoticeTone("success");
      setSubmitting(false);
      await refreshAuthState();
      clearCheckoutQueryParams();
    })();
  }, [
    checkoutSessionId,
    checkoutStatus,
    clearCheckoutQueryParams,
    refreshAuthState,
    searchParams,
  ]);

  /* helpers -------------------------------------------------------- */

  const handleSelectPlan = useCallback(
    (id: string) => {
      setCheckoutError("");
      setPendingPlanId(id as PreviewPlan);
      trackEvent("pricing_cta_click", { plan: id, period: billingPeriod });
    },
    [billingPeriod],
  );

  const handleTogglePeriod = useCallback((period: BillingPeriod) => {
    setBillingPeriod(period);
    trackEvent("pricing_cta_click", { period });
  }, []);

  /* ---- render ---- */
  if (backendUnavailable) {
    return (
      <AppFrame current="billing" title="Planlar" books={[]}>
        <BackendUnavailableState />
      </AppFrame>
    );
  }

  const usagePercent =
    usage && typeof usage.limit === "number" && usage.limit > 0
      ? Math.min(100, Math.round((usage.usedBooks / usage.limit) * 100))
      : null;

  return (
    <AppFrame current="billing" title="Planlar" books={books}>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 md:py-10">

        {/* ── Compact Hero ────────────────────────────────────────── */}
        <div className="billing-animate-in-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="editorial-eyebrow mb-1">Faturalama</p>
              <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
                Planını Yönet
              </h1>
            </div>
            {activePlan && (
              <Badge
                className="inline-flex w-fit gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-sm text-primary"
              >
                <Crown className="size-3.5" />
                {activePlan.name}
              </Badge>
            )}
          </div>
        </div>

        {/* ── Checkout Notice ─────────────────────────────────────── */}
        {checkoutNotice && (
          <div
            className={cn(
              "billing-animate-in-2 rounded-xl border p-4 text-sm",
              checkoutNoticeTone === "success" &&
                "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
              checkoutNoticeTone === "warning" &&
                "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300",
              checkoutNoticeTone === "info" &&
                "border-primary/20 bg-primary/5 text-primary",
            )}
          >
            {checkoutNotice}
          </div>
        )}

        {/* ── Return-book notice ─────────────────────────────────── */}
        {returnBook && (
          <div className="billing-animate-in-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span>
                <strong>{returnBook}</strong> kitabın için premium erişim alıyorsun.
              </span>
            </div>
          </div>
        )}

        {/* ── Usage Card with Progress ───────────────────────────── */}
        {usage && (
          <Card className="billing-animate-in-3 border-border/60 bg-card/80">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  <span className="text-sm font-medium">Kullanımın</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {usage.usedBooks} / {usage.limit === null ? "∞" : usage.limit}{" "}
                  {usage.limit !== null && "kitap"}
                </span>
              </div>

              {/* progress bar */}
              {usagePercent !== null && (
                <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      usagePercent >= 90
                        ? "bg-destructive"
                        : usagePercent >= 60
                          ? "bg-amber-500"
                          : "bg-primary",
                    )}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              )}

              {usagePercent !== null && usagePercent >= 80 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {usagePercent >= 90
                      ? "Limitine yaklaştın! Planını yükselt."
                      : "Planını yükselterek daha fazla kitap üretebilirsin."}
                  </p>
                  <button
                    type="button"
                    className="inline-flex h-auto items-center p-0 text-xs text-primary hover:underline"
                    onClick={() => {
                      const el = document.getElementById("pricing-section");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Planları Gör
                    <ArrowRight className="ml-1 size-3" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Pricing Section ─────────────────────────────────── */}
        <div id="pricing-section" className="billing-animate-in-4">
          <div className="mb-6 text-center">
            <h2 className="font-serif text-2xl font-semibold tracking-tight">
              Senin İçin En İyi Planı Seç
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tüm planlar KDP uyumlu formatta. İstediğin zaman iptal et.
            </p>
          </div>

          {/* Annual / Monthly Toggle */}
          <div className="mb-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleTogglePeriod("monthly")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                billingPeriod === "monthly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Aylık
            </button>
            <button
              type="button"
              onClick={() => handleTogglePeriod("annual")}
              className={cn(
                "relative rounded-lg px-4 py-2 text-sm font-medium transition-all",
                billingPeriod === "annual"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Yıllık
              <span className="ml-1.5 inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                %20 İndirim
              </span>
            </button>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid gap-5 md:grid-cols-3">
            {availablePlans.map((plan) => {
              const isHighlight = plan.id === PLAN_HIGHLIGHT_ID;
              const isActive = planId === plan.id;
              const isPopular = plan.id === "creator";
              const displayPrice =
                billingPeriod === "annual" && "annualMonthlyPrice" in plan && plan.annualMonthlyPrice
                  ? plan.annualMonthlyPrice
                  : plan.price;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "group relative flex flex-col transition-all duration-300",
                    isHighlight
                      ? "border-primary/50 bg-card shadow-lg shadow-primary/10 ring-2 ring-primary/20 md:scale-105 md:z-10"
                      : "border-border/60 bg-card/80 hover:border-primary/30 hover:shadow-md",
                    isActive && "ring-2 ring-emerald-500/30",
                  )}
                >
                  {/* "En Popüler" Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-md">
                        <Star className="size-3" />
                        En Popüler
                      </span>
                    </div>
                  )}

                  <CardContent className="flex flex-1 flex-col p-6">
                    {/* Plan Header */}
                    <div className="mb-4">
                      <h3 className="font-serif text-lg font-semibold">{plan.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-3xl font-bold tracking-tight">
                          {displayPrice}
                        </span>
                        {plan.interval && (
                          <span className="text-sm text-muted-foreground">
                            /{billingPeriod === "annual" ? "ay (yıllık)" : plan.interval}
                          </span>
                        )}
                      </div>
                      {billingPeriod === "annual" &&
                        "annualMonthlyPrice" in plan &&
                        plan.annualMonthlyPrice && (
                          <p className="mt-1 text-xs text-muted-foreground line-through">
                            {plan.price}/{plan.interval}
                          </p>
                        )}
                    </div>

                    {/* Features */}
                    <ul className="mb-6 flex-1 space-y-2.5">
                      {plan.features.slice(0, 6).map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    {isActive ? (
                      <Button variant="outline" className="w-full" disabled>
                        <Check className="mr-2 size-4" />
                        Aktif Planın
                      </Button>
                    ) : (
                      <Button
                        variant={isHighlight ? "primary" : "secondary"}
                        className={cn(
                          "w-full transition-all duration-200",
                          isHighlight && "shadow-md hover:shadow-lg",
                        )}
                        onClick={() => handleSelectPlan(plan.id)}
                      >
                        {planId === "premium" ? "Yükselt" : "Planı Seç"}
                        <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── Comparison Table ─────────────────────────────────── */}
        <div className="billing-animate-in-5 mt-10">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-card/80 p-4 text-left transition-all hover:bg-card"
            onClick={() => setComparisonOpen(!comparisonOpen)}
          >
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              <span className="font-serif text-lg font-semibold">Plan Karşılaştırma</span>
            </div>
            {comparisonOpen ? (
              <ChevronUp className="size-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-5 text-muted-foreground" />
            )}
          </button>

          {comparisonOpen && (
            <div className="mt-2 overflow-x-auto rounded-xl border border-border/60 bg-card/80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="p-3 text-left font-medium text-muted-foreground">Özellik</th>
                    <th className="p-3 text-center font-medium">Temel</th>
                    <th className="p-3 text-center font-medium text-primary">Yazar</th>
                    <th className="p-3 text-center font-medium">Stüdyo</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_FEATURES.map((row, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td className="p-3 text-muted-foreground">{row.label}</td>
                      <td className="p-3 text-center">
                        {typeof row.starter === "boolean" ? (
                          row.starter ? (
                            <Check className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )
                        ) : (
                          row.starter
                        )}
                      </td>
                      <td className="p-3 text-center font-medium">
                        {typeof row.creator === "boolean" ? (
                          row.creator ? (
                            <Check className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )
                        ) : (
                          row.creator
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {typeof row.pro === "boolean" ? (
                          row.pro ? (
                            <Check className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )
                        ) : (
                          row.pro
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Trust Strip (simplified) ─────────────────────────── */}
        <div className="billing-animate-in-6 mt-10">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>{REFUND_GUARANTEE_CLAIM}</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              <span>SSL ile Güvenli Ödeme</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>{KDP_GUARANTEE_CLAIM}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Checkout Dialog ─────────────────────────────────────── */}
      <Dialog
        open={!!pendingPlanId}
        onOpenChange={(open) => {
          if (!open) {
            setPendingPlanId(null);
            setCheckoutError("");
            setSubmitting(false);
            autoStartHandledRef.current = false;
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {pendingPlan ? pendingPlan.name : "Plan"} Onayı
            </DialogTitle>
            <DialogDescription>
              <span className="sr-only">Plan değişikliğini onayla</span>
            </DialogDescription>
          </DialogHeader>

          {pendingPlan && (
            <div className="space-y-4">
              {/* Plan Summary */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-serif text-lg font-semibold">{pendingPlan.name}</p>
                    <p className="text-sm text-muted-foreground">{pendingPlan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-xl font-bold text-primary">
                      {billingPeriod === "annual" && "annualMonthlyPrice" in pendingPlan && pendingPlan.annualMonthlyPrice
                        ? pendingPlan.annualMonthlyPrice
                        : pendingPlan.price}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      /{billingPeriod === "annual" ? "ay (yıllık)" : pendingPlan.interval}
                    </p>
                  </div>
                </div>

                {/* Mini feature list */}
                <div className="mt-3 border-t border-border/40 pt-3">
                  <ul className="space-y-1.5">
                    {pendingPlan.features.slice(0, 4).map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Guarantee */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="flex items-start gap-2.5">
                  <Shield className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Güvenli Ödeme</p>
                    <p className="text-muted-foreground">
                      SSL korumalı ödeme. Memnun kalmazsan 14 gün içinde tam iade.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {checkoutError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-sm text-destructive">{checkoutError}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setPendingPlanId(null);
                setCheckoutError("");
                setSubmitting(false);
                autoStartHandledRef.current = false;
              }}
            >
              İptal
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => void handleConfirmPlan()}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Clock className="mr-2 size-4 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <Lock className="mr-2 size-4" />
                  Ödemeye Geç
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppFrame>
  );
}
