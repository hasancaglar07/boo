"use client";

import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Lock,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { AppFrame } from "@/components/app/app-frame";
import { BackendUnavailableState } from "@/components/app/backend-unavailable-state";
import { BookMockup } from "@/components/books/book-mockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";
import {
  buildBookAssetUrl,
  isBackendUnavailableError,
  loadBookPreview,
  loadBooks,
  startBookPreviewPipeline,
  type Book,
  type BookPreview,
  type BookStatus,
} from "@/lib/dashboard-api";
import { languageLabel } from "@/lib/funnel-draft";
import { loadFunnelDraft } from "@/lib/funnel-draft";
import { cn } from "@/lib/utils";

const EMPTY_GENERATION: BookStatus = {
  chapter_count: 0,
  asset_count: 0,
  extra_count: 0,
  research_count: 0,
  export_count: 0,
  active: false,
  stage: "idle",
  message: "",
  progress: 0,
  error: "",
  cover_ready: false,
  first_chapter_ready: false,
  product_ready: false,
  preview_ready: false,
  cover_state: "idle",
  first_chapter_state: "idle",
  started_at: "",
  updated_at: "",
  completed_at: "",
};

function normalizeLogoUrl(slug: string, value: string) {
  if (!value) return "";
  return /^(https?:\/\/|data:)/.test(value) ? value : buildBookAssetUrl(slug, value);
}

// ─── Generation Status Banner ────────────────────────────────────────────────

function GenerationBanner({
  generation,
  coverReady,
}: {
  generation: BookStatus;
  coverReady: boolean;
}) {
  if (generation.product_ready) return null;
  if (generation.stage === "error") return null;

  // Clamp progress: if backend sends 0 or nothing, show a minimum of 25
  // so the user always sees forward motion immediately after preview loads.
  const rawProgress = Math.max(0, Math.min(100, Number(generation.progress || 0)));
  const progress = rawProgress === 0 ? 25 : rawProgress;

  const steps = [
    {
      label: "Cover image",
      done: coverReady,
    },
    {
      label: "First readable chapter",
      done: Boolean(generation.preview_ready),
    },
    {
      label: "Full book",
      done: Boolean(generation.product_ready),
    },
  ];

  return (
    <div className="rounded-[20px] border border-primary/15 bg-primary/5 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          Full book is being prepared
        </div>
        <div className="shrink-0 text-sm font-bold tabular-nums text-primary">
          %{progress}
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary/15">
        <div
          className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-1.5 text-xs">
            {step.done ? (
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
            )}
            <span className={cn("font-medium", step.done ? "text-foreground" : "text-muted-foreground")}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {generation.error && (
        <div className="mt-3 rounded-[14px] border border-destructive/20 bg-destructive/8 px-4 py-2.5 text-sm leading-6 text-destructive">
          {generation.error}
        </div>
      )}
    </div>
  );
}

// ─── Premium CTA Card ─────────────────────────────────────────────────────────

