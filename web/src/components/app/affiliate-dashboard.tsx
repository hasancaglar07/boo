"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Gift,
  LinkIcon,
  Mail,
  Share2,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

import { AppFrame } from "@/components/app/app-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";
import { useAuthenticatedViewer } from "@/lib/use-authenticated-viewer";
import { useSessionGuard } from "@/lib/use-session-guard";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConversionItem = {
  newUserEmail: string | null;
  newUserName: string | null;
  convertedAt: string;
  rewardGranted: boolean;
};

type CommissionItem = {
  amount: number;
  description: string;
  date: string;
};

type PayoutItem = {
  id: string;
  amount: number;
  status: string;
  date: string;
  description: string;
};

type AffiliateData = {
  ok: boolean;
  code: string;
  clicks: number;
  referralUrl: string;
  totalEarned: number;
  availableBalance: number;
  paidOut: number;
  pendingPayout: number;
  totalConversions: number;
  rewardedConversions: number;
  pendingConversions: number;
  conversions: ConversionItem[];
  recentCommissions: CommissionItem[];
  payoutRequests: PayoutItem[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayName(name?: string | null, email?: string | null) {
  const n = String(name || "").trim();
  if (n && n !== "Book Creator") return n;
  return (
    String(email || "")
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .trim() || "Book Creator"
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted/60 ${className ?? ""}`}
    />
  );
}

// ─── Payout Modal ─────────────────────────────────────────────────────────────

function PayoutModal({
  available,
  onClose,
  onSuccess,
}: {
  available: number;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid PayPal email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/referral/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "paypal", email: email.trim() }),
      });
      const json = await res.json();
      if (json.ok) {
        onSuccess(json.payout.amount);
      } else {
        setError(json.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border/60 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Request Payout</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              ${available.toFixed(2)} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              PayPal Email Address
            </label>
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@paypal.com"
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {error && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <X className="size-3" />
                {error}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-muted-foreground leading-5">
            <strong className="text-emerald-700 dark:text-emerald-400">
              ${available.toFixed(2)}
            </strong>{" "}
            will be sent to your PayPal within 3–5 business days after processing.
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Processing…
                </span>
              ) : (
                <>
                  <BadgeDollarSign className="mr-1.5 size-4" />
                  Confirm Payout
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────

function Toast({
  message,
  type = "success",
  onDismiss,
}: {
  message: string;
  type?: "success" | "error";
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md transition-all
        ${type === "success"
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300"
        }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="size-4 shrink-0" />
      ) : (
        <X className="size-4 shrink-0" />
      )}
      {message}
      <button onClick={onDismiss} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
        <X className="size-3" />
      </button>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  highlight?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 transition-all hover:shadow-sm ${
        highlight
          ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5"
          : "border-border/60 bg-card/50 hover:border-border hover:bg-card"
      }`}
    >
      {highlight && (
        <div className="absolute -right-4 -top-4 size-20 rounded-full bg-emerald-500/10 blur-xl" />
      )}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`flex size-7 items-center justify-center rounded-lg ${
            highlight
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-muted/60 text-muted-foreground"
          }`}
        >
          <Icon className="size-3.5" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24 mt-1" />
      ) : (
        <div
          className={`text-2xl font-bold tabular-nums leading-tight ${
            highlight ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
          }`}
        >
          {value}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AffiliateDashboard() {
  const ready = useSessionGuard();
  const { viewer } = useAuthenticatedViewer(ready);
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!ready) return;
    fetch("/api/referral/my-code")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData(json);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [ready]);

  function handleCopy() {
    if (!data) return;
    navigator.clipboard.writeText(data.referralUrl).catch(() => null);
    setCopied(true);
    trackEvent("affiliate_link_copied", { source: "affiliate_dashboard" });
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    if (!data) return;
    trackEvent("affiliate_whatsapp_clicked", { source: "affiliate_dashboard" });
    const text = `Write professional books in minutes with BookGenerator.net! ${data.referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function handleTwitter() {
    if (!data) return;
    trackEvent("affiliate_twitter_clicked", { source: "affiliate_dashboard" });
    const text = `I wrote a book in minutes with AI 🚀 Try BookGenerator.net:`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(data.referralUrl)}`,
      "_blank"
    );
  }

  function handleEmail() {
    if (!data) return;
    trackEvent("affiliate_email_clicked", { source: "affiliate_dashboard" });
    const subject = encodeURIComponent("Writing a book has never been this easy!");
    const body = encodeURIComponent(
      `Hello!\n\nYou can write professional books in minutes with AI at BookGenerator.net.\n\nTry it for free: ${data.referralUrl}\n\nHappy writing!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  function handlePayoutSuccess(amount: number) {
    setShowPayoutModal(false);
    setToast({
      message: `Payout request of $${amount.toFixed(2)} submitted! You'll receive it within 3–5 business days.`,
      type: "success",
    });
    setTimeout(() => window.location.reload(), 4500);
  }

  if (!ready || !viewer) return null;

  const readableName = displayName(viewer.name, viewer.email);
  const canRequestPayout = data && data.availableBalance >= 50;
  const remainingForPayout = data ? Math.max(0, 50 - data.availableBalance) : 50;

  return (
    <AppFrame current="affiliate" title="Affiliate" viewer={viewer}>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">

        {/* ── LEFT: Main hero card ── */}
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent transition-shadow hover:shadow-[0_4px_24px_rgba(188,104,67,0.1)]">
          <CardContent className="p-6 md:p-8 lg:p-10">

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                <Zap className="size-3" />
                Affiliate Panel
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1">
                <CheckCircle2 className="size-3" />
                Active
              </Badge>
              <Badge className="border-border/40 text-muted-foreground">
                30% Commission
              </Badge>
            </div>

            {/* Heading */}
            <h2 className="mt-5 text-balance text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-[2.6rem]">
              Welcome back,{" "}
              <span className="text-primary">{readableName}</span>
            </h2>

            <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
              Share your unique link and earn{" "}
              <strong className="text-foreground font-semibold">30% recurring commission</strong>{" "}
              every month for every user you refer.
            </p>

            {/* ── Affiliate link box ── */}
            <div className="mt-6 max-w-2xl space-y-3">
              {loading ? (
                <div className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-4">
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  aria-label="Click to copy affiliate link"
                >
                  <LinkIcon className="size-4 shrink-0 text-primary/60" />
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground select-all">
                    {data?.referralUrl ?? "Loading…"}
                  </span>
                  <span
                    className={`shrink-0 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      copied ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/60 group-hover:text-primary"
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        Copy
                      </>
                    )}
                  </span>
                </button>
              )}

              {/* Share buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="default"
                  className="min-h-[44px] gap-2"
                  onClick={handleCopy}
                  disabled={!data}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="size-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copy Link
                    </>
                  )}
                </Button>

                <Button
                  size="default"
                  variant="outline"
                  className="min-h-[44px] gap-2 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366]/50 dark:text-[#25D366]"
                  onClick={handleWhatsApp}
                  disabled={!data}
                >
                  <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </Button>

                <Button
                  size="default"
                  variant="outline"
                  className="min-h-[44px] gap-2"
                  onClick={handleTwitter}
                  disabled={!data}
                >
                  <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X / Twitter
                </Button>

                <Button
                  size="default"
                  variant="outline"
                  className="min-h-[44px] gap-2"
                  onClick={handleEmail}
                  disabled={!data}
                >
                  <Mail className="size-4" />
                  Email
                </Button>
              </div>

              {/* Click count */}
              {data && data.clicks > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5 text-primary/60" />
                  <strong className="text-foreground">{data.clicks.toLocaleString()}</strong>{" "}
                  people have clicked your link
                </p>
              )}
            </div>

            {/* Program terms pills */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "30% commission",
                "Min. $50 payout",
                "Monthly payments",
                "No referral limit",
              ].map((term) => (
                <div
                  key={term}
                  className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  {term}
                </div>
              ))}
            </div>

            {/* ── Payout section ── */}
            {data && (
              <div className="mt-8 rounded-2xl border border-border/60 bg-card/40 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10">
                    <BadgeDollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Earnings & Payout</h3>
                    <p className="text-xs text-muted-foreground">PayPal payouts processed monthly</p>
                  </div>
                </div>

                {/* Balance breakdown */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    {
                      label: "Available",
                      value: `$${data.availableBalance.toFixed(2)}`,
                      className: "text-emerald-700 dark:text-emerald-400 font-bold",
                    },
                    {
                      label: "Paid Out",
                      value: `$${data.paidOut.toFixed(2)}`,
                      className: "text-foreground font-semibold",
                    },
                    {
                      label: "Pending",
                      value: `$${data.pendingPayout.toFixed(2)}`,
                      className: "text-amber-600 dark:text-amber-400 font-semibold",
                    },
                  ].map(({ label, value, className }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-border/40 bg-background/50 px-3 py-2.5 text-center"
                    >
                      <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
                      <div className={`text-base tabular-nums ${className}`}>{value}</div>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="w-full min-h-[48px]"
                  disabled={!canRequestPayout}
                  onClick={() => setShowPayoutModal(true)}
                >
                  <BadgeDollarSign className="mr-2 size-4" />
                  {canRequestPayout
                    ? `Request Payout ($${data.availableBalance.toFixed(2)})`
                    : `$${remainingForPayout.toFixed(2)} more needed to reach $50 minimum`}
                </Button>

                {!canRequestPayout && data.availableBalance > 0 && (
                  <div className="mt-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground text-center">
                    Minimum payout threshold: $50 — keep sharing to reach it!
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── RIGHT: Stats + info ── */}
        <div className="flex flex-col gap-5">

          {/* Stat grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label="Link Clicks"
              value={data?.clicks.toLocaleString() ?? 0}
              icon={Users}
              loading={loading}
            />
            <StatCard
              label="Total Earned"
              value={`$${(data?.totalEarned ?? 0).toFixed(2)}`}
              icon={TrendingUp}
              loading={loading}
            />
            <StatCard
              label="Available"
              value={`$${(data?.availableBalance ?? 0).toFixed(2)}`}
              icon={BadgeDollarSign}
              highlight
              loading={loading}
            />
            <StatCard
              label="Conversions"
              value={
                loading
                  ? "—"
                  : `${data?.totalConversions ?? 0} (${data?.rewardedConversions ?? 0} ✓)`
              }
              icon={CheckCircle2}
              loading={loading}
            />
          </div>

          {/* Commission table */}
          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60">
                  <DollarSign className="size-3.5 text-muted-foreground" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Commission Rates
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { plan: "Starter", price: "$19/mo", commission: "$5.70/mo", pct: "30%" },
                  { plan: "Creator", price: "$39/mo", commission: "$11.70/mo", pct: "30%" },
                  { plan: "Pro", price: "$79/mo", commission: "$23.70/mo", pct: "30%" },
                ].map((row) => (
                  <div
                    key={row.plan}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-background/50 px-4 py-3 hover:border-primary/20 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-foreground">{row.plan}</div>
                      <div className="text-xs text-muted-foreground">{row.price}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">{row.pct}</div>
                      <div className="text-xs text-muted-foreground">{row.commission}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-xl border border-primary/15 bg-primary/5 px-4 py-2.5 text-[11px] leading-5 text-muted-foreground">
                You earn commission every month as long as the referred user keeps their subscription.
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                How It Works
              </div>
              <div className="space-y-2">
                {[
                  {
                    icon: LinkIcon,
                    label: "Copy your link",
                    description: "Your unique affiliate URL is ready above.",
                    step: "1",
                  },
                  {
                    icon: Share2,
                    label: "Share it anywhere",
                    description: "Social media, blog, email, WhatsApp — anywhere works.",
                    step: "2",
                  },
                  {
                    icon: Gift,
                    label: "Earn every month",
                    description: "30% commission recurring for every subscriber you refer.",
                    step: "3",
                  },
                ].map(({ icon: Icon, label, description, step }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/40 px-4 py-3"
                  >
                    <div className="relative mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-3.5" />
                      <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                        {step}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">{label}</div>
                      <div className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Conversions */}
          {data && data.conversions.length > 0 && (
            <Card className="border-border/60 bg-card/50">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60">
                    <Users className="size-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Recent Conversions
                  </span>
                </div>
                <div className="space-y-2">
                  {data.conversions.slice(0, 10).map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-border/40 bg-background/50 px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {c.newUserName || c.newUserEmail || "Anonymous User"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(c.convertedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      {c.rewardGranted ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          Rewarded
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <Clock className="size-3" />
                          Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          {data && data.payoutRequests.length > 0 && (
            <Card className="border-border/60 bg-card/50">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60">
                    <BadgeDollarSign className="size-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Payment History
                  </span>
                </div>
                <div className="space-y-2">
                  {data.payoutRequests.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-border/40 bg-background/50 px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-bold text-foreground tabular-nums">
                          ${p.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(p.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      {p.status === "paid" ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          Paid
                        </span>
                      ) : p.status === "open" || p.status === "draft" ? (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <Clock className="size-3" />
                          Processing
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground capitalize">
                          {p.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Quick Actions
              </div>
              <div className="space-y-2">
                <Link
                  href="/app/library"
                  className="flex min-h-[60px] w-full items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-4 py-3 transition-all hover:border-primary/30 hover:bg-accent/50 group"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">Back to My Books</div>
                    <div className="text-xs text-muted-foreground">Return to your library</div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                </Link>

                <a
                  href="mailto:affiliate@bookgenerator.net?subject=Affiliate%20Question"
                  className="flex min-h-[60px] w-full items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-4 py-3 transition-all hover:border-primary/30 hover:bg-accent/50 group"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">Contact Support</div>
                    <div className="text-xs text-muted-foreground">
                      affiliate@bookgenerator.net
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Payout modal ── */}
      {showPayoutModal && data && (
        <PayoutModal
          available={data.availableBalance}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={handlePayoutSuccess}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </AppFrame>
  );
}
