"use client";

import Image from "next/image";
import {
  BookOpen,
  CheckCircle2,
  Download,
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
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

// Scroll depth tracking
const SCROLL_DEPTHS = [25, 50, 75, 100] as const;
const EXPORT_STALE_TOLERANCE_MS = 45_000;
import {
  buildAssetUrl,
  buildBookAssetUrl,
  isBackendUnavailableError,
  loadBook,
  loadBookPreview,
  loadBooks,
  startBookFullPipeline,
  startBookPreviewPipeline,
  uploadBookAsset,
  buildBook,
  preflightBook,
  type Book,
  type BookPreview,
  type BookPreviewSection,
  type BookStatus,
  type Artifact,
} from "@/lib/dashboard-api";
import { formatEta } from "@/lib/utils";
import { loadFunnelDraft } from "@/lib/funnel-draft";
import { getSession, hasPremiumAccess, syncPreviewAuthState } from "@/lib/preview-auth";

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

const TURKISH_CHARS_REGEX = /[çğıöşüÇĞİÖŞÜ]/;
const TURKISH_WORDS_REGEX =
  /\b(kitap|bölüm|bolum|önizleme|onizleme|kapak|hazır|hazir|oluştur|olustur|yazılıyor|yaziliyor|bekleyin|devam|tamam|kilitli|yükleniyor|yukleniyor|işleniyor|isleniyor|dakika|saniye)\b/i;

function looksTurkishCopy(value: string) {
  const normalized = value.trim();
  if (!normalized) return false;
  return TURKISH_CHARS_REGEX.test(normalized) || TURKISH_WORDS_REGEX.test(normalized);
}

function preferEnglishCopy(raw: string | null | undefined, fallback: string) {
  const normalized = String(raw || "").trim();
  if (!normalized) return fallback;
  return looksTurkishCopy(normalized) ? fallback : normalized;
}

function humanizeStageCode(code: string) {
  return code
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

type PreviewExportItem = {
  id: string;
  format: "pdf" | "epub";
  url: string;
  date: string;
  name?: string;
  relativePath?: string;
};

function detectExportFormat(pathLike: string) {
  const lowered = pathLike.toLowerCase();
  if (lowered.endsWith(".pdf")) return "pdf" as const;
  if (lowered.endsWith(".epub")) return "epub" as const;
  return null;
}

function toPreviewExportItem(artifact: Artifact): PreviewExportItem | null {
  const format = detectExportFormat(
    String(artifact.relative_path || artifact.name || artifact.url || "").trim(),
  );
  if (!format) return null;
  const url = buildAssetUrl(String(artifact.url || "").trim());
  if (url === "#") return null;
  const rawDate = String(artifact.modified || "").trim();
  const date = Number.isFinite(Date.parse(rawDate)) ? rawDate : new Date().toISOString();
  const relativePath = String(artifact.relative_path || "").trim();
  return {
    id: relativePath || `${format}-${date}`,
    format,
    url,
    date,
    name: String(artifact.name || "").trim() || undefined,
    relativePath: relativePath || undefined,
  };
}

function sortPreviewExports(items: PreviewExportItem[]) {
  return [...items].sort((left, right) => {
    const leftTime = Number.isFinite(Date.parse(left.date)) ? Date.parse(left.date) : 0;
    const rightTime = Number.isFinite(Date.parse(right.date)) ? Date.parse(right.date) : 0;
    return rightTime - leftTime;
  });
}

function mergePreviewExports(current: PreviewExportItem[], incoming: PreviewExportItem[]) {
  const byKey = new Map<string, PreviewExportItem>();
  for (const item of [...incoming, ...current]) {
    const key = `${item.format}:${item.url}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }
    const existingTime = Number.isFinite(Date.parse(existing.date)) ? Date.parse(existing.date) : 0;
    const nextTime = Number.isFinite(Date.parse(item.date)) ? Date.parse(item.date) : 0;
    if (nextTime >= existingTime) {
      byKey.set(key, item);
    }
  }
  return sortPreviewExports(Array.from(byKey.values())).slice(0, 10);
}

type BuildPreflightState = {
  ok: boolean;
  loading: boolean;
  reason: string;
  missing: string[];
  warnings: string[];
  checkedAt: number;
};

function emptyBuildPreflight(): BuildPreflightState {
  return {
    ok: true,
    loading: false,
    reason: "",
    missing: [],
    warnings: [],
    checkedAt: 0,
  };
}

function normalizeBuildPreflight(raw: Record<string, unknown> | null | undefined): BuildPreflightState {
  const missing = Array.isArray(raw?.missing)
    ? raw!.missing.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const warnings = Array.isArray(raw?.warnings)
    ? raw!.warnings.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const reason = String(raw?.reason || "").trim();
  return {
    ok: Boolean(raw?.ok) && missing.length === 0,
    loading: false,
    reason,
    missing,
    warnings,
    checkedAt: Date.now(),
  };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function BookPreviewScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [preview, setPreview] = useState<BookPreview | null>(null);
  const [planHasPremiumAccess, setPlanHasPremiumAccess] = useState(() => hasPremiumAccess());
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [transientBackendIssue, setTransientBackendIssue] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<"toc" | "details" | "actions">("toc");
  const [fullBookSections, setFullBookSections] = useState<BookPreviewSection[] | null>(null);
  const [isFullBookLoading, setIsFullBookLoading] = useState(false);
  const [fullBookLoadError, setFullBookLoadError] = useState("");
  const [isRetryingPreview, setIsRetryingPreview] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingEpub, setIsGeneratingEpub] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [exports, setExports] = useState<PreviewExportItem[]>([]);
  const [buildPreflight, setBuildPreflight] = useState<{ pdf: BuildPreflightState; epub: BuildPreflightState }>({
    pdf: emptyBuildPreflight(),
    epub: emptyBuildPreflight(),
  });
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
  const fullBookSyncInFlightRef = useRef(false);
  const lastFullBookSyncAtRef = useRef(0);
  const preflightInFlightRef = useRef(false);
  const lastPreflightRefreshAtRef = useRef(0);

  useEffect(() => {
    void syncPreviewAuthState()
      .then((payload) => {
        setPlanHasPremiumAccess(hasPremiumAccess(payload?.planId));
      })
      .catch(() => {
        setPlanHasPremiumAccess(hasPremiumAccess());
      });
  }, []);

  // // Update auth state after successful Stripe payment
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      void syncPreviewAuthState()
        .then((payload) => {
          setPlanHasPremiumAccess(hasPremiumAccess(payload?.planId));
        })
        .catch(() => {
          setPlanHasPremiumAccess(hasPremiumAccess());
        });
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
    lastPreflightRefreshAtRef.current = 0;
    setBuildPreflight({ pdf: emptyBuildPreflight(), epub: emptyBuildPreflight() });
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
    const coverState = String(generation.cover_state || "").trim().toLowerCase();
    const firstChapterState = String(generation.first_chapter_state || "").trim().toLowerCase();
    const pipelineAlreadyRunning =
      Boolean(generation.active) ||
      coverState === "queued" ||
      coverState === "running" ||
      firstChapterState === "queued" ||
      firstChapterState === "running" ||
      firstChapterState === "waiting";
    if (pipelineAlreadyRunning) return;
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
    if (!preview) return;
    const canAttemptFullBootstrap = Boolean(
      preview.entitlements?.can_view_full_book || planHasPremiumAccess,
    );
    if (!canAttemptFullBootstrap) return;
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
  }, [hydrate, planHasPremiumAccess, preview, slug]);

  useEffect(() => {
    if (!preview || !planHasPremiumAccess) {
      setFullBookSections(null);
      setFullBookLoadError("");
      return;
    }
    const hasLockedPreviewSections = preview.preview.toc.length > preview.preview.visible_sections.length;
    const needsChapterSync = hasLockedPreviewSections && !fullBookSections?.length;
    const needsExportSync = exports.length === 0;
    if (!needsChapterSync && !needsExportSync) return;
    if (fullBookSyncInFlightRef.current) return;
    const now = Date.now();
    if (now - lastFullBookSyncAtRef.current < 12_000) return;
    lastFullBookSyncAtRef.current = now;
    fullBookSyncInFlightRef.current = true;
    if (needsChapterSync) {
      setIsFullBookLoading(true);
      setFullBookLoadError("");
    }
    void loadBook(slug)
      .then((bookPayload) => {
        const normalizedExports = (bookPayload.resources?.exports || [])
          .map(toPreviewExportItem)
          .filter((item): item is PreviewExportItem => Boolean(item));
        if (normalizedExports.length) {
          setExports((current) => mergePreviewExports(current, normalizedExports));
        }

        if (needsChapterSync) {
          const normalizedSections = (bookPayload.chapters || [])
            .map((chapter, index) => {
              const title =
                String(chapter.title || "").trim() ||
                String(preview.preview.toc[index]?.title || `Chapter ${index + 1}`).trim();
              const content = String(chapter.content || "").trim();
              if (!title || !content) return null;
              return {
                number: chapter.number || index + 1,
                title,
                content,
                partial: false,
                word_count: content.split(/\s+/).filter(Boolean).length,
              } as BookPreviewSection;
            })
            .filter((item): item is BookPreviewSection => item !== null);
          if (normalizedSections.length) {
            setFullBookSections(normalizedSections);
            setFullBookLoadError("");
          } else {
            setFullBookLoadError("Full chapters are not ready yet. We will keep checking automatically.");
          }
        }
      })
      .catch((error) => {
        if (!isBackendUnavailableError(error)) {
          console.error(error);
        }
        if (needsChapterSync) {
          setFullBookLoadError("Full chapter sync is delayed. Keep this page open, it will auto-refresh.");
        }
      })
      .finally(() => {
        if (needsChapterSync) {
          setIsFullBookLoading(false);
        }
        fullBookSyncInFlightRef.current = false;
      });
  }, [exports.length, fullBookSections?.length, planHasPremiumAccess, preview, slug]);

  const handleRetryPreviewPipeline = useCallback(async () => {
    setIsRetryingPreview(true);
    try {
      await startBookPreviewPipeline(slug);
      await hydrate({ includeBooks: true });
    } catch (error) {
      if (!isBackendUnavailableError(error)) {
        console.error(error);
      }
    } finally {
      setIsRetryingPreview(false);
    }
  }, [hydrate, slug]);

  const refreshBuildPreflight = useCallback(async (force = false) => {
    if (!hasPremiumAccess() && !planHasPremiumAccess) return;
    if (preflightInFlightRef.current) return;
    const now = Date.now();
    if (!force && now - lastPreflightRefreshAtRef.current < 12_000) return;
    lastPreflightRefreshAtRef.current = now;
    preflightInFlightRef.current = true;
    setBuildPreflight((current) => ({
      pdf: { ...current.pdf, loading: true },
      epub: { ...current.epub, loading: true },
    }));
    try {
      const [pdfResult, epubResult] = await Promise.all([
        preflightBook(slug, { action: "build", format: "pdf" }),
        preflightBook(slug, { action: "build", format: "epub" }),
      ]);
      setBuildPreflight({
        pdf: normalizeBuildPreflight(pdfResult),
        epub: normalizeBuildPreflight(epubResult),
      });
    } catch (error) {
      if (!isBackendUnavailableError(error)) {
        console.error(error);
      }
      setBuildPreflight((current) => ({
        pdf: { ...current.pdf, loading: false },
        epub: { ...current.epub, loading: false },
      }));
    } finally {
      preflightInFlightRef.current = false;
    }
  }, [planHasPremiumAccess, slug]);

  useEffect(() => {
    if (!preview) return;
    const premiumUnlocked = Boolean(preview.entitlements?.can_view_full_book || planHasPremiumAccess);
    if (!premiumUnlocked) return;
    void refreshBuildPreflight();
  }, [planHasPremiumAccess, preview, refreshBuildPreflight]);

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
      ? 12_000
      : generation.preview_ready
        ? fullStage === "queued" || fullStage === "running"
          ? 8_000
          : 10_000
        : 6_000;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void hydrate();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [hydrate, preview, transientBackendIssue]);

  useEffect(() => {
    if (!preview?.generation?.activity_timeline?.length) return;
    trackEvent("preview_timeline_opened", { slug, count: preview.generation.activity_timeline.length });
  }, [preview?.generation?.activity_timeline?.length, slug]);

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

  const backendPremium = Boolean(preview.entitlements?.can_view_full_book);
  const premium = backendPremium || planHasPremiumAccess;
  const generation = preview.generation || EMPTY_GENERATION;
  const previewUpdatedAtMs = generation.updated_at ? Date.parse(generation.updated_at) : NaN;
  const generationUpdateAgeSeconds = Number.isFinite(previewUpdatedAtMs)
    ? Math.max(0, Math.round((Date.now() - previewUpdatedAtMs) / 1000))
    : 0;
  const generationAppearsStuck = Boolean(
    generation.active &&
    generationUpdateAgeSeconds >= 75 &&
    !generation.product_ready,
  );
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
  const coverEta = formatEta(generation.cover_eta_seconds);
  const firstChapterEta = formatEta(generation.first_chapter_eta_seconds);
  const ratio = Math.round((preview.preview.ratio || 0.2) * 100);
  const hasSession = Boolean(getSession());
  const authorName = preview.book.author || draftMeta?.authorName || "Book Creator";
  const imprint = preview.book.publisher || draftMeta?.imprint || "Book Generator";
  const authorBio = preview.book.author_bio || draftMeta?.authorBio || "";
  const coverBrief = preview.book.cover_brief || draftMeta?.coverBrief || "";
  const coverVariants = preview.coverLab?.variants || [];
  const selectedCoverVariant =
    coverVariants.find((variant) => variant.id === preview.coverLab?.selectedVariantId) ||
    coverVariants[0] ||
    null;
  const frontCoverPath = String(preview.book.cover_image || selectedCoverVariant?.front_image || "").trim();
  const backCoverPath = String(preview.book.back_cover_image || selectedCoverVariant?.back_image || "").trim();
  const coverUrl = frontCoverPath ? buildBookAssetUrl(slug, frontCoverPath) : "";
  const backCoverUrl = backCoverPath ? buildBookAssetUrl(slug, backCoverPath) : "";
  const frontCoverSource = String(preview.book.front_cover_source || "").trim().toLowerCase();
  const backCoverSource = String(preview.book.back_cover_source || "").trim().toLowerCase();
  const manualCoverLocked = frontCoverSource === "manual" || backCoverSource === "manual";
  const defaultCurrentStepLabel = generation.product_ready
    ? "Your preview is ready."
    : !generation.cover_ready
      ? "Creating your real book cover"
      : !generation.preview_ready
        ? "Writing the first readable chapter"
        : fullGeneration?.complete
          ? "Your book is ready."
          : "Remaining chapters continue in the background";
  const defaultPreviewStages: Array<{
    code: string;
    label: string;
    status: "done" | "active" | "queued" | "waiting" | "error";
    detail?: string;
  }> = [
    {
      code: "cover",
      label: "Cover",
      status: generation.cover_ready ? "done" : generation.cover_state === "error" ? "error" : "active",
      detail: generation.cover_ready ? "Real cover ready" : "Creating your real book cover",
    },
    {
      code: "first_chapter",
      label: "First chapter",
      status: generation.preview_ready ? "done" : generation.first_chapter_state === "error" ? "error" : generation.cover_ready ? "active" : "queued",
      detail: generation.preview_ready ? "First readable chapter ready" : "Writing the first readable chapter",
    },
    {
      code: "full_book",
      label: "Full book",
      status: fullGeneration?.complete ? "done" : fullGeneration?.stage === "waiting" ? "waiting" : generation.active ? "active" : "queued",
      detail: preferEnglishCopy(fullGeneration?.message, "Remaining chapters continue in the background"),
    },
  ];
  const previewStages: Array<{
    code: string;
    label: string;
    status: "done" | "active" | "queued" | "waiting" | "error";
    detail?: string;
  }> = Array.isArray(generation.activity_timeline) && generation.activity_timeline.length
    ? generation.activity_timeline.slice(0, 3).map((stage) => {
        const stageCode = String(stage.code || "").trim().toLowerCase();
        const fallbackStage = defaultPreviewStages.find((item) => item.code === stageCode);
        const fallbackLabel = fallbackStage?.label || (stageCode ? humanizeStageCode(stageCode) : "Progress");
        const fallbackDetail = fallbackStage?.detail || "Live updates";
        return {
          code: stageCode || "progress",
          label: fallbackLabel,
          status: stage.status || "queued",
          detail: preferEnglishCopy(stage.detail || stage.label, fallbackDetail),
        };
      })
    : defaultPreviewStages;
  const currentStepLabel = preferEnglishCopy(
    generation.current_step_label || generation.message,
    defaultCurrentStepLabel,
  );
  const activityFeed = Array.isArray(generation.activity_log)
    ? generation.activity_log.slice(-6).reverse()
    : [];
  const heroKicker = generation.cover_ready
    ? generation.preview_ready
      ? "Cover and first pages are live"
      : "Cover is live"
    : "Premium preview in production";

  const pageSubtitle = premium
    ? "Full access active. Book, cover, and export surface are unlocked."
      : generation.product_ready
      ? `Book ready - first ${ratio}% readable preview is open.`
      : generation.preview_ready
        ? "First chapter is ready. Remaining chapters keep writing in the background."
        : generation.active
          ? currentStepLabel
          : "Your book showcase is being prepared.";

  const visibleSections = preview.preview.visible_sections;
  const tocSections = preview.preview.toc;
  const totalChapters = tocSections.length;
  const chapterSections = premium && fullBookSections?.length ? fullBookSections : visibleSections;
  const effectiveVisibleSectionCount = premium ? totalChapters : chapterSections.length;
  const effectiveLockedSectionCount = premium ? 0 : preview.preview.locked_sections.length;
  const boundedSelectedChapterIndex = totalChapters
    ? Math.min(selectedChapterIndex, totalChapters - 1)
    : 0;
  const chapterFromSections = chapterSections[boundedSelectedChapterIndex] || null;
  const chapterFromToc = tocSections[boundedSelectedChapterIndex];
  const activeChapter = chapterFromSections || (
    chapterFromToc
      ? ({
          number: chapterFromToc.number,
          title: chapterFromToc.title,
          content: "",
          partial: false,
          word_count: 0,
        } satisfies BookPreviewSection)
      : chapterSections[0] || null
  );
  const activeChapterIndex = activeChapter ? boundedSelectedChapterIndex : 0;
  const sortedExports = sortPreviewExports(exports);
  const latestPdfExport = sortedExports.find((item) => item.format === "pdf") || null;
  const latestEpubExport = sortedExports.find((item) => item.format === "epub") || null;
  const pdfPreflight = buildPreflight.pdf;
  const epubPreflight = buildPreflight.epub;
  const pdfPreflightReason =
    pdfPreflight.missing[0] ||
    pdfPreflight.reason ||
    pdfPreflight.warnings[0] ||
    "";
  const epubPreflightReason =
    epubPreflight.missing[0] ||
    epubPreflight.reason ||
    epubPreflight.warnings[0] ||
    "";
  const latestPdfExportStale = Boolean(
    latestPdfExport &&
    Number.isFinite(previewUpdatedAtMs) &&
    Date.parse(latestPdfExport.date) < previewUpdatedAtMs - EXPORT_STALE_TOLERANCE_MS,
  );
  const latestEpubExportStale = Boolean(
    latestEpubExport &&
    Number.isFinite(previewUpdatedAtMs) &&
    Date.parse(latestEpubExport.date) < previewUpdatedAtMs - EXPORT_STALE_TOLERANCE_MS,
  );
  const writingChapterNumber = Number(fullGeneration?.current_chapter || 0);
  const writingChapterIndex =
    writingChapterNumber > 0
      ? Math.max(0, Math.min(totalChapters - 1, writingChapterNumber - 1))
      : Math.max(0, Math.min(totalChapters - 1, chapterReadyCount));
  const writingChapterLabel = generation.active && totalChapters
    ? `Chapter ${writingChapterIndex + 1} is being written now.`
    : "";
  const rawEtaSeconds = Number(fullGeneration?.eta_seconds || 0);
  const estimatedMinutesRemaining = rawEtaSeconds > 0
    ? Math.max(1, Math.ceil(rawEtaSeconds / 60))
    : !generation.active
      ? 0
      : remainingChapterCount > 0
        ? Math.max(1, remainingChapterCount * 2)
        : 1;
  const estimatedTimeLabel = estimatedMinutesRemaining > 0 ? `~${estimatedMinutesRemaining} min left` : "";
  const livePreviewSection = chapterSections.find((section) => String(section.content || "").trim().length > 0) || chapterSections[0] || null;
  const livePreviewExcerpt = String(livePreviewSection?.content || "").trim().slice(0, 900);
  const canInstantPdfDownload = Boolean(latestPdfExport && !latestPdfExportStale);
  const canInstantEpubDownload = Boolean(latestEpubExport && !latestEpubExportStale);
  const latestPdfExportLabel = latestPdfExport
    ? new Date(latestPdfExport.date).toLocaleString()
    : "";
  const latestEpubExportLabel = latestEpubExport
    ? new Date(latestEpubExport.date).toLocaleString()
    : "";
  const previewReadyEmailHint = hasSession
    ? "We keep auto-refreshing this page and notify your account email when background generation completes."
    : "Create an account if you want a ready email when generation completes.";
  const chapterSidebarItems = preview.preview.toc.map((chapter, index) => {
    const isLockedForPreview = !premium && index >= visibleSections.length;
    const status: "complete" | "writing" | "pending" | "locked" =
      isLockedForPreview
        ? "locked"
        : index < chapterReadyCount
          ? "complete"
          : generation.active && index === writingChapterIndex
            ? "writing"
            : "pending";
    return {
      number: chapter.number,
      title: chapter.title,
      status,
      wordCount: chapterSections[index]?.content?.split(/\s+/).filter(Boolean).length,
    };
  });

  function openUpgrade(trigger: "pdf" | "epub" | "full_unlock") {
    if (trigger === "pdf") trackEvent("paywall_pdf_clicked", { slug });
    if (trigger === "epub") trackEvent("paywall_epub_clicked", { slug });
    if (trigger === "full_unlock") trackEvent("paywall_full_unlock_clicked", { slug });
    trackEvent("paywall_viewed", { slug, trigger });
    router.push(`/app/book/${encodeURIComponent(slug)}/upgrade`);
  }

  function openExistingExport(item: PreviewExportItem | null, format: "PDF" | "EPUB") {
    if (!item?.url) {
      toast.error(`Latest ${format} file is missing.`);
      return false;
    }
    window.open(item.url, "_blank");
    return true;
  }

  async function handlePdfPrimaryAction() {
    if (!premium) {
      openUpgrade("pdf");
      return;
    }
    if (canInstantPdfDownload && openExistingExport(latestPdfExport, "PDF")) {
      return;
    }
    await handleGeneratePdf();
  }

  async function handleEpubPrimaryAction() {
    if (!premium) {
      openUpgrade("epub");
      return;
    }
    if (canInstantEpubDownload && openExistingExport(latestEpubExport, "EPUB")) {
      return;
    }
    await handleGenerateEpub();
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
      const preflightResult = normalizeBuildPreflight(await preflightBook(slug, { action: "build", format: "pdf" }));
      setBuildPreflight((current) => ({ ...current, pdf: preflightResult }));
      if (!preflightResult.ok) {
        const reason =
          preflightResult.missing[0] ||
          preflightResult.reason ||
          "PDF export is not ready yet.";
        toast.error(reason);
        return;
      }

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
        front_cover_source: preview.book.front_cover_source,
        back_cover_source: preview.book.back_cover_source,
      });
      const buildOk = Boolean((response as { ok?: boolean }).ok);
      if (!buildOk) {
        const preflightRaw =
          (response as { preflight?: Record<string, unknown> }).preflight || null;
        if (preflightRaw) {
          setBuildPreflight((current) => ({
            ...current,
            pdf: normalizeBuildPreflight(preflightRaw),
          }));
        }
        const missing = Array.isArray(preflightRaw?.missing)
          ? preflightRaw!.missing.map((item) => String(item || "")).filter(Boolean)
          : [];
        const reason =
          missing[0] ||
          String((response as { output?: string }).output || "").trim() ||
          "PDF generation failed. Please complete required steps first.";
        toast.error(reason);
        return;
      }

      // Add to exports list and auto-open the download
      const newExport = {
        id: Date.now().toString(),
        format: "pdf" as const,
        url: buildAssetUrl((response as { export_url?: string }).export_url || ""),
        date: new Date().toISOString(),
      };
      if (newExport.url !== "#") {
        setExports((prev) => mergePreviewExports(prev, [newExport]));
        window.open(newExport.url, "_blank");
        toast.success("PDF ready — opening in new tab");
      } else {
        toast.error("PDF was generated but the download URL is missing.");
      }
      void refreshBuildPreflight(true);

      trackEvent("pdf_export_completed", { slug });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("PDF generation failed. Please try again.");
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
      const preflightResult = normalizeBuildPreflight(await preflightBook(slug, { action: "build", format: "epub" }));
      setBuildPreflight((current) => ({ ...current, epub: preflightResult }));
      if (!preflightResult.ok) {
        const reason =
          preflightResult.missing[0] ||
          preflightResult.reason ||
          "EPUB export is not ready yet.";
        toast.error(reason);
        return;
      }

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
        front_cover_source: preview.book.front_cover_source,
        back_cover_source: preview.book.back_cover_source,
      });
      const buildOk = Boolean((response as { ok?: boolean }).ok);
      if (!buildOk) {
        const preflightRaw =
          (response as { preflight?: Record<string, unknown> }).preflight || null;
        if (preflightRaw) {
          setBuildPreflight((current) => ({
            ...current,
            epub: normalizeBuildPreflight(preflightRaw),
          }));
        }
        const missing = Array.isArray(preflightRaw?.missing)
          ? preflightRaw!.missing.map((item) => String(item || "")).filter(Boolean)
          : [];
        const reason =
          missing[0] ||
          String((response as { output?: string }).output || "").trim() ||
          "EPUB generation failed. Please complete required steps first.";
        toast.error(reason);
        return;
      }

      // Add to exports list and auto-open the download
      const newExport = {
        id: Date.now().toString(),
        format: "epub" as const,
        url: buildAssetUrl((response as { export_url?: string }).export_url || ""),
        date: new Date().toISOString(),
      };
      if (newExport.url !== "#") {
        setExports((prev) => mergePreviewExports(prev, [newExport]));
        window.open(newExport.url, "_blank");
        toast.success("EPUB ready — opening in new tab");
      } else {
        toast.error("EPUB was generated but the download URL is missing.");
      }
      void refreshBuildPreflight(true);

      trackEvent("epub_export_completed", { slug });
    } catch (error) {
      console.error("EPUB generation failed:", error);
      toast.error("EPUB generation failed. Please try again.");
    } finally {
      setIsGeneratingEpub(false);
    }
  }

  async function handleFrontCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed (PNG, JPG, WebP).");
      return;
    }

    // Validate file size (4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.error("File size must be under 4MB.");
      return;
    }

    setIsUploadingCover(true);
    try {
      await uploadBookAsset(slug, file, "cover_image");

      // Refresh preview
      await hydrate();
      void refreshBuildPreflight(true);
      toast.success("Front cover uploaded.");

      trackEvent("preview_custom_front_cover_uploaded", { slug });
    } catch (error) {
      console.error("Front cover upload failed:", error);
      toast.error("Front cover upload failed. Please try again.");
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
      toast.error("Only image files are allowed (PNG, JPG, WebP).");
      return;
    }

    // Validate file size (4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.error("File size must be under 4MB.");
      return;
    }

    setIsUploadingCover(true);
    try {
      await uploadBookAsset(slug, file, "back_cover_image");

      // Refresh preview
      await hydrate();
      void refreshBuildPreflight(true);
      toast.success("Back cover uploaded.");

      // trackEvent("cover_back_uploaded", { slug }); // TODO: Add to analytics type
    } catch (error) {
      console.error("Back cover upload failed:", error);
      toast.error("Back cover upload failed. Please try again.");
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

      {planHasPremiumAccess && !backendPremium && (
        <Card className="mb-4 border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
            <p className="text-sm leading-6 text-amber-900 dark:text-amber-200">
              Premium plan detected, but this preview is not fully unlocked yet. We are syncing access now.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => void hydrate({ includeBooks: true })}
            >
              Refresh access
            </Button>
          </CardContent>
        </Card>
      )}

      {generationAppearsStuck && (
        <Card className="mb-4 border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
            <p className="text-sm leading-6 text-amber-900 dark:text-amber-200">
              Generation looks delayed (no status change for {generationUpdateAgeSeconds}s). You can retry now.
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9"
                onClick={() => void hydrate({ includeBooks: true })}
              >
                Refresh
              </Button>
              <Button
                size="sm"
                className="h-9"
                onClick={() => void handleRetryPreviewPipeline()}
                disabled={isRetryingPreview}
              >
                {isRetryingPreview ? "Retrying..." : "Retry pipeline"}
              </Button>
            </div>
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
                <p className="text-sm font-medium text-foreground truncate">
                  {preferEnglishCopy(generation.message, currentStepLabel || "Creating your book...")}
                </p>
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
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d8bfac]/70 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7f5a46]">
                {generation.cover_ready ? <CheckCircle2 className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}
                {heroKicker}
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-50 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {preview.book.title}
                    </h1>
                    {preview.book.subtitle && (
                      <p className="mt-3 max-w-3xl text-base md:text-lg text-slate-600 dark:text-slate-400 italic" style={{ fontFamily: "'Source Serif Pro', serif" }}>
                        {preview.book.subtitle}
                      </p>
                    )}
                    <p className="mt-3 text-xs md:text-sm text-slate-500 dark:text-slate-500">
                      by {authorName} · {imprint}
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/70 bg-white/75 p-5 shadow-[0_18px_40px_rgba(37,24,18,0.08)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b6a59]">Current production step</div>
                        <div className="mt-2 text-xl font-semibold text-[#2f1f17]">{currentStepLabel}</div>
                      </div>
                      <div className="rounded-full border border-[#eadbce] bg-[#fff8f2] px-4 py-2 text-sm font-semibold text-[#7f5a46]">
                        {generation.current_step_code === "cover" && coverEta ? `ETA ${coverEta}` : generation.current_step_code === "first_chapter" && firstChapterEta ? `ETA ${firstChapterEta}` : generationEta ? `ETA ${generationEta}` : "Live updates"}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {previewStages.map((stage) => (
                        <div key={stage.code} className="rounded-[18px] border border-[#eadbce] bg-[#fffaf6] px-4 py-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-[#2f1f17]">
                            {stage.status === "done" ? (
                              <CheckCircle2 className="size-4 text-emerald-600" />
                            ) : stage.status === "active" || stage.status === "waiting" ? (
                              <Loader2 className="size-4 animate-spin text-[#7f5a46]" />
                            ) : (
                              <div className="size-4 rounded-full border border-[#d8bfac]" />
                            )}
                            {stage.label}
                          </div>
                          {stage.detail ? (
                            <p className="mt-2 text-sm leading-6 text-[#6f5547]">{stage.detail}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-[18px] border border-[#eadbce] bg-[#fffaf6] px-4 py-3 text-sm leading-6 text-[#6f5547]">
                      <div className="font-semibold text-[#2f1f17]">
                        {estimatedTimeLabel || "Live ETA updates"}
                      </div>
                      {writingChapterLabel ? <div>{writingChapterLabel}</div> : null}
                      <div>{previewReadyEmailHint}</div>
                    </div>
                  </div>

                  {!hasSession ? (
                    <div className="rounded-[24px] border border-[#d8bfac]/70 bg-[linear-gradient(180deg,#fffaf4_0%,#fff7ef_100%)] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f5a46]">Don’t lose this preview</div>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f5547]">
                            You can keep reading as guest. Create a free account if you want this cover and preview to stay in your library.
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/signup?next=${encodeURIComponent(`/app/book/${slug}/preview`)}`}>
                            Create free account
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {activityFeed.length ? (
                    <div className="rounded-[24px] border border-[#eadbce] bg-white/80 p-5 shadow-[0_12px_30px_rgba(37,24,18,0.05)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b6a59]">Live activity</div>
                          <div className="mt-2 text-lg font-semibold text-[#2f1f17]">Pipeline log</div>
                        </div>
                        <div className="text-xs font-medium text-[#7f5a46]">Auto-refreshing</div>
                      </div>
                      <div className="mt-4 space-y-3">
                        {activityFeed.map((item) => (
                          <div key={`${item.code}-${item.timestamp || item.label}`} className="rounded-[18px] border border-[#f0e3d8] bg-[#fffaf6] px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-[#2f1f17]">
                                {preferEnglishCopy(item.label, humanizeStageCode(item.code))}
                              </div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b6a59]">
                                {item.status}
                              </div>
                            </div>
                            {item.detail ? (
                              <p className="mt-1 text-sm leading-6 text-[#6f5547]">{preferEnglishCopy(item.detail, item.detail)}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-center lg:justify-end">
                  <div className="w-full max-w-[300px] rounded-[28px] border border-white/70 bg-white/65 p-4 shadow-[0_24px_60px_rgba(37,24,18,0.08)]">
                    <div className="aspect-[3/4] overflow-hidden rounded-[22px] border border-[#eadbce] bg-[linear-gradient(180deg,#fffdf8_0%,#fff6ef_100%)] p-3">
                      {coverUrl ? (
                        <Image
                          src={coverUrl}
                          alt={`${preview.book.title} cover`}
                          width={360}
                          height={480}
                          unoptimized
                          className="h-full w-full rounded-[18px] object-contain"
                        />
                      ) : (
                        <div className="flex h-full flex-col justify-between rounded-[18px] border border-dashed border-[#d8bfac] bg-white/60 p-5">
                          <div className="space-y-3">
                            <div className="h-4 w-28 rounded-full bg-[#eadbce]" />
                            <div className="h-16 rounded-[18px] bg-[linear-gradient(135deg,rgba(47,31,23,0.12),rgba(207,77,122,0.14))]" />
                          </div>
                          <div className="space-y-3">
                            <div className="h-5 w-3/4 rounded-full bg-[#dcc5b4]" />
                            <div className="h-5 w-2/3 rounded-full bg-[#eadbce]" />
                            <div className="h-20 rounded-[18px] bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(216,191,172,0.18))]" />
                            <div className="h-4 w-32 rounded-full bg-[#eadbce]" />
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#6f5547]">
                      {coverUrl
                        ? "This is the exact cover now attached to your preview."
                        : "No mock cover is shown. This premium artboard stays here until the real cover is ready."}
                    </p>
                    {manualCoverLocked ? (
                      <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                        Manual cover lock is active. Your uploaded cover stays in preview and exports.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 md:gap-3">
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
                  onClick={() => void handlePdfPrimaryAction()}
                >
                  {isGeneratingPdf ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Download className="mr-2 size-5" />}
                  {isGeneratingPdf ? "Generating..." : canInstantPdfDownload ? "Open PDF" : "Download PDF"}
                  {!premium && !generation.preview_ready && <Lock className="absolute right-3 size-5" />}
                </Button>

                <Button
                  size="lg"
                  variant={premium ? "primary" : "outline"}
                  className="h-14 px-8 text-base font-semibold relative"
                  disabled={!premium && !generation.preview_ready}
                  onClick={() => void handleEpubPrimaryAction()}
                >
                  {isGeneratingEpub ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Download className="mr-2 size-5" />}
                  {isGeneratingEpub ? "Generating..." : canInstantEpubDownload ? "Open EPUB" : "Download EPUB"}
                  {!premium && !generation.preview_ready && <Lock className="absolute right-3 size-5" />}
                </Button>
              </div>
              {premium && (pdfPreflightReason || epubPreflightReason || pdfPreflight.loading || epubPreflight.loading) ? (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-900">
                  {pdfPreflight.loading || epubPreflight.loading ? (
                    <div>Checking export readiness…</div>
                  ) : (
                    <>
                      {pdfPreflightReason ? <div>PDF: {pdfPreflightReason}</div> : null}
                      {epubPreflightReason ? <div>EPUB: {epubPreflightReason}</div> : null}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* ── CHAPTER PREVIEW ─────────────────────────────────────────────────────── */}
          <div id="preview-content">
            {activeChapter ? (
              <>
                <ChapterPreviewCard
                  chapter={{
                    number: activeChapter.number,
                    title: activeChapter.title,
                    content: activeChapter.content,
                    partial: activeChapter.partial,
                    wordCount: activeChapter.word_count,
                  }}
                  chapterIndex={activeChapterIndex}
                  totalChapters={totalChapters}
                  bookSlug={slug}
                  premium={premium}
                  onPreviousChapter={activeChapterIndex > 0 ? () => handleChapterChange(activeChapterIndex - 1) : undefined}
                  onNextChapter={activeChapterIndex < totalChapters - 1 ? () => handleChapterChange(activeChapterIndex + 1) : undefined}
                />

                {premium && (isFullBookLoading || fullBookLoadError) && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <p className="text-sm text-foreground">
                        {isFullBookLoading
                          ? "Syncing full chapter content to this preview..."
                          : fullBookLoadError}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9"
                        onClick={() => void hydrate()}
                      >
                        Refresh now
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* ── WANT TO READ MORE? UPGRADE CARD ───────────────────────────────── */}
                {!premium && chapterSections.length > 0 && (
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
                  <div className="text-sm font-semibold text-foreground">{currentStepLabel}</div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    The first readable chapter will appear here automatically as soon as it is ready.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This page keeps refreshing in the background. You do not need to restart anything.
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
                        {latestPdfExportStale ? (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                            Latest PDF is older than current chapter/cover content. Regenerate to sync.
                          </div>
                        ) : null}
                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Live PDF composition preview
                          </p>
                          <div className="flex gap-4">
                            <div className="w-[108px] shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                              {coverUrl ? (
                                <Image
                                  src={coverUrl}
                                  alt={`${preview.book.title} live cover`}
                                  width={108}
                                  height={144}
                                  unoptimized
                                  className="h-[144px] w-full object-contain"
                                />
                              ) : (
                                <div className="flex h-[144px] items-center justify-center text-muted-foreground">
                                  <BookOpen className="size-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground">{preview.book.title}</p>
                              {preview.book.subtitle ? (
                                <p className="mt-1 text-xs italic text-muted-foreground">{preview.book.subtitle}</p>
                              ) : null}
                              <p className="mt-1 text-xs text-muted-foreground">by {authorName}</p>
                              {livePreviewSection?.title ? (
                                <p className="mt-3 text-xs font-semibold text-foreground">
                                  {livePreviewSection.title}
                                </p>
                              ) : null}
                              {livePreviewExcerpt ? (
                                <p className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-6">
                                  {livePreviewExcerpt}...
                                </p>
                              ) : (
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  Chapter content is still being written.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          {latestPdfExport ? (
                            <div>Latest PDF generated at {latestPdfExportLabel}.</div>
                          ) : (
                            <div>No PDF generated yet.</div>
                          )}
                          {pdfPreflightReason ? (
                            <div className="mt-1 text-amber-700 dark:text-amber-400">
                              Build check: {pdfPreflightReason}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="lg"
                            className="flex-1 min-w-[180px]"
                            onClick={() => void handlePdfPrimaryAction()}
                            disabled={isGeneratingPdf || pdfPreflight.loading}
                          >
                            {isGeneratingPdf ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Download className="mr-2 size-5" />}
                            {isGeneratingPdf
                              ? "Generating..."
                              : canInstantPdfDownload
                                ? "Open PDF"
                                : latestPdfExport
                                  ? "Regenerate PDF"
                                  : "Generate PDF"}
                          </Button>
                          {latestPdfExport ? (
                            <Button asChild size="lg" variant="outline" className="flex-1 min-w-[180px]">
                              <a href={latestPdfExport.url} target="_blank" rel="noreferrer">
                                Open Latest PDF
                              </a>
                            </Button>
                          ) : null}
                        </div>
                        {pdfPreflight.loading ? (
                          <div className="text-xs text-muted-foreground">Checking PDF export requirements...</div>
                        ) : null}
                        {manualCoverLocked ? (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                            Manual cover source is active. The same uploaded cover is used in PDF export.
                          </div>
                        ) : null}
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
                        {latestEpubExportStale ? (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                            Latest EPUB is older than current chapter/cover content. Regenerate to sync.
                          </div>
                        ) : null}
                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Live EPUB composition preview
                          </p>
                          <div className="flex gap-4">
                            <div className="w-[108px] shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                              {coverUrl ? (
                                <Image
                                  src={coverUrl}
                                  alt={`${preview.book.title} live cover`}
                                  width={108}
                                  height={144}
                                  unoptimized
                                  className="h-[144px] w-full object-contain"
                                />
                              ) : (
                                <div className="flex h-[144px] items-center justify-center text-muted-foreground">
                                  <BookOpen className="size-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground">{preview.book.title}</p>
                              {preview.book.subtitle ? (
                                <p className="mt-1 text-xs italic text-muted-foreground">{preview.book.subtitle}</p>
                              ) : null}
                              <p className="mt-1 text-xs text-muted-foreground">by {authorName}</p>
                              {livePreviewSection?.title ? (
                                <p className="mt-3 text-xs font-semibold text-foreground">
                                  {livePreviewSection.title}
                                </p>
                              ) : null}
                              {livePreviewExcerpt ? (
                                <p className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-6">
                                  {livePreviewExcerpt}...
                                </p>
                              ) : (
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                  Chapter content is still being written.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          {latestEpubExport ? (
                            <div>Latest EPUB generated at {latestEpubExportLabel}.</div>
                          ) : (
                            <div>No EPUB generated yet.</div>
                          )}
                          {epubPreflightReason ? (
                            <div className="mt-1 text-amber-700 dark:text-amber-400">
                              Build check: {epubPreflightReason}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="lg"
                            className="flex-1 min-w-[180px]"
                            onClick={() => void handleEpubPrimaryAction()}
                            disabled={isGeneratingEpub || epubPreflight.loading}
                          >
                            {isGeneratingEpub ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Download className="mr-2 size-5" />}
                            {isGeneratingEpub
                              ? "Generating..."
                              : canInstantEpubDownload
                                ? "Open EPUB"
                                : latestEpubExport
                                  ? "Regenerate EPUB"
                                  : "Generate EPUB"}
                          </Button>
                          {latestEpubExport ? (
                            <Button asChild size="lg" variant="outline" className="flex-1 min-w-[180px]">
                              <a href={latestEpubExport.url} target="_blank" rel="noreferrer">
                                Open Latest EPUB
                              </a>
                            </Button>
                          ) : null}
                        </div>
                        {epubPreflight.loading ? (
                          <div className="text-xs text-muted-foreground">Checking EPUB export requirements...</div>
                        ) : null}
                        {manualCoverLocked ? (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                            Manual cover source is active. The same uploaded cover is used in EPUB export.
                          </div>
                        ) : null}
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
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-foreground">
                          Front Cover
                        </div>
                        <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          {frontCoverSource || "variant"}
                        </span>
                      </div>
                      <div className="aspect-[3/4] relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                        {coverUrl ? (
                          <Image
                            src={coverUrl}
                            alt={`${preview.book.title} front cover`}
                            width={300}
                            height={400}
                            unoptimized
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <BookOpen className="size-8" />
                          </div>
                        )}
                      </div>
                      {coverUrl ? (
                        <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                          <a href={coverUrl} download>
                            <Download className="mr-2 size-4" />
                            Download Front Cover
                          </a>
                        </Button>
                      ) : null}
                    </div>

                    {/* Back Cover */}
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-foreground">
                          Back Cover
                        </div>
                        <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          {backCoverSource || "variant"}
                        </span>
                      </div>
                      <div className="aspect-[3/4] relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                        {backCoverUrl ? (
                          <Image
                            src={backCoverUrl}
                            alt={`${preview.book.title} back cover`}
                            width={300}
                            height={400}
                            unoptimized
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <BookOpen className="size-8" />
                          </div>
                        )}
                      </div>
                      {backCoverUrl ? (
                        <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                          <a href={backCoverUrl} download>
                            <Download className="mr-2 size-4" />
                            Download Back Cover
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {manualCoverLocked ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                      Manual cover lock is active. Uploaded cover files are preserved in preview, PDF, and EPUB.
                    </div>
                  ) : null}

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
                      disabled={isUploadingCover}
                      onClick={() => frontCoverInputRef.current?.click()}
                    >
                      <ImagePlus className="mr-2 size-5" />
                      Upload or Replace Front Cover
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
                      disabled={isUploadingCover}
                      onClick={() => backCoverInputRef.current?.click()}
                    >
                      <ImagePlus className="mr-2 size-5" />
                      Upload or Replace Back Cover
                      {isUploadingCover && <Loader2 className="ml-auto size-5 animate-spin" />}
                    </Button>
                  </div>

                  {/* Upload Info */}
                  <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <div className="text-xs font-semibold text-foreground mb-2">
                      Cover Upload
                    </div>
                    <div className="text-xs text-muted-foreground">
                      You can replace front/back covers any time. Max file size: 4MB per image.
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
            currentStepLabel={currentStepLabel}
            stages={previewStages}
          />

          {/* Chapter List Sidebar - ALL CHAPTERS */}
          <ChapterListSidebar
            chapters={chapterSidebarItems}
            selectedChapterIndex={activeChapterIndex}
            onSelectChapter={handleChapterChange}
            bookSlug={slug}
            premium={premium}
            visibleSectionCount={effectiveVisibleSectionCount}
            lockedSectionCount={effectiveLockedSectionCount}
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
                {chapterSidebarItems.map((item) => (
                  <div
                    key={`${item.number}-${item.title}`}
                    className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5 text-sm text-foreground"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        {item.number && <span className="mr-1.5 font-medium text-muted-foreground">{item.number}.</span>}
                        <span className="truncate">{item.title}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {item.status}
                      </span>
                    </div>
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
