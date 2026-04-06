"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackEvent } from "@/lib/analytics";
import { sanitizeNextPath } from "@/lib/auth/safe-next";
import {
  getAccount,
  getSession,
  setAccount,
  syncPreviewAuthState,
} from "@/lib/preview-auth";

const DEFAULT_GOAL = "I want to prepare my first book quickly and in an organized way.";

type AuthFormMode = "login" | "register";
type AuthFormMethod = "google" | "magic" | "credentials";
type FeedbackState =
  | {
      variant: "success" | "error";
      title: string;
      description: string;
    }
  | null;

type AuthFormProps = {
  mode: AuthFormMode;
  variant?: "page" | "modal";
  next?: string;
  source?: string;
  showHeader?: boolean;
  redirectIfAuthenticated?: boolean;
  onSuccess?: (input: { method: "credentials"; mode: AuthFormMode }) => Promise<void> | void;
  onBusyChange?: (busy: boolean) => void;
  onMethodSelected?: (input: { method: AuthFormMethod; mode: AuthFormMode }) => void;
};

async function completeClientAuth(account?: {
  name: string;
  email: string;
  goal: string;
  publisherImprint: string;
  publisherLogoUrl: string;
}) {
  if (account) {
    setAccount(account);
  }
  await fetch("/api/auth/claim-guest-books", {
    method: "POST",
    credentials: "include",
  }).catch(() => null);
  await syncPreviewAuthState();
}

function normalizeAuthError(error: string) {
  const value = error.toLowerCase();

  if (
    value.includes("credentials") ||
    value.includes("signin") ||
    value.includes("invalid") ||
    value.includes("wrong")
  ) {
    return {
      title: "Incorrect credentials",
      description: "Email or password does not match.",
    };
  }

  if (value.includes("verify") || value.includes("verification")) {
    return {
      title: "Verification required",
      description: "You need to verify your email address.",
    };
  }

  return {
    title: "Login failed",
    description: error,
  };
}

