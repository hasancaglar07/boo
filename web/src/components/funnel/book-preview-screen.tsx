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
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

import { AppFrame } from "@/components/app/app-frame";
import { BackendUnavailableState } from "@/components/app/backend-unavailable-state";
import { BookMockup } from "@/components/books/book-mockup";
import { CollapsibleBookDetails } from "@/components/books/collapsible-book-details";
import { EditableBookDetails } from "@/components/books/editable-book-details";
import { CompactProgressCard } from "@/components/books/compact-progress-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PreviewPageSkeleton } from "@/components/loading/preview-skeleton";

// Dynamic imports for code splitting
const ChapterListSidebar = dynamic(
  () => import("@/components/books/chapter-list-sidebar").then(mod => ({ default: mod.ChapterListSidebar })),
  { ssr: false, loading: () => <div className="animate-pulse bg-muted h-64 rounded-lg" /> }
);

const ChapterPreviewCard = dynamic(
  () => import("@/components/books/chapter-preview-card").then(mod => ({ default: mod.ChapterPreviewCard })),
  { ssr: true, loading: () => <div className="animate-pulse bg-muted h-96 rounded-lg" /> }
);

const MobileContentSheet = dynamic(
  () => import("@/components/books/mobile-content-sheet").then(mod => ({ default: mod.MobileContentSheet })),
  { ssr: false }
);
const MobileContentSheetContent = dynamic(
  () => import("@/components/books/mobile-content-sheet").then(mod => ({ default: mod.MobileContentSheetContent })),
  { ssr: false }
);
import { trackEvent } from "@/lib/analytics";
import { initPerformanceMonitoring } from "@/lib/performance-monitoring";

