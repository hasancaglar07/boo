"use client";

import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { getPlan, syncPreviewAuthState, type PreviewPlan } from "@/lib/preview-auth";
import { cn } from "@/lib/utils";

export function BillingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [planId, setPlanId] = useState<PreviewPlan>(() => getPlan());
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<PreviewPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationSending, setVerificationSending] = useState(false);
  const returnBook = searchParams.get("book") || "";

  const availablePlans = useMemo(
    () => (returnBook ? [premiumPlan, ...plans] : plans),
    [returnBook],
  );
  const pendingPlan = availablePlans.find((plan) => plan.id === pendingPlanId);

  async function refreshBooks() {
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
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshBooks();
    void syncPreviewAuthState().then((payload) => {
      if (payload?.planId) {
        setPlanId(payload.planId);
      }
    });
  }, []);

  useEffect(() => {
    trackEvent("billing_page_opened", { book_slug: returnBook || null });
  }, [returnBook]);

  async function handleConfirmPlan() {
    if (!pendingPlanId) return;

    setCheckoutError("");
    setVerificationRequired(false);
    setVerificationMessage("");
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
          code?: string;
        } | null)
      : null;

    if (!response?.ok || !payload?.url) {
      setCheckoutError(payload?.error || "Ödeme başlatılamadı. Lütfen tekrar dene.");
      if (payload?.code === "EMAIL_NOT_VERIFIED") {
        setVerificationRequired(true);
        trackEvent("checkout_blocked_unverified", {
          source: "billing_screen",
          plan: pendingPlanId,
          book_slug: returnBook || null,
        });
      }
      setSubmitting(false);
      return;
    }

    trackEvent("checkout_started", { plan: pendingPlanId, book_slug: returnBook || null });
    window.location.href = payload.url;
  }

  async function handleResendVerification() {
    setVerificationSending(true);
    setVerificationMessage("");
    trackEvent("verification_resend_clicked", { source: "billing_screen", book_slug: returnBook || null });

    const response = await fetch("/api/auth/verify-email/resend", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);

    const payload = response
      ? ((await response.json().catch(() => null)) as { error?: string } | null)
      : null;

    if (!response?.ok) {
      setVerificationMessage(payload?.error || "Doğrulama maili tekrar gönderilemedi.");
      setVerificationSending(false);
      return;
    }

    setVerificationMessage("Doğrulama maili tekrar gönderildi.");
    setVerificationSending(false);
  }

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
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">
            İhtiyacına uygun planı seç. Premium ile tam kitap, PDF ve EPUB export açılır.
          </p>
          {returnBook ? (
            <p className="mt-2 text-sm text-primary">
              Bu ödeme tamamlanınca `{returnBook}` için tam erişim açılacak.
            </p>
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
                      setVerificationRequired(false);
                      setVerificationMessage("");
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
            setVerificationRequired(false);
            setVerificationMessage("");
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
            <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{checkoutError}</p>
              {verificationRequired ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Satın alma öncesi e-postanı doğrula
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Hesabın hazır. Checkout başlamadan önce doğrulama linkine tıklaman gerekiyor.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={() => void handleResendVerification()}
                    disabled={verificationSending}
                  >
                    {verificationSending ? "Gönderiliyor..." : "Doğrulama mailini tekrar gönder"}
                  </Button>
                </div>
              ) : null}
              {verificationMessage ? (
                <p className="text-sm text-muted-foreground">{verificationMessage}</p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setPendingPlanId(null);
                setCheckoutError("");
                setVerificationRequired(false);
                setVerificationMessage("");
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
