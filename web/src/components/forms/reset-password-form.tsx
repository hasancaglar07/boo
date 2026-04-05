"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

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
          title: "Sıfırlama isteği gönderilemedi",
          description: payload?.error || "Şu anda işlem tamamlanamadı. Lütfen tekrar dene.",
        };
        setFeedback(nextFeedback);
        toast.error(nextFeedback.title, { description: nextFeedback.description });
        return;
      }

      const nextFeedback = {
        variant: "success" as const,
        title: "Sıfırlama bağlantısı gönderildi",
        description: "E-postanı ve spam klasörünü kontrol et. Gelen link ile yeni şifreni belirleyebilirsin.",
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
        title: "Şifre çok kısa",
        description: "Yeni şifre en az 8 karakter olmalı.",
      };
      setFeedback(nextFeedback);
      toast.error(nextFeedback.title, { description: nextFeedback.description });
      return;
    }

    if (password !== passwordConfirm) {
      const nextFeedback = {
        variant: "error" as const,
        title: "Şifreler eşleşmiyor",
        description: "İki alana da aynı yeni şifreyi yazdığından emin ol.",
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
          title: "Şifre güncellenemedi",
          description: payload?.error || "Bağlantının süresi dolmuş olabilir. Yeni bir sıfırlama bağlantısı iste.",
          actionHref: "/reset-password",
          actionLabel: "Yeni bağlantı iste",
        };
        setFeedback(nextFeedback);
        toast.error(nextFeedback.title, { description: nextFeedback.description });
        return;
      }

      const nextFeedback = {
        variant: "success" as const,
        title: "Şifren güncellendi",
        description: "Artık yeni şifrenle giriş yapabilirsin.",
        actionHref: "/login",
        actionLabel: "Giriş sayfasına git",
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
          <div className="text-sm font-medium text-muted-foreground">Şifre Sıfırlama</div>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">
            {token ? "Yeni şifre belirle" : "Sıfırlama bağlantısı iste"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {token
              ? "Yeni şifreni belirle. Bu bağlantı tek kullanımlıktır ve güvenlik için sınırlı süreyle geçerlidir."
              : "Hesabın şifre ile oluşturulduysa e-postana sıfırlama bağlantısı göndeririz."}
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
                <Label htmlFor="new-password">Yeni şifre</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  placeholder="En az 8 karakter"
                />
              </div>
              <div>
                <Label htmlFor="new-password-confirm">Yeni şifre tekrar</Label>
                <Input
                  id="new-password-confirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  autoComplete="new-password"
                  required
                  placeholder="Yeni şifreyi tekrar yaz"
                />
              </div>
            </>
          ) : (
            <div>
              <Label htmlFor="reset-email">E-posta</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                placeholder="ornek@mail.com"
              />
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Hesabın bu e-posta ile varsa sıfırlama linki gönderilir. Güvenlik nedeniyle bazı durumlarda aynı mesajı gösterebiliriz.
              </p>
            </div>
          )}

          <Button className="w-full" size="lg" type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                İşleniyor
              </>
            ) : token ? (
              "Şifreyi Güncelle"
            ) : (
              "Sıfırlama Linki Gönder"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Girişe dön
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
