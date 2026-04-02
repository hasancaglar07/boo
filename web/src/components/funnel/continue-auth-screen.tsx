"use client";

import Link from "next/link";
import { Loader2, Mail, Sparkles } from "lucide-react";
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
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyMethod, setBusyMethod] = useState<"google" | "magic" | "skip" | null>(null);
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
      setBusyMethod(null);
      return;
    }

    trackEvent(mode === "signup" ? "signup_magic_link_clicked" : "login_magic_link_clicked", {
      slug,
      source: "continue_auth",
    });
    setMessage("Giriş bağlantısı gönderildi. Gelen kutunu kontrol et.");
    setBusyMethod(null);
  }

  function handleSkip() {
    setBusyMethod("skip");
    rememberDraftIdentity();
    trackEvent("auth_bridge_skipped", { slug, mode });
    router.push(next);
  }

  const title = mode === "signup" ? "Kitabını kaybetme" : "Kaldığın yerden devam et";
  const description =
    mode === "signup"
      ? "Kitabını hesabına bağla. Önizleme hazır olduğunda seni burada beklesin. İstersen şimdilik atlayıp preview'a geç."
      : "Daha önce başladığın kitabı hesabına bağla ve önizlemeye dön.";

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
          <div className="text-lg font-semibold text-foreground">Kayıt değil, bağlantı</div>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Bu adım bir engel değil. Hazırladığın kitabı hesabına bağlıyoruz; tekrar geldiğinde preview seni beklesin. Ödeme yok, zorunluluk yok.
          </p>
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

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              disabled={busyMethod !== null}
              onClick={handleSkip}
            >
              {busyMethod === "skip" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Şimdilik atla
            </Button>
            <Button variant="secondary" size="lg" className="w-full" asChild>
              <Link href={`/${mode}?next=${encodeURIComponent(next)}`}>
                Şifre ile devam et
              </Link>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground/70">
            Kredi kartı gerekmez · Ücretsiz önizleme · İstediğin zaman çık
          </p>
        </div>
      </div>
    </FunnelShell>
  );
}
