"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Copy,
  DollarSign,
  FileText,
  ImagePlus,
  LogOut,
  Mail,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  Upload,
  User2,
} from "lucide-react";
import { signOut } from "next-auth/react";

import { AppFrame } from "@/components/app/app-frame";
import { BackendUnavailableState } from "@/components/app/backend-unavailable-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import {
  clearClientAuthState,
  persistViewer,
} from "@/lib/preview-auth";
import { compactNumber } from "@/lib/utils";
import { useSessionGuard } from "@/lib/use-session-guard";
import { useAuthenticatedViewer } from "@/lib/use-authenticated-viewer";
import {
  isBackendUnavailableError,
  loadBooks,
  type Book,
} from "@/lib/dashboard-api";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  creator: "Author",
  pro: "Studio",
  premium: "Single Book",
};

function displayName(name?: string | null, email?: string | null) {
  const normalizedName = String(name || "").trim();
  if (normalizedName && normalizedName !== "Book Creator") {
    return normalizedName;
  }
  return String(email || "").split("@")[0] || "Book Creator";
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Logo file could not be read."));
    reader.readAsDataURL(file);
  });
}

/** Affiliate link copy + share component — quick access on profile page */
function AffiliateLinkCopy() {
  const [data, setData] = useState<{ referralUrl: string; clicks: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral/my-code")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData({ referralUrl: json.referralUrl, clicks: json.clicks });
      })
      .catch(() => null);
  }, []);

  function handleCopy() {
    if (!data) return;
    navigator.clipboard.writeText(data.referralUrl).catch(() => null);
    setCopied(true);
    trackEvent("affiliate_link_copied", { source: "profile" });
    setTimeout(() => setCopied(false), 2500);
  }

  function handleWhatsApp() {
    if (!data) return;
    trackEvent("affiliate_whatsapp_clicked", { source: "profile" });
    const text = `Write professional books in minutes with BookGenerator.net! ${data.referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function handleTwitter() {
    if (!data) return;
    trackEvent("affiliate_twitter_clicked", { source: "profile" });
    const text = `I wrote a book in minutes with AI 🚀 Try BookGenerator.net:`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(data.referralUrl)}`,
      "_blank",
    );
  }

  if (!data) {
    return (
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-full animate-pulse rounded-[14px] bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Link box - clickable, selectable */}
      <div className="flex items-center gap-2 rounded-[14px] border border-border/60 bg-background/70 px-3 py-2.5">
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground select-all">
          {data.referralUrl}
        </span>
      </div>
      {/* Large copy button */}
      <Button
        className="w-full min-h-[44px] text-sm font-semibold"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <CheckCircle2 className="mr-2 size-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="mr-2 size-4" />
            Copy Affiliate Link
          </>
        )}
      </Button>
      {/* Share buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-h-[38px] text-xs"
          onClick={handleWhatsApp}
        >
          WhatsApp
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 min-h-[38px] text-xs"
          onClick={handleTwitter}
        >
          X (Twitter)
        </Button>
      </div>
      {data.clicks > 0 && (
        <p className="text-center text-[10px] text-muted-foreground/70">
          {data.clicks} people clicked your link
        </p>
      )}
    </div>
  );
}

export function AccountScreen() {
  const ready = useSessionGuard();
  const router = useRouter();
  const { viewer, setViewer, refreshViewer } = useAuthenticatedViewer(ready);
  const [books, setBooks] = useState<Book[]>([]);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const sourceName = viewer?.name && viewer.name !== "Book Creator" ? viewer.name : "";
  const sourceGoal = viewer?.goal || "";
  const sourceImprint = viewer?.publisherImprint || "";
  const sourceLogoUrl = viewer?.publisherLogoUrl || "";
  const sourceKey = `${viewer?.id || "guest"}:${sourceName}:${sourceGoal}:${sourceImprint}:${sourceLogoUrl}:${viewer?.planId || "free"}`;
  const [draft, setDraft] = useState<{
    key: string;
    name: string;
    goal: string;
    publisherImprint: string;
    publisherLogoUrl: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const canCustomizePublisherBrand = viewer?.planId === "pro";
  const activeDraft = draft?.key === sourceKey ? draft : null;
  const name = activeDraft?.name ?? sourceName;
  const goal = activeDraft?.goal ?? sourceGoal;
  const publisherImprint = activeDraft?.publisherImprint ?? sourceImprint;
  const publisherLogoUrl = activeDraft?.publisherLogoUrl ?? sourceLogoUrl;

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
    if (!ready) return;
    let active = true;

    void (async () => {
      try {
        const loaded = await loadBooks();
        if (!active) return;
        setBooks(loaded);
        setBackendUnavailable(false);
      } catch (error) {
        if (!active) return;
        if (isBackendUnavailableError(error)) {
          setBackendUnavailable(true);
          return;
        }
        console.error(error);
      }
    })();

    return () => {
      active = false;
    };
  }, [ready]);

  function updateDraft(patch: Partial<{ name: string; goal: string; publisherImprint: string; publisherLogoUrl: string }>) {
    setDraft({
      key: sourceKey,
      name: patch.name ?? name,
      goal: patch.goal ?? goal,
      publisherImprint: patch.publisherImprint ?? publisherImprint,
      publisherLogoUrl: patch.publisherLogoUrl ?? publisherLogoUrl,
    });
  }

  const exports = useMemo(
    () => books.reduce((total, book) => total + Number(book.status?.export_count || 0), 0),
    [books],
  );

  if (!ready) return null;

  async function handleSave() {
    setSaving(true);
    setSaveMessage("");
    setSaveError("");

    const requestBody: {
      name: string;
      goal: string;
      publisherImprint?: string;
      publisherLogoUrl?: string;
    } = {
      name: name.trim(),
      goal: goal.trim(),
    };

    if (canCustomizePublisherBrand) {
      requestBody.publisherImprint = publisherImprint.trim();
      requestBody.publisherLogoUrl = publisherLogoUrl.trim();
    }

    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }).catch(() => null);

    const payload = response
      ? ((await response.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          viewer?: NonNullable<typeof viewer>;
        } | null)
      : null;

    if (!response?.ok || !payload?.viewer) {
      setSaveError(payload?.error || "Profile could not be updated.");
      setSaving(false);
      return;
    }

    persistViewer(payload.viewer);
    setViewer(payload.viewer);
    setDraft(null);
    setSaveMessage("Profile settings saved.");
    setSaving(false);
  }

  async function handlePublisherLogoUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setSaveError("Only image files can be uploaded.");
      return;
    }
    if (file.size > 750 * 1024) {
      setSaveError("Logo file must be smaller than 750 KB.");
      return;
    }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      updateDraft({ publisherLogoUrl: dataUrl });
      setSaveError("");
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Logo could not be uploaded.");
    }
  }

  async function handleResendVerification() {
    setVerificationSending(true);
    setVerificationMessage("");
    trackEvent("verification_resend_clicked", { source: "account_screen" });

    const response = await fetch("/api/auth/verify-email/resend", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);

    const payload = response
      ? ((await response.json().catch(() => null)) as { error?: string; message?: string } | null)
      : null;

    if (!response?.ok) {
      setVerificationMessage(payload?.error || "Verification email could not be resent.");
      setVerificationSending(false);
      return;
    }

    setVerificationMessage(payload?.message || "Verification email has been resent.");
    setVerificationSending(false);
    await refreshViewer();
  }

  async function handleLogout() {
    await signOut({ redirect: false, callbackUrl: "/" });
    clearClientAuthState();
    router.push("/");
    router.refresh();
  }

  return (
    <AppFrame
      current="account"
      title="Profile Settings"
      subtitle="Manage your name, writing goal, and account status."
      books={books}
      viewer={viewer}
    >
      {backendUnavailable ? (
        <div className="mb-6">
          <BackendUnavailableState onRetry={() => void refreshBooks()} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <Card className="overflow-hidden border-primary/15 bg-[radial-gradient(circle_at_top_right,_rgba(188,104,67,0.08),_transparent_60%)] transition-shadow hover:shadow-[0_4px_16px_rgba(188,104,67,0.08)]">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {viewer ? displayName(viewer.name, viewer.email).slice(0, 2).toUpperCase() : "BG"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-muted-foreground">Active account</div>
                  <div className="truncate text-xl font-semibold text-foreground">
                    {displayName(viewer?.name, viewer?.email)}
                  </div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">{viewer?.email}</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-border/50 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground">
                  Plan: {PLAN_LABELS[viewer?.planId || "free"] || "Free"}
                </span>
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    viewer?.emailVerified
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  {viewer?.emailVerified ? "Email verified" : "Verification pending"}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Card className="border-border/60 bg-card/50 transition-colors hover:border-border/80">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-3.5 text-muted-foreground/60" />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Books
                  </div>
                </div>
                <div className="mt-3 text-3xl font-bold text-foreground">{books.length}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Total books created with this account.
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/50 transition-colors hover:border-border/80">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Upload className="size-3.5 text-muted-foreground/60" />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Outputs
                  </div>
                </div>
                <div className="mt-3 text-3xl font-bold text-foreground">{compactNumber(exports)}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  PDF / EPUB and other export totals.
                </div>
              </CardContent>
            </Card>
          </div>

          {!viewer?.emailVerified ? (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    <ShieldAlert className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">Email verification required</div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Verify your email for account security, login recovery, and notifications. This step is required only once.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-[44px]"
                        onClick={() => void handleResendVerification()}
                        disabled={verificationSending}
                      >
                        {verificationSending ? "Sending..." : "Resend verification email"
                      </Button>
                    </div>
                    {verificationMessage ? (
                      <p className="mt-3 text-xs font-medium text-primary">{verificationMessage}</p>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">Email verified</div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Your account is ready for payment, export, and full access flows.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <User2 className="size-4.5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">Profile bilgileri</h2>
                  <p className="text-sm text-muted-foreground">
                    Library welcome area and wizard assumptions feed from this information.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="profile-name" className="text-sm">Display name</Label>
                  <Input
                    id="profile-name"
                    className="min-h-[48px] mt-2"
                    value={name}
                    onChange={(event) => updateDraft({ name: event.target.value })}
                    placeholder="Enter your name"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <Label htmlFor="profile-email" className="text-sm">Email</Label>
                  <div className="mt-2 flex min-h-[48px] items-center rounded-[20px] border border-border/60 bg-card px-4 text-[15px] text-muted-foreground">
                    <Mail className="mr-2 size-4 text-muted-foreground/60" />
                    {viewer?.email || "—"}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Label htmlFor="profile-goal" className="text-sm">Writing Goal</Label>
                <Textarea
                  id="profile-goal"
                  className="min-h-[120px] mt-2"
                  value={goal}
                  onChange={(event) => updateDraft({ goal: event.target.value })}
                  placeholder="Example: I want to produce a practical prompting guide for B2B teams."
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  This field clarifies hero messages and initial wizard assumptions.
                </p>
              </div>

              {canCustomizePublisherBrand ? (
                <div className="mt-6 rounded-[24px] border border-border/60 bg-background/50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">Publisher Brand</div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        In the Pro plan, define your profile logo once; it will appear as default in `/app/new/style`.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void handlePublisherLogoUpload(file);
                          }
                          event.currentTarget.value = "";
                        }}
                      />
                      <Button size="sm" variant="outline" className="min-h-[40px]" onClick={() => logoInputRef.current?.click()}>
                        <ImagePlus className="mr-1.5 size-3.5" />
                        Upload Logo
                      </Button>
                      {publisherLogoUrl ? (
                        <Button size="sm" variant="ghost" className="min-h-[40px]" onClick={() => updateDraft({ publisherLogoUrl: "" })}>
                          <Trash2 className="mr-1.5 size-3.5" />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="profile-imprint" className="text-sm">Imprint / Publisher Name</Label>
                      <Input
                        id="profile-imprint"
                        className="min-h-[48px] mt-2"
                        value={publisherImprint}
                        onChange={(event) => updateDraft({ publisherImprint: event.target.value })}
                        placeholder="e.g.: North Peak Press"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Unlike ready-made logos, it automatically carries your brand to the wizard and cover previews.
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-border/50 bg-card/60 p-4">
                      <div className="flex items-center gap-2">
                        <ImagePlus className="size-3.5 text-muted-foreground/60" />
                        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                          Preview
                        </div>
                      </div>
                      <div className="mt-3 flex min-h-[88px] items-center justify-center rounded-[18px] border border-border/50 bg-background/80 px-4 py-4">
                        {publisherLogoUrl ? (
                          <img
                            src={publisherLogoUrl}
                            alt={publisherImprint || "Publisher logo"}
                            className="h-14 w-auto max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="text-sm font-medium text-foreground">
                              {publisherImprint || "Logo yok"}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-muted-foreground">
                              PNG, JPG, WEBP veya SVG
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-[24px] border border-primary/15 bg-primary/5 p-5">
                  <div className="text-sm font-semibold text-foreground">Custom Publisher Logo</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Your own publisher wordmark’ını profil bazlı kaydetmek ve wizard’da otomatik kullanmak için Pro plan gerekir.
                  </p>
                  <div className="mt-4">
                    <Button variant="outline" className="min-h-[44px]" onClick={() => router.push("/app/settings/billing")}>
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              )}

              {saveError ? <p className="mt-4 text-sm text-destructive">{saveError}</p> : null}
              {saveMessage ? <p className="mt-4 text-sm text-primary">{saveMessage}</p> : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => void handleSave()} className="min-h-[48px]" isLoading={saving}>
                  Kaydet
                </Button>
                {!viewer?.emailVerified ? (
                  <Button
                    variant="outline"
                    className="min-h-[48px]"
                    onClick={() => void handleResendVerification()}
                    disabled={verificationSending}
                  >
                    {verificationSending ? "Sending..." : "Resend Verification Email"}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* ── Affiliate Paneli ── */}
          <Card className="overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_bottom_right,_rgba(188,104,67,0.10),_transparent_60%)]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <DollarSign className="size-4.5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">Affiliate — %30 Commission</h2>
                  <p className="text-sm text-muted-foreground">
                    Share your special link, earn 30% from every subscription.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[20px] border border-border/50 bg-background/80 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Your Affiliate Link
                </div>
                <AffiliateLinkCopy />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[16px] border border-border/50 bg-background/50 p-3 text-center">
                  <div className="text-2xl font-bold text-primary">%30</div>
                  <div className="text-xs text-muted-foreground">Commission rate</div>
                </div>
                <div className="rounded-[16px] border border-border/50 bg-background/50 p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">$50</div>
                  <div className="text-xs text-muted-foreground">Min. payment</div>
                </div>
                <div className="rounded-[16px] border border-border/50 bg-background/50 p-3 text-center">
                  <div className="text-xs font-medium text-muted-foreground">No limit</div>
                  <div className="text-xs text-muted-foreground">Invite limiti</div>
                </div>
              </div>

              <div className="mt-4 rounded-[16px] border border-primary/15 bg-primary/5 px-4 py-3 text-xs leading-5 text-muted-foreground">
                <strong className="text-foreground">How does it work?</strong> Affiliate linkini paylaş. Bağlantından üye olan ve payment yapan herkesten kalıcı olarak %30 commission kazanırsın. Paymentler aylık PayPal veya banka transferi ile yapılır.
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="size-4.5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">Account summary</h2>
                  <p className="text-sm text-muted-foreground">
                    These fields are read-only; plan and email changes are outside this iteration.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[20px] border border-border/50 bg-background/50 p-4">
                  <div className="flex items-center gap-2">
                    <Target className="size-3.5 text-muted-foreground/60" />
                    <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Plan
                    </div>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-foreground">
                    {PLAN_LABELS[viewer?.planId || "free"] || "Free"}
                  </div>
                </div>
                <div className="rounded-[20px] border border-border/50 bg-background/50 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-3.5 text-muted-foreground/60" />
                    <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Verifyma
                    </div>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-foreground">
                    {viewer?.emailVerified ? "OK" : "Pending"}
                  </div>
                </div>
                <div className="rounded-[20px] border border-border/50 bg-background/50 p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="size-3.5 text-muted-foreground/60" />
                    <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Hedef
                    </div>
                  </div>
                  <div className="mt-2 text-sm font-medium leading-6 text-foreground">
                    {viewer?.goal?.trim() ? viewer.goal : "No goal added yet."}
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-border/50 pt-5">
                <Button variant="ghost" className="min-h-[44px]" onClick={() => void handleLogout()}>
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppFrame>
  );
}