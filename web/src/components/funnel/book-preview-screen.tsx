"use client";

import Image from "next/image";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  ImagePlus,
  Loader2,
  Lock,
  Sparkles,
  Upload,
  AlertCircle,
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
  buildAssetUrl,
  buildBookAssetUrl,
  isBackendUnavailableError,
  loadBookPreview,
  loadBooks,
  startBookFullPipeline,
  startBookPreviewPipeline,
  uploadBookAsset,
  buildBook,
  type Book,
  type BookPreview,
  type BookStatus,
} from "@/lib/dashboard-api";
import { formatEta } from "@/lib/utils";
import { languageLabel } from "@/lib/funnel-draft";
import { loadFunnelDraft } from "@/lib/funnel-draft";
import {
  canRegenerate,
  getRegenerationCount,
  incrementRegenerationCount,
  type RegenerationCount,
} from "@/lib/regeneration-limiter";

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
  const [regenerationCount, setRegenerationCount] = useState<RegenerationCount>({
    rewrite: 0,
    cover_front: 0,
    cover_back: 0,
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingEpub, setIsGeneratingEpub] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [exports, setExports] = useState<Array<{ id: string; format: string; url: string; date: string }>>([]);
  const frontCoverInputRef = useRef<HTMLInputElement>(null);
  const backCoverInputRef = useRef<HTMLInputElement>(null);
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
    // Load regeneration count
    setRegenerationCount(getRegenerationCount(slug));
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

  async function handleGeneratePdf() {
    if (!premium) {
      openUpgrade("pdf");
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const response = await buildBook(slug, {
        format: "pdf",
        author: preview.book.author,
        publisher: preview.book.publisher,
        author_bio: preview.book.author_bio,
        branding_mark: preview.book.branding_mark,
        branding_logo_url: preview.book.branding_logo_url,
        cover_brief: preview.book.cover_brief,
        generate_cover: false,
        cover_image: preview.book.cover_image,
        back_cover_image: preview.book.back_cover_image,
        isbn: preview.book.isbn,
        year: preview.book.year,
      });

      // Add to exports list
      const newExport = {
        id: Date.now().toString(),
        format: "pdf",
        url: buildAssetUrl((response as any).export_url || ""),
        date: new Date().toISOString(),
      };
      setExports((prev) => [newExport, ...prev].slice(0, 10));

      trackEvent("pdf_generated", { slug });
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  async function handleGenerateEpub() {
    if (!premium) {
      openUpgrade("epub");
      return;
    }

    setIsGeneratingEpub(true);
    try {
      const response = await buildBook(slug, {
        format: "epub",
        author: preview.book.author,
        publisher: preview.book.publisher,
        author_bio: preview.book.author_bio,
        branding_mark: preview.book.branding_mark,
        branding_logo_url: preview.book.branding_logo_url,
        cover_brief: preview.book.cover_brief,
        generate_cover: false,
        cover_image: preview.book.cover_image,
        back_cover_image: preview.book.back_cover_image,
        isbn: preview.book.isbn,
        year: preview.book.year,
      });

      // Add to exports list
      const newExport = {
        id: Date.now().toString(),
        format: "epub",
        url: buildAssetUrl((response as any).export_url || ""),
        date: new Date().toISOString(),
      };
      setExports((prev) => [newExport, ...prev].slice(0, 10));

      trackEvent("epub_generated", { slug });
    } catch (error) {
      console.error("EPUB generation failed:", error);
    } finally {
      setIsGeneratingEpub(false);
    }
  }

  async function handleFrontCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed (PNG, JPG, WebP)");
      return;
    }

    // Validate file size (4MB)
    if (file.size > 4 * 1024 * 1024) {
      alert("File size must be under 4MB");
      return;
    }

    // Check rate limit
    if (!canRegenerate(slug, "cover_front")) {
      alert("Front cover upload limit reached (1/1)");
      return;
    }

    setIsUploadingCover(true);
    try {
      const result = await uploadBookAsset(slug, file, "cover_image");

      // Update regeneration count
      const updatedCount = incrementRegenerationCount(slug, "cover_front");
      setRegenerationCount(updatedCount);

      // Refresh preview
      await hydrate();

      trackEvent("cover_front_uploaded", { slug });
    } catch (error) {
      console.error("Front cover upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploadingCover(false);
      // Reset input
      if (frontCoverInputRef.current) {
        frontCoverInputRef.current.value = "";
      }
    }
  }

  async function handleBackCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed (PNG, JPG, WebP)");
      return;
    }

    // Validate file size (4MB)
    if (file.size > 4 * 1024 * 1024) {
      alert("File size must be under 4MB");
      return;
    }

    // Check rate limit
    if (!canRegenerate(slug, "cover_back")) {
      alert("Back cover upload limit reached (1/1)");
      return;
    }

    setIsUploadingCover(true);
    try {
      const result = await uploadBookAsset(slug, file, "back_cover_image");

      // Update regeneration count
      const updatedCount = incrementRegenerationCount(slug, "cover_back");
      setRegenerationCount(updatedCount);

      // Refresh preview
      await hydrate();

      trackEvent("cover_back_uploaded", { slug });
    } catch (error) {
      console.error("Back cover upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploadingCover(false);
      // Reset input
      if (backCoverInputRef.current) {
        backCoverInputRef.current.value = "";
      }
    }
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
          {/* ── SIMPLIFIED HERO: Single focus point ─────────────────────────────────── */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
            <CardContent className="p-6 md:p-8 text-center">
              {/* Status Badge */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                {generation.active ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Writing your book...
                  </>
                ) : generation.preview_ready ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    Preview Ready
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Complete
                  </>
                )}
              </div>

              {/* Book Cover - Centered and Large */}
              <div className="mb-6 flex justify-center">
                <BookMockup
                  title={preview.book.title}
                  subtitle={preview.book.subtitle}
                  author={authorName}
                  brand={logoText}
                  logoUrl={logoUrl || undefined}
                  imageUrl={coverUrl || undefined}
                  accentLabel={coverBrief || (coverUrl ? "Ready" : "Generating...")}
                  size="lg"
                />
              </div>

              {/* Title Only */}
              <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl mb-2">
                {preview.book.title}
              </h1>

              {/* Simple Status Message */}
              <p className="text-sm text-muted-foreground mb-6">
                {generation.active
                  ? "Your book is being written... (usually takes 1-2 minutes)"
                  : generation.preview_ready
                  ? "First chapter ready! Full book coming soon."
                  : "Your book is ready!"}
              </p>

              {/* Single Primary CTA */}
              {premium ? (
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-semibold"
                  onClick={() => {
                    trackEvent("full_book_viewed", { slug });
                    router.push(`/app/book/${encodeURIComponent(slug)}/workspace?tab=writing`);
                  }}
                >
                  <BookOpen className="mr-2 size-5" />
                  Read Full Book
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-semibold"
                  onClick={() => openUpgrade("full_unlock")}
                >
                  <Sparkles className="mr-2 size-5" />
                  Unlock Full Book · $4
                </Button>
              )}

              {/* Minimal Author Info */}
              <div className="mt-6 text-xs text-muted-foreground">
                by {authorName} · {imprint}
              </div>
            </CardContent>
          </Card>
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

          {/* Content section header - Simplified */}
          <div id="preview-content" className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">First Chapter</h2>
          </div>

          {/* Readable sections - Show only first chapter */}
          {visibleSections.slice(0, 1).map((section, index) => (
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
                  First chapter will appear here automatically. Usually takes 1-2 minutes.
                </p>
              </CardContent>
            </Card>
          )}

          {/* "Want to read more?" Card - Replace locked sections */}
          {!premium && visibleSections.length > 0 && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="p-6 text-center">
                <div className="mb-3">
                  <BookOpen className="mx-auto size-8 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  Want to read more?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Unlock full access to all {chapterTargetCount || "12"} chapters
                </p>
                <Button
                  size="lg"
                  onClick={() => openUpgrade("full_unlock")}
                >
                  <Sparkles className="mr-2 size-4" />
                  Unlock Full Book · $4
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── SIDEBAR: Simplified Status ──────────────────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          {/* Simple Status Card */}
          <Card className="border-border/50 bg-card">
            <CardContent className="p-5 space-y-4">
              {/* Status Title */}
              <div className="text-sm font-semibold text-foreground">Book Progress</div>

              {/* Progress Checkmarks */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  {generation.cover_ready ? (
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="size-5 rounded-full border-2 border-border shrink-0" />
                  )}
                  <span className={generation.cover_ready ? "text-foreground" : "text-muted-foreground"}>
                    Cover designed
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  {generation.preview_ready ? (
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="size-5 rounded-full border-2 border-border shrink-0" />
                  )}
                  <span className={generation.preview_ready ? "text-foreground" : "text-muted-foreground"}>
                    {chapterReadyCount} of {chapterTargetCount || "?"} chapters ready
                  </span>
                </div>

                {remainingChapterCount > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <Loader2 className="size-5 text-primary animate-spin shrink-0" />
                    <span className="text-muted-foreground">
                      Writing {remainingChapterCount} more...
                    </span>
                  </div>
                )}
              </div>

              {/* ETA */}
              {generationEta && (
                <div className="text-xs text-muted-foreground">
                  ⏱️ About {generationEta} left
                </div>
              )}

              {/* Upgrade CTA - Only if not premium */}
              {!premium && (
                <div className="pt-3 border-t">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => openUpgrade("full_unlock")}
                  >
                    <Sparkles className="mr-2 size-4" />
                    Unlock All Chapters · $4
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Downloads Card - Always Visible */}
          <Card className="border-border/50 bg-card">
            <CardContent className="p-5 space-y-4">
              <div className="text-sm font-semibold text-foreground">Downloads</div>
              <div className="grid gap-3">
                {/* PDF Button */}
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 relative"
                  disabled={!premium || isGeneratingPdf}
                  onClick={premium ? handleGeneratePdf : () => openUpgrade("pdf")}
                >
                  <Upload className="mr-3 size-5 shrink-0" />
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">
                      {isGeneratingPdf ? "Generating PDF..." : "Get PDF"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Print-ready format
                    </div>
                  </div>
                  {!premium && <Lock className="absolute right-3 size-4 text-muted-foreground" />}
                  {isGeneratingPdf && <Loader2 className="size-4 animate-spin" />}
                </Button>

                {/* EPUB Button */}
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 relative"
                  disabled={!premium || isGeneratingEpub}
                  onClick={premium ? handleGenerateEpub : () => openUpgrade("epub")}
                >
                  <Upload className="mr-3 size-5 shrink-0" />
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">
                      {isGeneratingEpub ? "Generating EPUB..." : "Get EPUB"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      E-book format
                    </div>
                  </div>
                  {!premium && <Lock className="absolute right-3 size-4 text-muted-foreground" />}
                  {isGeneratingEpub && <Loader2 className="size-4 animate-spin" />}
                </Button>
              </div>

              {!premium && (
                <div className="pt-3 border-t">
                  <div className="text-xs text-center text-muted-foreground">
                    🔒 Premium feature - Unlock to download
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Cover Upload - Premium Only */}
          {premium && (
            <Card className="border-border/50 bg-card">
              <CardContent className="p-5 space-y-4">
                <div className="text-sm font-semibold text-foreground">Customize Covers</div>
                <div className="grid gap-3">
                  <input
                    ref={frontCoverInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFrontCoverUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-2.5"
                    disabled={isUploadingCover || regenerationCount.cover_front >= 1}
                    onClick={() => frontCoverInputRef.current?.click()}
                  >
                    <ImagePlus className="mr-2 size-4" />
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">Front Cover</div>
                      <div className="text-xs text-muted-foreground">
                        {regenerationCount.cover_front >= 1
                          ? "Limit reached (1/1)"
                          : "PNG, JPG or WebP up to 4MB"}
                      </div>
                    </div>
                    {isUploadingCover && <Loader2 className="size-4 animate-spin" />}
                  </Button>

                  <input
                    ref={backCoverInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleBackCoverUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-2.5"
                    disabled={isUploadingCover || regenerationCount.cover_back >= 1}
                    onClick={() => backCoverInputRef.current?.click()}
                  >
                    <ImagePlus className="mr-2 size-4" />
                    <div className="text-left flex-1">
                      <div className="font-medium text-sm">Back Cover</div>
                      <div className="text-xs text-muted-foreground">
                        {regenerationCount.cover_back >= 1
                          ? "Limit reached (1/1)"
                          : "PNG, JPG or WebP up to 4MB"}
                      </div>
                    </div>
                    {isUploadingCover && <Loader2 className="size-4 animate-spin" />}
                  </Button>
                </div>

                {(regenerationCount.cover_front >= 1 || regenerationCount.cover_back >= 1) && (
                  <div className="pt-3 border-t">
                    <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md p-2">
                      <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">Upload limits</div>
                        <div className="mt-0.5 text-[10px] leading-tight">
                          Front: {regenerationCount.cover_front}/1 · Back: {regenerationCount.cover_back}/1
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
