"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Sparkles } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import {
  getAccount,
  getSession,
  setAccount,
  syncPreviewAuthState,
  type PreviewAuthProviders,
} from "@/lib/preview-auth";

const DEFAULT_GOAL = "İlk kitabımı hızlıca üretmek istiyorum.";

async function finalizeAuth(next: string, account?: { name: string; email: string; goal: string }) {
  if (account) {
    setAccount(account);
  }
  await fetch("/api/auth/claim-guest-books", {
    method: "POST",
    credentials: "include",
  }).catch(() => null);
  await syncPreviewAuthState();
  window.location.assign(next);
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storedAccount = useMemo(() => getAccount(), []);
  const next = searchParams.get("next") || (mode === "login" ? "/app/library" : "/start/topic");
  const verified = searchParams.get("verified");
  const checkEmail = searchParams.get("checkEmail");

  const [name, setName] = useState(mode === "register" && storedAccount.name !== "Book Creator" ? storedAccount.name : "");
  const [email, setEmail] = useState(storedAccount.email !== "demo@example.com" ? storedAccount.email : "");
  const [goal, setGoal] = useState(storedAccount.goal && storedAccount.goal !== DEFAULT_GOAL ? storedAccount.goal : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyMethod, setBusyMethod] = useState<"google" | "magic" | "credentials" | null>(null);
  const [providers, setProviders] = useState<PreviewAuthProviders>({
    google: false,
    magicLink: true,
    credentials: true,
  });

  useEffect(() => {
    if (checkEmail === "1") {
      setMessage("Giriş linki e-postana gönderildi. Gelen kutunu kontrol et.");
    } else if (verified === "1") {
      setMessage("E-posta doğrulandı. Şimdi giriş yapabilirsin.");
    } else if (verified === "0") {
      setError("Doğrulama bağlantısı geçersiz veya süresi dolmuş.");
    }
  }, [checkEmail, verified]);

  useEffect(() => {
    let active = true;

    void syncPreviewAuthState().then((payload) => {
      if (!active) return;
      if (payload?.providers) {
        setProviders(payload.providers);
      }
      if (payload?.authenticated || getSession()) {
        router.replace(next);
      }
    });

    return () => {
      active = false;
    };
  }, [next, router]);

  const title = mode === "login" ? "Tekrar hoş geldin" : "Kitabını yazmaya başla";
  const description =
    mode === "login"
      ? "Google, magic link veya şifrenle giriş yap. Preview, kütüphane ve ödeme akışı aynı hesapta kalır."
      : "Google ile tek tıkta başla, istersen magic link veya şifreli hesap oluştur. Önizleme kaybolmaz.";

  const emailTrimmed = email.trim().toLowerCase();
  const nameTrimmed = name.trim();
  const goalTrimmed = goal.trim();
  const passwordTrimmed = password.trim();
  const credentialsDisabled =
    !emailTrimmed ||
    !passwordTrimmed ||
    (mode === "register" && !nameTrimmed);

  async function handleGoogle() {
    setError("");
    setMessage("");
    setBusyMethod("google");
    if (mode === "register") {
      setAccount({
        name: nameTrimmed || storedAccount.name || "Book Creator",
        email: emailTrimmed || storedAccount.email || "demo@example.com",
        goal: goalTrimmed || storedAccount.goal || DEFAULT_GOAL,
      });
      trackEvent("signup_google_clicked", { source: "auth_form" });
    } else {
      trackEvent("login_google_clicked", { source: "auth_form" });
    }
    await signIn("google", { callbackUrl: next });
  }

  async function handleMagicLink() {
    if (!emailTrimmed) {
      setError("Magic link için e-posta adresi gerekli.");
      return;
    }

    setError("");
    setMessage("");
    setBusyMethod("magic");

    const result = await signIn("email", {
      email: emailTrimmed,
      redirect: false,
      callbackUrl: next,
    }).catch(() => null);

    if (result?.error) {
      setError("Magic link gönderilemedi. Lütfen tekrar dene.");
      setBusyMethod(null);
      return;
    }

    if (mode === "register") {
      setAccount({
        name: nameTrimmed || storedAccount.name || "Book Creator",
        email: emailTrimmed,
        goal: goalTrimmed || storedAccount.goal || DEFAULT_GOAL,
      });
      trackEvent("signup_magic_link_clicked", { source: "auth_form" });
    } else {
      trackEvent("login_magic_link_clicked", { source: "auth_form" });
    }

    setMessage("Magic link gönderildi. Gelen kutunu kontrol et.");
    setBusyMethod(null);
  }

  async function handleCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!emailTrimmed) {
      setError("E-posta adresi gerekli.");
      return;
    }
    if (!passwordTrimmed) {
      setError("Şifre gerekli.");
      return;
    }
    if (mode === "register" && !nameTrimmed) {
      setError("Ad alanı gerekli.");
      return;
    }

    setBusyMethod("credentials");

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
            goal: goalTrimmed,
          }),
        });
        const registerPayload = (await registerResponse.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
        } | null;

        if (!registerResponse.ok) {
          setError(registerPayload?.error || "Kayıt oluşturulamadı.");
          return;
        }

        trackEvent("register_completion", {
          email_domain: emailTrimmed.split("@")[1] || "unknown",
        });
      }

      const result = await signIn("credentials", {
        email: emailTrimmed,
        password: passwordTrimmed,
        redirect: false,
        callbackUrl: next,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      await finalizeAuth(next, {
        name: nameTrimmed || storedAccount.name || "Book Creator",
        email: emailTrimmed,
        goal: goalTrimmed || storedAccount.goal || DEFAULT_GOAL,
      });
    } finally {
      setBusyMethod(null);
    }
  }

  const credentialsLabel =
    mode === "login" ? "E-posta ve şifre ile giriş yap" : "E-posta ve şifre ile hesap oluştur";

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="p-8">
        <div className="mb-8">
          <div className="text-sm font-medium text-muted-foreground">
            {mode === "login" ? "Giriş Yap" : "Ücretsiz Kaydol"}
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
        </div>

        <div className="space-y-3">
          {providers.google ? (
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={busyMethod !== null}
              onClick={() => void handleGoogle()}
            >
              {busyMethod === "google" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              Google ile devam et
            </Button>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={`${mode}-magic-email`}>Magic link e-postası</Label>
            <div className="flex gap-2">
              <Input
                id={`${mode}-magic-email`}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ornek@mail.com"
                autoComplete="email"
              />
              <Button
                type="button"
                variant="outline"
                disabled={busyMethod !== null}
                onClick={() => void handleMagicLink()}
              >
                {busyMethod === "magic" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>{credentialsLabel}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-5" onSubmit={(event) => void handleCredentialsSubmit(event)}>
          {mode === "register" ? (
            <div>
              <Label htmlFor="name">
                Ad <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ad Soyad"
                required
                autoComplete="name"
              />
            </div>
          ) : null}

          <div>
            <Label htmlFor="email">
              E-posta <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@mail.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <Label htmlFor="password">
              Şifre <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "register" ? "En az 8 karakter" : "Şifren"}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {mode === "register" ? (
            <div>
              <Label htmlFor="goal">Hedefin</Label>
              <Textarea
                id="goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="örnek: uzmanlığımı İngilizce bir rehbere dönüştürmek istiyorum"
                autoComplete="off"
              />
            </div>
          ) : (
            <div className="text-right">
              <Link href="/reset-password" className="text-sm text-primary hover:underline">
                Şifremi unuttum
              </Link>
            </div>
          )}

          {message ? (
            <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
              {message}
            </p>
          ) : null}

          {error ? (
            <p role="alert" aria-live="polite" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button className="w-full" size="lg" type="submit" disabled={credentialsDisabled || busyMethod !== null}>
            {busyMethod === "credentials" ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                İşleniyor
              </>
            ) : mode === "login" ? (
              "Giriş Yap"
            ) : (
              "Hesabımı Oluştur ve Başlat"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