// Scroll depth tracking
const SCROLL_DEPTHS = [25, 50, 75, 100] as const;
type ScrollDepth = typeof SCROLL_DEPTHS[number];
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
    <Card className="shadow-lg max-w-3xl mx-auto">
      <CardContent className="p-8 md:p-12">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl" style={{ fontFamily: "'Playfair Display', serif" }}>
              {section.number && <span className="mr-2 text-muted-foreground">{section.number}.</span>}
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

        <div className="prose prose-lg max-w-none" style={{ fontFamily: "'Source Serif Pro', serif", lineHeight: "1.8", color: "hsl(var(--muted-foreground))" }}>
          {section.content || (
            <span className="italic text-muted-foreground/70">Content is being generated...</span>
          )}
        </div>

        {section.partial && !premium && (
          <div className="relative mt-8 rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
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
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const frontCoverInputRef = useRef<HTMLInputElement>(null);

  // Chapter change tracking wrapper
  const handleChapterChange = useCallback((newIndex: number) => {
    setSelectedChapterIndex(newIndex);
    trackEvent("preview_chapter_changed", {
      slug,
      chapter_index: newIndex,
      previous_chapter_index: selectedChapterIndex,
    });
  }, [slug, selectedChapterIndex]);
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

  // Scroll depth tracking
  useEffect(() => {
    const trackedDepths = new Set<number>();

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPosition = window.scrollY;
      const scrollPercentage = Math.round((scrollPosition / scrollHeight) * 100);

      SCROLL_DEPTHS.forEach((depth) => {
        if (scrollPercentage >= depth && !trackedDepths.has(depth)) {
          trackedDepths.add(depth);
          trackEvent("preview_scroll_depth", {
            slug,
            scroll_depth_percent: depth,
          });
        }
      });
    };

    // Throttled scroll handler
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledHandleScroll, { passive: true });
    return () => window.removeEventListener("scroll", throttledHandleScroll);
  }, [slug]);

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

        // Track time on page every 30 seconds
        const timeTrackingInterval = setInterval(() => {
          trackEvent("preview_time_on_page", {
            slug,
            duration_seconds: 30,
          });
        }, 30000);

        // Cleanup on unmount
        return () => clearInterval(timeTrackingInterval);
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
        <PreviewPageSkeleton />
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

    if (!preview) {
      console.error("Preview data not available");
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
      });

      // Add to exports list
      const newExport = {
        id: Date.now().toString(),
        format: "pdf" as const,
        url: buildAssetUrl((response as { export_url?: string }).export_url || ""),
        date: new Date().toISOString(),
      };
      setExports((prev) => [newExport, ...prev].slice(0, 10));

      trackEvent("pdf_export_completed", { slug });
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

    if (!preview) {
      console.error("Preview data not available");
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
      });

      // Add to exports list
      const newExport = {
        id: Date.now().toString(),
        format: "epub" as const,
        url: buildAssetUrl((response as { export_url?: string }).export_url || ""),
        date: new Date().toISOString(),
      };
      setExports((prev) => [newExport, ...prev].slice(0, 10));

      trackEvent("epub_export_completed", { slug });
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

      trackEvent("preview_custom_front_cover_uploaded", { slug });
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

      // trackEvent("cover_back_uploaded", { slug }); // TODO: Add to analytics type
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

      {/* Main grid: content + sidebar (responsive 2-column layout) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] grid-cols-1">

        {/* ── MAIN: Hero + Content ────────────────────────────────────────────── */}
        <div className="space-y-6 min-w-0">
          {/* ── COMPACT EDITORIAL HERO ─────────────────────────────────────────────── */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 -mx-4 md:-mx-6 px-4 md:px-6 py-6 md:py-8 rounded-3xl">
            <div className="max-w-4xl mx-auto">
              {/* Status Banner */}
              <div className="mb-4 md:mb-6 text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 md:px-5 py-2 text-xs md:text-sm font-semibold">
                  {generation.active ? (
                    <>
                      <Loader2 className="size-3.5 md:size-4 animate-spin" />
                      Writing your book... (usually takes 1-2 minutes)
                    </>
                  ) : generation.preview_ready ? (
                    <>
                      <CheckCircle2 className="size-3.5 md:size-4" />
                      Preview Ready
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3.5 md:size-4" />
                      Complete
                    </>
                  )}
                </span>
              </div>

              {/* Book Cover - Compact */}
              <div className="flex justify-center mb-4 md:mb-6">
                <BookMockup
                  title={preview.book.title}
                  subtitle={preview.book.subtitle}
                  author={authorName}
                  brand={logoText}
                  logoUrl={logoUrl || undefined}
                  imageUrl={coverUrl || undefined}
                  accentLabel={coverBrief || (coverUrl ? "Ready" : "Generating...")}
                  size="md"
                  className="shadow-xl"
                />
              </div>

              {/* Title & Author */}
              <div className="text-center mb-4 md:mb-6">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {preview.book.title}
                </h1>
                {preview.book.subtitle && (
                  <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 italic" style={{ fontFamily: "'Source Serif Pro', serif" }}>
                    {preview.book.subtitle}
                  </p>
                )}
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-500 mt-2">
                  by {authorName} · {imprint}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-base font-semibold"
                  onClick={() => {
                    trackEvent("preview_viewed", { slug });
                    document.getElementById("preview-content")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <BookOpen className="mr-2 size-5" />
                  Read Chapter 1
                </Button>

                <Button
                  size="lg"
                  variant={premium ? "primary" : "outline"}
                  className="h-14 px-8 text-base font-semibold relative"
                  disabled={!premium && !generation.preview_ready}
                  onClick={premium ? handleGeneratePdf : () => openUpgrade("pdf")}
                >
                  <Upload className="mr-2 size-5" />
                  {isGeneratingPdf ? "Generating..." : "Download PDF"}
                  {!premium && !generation.preview_ready && <Lock className="absolute right-3 size-5" />}
                </Button>

                <Button
                  size="lg"
                  variant={premium ? "primary" : "outline"}
                  className="h-14 px-8 text-base font-semibold relative"
                  disabled={!premium && !generation.preview_ready}
                  onClick={premium ? handleGenerateEpub : () => openUpgrade("epub")}
                >
                  <Upload className="mr-2 size-5" />
                  {isGeneratingEpub ? "Generating..." : "Download EPUB"}
                  {!premium && !generation.preview_ready && <Lock className="absolute right-3 size-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* ── CHAPTER PREVIEW ─────────────────────────────────────────────────────── */}
          <div id="preview-content">
            {visibleSections.length > 0 ? (
              <>
                <ChapterPreviewCard
                  chapter={visibleSections[selectedChapterIndex] || visibleSections[0]}
                  chapterIndex={selectedChapterIndex}
                  totalChapters={preview.preview.toc.length}
                  bookSlug={slug}
                  premium={premium}
                  onPreviousChapter={selectedChapterIndex > 0 ? () => handleChapterChange(selectedChapterIndex - 1) : undefined}
                  onNextChapter={selectedChapterIndex < visibleSections.length - 1 ? () => handleChapterChange(selectedChapterIndex + 1) : undefined}
                />

                {/* ── WANT TO READ MORE? UPGRADE CARD ───────────────────────────────── */}
                {!premium && visibleSections.length > 0 && (
                  <Card className="mt-8 max-w-3xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-background">
                    <CardContent className="p-8 text-center">
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        Want to read the rest?
                      </h3>
                      <p className="text-lg text-muted-foreground mb-6">
                        Get instant access to all {chapterTargetCount} chapters plus downloads
                      </p>
                      <div className="flex flex-wrap justify-center gap-4 mb-6">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-5 text-emerald-600" />
                          <span>Full book access</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Upload className="size-5 text-emerald-600" />
                          <span>PDF & EPUB downloads</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-5 text-emerald-600" />
                          <span>Cover customization</span>
                        </div>
                      </div>
                      <Button
                        size="lg"
                        className="h-14 px-8 text-base font-semibold"
                        onClick={() => openUpgrade("full_unlock")}
                      >
                        <Sparkles className="mr-2 size-5" />
                        Unlock Full Book · $4
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Loader2 className="mx-auto mb-4 size-8 animate-spin text-primary" />
                  <div className="text-sm font-semibold text-foreground">Writing your book...</div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    First chapter will appear here automatically. Usually takes 1-2 minutes.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Page updates automatically when ready.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── EDITABLE BOOK DETAILS ─────────────────────────────────────────────── */}
          <EditableBookDetails
            slug={slug}
            title={preview.book.title}
            subtitle={preview.book.subtitle}
            author={preview.book.author}
            publisher={preview.book.publisher}
            authorBio={preview.book.author_bio}
            coverBrief={preview.book.cover_brief}
            onUpdate={hydrate}
          />


          {/* PDF & EPUB Preview Section - Premium Feature */}
          <div className="bg-slate-50 dark:bg-slate-900 -mx-4 md:-mx-6 px-4 md:px-6 py-12 rounded-3xl">
            <div className="max-w-6xl mx-auto">
              <div className="grid gap-8 lg:grid-cols-2">
                {/* PDF Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="size-5 text-primary" />
                      PDF Preview
                      <span className="ml-auto text-xs text-muted-foreground">
                        {premium ? "Ready to download" : "Unlock to preview"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {!premium ? (
                      <div className="text-center py-12">
                        <Lock className="mx-auto size-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-semibold text-foreground mb-2">
                          Unlock to preview PDF
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Preview your PDF before downloading
                        </p>
                        <Button
                          size="lg"
                          onClick={() => openUpgrade("pdf")}
                        >
                          <Sparkles className="mr-2 size-4" />
                          Unlock to Preview · $4
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6">
                          <p className="text-sm text-muted-foreground mb-3">
                            First page of your PDF
                          </p>
                          <div className="bg-white dark:bg-slate-950 rounded shadow-lg aspect-[8.5/11] p-8 overflow-hidden">
                            <div className="text-center mb-6">
                              <p className="text-sm font-bold text-foreground">
                                {preview.book.title}
                              </p>
                              {preview.book.subtitle && (
                                <p className="text-xs text-muted-foreground italic mt-1">
                                  {preview.book.subtitle}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                by {authorName}
                              </p>
                            </div>
                            <hr className="my-4" />
                            {visibleSections[0]?.content && (
                              <div className="text-xs leading-relaxed text-foreground line-clamp-6">
                                {visibleSections[0].content.substring(0, 800)}...
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={handleGeneratePdf}
                          disabled={isGeneratingPdf}
                        >
                          <Upload className="mr-2 size-5" />
                          {isGeneratingPdf ? "Generating..." : "Download PDF"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* EPUB Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="size-5 text-primary" />
                      EPUB Preview
                      <span className="ml-auto text-xs text-muted-foreground">
                        {premium ? "Ready to download" : "Unlock to preview"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {!premium ? (
                      <div className="text-center py-12">
                        <Lock className="mx-auto size-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-semibold text-foreground mb-2">
                          Unlock to preview EPUB
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Preview your EPUB before downloading
                        </p>
                        <Button
                          size="lg"
                          onClick={() => openUpgrade("epub")}
                        >
                          <Sparkles className="mr-2 size-4" />
                          Unlock to Preview · $4
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6">
                          <p className="text-sm text-muted-foreground mb-3">
                            First page of your EPUB
                          </p>
                          <div className="bg-white dark:bg-slate-950 rounded shadow-lg aspect-[8.5/11] p-8 overflow-hidden">
                            <div className="text-center mb-6">
                              <p className="text-sm font-bold text-foreground">
                                {preview.book.title}
                              </p>
                              {preview.book.subtitle && (
                                <p className="text-xs text-muted-foreground italic mt-1">
                                  {preview.book.subtitle}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                by {authorName}
                              </p>
                            </div>
                            <hr className="my-4" />
                            {visibleSections[0]?.content && (
                              <div className="text-xs leading-relaxed text-foreground line-clamp-6">
                                {visibleSections[0].content.substring(0, 800)}...
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={handleGenerateEpub}
                          disabled={isGeneratingEpub}
                        >
                          <Upload className="mr-2 size-5" />
                          {isGeneratingEpub ? "Generating..." : "Download EPUB"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Cover Customization Section - Premium Only */}
          {premium && (
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImagePlus className="size-5 text-primary" />
                    Customize Covers
                    <span className="ml-auto text-xs text-muted-foreground">
                      Limits: 1 front + 1 back
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Current Covers Display */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Front Cover */}
                    <div>
                      <div className="text-xs font-semibold text-foreground mb-2">
                        Front Cover
                      </div>
                      <div className="aspect-[3/4] relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                        {coverUrl ? (
                          <Image
                            src={coverUrl}
                            alt={`${preview.book.title} front cover`}
                            width={300}
                            height={400}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <BookOpen className="size-8" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Back Cover */}
                    <div>
                      <div className="text-xs font-semibold text-foreground mb-2">
                        Back Cover
                      </div>
                      <div className="aspect-[3/4] relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                        {backCoverUrl ? (
                          <Image
                            src={backCoverUrl}
                            alt={`${preview.book.title} back cover`}
                            width={300}
                            height={400}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <BookOpen className="size-8" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Upload Buttons */}
                  <div className="space-y-3">
                    <input
                      ref={frontCoverInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleFrontCoverUpload}
                    />
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      disabled={isUploadingCover || regenerationCount.cover_front >= 1}
                      onClick={() => frontCoverInputRef.current?.click()}
                    >
                      <ImagePlus className="mr-2 size-5" />
                      {regenerationCount.cover_front >= 1 ? "Limit reached" : "Upload New Front Cover"}
                      {isUploadingCover && <Loader2 className="ml-auto size-5 animate-spin" />}
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
                      size="lg"
                      className="w-full"
                      disabled={isUploadingCover || regenerationCount.cover_back >= 1}
                      onClick={() => backCoverInputRef.current?.click()}
                    >
                      <ImagePlus className="mr-2 size-5" />
                      {regenerationCount.cover_back >= 1 ? "Limit reached" : "Upload New Back Cover"}
                      {isUploadingCover && <Loader2 className="ml-auto size-5 animate-spin" />}
                    </Button>
                  </div>

                  {/* Limits Info */}
                  <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <div className="text-xs font-semibold text-foreground mb-2">
                      Upload Limits
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Front cover:</span>
                        <span className="font-medium">
                          {regenerationCount.cover_front}/1
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Back cover:</span>
                        <span className="font-medium">
                          {regenerationCount.cover_back}/1
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ── SIDEBAR: Chapter List + Progress ──────────────────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          {/* Compact Progress Card */}
          <CompactProgressCard
            coverReady={generation.cover_ready ?? false}
            previewReady={generation.preview_ready ?? false}
            chapterReadyCount={chapterReadyCount}
            chapterTargetCount={chapterTargetCount}
            remainingChapterCount={remainingChapterCount}
            generationEta={generationEta}
            generationActive={generation.active ?? false}
          />

          {/* Chapter List Sidebar - ALL CHAPTERS */}
          <ChapterListSidebar
            chapters={preview.preview.toc.map((chapter, index) => ({
              number: chapter.number,
              title: chapter.title,
              status: index < visibleSections.length ? "complete" :
                       index < visibleSections.length + preview.preview.locked_sections.length ? "locked" :
                       "pending",
              wordCount: visibleSections[index]?.content?.split(/\s+/).length,
            }))}
            selectedChapterIndex={selectedChapterIndex}
            onSelectChapter={handleChapterChange}
            bookSlug={slug}
            premium={premium}
            visibleSectionCount={visibleSections.length}
            lockedSectionCount={preview.preview.locked_sections.length}
          />
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
