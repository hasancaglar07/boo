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

const DEFAULT_GOAL = "İlk kitabımı hızlıca önizlemek istiyorum.";

export function ContinueAuthScreen({ mode }: { mode: "signup" | "login" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingAccount = useMemo(() => getAccount(), []);
  const next = searchParams.get("next") || "/app/library";
  const slug = searchParams.get("slug") || "";

  const [name, setName] = useState(existingAccount.name !== "Book Creator" ? existingAccount.name : "");
  const [email, setEmail] = useState(existingAccount.email !== "demo@example.com" ? existingAccount.email : "");
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
  }, [next, router]);

  function rememberDraftIdentity() {
    const normalizedEmail = email.trim().toLowerCase() || existingAccount.email || "demo@example.com";
    const normalizedName =
      name.trim() ||
      existingAccount.name ||
      normalizedEmail.split("@")[0].replace(/[._-]+/g, " ") ||
      "Book Creator";

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
      setError("Magic link için e-posta adresi gerekli.");
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
      setError("Magic link gönderilemedi. Lütfen tekrar dene.");
      trackEvent("auth_form_failed", { mode, method: "magic", reason: "send_failed", source: "continue_auth", slug });
      setBusyMethod(null);
      return;
    }

    trackEvent(mode === "signup" ? "signup_magic_link_clicked" : "login_magic_link_clicked", {
      slug,
      source: "continue_auth",
    });
    trackEvent("magic_link_sent", { mode, source: "continue_auth", slug });
    setMessage("Giriş bağlantısı gönderildi. Gelen kutunu kontrol et.");
    setBusyMethod(null);
  }

  async function handlePasswordContinue() {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail) {
      setError("Şifre ile devam etmek için e-posta gerekli.");
      trackEvent("auth_form_failed", { mode, method: "credentials", reason: "missing_email", source: "continue_auth", slug });
      return;
    }

    if (!normalizedPassword) {
      setError("Şifre gerekli.");
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
          setError(registerPayload?.error || "Kayıt oluşturulamadı.");
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
      setError("Şifre ile devam edilemedi. Lütfen tekrar dene.");
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

  const title = mode === "signup" ? "Preview'ını kaybetme" : "Kaldığın preview'a dön";
  const description =
    mode === "signup"
      ? "Preview ve kitap taslağını hesabına bağla. Hazır olduğunda aynı yerden aç, sonra unlock veya export kararını aynı hesapta ver."
      : "Daha önce başlattığın kitabı hesabına bağla ve preview ekranına geri dön.";

  return (
    <FunnelShell
      eyebrow={mode === "signup" ? "Üretim sürüyor" : "Devam Et"}
      title={title}
      description={description}
      summary={[
        { label: "Durum", value: slug ? "Önizleme hazırlanıyor" : "Kitap akışı aktif" },
        { label: "Sonraki adım", value: "Önizleme ekranı" },
        { label: "Açılacak", value: "Kapak, outline ve ilk %20 içerik" },
      ]}
    >
      <div className="space-y-8">
        <div className="rounded-[28px] border border-primary/20 bg-primary/8 p-5 md:p-6">
          <div className="text-lg font-semibold text-foreground">Kayıt değil, kitap bağlantısı</div>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Bu adım bir engel değil. Hazırladığın preview'ı ve kitap taslağını hesabına bağlıyoruz; tekrar geldiğinde seni aynı yerden karşılasın. Burada ödeme istemiyoruz.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[22px] border border-border/70 bg-card/70 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Şimdi açılan
            </div>
            <div className="mt-2 text-sm leading-6 text-foreground">
              Kapak, outline ve ücretsiz preview.
            </div>
          </div>
          <div className="rounded-[22px] border border-border/70 bg-card/70 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Sonra karar verirsin
            </div>
            <div className="mt-2 text-sm leading-6 text-foreground">
              Beğenirsen tam kitabı, PDF'i ve EPUB'u unlock edersin.
            </div>
          </div>
          <div className="rounded-[22px] border border-primary/20 bg-primary/5 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Neden hesap
            </div>
            <div className="mt-2 text-sm leading-6 text-foreground">
              Kitabın kaybolmaz, başka cihazdan da kaldığın yerden dönersin.
            </div>
          </div>
        </div>

        {mode === "signup" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <label htmlFor="continue-name" className="text-sm font-semibold text-foreground">
                Ad
              </label>
              <Input
                id="continue-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ad Soyad"
                className="h-14"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="continue-email" className="text-sm font-semibold text-foreground">
                E-posta
              </label>
              <Input
                id="continue-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ornek@mail.com"
                className="h-14"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label htmlFor="continue-login-email" className="text-sm font-semibold text-foreground">
              E-posta
            </label>
            <Input
              id="continue-login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ornek@mail.com"
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
              Google ile Devam Et
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
            E-posta ile Link Gönder
          </Button>

          <div className="rounded-[24px] border border-border/70 bg-card/70 p-4">
            <p className="text-sm font-semibold text-foreground">Şifre ile devam et</p>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              Ayrı bir sayfaya gitmeden burada devam edebilirsin.
            </p>
            <div className="mt-4 space-y-3">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === "signup" ? "En az 8 karakter" : "Şifren"}
                  className="h-12 pr-14"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
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
                {mode === "signup" ? "Hesap oluştur ve devam et" : "Şifre ile devam et"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button variant="outline" size="lg" className="w-full" asChild>
              <Link href={`/${mode}?next=${encodeURIComponent(next)}`}>
                Tam sayfa akışını aç
              </Link>
            </Button>
          </div>

          {mode === "signup" ? (
            <div className="rounded-[20px] border border-dashed border-border/70 bg-background/50 px-4 py-3 text-center">
              <p className="text-xs leading-6 text-muted-foreground">
                İstersen önce preview'a dönebilirsin. Ama kitabını daha sonra bulmak, unlock etmek ve export almak için hesabına bağlaman gerekecek.
              </p>
              <button
                type="button"
                className="mt-2 text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
                disabled={busyMethod !== null}
                onClick={handleSkip}
              >
                {busyMethod === "skip" ? "Önizlemeye gidiliyor..." : "Yine de preview'a dön"}
              </button>
            </div>
          ) : null}

          <p className="text-center text-xs text-muted-foreground/70">
            Kredi kartı gerekmez · Ücretsiz önizleme · İstediğin zaman çık
          </p>
        </div>
      </div>
    </FunnelShell>
  );
}