export function AuthForm({
  mode,
  variant = "page",
  next: nextProp,
  source = "auth_form",
  showHeader = true,
  redirectIfAuthenticated = true,
  onSuccess,
  onBusyChange,
  onMethodSelected,
}: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storedAccount = useMemo(() => getAccount(), []);
  const fallbackNext = mode === "login" ? "/app/library" : "/start/topic";
  const next = sanitizeNextPath(nextProp || searchParams.get("next"), fallbackNext);
  const verified = searchParams.get("verified");
  const checkEmail = searchParams.get("checkEmail");

  const [name, setName] = useState(
    mode === "register" && storedAccount.name !== "Book Owner" ? storedAccount.name : "",
  );
  const [email, setEmail] = useState(storedAccount.email !== "example@mail.com" ? storedAccount.email : "");
  const goal = storedAccount.goal && storedAccount.goal !== DEFAULT_GOAL ? storedAccount.goal : "";
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [busyMethod, setBusyMethod] = useState<AuthFormMethod | null>(null);

  useEffect(() => {
    onBusyChange?.(busyMethod !== null);
  }, [busyMethod, onBusyChange]);

  useEffect(() => {
    if (checkEmail === "1") {
      setFeedback({
        variant: "success",
        title: "Link sent",
        description: "Check your email.",
      });
      toast.success("Link sent");
    } else if (verified === "1") {
      setFeedback({
        variant: "success",
        title: "Verified",
        description: "Your account is ready.",
      });
      toast.success("Verified");
    } else if (verified === "0") {
      setFeedback({
        variant: "error",
        title: "Invalid link",
        description: "It may have expired.",
      });
      toast.error("Invalid link");
    }
  }, [checkEmail, verified]);

  useEffect(() => {
    let active = true;

    void syncPreviewAuthState().then((payload) => {
      if (!active) return;
      if (redirectIfAuthenticated && (payload?.authenticated || getSession())) {
        router.replace(next);
      }
    });

    return () => {
      active = false;
    };
  }, [next, redirectIfAuthenticated, router]);

  const emailTrimmed = email.trim().toLowerCase();
  const nameTrimmed = name.trim();
  const goalTrimmed = goal.trim();
  const passwordTrimmed = password.trim();
  const credentialsDisabled = !emailTrimmed || !passwordTrimmed || (mode === "register" && !nameTrimmed);

  async function handleGoogle() {
    setFeedback(null);
    setBusyMethod("google");
    onMethodSelected?.({ method: "google", mode });
    if (mode === "register") {
      setAccount({
        name: nameTrimmed || storedAccount.name || "Book Owner",
        email: emailTrimmed || storedAccount.email || "example@mail.com",
        goal: goalTrimmed || storedAccount.goal || DEFAULT_GOAL,
        publisherImprint: storedAccount.publisherImprint || "",
        publisherLogoUrl: storedAccount.publisherLogoUrl || "",
      });
      trackEvent("signup_google_clicked", { source });
    } else {
      trackEvent("login_google_clicked", { source });
    }
    await signIn("google", { callbackUrl: next });
  }

  async function handleMagicLink() {
    if (!emailTrimmed) {
      setFeedback({
        variant: "error",
        title: "Email required",
        description: "Please enter your email address.",
      });
      toast.error("Email required");
      return;
    }

    setFeedback(null);
    setBusyMethod("magic");
    onMethodSelected?.({ method: "magic", mode });

    const result = await signIn("email", {
      email: emailTrimmed,
      redirect: false,
      callbackUrl: next,
    }).catch(() => null);

    if (result?.error) {
      setFeedback({
        variant: "error",
        title: "Could not be sent",
        description: "Please try again.",
      });
      toast.error("Could not be sent");
      setBusyMethod(null);
      return;
    }

    if (mode === "register") {
      setAccount({
        name: nameTrimmed || storedAccount.name || "Book Owner",
        email: emailTrimmed,
        goal: goalTrimmed || storedAccount.goal || DEFAULT_GOAL,
        publisherImprint: storedAccount.publisherImprint || "",
        publisherLogoUrl: storedAccount.publisherLogoUrl || "",
      });
      trackEvent("signup_magic_link_clicked", { source });
    } else {
      trackEvent("login_magic_link_clicked", { source });
    }

    setFeedback({
      variant: "success",
      title: "Link sent",
      description: "Click the link in your email.",
    });
    toast.success("Link sent");
    setBusyMethod(null);
  }

  async function handleCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!emailTrimmed) {
      setFeedback({
        variant: "error",
        title: "Email required",
        description: "Please enter your email address.",
      });
      toast.error("Email required");
      return;
    }
    if (!passwordTrimmed) {
      setFeedback({
        variant: "error",
        title: "Password is required",
        description: "Please enter your password.",
      });
      toast.error("Password is required");
      return;
    }
    if (mode === "register" && !nameTrimmed) {
      setFeedback({
        variant: "error",
        title: "Name required",
        description: "Please enter your name.",
      });
      toast.error("Name required");
      return;
    }

    setBusyMethod("credentials");
    onMethodSelected?.({ method: "credentials", mode });

    try {
      if (mode === "register") {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: nameTrimmed,
            email: emailTrimmed,
            password: passwordTrimmed,
            goal: "",
          }),
        });
        const registerPayload = (await registerResponse.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
        } | null;

        if (!registerResponse.ok) {
          setFeedback({
            variant: "error",
            title: "Registration failed",
            description: registerPayload?.error || "Please try again.",
          });
          toast.error("Registration failed");
          setBusyMethod(null);
          return;
        }

        trackEvent("signup_completed", {
          method: "credentials",
          source,
        });
      }

      const result = await signIn("credentials", {
        email: emailTrimmed,
        password: passwordTrimmed,
        redirect: false,
        callbackUrl: next,
      });

      if (result?.error) {
        const normalized = normalizeAuthError(result.error);
        setFeedback({
          variant: "error",
          ...normalized,
        });
        toast.error(normalized.title);
        setBusyMethod(null);
        return;
      }

      const account = {
        name: nameTrimmed || storedAccount.name || "Book Owner",
        email: emailTrimmed,
        goal: goalTrimmed || storedAccount.goal || DEFAULT_GOAL,
        publisherImprint: storedAccount.publisherImprint || "",
        publisherLogoUrl: storedAccount.publisherLogoUrl || "",
      };

      await completeClientAuth(account);

      if (onSuccess) {
        await onSuccess({ method: "credentials", mode });
        return;
      }

      window.location.assign(next);
    } catch {
      setFeedback({
        variant: "error",
        title: "An error occurred",
        description: "Please try again.",
      });
      toast.error("An error occurred");
    } finally {
      setBusyMethod(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Feedback Message */}
      {feedback ? (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          feedback.variant === "success" 
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" 
            : "bg-red-500/10 text-red-700 dark:text-red-400"
        }`}>
          <p className="font-medium">{feedback.title}</p>
          {feedback.description && (
            <p className="mt-1 text-xs opacity-80">{feedback.description}</p>
          )}
        </div>
      ) : null}

      {/* Social Auth - Google First (Higher Conversion) */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={busyMethod !== null}
          onClick={() => void handleGoogle()}
        >
          {busyMethod === "google" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {mode === "login" ? "Sign in with Google" : "Sign up with Google"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/40" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>
      </div>

      {/* Email & Password Form */}
      <form onSubmit={(event) => void handleCredentialsSubmit(event)} className="space-y-4">
        {/* Name Field - Only for Register */}
        {mode === "register" && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
              className="h-11"
            />
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@mail.com"
            required
            autoComplete="email"
            className="h-11"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            {mode === "login" && (
              <Link 
                href="/reset-password" 
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot?
              </Link>
            )}
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="h-11 pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11"
          disabled={credentialsDisabled || busyMethod !== null}
        >
          {busyMethod === "credentials" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : mode === "login" ? (
            "Sign In"
          ) : (
            "Sign Up"
          )}
        </Button>
      </form>

      {/* Magic Link - Subtle Alternative */}
      <div className="pt-2">
        <button
          type="button"
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          disabled={busyMethod !== null || !emailTrimmed}
          onClick={() => void handleMagicLink()}
        >
          {busyMethod === "magic" ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </span>
          ) : (
            "Don't want to enter password • Send email link"
          )}
        </button>
      </div>
    </div>
  );
}
