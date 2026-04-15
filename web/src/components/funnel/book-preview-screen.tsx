"use client";

import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  ImagePlus,
  Loader2,
  Shield,
  Sparkles,
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
import { useTranslations } from "next-intl";

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
  saveBook,
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

function isStalePipelineEvent(entry: { code?: string; label?: string; detail?: string }) {
  const haystack = [
    String(entry.code || ""),
    String(entry.label || ""),
    String(entry.detail || ""),
  ]
    .join(" ")
    .toLowerCase();
  return (
    haystack.includes("stale_pipeline_run") ||
    haystack.includes("stale pipeline") ||
    haystack.includes("stale run") ||
    haystack.includes("skipped stale")
  );
}

function activityStatusChipClass(status: string) {
  switch (status) {
    case "done":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "active":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "waiting":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-[#eadbce] bg-[#fffaf6] text-[#8b6a59]";
  }
}

function formatActivityTime(raw: string) {
  const value = String(raw || "").trim();
  if (!value) return "";
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const CHAPTER_READY_WORD_THRESHOLD = 300;

function isInlineImageDataUrl(value: string) {
  return /^data:image\//i.test(String(value || "").trim());
}

function logoPathDisplayLabel(rawValue: string) {
  const value = String(rawValue || "").trim();
  if (!value) return "";
  if (isInlineImageDataUrl(value)) {
    const semicolonIndex = value.indexOf(";");
    const mime = semicolonIndex > 5 ? value.slice(5, semicolonIndex) : "image";
    return `${mime} inline data URL (${value.length.toLocaleString()} chars)`;
  }
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return `${url.host}${url.pathname}`;
    } catch {
      return value;
    }
  }
  return value;
}

type ActivityItem = {
  code: string;
  label: string;
  status: "done" | "active" | "queued" | "waiting" | "error";
  timestamp: string;
  detail: string;
};

function parseActivityTimestamp(value: string) {
  const ts = Date.parse(String(value || "").trim());
  return Number.isFinite(ts) ? ts : 0;
}

function countWordsSafe(value: string | null | undefined) {
  const content = String(value || "").trim();
  if (!content) return 0;
  return content.split(/\s+/).filter(Boolean).length;
}

function triggerExportDownload(url: string, fallbackFilename: string) {
  const href = String(url || "").trim();
  if (!href || href === "#") return false;
  try {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = fallbackFilename;
    anchor.rel = "noopener noreferrer";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return true;
  } catch {
    try {
      window.open(href, "_blank", "noopener,noreferrer");
      return true;
    } catch {
      return false;
    }
  }
}

