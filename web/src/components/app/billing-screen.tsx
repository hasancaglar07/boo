"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Check } from "lucide-react";
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
import { trackEvent } from "@/lib/analytics";
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
    trackEvent("billing_page_opened", { book_slug: returnBook || null });
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

  if (backendUnavailable) {
    return (
      <AppFrame current="billing" title="Planlar" books={[]}>
        <BackendUnavailableState onRetry={() => void refreshBooks()} />
      </AppFrame>
    );
  }

  return (
    <AppFrame current="billing" title="Planlar" books={books}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            İhtiyacına uygun planı seç. Premium ile tam kitap, PDF ve EPUB export açılır.
          </p>
          {returnBook ? (
            <p className="text-sm text-primary">
              Bu ödeme tamamlanınca `{returnBook}` için tam erişim açılacak.
            </p>
          ) : null}
          {usage ? (
            <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3 text-sm">
              <div className="font-medium text-foreground">
                Aktif plan: {availablePlans.find((item) => item.id === planId)?.name || planId}
              </div>
              <div className="mt-1 text-muted-foreground">
                Kalan kitap hakkı: {usage.limit === null ? "Sınırsız" : `${usage.remainingBooks}/${usage.limit}`}
                {usage.resetAt ? ` · Yenilenme: ${formatDate(usage.resetAt)}` : ""}
              </div>
            </div>
          ) : null}
          {checkoutNotice ? (
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm",
                checkoutNoticeTone === "success" && "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                checkoutNoticeTone === "warning" && "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                checkoutNoticeTone === "info" && "border-border/70 bg-card/70 text-muted-foreground",
              )}
            >
              {checkoutNotice}
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {availablePlans.map((plan) => {
            const isActive = plan.id === planId;
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col transition-shadow",
                  isActive
                    ? "border-primary/40 shadow-md shadow-primary/10 ring-1 ring-primary/20"
                    : "hover:shadow-sm",
                )}
              >
                {isActive ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                      Aktif
                    </span>
                  </div>
                ) : null}

                <CardContent className="flex flex-1 flex-col p-7">
                  <div>
                    <Badge>{plan.label}</Badge>
                    <div className="mt-4 text-xl font-semibold text-foreground">{plan.name}</div>
                    <div className="mt-3 flex items-end gap-1.5">
                      <span className="text-5xl font-bold tabular-nums text-foreground">{plan.price}</span>
                      <span className="mb-1.5 text-sm text-muted-foreground">{plan.interval}</span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                  </div>

                  <ul className="mt-6 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="mt-8 w-full"
                    variant={isActive ? "secondary" : "primary"}
                    disabled={isActive}
                    onClick={() => {
                      if (isActive) return;
                      setCheckoutError("");
                      setPendingPlanId(plan.id as PreviewPlan);
                    }}
                  >
                    {isActive ? "Mevcut planınız" : "Bu plana geç"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan değişikliğini onayla</DialogTitle>
            <DialogDescription>
              {pendingPlan
                ? `"${pendingPlan.name}" planına geçmek istediğinizden emin misiniz?`
                : "Bu plana geçmek istediğinizden emin misiniz?"}
            </DialogDescription>
          </DialogHeader>

          {checkoutError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{checkoutError}</p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setPendingPlanId(null);
                setCheckoutError("");
                setSubmitting(false);
                autoStartHandledRef.current = false;
              }}
            >
              İptal
            </Button>
            <Button onClick={() => void handleConfirmPlan()} disabled={submitting}>
              {submitting ? "İşleniyor..." : "Onayla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppFrame>
  );
}
