"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { FunnelShell } from "@/components/funnel/funnel-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";
import { loadFunnelDraft, saveFunnelDraft } from "@/lib/funnel-draft";
import {
  getAccount,
  getSession,
  setAccount,
  syncPreviewAuthState,
  type PreviewAuthProviders,
} from "@/lib/preview-auth";
import { sanitizeNextPath } from "@/lib/auth/safe-next";

const DEFAULT_GOAL = "I want to quickly preview my first book.";

export function ContinueAuthScreen({ mode }: { mode: "signup" | "login" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingAccount = useMemo(() => getAccount(), []);
  const next = sanitizeNextPath(searchParams.get("next"), "/app/library");
  const slug = searchParams.get("slug") || "";

  const [name, setName] = useState(existingAccount.name !== "Book Owner" ? existingAccount.name : "");
  const [email, setEmail] = useState(existingAccount.email !== "example@mail.com" ? existingAccount.email : "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyMethod, setBusyMethod] = useState<"google" | "magic" | "skip" | "password" | null>(null);
  const [providers, setProviders] = useState<PreviewAuthProviders>({
    google: false,
    magicLink: true,
    credentials: true,
  });

  useEffect(() => {
    let active = true;

    if (mode === "signup") {
      trackEvent("signup_prompt_shown", { source: "continue_auth", slug });
    }

    void syncPreviewAuthState().then((payload) => {
      if (!active) return;
      if (payload?.providers) {
        setProviders(payload.providers);
      }
      if (!payload?.authenticated && !getSession()) return;

      void fetch("/api/auth/claim-guest-books", {
        method: "POST",
        credentials: "include",
      }).finally(() => {
        if (active) {
          router.replace(next);
        }
      });
    });

    return () => {
      active = false;
    };
  }, [mode, next, router, slug]);

  function rememberDraftIdentity() {
    const normalizedEmail = email.trim().toLowerCase() || existingAccount.email || "example@mail.com";
    const normalizedName =
      name.trim() ||
      existingAccount.name ||
      normalizedEmail.split("@")[0].replace(/[._-]+/g, " ") ||
      "Book Owner";

    setAccount({
      name: normalizedName,
      email: normalizedEmail,
      goal: existingAccount.goal || DEFAULT_GOAL,
      publisherImprint: existingAccount.publisherImprint || "",
      publisherLogoUrl: existingAccount.publisherLogoUrl || "",
    });

    const draft = loadFunnelDraft();
    if (draft.generatedSlug === slug) {
      saveFunnelDraft({
        ...draft,
        authorName: draft.authorName || normalizedName,
        imprint: draft.imprint || "Book Generator",
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      normalizedEmail,
      normalizedName,
    };
  }

  async function handleGoogle() {
    setError("");
    setMessage("");
    setBusyMethod("google");
    rememberDraftIdentity();
    trackEvent(mode === "signup" ? "signup_google_clicked" : "login_google_clicked", {
      slug,
      source: "continue_auth",
    });
    await signIn("google", { callbackUrl: next });
  }

  async function handleMagicLink() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Email address is required for the email link.");
      trackEvent("auth_form_failed", { mode, method: "magic", reason: "missing_email", source: "continue_auth", slug });
      return;
    }

    setError("");
    setMessage("");
    setBusyMethod("magic");
    rememberDraftIdentity();

    const result = await signIn("email", {
      email: normalizedEmail,
      redirect: false,
      callbackUrl: next,
    }).catch(() => null);

    if (result?.error) {
      setError("Email link could not be sent. Please try again.");
      trackEvent("auth_form_failed", { mode, method: "magic", reason: "send_failed", source: "continue_auth", slug });
      setBusyMethod(null);
      return;
    }

    trackEvent(mode === "signup" ? "signup_magic_link_clicked" : "login_magic_link_clicked", {
      slug,
      source: "continue_auth",
    });
    trackEvent("magic_link_sent", { mode, source: "continue_auth", slug });
    setMessage("Login link sent. Check your inbox.");
    setBusyMethod(null);
  }

  async function handlePasswordContinue() {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail) {
      setError("Email is required to continue with password.");
      trackEvent("auth_form_failed", { mode, method: "credentials", reason: "missing_email", source: "continue_auth", slug });
      return;
    }

    if (!normalizedPassword) {
      setError("Password is required.");
      trackEvent("auth_form_failed", { mode, method: "credentials", reason: "missing_password", source: "continue_auth", slug });
      return;
    }

    setError("");
    setMessage("");
    setBusyMethod("password");
    rememberDraftIdentity();
    trackEvent("auth_form_submitted", { mode, method: "credentials", source: "continue_auth", slug });
    trackEvent("continue_auth_password_clicked", { slug, mode });

    try {
      if (mode === "signup") {
        const normalizedName =
          name.trim() ||
          existingAccount.name ||
          normalizedEmail.split("@")[0].replace(/[._-]+/g, " ") ||
          "Book Creator";

        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: normalizedName,
            email: normalizedEmail,
            password: normalizedPassword,
            goal: "",
          }),
        });

        const registerPayload = (await registerResponse.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
        } | null;

        if (!registerResponse.ok) {
          setError(registerPayload?.error || "Could not create account.");
          trackEvent("auth_form_failed", { mode, method: "credentials", reason: "register_failed", source: "continue_auth", slug });
          setBusyMethod(null);
          return;
        }

        trackEvent("signup_completed", {
          method: "credentials",
          source: "continue_auth",
          slug,
        });
      }

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password: normalizedPassword,
        redirect: false,
        callbackUrl: next,
      });

      if (result?.error) {
        setError(result.error);
        trackEvent("auth_form_failed", { mode, method: "credentials", reason: "login_failed", source: "continue_auth", slug });
        setBusyMethod(null);
        return;
      }

      await syncPreviewAuthState();
      await fetch("/api/auth/claim-guest-books", {
        method: "POST",
        credentials: "include",
      }).catch(() => null);

      router.push(next);
    } catch {
      setError("Could not continue with password. Please try again.");
      trackEvent("auth_form_failed", { mode, method: "credentials", reason: "unknown", source: "continue_auth", slug });
      setBusyMethod(null);
    }
  }

  function handleSkip() {
    setBusyMethod("skip");
    rememberDraftIdentity();
    trackEvent("auth_bridge_skipped", { slug, mode });
    router.push(next);
  }

  const title = mode === "signup" ? "Don't lose your preview" : "Return to your preview";
  const description =
    mode === "signup"
      ? "Link your preview and book draft to your account. When you're ready, open it from the same place, and decide whether to unlock or export from the same account."
      : "Link the book you started earlier to your account and return to the preview screen.";

  return (
    <FunnelShell
      eyebrow={mode === "signup" ? "Production in progress" : "Continue"}
      title={title}
      description={description}
      summary={[
        { label: "Status", value: slug ? "Preview is being prepared" : "Book flow active" },
        { label: "Next step", value: "Preview screen" },
        { label: "Opening", value: "Cover, outline and first 20% content" },
      ]}
    >
      <div className="space-y-8">
        <div className="rounded-[28px] border border-primary/20 bg-primary/8 p-5 md:p-6">
          <div className="text-lg font-semibold text-foreground">This is a book link, not a signup wall</div>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            This step is not a barrier. We're linking your preview and book draft to your account so that when you return, we can pick up right where you left off. No payment is required here.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[22px] border border-border/70 bg-card/70 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              What opens now
            </div>
            <div className="mt-2 text-sm leading-6 text-foreground">
              Cover, chapter plan and free preview.
            </div>
          </div>
          <div className="rounded-[22px] border border-border/70 bg-card/70 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              You decide later
            </div>
            <div className="mt-2 text-sm leading-6 text-foreground">
              If you like it, you can unlock the full book, PDF and EPUB.
            </div>
          </div>
          <div className="rounded-[22px] border border-primary/20 bg-primary/5 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Why an account
            </div>
            <div className="mt-2 text-sm leading-6 text-foreground">
              Your book won't be lost. You can return from any device and pick up where you left off.
            </div>
          </div>
        </div>

        {mode === "signup" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <label htmlFor="continue-name" className="text-sm font-semibold text-foreground">
                Name
              </label>
              <Input
                id="continue-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full Name"
                className="h-14"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="continue-email" className="text-sm font-semibold text-foreground">
                Email
              </label>
              <Input
                id="continue-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@mail.com"
                className="h-14"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label htmlFor="continue-login-email" className="text-sm font-semibold text-foreground">
              Email
            </label>
            <Input
              id="continue-login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@mail.com"
              className="h-14"
            />
          </div>
        )}

        {message ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="space-y-3">
          {providers.google ? (
            <Button size="lg" className="w-full" disabled={busyMethod !== null} onClick={() => void handleGoogle()}>
              {busyMethod === "google" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              Continue with Google
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled={busyMethod !== null}
            onClick={() => void handleMagicLink()}
          >
            {busyMethod === "magic" ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Mail className="mr-2 size-4" />
            )}
            Send Email Link
          </Button>

          <div className="rounded-[24px] border border-border/70 bg-card/70 p-4">
            <p className="text-sm font-semibold text-foreground">Continue with password</p>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              You can continue right here without going to a separate page.
            </p>
            <div className="mt-4 space-y-3">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                  className="h-12 pr-14"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                disabled={busyMethod !== null}
                onClick={() => void handlePasswordContinue()}
              >
                {busyMethod === "password" ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                {mode === "signup" ? "Create account and continue" : "Continue with password"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button variant="outline" size="lg" className="w-full" asChild>
              <Link href={`/${mode}?next=${encodeURIComponent(next)}`}>
                Open full page flow
              </Link>
            </Button>
          </div>

          {mode === "signup" ? (
            <div className="rounded-[20px] border border-dashed border-border/70 bg-background/50 px-4 py-3 text-center">
              <p className="text-xs leading-6 text-muted-foreground">
                You can return to the preview first if you want. But to find, open and export your book later, you'll need to link it to your account.
              </p>
              <button
                type="button"
                className="mt-2 text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
                disabled={busyMethod !== null}
                onClick={handleSkip}
              >
                {busyMethod === "skip" ? "Going to preview..." : "Return to preview anyway"}
              </button>
            </div>
          ) : null}

          <p className="text-center text-xs text-muted-foreground/70">
            No credit card required · Free preview · Cancel anytime
          </p>
        </div>
      </div>
    </FunnelShell>
  );
}
