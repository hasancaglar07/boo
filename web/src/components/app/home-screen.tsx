"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Layers,
  ShieldAlert,
  Sparkles,
  Target,
  Upload,
  User2,
} from "lucide-react";

import { AppFrame } from "@/components/app/app-frame";
import { BackendUnavailableState } from "@/components/app/backend-unavailable-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";
import { isBackendUnavailableError, loadBooks, type Book } from "@/lib/dashboard-api";
import { compactNumber, formatDate } from "@/lib/utils";
import { useSessionGuard as useGuard } from "@/lib/use-session-guard";
import { useAuthenticatedViewer } from "@/lib/use-authenticated-viewer";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  creator: "Yazar",
  pro: "Stüdyo",
  premium: "Tek Kitap",
};
const INITIAL_BOOKS_RETRY_LIMIT = 1;

type OnboardingAction = {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  description: string;
  run: () => void;
};

function displayName(name?: string | null, email?: string | null) {
  const normalizedName = String(name || "").trim();
  if (normalizedName && normalizedName !== "Book Creator") {
    return normalizedName;
  }
  return String(email || "")
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim() || "Book Creator";
}

export function HomeScreen() {
  const router = useRouter();
  const ready = useGuard();
  const { viewer } = useAuthenticatedViewer(ready);
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const gateTrackedRef = useRef(false);
  const backendFailureCountRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);
  const booksRef = useRef<Book[]>([]);

  useEffect(() => {
    booksRef.current = books;
  }, [books]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const filteredBooks = books.filter((book) => {
    if (!debouncedSearch.trim()) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      book.title.toLowerCase().includes(q) ||
      (book.subtitle || "").toLowerCase().includes(q) ||
      (book.description || "").toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  function scheduleRetry() {
    if (retryTimerRef.current) return;
    const delayMs = Math.min(2000, Math.max(500, backendFailureCountRef.current * 500));
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      void refreshBooks();
    }, delayMs);
  }

  async function refreshBooks() {
    setLoadingBooks(true);
    try {
      const loaded = await loadBooks();
      setBooks(loaded);
      setBackendUnavailable(false);
      backendFailureCountRef.current = 0;
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      setLoadingBooks(false);
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        backendFailureCountRef.current += 1;

        // Keep current list visible if we already have data.
        if (booksRef.current.length > 0) {
          setBackendUnavailable(false);
          setLoadingBooks(false);
          scheduleRetry();
          return;
        }

        if (backendFailureCountRef.current <= INITIAL_BOOKS_RETRY_LIMIT) {
          scheduleRetry();
          // Keep skeleton for one short retry on first load.
          setLoadingBooks(true);
          return;
        }

        setBackendUnavailable(true);
        setLoadingBooks(false);
        return;
      }
      console.error(error);
      setLoadingBooks(false);
    }
  }

  useEffect(() => {
    if (!ready) return;
    void refreshBooks();
  }, [ready]);

  useEffect(() => {
    if (viewer?.usage?.canStartBook === false && !gateTrackedRef.current) {
      gateTrackedRef.current = true;
      trackEvent("second_book_gate_viewed", {
        reason: viewer.usage.reason || "limit",
        planId: viewer.planId,
      });
    }
  }, [viewer]);

  if (!ready) return null;

  const latestBook = books[0];
  const currentPlanLabel = PLAN_LABELS[viewer?.planId || "free"] || "Free";
  const totalExports = books.reduce((total, book) => total + Number(book.status?.export_count || 0), 0);
  const totalResearch = books.reduce((total, book) => total + Number(book.status?.research_count || 0), 0);
  const readableName = displayName(viewer?.name, viewer?.email);
  const hasNamedProfile = Boolean(viewer?.name && viewer.name !== "Book Creator");
  const hasGoal = Boolean(viewer?.goal?.trim());
  const latestActivity = latestBook?.status?.updated_at || latestBook?.status?.started_at || "";
  const newBookHref =
    viewer && viewer.usage?.canStartBook === false
      ? `/app/settings/billing?intent=start-book${viewer.usage.reason ? `&reason=${encodeURIComponent(viewer.usage.reason)}` : ""}`
      : "/app/new/topic";

  const onboardingActions: OnboardingAction[] = [];
  if (viewer && !hasNamedProfile) {
    onboardingActions.push({
      icon: User2,
      label: "İsmini tamamla",
      description: "Kütüphane ve çalışma alanında hesabın gerçek adı görünsün.",
      run: () => router.push("/app/settings/profile"),
    });
  }
  if (viewer && !hasGoal) {
    onboardingActions.push({
      icon: Target,
      label: "Yazım hedefi ekle",
      description: "Wizard varsayımlarını ve ürün tonunu hedefinle hizala.",
      run: () => router.push("/app/settings/profile"),
    });
  }
  if (!books.length) {
    onboardingActions.push({
      icon: BookOpen,
      label: "İlk kitabı başlat",
      description: "Beş kısa adım ile ilk önizlemeyi üret ve kütüphaneni aç.",
      run: () => router.push(newBookHref),
    });
  }
  if (viewer && !viewer.emailVerified) {
    onboardingActions.push({
      icon: ShieldAlert,
      label: "Email doğrula",
      description: "Hesap güvenliği ve bildirimler için e-posta doğrulamanı tamamla.",
      run: () => router.push("/app/settings/profile"),
    });
  }
  if (latestBook) {
    onboardingActions.push({
      icon: FileText,
      label: "Son önizlemeye dön",
      description: `${latestBook.title} için önizleme ve yükseltme akışına geri dön.`,
      run: () => router.push(`/app/book/${encodeURIComponent(latestBook.slug)}/preview`),
    });
  }

  if (loadingBooks) {
    return (
      <AppFrame current="home" title="Kitaplarım" books={[]} viewer={viewer}>
        {/* Hero skeleton */}
        <div className="mb-6 rounded-[28px] border border-primary/15 bg-card p-5 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-28 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-5 h-9 w-3/5 animate-pulse rounded-xl bg-muted" />
          <div className="mt-4 h-5 w-4/5 animate-pulse rounded-lg bg-muted" />
          <div className="mt-2 h-5 w-2/3 animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Stats skeleton */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/80 bg-card p-4">
              <div className="h-3 w-14 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-8 w-12 animate-pulse rounded-lg bg-muted" />
            </div>
          ))}
        </div>

        {/* Book cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[28px] border border-border/80 bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="size-12 shrink-0 animate-pulse rounded-xl bg-muted" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-7 w-16 animate-pulse rounded-full bg-muted" />
                <div className="h-7 w-16 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-9 w-20 animate-pulse rounded-xl bg-muted" />
                <div className="h-9 w-20 animate-pulse rounded-xl bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      current="home"
      title="Kitaplarım"
      books={books}
      viewer={viewer}
      actions={[
        { label: "Yeni kitap oluştur", description: "Uygulama içi yazım akışını aç", run: () => router.push(newBookHref) },
        {
          label: "Son önizlemeyi aç",
          description: "En son kitabının önizlemesine dön",
          run: () => latestBook && router.push(`/app/book/${encodeURIComponent(latestBook.slug)}/preview`),
        },
        { label: "Profil ayarları", description: "İsim ve yazım hedefini yönet", run: () => router.push("/app/settings/profile") },
      ]}
    >
      {backendUnavailable ? (
        <div className="mb-6">
          <BackendUnavailableState
            onRetry={() => {
              backendFailureCountRef.current = 0;
              setBackendUnavailable(false);
              void refreshBooks();
            }}
          />
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_top_right,_rgba(188,104,67,0.08),_transparent_60%)] transition-shadow hover:shadow-[0_4px_20px_rgba(188,104,67,0.12)]">
          <CardContent className="p-5 md:p-8 lg:p-12">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20">Hoş geldin</Badge>
              <Badge className={viewer?.emailVerified ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"}>
                {viewer?.emailVerified ? "Doğrulandı" : "Doğrulama bekleniyor"}
              </Badge>
              <Badge className="border-border/40">{currentPlanLabel}</Badge>
            </div>

            <h2 className="mt-5 text-balance text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
              Hoş geldin, {readableName}
            </h2>

            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              {latestBook
                ? `${latestBook.title} için önizleme, çalışma alanı ve dışa aktarma akışı seni bekliyor. Kaldığın yerden devam et veya yeni bir kitap başlat.`
                : "İlk kitabını başlat, önizlemeyi aynı oturumda yönet ve kütüphaneni bu alandan büyüt."}
            </p>

            {viewer?.usage?.canStartBook === false ? (
              <div className="mt-4 max-w-2xl rounded-[20px] border border-primary/20 bg-primary/5 px-4 py-4">
                <div className="text-sm font-semibold text-foreground">
                  Yeni kitap slotun şu an kapalı
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {viewer.usage.reason === "monthly_quota_reached"
                    ? "Aylık kitap kotana ulaştın. Yeni üretim için planını yükselt ya da yeni dönemi bekle."
                    : "Mevcut planın ilk kitap preview’ını kullandı. Yeni kitap için planlardan birini seç."}
                </p>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    className="min-h-[44px]"
                    onClick={() => {
                      trackEvent("second_book_gate_converted", {
                        source: "home_banner",
                        reason: viewer.usage.reason || "limit",
                      });
                      router.push("/app/settings/billing?intent=start-book");
                    }}
                  >
                    Planları gör
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground">
                Plan: {currentPlanLabel}
              </div>
              <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground">
                {books.length} kitap
              </div>
              <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground">
                {viewer?.emailVerified ? "Email doğrulandı" : "Email doğrulanmadı"}
              </div>
              <div className="rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-medium text-foreground">
                {latestActivity ? `Son hareket: ${formatDate(latestActivity)}` : "Henüz aktivite yok"}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
              <Button
                size="lg"
                className="min-h-[48px]"
                onClick={() =>
                  router.push(
                    latestBook
                      ? `/app/book/${encodeURIComponent(latestBook.slug)}/preview`
                      : newBookHref,
                  )
                }
              >
                {latestBook ? "Preview’a dön" : "İlk kitabını başlat"}
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Button>

              {latestBook ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-[48px]"
                  onClick={() =>
                    router.push(`/app/book/${encodeURIComponent(latestBook.slug)}/workspace?tab=writing`)
                  }
                >
                  Düzenle
                </Button>
              ) : null}

              <Button size="lg" variant="ghost" className="min-h-[48px]" onClick={() => router.push("/app/settings/profile")}>
                Profili aç
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Kitap", value: books.length, icon: BookOpen },
              { label: "Çıktı", value: compactNumber(totalExports), icon: Upload },
              { label: "Araştırma", value: compactNumber(totalResearch), icon: FileText },
              { label: "Plan", value: currentPlanLabel, small: true, icon: Target },
            ].map(({ label, value, small, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-border/60 bg-card/50 px-4 py-5 transition-all hover:border-border hover:bg-card"
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-3.5 text-muted-foreground/60" />
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    {label}
                  </div>
                </div>
                <div className={small ? "mt-2 text-xl font-semibold text-foreground" : "mt-2 text-3xl font-bold tabular-nums text-foreground"}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <Card className="flex-1 border-border/60 bg-card/50">
            <CardContent className="space-y-2 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {onboardingActions.length ? "Sıradaki adımlar" : "Hızlı işlemler"}
                </div>
                {onboardingActions.length ? (
                  <span className="text-xs font-medium text-muted-foreground">
                    {onboardingActions.length} açık adım
                  </span>
                ) : null}
              </div>

              {(onboardingActions.length ? onboardingActions.slice(0, 4) : [
                {
                  icon: BookOpen,
                  label: "Yeni kitap başlat",
                  description: "Kısa sihirbaz ile yeni üretim akışını başlat.",
                  run: () => router.push(newBookHref),
                },
                {
                  icon: FileText,
                  label: "Metin akışına dön",
                  description: "Son kitabının yazım sekmesine geri dön.",
                  run: () =>
                    router.push(
                      latestBook
                        ? `/app/book/${encodeURIComponent(latestBook.slug)}/workspace?tab=writing`
                        : newBookHref,
                    ),
                },
                {
                  icon: Upload,
                  label: "Yayına hazırla",
                  description: "Export ve publish hazırlık ekranını aç.",
                  run: () =>
                    router.push(
                      latestBook
                        ? `/app/book/${encodeURIComponent(latestBook.slug)}/workspace?tab=publish`
                        : "/app/settings/billing",
                    ),
                },
              ]).map(({ icon: Icon, label, description, run }) => (
                <button
                  key={label}
                  className="flex min-h-[72px] w-full cursor-pointer items-start gap-3 rounded-[20px] border border-border/50 bg-background/50 px-4 py-4 text-left transition-all hover:border-primary/30 hover:bg-accent/50 active:scale-[0.98]"
                  onClick={run}
                >
                  <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors hover:bg-primary/15">
                    <Icon className="size-4.5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">{label}</div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{description}</div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground">Kitapların</h2>
          <Link href={newBookHref}>
            <Button variant="outline" size="sm" className="min-h-[44px]">
              <Sparkles className="mr-1.5 size-3.5" aria-hidden="true" />
              Yeni kitap
            </Button>
          </Link>
        </div>

        {books.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <Card key={book.slug} className="overflow-hidden border-border/60 bg-card/50 transition-all hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(188,104,67,0.08)]">
                <CardContent className="p-5">
                  <div className="mb-4">
                    <div className="line-clamp-2 text-base font-semibold text-foreground">
                      {book.title}
                    </div>
                    <div className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {book.subtitle || book.description || "Preview ve tam kitap akışı hazır."}
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge  className="border-border/50">
                      <Layers className="mr-1 size-3" aria-hidden="true" />
                      {book.status?.chapter_count || book.chapter_count || 0} bölüm
                    </Badge>
                    <Badge  className="border-border/50">
                      <Upload className="mr-1 size-3" aria-hidden="true" />
                      {book.status?.export_count || 0} çıktı
                    </Badge>
                    {book.status?.product_ready ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                        <CheckCircle2 className="mr-1 size-3" aria-hidden="true" />
                        Tam erişim hazır
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="min-h-[40px] flex-1 sm:flex-auto"
                      onClick={() => router.push(`/app/book/${encodeURIComponent(book.slug)}/preview`)}
                    >
                      Önizleme
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[40px] flex-1 sm:flex-auto"
                      onClick={() =>
                        router.push(`/app/book/${encodeURIComponent(book.slug)}/workspace?tab=writing`)
                      }
                    >
                      Düzenle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/60 bg-card/50">
            <CardContent className="py-16">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                  <BookOpen className="size-8 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">
                  İlk kitabın için alan hazır
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Hesabın açık. Şimdi ilk üretim akışını başlat, önizleme üret ve bu ekranı gerçek kütüphanene dönüştür.
                </p>
                <div className="mt-8 flex justify-center">
                  <Button size="lg" className="min-h-[48px]" onClick={() => router.push(newBookHref)}>
                    Hemen başla
                    <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </AppFrame>
  );
}
