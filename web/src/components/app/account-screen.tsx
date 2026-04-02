"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ImagePlus,
  LogOut,
  Mail,
  ShieldAlert,
  Sparkles,
  Trash2,
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

  if (backendUnavailable) {
    return (
      <AppFrame
        current="account"
        title="Profil ayarları"
        subtitle="Bağlantı sorunu oluştu."
        books={[]}
        viewer={viewer}
      >
        <BackendUnavailableState onRetry={() => void refreshBooks()} />
      </AppFrame>
    );
  }

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

    const response = await fetch("/api/auth/verify-email/resend", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);

    const payload = response
      ? ((await response.json().catch(() => null)) as { error?: string } | null)
      : null;

    if (!response?.ok) {
      setVerificationMessage(payload?.error || "Doğrulama maili tekrar gönderilemedi.");
      setVerificationSending(false);
      return;
    }

    setVerificationMessage("Doğrulama maili tekrar gönderildi.");
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
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-primary/15 bg-[radial-gradient(circle_at_top_right,_rgba(188,104,67,0.12),_transparent_52%)]">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {viewer ? displayName(viewer.name, viewer.email).slice(0, 2).toUpperCase() : "BG"}
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-muted-foreground">Aktif hesap</div>
                  <div className="truncate text-2xl font-semibold text-foreground">
                    {displayName(viewer?.name, viewer?.email)}
                  </div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">{viewer?.email}</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-border/70 bg-card/75 px-3 py-1 text-xs font-medium text-foreground">
                  Plan: {PLAN_LABELS[viewer?.planId || "free"] || "Free"}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
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

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <Card>
              <CardContent className="p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Kitaplar
                </div>
                <div className="mt-3 text-4xl font-bold text-foreground">{books.length}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Bu hesapla oluşturulmuş toplam kitap.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Çıktılar
                </div>
                <div className="mt-3 text-4xl font-bold text-foreground">{compactNumber(exports)}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  PDF / EPUB ve diğer export toplamı.
                </div>
              </CardContent>
            </Card>
          </div>

          {!viewer?.emailVerified ? (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    <ShieldAlert className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">E-posta doğrulaması gerekli</div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Ödeme, tam erişim ve export akışı için hesabını doğrula.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleResendVerification()}
                        disabled={verificationSending}
                      >
                        {verificationSending ? "Gönderiliyor..." : "Doğrulama Mailini Gönder"}
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
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">E-posta doğrulandı</div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Hesabın ödeme, export ve tam erişim akışları için hazır.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <User2 className="size-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Profil bilgileri</h2>
                  <p className="text-sm text-muted-foreground">
                    Kütüphane karşılama alanı ve wizard varsayımları bu bilgilerden beslenir.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="profile-name">Görünen ad</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(event) => updateDraft({ name: event.target.value })}
                    placeholder="Adını gir"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <Label htmlFor="profile-email">E-posta</Label>
                  <div className="flex h-14 items-center rounded-[20px] border border-input bg-card px-5 text-[15px] text-muted-foreground shadow-[0_1px_0_rgba(255,255,255,0.35)_inset]">
                    <Mail className="mr-2 size-4 text-muted-foreground" />
                    {viewer?.email || "—"}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Label htmlFor="profile-goal">Yazım hedefi</Label>
                <Textarea
                  id="profile-goal"
                  value={goal}
                  onChange={(event) => updateDraft({ goal: event.target.value })}
                  placeholder="Örnek: B2B ekipler için pratik bir prompting rehberi üretmek istiyorum."
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Bu alan hero mesajlarını ve ilk wizard varsayımlarını netleştirir.
                </p>
              </div>

              {canCustomizePublisherBrand ? (
                <div className="mt-6 rounded-[26px] border border-border/70 bg-background/65 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
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
                      <Button size="sm" variant="outline" onClick={() => logoInputRef.current?.click()}>
                        <ImagePlus className="mr-1.5 size-3.5" />
                        Logo yükle
                      </Button>
                      {publisherLogoUrl ? (
                        <Button size="sm" variant="ghost" onClick={() => updateDraft({ publisherLogoUrl: "" })}>
                          <Trash2 className="mr-1.5 size-3.5" />
                          Kaldır
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div>
                      <Label htmlFor="profile-imprint">İmprint / yayınevi adı</Label>
                      <Input
                        id="profile-imprint"
                        value={publisherImprint}
                        onChange={(event) => updateDraft({ publisherImprint: event.target.value })}
                        placeholder="örnek: North Peak Press"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Hazır logolardan farklı olarak kendi markanı wizard ve kapak önizlemesine otomatik taşır.
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-border/70 bg-card/85 p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Önizleme
                      </div>
                      <div className="mt-3 flex min-h-[88px] items-center rounded-[18px] border border-border/60 bg-background/90 px-4 py-4">
                        {publisherLogoUrl ? (
                          <img
                            src={publisherLogoUrl}
                            alt={publisherImprint || "Yayınevi logosu"}
                            className="h-14 w-auto max-w-full object-contain"
                          />
                        ) : (
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              {publisherImprint || "Henüz logo yüklenmedi"}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-muted-foreground">
                              PNG, JPG, WEBP veya SVG kabul edilir.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-[26px] border border-primary/15 bg-primary/5 p-5">
                  <div className="text-sm font-semibold text-foreground">Özel yayınevi logosu</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Kendi yayınevi wordmark’ını profil bazlı kaydetmek ve wizard’da otomatik kullanmak için Pro plan gerekir.
                  </p>
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => router.push("/app/settings/billing")}>
                      Pro plana geç
                    </Button>
                  </div>
                </div>
              )}

              {saveError ? <p className="mt-4 text-sm text-destructive">{saveError}</p> : null}
              {saveMessage ? <p className="mt-4 text-sm text-primary">{saveMessage}</p> : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => void handleSave()} isLoading={saving}>
                  Kaydet
                </Button>
                {!viewer?.emailVerified ? (
                  <Button
                    variant="outline"
                    onClick={() => void handleResendVerification()}
                    disabled={verificationSending}
                  >
                    {verificationSending ? "Gönderiliyor..." : "Doğrulama Mailini Tekrar Gönder"}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Hesap özeti</h2>
                  <p className="text-sm text-muted-foreground">
                    Bu alanlar salt-okunurdur; plan ve email değiştirme bu iterasyonun dışında.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-[20px] border border-border/70 bg-background/65 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Plan
                  </div>
                  <div className="mt-2 text-lg font-semibold text-foreground">
                    {PLAN_LABELS[viewer?.planId || "free"] || "Free"}
                  </div>
                </div>
                <div className="rounded-[20px] border border-border/70 bg-background/65 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Doğrulama
                  </div>
                  <div className="mt-2 text-lg font-semibold text-foreground">
                    {viewer?.emailVerified ? "Tamam" : "Bekleniyor"}
                  </div>
                </div>
                <div className="rounded-[20px] border border-border/70 bg-background/65 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Hedef
                  </div>
                  <div className="mt-2 text-sm font-medium leading-6 text-foreground">
                    {viewer?.goal?.trim() ? viewer.goal : "Henüz hedef eklenmedi."}
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-border/60 pt-5">
                <Button variant="ghost" onClick={() => void handleLogout()}>
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
