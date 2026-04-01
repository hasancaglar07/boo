"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  const [backendUnavailable, setBackendUnavailable] = useState(false);

  async function refreshBooks() {
    setLoadingBooks(true);
    try {
      const loaded = await loadBooks();
      setBooks(loaded);
      setBackendUnavailable(false);
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        setBackendUnavailable(true);
        setLoadingBooks(false);
        return;
      }
      console.error(error);
    } finally {
      setLoadingBooks(false);
    }
  }

  useEffect(() => {
    if (!ready) return;
    let active = true;

    void (async () => {
      setLoadingBooks(true);
      try {
        const loaded = await loadBooks();
        if (!active) return;
        setBooks(loaded);
        setBackendUnavailable(false);
      } catch (error) {
        if (!active) return;
        if (isBackendUnavailableError(error)) {
          setBackendUnavailable(true);
          setLoadingBooks(false);
          return;
        }
        console.error(error);
      } finally {
        if (active) {
          setLoadingBooks(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [ready]);

  if (!ready) return null;

  const latestBook = books[0];
  const currentPlanLabel = PLAN_LABELS[viewer?.planId || "free"] || "Free";
  const totalExports = books.reduce((total, book) => total + Number(book.status?.export_count || 0), 0);
  const totalResearch = books.reduce((total, book) => total + Number(book.status?.research_count || 0), 0);
  const readableName = displayName(viewer?.name, viewer?.email);
  const hasNamedProfile = Boolean(viewer?.name && viewer.name !== "Book Creator");
  const hasGoal = Boolean(viewer?.goal?.trim());
  const latestActivity = latestBook?.status?.updated_at || latestBook?.status?.started_at || "";

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
      description: "Beş kısa adım ile ilk preview'ı üret ve kütüphaneni aç.",
      run: () => router.push("/start/topic"),
    });
  }
  if (viewer && !viewer.emailVerified) {
    onboardingActions.push({
      icon: ShieldAlert,
      label: "Email doğrula",
      description: "Ödeme ve PDF / EPUB export akışını açmak için hesabını doğrula.",
      run: () => router.push("/app/settings/profile"),
    });
  }
  if (latestBook) {
    onboardingActions.push({
      icon: FileText,
      label: "Son preview'a dön",
      description: `${latestBook.title} için preview ve upgrade akışına geri dön.`,
      run: () => router.push(`/app/book/${encodeURIComponent(latestBook.slug)}/preview`),
    });
  }

  if (backendUnavailable) {
    return (
      <AppFrame current="home" title="Üretim Merkezi" books={[]} viewer={viewer}>
        <BackendUnavailableState onRetry={() => void refreshBooks()} />
      </AppFrame>
    );
  }

  if (loadingBooks) {
    return (
      <AppFrame current="home" title="Kitaplarım" books={[]} viewer={viewer}>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardContent className="space-y-4 p-8">
              <div className="h-5 w-28 animate-pulse rounded-full bg-muted" />
              <div className="h-16 w-3/4 animate-pulse rounded-2xl bg-muted" />
              <div className="h-20 animate-pulse rounded-2xl bg-muted" />
            </CardContent>
          </Card>
          <div className="grid gap-4">
            <Card>
              <CardContent className="h-40 animate-pulse rounded-2xl bg-muted/40" />
            </Card>
          </div>
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
        { label: "Yeni kitap oluştur", description: "Kayıtsız wizard'ı aç", run: () => router.push("/start/topic") },
        {
          label: "Son preview'ı aç",
          description: "En son kitabının önizlemesine dön",
          run: () => latestBook && router.push(`/app/book/${encodeURIComponent(latestBook.slug)}/preview`),
        },
        { label: "Profil ayarları", description: "İsim ve yazım hedefini yönet", run: () => router.push("/app/settings/profile") },
      ]}
    >
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_top_right,_rgba(188,104,67,0.12),_transparent_50%)]">
          <CardContent className="p-8 md:p-10 lg:p-12">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Hoş geldin</Badge>
              <Badge className={viewer?.emailVerified ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"}>
                {viewer?.emailVerified ? "Doğrulandı" : "Doğrulama bekleniyor"}
              </Badge>
              <Badge>{currentPlanLabel}</Badge>
            </div>

            <h2 className="mt-6 text-balance text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Hoş geldin, {readableName}
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {latestBook
                ? `${latestBook.title} için preview, çalışma alanı ve export akışı seni bekliyor. Kaldığın yerden devam et veya yeni bir kitap başlat.`
                : "İlk kitabını başlat, preview'ı aynı oturumda yönet ve kütüphaneni bu alandan büyüt."}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <div className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground">
                Plan: {currentPlanLabel}
              </div>
              <div className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground">
                {books.length} kitap
              </div>
              <div className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground">
                {viewer?.emailVerified ? "Email doğrulandı" : "Email doğrulanmadı"}
              </div>
              <div className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground">
                {latestActivity ? `Son hareket: ${formatDate(latestActivity)}` : "Henüz aktivite yok"}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() =>
                  router.push(
                    latestBook
                      ? `/app/book/${encodeURIComponent(latestBook.slug)}/preview`
                      : "/start/topic",
                  )
                }
              >
                {latestBook ? "Preview'a dön" : "İlk kitabını başlat"}
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Button>

              {latestBook ? (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    router.push(`/app/book/${encodeURIComponent(latestBook.slug)}/workspace?tab=writing`)
                  }
                >
                  Düzenle
                </Button>
              ) : null}

              <Button size="lg" variant="ghost" onClick={() => router.push("/app/settings/profile")}>
                Profili aç
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Kitap", value: books.length },
              { label: "Çıktı", value: compactNumber(totalExports) },
              { label: "Araştırma", value: compactNumber(totalResearch) },
              { label: "Plan", value: currentPlanLabel, small: true },
            ].map(({ label, value, small }) => (
              <div
                key={label}
                className="rounded-2xl border border-border/80 bg-card px-4 py-4"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {label}
                </div>
                <div className={small ? "mt-2 text-xl font-semibold text-foreground" : "mt-2 text-4xl font-bold tabular-nums text-foreground"}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <Card className="flex-1">
            <CardContent className="space-y-2 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
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
                  description: "Kısa wizard ile yeni üretim akışını başlat.",
                  run: () => router.push("/start/topic"),
                },
                {
                  icon: FileText,
                  label: "Metin akışına dön",
                  description: "Son kitabının yazım sekmesine geri dön.",
                  run: () =>
                    router.push(
                      latestBook
                        ? `/app/book/${encodeURIComponent(latestBook.slug)}/workspace?tab=writing`
                        : "/start/topic",
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
                  className="flex min-h-16 w-full cursor-pointer items-start gap-3 rounded-[20px] border border-border/65 bg-background/65 px-4 py-3 text-left transition-colors hover:bg-accent/60"
                  onClick={run}
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
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
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Kitapların</h2>
          <Link href="/start/topic">
            <Button variant="outline" size="sm">
              <Sparkles className="mr-1.5 size-3.5" aria-hidden="true" />
              Yeni kitap
            </Button>
          </Link>
        </div>

        {books.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <Card key={book.slug} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="line-clamp-2 text-base font-semibold text-foreground">
                      {book.title}
                    </div>
                    <div className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {book.subtitle || book.description || "Preview ve tam kitap akışı hazır."}
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge>
                      <Layers className="mr-1 size-3" aria-hidden="true" />
                      {book.status?.chapter_count || book.chapter_count || 0} bölüm
                    </Badge>
                    <Badge>
                      <Upload className="mr-1 size-3" aria-hidden="true" />
                      {book.status?.export_count || 0} çıktı
                    </Badge>
                    {book.status?.product_ready ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="mr-1 size-3" aria-hidden="true" />
                        Tam erişim hazır
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/app/book/${encodeURIComponent(book.slug)}/preview`)}
                    >
                      Önizleme
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
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
          <Card>
            <CardContent className="py-16">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                  <BookOpen className="size-7 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">
                  İlk kitabın için alan hazır
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Hesabın açık. Şimdi ilk üretim akışını başlat, preview üret ve bu ekranı gerçek kütüphanene dönüştür.
                </p>
                <div className="mt-8 flex justify-center">
                  <Button size="lg" onClick={() => router.push("/start/topic")}>
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
