"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Sparkles } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackEvent } from "@/lib/analytics";
import {
  getAccount,
  getSession,
  setAccount,
  syncPreviewAuthState,
  type PreviewAuthProviders,
} from "@/lib/preview-auth";

const DEFAULT_GOAL = "İlk kitabımı hızlıca üretmek istiyorum.";

type AuthFormMode = "login" | "register";
type AuthFormMethod = "google" | "magic" | "credentials";

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

export function AuthForm({
  mode,
  variant = "page",
  next: nextProp,
  source = "auth_form",
  showHeader = true,
  redirectIfAuthenticated = variant === "page",
  onSuccess,
  onBusyChange,
  onMethodSelected,
}: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storedAccount = useMemo(() => getAccount(), []);
  const next = nextProp || searchParams.get("next") || (mode === "login" ? "/app/library" : "/start/topic");
  const verified = searchParams.get("verified");
  const checkEmail = searchParams.get("checkEmail");

  const [name, setName] = useState(
    mode === "register" && storedAccount.name !== "Book Creator" ? storedAccount.name : "",
  );
  const [email, setEmail] = useState(storedAccount.email !== "demo@example.com" ? storedAccount.email : "");
  const goal =
    storedAccount.goal && storedAccount.goal !== DEFAULT_GOAL ? storedAccount.goal : "";
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyMethod, setBusyMethod] = useState<AuthFormMethod | null>(null);
  const [providers, setProviders] = useState<PreviewAuthProviders>({
    google: false,
    magicLink: true,
    credentials: true,
  });

  useEffect(() => {
    onBusyChange?.(busyMethod !== null);
  }, [busyMethod, onBusyChange]);

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
      if (redirectIfAuthenticated && (payload?.authenticated || getSession())) {
        router.replace(next);
      }
    });

    return () => {
      active = false;
    };
  }, [next, redirectIfAuthenticated, router]);

  const title = mode === "login" ? "Tekrar hoş geldin" : "Kitabını yazmaya başla";
  const description =
    mode === "login"
      ? "Google, magic link veya şifrenle giriş yap. Preview, kütüphane ve ödeme akışı aynı hesapta kalır."
      : "Tek email alanı ile başla. Google, magic link veya şifreli hesap seçeneklerinden birini seç; preview kaybolmaz.";

  const emailTrimmed = email.trim().toLowerCase();
  const nameTrimmed = name.trim();
  const goalTrimmed = goal.trim();
  const passwordTrimmed = password.trim();
  const credentialsDisabled =
    !emailTrimmed ||
    !passwordTrimmed ||
    (mode === "register" && !nameTrimmed);

  const credentialsLabel =
    mode === "login" ? "E-posta ve şifre ile giriş yap" : "E-posta ve şifre ile hesap oluştur";
  const submitLabel =
    mode === "login"
      ? source === "generate_gate"
        ? "Giriş Yap ve Kitabı Başlat"
        : "Giriş Yap"
      : source === "generate_gate"
        ? "Hesabımı Oluştur ve Kitabı Başlat"
        : "Hesabımı Oluştur ve Başlat";

  function emitGenerateGateEvent(event: "generate_auth_gate_method_selected" | "generate_auth_gate_failed", properties: Record<string, string>) {
    if (source !== "generate_gate") return;
    trackEvent(event, properties);
  }

  async function handleGoogle() {
    setError("");
    setMessage("");
    setBusyMethod("google");
    onMethodSelected?.({ method: "google", mode });
    emitGenerateGateEvent("generate_auth_gate_method_selected", { method: "google", mode });
    if (mode === "register") {
      setAccount({
        name: nameTrimmed || storedAccount.name || "Book Creator",
        email: emailTrimmed || storedAccount.email || "demo@example.com",
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
      const nextError = "Magic link için e-posta adresi gerekli.";
      setError(nextError);
      trackEvent("auth_form_failed", { mode, method: "magic", reason: "missing_email", source });
      emitGenerateGateEvent("generate_auth_gate_failed", { method: "magic", mode, reason: "missing_email" });
      return;
    }

    setError("");
    setMessage("");
    setBusyMethod("magic");
    onMethodSelected?.({ method: "magic", mode });
    emitGenerateGateEvent("generate_auth_gate_method_selected", { method: "magic", mode });

    const result = await signIn("email", {
      email: emailTrimmed,
      redirect: false,
      callbackUrl: next,
    }).catch(() => null);

    if (result?.error) {
      setError("Magic link gönderilemedi. Lütfen tekrar dene.");
      trackEvent("auth_form_failed", { mode, method: "magic", reason: "send_failed", source });
      emitGenerateGateEvent("generate_auth_gate_failed", { method: "magic", mode, reason: "send_failed" });
      setBusyMethod(null);
      return;
    }

    if (mode === "register") {
      setAccount({
        name: nameTrimmed || storedAccount.name || "Book Creator",
        email: emailTrimmed,
        goal: goalTrimmed || storedAccount.goal || DEFAULT_GOAL,
        publisherImprint: storedAccount.publisherImprint || "",
        publisherLogoUrl: storedAccount.publisherLogoUrl || "",
      });
      trackEvent("signup_magic_link_clicked", { source });
    } else {
      trackEvent("login_magic_link_clicked", { source });
    }

    trackEvent("magic_link_sent", { mode, source });
    setMessage("Magic link gönderildi. Gelen kutunu kontrol et.");
    setBusyMethod(null);
  }

  async function handleCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!emailTrimmed) {
      setError("E-posta adresi gerekli.");
      trackEvent("auth_form_failed", { mode, method: "credentials", reason: "missing_email", source });
      emitGenerateGateEvent("generate_auth_gate_failed", {
        method: "credentials",
        mode,
        reason: "missing_email",
      });
      return;
    }
    if (!passwordTrimmed) {
      setError("Şifre gerekli.");
      trackEvent("auth_form_failed", { mode, method: "credentials", reason: "missing_password", source });
      emitGenerateGateEvent("generate_auth_gate_failed", {
        method: "credentials",
        mode,
        reason: "missing_password",
      });
      return;
    }
    if (mode === "register" && !nameTrimmed) {
      setError("Ad alanı gerekli.");
      trackEvent("auth_form_failed", { mode, method: "credentials", reason: "missing_name", source });
      emitGenerateGateEvent("generate_auth_gate_failed", {
        method: "credentials",
        mode,
        reason: "missing_name",
      });
      return;
    }

    setBusyMethod("credentials");
    trackEvent("auth_form_submitted", { mode, method: "credentials", source });
    onMethodSelected?.({ method: "credentials", mode });
    emitGenerateGateEvent("generate_auth_gate_method_selected", { method: "credentials", mode });

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
          setError(registerPayload?.error || "Kayıt oluşturulamadı.");
          trackEvent("auth_form_failed", { mode, method: "credentials", reason: "register_failed", source });
          emitGenerateGateEvent("generate_auth_gate_failed", {
            method: "credentials",
            mode,
            reason: "register_failed",
          });
          return;
        }

        trackEvent("register_completion", {
          email_domain: emailTrimmed.split("@")[1] || "unknown",
          source,
        });
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
        setError(result.error);
        trackEvent("auth_form_failed", { mode, method: "credentials", reason: "login_failed", source });
        emitGenerateGateEvent("generate_auth_gate_failed", {
          method: "credentials",
          mode,
          reason: "login_failed",
        });
        return;
      }

      const account = {
        name: nameTrimmed || storedAccount.name || "Book Creator",
        email: emailTrimmed,
        goal: goalTrimmed || storedAccount.goal || DEFAULT_GOAL,
        publisherImprint: storedAccount.publisherImprint || "",
        publisherLogoUrl: storedAccount.publisherLogoUrl || "",
      };

      await completeClientAuth(account);

      if (source === "generate_gate") {
        trackEvent("generate_auth_gate_completed", { method: "credentials", mode });
      }

      if (onSuccess) {
        await onSuccess({ method: "credentials", mode });
        return;
      }

      window.location.assign(next);
    } catch {
      setError("Kimlik doğrulama tamamlanamadı. Lütfen tekrar dene.");
      trackEvent("auth_form_failed", { mode, method: "credentials", reason: "unknown", source });
      emitGenerateGateEvent("generate_auth_gate_failed", {
        method: "credentials",
        mode,
        reason: "unknown",
      });
    } finally {
      setBusyMethod(null);
    }
  }

  const content = (
    <>
      {showHeader ? (
        <div className={variant === "page" ? "mb-8" : "mb-6"}>
          <div className="text-sm font-medium text-muted-foreground">
            {mode === "login" ? "Giriş Yap" : "Ücretsiz Kaydol"}
          </div>
          <h1 className={variant === "page" ? "mt-3 text-3xl font-semibold text-foreground" : "mt-3 text-2xl font-semibold text-foreground"}>
            {title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
      ) : null}

      <div className="space-y-5">
        <div>
          <Label htmlFor="auth-email-primary">
            E-posta <span aria-hidden="true" className="text-destructive">*</span>
          </Label>
          <Input
            id="auth-email-primary"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ornek@mail.com"
            required
            autoComplete="email"
          />
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

          <Button
            type="button"
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
            Magic link gönder
          </Button>

          <p className="text-xs leading-6 text-muted-foreground">
            Şifre istemeden girmek istersen emailine tek kullanımlık bağlantı göndeririz.
          </p>
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
          <Label htmlFor="password">
            Şifre <span aria-hidden="true" className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "register" ? "En az 8 karakter" : "Şifren"}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="pr-14"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {mode === "register" ? (
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              En az 8 karakter kullan. İstersen şifre yerine üstteki magic link seçeneğini de kullanabilirsin.
            </p>
          ) : null}
        </div>

        {mode === "login" ? (
          <div className="text-right">
            <Link href="/reset-password" className="text-sm text-primary hover:underline">
              Şifremi unuttum
            </Link>
          </div>
        ) : null}

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

        <Button
          className="w-full"
          size="lg"
          type="submit"
          disabled={credentialsDisabled || busyMethod !== null}
        >
          {busyMethod === "credentials" ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              İşleniyor
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </form>
    </>
  );

  if (variant === "modal") {
    return <div className="space-y-1">{content}</div>;
  }

  return (
    <Card className="w-full max-w-lg">
      <CardContent className="p-8">{content}</CardContent>
    </Card>
  );
}