function PremiumCTA({
  premium,
  slug,
  onUpgrade,
}: {
  premium: boolean;
  slug: string;
  onUpgrade: (trigger: "pdf" | "epub" | "full_unlock") => void;
}) {
  const router = useRouter();

  if (premium) {
    return (
      <Card className="border-emerald-500/25 bg-emerald-500/8">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Full Access Active
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Full book, PDF, EPUB, and workspace are unlocked.
          </p>
          <Button
            size="lg"
            className="mt-4 w-full"
            onClick={() =>
              router.push(`/app/book/${encodeURIComponent(slug)}/workspace?tab=publish`)
            }
          >
            <Download className="mr-2 size-4" aria-hidden="true" />
            Download PDF / EPUB
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main CTA card */}
      <Card className="overflow-hidden border-primary/30 shadow-lg shadow-primary/10">
        {/* Anchor pricing header */}
        <div className="bg-primary px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground/80">
              Launch price
            </span>
            <span className="rounded-full bg-primary-foreground/15 px-2 py-0.5 text-xs font-bold text-primary-foreground">
              86% off
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary-foreground">$4</span>
            <span className="text-sm text-primary-foreground/70 line-through">$29</span>
            <span className="text-xs text-primary-foreground/70">one-time</span>
          </div>
        </div>

        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground">
            Full access for this book — no subscription
          </p>

          <ul className="mt-4 space-y-2.5">
            {[
              { icon: FileText, text: "All chapters unlocked" },
              { icon: Download, text: "PDF + EPUB export" },
              { icon: BookOpen, text: "Cover and back cover" },
              { icon: Zap, text: "Workspace and editing" },
              { icon: Shield, text: "30-day refund guarantee" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-foreground">
                <Icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            className="mt-5 w-full text-base font-bold shadow-md shadow-primary/20"
            onClick={() => onUpgrade("full_unlock")}
          >
            <Sparkles className="mr-2 size-4" aria-hidden="true" />
            Publish for $4
            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </Button>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            Instant access · Secure credit card
          </p>

          {/* Secondary links */}
          <div className="mt-3 flex justify-center gap-4">
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
              onClick={() => onUpgrade("pdf")}
            >
              Download PDF
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
              onClick={() => onUpgrade("epub")}
            >
              Download EPUB
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Trust signals */}
      <div className="rounded-[18px] border border-border/60 bg-background/60 px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Shield, text: "30-day refund" },
            { icon: Zap, text: "Instant delivery" },
            { icon: BookOpen, text: "No subscription" },
            { icon: CheckCircle2, text: "KDP compatible" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="size-3 shrink-0 text-primary" aria-hidden="true" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Book Meta Strip ──────────────────────────────────────────────────────────

function BookMetaStrip({
  authorName,
  imprint,
  language,
  ratio,
}: {
  authorName: string;
  imprint: string;
  language: string;
  ratio: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        { label: "Author", value: authorName },
        { label: "Imprint", value: imprint },
        { label: "Language", value: `${languageLabel(language)} book` },
        { label: "Preview", value: `First ${ratio}%` },
      ].map(({ label, value }) => (
        <div
          key={label}
          className="rounded-[14px] border border-border/70 bg-background/70 px-3 py-2"
        >
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Section Reader ───────────────────────────────────────────────────────────

function VisibleSection({
  section,
  index,
  previewReady,
  premium,
}: {
  section: { number?: number | string; title: string; content?: string; partial?: boolean };
  index: number;
  previewReady: boolean;
  premium: boolean;
}) {
  const isFirst = index === 0;
  const isLive = !previewReady && isFirst;

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {isLive ? "Live generated chapter" : "Readable chapter"}
            </div>
            <h2 className="mt-1.5 text-xl font-semibold text-foreground md:text-2xl">
              {section.number ? `${section.number}. ` : ""}
              {section.title}
            </h2>
          </div>
          {isFirst && previewReady && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-3" />
              Ready
            </span>
          )}
          {isLive && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              <Loader2 className="size-3 animate-spin" />
              Writing
            </span>
          )}
        </div>

        <div className="text-sm leading-[1.9] text-muted-foreground md:text-[15px]">
          {section.content || (
            <span className="italic">Content is being generated, keep the page open...</span>
          )}
        </div>

        {section.partial && !premium && (
          <div className="relative mt-6">
            {/* Blur gradient overlay */}
            <div className="pointer-events-none absolute inset-x-0 -top-16 h-20 bg-gradient-to-t from-card to-transparent" />
            {/* CTA */}
            <div className="rounded-[18px] border border-primary/25 bg-gradient-to-br from-primary/10 to-primary/5 px-5 py-5 text-center">
              <Lock className="mx-auto mb-2 size-5 text-primary" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">
                Upgrade to Premium to continue reading
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                All chapters, PDF, EPUB, and workspace unlock
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Locked Section Card ──────────────────────────────────────────────────────

function LockedSectionCard({
  section,
  onClick,
}: {
  section: { number?: number | string; title: string; teaser?: string };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="w-full text-left"
      onClick={onClick}
    >
      <div className="group rounded-[20px] border border-dashed border-border/70 bg-background/50 px-5 py-4 transition hover:border-primary/30 hover:bg-accent/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Locked chapter
            </div>
            <div className="mt-1 truncate text-base font-semibold text-foreground">
              {section.number ? `${section.number}. ` : ""}
              {section.title}
            </div>
          </div>
          <div className="mt-0.5 flex shrink-0 size-7 items-center justify-center rounded-full border border-border bg-background group-hover:border-primary/30 group-hover:bg-primary/8 transition">
            <Lock className="size-3.5 text-muted-foreground group-hover:text-primary transition" />
          </div>
        </div>
        {section.teaser && (
          <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">
            {section.teaser}
          </p>
        )}
        <div className="mt-3 text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
          Unlock with Premium →
        </div>
      </div>
    </button>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function BookPreviewScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [preview, setPreview] = useState<BookPreview | null>(null);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [transientBackendIssue, setTransientBackendIssue] = useState(false);
  const trackedRef = useRef(false);
  const bootstrapRequestedRef = useRef(false);
  const previewSnapshotRef = useRef<BookPreview | null>(null);
  const hydrateInFlightRef = useRef(false);

  // // Update auth state after successful Stripe payment
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      void fetch("/api/auth/state").catch(() => null);
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      url.searchParams.delete("session_id");
      router.replace(url.pathname + (url.search || ""));
    }
  }, [searchParams, router]);

  const hydrate = useCallback(async ({ includeBooks = false }: { includeBooks?: boolean } = {}) => {
    if (hydrateInFlightRef.current) return;
    hydrateInFlightRef.current = true;
    try {
      if (includeBooks) {
        try {
          const bookList = await loadBooks();
          setBooks(bookList);
        } catch (error) {
          if (!isBackendUnavailableError(error)) {
            console.error(error);
          }
        }
      }
      const previewPayload = await loadBookPreview(slug);
      setPreview(previewPayload);
      setBackendUnavailable(false);
      setTransientBackendIssue(false);
      if (!trackedRef.current) {
        trackedRef.current = true;
        trackEvent("preview_viewed", { slug });
      }
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        if (previewSnapshotRef.current) {
          setTransientBackendIssue(true);
          setBackendUnavailable(false);
          return;
        }
        setBackendUnavailable(true);
        return;
      }
      console.error(error);
    } finally {
      hydrateInFlightRef.current = false;
    }
  }, [slug]);

  const draftMeta = useMemo(() => {
    const stored = loadFunnelDraft();
    if (stored.generatedSlug !== slug) {
      return null;
    }

    return {
      authorName: stored.authorName || "",
      imprint: stored.imprint || "",
      logoText: stored.logoText || "",
      logoUrl: stored.logoUrl || "",
      authorBio: stored.authorBio || "",
      coverBrief: stored.coverBrief || "",
    };
  }, [slug]);

  useEffect(() => {
    trackedRef.current = false;
    bootstrapRequestedRef.current = false;
    previewSnapshotRef.current = null;
  }, [slug]);

  useEffect(() => {
    previewSnapshotRef.current = preview;
  }, [preview]);

  useEffect(() => {
    const frame = window.setTimeout(() => {
      void hydrate({ includeBooks: true });
    }, 0);
    return () => window.clearTimeout(frame);
  }, [hydrate]);

  useEffect(() => {
    if (!preview || bootstrapRequestedRef.current) return;
    if (preview.generation.product_ready) return;
    bootstrapRequestedRef.current = true;
    void startBookPreviewPipeline(slug)
      .then(() => hydrate())
      .catch((error) => {
        bootstrapRequestedRef.current = false;
        if (isBackendUnavailableError(error) && previewSnapshotRef.current) {
          setTransientBackendIssue(true);
          return;
        }
        console.error(error);
      });
  }, [hydrate, preview, slug]);

  useEffect(() => {
    if (!preview) return;
    const generation = preview.generation || EMPTY_GENERATION;
    if (
      generation.product_ready ||
      generation.stage === "error" ||
      generation.stage === "needs_attention"
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      void hydrate();
    }, 3500);
    return () => window.clearInterval(timer);
  }, [hydrate, preview]);

  if (backendUnavailable) {
    return (
      <AppFrame
        current="preview"
        layout="book"
        currentBookSlug={slug}
        title="Preview"
        subtitle="Connection issue occurred."
        books={books}
      >
        <BackendUnavailableState onRetry={() => void hydrate({ includeBooks: true })} />
      </AppFrame>
    );
  }

  // ── Loading Skeleton ──────────────────────────────────────────────────────

  if (!preview) {
    return (
      <AppFrame
        current="preview"
        layout="book"
        currentBookSlug={slug}
        title="Your book showcase is being prepared"
        subtitle="Cover, first chapter, and sales surface are being placed."
        books={books}
      >
        <div className="space-y-4">
          {/* Generation status placeholder */}
          <div className="h-[72px] animate-pulse rounded-[20px] bg-muted" />

          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_288px]">
            {/* Cover column */}
            <div className="space-y-4">
              <div className="aspect-[3/4] animate-pulse rounded-[24px] bg-muted" />
              <div className="h-40 animate-pulse rounded-[20px] bg-muted" />
            </div>

            {/* Content column */}
            <div className="space-y-4">
              <div className="h-48 animate-pulse rounded-[20px] bg-muted" />
              <div className="h-72 animate-pulse rounded-[20px] bg-muted" />
              <div className="h-32 animate-pulse rounded-[20px] bg-muted" />
            </div>

            {/* Right column */}
            <div className="hidden space-y-4 xl:block">
              <div className="h-56 animate-pulse rounded-[20px] bg-muted" />
              <div className="h-36 animate-pulse rounded-[20px] bg-muted" />
            </div>
          </div>
        </div>
      </AppFrame>
    );
  }

  // ── Derived Values ────────────────────────────────────────────────────────

  const premium = Boolean(preview.entitlements?.can_view_full_book);
  const generation = preview.generation || EMPTY_GENERATION;
  const ratio = Math.round((preview.preview.ratio || 0.2) * 100);
  const authorName = preview.book.author || draftMeta?.authorName || "Book Creator";
  const imprint = preview.book.publisher || draftMeta?.imprint || "Book Generator";
  const logoText = preview.book.branding_mark || draftMeta?.logoText || imprint;
  const rawLogoUrl = preview.book.branding_logo_url || draftMeta?.logoUrl || "";
  const logoUrl = normalizeLogoUrl(slug, rawLogoUrl);
  const authorBio = preview.book.author_bio || draftMeta?.authorBio || "";
  const coverBrief = preview.book.cover_brief || draftMeta?.coverBrief || "";
  const coverUrl = preview.book.cover_image
    ? buildBookAssetUrl(slug, preview.book.cover_image)
    : "";
  const backCoverUrl = preview.book.back_cover_image
    ? buildBookAssetUrl(slug, preview.book.back_cover_image)
    : "";

  const pageSubtitle = premium
    ? "Full access active. Book, cover, and export surface are unlocked."
    : generation.product_ready
      ? `Book ready — first %${ratio} readable preview is open.`
      : generation.preview_ready
        ? "First chapter ready. Cover and full content are being finalized."
        : generation.active
          ? "Your book production is in progress. Page updates automatically."
          : "Your book showcase is being prepared.";

  function openUpgrade(trigger: "pdf" | "epub" | "full_unlock") {
    if (trigger === "pdf") trackEvent("paywall_pdf_clicked", { slug });
    if (trigger === "epub") trackEvent("paywall_epub_clicked", { slug });
    if (trigger === "full_unlock") trackEvent("paywall_full_unlock_clicked", { slug });
    trackEvent("paywall_viewed", { slug, trigger });
    router.push(`/app/book/${encodeURIComponent(slug)}/upgrade`);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AppFrame
      current="preview"
      layout="book"
      currentBookSlug={slug}
      title={preview.book.title}
      subtitle={pageSubtitle}
      books={books}
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/app/library" className="hover:text-foreground transition-colors">
          Library
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">{preview.book.title}</span>
      </nav>

      {transientBackendIssue && (
        <Card className="mb-4 border-amber-500/30 bg-amber-500/10">
          <CardContent className="p-4 text-sm leading-6 text-amber-900 dark:text-amber-200">
            Connection to backend is unstable right now. You are seeing the last successful preview snapshot; this page
            will auto-refresh when the service responds again.
          </CardContent>
        </Card>
      )}

      {/* Generation banner — always full width at top */}
      {!generation.product_ready && !premium && (
        <GenerationBanner generation={generation} coverReady={Boolean(coverUrl)} />
      )}

      {/* Main grid: cover | content | sidebar */}
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_272px]">

        {/* ── LEFT: Cover + TOC ─────────────────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          <Card className="overflow-hidden">
            <CardContent className="p-5">
              {/* Cover status pills */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                    coverUrl
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {coverUrl ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    <Loader2 className="size-3 animate-spin" />
                  )}
                  {coverUrl ? "Cover ready" : "Cover generating"}
                </span>
              </div>

              <BookMockup
                title={preview.book.title}
                subtitle={preview.book.subtitle}
                author={authorName}
                brand={logoText}
                logoUrl={logoUrl || undefined}
                imageUrl={coverUrl || undefined}
                accentLabel={coverBrief || (coverUrl ? "Ready for sale appearance" : "Live cover generation")}
                size="xl"
              />

              {!coverUrl && (
                <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
                  Cover is being generated in the background. This section updates automatically when ready.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Back cover */}
          {backCoverUrl && (
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Back Cover
                </div>
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[16px]">
                  <Image
                    src={backCoverUrl}
                    alt={`${preview.book.title} back cover`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* TOC */}
          {preview.preview.toc.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Table of Contents
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {preview.preview.toc.length} chapters
                  </span>
                </div>
                <div className="space-y-1.5">
                  {preview.preview.toc.map((item) => (
                    <div
                      key={`${item.number}-${item.title}`}
                      className="rounded-[12px] border border-border/60 bg-background/60 px-3 py-2 text-sm leading-6 text-foreground"
                    >
                      {item.number ? (
                        <span className="mr-1.5 font-semibold text-muted-foreground">{item.number}.</span>
                      ) : null}
                      {item.title}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── CENTER: Book info + Content ───────────────────────────────────── */}
        <div className="space-y-5">
          {/* Book header card */}
          <Card className="border-primary/15 bg-[radial-gradient(ellipse_at_top_right,rgba(188,104,67,0.08),transparent_60%)]">
            <CardContent className="p-6 md:p-8">
              {/* Badges */}
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-primary/25 bg-primary/8 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                  Preview
                </span>
                {generation.active && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    <Clock className="size-3" />
                    Live production
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl xl:text-5xl">
                {preview.book.title}
              </h2>
              {preview.book.subtitle && (
                <p className="mt-3 text-base leading-7 text-muted-foreground md:text-lg">
                  {preview.book.subtitle}
                </p>
              )}
              {preview.book.description && (
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {preview.book.description}
                </p>
              )}

              {/* Meta strip */}
              <div className="mt-5">
                <BookMetaStrip
                  authorName={authorName}
                  imprint={imprint}
                  language={preview.book.language || "English"}
                  ratio={ratio}
                />
              </div>

              {/* Primary actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="min-w-[160px]"
                  onClick={() => {
                    if (premium) {
                      trackEvent("full_book_viewed", { slug });
                      router.push(
                        `/app/book/${encodeURIComponent(slug)}/workspace?tab=writing`,
                      );
                      return;
                    }
                    openUpgrade("full_unlock");
                  }}
                >
                  <BookOpen className="mr-2 size-4" />
                  {premium ? "Read Full Book" : "Unlock Full Book"}
                </Button>

                {premium ? (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      trackEvent("pdf_export_started", { slug });
                      router.push(
                        `/app/book/${encodeURIComponent(slug)}/workspace?tab=publish`,
                      );
                    }}
                  >
                    <Download className="mr-2 size-4" />
                    Download PDF / EPUB
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => openUpgrade("pdf")}
                  >
                    <Download className="mr-2 size-4" />
                    Download PDF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Readable sections */}
          {preview.preview.visible_sections.map((section, index) => (
            <VisibleSection
              key={`visible-${section.number}-${section.title}`}
              section={section}
              index={index}
              previewReady={Boolean(generation.preview_ready)}
              premium={premium}
            />
          ))}

          {/* Empty state while writing */}
          {!preview.preview.visible_sections.length && (
            <Card>
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/8">
                    <Loader2 className="size-4 animate-spin text-primary" />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      First readable chapters
                    </div>
                    <div className="mt-1 text-xl font-semibold text-foreground">Writing</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Keep the page open - it updates automatically when the first chapters arrive. Usually takes 1-2 minutes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Locked sections */}
          {preview.preview.locked_sections.length > 0 && (
            <div>
              <div className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Locked chapters ({preview.preview.locked_sections.length})
              </div>
              <div className="space-y-2">
                {preview.preview.locked_sections.map((section) => (
                  <LockedSectionCard
                    key={`locked-${section.number}-${section.title}`}
                    section={section}
                    onClick={() => {
                      trackEvent("preview_locked_section_clicked", {
                        slug,
                        section: section.title,
                      });
                      openUpgrade("full_unlock");
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Premium CTA + Author info ──────────────────────────────── */}
        <div className="space-y-4 xl:sticky xl:top-6 xl:h-fit">
          <PremiumCTA premium={premium} slug={slug} onUpgrade={openUpgrade} />

          {/* Author identity card */}
          {(authorBio || logoUrl || coverBrief) && (
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Book Identity
                </div>
                <div className="space-y-3">
                  <div className="rounded-[14px] border border-border/60 bg-background/60 px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Author
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{authorName}</div>
                  </div>

                  {logoUrl && (
                    <div className="rounded-[14px] border border-border/60 bg-background/60 px-3 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Logo
                      </div>
                      <div className="relative mt-2 h-10 w-[120px] overflow-hidden rounded-md bg-muted/30">
                        <Image
                          src={logoUrl}
                          alt={`${logoText} logo`}
                          fill
                          className="object-contain p-1"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}

                  {coverBrief && (
                    <div className="rounded-[14px] border border-border/60 bg-background/60 px-3 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Cover emphasis
                      </div>
                      <div className="mt-1 text-sm leading-6 text-foreground">{coverBrief}</div>
                    </div>
                  )}

                  {authorBio && (
                    <div className="rounded-[14px] border border-border/60 bg-background/60 px-3 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Author biography
                      </div>
                      <div className="mt-1 text-sm leading-6 text-muted-foreground">{authorBio}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Mobile fixed bottom bar (non-premium only) ─────────────────────── */}
      {!premium && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/97 px-4 pb-safe pt-3 pb-3 backdrop-blur-md xl:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">Unlock full book for $4</p>
              <p className="text-xs text-muted-foreground">
                PDF · EPUB · Tüm chaptersler · 30-day refund
              </p>
            </div>
            <Button
              size="default"
              className="shrink-0 font-bold shadow-md"
              onClick={() => openUpgrade("full_unlock")}
            >
              <Sparkles className="mr-1.5 size-3.5" aria-hidden="true" />
              Publish for $4
            </Button>
          </div>
        </div>
      )}

      {/* Bottom padding so content isn't hidden behind fixed bar */}
      {!premium && <div className="h-20 xl:hidden" />}
    </AppFrame>
  );
}