function chapterNumberFromActivity(entry: { label?: string; detail?: string }) {
  const haystack = `${String(entry.detail || "")} ${String(entry.label || "")}`;
  const match = haystack.match(/\b(?:chapter|bölüm)\s+(\d+)\b/i);
  if (!match) return 0;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeActivityFeed(
  raw: unknown,
  options: {
    previewReady: boolean;
    coverReady: boolean;
    generationActive: boolean;
    fullGenerationActive: boolean;
    previewStartedAt?: string;
    previewUpdatedAt?: string;
  },
) {
  if (!Array.isArray(raw)) return [] as ActivityItem[];

  const parsed = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const code = String((item as { code?: string }).code || "").trim();
      const label = String((item as { label?: string }).label || "").trim();
      const status = String((item as { status?: string }).status || "").trim().toLowerCase();
      if (!code || !label) return null;
      if (!["done", "active", "queued", "waiting", "error"].includes(status)) return null;
      return {
        code,
        label,
        status: status as ActivityItem["status"],
        timestamp: String((item as { timestamp?: string }).timestamp || "").trim(),
        detail: String((item as { detail?: string }).detail || "").trim(),
      } satisfies ActivityItem;
    })
    .filter((item): item is ActivityItem => item !== null);

  let filtered = parsed;

  const previewStartedAtTs = parseActivityTimestamp(String(options.previewStartedAt || ""));
  if (previewStartedAtTs > 0 && !options.fullGenerationActive) {
    filtered = filtered.filter((item) => {
      const ts = parseActivityTimestamp(item.timestamp);
      return ts === 0 || ts >= previewStartedAtTs - 1_000;
    });
  }

  if (options.coverReady) {
    filtered = filtered.filter((item) => item.code !== "cover_failed");
  }

  if (options.previewReady || options.fullGenerationActive) {
    filtered = filtered.filter(
      (item) =>
        ![
          "preview_bootstrap",
          "preview_running",
          "cover_selected",
          "first_chapter_started",
          "first_chapter_failed",
          "first_chapter_waiting",
          "first_chapter_provider",
        ].includes(item.code),
    );
    filtered = filtered.filter((item) => {
      if (item.status !== "active") return true;
      if (item.code === "chapter_segment_started" && chapterNumberFromActivity(item) === 1) return false;
      return true;
    });
    const hasFirstChapterReady = filtered.some((item) => item.code === "first_chapter_ready");
    if (!hasFirstChapterReady) {
      filtered.push({
        code: "first_chapter_ready",
        label: "First chapter ready",
        status: "done",
        timestamp: String(options.previewUpdatedAt || options.previewStartedAt || ""),
        detail: "First readable chapter is ready.",
      });
    }
  }

  const deduped: ActivityItem[] = [];
  const seen = new Set<string>();
  let fullQueuedSeen = false;
  let fullStartedSeen = false;
  for (const item of filtered.sort((left, right) => parseActivityTimestamp(right.timestamp) - parseActivityTimestamp(left.timestamp))) {
    if (item.code === "full_book_queued") {
      if (fullQueuedSeen) continue;
      fullQueuedSeen = true;
    }
    if (item.code === "full_book_started") {
      if (fullStartedSeen) continue;
      fullStartedSeen = true;
    }
    const key = `${item.code}|${item.status}|${item.detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
    if (deduped.length >= 12) break;
  }

  return deduped.slice(0, 6);
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

function isInternalBuildPreflightMessage(value: string) {
  const normalized = String(value || "").trim();
  if (!normalized) return false;
  return /Primary exporter check failed; primary build command will be tried first, then lightweight fallback export if needed\.?/i.test(normalized) ||
    /Primary exporter preflight is unavailable; attempting primary build command before fallback\.?/i.test(normalized);
}

function normalizeInlineBuildMessage(value: string, maxLength = 280) {
  const compact = String(value || "").replace(/\s+/g, " ").trim();
  if (!compact) return "";
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}

function extractPrimaryFailureDetail(
  response: Record<string, unknown>,
  warnings: string[],
) {
  const primaryErrorTail = normalizeInlineBuildMessage(String(response.primary_error_tail || ""));
  if (primaryErrorTail) return primaryErrorTail;

  const warningDetail = warnings.find((warning) => /Primary build failed:/i.test(warning)) || "";
  return normalizeInlineBuildMessage(warningDetail.replace(/^Primary build failed:\s*/i, ""));
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
    ? raw!.warnings
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .filter((item) => !isInternalBuildPreflightMessage(item))
    : [];
  const rawReason = String(raw?.reason || "").trim();
  const suppressPrimaryUnavailableReason = (
    Boolean(raw?.ok) &&
    missing.length === 0 &&
    Boolean(raw?.fallback_ok) &&
    !Boolean(raw?.primary_ok)
  );
  const reason = (
    isInternalBuildPreflightMessage(rawReason) ||
    suppressPrimaryUnavailableReason
  ) ? "" : rawReason;
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
  const t = useTranslations("BookPreviewScreen");
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
  const [editableBook, setEditableBook] = useState<Book | null>(null);
  const [isFullBookLoading, setIsFullBookLoading] = useState(false);
  const [fullBookLoadError, setFullBookLoadError] = useState("");
  const [isSavingInlineChapter, setIsSavingInlineChapter] = useState(false);
  const [isRetryingPreview, setIsRetryingPreview] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingEpub, setIsGeneratingEpub] = useState(false);
  const [uploadingCover, setUploadingCover] = useState<"front" | "back" | null>(null);
  const isUploadingCover = uploadingCover !== null;
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
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
  const publisherLogoInputRef = useRef<HTMLInputElement>(null);
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
    const fullStage = String(generation.full_generation?.stage || "").trim().toLowerCase();
    const fullActive = Boolean(generation.full_generation?.active) || ["queued", "running", "waiting"].includes(fullStage);
    if (fullActive) return;
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
    void startBookPreviewPipeline(slug, { trigger: "system" })
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
    const fullActive = Boolean(full?.active) || fullStage === "queued" || fullStage === "running" || fullStage === "waiting";
    if (fullComplete || generation.product_ready) return;
    if (fullActive) return;
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
        setEditableBook(bookPayload);
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
            setFullBookLoadError(t("fullChaptersNotReady"));
          }
        }
      })
      .catch((error) => {
        if (!isBackendUnavailableError(error)) {
          console.error(error);
        }
        if (needsChapterSync) {
          setFullBookLoadError(t("fullChapterSyncDelayed"));
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
      const result = await startBookPreviewPipeline(slug, {
        trigger: "manual",
        bypassManualRetryLimit: true,
      });
      if (!result.ok) {
        const retryReason = String(result.generation?.preview_retry?.reason || "").trim();
        if (retryReason === "manual_retry_limit_reached") {
          toast.error(t("toastRetryLimit"));
        } else if (retryReason === "manual_retry_cooldown") {
          const seconds = Math.max(0, Number(result.generation?.preview_retry?.retry_after_seconds ?? 0));
          toast.error(seconds > 0 ? t("toastRetryWait", { seconds }) : t("toastRetryWaitMoment"));
        } else {
          toast.error(t("toastRetryFailed"));
        }
      }
      await startBookFullPipeline(slug, { force: true }).catch((error) => {
        if (!isBackendUnavailableError(error)) {
          console.error(error);
        }
      });
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
        title={t("samplePreview")}
        subtitle={t("connectionIssue")}
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
        title={t("preparingShowcase")}
        subtitle={t("preparingShowcaseSubtitle")}
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
    generationUpdateAgeSeconds >= 180 &&
    !generation.product_ready,
  );
  const previewRetryLimit = Number(generation.preview_retry?.limit ?? 1);
  const previewRetryUsed = Number(generation.preview_retry?.used ?? 0);
  const previewRetryRemaining = Math.max(0, Number(generation.preview_retry?.remaining ?? (previewRetryLimit - previewRetryUsed)));
  const previewRetryAllowed = Boolean(generation.preview_retry?.allowed ?? (previewRetryRemaining > 0));
  const previewRetryReason = String(generation.preview_retry?.reason || "").trim();
  const previewRetryPolicy = String(generation.preview_retry?.policy || "bounded").trim().toLowerCase();
  const previewRetryAfterSeconds = Math.max(0, Number(generation.preview_retry?.retry_after_seconds ?? 0));
  const generationStageLower = String(generation.stage || "").trim().toLowerCase();
  const firstChapterStateLower = String(generation.first_chapter_state || "").trim().toLowerCase();
  const shouldShowRetryCard = Boolean(
    !generation.product_ready &&
    (
      generationAppearsStuck ||
      generationStageLower === "error" ||
      generationStageLower === "needs_attention" ||
      generationStageLower === "waiting" ||
      firstChapterStateLower === "error" ||
      firstChapterStateLower === "waiting"
    )
  );
  const retryCardMessage = generationAppearsStuck
    ? `Generation looks delayed (no status change for ${generationUpdateAgeSeconds}s). You can retry now.` // keep dynamic — includes raw seconds count, not a UI string
    : previewRetryPolicy === "transient"
      ? t("transientIssueNote")
      : t("pipelineNeedsAttention");
  const retryLimitMessage = previewRetryReason === "manual_retry_cooldown"
    ? `Please wait ${previewRetryAfterSeconds}s before next retry.`
    : previewRetryPolicy === "transient"
      ? t("retryStaysAvailable")
      : previewRetryReason === "manual_retry_limit_reached"
        ? t("retryLimitReached")
        : previewRetryRemaining <= 0
          ? t("noRetryAttemptsLeft")
          : `${previewRetryRemaining} retry attempt left.`;
  const fullGeneration = generation.full_generation;
  const pipelineChapterReadyCount = Math.max(
    0,
    Number(fullGeneration?.ready_count ?? generation.chapter_ready_count ?? 0),
  );
  const chapterTargetCount = Math.max(
    0,
    Number(fullGeneration?.target_count ?? generation.chapter_target_count ?? 0),
  );
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
  const brandingLogoPath = String(preview.book.branding_logo_url || "").trim();
  const coverUrl = frontCoverPath ? buildBookAssetUrl(slug, frontCoverPath) : "";
  const backCoverUrl = backCoverPath ? buildBookAssetUrl(slug, backCoverPath) : "";
  const publisherLogoUrl = brandingLogoPath ? buildBookAssetUrl(slug, brandingLogoPath) : "";
  const brandingLogoDisplayPath = logoPathDisplayLabel(brandingLogoPath);
  const brandingLogoIsDataUrl = isInlineImageDataUrl(brandingLogoPath);
  const frontCoverSource = String(preview.book.front_cover_source || "").trim().toLowerCase();
  const backCoverSource = String(preview.book.back_cover_source || "").trim().toLowerCase();
  const manualCoverLocked = frontCoverSource === "manual" || backCoverSource === "manual";
  const defaultCurrentStepLabel = generation.product_ready
    ? t("previewReady")
    : !generation.cover_ready
      ? t("coverCreating")
      : !generation.preview_ready
        ? t("chapterWriting")
        : fullGeneration?.complete
          ? t("bookReady")
          : t("chaptersBackground");
  const defaultPreviewStages: Array<{
    code: string;
    label: string;
    status: "done" | "active" | "queued" | "waiting" | "error";
    detail?: string;
  }> = [
    {
      code: "cover",
      label: t("coverLabel"),
      status: generation.cover_ready ? "done" : generation.cover_state === "error" ? "error" : "active",
      detail: generation.cover_ready ? t("coverReadyDetail") : t("coverCreating"),
    },
    {
      code: "first_chapter",
      label: t("firstChapterLabel"),
      status: generation.preview_ready ? "done" : generation.first_chapter_state === "error" ? "error" : generation.cover_ready ? "active" : "queued",
      detail: generation.preview_ready ? t("firstChapterReadyDetail") : t("chapterWriting"),
    },
    {
      code: "full_book",
      label: t("fullBookLabel"),
      status: fullGeneration?.complete ? "done" : fullGeneration?.stage === "waiting" ? "waiting" : generation.active ? "active" : "queued",
      detail: preferEnglishCopy(fullGeneration?.message, t("chaptersBackground")),
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
        const fallbackLabel = fallbackStage?.label || (stageCode ? humanizeStageCode(stageCode) : t("liveUpdates"));
        const fallbackDetail = fallbackStage?.detail || t("liveUpdates");
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
  const activityFeed = normalizeActivityFeed(generation.activity_log, {
    previewReady: Boolean(generation.preview_ready),
    coverReady: Boolean(generation.cover_ready),
    generationActive: Boolean(generation.active),
    fullGenerationActive:
      Boolean(generation.full_generation?.active) ||
      ["queued", "running", "waiting"].includes(String(generation.full_generation?.stage || "").trim().toLowerCase()),
    previewStartedAt: String(generation.started_at || ""),
    previewUpdatedAt: String(generation.updated_at || ""),
  });
  const stalePipelineEvents = activityFeed.filter((entry) => isStalePipelineEvent(entry));
  const stalePipelineEventCount = stalePipelineEvents.length;
  const heroKicker = generation.cover_ready
    ? generation.preview_ready
      ? t("coverLive")
      : t("coverOnlyLive")
    : t("premiumInProduction");

  const pageSubtitle = premium
    ? t("fullAccessActive")
      : generation.product_ready
      ? t("bookReadyPreviewOpen", { ratio })
      : generation.preview_ready
        ? t("firstChapterReady")
        : generation.active
          ? currentStepLabel
          : t("showcasePreparing");

  const visibleSections = preview.preview.visible_sections;
  const tocSections = preview.preview.toc;
  const totalChapters = tocSections.length;
  const editableSections = editableBook?.chapters?.length
    ? editableBook.chapters.map((chapter, index) => ({
        number: chapter.number || index + 1,
        title: String(chapter.title || "").trim() || `Chapter ${index + 1}`,
        content: String(chapter.content || ""),
        partial: false,
        word_count: String(chapter.content || "").split(/\s+/).filter(Boolean).length,
      }))
    : null;
  const chapterSections = premium && editableSections?.length
    ? editableSections
    : premium && fullBookSections?.length
      ? fullBookSections
      : visibleSections;
  const readyChapterNumbersFromActivity = (Array.isArray(generation.activity_log) ? generation.activity_log : []).reduce(
    (set, item) => {
      const code = String(item?.code || "").trim().toLowerCase();
      if (code === "first_chapter_ready") {
        set.add(1);
        return set;
      }
      if (code !== "chapter_ready") return set;
      const chapterNumber = chapterNumberFromActivity({
        label: String(item?.label || ""),
        detail: String(item?.detail || ""),
      });
      if (chapterNumber > 0) set.add(chapterNumber);
      return set;
    },
    new Set<number>(),
  );
  const activityReadyFloorCount = (() => {
    let count = 0;
    while (readyChapterNumbersFromActivity.has(count + 1)) {
      count += 1;
    }
    return count;
  })();
  const contentReadyFloorCount = (() => {
    let count = 0;
    for (let index = 0; index < tocSections.length; index += 1) {
      const section = chapterSections[index];
      if (countWordsSafe(section?.content) < CHAPTER_READY_WORD_THRESHOLD) break;
      count += 1;
    }
    return count;
  })();
  const effectiveChapterReadyCount = Math.max(
    pipelineChapterReadyCount,
    activityReadyFloorCount,
    contentReadyFloorCount,
    generation.preview_ready ? 1 : 0,
  );
  const effectiveRemainingChapterCount =
    chapterTargetCount > 0
      ? Math.max(0, chapterTargetCount - effectiveChapterReadyCount)
      : Math.max(0, totalChapters - effectiveChapterReadyCount);
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
  const pdfPreflightReason = !pdfPreflight.ok
    ? (
      pdfPreflight.missing[0] ||
      pdfPreflight.reason ||
      pdfPreflight.warnings[0] ||
      ""
    )
    : "";
  const epubPreflightReason = !epubPreflight.ok
    ? (
      epubPreflight.missing[0] ||
      epubPreflight.reason ||
      epubPreflight.warnings[0] ||
      ""
    )
    : "";
  const latestPdfExportStale = Boolean(
    generation.exports_dirty ||
    (
      latestPdfExport &&
      Number.isFinite(previewUpdatedAtMs) &&
      Date.parse(latestPdfExport.date) < previewUpdatedAtMs - EXPORT_STALE_TOLERANCE_MS
    ),
  );
  const latestEpubExportStale = Boolean(
    generation.exports_dirty ||
    (
      latestEpubExport &&
      Number.isFinite(previewUpdatedAtMs) &&
      Date.parse(latestEpubExport.date) < previewUpdatedAtMs - EXPORT_STALE_TOLERANCE_MS
    ),
  );
  const writingChapterNumber = Number(fullGeneration?.current_chapter || 0);
  const writingChapterIndex =
    writingChapterNumber > 0
      ? Math.max(0, Math.min(totalChapters - 1, writingChapterNumber - 1))
      : Math.max(0, Math.min(totalChapters - 1, effectiveChapterReadyCount));
  const writingChapterLabel = generation.active && totalChapters
    ? t("writingChapterNow", { number: writingChapterIndex + 1 })
    : "";
  const rawEtaSeconds = Number(fullGeneration?.eta_seconds || 0);
  const estimatedMinutesRemaining = rawEtaSeconds > 0
    ? Math.max(1, Math.ceil(rawEtaSeconds / 60))
    : !generation.active
      ? 0
      : effectiveRemainingChapterCount > 0
        ? Math.max(1, effectiveRemainingChapterCount * 2)
        : 1;
  const estimatedTimeLabel = estimatedMinutesRemaining > 0 ? t("etaMinutesLeft", { minutes: estimatedMinutesRemaining }) : "";
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
    ? t("autoRefreshNote")
    : t("createAccountNote");
  const chapterSidebarItems = preview.preview.toc.map((chapter, index) => {
    const isLockedForPreview = !premium && index >= visibleSections.length;
    const status: "complete" | "writing" | "pending" | "locked" =
      isLockedForPreview
        ? "locked"
        : index < effectiveChapterReadyCount
          ? "complete"
          : generation.active && index === writingChapterIndex
            ? "writing"
            : "pending";
    return {
      number: chapter.number,
      title: chapter.title,
      status,
      wordCount: countWordsSafe(chapterSections[index]?.content),
    };
  });

  function openUpgrade(trigger: "pdf" | "epub" | "full_unlock") {
    if (trigger === "pdf") trackEvent("paywall_pdf_clicked", { slug });
    if (trigger === "epub") trackEvent("paywall_epub_clicked", { slug });
    if (trigger === "full_unlock") trackEvent("paywall_full_unlock_clicked", { slug });
    trackEvent("paywall_viewed", { slug, trigger });
    router.push(`/app/book/${encodeURIComponent(slug)}/upgrade`);
  }

  async function handlePdfPrimaryAction() {
    if (!premium) {
      openUpgrade("pdf");
      return;
    }
    await handleGeneratePdf();
  }

  async function handleEpubPrimaryAction() {
    if (!premium) {
      openUpgrade("epub");
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
          t("pdfNotReady");
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
        edition_label: preview.book.edition_label,
        print_label: preview.book.print_label,
        publication_city: preview.book.publication_city,
        publication_country: preview.book.publication_country,
        publisher_address: preview.book.publisher_address,
        publisher_phone: preview.book.publisher_phone,
        publisher_email: preview.book.publisher_email,
        publisher_website: preview.book.publisher_website,
        publisher_certificate_no: preview.book.publisher_certificate_no,
        isbn13: preview.book.isbn13,
        editor_name: preview.book.editor_name,
        proofreader_name: preview.book.proofreader_name,
        typesetter_name: preview.book.typesetter_name,
        cover_designer_name: preview.book.cover_designer_name,
        printer_name: preview.book.printer_name,
        printer_address: preview.book.printer_address,
        printer_certificate_no: preview.book.printer_certificate_no,
        copyright_statement: preview.book.copyright_statement,
        imprint_block: preview.book.imprint_block,
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
          t("toastPdfFailed");
        toast.error(reason);
        return;
      }
      const responseWarnings = Array.isArray((response as { warnings?: unknown[] }).warnings)
        ? (response as { warnings?: unknown[] }).warnings!.map((item) => String(item || "").trim()).filter(Boolean)
        : [];
      const fallbackUsed = Boolean((response as { fallback_used?: boolean }).fallback_used) ||
        responseWarnings.some((warning) => /lightweight fallback/i.test(warning));
      if (fallbackUsed) {
        const fallbackReason = responseWarnings.find((warning) => /fallback/i.test(warning)) || t("toastPdfFailed");
        const fallbackDetail = extractPrimaryFailureDetail(response as Record<string, unknown>, responseWarnings);
        toast.error(fallbackDetail ? `${fallbackReason} (${fallbackDetail})` : fallbackReason);
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
        const downloaded = triggerExportDownload(newExport.url, `${slug}.pdf`);
        if (downloaded) {
          toast.success(t("toastPdfReady"));
        } else {
          toast.error(t("toastPdfMissing"));
        }
      } else {
        toast.error(t("toastPdfMissing"));
      }
      void refreshBuildPreflight(true);

      trackEvent("pdf_export_completed", { slug });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error(t("toastPdfFailed"));
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
          t("epubNotReady");
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
        edition_label: preview.book.edition_label,
        print_label: preview.book.print_label,
        publication_city: preview.book.publication_city,
        publication_country: preview.book.publication_country,
        publisher_address: preview.book.publisher_address,
        publisher_phone: preview.book.publisher_phone,
        publisher_email: preview.book.publisher_email,
        publisher_website: preview.book.publisher_website,
        publisher_certificate_no: preview.book.publisher_certificate_no,
        isbn13: preview.book.isbn13,
        editor_name: preview.book.editor_name,
        proofreader_name: preview.book.proofreader_name,
        typesetter_name: preview.book.typesetter_name,
        cover_designer_name: preview.book.cover_designer_name,
        printer_name: preview.book.printer_name,
        printer_address: preview.book.printer_address,
        printer_certificate_no: preview.book.printer_certificate_no,
        copyright_statement: preview.book.copyright_statement,
        imprint_block: preview.book.imprint_block,
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
          t("toastEpubFailed");
        toast.error(reason);
        return;
      }
      const responseWarnings = Array.isArray((response as { warnings?: unknown[] }).warnings)
        ? (response as { warnings?: unknown[] }).warnings!.map((item) => String(item || "").trim()).filter(Boolean)
        : [];
      const fallbackUsed = Boolean((response as { fallback_used?: boolean }).fallback_used) ||
        responseWarnings.some((warning) => /lightweight fallback/i.test(warning));
      if (fallbackUsed) {
        const fallbackReason = responseWarnings.find((warning) => /fallback/i.test(warning)) || t("toastEpubFailed");
        const fallbackDetail = extractPrimaryFailureDetail(response as Record<string, unknown>, responseWarnings);
        toast.error(fallbackDetail ? `${fallbackReason} (${fallbackDetail})` : fallbackReason);
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
        const downloaded = triggerExportDownload(newExport.url, `${slug}.epub`);
        if (downloaded) {
          toast.success(t("toastEpubReady"));
        } else {
          toast.error(t("toastEpubMissing"));
        }
      } else {
        toast.error(t("toastEpubMissing"));
      }
      void refreshBuildPreflight(true);

      trackEvent("epub_export_completed", { slug });
    } catch (error) {
      console.error("EPUB generation failed:", error);
      toast.error(t("toastEpubFailed"));
    } finally {
      setIsGeneratingEpub(false);
    }
  }

  async function handleFrontCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("toastFileTypeMustBeImage"));
      return;
    }

    // Validate file size (4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.error(t("toastFileSizeLimit"));
      return;
    }

    setUploadingCover("front");
    try {
      await uploadBookAsset(slug, file, "cover_image");

      // Refresh preview
      await hydrate();
      void refreshBuildPreflight(true);
      toast.success(t("toastFrontCoverUploaded"));

      trackEvent("preview_custom_front_cover_uploaded", { slug });
    } catch (error) {
      console.error("Front cover upload failed:", error);
      toast.error(t("toastFrontCoverFailed"));
    } finally {
      setUploadingCover(null);
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
      toast.error(t("toastFileTypeMustBeImage"));
      return;
    }

    // Validate file size (4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.error(t("toastFileSizeLimit"));
      return;
    }

    setUploadingCover("back");
    try {
      await uploadBookAsset(slug, file, "back_cover_image");

      // Refresh preview
      await hydrate();
      void refreshBuildPreflight(true);
      toast.success(t("toastBackCoverUploaded"));

      // trackEvent("cover_back_uploaded", { slug }); // TODO: Add to analytics type
    } catch (error) {
      console.error("Back cover upload failed:", error);
      toast.error(t("toastBackCoverFailed"));
    } finally {
      setUploadingCover(null);
      // Reset input
      if (backCoverInputRef.current) {
        backCoverInputRef.current.value = "";
      }
    }
  }

  async function handlePublisherLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !preview) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("toastFileTypeMustBeImage"));
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error(t("toastFileSizeLimit"));
      return;
    }    setIsUploadingLogo(true);
    try {
      const uploaded = await uploadBookAsset(slug, file, "asset");
      const saved = await saveBook({
        slug,
        title: preview.book.title,
        subtitle: preview.book.subtitle || "",
        author: preview.book.author || "",
        publisher: preview.book.publisher || "",
        author_bio: preview.book.author_bio || "",
        cover_brief: preview.book.cover_brief || "",
        branding_mark: preview.book.branding_mark || "",
        branding_logo_url: uploaded.saved_asset,
      });
      setEditableBook(saved);
      await hydrate();
      void refreshBuildPreflight(true);
      toast.success(t("toastLogoUpdated"));
    } catch (error) {
      console.error("Publisher logo upload failed:", error);
      toast.error(t("toastLogoFailed"));
    } finally {
      setIsUploadingLogo(false);
      if (publisherLogoInputRef.current) {
        publisherLogoInputRef.current.value = "";
      }
    }
  }

  async function handleInlineChapterSave(draft: { title: string; content: string }) {
    if (!editableBook) return;
    const chapters = [...(editableBook.chapters || [])];
    const targetIndex = activeChapterIndex;
    const current = chapters[targetIndex];
    if (!current) return;

    chapters[targetIndex] = {
      ...current,
      title: draft.title.trim() || current.title,
      content: draft.content,
    };

    setIsSavingInlineChapter(true);
    try {
      const saved = await saveBook({
        ...editableBook,
        slug,
        chapters,
      });
      setEditableBook(saved);
      setFullBookSections(
        (saved.chapters || []).map((chapter, index) => ({
          number: chapter.number || index + 1,
          title: String(chapter.title || "").trim() || `Chapter ${index + 1}`,
          content: String(chapter.content || ""),
          partial: false,
          word_count: String(chapter.content || "").split(/\s+/).filter(Boolean).length,
        })),
      );
      toast.success(t("toastChapterSaved"));
      await hydrate();
    } catch (error) {
      console.error("Inline chapter save failed:", error);
      toast.error(t("toastChapterSaveFailed"));
    } finally {
      setIsSavingInlineChapter(false);
    }
  }

  const unlockFeatures = [
    {
      icon: BookOpen,
      title: t("allChaptersTitle"),
      detail: totalChapters ? t("allChaptersDetail", { total: totalChapters }) : t("allChaptersDetailNoCount"),
    },
    {
      icon: Download,
      title: t("exportsTitle"),
      detail: t("exportsDetail"),
    },
    {
      icon: ImagePlus,
      title: t("coversTitle"),
      detail: t("coversDetail"),
    },
    {
      icon: Sparkles,
      title: t("workspaceTitle"),
      detail: t("workspaceDetail"),
    },
  ];
  const unlockSummaryText = premium
    ? t("unlocked")
    : t("oneTimeUnlock");
  const sampleHeading = activeChapter?.title || livePreviewSection?.title || t("samplePreview");
  const showGuestSaveCard = !hasSession;


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
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/app/library" className="transition-colors hover:text-foreground">
          {t("breadcrumbLibrary")}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="max-w-[200px] truncate font-medium text-foreground">{preview.book.title}</span>
      </nav>

      {/* Warning cards — priority-based: show only the most urgent one at a time */}
      {(transientBackendIssue || (planHasPremiumAccess && !backendPremium) || shouldShowRetryCard) && (
        <Card className="mb-4 border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
            {shouldShowRetryCard ? (
              <>
                <p className="text-sm leading-6 text-amber-900 dark:text-amber-200">{retryCardMessage}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-900/70 dark:text-amber-200/70">{retryLimitMessage}</span>
                  <Button size="sm" variant="outline" className="h-9" onClick={() => void hydrate({ includeBooks: true })}>
                    {t("refresh")}
                  </Button>
                  <Button size="sm" className="h-9" onClick={() => void handleRetryPreviewPipeline()} disabled={isRetryingPreview || !previewRetryAllowed}>
                    {isRetryingPreview ? t("retrying") : t("retryPipeline")}
                  </Button>
                </div>
              </>
            ) : planHasPremiumAccess && !backendPremium ? (
              <>
                <p className="text-sm leading-6 text-amber-900 dark:text-amber-200">{t("premiumPlanSyncNote")}</p>
                <Button size="sm" variant="outline" className="h-9" onClick={() => void hydrate({ includeBooks: true })}>
                  {t("refreshAccess")}
                </Button>
              </>
            ) : (
              <p className="text-sm leading-6 text-amber-900 dark:text-amber-200">{t("connectionUnstable")}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 flex flex-col gap-8">
          <section className="overflow-hidden rounded-[32px] border border-[#eadbce] bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.08),transparent_32%),linear-gradient(180deg,#fffdf8_0%,#fff8f2_100%)] px-4 py-6 shadow-[0_28px_80px_rgba(31,24,19,0.08)] md:px-6 md:py-8 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
              <div className="space-y-4">
                <div className="rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-[0_20px_60px_rgba(31,24,19,0.08)] backdrop-blur">
                  <div className="aspect-[3/4] overflow-hidden rounded-[22px] border border-[#eadbce] bg-[linear-gradient(180deg,#fffdf8_0%,#fff6ef_100%)] p-3">
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={`${preview.book.title} cover`}
                        width={360}
                        height={480}
                        sizes="(max-width: 768px) 82vw, (max-width: 1280px) 300px, 320px"
                        unoptimized
                        className="h-full w-full rounded-[18px] object-contain"
                      />
                    ) : (
                      <div className="flex h-full flex-col justify-between rounded-[18px] border border-dashed border-[#d8bfac] bg-white/70 p-5">
                        <div className="space-y-3">
                          <div className="h-4 w-28 rounded-full bg-[#eadbce]" />
                          <div className="h-16 rounded-[18px] bg-[linear-gradient(135deg,rgba(47,31,23,0.12),rgba(236,72,153,0.12))]" />
                        </div>
                        <div className="space-y-3">
                          <div className="h-5 w-3/4 rounded-full bg-[#dcc5b4]" />
                          <div className="h-5 w-2/3 rounded-full bg-[#eadbce]" />
                          <div className="h-20 rounded-[18px] bg-[linear-gradient(180deg,rgba(255,255,255,0.4),rgba(216,191,172,0.18))]" />
                          <div className="h-4 w-32 rounded-full bg-[#eadbce]" />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#6f5547]">
                    {coverUrl
                      ? t("coverAttached")
                      : t("coverReserved")}
                  </p>
                  {manualCoverLocked ? (
                    <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
                      {t("manualCoverLockActive")}
                    </div>
                  ) : null}
                </div>

                {!premium && (
                  <div className="rounded-2xl border border-[#eadbce] bg-white/70 px-4 py-2.5 text-center">
                    <p className="text-xs font-semibold text-[#7f5a46]">{unlockSummaryText}</p>
                    <p className="mt-0.5 text-[11px] text-[#8b6a59]">{t("freeSampleLine")}</p>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${generation.cover_ready || generation.product_ready ? "border-emerald-200 bg-emerald-50 text-emerald-700" : generation.active ? "border-amber-200 bg-amber-50 text-amber-700" : "border-[#d8bfac]/70 bg-white/85 text-[#7f5a46]"}`}>
                  {generation.cover_ready || generation.product_ready ? <CheckCircle2 className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}
                  {heroKicker}
                </div>

                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-[#1f1813] md:text-5xl xl:text-6xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {preview.book.title}
                  </h1>
                  {preview.book.subtitle ? (
                    <p className="mt-3 max-w-3xl text-base italic leading-7 text-[#6f5547] md:text-lg" style={{ fontFamily: "'Source Serif Pro', serif" }}>
                      {preview.book.subtitle}
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm text-[#8b6a59]">by {authorName} · {imprint}</p>
                  {premium && (
                    <button
                      type="button"
                      className="mt-2 flex items-center gap-1.5 rounded-full border border-[#d8bfac]/60 bg-white/60 px-3 py-1 text-[11px] font-semibold text-[#7f5a46] transition-colors hover:bg-white/90 hover:text-[#2f1f17]"
                      onClick={() => document.getElementById("book-details")?.scrollIntoView({ behavior: "smooth" })}
                    >
                      <FileText className="size-3" />
                      {t("editBookInfoShortcut")}
                    </button>
                  )}
                </div>

                {!generation.product_ready && (
                  <div className="flex items-center gap-3 rounded-2xl border border-[#eadbce] bg-white/70 px-4 py-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      {generation.active ? (
                        <Loader2 className="size-4 shrink-0 animate-spin text-[#7f5a46]" />
                      ) : (
                        <div className="size-4 shrink-0 rounded-full border-2 border-[#d8bfac]" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#2f1f17]">{currentStepLabel}</p>
                        {writingChapterLabel ? (
                          <p className="mt-0.5 truncate text-xs text-[#8b6a59]">{writingChapterLabel}</p>
                        ) : !hasSession ? (
                          <p className="mt-0.5 truncate text-xs text-[#8b6a59]">{previewReadyEmailHint}</p>
                        ) : null}
                      </div>
                    </div>
                    {estimatedTimeLabel && (
                      <span className="shrink-0 rounded-full border border-[#eadbce] bg-[#fff8f2] px-3 py-1 text-xs font-semibold text-[#7f5a46]">
                        {estimatedTimeLabel}
                      </span>
                    )}
                  </div>
                )}

                {!premium ? (
                  <div className="rounded-[28px] border border-[#221c18] bg-[#18120f] p-5 text-white shadow-[0_24px_70px_rgba(24,18,15,0.24)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-2xl">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5c9de]">{t("unlockLabel")}</div>
                        <h2 className="mt-2 text-2xl font-semibold md:text-3xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {t("unlockHeading")}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-white/75 md:text-base">
                          {t("unlockSubtext")}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">{t("oneTimeUnlockLabel")}</div>
                        <div className="mt-2 text-3xl font-semibold">$4</div>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button size="lg" className="h-14 px-8 text-base font-semibold" onClick={() => openUpgrade("full_unlock")}>
                        <Sparkles className="mr-2 size-5" />
                        {t("unlockFullBook")}
                        <ArrowRight className="ml-2 size-5" />
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-14 border-white/15 bg-white/5 px-8 text-base font-semibold text-white hover:bg-white/10"
                        onClick={() => {
                          trackEvent("preview_viewed", { slug });
                          document.getElementById("preview-content")?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        <BookOpen className="mr-2 size-5" />
                        {t("readSample")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                      <Button size="lg" className="h-12 flex-1 px-6 text-sm font-semibold" onClick={() => void handlePdfPrimaryAction()} disabled={isGeneratingPdf}>
                        {isGeneratingPdf ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
                        {isGeneratingPdf ? t("generatingLabel") : canInstantPdfDownload ? t("openPdf") : t("generatePdf")}
                      </Button>
                      <Button size="lg" variant="outline" className="h-12 flex-1 border-[#dcc5b4] bg-white/80 px-6 text-sm font-semibold text-[#2f1f17] hover:bg-[#fff8f2]" onClick={() => void handleEpubPrimaryAction()} disabled={isGeneratingEpub}>
                        {isGeneratingEpub ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
                        {isGeneratingEpub ? t("generatingLabel") : canInstantEpubDownload ? t("openEpub") : t("generateEpub")}
                      </Button>
                    </div>
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-2 py-1.5 text-sm text-[#8b6a59] transition-colors hover:text-[#2f1f17]"
                      onClick={() => {
                        trackEvent("preview_viewed", { slug });
                        document.getElementById("preview-content")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <BookOpen className="size-4" />
                      {t("readSample")}
                    </button>
                  </div>
                )}

                {showGuestSaveCard ? (
                  <div className="rounded-[24px] border border-[#d8bfac]/70 bg-[linear-gradient(180deg,#fffaf4_0%,#fff7ef_100%)] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f5a46]">{t("dontLosePreview")}</div>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f5547]">
                          {t("guestSaveNote")}
                        </p>
                      </div>
                      <Button asChild size="default" className="shrink-0">
                        <Link href={`/signup?next=${encodeURIComponent(`/app/book/${slug}/preview`)}`}>
                          {t("createFreeAccount")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className={`space-y-5${premium ? ' order-2' : ''}`} aria-labelledby="preview-content">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b6a59]">{t("proofPreviewLabel")}</div>
                <h2 id="preview-content" className="mt-1 text-2xl font-semibold text-[#1f1813]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {t("readTheSample")}
                </h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#8b6a59]">
                <span>{t("visibleNowCount", { visible: effectiveVisibleSectionCount, total: totalChapters || 0 })}</span>
                {!premium && (
                  <>
                    <span className="text-[#d8bfac]">·</span>
                    <span className="rounded-full border border-[#eadbce] bg-white px-2.5 py-0.5 font-medium text-[#7f5a46]">{t("exportsIncludedAfterUnlock")}</span>
                  </>
                )}
              </div>
            </div>

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
                  allowInlineEdit={premium && Boolean(editableBook?.chapters?.length)}
                  onSaveEdit={premium ? handleInlineChapterSave : undefined}
                  isSavingEdit={isSavingInlineChapter}
                />

                {premium && (isFullBookLoading || fullBookLoadError) && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <p className="text-sm text-foreground">
                        {isFullBookLoading ? t("syncingFullChapters") : fullBookLoadError}
                      </p>
                      <Button size="sm" variant="outline" className="h-9" onClick={() => void hydrate()}>
                        {t("refreshNow")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-dashed border-[#dcc5b4] bg-[#fffaf5]">
                <CardContent className="p-12 text-center">
                  <Loader2 className="mx-auto mb-4 size-8 animate-spin text-primary" />
                  <div className="text-sm font-semibold text-foreground">{currentStepLabel}</div>
                  <p className="mt-2 text-xs text-muted-foreground">{t("firstChapterSoonNote")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("pageAutoRefreshNote")}</p>
                </CardContent>
              </Card>
            )}
          </section>

          {!premium && (
            <section className="rounded-[32px] border border-[#eadbce] bg-[linear-gradient(180deg,#fffaf6_0%,#fffdf9_100%)] p-6 shadow-[0_20px_50px_rgba(31,24,19,0.05)] md:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b6a59]">{t("unlockValueLabel")}</div>
                  <h2 className="mt-2 text-3xl font-semibold text-[#1f1813]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {t("everythingInOneUnlock")}
                  </h2>
                </div>
                <div className="rounded-full border border-[#eadbce] bg-white px-5 py-2 text-sm font-semibold text-[#7f5a46]">
                  {t("oneTimeFour")}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {unlockFeatures.map(({ icon: Icon, title, detail }) => (
                  <div key={title} className="rounded-[24px] border border-[#eadbce] bg-white/90 p-5 shadow-sm">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-[#fff2f8] text-[#d23f82]">
                      <Icon className="size-5" />
                    </div>
                    <div className="mt-4 text-lg font-semibold text-[#1f1813]">{title}</div>
                    <p className="mt-2 text-sm leading-6 text-[#6f5547]">{detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="rounded-[24px] border border-[#221c18] bg-[#18120f] p-6 text-white">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5c9de]">
                    <Shield className="size-4" />
                    {t("clearNextStep")}
                  </div>
                  <div className="mt-3 text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {t("sampleFirstNote")}
                  </div>
                </div>
                <div className="rounded-[24px] border border-[#eadbce] bg-white/90 p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b6a59]">{t("actionLabel")}</div>
                  <div className="mt-3 text-3xl font-semibold text-[#1f1813]">$4</div>
                  <p className="mt-2 text-sm leading-6 text-[#6f5547]">{t("fullBookExportEdit")}</p>
                  <Button size="lg" className="mt-5 h-12 w-full" onClick={() => openUpgrade("full_unlock")}>
                    <Sparkles className="mr-2 size-4" />
                    {t("unlockFullBook")}
                  </Button>
                </div>
              </div>
            </section>
          )}

          {premium ? (
            <section className="space-y-6 order-1" id="book-details">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b6a59]">{t("premiumWorkspaceSurfaceLabel")}</div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">editable</span>
                  </div>
                  <h2 className="mt-2 text-3xl font-semibold text-[#1f1813]" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {t("productionPanelTitle")}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f5547] md:text-base">
                    {t("productionPanelDesc")}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-6">
                  <EditableBookDetails
                    slug={slug}
                    title={preview.book.title}
                    subtitle={preview.book.subtitle}
                    language={preview.book.language}
                    author={preview.book.author}
                    publisher={preview.book.publisher}
                    authorBio={preview.book.author_bio}
                    coverBrief={preview.book.cover_brief}
                    brandingMark={preview.book.branding_mark}
                    brandingLogoUrl={preview.book.branding_logo_url}
                    editionLabel={preview.book.edition_label}
                    printLabel={preview.book.print_label}
                    publicationCity={preview.book.publication_city}
                    publicationCountry={preview.book.publication_country}
                    publisherAddress={preview.book.publisher_address}
                    publisherPhone={preview.book.publisher_phone}
                    publisherEmail={preview.book.publisher_email}
                    publisherWebsite={preview.book.publisher_website}
                    publisherCertificateNo={preview.book.publisher_certificate_no}
                    isbn13={preview.book.isbn13}
                    editorName={preview.book.editor_name}
                    proofreaderName={preview.book.proofreader_name}
                    typesetterName={preview.book.typesetter_name}
                    coverDesignerName={preview.book.cover_designer_name}
                    printerName={preview.book.printer_name}
                    printerAddress={preview.book.printer_address}
                    printerCertificateNo={preview.book.printer_certificate_no}
                    copyrightStatement={preview.book.copyright_statement}
                    imprintBlock={preview.book.imprint_block}
                    onUpdate={hydrate}
                  />

                  <Card className="border-[#eadbce] bg-[linear-gradient(180deg,#fffdf9_0%,#fff9f3_100%)]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[#1f1813]">
                        <ImagePlus className="size-5 text-primary" />
                        {t("coverManagementTitle")}
                        <span className="ml-auto text-xs text-muted-foreground">{t("coverManagementLimits")}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold text-foreground">{t("frontCoverLabel")}</div>
                            <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{frontCoverSource || "variant"}</span>
                          </div>
                          <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted">
                            {coverUrl ? (
                              <Image src={coverUrl} alt={`${preview.book.title} front cover`} width={300} height={400} sizes="(max-width: 768px) 100vw, 280px" unoptimized className="h-full w-full object-contain" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground"><BookOpen className="size-8" /></div>
                            )}
                          </div>
                          {coverUrl ? (
                            <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                              <a href={coverUrl} download>
                                <Download className="mr-2 size-4" />
                                {t("downloadFrontCover")}
                              </a>
                            </Button>
                          ) : null}
                        </div>
                        <div>
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="text-xs font-semibold text-foreground">{t("backCoverLabel")}</div>
                            <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{backCoverSource || "variant"}</span>
                          </div>
                          <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted">
                            {backCoverUrl ? (
                              <Image src={backCoverUrl} alt={`${preview.book.title} back cover`} width={300} height={400} sizes="(max-width: 768px) 100vw, 280px" unoptimized className="h-full w-full object-contain" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground"><BookOpen className="size-8" /></div>
                            )}
                          </div>
                          {backCoverUrl ? (
                            <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                              <a href={backCoverUrl} download>
                                <Download className="mr-2 size-4" />
                                {t("downloadBackCover")}
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      {manualCoverLocked ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                          {t("manualCoverLockActiveShort")}
                        </div>
                      ) : null}

                      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-foreground">{t("publisherLogoLabel")}</div>
                          <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                            PDF / EPUB
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-14 w-36 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                            {publisherLogoUrl ? (
                              <Image src={publisherLogoUrl} alt="Publisher logo" width={144} height={56} unoptimized className="h-full w-full object-contain" />
                            ) : (
                              <span className="text-[11px] text-muted-foreground">{t("noLogoSelected")}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 text-xs text-muted-foreground">
                            <div className="truncate">{brandingLogoDisplayPath || t("noExplicitLogoPath")}</div>
                            <div className="mt-1">
                              {brandingLogoIsDataUrl
                                ? t("inlineDataUrlActive")
                                : t("logoUsedInExports")}
                            </div>
                          </div>
                        </div>
                        <input
                          ref={publisherLogoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={handlePublisherLogoUpload}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full"
                          disabled={isUploadingLogo}
                          onClick={() => publisherLogoInputRef.current?.click()}
                        >
                          <ImagePlus className="mr-2 size-4" />
                          {t("uploadOrReplacePublisherLogo")}
                          {isUploadingLogo ? <Loader2 className="ml-auto size-4 animate-spin" /> : null}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <input ref={frontCoverInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFrontCoverUpload} />
                        <Button variant="outline" size="lg" className="w-full" disabled={uploadingCover === "front"} onClick={() => frontCoverInputRef.current?.click()}>
                          <ImagePlus className="mr-2 size-5" />
                          {t("uploadOrReplaceFrontCover")}
                          {uploadingCover === "front" && <Loader2 className="ml-auto size-5 animate-spin" />}
                        </Button>

                        <input ref={backCoverInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleBackCoverUpload} />
                        <Button variant="outline" size="lg" className="w-full" disabled={uploadingCover === "back"} onClick={() => backCoverInputRef.current?.click()}>
                          <ImagePlus className="mr-2 size-5" />
                          {t("uploadOrReplaceBackCover")}
                          {uploadingCover === "back" && <Loader2 className="ml-auto size-5 animate-spin" />}
                        </Button>
                      </div>

                      <div className="rounded-lg bg-slate-100 p-4 text-xs text-muted-foreground dark:bg-slate-800">
                        {t("coverReplaceNote")}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-1">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="size-5 text-primary" />
                          {t("pdfExportTitle")}
                          <span className="ml-auto text-xs text-muted-foreground">{t("productionLabel")}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 p-6">
                        {latestPdfExportStale ? (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">{t("pdfStaleWarning")}</div>
                        ) : null}
                        <div className="rounded-lg border border-border bg-muted/50 p-4 shadow-sm">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t("livePdfCompositionPreview")}</p>
                          <div className="flex gap-4">
                            <div className="w-[108px] shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                              {coverUrl ? (
                                <Image src={coverUrl} alt={`${preview.book.title} live PDF cover`} width={108} height={144} sizes="108px" unoptimized className="h-[144px] w-full object-contain" />
                              ) : (
                                <div className="flex h-[144px] items-center justify-center text-muted-foreground"><BookOpen className="size-5" /></div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground">{preview.book.title}</p>
                              {preview.book.subtitle ? <p className="mt-1 text-xs italic text-muted-foreground">{preview.book.subtitle}</p> : null}
                              <p className="mt-1 text-xs text-muted-foreground">by {authorName}</p>
                              {publisherLogoUrl ? (
                                <div className="mt-2 w-[112px] overflow-hidden rounded border border-border bg-muted">
                                  <Image src={publisherLogoUrl} alt="Publisher logo in PDF" width={112} height={36} unoptimized className="h-9 w-full object-contain" />
                                </div>
                              ) : null}
                              {livePreviewSection?.title ? <p className="mt-3 text-xs font-semibold text-foreground">{livePreviewSection.title}</p> : null}
                              {livePreviewExcerpt ? (
                                <p className="mt-1 line-clamp-6 text-xs leading-5 text-muted-foreground">{livePreviewExcerpt}...</p>
                              ) : (
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("chapterContentStillWriting")}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                          {latestPdfExport ? <div>{t("latestPdfGeneratedAt", { date: latestPdfExportLabel })}</div> : <div>{t("noPdfGeneratedYet")}</div>}
                          {pdfPreflightReason ? <div className="mt-1 text-amber-700 dark:text-amber-400">{t("buildCheck", { reason: pdfPreflightReason })}</div> : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="lg" className="min-w-[180px] flex-1" onClick={() => void handlePdfPrimaryAction()} disabled={isGeneratingPdf || pdfPreflight.loading}>
                            {isGeneratingPdf ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Download className="mr-2 size-5" />}
                            {isGeneratingPdf ? t("generatingLabel") : latestPdfExport ? t("regeneratePdf") : t("generatePdfAction")}
                          </Button>
                          {latestPdfExport ? (
                            <Button asChild size="lg" variant="outline" className="min-w-[180px] flex-1">
                              <a href={latestPdfExport.url} target="_blank" rel="noreferrer">{t("openLatestPdf")}</a>
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="size-5 text-primary" />
                          {t("epubExportTitle")}
                          <span className="ml-auto text-xs text-muted-foreground">{t("productionLabel")}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 p-6">
                        {latestEpubExportStale ? (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">{t("epubStaleWarning")}</div>
                        ) : null}
                        <div className="rounded-lg border border-border bg-muted/50 p-4 shadow-sm">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t("liveEpubCompositionPreview")}</p>
                          <div className="flex gap-4">
                            <div className="w-[108px] shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                              {coverUrl ? (
                                <Image src={coverUrl} alt={`${preview.book.title} live EPUB cover`} width={108} height={144} sizes="108px" unoptimized className="h-[144px] w-full object-contain" />
                              ) : (
                                <div className="flex h-[144px] items-center justify-center text-muted-foreground"><BookOpen className="size-5" /></div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground">{preview.book.title}</p>
                              {preview.book.subtitle ? <p className="mt-1 text-xs italic text-muted-foreground">{preview.book.subtitle}</p> : null}
                              <p className="mt-1 text-xs text-muted-foreground">by {authorName}</p>
                              {publisherLogoUrl ? (
                                <div className="mt-2 w-[112px] overflow-hidden rounded border border-border bg-muted">
                                  <Image src={publisherLogoUrl} alt="Publisher logo in EPUB" width={112} height={36} unoptimized className="h-9 w-full object-contain" />
                                </div>
                              ) : null}
                              {livePreviewSection?.title ? <p className="mt-3 text-xs font-semibold text-foreground">{livePreviewSection.title}</p> : null}
                              {livePreviewExcerpt ? (
                                <p className="mt-1 line-clamp-6 text-xs leading-5 text-muted-foreground">{livePreviewExcerpt}...</p>
                              ) : (
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("chapterContentStillWriting")}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                          {latestEpubExport ? <div>{t("latestEpubGeneratedAt", { date: latestEpubExportLabel })}</div> : <div>{t("noEpubGeneratedYet")}</div>}
                          {epubPreflightReason ? <div className="mt-1 text-amber-700 dark:text-amber-400">{t("buildCheck", { reason: epubPreflightReason })}</div> : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="lg" className="min-w-[180px] flex-1" onClick={() => void handleEpubPrimaryAction()} disabled={isGeneratingEpub || epubPreflight.loading}>
                            {isGeneratingEpub ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Download className="mr-2 size-5" />}
                            {isGeneratingEpub ? t("generatingLabel") : latestEpubExport ? t("regenerateEpub") : t("generateEpubAction")}
                          </Button>
                          {latestEpubExport ? (
                            <Button asChild size="lg" variant="outline" className="min-w-[180px] flex-1">
                              <a href={latestEpubExport.url} target="_blank" rel="noreferrer">{t("openLatestEpub")}</a>
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {(pdfPreflightReason || epubPreflightReason || pdfPreflight.loading || epubPreflight.loading) && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-900">
                  {pdfPreflight.loading || epubPreflight.loading ? (
                    <div>{t("checkingExportReadiness")}</div>
                  ) : (
                    <>
                      {pdfPreflightReason ? <div>PDF: {pdfPreflightReason}</div> : null}
                      {epubPreflightReason ? <div>EPUB: {epubPreflightReason}</div> : null}
                    </>
                  )}
                </div>
              )}
            </section>
          ) : null}
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          <CompactProgressCard
            coverReady={generation.cover_ready ?? false}
            previewReady={generation.preview_ready ?? false}
            chapterReadyCount={effectiveChapterReadyCount}
            chapterTargetCount={chapterTargetCount}
            remainingChapterCount={effectiveRemainingChapterCount}
            generationEta={generationEta}
            generationActive={generation.active ?? false}
            currentStepLabel={currentStepLabel}
            stages={previewStages}
          />

          <ChapterListSidebar
            chapters={chapterSidebarItems}
            selectedChapterIndex={activeChapterIndex}
            onSelectChapter={handleChapterChange}
            bookSlug={slug}
            premium={premium}
            visibleSectionCount={effectiveVisibleSectionCount}
            lockedSectionCount={effectiveLockedSectionCount}
          />

          <Card className="border-[#eadbce] bg-[linear-gradient(180deg,#fffdf9_0%,#fff8f2_100%)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-3 text-sm text-[#1f1813]">
                <span>{t("liveActivityTitle")}</span>
                <span className="rounded-full border border-[#eadbce] bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#8b6a59]">
                  {t("autoRefreshing")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {stalePipelineEventCount > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="size-3.5" />
                    {t("staleRunSkipped", { count: stalePipelineEventCount })}
                  </div>
                  <p className="mt-1 leading-5">
                    {t("staleRunNote")}
                  </p>
                </div>
              ) : null}

              {activityFeed.length > 0 ? (
                activityFeed.map((item, index) => {
                  const status = String(item.status || "queued").trim().toLowerCase();
                  const timeLabel = formatActivityTime(String(item.timestamp || ""));
                  const isStale = isStalePipelineEvent(item);
                  return (
                    <div key={`${item.code || "activity"}-${index}`} className="rounded-lg border border-[#eadbce] bg-white px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#2f1f17]">{item.label || t("pipelineEventFallback")}</p>
                          {item.detail ? (
                            <p className="mt-1 text-xs leading-5 text-[#6f5547]">{item.detail}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${activityStatusChipClass(status)}`}>
                            {status}
                          </span>
                          {isStale ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                              stale-skip
                            </span>
                          ) : null}
                          {timeLabel ? (
                            <span className="text-[10px] text-[#8b6a59]">{timeLabel}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-[#eadbce] bg-white/80 px-3 py-4 text-xs text-[#8b6a59]">
                  {t("pipelineLogWaiting")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="lg:hidden">
        <div className="fixed bottom-20 right-4 z-50">
          <button
            type="button"
            className="flex size-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30"
            onClick={() => setMobileSheetOpen(!mobileSheetOpen)}
          >
            <FileText className="size-5 text-primary-foreground" />
          </button>
        </div>

        <MobileContentSheet isOpen={mobileSheetOpen} onClose={() => setMobileSheetOpen(false)}>
          <MobileContentSheetContent
            tocContent={
              <div className="space-y-1">
                {chapterSidebarItems.map((item) => (
                  <div key={`${item.number}-${item.title}`} className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5 text-sm text-foreground">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        {item.number && <span className="mr-1.5 font-medium text-muted-foreground">{item.number}.</span>}
                        <span className="truncate">{item.title}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            }
            detailsContent={
              <div className="space-y-3">
                <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5">
                  <div className="text-xs font-medium text-muted-foreground">{t("mobileAuthorLabel")}</div>
                  <div className="mt-0.5 text-sm text-foreground">{authorName}</div>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5">
                  <div className="text-xs font-medium text-muted-foreground">{t("mobileImprintLabel")}</div>
                  <div className="mt-0.5 text-sm text-foreground">{imprint}</div>
                </div>
                {coverBrief ? (
                  <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5">
                    <div className="text-xs font-medium text-muted-foreground">{t("mobileCoverBriefLabel")}</div>
                    <div className="mt-0.5 text-sm text-foreground">{coverBrief}</div>
                  </div>
                ) : null}
                {authorBio ? (
                  <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5">
                    <div className="text-xs font-medium text-muted-foreground">{t("mobileAuthorBioLabel")}</div>
                    <div className="mt-0.5 text-sm text-foreground">{authorBio}</div>
                  </div>
                ) : null}
              </div>
            }
            actionsContent={
              <div className="space-y-2">
                {!premium ? (
                  <Button size="default" className="w-full" onClick={() => openUpgrade("full_unlock")}>
                    <Sparkles className="mr-2 size-4" />
                    {t("unlockFullBookMobile")}
                  </Button>
                ) : (
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
                    {t("readFullBook")}
                  </Button>
                )}
              </div>
            }
            activeTab={mobileActiveTab}
            onTabChange={setMobileActiveTab}
          />
        </MobileContentSheet>

        {!premium && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 px-4 py-3 pb-safe backdrop-blur-sm">
            <div className="mx-auto flex max-w-2xl items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{t("unlockFullBookSticky")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("allChaptersPdfEpubCovers")}</p>
              </div>
              <Button size="default" className="h-10 shrink-0 px-5 text-sm font-semibold" onClick={() => openUpgrade("full_unlock")}>
                <Sparkles className="mr-1.5 size-4" aria-hidden="true" />
                $4
              </Button>
            </div>
          </div>
        )}

        {!premium && <div className="h-20" />}
      </div>
    </AppFrame>
  );
}
