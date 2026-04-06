"use client";

import { useEffect, useState } from "react";
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
  Users,
  Zap,
} from "lucide-react";

import { AppFrame } from "@/components/app/app-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";
import { useAuthenticatedViewer } from "@/lib/use-authenticated-viewer";
import { useSessionGuard } from "@/lib/use-session-guard";

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

function displayName(name?: string | null, email?: string | null) {
  const n = String(name || "").trim();
  if (n && n !== "Book Creator") return n;
  return String(email || "").split("@")[0].replace(/[._-]+/g, " ").trim() || "Book Creator";
}

export function AffiliateDashboard() {
  const ready = useSessionGuard();
  const { viewer } = useAuthenticatedViewer(ready);
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(data.referralUrl)}`, "_blank");
  }

  function handleEmail() {
    if (!data) return;
    trackEvent("affiliate_email_clicked", { source: "affiliate_dashboard" });
    const subject = encodeURIComponent("Writing a book has never been this easy!");
    const body = encodeURIComponent(`Hello!\n\nYou can write professional books in minutes with AI at BookGenerator.net.\n\nTry it for free: ${data.referralUrl}\n\nHappy writing!`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  if (!ready || !viewer) return null;

  const readableName = displayName(viewer.name, viewer.email);

  return (
    <AppFrame
      current="affiliate"
      title="Affiliate"
      viewer={viewer}
    >
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        {/* ── Left: Main card — same language as home-screen hero ── */}
        <Card className="overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_top_right,_rgba(188,104,67,0.08),_transparent_60%)] transition-shadow hover:shadow-[0_4px_20px_rgba(188,104,67,0.12)]">
          <CardContent className="p-5 md:p-8 lg:p-12">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Affiliate Paneli
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                <CheckCircle2 className="mr-1 size-3" />
                Aktif
              </Badge>
              <Badge className="border-border/40">%30 Commission</Badge>
            </div>

            <h2 className="mt-5 text-balance text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
              Welcome, {readableName}
            </h2>

            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Your affiliate link was automatically created when you signed up. Copy and share the link below to earn <strong className="text-foreground">%30 commission</strong> kazanabilirsiniz.
            </p>

            {/* ── Affiliate URL kutusu ── */}
            <div className="mt-6 max-w-2xl">
              {loading ? (
                <div className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-4">
                  <div className="h-5 w-full animate-pulse rounded bg-muted" />
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-4 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={handleCopy}
                >
                  <LinkIcon className="size-4 shrink-0 text-primary/60" />
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground select-all">
                    {data?.referralUrl || "Loading..."}
                  </span>
                  <Copy className="size-4 shrink-0 text-muted-foreground/60" />
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="lg"
                  className="min-h-[48px]"
                  onClick={handleCopy}
                  disabled={!data}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="mr-1.5 size-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 size-4" />
                      Copy Link
                    </>
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-[48px]"
                  onClick={handleWhatsApp}
                  disabled={!data}
                >
                  WhatsApp
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-[48px]"
                  onClick={handleTwitter}
                  disabled={!data}
                >
                  X (Twitter)
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-[48px]"
                  onClick={handleEmail}
                  disabled={!data}
                >
                  <Mail className="mr-1.5 size-4" />
                  Email
                </Button>
              </div>

              {data && data.clicks > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  <span><strong className="text-foreground">{data.clicks}</strong> people clicked your link</span>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground">
                Commission: %30
              </div>
              <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground">
                Min. payment: $50
              </div>
              <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground">
                Monthly payment
              </div>
              <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground">
                No limit
              </div>
            </div>

            {/* ── Payment Talebi ── */}
            {data && (
              <div className="mt-8 rounded-[20px] border border-border/60 bg-card/40 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BadgeDollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-semibold text-foreground">Payment Talebi</h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Available: </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">${data.availableBalance.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Paid: </span>
                    <span className="font-semibold text-foreground">${data.paidOut.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bekleyen: </span>
                    <span className="font-semibold text-amber-600">${data.pendingPayout.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="mt-4 min-h-[48px]"
                  disabled={data.availableBalance < 50}
                  onClick={async () => {
                    const email = prompt("Enter your PayPal email address for payout:");
                    if (!email) return;
                    const res = await fetch("/api/referral/payout-request", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ method: "paypal", email }),
                    });
                    const json = await res.json();
                    if (json.ok) {
                      alert(`Your request has been received! $${json.payout.amount.toFixed(2)} — It will be processed as soon as possible.`);
                      window.location.reload();
                    } else {
                      alert(json.error || "An error occurred.");
                    }
                  }}
                >
                  <BadgeDollarSign className="mr-1.5 size-4" />
                  {data.availableBalance >= 50 ? "Request Payout" : `Min. $50 required (Remaining: $${(50 - data.availableBalance).toFixed(2)})`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Right: Statistics + info cards ── */}
        <div className="flex flex-col gap-5">
          {/* Statistics */}
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Clicks", value: data?.clicks ?? 0, icon: Users, numeric: true },
              { label: "Total Earnings", value: `$${(data?.totalEarned ?? 0).toFixed(2)}`, icon: DollarSign, numeric: false },
              { label: "Available Balance", value: `$${(data?.availableBalance ?? 0).toFixed(2)}`, icon: BadgeDollarSign, numeric: false, highlight: true },
              { label: "Conversion", value: `${data?.totalConversions ?? 0} (${data?.rewardedConversions ?? 0} rewarded)`, icon: CheckCircle2, numeric: false },
            ].map(({ label, value, icon: Icon, highlight }) => (
              <div
                key={label}
                className={`rounded-2xl border px-4 py-5 transition-all hover:border-border hover:bg-card ${
                  highlight
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-border/60 bg-card/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`size-3.5 ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/60"}`} />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {label}
                  </div>
                </div>
                <div className={`mt-2 text-2xl font-bold tabular-nums ${highlight ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Commission tablosu */}
          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <DollarSign className="size-3.5 text-muted-foreground/60" />
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Commission Tablosu
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { plan: "Starter", price: "$19", commission: "$5.70" },
                  { plan: "Creator", price: "$39", commission: "$11.70" },
                  { plan: "Pro", price: "$79", commission: "$23.70" },
                ].map((row) => (
                  <div key={row.plan} className="flex items-center justify-between rounded-[14px] border border-border/40 bg-background/50 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{row.plan}</div>
                      <div className="text-xs text-muted-foreground">Monthly {row.price}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">%30</div>
                      <div className="text-xs text-muted-foreground">{row.commission}/ay</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-[14px] border border-primary/15 bg-primary/5 px-4 py-2.5 text-[11px] leading-4 text-muted-foreground">
                You earn commission every month as long as the person you referred maintains their payment.
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="border-border/60 bg-card/50">
            <CardContent className="space-y-2 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  How It Works?
                </div>
              </div>

              {[
                {
                  icon: LinkIcon,
                  label: "Copy your link",
                  description: "Copy the special affiliate link above.",
                },
                {
                  icon: Share2,
                  label: "Share",
                  description: "Share via social media, blog, email, or WhatsApp.",
                },
                {
                  icon: Gift,
                  label: "Kazan",
                  description: "You earn 30% commission from everyone who signs up through your link and makes a payment.",
                },
              ].map(({ icon: Icon, label, description }) => (
                <button
                  key={label}
                  className="flex min-h-[64px] w-full items-start gap-3 rounded-[20px] border border-border/50 bg-background/50 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-accent/50"
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">{label}</div>
                    <div className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Recent Conversions */}
          {data && data.conversions.length > 0 && (
            <Card className="border-border/60 bg-card/50">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Users className="size-3.5 text-muted-foreground/60" />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Recent Conversions
                  </div>
                </div>
                <div className="space-y-2">
                  {data.conversions.slice(0, 10).map((c, i) => (
                    <div key={i} className="flex items-center justify-between rounded-[14px] border border-border/40 bg-background/50 px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{c.newUserName || c.newUserEmail || "User"}</div>
                        <div className="text-xs text-muted-foreground">{new Date(c.convertedAt).toLocaleDateString("en-US")}</div>
                      </div>
                      {c.rewardGranted ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" /> Rewarded
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                          <Clock className="size-3" /> Bekliyor
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
                  <BadgeDollarSign className="size-3.5 text-muted-foreground/60" />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Payment History
                  </div>
                </div>
                <div className="space-y-2">
                  {data.payoutRequests.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-[14px] border border-border/40 bg-background/50 px-4 py-3">
                      <div>
                        <div className="text-sm font-bold text-foreground">${p.amount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString("en-US")}</div>
                      </div>
                      {p.status === "paid" ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" /> Paid
                        </span>
                      ) : p.status === "open" || p.status === "draft" ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                          <Clock className="size-3" /> Bekliyor
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">{p.status}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="border-border/60 bg-card/50">
            <CardContent className="space-y-2 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Quick Actions
                </div>
              </div>

              <Link
                href="/app/library"
                className="flex min-h-[64px] w-full items-start gap-3 rounded-[20px] border border-border/50 bg-background/50 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-accent/50"
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BookOpen className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">Back to My Books</div>
                  <div className="mt-0.5 text-xs leading-5 text-muted-foreground">Return to library and writing area.</div>
                </div>
                <ArrowRight className="mt-2 size-4 text-muted-foreground/40" />
              </Link>

              <a
                href="mailto:affiliate@bookgenerator.net?subject=Affiliate%20Soru"
                className="flex min-h-[64px] w-full items-start gap-3 rounded-[20px] border border-border/50 bg-background/50 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-accent/50"
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Mail className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">Soru Sor</div>
                  <div className="mt-0.5 text-xs leading-5 text-muted-foreground">affiliate@bookgenerator.net — response within 2 business days.</div>
                </div>
                <ArrowRight className="mt-2 size-4 text-muted-foreground/40" />
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppFrame>
  );
}