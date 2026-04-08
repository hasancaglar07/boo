"use client";

import Image from "next/image";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { AppFrame } from "@/components/app/app-frame";
import { BackendUnavailableState } from "@/components/app/backend-unavailable-state";
import { BookMockup } from "@/components/books/book-mockup";
import { CollapsibleBookDetails } from "@/components/books/collapsible-book-details";
import {
  MobileContentSheet,
  MobileContentSheetContent,
} from "@/components/books/mobile-content-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";
import {
  buildBookAssetUrl,
  isBackendUnavailableError,
  loadBookPreview,
  loadBooks,
  startBookFullPipeline,
  startBookPreviewPipeline,
  type Book,
  type BookPreview,
  type BookStatus,
} from "@/lib/dashboard-api";
import { formatEta } from "@/lib/utils";
import { languageLabel } from "@/lib/funnel-draft";
import { loadFunnelDraft } from "@/lib/funnel-draft";

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
      <CardContent className="p-5 md:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground md:text-xl">
              {section.number && <span className="mr-1.5 text-muted-foreground">{section.number}.</span>}
              {section.title}
            </h2>
          </div>
          {isLive && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Loader2 className="size-3 animate-spin" />
              Writing
            </span>
          )}
        </div>

        <div className="text-sm leading-[1.8] text-muted-foreground md:text-base">
          {section.content || (
            <span className="italic text-muted-foreground/70">Content is being generated...</span>
          )}
        </div>

        {section.partial && !premium && (
          <div className="relative mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
            <p className="text-sm font-semibold text-foreground">Continue reading</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Unlock full access to read all chapters
            </p>
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
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<"toc" | "details" | "actions">("toc");
  const trackedRef = useRef(false);
  const bootstrapRequestedRef = useRef(false);
  const lastPreviewBootstrapAtRef = useRef(0);
  const fullBootstrapRequestedRef = useRef(false);
  const lastFullBootstrapAtRef = useRef(0);
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
    lastPreviewBootstrapAtRef.current = 0;
    fullBootstrapRequestedRef.current = false;
    lastFullBootstrapAtRef.current = 0;
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
    const generation = preview.generation || EMPTY_GENERATION;
    if (generation.product_ready) return;
    const shouldRequestBootstrap = !generation.cover_ready || !generation.preview_ready;
    if (!shouldRequestBootstrap) return;
    const now = Date.now();
    if (now - lastPreviewBootstrapAtRef.current < 25_000) return;
    lastPreviewBootstrapAtRef.current = now;
    bootstrapRequestedRef.current = true;
    void startBookPreviewPipeline(slug)
      .then(() => hydrate())
      .catch((error) => {
        if (isBackendUnavailableError(error) && previewSnapshotRef.current) {
          setTransientBackendIssue(true);
          return;
        }
        console.error(error);
      })
      .finally(() => {
        bootstrapRequestedRef.current = false;
      });
  }, [hydrate, preview, slug]);

  useEffect(() => {
    if (!preview || !preview.entitlements?.can_view_full_book) return;
    const generation = preview.generation || EMPTY_GENERATION;
    const full = generation.full_generation;
    const fullStage = String(full?.stage || "").trim().toLowerCase();
    const fullComplete = Boolean(full?.complete);
    const previewReady = Boolean(generation.preview_ready || generation.first_chapter_ready);
    if (!previewReady || fullComplete || generation.product_ready) return;
    if (fullStage === "queued" || fullStage === "running") return;
    if (fullBootstrapRequestedRef.current) return;
    const now = Date.now();
    if (now - lastFullBootstrapAtRef.current < 45_000) return;
    lastFullBootstrapAtRef.current = now;
    fullBootstrapRequestedRef.current = true;
    void startBookFullPipeline(slug)
      .then(() => hydrate())
      .catch((error) => {
        if (!isBackendUnavailableError(error)) {
          console.error(error);
        }
      })
      .finally(() => {
        fullBootstrapRequestedRef.current = false;
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
    const full = generation.full_generation;
    const fullStage = String(full?.stage || "").trim().toLowerCase();
    const intervalMs = transientBackendIssue
      ? 9_000
      : generation.preview_ready
        ? fullStage === "queued" || fullStage === "running"
          ? 6_000
          : 8_000
        : 4_000;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void hydrate();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [hydrate, preview, transientBackendIssue]);

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
        <div className="space-y-6">
          {/* ── IMPROVED LOADING SKELETON ──────────────────────────────────────── */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-background">
            <CardContent className="p-6 md:p-10">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
                {/* Left: Content skeleton */}
                <div className="space-y-5">
                  {/* Status badges skeleton */}
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-32 animate-pulse rounded-full bg-primary/20" />
                    <div className="h-6 w-24 animate-pulse rounded-full bg-muted/50" />
                  </div>

                  {/* Title skeleton */}
                  <div className="space-y-3">
                    <div className="h-10 w-3/4 animate-pulse rounded-lg bg-foreground/10" />
                    <div className="h-5 w-1/2 animate-pulse rounded-lg bg-muted/50" />
                    <div className="space-y-2">
                      <div className="h-4 w-full animate-pulse rounded bg-muted/30" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-muted/30" />
                    </div>
                  </div>

                  {/* CTA skeleton */}
                  <div className="flex gap-3">
                    <div className="h-14 w-48 animate-pulse rounded-xl bg-primary/20" />
                    <div className="h-14 w-36 animate-pulse rounded-xl bg-muted/30" />
                  </div>

                  {/* Meta skeleton */}
                  <div className="flex gap-2">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted/30" />
                    <div className="h-4 w-16 animate-pulse rounded bg-muted/30" />
                    <div className="h-4 w-24 animate-pulse rounded bg-muted/30" />
                  </div>
                </div>

                {/* Right: Cover skeleton */}
                <div className="hidden lg:block lg:w-[280px]">
                  <div className="aspect-[3/4] animate-pulse rounded-2xl bg-muted/50" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content skeleton */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="h-64 animate-pulse rounded-2xl bg-muted/30" />
              <div className="h-48 animate-pulse rounded-2xl bg-muted/20" />
            </div>
            <div className="hidden lg:block space-y-4">
              <div className="h-40 animate-pulse rounded-xl bg-muted/20" />
              <div className="h-32 animate-pulse rounded-xl bg-muted/20" />
            </div>
          </div>
        </div>
      </AppFrame>
    );
  }

  // ── Derived Values ────────────────────────────────────────────────────────

  const premium = Boolean(preview.entitlements?.can_view_full_book);
  const generation = preview.generation || EMPTY_GENERATION;
  const fullGeneration = generation.full_generation;
  const chapterReadyCount = Math.max(
    0,
    Number(fullGeneration?.ready_count ?? generation.chapter_ready_count ?? 0),
  );
  const chapterTargetCount = Math.max(
    0,
    Number(fullGeneration?.target_count ?? generation.chapter_target_count ?? 0),
  );
  const remainingChapterCount =
    chapterTargetCount > 0 ? Math.max(0, chapterTargetCount - chapterReadyCount) : 0;
  const generationEta = formatEta(fullGeneration?.eta_seconds);
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

  const visibleSections = preview.preview.visible_sections;
  const showLockedSections = !premium && preview.preview.locked_sections.length > 0;

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
      {/* Smart Breadcrumb with Status */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/app/library" className="hover:text-foreground transition-colors">
            Library
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{preview.book.title}</span>
        </div>
        {!generation.product_ready && (
          <div className="flex items-center gap-1.5 text-xs">
            {generation.active ? (
              <>
                <div className="size-2 animate-pulse rounded-full bg-primary" />
                <span className="font-medium text-foreground">Generating...</span>
              </>
            ) : (
              <span className="text-muted-foreground">Preview ready</span>
            )}
          </div>
        )}
      </nav>

      {transientBackendIssue && (
        <Card className="mb-4 border-amber-500/30 bg-amber-500/10">
          <CardContent className="p-3 text-sm leading-6 text-amber-900 dark:text-amber-200">
            Connection unstable. Showing last snapshot — will auto-refresh when service responds.
          </CardContent>
        </Card>
      )}

      {/* Compact Progress Bar - Only when actively generating */}
      {!generation.product_ready && generation.active && (
        <Card className="mb-4 border-primary/10 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Loader2 className="size-4 animate-spin text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{generation.message || "Creating your book..."}</p>
                {(generation.progress ?? 0) > 0 && (
                  <div className="mt-1.5 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, generation.progress ?? 0)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main grid: content + sidebar (2-column layout) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

        {/* ── MAIN: Hero + Content ────────────────────────────────────────────── */}
        <div className="space-y-6 min-w-0">
          {/* ── CLEAN HERO: Focus on book ──────────────────────────────────────── */}
          <Card className="border-border/50 bg-card">
            <CardContent className="p-5 md:p-6">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                {/* Left: Content */}
                <div className="space-y-4">
                  {/* Title & Description */}
                  <div>
                    <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
                      {preview.book.title}
                    </h1>
                    {preview.book.subtitle && (
                      <p className="mt-1 text-base text-muted-foreground">
                        {preview.book.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Single CTA */}
                  <div className="flex items-center gap-3">
                    {premium ? (
                      <Button
                        size="default"
                        className="h-11 px-5 text-sm font-semibold"
                        onClick={() => {
                          trackEvent("full_book_viewed", { slug });
                          router.push(`/app/book/${encodeURIComponent(slug)}/workspace?tab=writing`);
                        }}
                      >
                        <BookOpen className="mr-2 size-4" />
                        Read Full Book
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="default"
                          className="h-11 px-5 text-sm font-semibold"
                          onClick={() => openUpgrade("full_unlock")}
                        >
                          <Sparkles className="mr-2 size-4" />
                          Unlock Full Book
                          <span className="ml-1.5 text-muted-foreground">· $4</span>
                        </Button>
                        <Button
                          size="default"
                          variant="ghost"
                          className="h-11 px-4 text-sm font-medium text-muted-foreground"
                          onClick={() => {
                            trackEvent("examples_reader_viewed", { slug });
                            document.getElementById("preview-content")?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          Read Preview
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Minimal Meta */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{authorName}</span>
                    <span>·</span>
                    <span>{imprint}</span>
                    <span>·</span>
                    <span>{languageLabel(preview.book.language || "English")}</span>
                    <span>·</span>
                    <span>{ratio}% preview</span>
                  </div>
                </div>

                {/* Right: Cover */}
                <div className="hidden lg:block">
                  <BookMockup
                    title={preview.book.title}
                    subtitle={preview.book.subtitle}
                    author={authorName}
                    brand={logoText}
                    logoUrl={logoUrl || undefined}
                    imageUrl={coverUrl || undefined}
                    accentLabel={coverBrief || (coverUrl ? "Ready" : "Generating...")}
                    size="md"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content section header */}
          <div id="preview-content" className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-foreground">Preview Content</h2>
            <span className="text-xs text-muted-foreground">{ratio}% of book</span>
          </div>

          {/* Readable sections */}
          {visibleSections.map((section, index) => (
            <VisibleSection
              key={`visible-${section.number}-${section.title}`}
              section={section}
              index={index}
              previewReady={Boolean(generation.preview_ready)}
              premium={premium}
            />
          ))}

          {/* Empty state while writing */}
          {!visibleSections.length && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Loader2 className="mx-auto mb-3 size-8 animate-spin text-primary" />
                <div className="text-sm font-semibold text-foreground">Writing your book...</div>
                <p className="mt-2 text-xs text-muted-foreground">
                  First chapters will appear here automatically. Usually takes 1-2 minutes.
                </p>
              </CardContent>
            </Card>
          )}

          {premium && remainingChapterCount > 0 && (
            <Card className="border-primary/10 bg-primary/5">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span className="font-medium text-foreground">{chapterReadyCount}/{chapterTargetCount || "?"} chapters</span>
                  </div>
                  {generationEta && (
                    <span className="text-xs text-muted-foreground">ETA {generationEta}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Locked sections - Compact list */}
          {showLockedSections && (
            <Card className="border-dashed border-primary/30 bg-primary/[0.02]">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Lock className="size-3.5 text-primary" />
                    <span>Locked chapters</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{preview.preview.locked_sections.length}</span>
                </div>
                <div className="space-y-1.5">
                  {preview.preview.locked_sections.slice(0, 5).map((section) => (
                    <button
                      key={`locked-${section.number}-${section.title}`}
                      type="button"
                      className="w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm text-muted-foreground hover:border-primary/20 hover:bg-primary/5 transition"
                      onClick={() => {
                        trackEvent("preview_locked_section_clicked", {
                          slug,
                          section: section.title,
                        });
                        openUpgrade("full_unlock");
                      }}
                    >
                      <span className="font-medium text-muted-foreground/70">{section.number}.</span> {section.title}
                    </button>
                  ))}
                  {preview.preview.locked_sections.length > 5 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                      +{preview.preview.locked_sections.length - 5} more chapters
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => openUpgrade("full_unlock")}
                >
                  <Sparkles className="mr-2 size-4" />
                  Unlock All Chapters · $4
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── SIDEBAR: Compact & Organized ─────────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          {/* TOC - Compact */}
          {preview.preview.toc.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Contents</span>
                  <span className="text-xs text-muted-foreground">{preview.preview.toc.length} chapters</span>
                </div>
                <div className="max-h-[400px] space-y-1 overflow-y-auto">
                  {preview.preview.toc.map((item) => (
                    <div
                      key={`${item.number}-${item.title}`}
                      className="rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground"
                    >
                      {item.number && <span className="mr-1.5 font-medium text-muted-foreground">{item.number}.</span>}
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions - Only if not premium */}
          {!premium && (
            <Card className="border-primary/10 bg-primary/5">
              <CardContent className="p-4">
                <div className="mb-2.5 text-xs font-semibold text-foreground">Unlock Full Access</div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => openUpgrade("full_unlock")}
                >
                  <Sparkles className="mr-2 size-4" />
                  Get All Chapters · $4
                </Button>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>Full book access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>PDF & EPUB downloads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>Editing workspace</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Book Details - Collapsible */}
          {(authorBio || logoUrl || coverBrief || backCoverUrl) && (
            <CollapsibleBookDetails
              authorName={authorName}
              imprint={imprint}
              logoText={logoText}
              logoUrl={logoUrl}
              authorBio={authorBio}
              coverBrief={coverBrief}
              defaultExpanded={false}
            />
          )}
        </div>
      </div>

      {/* ── Mobile Navigation and Content Sheet ─────────────────────────────── */}
      <div className="lg:hidden">
        {/* Mobile Navigation Button - Standard position */}
        <div className="fixed bottom-20 right-4 z-50">
          <button
            type="button"
            className="flex size-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30"
            onClick={() => setMobileSheetOpen(!mobileSheetOpen)}
          >
            <FileText className="size-5 text-primary-foreground" />
          </button>
        </div>

        {/* Mobile Content Sheet */}
        <MobileContentSheet
          isOpen={mobileSheetOpen}
          onClose={() => setMobileSheetOpen(false)}
        >
          <MobileContentSheetContent
            tocContent={
              <div className="space-y-1">
                {preview.preview.toc.map((item) => (
                  <div
                    key={`${item.number}-${item.title}`}
                    className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5 text-sm text-foreground"
                  >
                    {item.number && <span className="mr-1.5 font-medium text-muted-foreground">{item.number}.</span>}
                    {item.title}
                  </div>
                ))}
              </div>
            }
            detailsContent={
              <div className="space-y-3">
                <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5">
                  <div className="text-xs font-medium text-muted-foreground">Author</div>
                  <div className="mt-0.5 text-sm text-foreground">{authorName}</div>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5">
                  <div className="text-xs font-medium text-muted-foreground">Imprint</div>
                  <div className="mt-0.5 text-sm text-foreground">{imprint}</div>
                </div>
                {coverBrief && (
                  <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5">
                    <div className="text-xs font-medium text-muted-foreground">Cover Brief</div>
                    <div className="mt-0.5 text-sm text-foreground">{coverBrief}</div>
                  </div>
                )}
                {authorBio && (
                  <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5">
                    <div className="text-xs font-medium text-muted-foreground">Author Bio</div>
                    <div className="mt-0.5 text-sm text-foreground">{authorBio}</div>
                  </div>
                )}
              </div>
            }
            actionsContent={
              <div className="space-y-2">
                {!premium && (
                  <Button
                    size="default"
                    className="w-full"
                    onClick={() => openUpgrade("full_unlock")}
                  >
                    <Sparkles className="mr-2 size-4" />
                    Unlock Full Book · $4
                  </Button>
                )}
                {premium && (
                  <Button
                    size="default"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      trackEvent("full_book_viewed", { slug });
                      router.push(`/app/book/${encodeURIComponent(slug)}/workspace?tab=writing`);
                    }}
                  >
                    <BookOpen className="mr-2 size-4" />
                    Read Full Book
                  </Button>
                )}
              </div>
            }
            activeTab={mobileActiveTab}
            onTabChange={setMobileActiveTab}
          />
        </MobileContentSheet>

        {/* ── Mobile Bottom Action Bar (Clean) ─────────────────────────────── */}
        {!premium && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-sm px-4 py-3 pb-safe">
            <div className="mx-auto flex max-w-2xl items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Unlock Full Book</p>
                <p className="mt-0.5 text-xs text-muted-foreground">All chapters · PDF · EPUB</p>
              </div>
              <Button
                size="default"
                className="shrink-0 h-10 px-5 text-sm font-semibold"
                onClick={() => openUpgrade("full_unlock")}
              >
                <Sparkles className="mr-1.5 size-4" aria-hidden="true" />
                $4
              </Button>
            </div>
          </div>
        )}

        {/* Bottom padding so content isn't hidden behind fixed bar */}
        {!premium && <div className="h-20" />}
      </div>
    </AppFrame>
  );
}
