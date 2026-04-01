"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
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
        setError(payload?.error || "Sıfırlama isteği gönderilemedi.");
        return;
      }

      setMessage("Şifre sıfırlama bağlantısı e-postana gönderildi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.trim().length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor.");
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
        setError(payload?.error || "Şifre güncellenemedi.");
        return;
      }

      setMessage("Şifren güncellendi. Şimdi giriş yapabilirsin.");
      setPassword("");
      setPasswordConfirm("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="p-8">
        <div className="mb-8">
          <div className="text-sm font-medium text-muted-foreground">Şifre Sıfırlama</div>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">
            {token ? "Yeni şifre belirle" : "Sıfırlama bağlantısı iste"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {token
              ? "Yeni şifreni belirle. Bu bağlantı tek kullanımlıktır."
              : "Hesabın credentials ile oluşturulduysa e-postana sıfırlama bağlantısı göndeririz."}
          </p>
        </div>

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
              />
            </div>
          )}

          {message ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

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
          <Link href="/login" className="text-primary hover:underline">
            Girişe dön
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
