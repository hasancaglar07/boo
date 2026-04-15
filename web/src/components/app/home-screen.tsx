"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, FileText, Layers, Sparkles, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppFrame } from "@/components/app/app-frame";
import { BackendUnavailableState } from "@/components/app/backend-unavailable-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isBackendUnavailableError, loadBooks, type Book } from "@/lib/dashboard-api";
import { plans } from "@/lib/marketing-data";
import { getPlan } from "@/lib/preview-auth";
import { compactNumber } from "@/lib/utils";
import { useSessionGuard as useGuard } from "@/lib/use-session-guard";

export function HomeScreen() {
  const t = useTranslations("HomeScreen");
  const router = useRouter();
  const ready = useGuard();
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
    void refreshBooks();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    void router.prefetch("/start/topic");
    void router.prefetch("/app/settings/billing");

    const latestSlug = books[0]?.slug;
    if (!latestSlug) return;
    const encodedSlug = encodeURIComponent(latestSlug);
    void router.prefetch(`/app/book/${encodedSlug}/preview`);
    void router.prefetch(`/app/book/${encodedSlug}/workspace?tab=writing`);
    void router.prefetch(`/app/book/${encodedSlug}/workspace?tab=publish`);
  }, [books, ready, router]);

  const currentPlan = useMemo(() => plans.find((plan) => plan.id === getPlan()) || plans[0], []);
  const totalExports = books.reduce((total, book) => total + Number(book.status?.export_count || 0), 0);
  const totalResearch = books.reduce((total, book) => total + Number(book.status?.research_count || 0), 0);
  const latestBook = books[0];

  if (!ready) return null;

  if (backendUnavailable) {
    return (
      <AppFrame current="home" title={t("frame.productionCenter")} books={[]}>
        <BackendUnavailableState onRetry={() => void refreshBooks()} />
      </AppFrame>
    );
  }

  if (loadingBooks) {
    return (
      <AppFrame current="home" title={t("frame.myBooks")} books={[]}>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardContent className="space-y-4 p-8">
              <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
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
      title={t("frame.myBooks")}
      books={books}
      actions={[
        { label: t("actions.createNewBook"), description: t("actions.createNewBookDesc"), run: () => router.push("/start/topic") },
        {
          label: t("actions.openLatestPreview"),
          description: t("actions.openLatestPreviewDesc"),
          run: () => latestBook && router.push(`/app/book/${encodeURIComponent(latestBook.slug)}/preview`),
        },
        { label: t("actions.billing"), description: t("actions.billingDesc"), run: () => router.push("/app/settings/billing") },
      ]}
    >
      {/* Hero + Quick actions row */}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Hero card */}
        <Card className="overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_top_right,_rgba(188,104,67,0.12),_transparent_50%)]">
          <CardContent className="p-8 md:p-10 lg:p-12">
            <Badge className="mb-6">{latestBook ? t("hero.whereYouLeftOff") : t("hero.gettingStarted")}</Badge>
            <h2 className="text-balance text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              {latestBook
                ? latestBook.title
                : t("hero.defaultHeadline")}
            </h2>
            {latestBook && (
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {latestBook.subtitle || t("hero.defaultSubtitle")}
              </p>
            )}
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
                {latestBook ? t("hero.openPreview") : t("hero.startFirstBook")}
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Button>
              {latestBook && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    router.push(`/app/book/${encodeURIComponent(latestBook.slug)}/workspace?tab=writing`)
                  }
                >
                  {t("hero.edit")}
                </Button>
              )}
              <Button size="lg" variant="ghost" onClick={() => router.push("/start/topic")}>
                {t("hero.newBook")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats + Quick actions column */}
        <div className="flex flex-col gap-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t("stats.books"), value: books.length },
              { label: t("stats.exports"), value: compactNumber(totalExports) },
              { label: t("stats.research"), value: compactNumber(totalResearch) },
              { label: t("stats.plan"), value: currentPlan.name, small: true },
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

          {/* Quick actions */}
          <Card className="flex-1">
            <CardContent className="space-y-1.5 p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t("quickActions.title")}
              </div>
              {[
                {
                  icon: BookOpen,
                  label: t("quickActions.startNewBook"),
                  run: () => router.push("/start/topic"),
                },
                {
                  icon: FileText,
                  label: t("quickActions.goToTextFlow"),
                  run: () =>
                    router.push(
                      latestBook
                        ? `/app/book/${encodeURIComponent(latestBook.slug)}/workspace?tab=writing`
                        : "/start/topic",
                    ),
                },
                {
                  icon: Upload,
                  label: t("quickActions.prepareForPublishing"),
                  run: () =>
                    router.push(
                      latestBook
                        ? `/app/book/${encodeURIComponent(latestBook.slug)}/workspace?tab=publish`
                        : "/app/settings/billing",
                    ),
                },
              ].map(({ icon: Icon, label, run }) => (
                <button
                  key={label}
                  className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                  onClick={run}
                >
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </div>
                  {label}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Book library */}
      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">{t("library.yourBooks")}</h2>
          <Link href="/start/topic">
            <Button variant="outline" size="sm">
              <Sparkles className="mr-1.5 size-3.5" aria-hidden="true" />
              {t("library.newBook")}
            </Button>
          </Link>
        </div>

        {books.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <Card key={book.slug} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="text-base font-semibold text-foreground line-clamp-2">
                      {book.title}
                    </div>
                    <div className="mt-1.5 text-sm leading-6 text-muted-foreground line-clamp-2">
                      {book.subtitle || book.description || t("library.defaultBookDesc")}
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge>
                      <Layers className="mr-1 size-3" aria-hidden="true" />
                      {t("library.chapters", { count: book.status?.chapter_count || book.chapter_count || 0 })}
                    </Badge>
                    <Badge>
                      <Upload className="mr-1 size-3" aria-hidden="true" />
                      {t("library.exports", { count: book.status?.export_count || 0 })}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/app/book/${encodeURIComponent(book.slug)}/preview`)}
                    >
                      {t("library.preview")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/app/book/${encodeURIComponent(book.slug)}/workspace?tab=writing`)
                      }
                    >
                      {t("library.edit")}
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
                <h3 className="text-2xl font-semibold text-foreground">{t("library.createFirstBook")}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {t("library.createFirstBookDesc")}
                </p>
                <div className="mt-8 flex justify-center">
                  <Button size="lg" onClick={() => router.push("/start/topic")}>
                    {t("library.getStarted")}
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
