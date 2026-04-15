"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { AuthAlert } from "@/components/auth/auth-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FeedbackState =
  | {
      variant: "success" | "error" | "info" | "warning";
      title: string;
      description: string;
      actionHref?: string;
      actionLabel?: string;
    }
  | null;

export function ResetPasswordForm() {
  const t = useTranslations("ResetPasswordForm");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [submitting, setSubmitting] = useState(false);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        const nextFeedback = {
          variant: "error" as const,
          title: t("errors.requestFailed.title"),
          description: payload?.error || t("errors.requestFailed.description"),
        };
        setFeedback(nextFeedback);
        toast.error(nextFeedback.title, { description: nextFeedback.description });
        return;
      }

      const nextFeedback = {
        variant: "success" as const,
        title: t("success.resetLinkSent.title"),
        description: t("success.resetLinkSent.description"),
      };
      setFeedback(nextFeedback);
      toast.success(nextFeedback.title, { description: nextFeedback.description });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (password.trim().length < 8) {
      const nextFeedback = {
        variant: "error" as const,
        title: t("errors.passwordTooShort.title"),
        description: t("errors.passwordTooShort.description"),
      };
      setFeedback(nextFeedback);
      toast.error(nextFeedback.title, { description: nextFeedback.description });
      return;
    }

    if (password !== passwordConfirm) {
      const nextFeedback = {
        variant: "error" as const,
        title: t("errors.passwordMismatch.title"),
        description: t("errors.passwordMismatch.description"),
      };
      setFeedback(nextFeedback);
      toast.error(nextFeedback.title, { description: nextFeedback.description });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        const nextFeedback = {
          variant: "error" as const,
          title: t("errors.confirmFailed.title"),
          description: payload?.error || t("errors.confirmFailed.description"),
          actionHref: "/reset-password",
          actionLabel: t("actions.requestNewLink"),
        };
        setFeedback(nextFeedback);
        toast.error(nextFeedback.title, { description: nextFeedback.description });
        return;
      }

      const nextFeedback = {
        variant: "success" as const,
        title: t("success.passwordUpdated.title"),
        description: t("success.passwordUpdated.description"),
        actionHref: "/login",
        actionLabel: t("actions.goToLogin"),
      };
      setFeedback(nextFeedback);
      toast.success(nextFeedback.title, { description: nextFeedback.description });
      setPassword("");
      setPasswordConfirm("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-lg border-border/70 bg-card/95 shadow-xl shadow-black/5 backdrop-blur">
      <CardContent className="p-8">
        <div className="mb-8">
          <div className="text-sm font-medium text-muted-foreground">Reset Password</div>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">
            {token ? "Set a new password" : "Request a reset link"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {token
              ? "Set your new password. This link is single-use and valid for a limited time for security purposes."
              : "If your account was created with a password, we'll send a reset link to your email."}
          </p>
        </div>

        {feedback ? (
          <AuthAlert
            variant={feedback.variant}
            title={feedback.title}
            description={feedback.description}
            actionHref={feedback.actionHref}
            actionLabel={feedback.actionLabel}
            className="mb-5"
          />
        ) : null}

        <form className="space-y-5" onSubmit={(event) => void (token ? confirmReset(event) : requestReset(event))}>
          {token ? (
            <>
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <Label htmlFor="new-password-confirm">Confirm new password</Label>
                <Input
                  id="new-password-confirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  autoComplete="new-password"
                  required
                  placeholder="Re-enter your new password"
                />
              </div>
            </>
          ) : (
            <div>
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                placeholder="example@mail.com"
              />
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                If an account exists with this email, a reset link will be sent. For security reasons, we may show the same message in some cases.
              </p>
            </div>
          )}

          <Button className="w-full" size="lg" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing
              </>
            ) : token ? (
              "Update Password"
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
