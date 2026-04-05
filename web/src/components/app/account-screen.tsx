"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
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
  creator: "Yazar",
  pro: "Stüdyo",
  premium: "Tek Kitap",
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
    reader.onerror = () => reject(new Error("Logo dosyası okunamadı."));
    reader.readAsDataURL(file);
  });
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
      setSaveError(payload?.error || "Profil güncellenemedi.");
      setSaving(false);
      return;
    }

    persistViewer(payload.viewer);
    setViewer(payload.viewer);
    setDraft(null);
    setSaveMessage("Profil ayarları kaydedildi.");
    setSaving(false);
  }

  async function handlePublisherLogoUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setSaveError("Yalnızca görsel dosyası yükleyebilirsin.");
      return;
    }
    if (file.size > 750 * 1024) {
      setSaveError("Logo dosyası 750 KB'den küçük olmalı.");
      return;
    }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      updateDraft({ publisherLogoUrl: dataUrl });
      setSaveError("");
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Logo yüklenemedi.");
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
      setVerificationMessage(payload?.error || "Doğrulama maili tekrar gönderilemedi.");
      setVerificationSending(false);
      return;
    }

    setVerificationMessage(payload?.message || "Doğrulama maili tekrar gönderildi.");
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
      title="Profil ayarları"
      subtitle="Adını, yazım hedefini ve hesap durumunu yönet."
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
                  <div className="text-xs font-medium text-muted-foreground">Aktif hesap</div>
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
                  {viewer?.emailVerified ? "E-posta doğrulandı" : "Doğrulama bekleniyor"}
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
                    Kitaplar
                  </div>
                </div>
                <div className="mt-3 text-3xl font-bold text-foreground">{books.length}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Bu hesapla oluşturulmuş toplam kitap.
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/50 transition-colors hover:border-border/80">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Upload className="size-3.5 text-muted-foreground/60" />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Çıktılar
                  </div>
                </div>
                <div className="mt-3 text-3xl font-bold text-foreground">{compactNumber(exports)}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  PDF / EPUB ve diğer dışa aktarma toplamı.
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
                    <div className="text-sm font-semibold text-foreground">E-posta doğrulaması gerekli</div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Hesap güvenliği, giriş kurtarma ve bildirimler için e-postanı doğrula. Bu adım yalnızca bir kez gerekir.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-[44px]"
                        onClick={() => void handleResendVerification()}
                        disabled={verificationSending}
                      >
                        {verificationSending ? "Gönderiliyor..." : "Doğrulama mailini tekrar gönder"}
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
                    <div className="text-sm font-semibold text-foreground">E-posta doğrulandı</div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Hesabın ödeme, dışa aktarma ve tam erişim akışları için hazır.
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
                  <h2 className="text-lg font-semibold text-foreground">Profil bilgileri</h2>
                  <p className="text-sm text-muted-foreground">
                    Kütüphane karşılama alanı ve sihirbaz varsayımları bu bilgilerden beslenir.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="profile-name" className="text-sm">Görünen ad</Label>
                  <Input
                    id="profile-name"
                    className="min-h-[48px] mt-2"
                    value={name}
                    onChange={(event) => updateDraft({ name: event.target.value })}
                    placeholder="Adını gir"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <Label htmlFor="profile-email" className="text-sm">E-posta</Label>
                  <div className="mt-2 flex min-h-[48px] items-center rounded-[20px] border border-border/60 bg-card px-4 text-[15px] text-muted-foreground">
                    <Mail className="mr-2 size-4 text-muted-foreground/60" />
                    {viewer?.email || "—"}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Label htmlFor="profile-goal" className="text-sm">Yazım hedefi</Label>
                <Textarea
                  id="profile-goal"
                  className="min-h-[120px] mt-2"
                  value={goal}
                  onChange={(event) => updateDraft({ goal: event.target.value })}
                  placeholder="Örnek: B2B ekipler için pratik bir prompting rehberi üretmek istiyorum."
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Bu alan hero mesajlarını ve ilk sihirbaz varsayımlarını netleştirir.
                </p>
              </div>

              {canCustomizePublisherBrand ? (
                <div className="mt-6 rounded-[24px] border border-border/60 bg-background/50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">Yayınevi markası</div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Pro planında profil logonu bir kez tanımla; `/app/new/style` içinde varsayılan gelsin.
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
                        Logo yükle
                      </Button>
                      {publisherLogoUrl ? (
                        <Button size="sm" variant="ghost" className="min-h-[40px]" onClick={() => updateDraft({ publisherLogoUrl: "" })}>
                          <Trash2 className="mr-1.5 size-3.5" />
                          Kaldır
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="profile-imprint" className="text-sm">İmprint / yayınevi adı</Label>
                      <Input
                        id="profile-imprint"
                        className="min-h-[48px] mt-2"
                        value={publisherImprint}
                        onChange={(event) => updateDraft({ publisherImprint: event.target.value })}
                        placeholder="örnek: North Peak Press"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Hazır logolardan farklı olarak kendi markanı sihirbaz ve kapak önizlemesine otomatik taşır.
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-border/50 bg-card/60 p-4">
                      <div className="flex items-center gap-2">
                        <ImagePlus className="size-3.5 text-muted-foreground/60" />
                        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                          Önizleme
                        </div>
                      </div>
                      <div className="mt-3 flex min-h-[88px] items-center justify-center rounded-[18px] border border-border/50 bg-background/80 px-4 py-4">
                        {publisherLogoUrl ? (
                          <img
                            src={publisherLogoUrl}
                            alt={publisherImprint || "Yayınevi logosu"}
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
                  <div className="text-sm font-semibold text-foreground">Özel yayınevi logosu</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Kendi yayınevi wordmark’ını profil bazlı kaydetmek ve wizard’da otomatik kullanmak için Pro plan gerekir.
                  </p>
                  <div className="mt-4">
                    <Button variant="outline" className="min-h-[44px]" onClick={() => router.push("/app/settings/billing")}>
                      Pro plana geç
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
                    {verificationSending ? "Gönderiliyor..." : "Doğrulama Mailini Tekrar Gönder"}
                  </Button>
                ) : null}
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
                  <h2 className="text-lg font-semibold text-foreground">Hesap özeti</h2>
                  <p className="text-sm text-muted-foreground">
                    Bu alanlar salt-okunurdur; plan ve email değiştirme bu iterasyonun dışında.
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
                      Doğrulama
                    </div>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-foreground">
                    {viewer?.emailVerified ? "Tamam" : "Bekleniyor"}
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
                    {viewer?.goal?.trim() ? viewer.goal : "Henüz hedef eklenmedi."}
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-border/50 pt-5">
                <Button variant="ghost" className="min-h-[44px]" onClick={() => void handleLogout()}>
                  <LogOut className="mr-2 size-4" />
                  Çıkış yap
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppFrame>
  );
}
