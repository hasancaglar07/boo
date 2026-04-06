"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  DollarSign,
  FileText,
  Layers,
  LayoutGrid,
  List,
  Search,
  Share2,
  ShieldAlert,
  Sparkles,
  Target,
  Upload,
  User2,
  X,
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

type SortOption = "recent" | "title" | "chapters";

const SORT_LABELS: Record<SortOption, string> = {
  recent: "En son düzenlenen",
  title: "Başlık (A-Z)",
  chapters: "En çok bölüm",
};

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
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const gateTrackedRef = useRef(false);
  const backendFailureCountRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);
  const booksRef = useRef<Book[]>([]);

  const [affiliateData, setAffiliateData] = useState<{ referralUrl: string; clicks: number } | null>(null);
  const [affiliateCopied, setAffiliateCopied] = useState(false);

  useEffect(() => {
    if (!ready || !viewer) return;
    fetch("/api/referral/my-code")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setAffiliateData({ referralUrl: json.referralUrl, clicks: json.clicks });
      })
      .catch(() => null);
  }, [ready, viewer]);

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

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title, "tr");
      case "chapters":
        return (b.status?.chapter_count || b.chapter_count || 0) - (a.status?.chapter_count || a.chapter_count || 0);
      case "recent":
      default: {
        const aDate = a.status?.updated_at || a.status?.started_at || "";
        const bDate = b.status?.updated_at || b.status?.started_at || "";
        return bDate.localeCompare(aDate);
      }
    }
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

  function copyAffiliateLink() {
    if (!affiliateData) return;
    navigator.clipboard.writeText(affiliateData.referralUrl).catch(() => null);
    setAffiliateCopied(true);
    trackEvent("affiliate_link_copied", { source: "home_card" });
    setTimeout(() => setAffiliateCopied(false), 2000);
  }

  function shareWhatsApp() {
    if (!affiliateData) return;
    trackEvent("affiliate_whatsapp_clicked", { source: "home_card" });
    const text = `BookGenerator.net ile dakikalar içinde profesyonel kitap yaz! ${affiliateData.referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function shareTwitter() {
    if (!affiliateData) return;
    trackEvent("affiliate_twitter_clicked", { source: "home_card" });
    const text = `AI ile dakikalar içinde kitap yazdım 🚀 BookGenerator.net'i dene:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(affiliateData.referralUrl)}`, "_blank");
  }

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
        <div className="home-animate-in mb-6 rounded-[28px] border border-primary/15 bg-card p-5 md:p-8" role="status" aria-label="Sayfa yükleniyor">
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
        <div className="home-animate-in home-animate-in-2 mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/80 bg-card p-4">
              <div className="h-3 w-14 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-8 w-12 animate-pulse rounded-lg bg-muted" />
            </div>
          ))}
        </div>

        {/* Affiliate card skeleton */}
        <div className="home-animate-in home-animate-in-3 mb-6 rounded-[20px] border border-primary/20 bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="size-5 animate-pulse rounded bg-muted" />
            <div className="h-5 w-48 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-muted" />
          <div className="mt-2 h-10 w-full animate-pulse rounded-xl bg-muted" />
          <div className="mt-3 flex gap-2">
            <div className="h-9 w-24 animate-pulse rounded-xl bg-muted" />
            <div className="h-9 w-24 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>

        {/* Book cards skeleton */}
        <div className="home-animate-in home-animate-in-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        <span className="sr-only">İçerik yükleniyor, lütfen bekleyin.</span>
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

          {/* Affiliate Link Card */}
          <Card className="border-primary/20 bg-[radial-gradient(circle_at_top_right,_rgba(188,104,67,0.08),_transparent_60%)]">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10">
                  <DollarSign className="size-4 text-primary" aria-hidden />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  Affiliate Linkin — %30 Komisyon
                </h3>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Bu linki paylaş. Linkinden üye olan ve ödeme yapan herkesten %30 komisyon kazanırsın.
              </p>
              <div className="flex items-center gap-2 rounded-[14px] border border-border/60 bg-muted/40 px-3 py-2.5">
                <span className="flex-1 truncate font-mono text-xs text-muted-foreground">
                  {affiliateData ? affiliateData.referralUrl : "Yükleniyor..."}
                </span>
              </div>
              <Button
                className="w-full min-h-[44px]"
                onClick={copyAffiliateLink}
                disabled={!affiliateData}
              >
                {affiliateCopied ? (
                  <>
                    <CheckCircle2 className="mr-1.5 size-4" />
                    Kopyalandı!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 size-4" />
                    Kopyala
                  </>
                )}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 min-h-[40px]"
                  onClick={shareWhatsApp}
                  disabled={!affiliateData}
                >
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-h-[40px]"
                  onClick={shareTwitter}
                  disabled={!affiliateData}
                >
                  X (Twitter)
                </Button>
              </div>
              <p className="text-center text-[10px] leading-4 text-muted-foreground/70">
                Sınır yok • Minimum ödeme $50 • Aylık ödeme
              </p>
            </CardContent>
          </Card>

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

      <section className="mt-10 home-anim-in home-d6" aria-label="Kitaplık">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground">Kitapların</h2>
          <Link href={newBookHref}>
            <Button variant="outline" size="sm" className="min-h-[44px]">
              <Sparkles className="mr-1.5 size-3.5" aria-hidden="true" />
              Yeni kitap
            </Button>
          </Link>
        </div>

        {books.length > 0 && (
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Bar */}
            <div className="relative flex-1 home-search-glow rounded-[20px] border border-input bg-card transition-shadow">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kitap ara..."
                aria-label="Kitap ara"
                className="min-h-[44px] w-full rounded-[20px] bg-transparent pl-11 pr-10 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Aramayı temizle"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen((v) => !v)}
                aria-label="Sıralama seç"
                aria-expanded={sortOpen}
                className="flex min-h-[44px] items-center gap-2 rounded-[18px] border border-input bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
                {SORT_LABELS[sortBy]}
                <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${sortOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {sortOpen && (
                <div className="home-anim-in absolute right-0 top-full z-30 mt-2 min-w-[200px] rounded-[16px] border border-border bg-card p-2 shadow-lg" role="listbox" aria-label="Sıralama seçenekleri">
                  {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      role="option"
                      aria-selected={sortBy === key}
                      onClick={() => { setSortBy(key); setSortOpen(false); }}
                      className={`flex w-full items-center gap-2 rounded-[12px] px-3 py-2.5 text-sm transition-colors ${sortBy === key ? "bg-primary/10 font-semibold text-primary" : "text-foreground hover:bg-accent"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {sortedBooks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedBooks.map((book, i) => (
              <Card
                key={book.slug}
                className={`home-book-card overflow-hidden border-border/60 bg-card/50 transition-all hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(188,104,67,0.08)]`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <CardContent className="p-5">
                  <div className="mb-3">
                    <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                      {book.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {book.subtitle || book.description || "Preview ve tam kitap akışı hazır."}
                    </p>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-2" aria-label="Kitap detayları">
                    <Badge className="border-border/50">
                      <Layers className="mr-1 size-3" aria-hidden="true" />
                      {book.status?.chapter_count || book.chapter_count || 0} bölüm
                    </Badge>
                    <Badge className="border-border/50">
                      <Upload className="mr-1 size-3" aria-hidden="true" />
                      {book.status?.export_count || 0} çıktı
                    </Badge>
                    {book.status?.product_ready ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                        <CheckCircle2 className="mr-1 size-3" aria-hidden="true" />
                        Tam erişim
                      </Badge>
                    ) : null}
                  </div>

                  {book.status?.updated_at && (
                    <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground/70">
                      <Clock className="size-3" aria-hidden="true" />
                      <time dateTime={book.status.updated_at}>
                        {formatDate(book.status.updated_at)}
                      </time>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="min-h-[40px] flex-1 sm:flex-auto"
                      onClick={() => router.push(`/app/book/${encodeURIComponent(book.slug)}/preview`)}
                      aria-label={`${book.title} - Önizleme`}
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
                      aria-label={`${book.title} - Düzenle`}
                    >
                      Düzenle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : books.length > 0 && debouncedSearch ? (
          <Card className="border-border/60 bg-card/50">
            <CardContent className="py-12">
              <div className="mx-auto max-w-sm text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Search className="size-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Sonuç bulunamadı
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  &ldquo;{debouncedSearch}&rdquo; ile eşleşen kitap yok. Farklı bir terim dene.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 min-h-[40px]"
                  onClick={() => setSearchQuery("")}
                >
                  Aramayı temizle
                </Button>
              </div>
            </CardContent>
          </Card>
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
                <ul className="mt-6 space-y-2 text-left text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    AI destekli 5 adımlı sihirbaz
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    Dakikalar içinde önizleme
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    PDF, EPUB ve daha fazlası
                  </li>
                </ul>
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
