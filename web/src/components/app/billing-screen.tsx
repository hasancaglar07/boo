"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Check, Shield, Zap, Star, Sparkles, Lock, ArrowRight, Clock } from "lucide-react";
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

type CheckoutNoticeTone = "info" | "success" | "warning";

type CheckoutConfirmPayload = {
  ok?: boolean;
  fulfilled?: boolean;
  alreadyFulfilled?: boolean;
  planId?: string;
  usage?: PreviewUsage | null;
  error?: string;
};

const KDP_GUARANTEE_CLAIM = "KDP Uyumlu Format";
const REFUND_GUARANTEE_CLAIM = "14 Gün Para İade Garantisi";

export function BillingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [books, setBooks] = useState<Book[]>([]);
  const [planId, setPlanId] = useState<PreviewPlan>(() => getPlan());
  const [usage, setUsage] = useState<PreviewUsage | null>(null);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<PreviewPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const [checkoutNoticeTone, setCheckoutNoticeTone] = useState<CheckoutNoticeTone>("info");
  const [submitting, setSubmitting] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const returnBook = searchParams.get("book") || "";
  const selectedPlanFromQuery = searchParams.get("plan");
  const autoStartCheckout = searchParams.get("autostart") === "1";
  const checkoutStatus = searchParams.get("checkout");
  const checkoutSessionId = searchParams.get("session_id") || "";

  const autoStartHandledRef = useRef(false);
  const checkoutHandledRef = useRef("");

  const availablePlans = useMemo(
    () => (returnBook ? [premiumPlan, ...plans] : plans),
    [returnBook],
  );
  const pendingPlan = availablePlans.find((plan) => plan.id === pendingPlanId);
  const activePlan = availablePlans.find((plan) => plan.id === planId);

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

      if (response?.ok && payload?.ok) {
        if (payload.planId) {
          setPlanId(payload.planId as PreviewPlan);
        }
        if (payload.usage) {
          setUsage(payload.usage);
        } else {
          await refreshAuthState();
        }

        await refreshBooks();
        setCheckoutNotice("Ödeme tamamlandı. Planın ve kullanım kotan güncellendi.");
        setCheckoutNoticeTone("success");
        trackEvent("checkout_completed", {
          source: "billing_return",
          already_fulfilled: Boolean(payload.alreadyFulfilled),
          plan: payload.planId || null,
        });
      } else {
        setCheckoutNotice(payload?.error || "Ödeme doğrulanamadı. Lütfen tekrar dene.");
        setCheckoutNoticeTone("warning");
      }

      setPendingPlanId(null);
      setSubmitting(false);
      autoStartHandledRef.current = false;
      clearCheckoutQueryParams();
    })();
  }, [
    checkoutSessionId,
    checkoutStatus,
    clearCheckoutQueryParams,
    refreshAuthState,
    refreshBooks,
  ]);

  return (
    <AppFrame current="billing" title="Planlar" books={books}>
      {backendUnavailable ? (
        <div className="mx-auto mb-6 max-w-6xl">
          <BackendUnavailableState onRetry={() => void refreshBooks()} />
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm">
            <Sparkles className="size-4 text-primary" />
            <span className="font-medium text-primary">Kitap Üretiminin Geleceği</span>
          </div>

          <h1 className="editorial-title mb-4">
            Kitap Ustası<span className="text-primary">.</span>
          </h1>

          <p className="editorial-copy mx-auto mb-8">
            AI destekli kitap üretimi ile fikirlerini saniyeler içinde yayınlanmaya hazır kitaplara dönüştür.
            Sevdiğin yazma özgürlüğünü, modern AI gücüyle birleştir.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 shadow-sm">
              <Shield className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-muted-foreground">{KDP_GUARANTEE_CLAIM}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 shadow-sm">
              <Lock className="size-4 text-primary" />
              <span className="text-muted-foreground">{REFUND_GUARANTEE_CLAIM}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 shadow-sm">
              <Zap className="size-4 text-amber-500" />
              <span className="text-muted-foreground">Anında Teslimat</span>
            </div>
          </div>
        </div>

        {/* Current Usage Card */}
        {usage ? (
          <div className="mb-10 billing-animate-in-1">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Star className="size-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        {availablePlans.find((item) => item.id === planId)?.name || planId} Planı
                      </h3>
                      <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                        Aktif
                      </Badge>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-sm text-muted-foreground">Kalan Kitap Hakkı</div>
                        <div className="text-2xl font-bold tabular-nums text-foreground">
                          {usage.limit === null ? (
                            "Sınırsız"
                          ) : (
                            <>
                              <span className="text-primary">{usage.remainingBooks}</span>
                              <span className="text-muted-foreground">/{usage.limit}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {usage.resetAt ? (
                        <div>
                          <div className="text-sm text-muted-foreground">Yenilenme Tarihi</div>
                          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                            <Clock className="size-4 text-primary" />
                            {formatDate(usage.resetAt)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Checkout Notice */}
        {checkoutNotice ? (
          <div className="mb-8 billing-animate-in-2">
            <Card
              className={cn(
                "border-2",
                checkoutNoticeTone === "success" && "border-emerald-500/30 bg-emerald-500/5",
                checkoutNoticeTone === "warning" && "border-amber-500/30 bg-amber-500/5",
                checkoutNoticeTone === "info" && "border-border/60 bg-card/80",
              )}
            >
              <CardContent className="flex items-center gap-3 p-5">
                {checkoutNoticeTone === "success" && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                    <Check className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
                {checkoutNoticeTone === "warning" && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                    <Clock className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                )}
                {checkoutNoticeTone === "info" && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Clock className="size-5 text-primary animate-spin" />
                  </div>
                )}
                <p className={cn(
                  "text-base",
                  checkoutNoticeTone === "success" && "text-emerald-700 dark:text-emerald-300",
                  checkoutNoticeTone === "warning" && "text-amber-700 dark:text-amber-300",
                  checkoutNoticeTone === "info" && "text-muted-foreground",
                )}>
                  {checkoutNotice}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Return Book Notice */}
        {returnBook ? (
          <div className="mb-8 billing-animate-in-3">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Sparkles className="size-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    Ödeme tamamlandığında tam erişim açılacak
                  </div>
                  <p className="text-sm text-muted-foreground">
                    &quot;{returnBook}&quot; kitabın için tüm bölümler ve dışa aktarma seçenekleri kullanılabilir olacak.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Pricing Cards */}
        <div className="mb-12">
          <div className="grid gap-6 md:grid-cols-3">
            {availablePlans.map((plan, index) => {
              const isActive = plan.id === planId;
              const isPopular = plan.badge !== null;
              const isPending = plan.id === pendingPlanId;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "group relative flex flex-col transition-all duration-300",
                    "border-border/60 bg-card/80",
                    "hover:-translate-y-1 hover:shadow-lg",
                    isPopular && "billing-card-popular",
                    isActive
                      ? "border-primary/50 shadow-xl shadow-primary/10 ring-2 ring-primary/20"
                      : "hover:border-primary/30",
                    isPending && "ring-2 ring-primary/40",
                    `billing-animate-in billing-animate-in-${(index + 1) % 5}`,
                  )}
                >
                  {/* Popular Badge */}
                  {isPopular && !isActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 billing-badge-bounce">
                      <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold tracking-wide text-primary-foreground shadow-lg">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {/* Active Badge */}
                  {isActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-bold tracking-wide text-white shadow-lg">
                        Aktif Planın
                      </span>
                    </div>
                  )}

                  <CardContent className="flex flex-1 flex-col p-7">
                    {/* Plan Name & Label */}
                    <div className="mb-6">
                      <Badge
                        className={cn(
                          "mb-3 font-medium",
                          isPopular ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {plan.label}
                      </Badge>
                      <h3 className="font-serif text-2xl font-bold text-foreground">
                        {plan.name}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-6xl font-bold tabular-nums text-foreground tracking-tight">
                          {plan.price}
                        </span>
                        <span className="text-lg text-muted-foreground">{plan.interval}</span>
                      </div>
                      {plan.perUnit && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-semibold text-primary">{plan.perUnit}</span>
                        </div>
                      )}
                      {"annualMonthlyPrice" in plan && plan.annualMonthlyPrice && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <Zap className="size-3" />
                          Yıllık: {plan.annualMonthlyPrice}/ay
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="mb-8 flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm leading-relaxed text-foreground"
                        >
                          <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Check className="size-3.5 text-primary" />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      className={cn(
                        "relative overflow-hidden w-full min-h-[52px] text-base font-semibold transition-all duration-300",
                        isActive && "bg-muted hover:bg-muted/80",
                      )}
                      variant={isActive ? "secondary" : "primary"}
                      size="lg"
                      disabled={isActive}
                      onClick={() => {
                        if (isActive) return;
                        setCheckoutError("");
                        setPendingPlanId(plan.id as PreviewPlan);
                      }}
                    >
                      {isActive ? (
                        <>
                          <Check className="mr-2 size-5" />
                          Şu anki planın
                        </>
                      ) : isPending ? (
                        "Seçildi..."
                      ) : (
                        <>
                          {plan.name} Planını Seç
                          <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Comparison Toggle */}
        <div className="mb-8 text-center">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {showComparison ? "Gizle" : "Tüm Planları Karşılaştır"}
            <ArrowRight className={cn("size-4 transition-transform", showComparison ? "rotate-90" : "")} />
          </button>
        </div>

        {/* Feature Comparison */}
        {showComparison && (
          <div className="mb-12 billing-animate-in-5 overflow-hidden rounded-2xl border border-border/60 bg-card/80">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="p-4 text-left font-semibold text-foreground">
                      Özellikler
                    </th>
                    {availablePlans.map((plan) => (
                      <th
                        key={plan.id}
                        className={cn(
                          "p-4 text-center font-semibold",
                          plan.id === planId && "bg-primary/5",
                        )}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    "Aylık Kitap Üretimi",
                    "AI Kapak Üretimi",
                    "EPUB + PDF Çıktısı",
                    "Çok Dilli Desteği",
                    "Sihirbaz ile Hızlı Taslak",
                    "Bölüm Editörü",
                    "Kitap Çalışma Alanı",
                    "Standart Email Desteği",
                  ].map((feature, idx) => (
                    <tr
                      key={feature}
                      className={cn(
                        "border-b border-border/40 transition-colors",
                        idx % 2 === 0 && "bg-muted/20",
                        "hover:bg-primary/5",
                      )}
                    >
                      <td className="p-4 text-sm text-foreground">{feature}</td>
                      {availablePlans.map((plan) => {
                        const hasFeature = plan.features.some((f) => f.includes(feature.split(" ")[0]));
                        return (
                          <td
                            key={plan.id}
                            className={cn(
                              "p-4 text-center transition-colors",
                              plan.id === planId && "bg-primary/5",
                            )}
                          >
                            {hasFeature ? (
                              <div className="flex justify-center">
                                <Check className="size-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                            ) : (
                              <div className="text-muted-foreground">—</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trust & FAQ Section */}
        <div className="mb-12 billing-animate-in-5">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/60 bg-card/80">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Shield className="size-8 text-primary" />
                  <h3 className="font-serif text-xl font-semibold text-foreground">
                    Tam Güvendesin
                  </h3>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="mt-1 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>14 gün para iade garantisi - memnun kalmazsan, tam para iadesi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-1 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Gizli ücret yok - gördüğün fiyat, ödeyeceğin fiyat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-1 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Abonelikleri istediğin zaman iptal et, sorunsuz</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-1 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>KDP uyumlu formatlar - Amazon&apos;a yüklemeye hazır</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/80">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Zap className="size-8 text-primary" />
                  <h3 className="font-serif text-xl font-semibold text-foreground">
                    Neden Biz?
                  </h3>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="mt-1 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Profesyonel yazarlar tarafından tasarlandı</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-1 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>AI teknolojisi ile insan kalitesinde içerik</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-1 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Sürekli iyileştirilen özellikler</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-1 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Dedike müşteri desteği</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        {!activePlan || activePlan.id === "premium" ? (
          <div className="mb-8 text-center">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-card">
              <CardContent className="p-8">
                <h3 className="editorial-title mb-4">
                  Yaratıcılığını<span className="text-primary"> Serbest Bırak</span>
                </h3>
                <p className="mx-auto mb-6 max-w-xl text-base text-muted-foreground">
                  Binlerce yazar gibi sen de Kitap Ustası ile fikirlerini yayınlanmaya hazır kitaplara dönüştürmeye başla.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  className="h-14 px-8 text-lg"
                  onClick={() => {
                    setCheckoutError("");
                    setPendingPlanId("creator" as PreviewPlan);
                  }}
                >
                  Şimdi Başla
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      {/* Checkout Dialog */}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Plan Değişikliğini Onayla</DialogTitle>
            <DialogDescription>
              {pendingPlan ? (
                <>
                  <span className="font-semibold text-foreground">{pendingPlan.name}</span> planına geçmek istediğinden emin misin?
                  {"annualMonthlyPrice" in pendingPlan && pendingPlan.annualMonthlyPrice && (
                    <div className="mt-2 text-sm">
                      <span className="font-semibold text-primary">{pendingPlan.price}</span> /{pendingPlan.interval}
                    </div>
                  )}
                </>
              ) : (
                "Bu plana geçmek istediğinden emin misin?"
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Trust Notice */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="text-sm">
                <div className="font-semibold text-foreground">Güvenli Ödeme</div>
                <div className="text-muted-foreground">
                  Ödeme bilgilerin SSL ile korunuyor. Memnun kalmazsan, 14 gün içinde tam para iadesi alabilirsin.
                </div>
              </div>
            </div>
          </div>

          {checkoutError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{checkoutError}</p>
            </div>
          ) : null}

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
                  Ödemeye Geç
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppFrame>
  );
}
