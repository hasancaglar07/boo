"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Check, Download, ExternalLink, FileText, FlaskConical, ImagePlus, Keyboard, Layers, Loader2, Sparkles, Upload, X } from "lucide-react";

import { AppFrame } from "@/components/app/app-frame";
import { AutoSaveIndicator } from "@/components/common/auto-save-indicator";
import { EnhancedFileList } from "@/components/common/enhanced-file-list";
import { EpubReaderPreview } from "@/components/app/epub-reader-preview";
import { useKeyboardShortcuts } from "@/components/common/keyboard-shortcuts";
import { BackendUnavailableState } from "@/components/app/backend-unavailable-state";
import { KeyboardShortcutsHelp } from "@/components/common/keyboard-shortcuts-help";
import { BookMockup } from "@/components/books/book-mockup";
import { ChapterEditor } from "@/components/writing/chapter-editor";
import { ChapterTemplates } from "@/components/writing/chapter-templates";
import { GoalTracker } from "@/components/writing/goal-tracker";
import { OutlinePreview } from "@/components/writing/outline-preview";
import { TimeTracker } from "@/components/writing/time-tracker";
import { WritingDashboard } from "@/components/writing/writing-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import {
  buildAssetUrl,
  buildBookAssetUrl,
  buildBook,
  isBackendUnavailableError,
  loadBook,
  loadBooks,
  preflightBook,
  responseSummary,
  runWorkflow,
  saveBook,
  uploadBookAsset,
  type Artifact,
  type Book,
} from "@/lib/dashboard-api";
import { useSessionGuard } from "@/lib/use-session-guard";
import { cn, titleCase } from "@/lib/utils";

const tabOptions = ["home", "book", "writing", "research", "publish"] as const;
type WorkspaceTab = (typeof tabOptions)[number];

const TAB_LABELS: Record<WorkspaceTab, string> = {
  home: "Overview",
  book: "Book",
  writing: "Content",
  research: "Research",
  publish: "Publish",
};

function normalizeTab(tab?: string): WorkspaceTab {
  return tab && tabOptions.includes(tab as WorkspaceTab) ? (tab as WorkspaceTab) : "home";
}

type ExportFormat = "pdf" | "epub";

function exportFormatForFile(file?: Artifact | null): ExportFormat | null {
  const lowered = String(file?.name || "").toLowerCase();
  if (lowered.endsWith(".pdf")) return "pdf";
  if (lowered.endsWith(".epub")) return "epub";
  return null;
}

function sortExportsNewestFirst(files: Artifact[]) {
  return [...files].sort((left, right) => {
    const leftTime = left.modified ? Date.parse(left.modified) : 0;
    const rightTime = right.modified ? Date.parse(right.modified) : 0;
    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }
    return right.relative_path.localeCompare(left.relative_path);
  });
}

function latestExportByFormat(files: Artifact[], format: ExportFormat) {
  return sortExportsNewestFirst(files).find((file) => exportFormatForFile(file) === format) || null;
}

function preferredPreviewExport(files: Artifact[]) {
  return latestExportByFormat(files, "pdf") || latestExportByFormat(files, "epub") || sortExportsNewestFirst(files)[0] || null;
}

function resolveSelectedCoverVariant(book: Book | null) {
  const variants = book?.cover_variants || [];
  if (!variants.length) return null;
  const selectedId = String(book?.selected_cover_variant || "").trim();
  const recommendedId = String(book?.recommended_cover_variant || "").trim();
  return (
    variants.find((variant) => variant.id === selectedId) ||
    variants.find((variant) => variant.id === recommendedId) ||
    variants[0] ||
    null
  );
}

function humanizeModeLabel(value?: string, fallback = "Auto") {
  const normalized = String(value || "").trim().replace(/[_-]+/g, " ");
  return normalized ? titleCase(normalized) : fallback;
}

function formatWordCount(value?: number) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "0";
  return amount.toLocaleString();
}

function formatStatusDate(value?: string) {
  if (!value) return "";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

// --- Toast helpers ---
type ToastType = "info" | "success" | "error" | "loading";
type Toast = { id: number; message: string; type: ToastType };

let toastCounter = 0;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    if (toast.type === "loading") return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [toast.type, onDismiss]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg transition-all",
        toast.type === "success" && "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
        toast.type === "error" && "border-destructive/30 bg-destructive/10 text-destructive",
        toast.type === "loading" && "border-border bg-card text-foreground",
        toast.type === "info" && "border-border bg-card text-foreground",
      )}
    >
      {toast.type === "loading" && <Loader2 className="size-4 shrink-0 animate-spin" />}
      {toast.type === "success" && <Check className="size-4 shrink-0" />}
      <span className="flex-1">{toast.message}</span>
      {toast.type !== "loading" && (
        <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

// --- Main Component ---
export function WorkspaceScreen({
  slug,
  initialTab,
}: {
  slug: string;
  initialTab?: string;
}) {
  const ready = useSessionGuard();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => normalizeTab(initialTab));
  const [books, setBooks] = useState<Book[]>([]);
  const [book, setBook] = useState<Book | null>(null);
  const [draft, setDraft] = useState<Book | null>(null);
  const [researchTopic, setResearchTopic] = useState("");
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [autoSaveCountdown, setAutoSaveCountdown] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingChapter, setIsGeneratingChapter] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [writingSubTab, setWritingSubTab] = useState<"overview" | "editor" | "analytics">("overview");
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [selectedExportRelativePath, setSelectedExportRelativePath] = useState("");

  function addToast(message: string, type: ToastType): number {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    return id;
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function updateToast(id: number, message: string, type: ToastType) {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, message, type } : t)));
    if (type !== "loading") {
      setTimeout(() => dismissToast(id), 4000);
    }
  }

  async function hydrateWorkspace() {
    try {
      const [bookList, loadedBook] = await Promise.all([
        loadBooks(),
        loadBook(slug),
      ]);
      setBooks(bookList);
      setBook(loadedBook);
      setDraft(loadedBook);
      setResearchTopic(loadedBook.title);
      setBackendUnavailable(false);
      setIsDirty(false);
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        setBackendUnavailable(true);
        return;
      }
      addToast(error instanceof Error ? error.message : "Loading failed.", "error");
    }
  }

  useEffect(() => {
    if (!ready) return;
    void hydrateWorkspace();
  }, [ready, slug]);

  useEffect(() => {
    const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
    params.set("tab", activeTab);
    window.history.replaceState({}, "", `${pathname}?${params.toString()}`);
  }, [activeTab, pathname]);

  useEffect(() => {
    const exportFiles = book?.resources?.exports || [];
    if (!exportFiles.length) {
      if (selectedExportRelativePath) {
        setSelectedExportRelativePath("");
      }
      return;
    }
    const selectedStillExists = exportFiles.some((file) => file.relative_path === selectedExportRelativePath);
    if (selectedStillExists) return;
    const next = preferredPreviewExport(exportFiles);
    if (next) {
      setSelectedExportRelativePath(next.relative_path);
    }
  }, [book, selectedExportRelativePath]);

  // Tab scroll indicators
  useEffect(() => {
    const scrollContainer = tabScrollRef.current;
    if (!scrollContainer) return;

    const checkScroll = () => {
      setCanScrollLeft(scrollContainer.scrollLeft > 0);
      setCanScrollRight(
        scrollContainer.scrollLeft < scrollContainer.scrollWidth - scrollContainer.clientWidth
      );
    };

    checkScroll();
    scrollContainer.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      scrollContainer.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  // Auto-save: trigger 30s after last change
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);

    setAutoSaveCountdown(30);
    countdownInterval.current = setInterval(() => {
      setAutoSaveCountdown((prev) => {
        if (prev <= 1) {
          if (countdownInterval.current) clearInterval(countdownInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    autoSaveTimer.current = setTimeout(() => {
      void autoSave();
    }, 30_000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function updateDraft(changes: Partial<Book>) {
    setDraft((prev) => (prev ? { ...prev, ...changes } : prev));
    setIsDirty(true);
    scheduleAutoSave();
  }

  async function autoSave() {
    if (!draft || isSaving) return;
    setIsSaving(true);
    const toastId = addToast("Auto-saving...", "loading");
    try {
      const saved = await saveBook(draft);
      setBook(saved);
      setDraft(saved);
      setIsDirty(false);
      setLastSaved(new Date());
      setAutoSaveCountdown(0);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      updateToast(toastId, "Auto-saved.", "success");
    } catch {
      updateToast(toastId, "Auto-save failed.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function refresh() {
    const [bookList, loadedBook] = await Promise.all([
      loadBooks(),
      loadBook(slug),
    ]);
    setBooks(bookList);
    setBook(loadedBook);
    setDraft(loadedBook);
    setBackendUnavailable(false);
    setIsDirty(false);
    return loadedBook;
  }

  async function saveCurrentBook() {
    if (!draft) return;
    setIsSaving(true);
    const toastId = addToast("Saving...", "loading");
    try {
      const saved = await saveBook(draft);
      setBook(saved);
      setDraft(saved);
      setLastSaved(new Date());
      setAutoSaveCountdown(0);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      await refresh();
      setIsDirty(false);
      updateToast(toastId, "Book saved.", "success");
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        setBackendUnavailable(true);
        dismissToast(toastId);
        return;
      }
      updateToast(toastId, error instanceof Error ? error.message : "Save failed.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      addToast("Only image files can be uploaded.", "error");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      addToast("Logo file must be under 4 MB.", "error");
      return;
    }

    const toastId = addToast("Uploading logo...", "loading");
    try {
      const uploaded = await uploadBookAsset(slug, file, "asset");
      const nextDraft = {
        ...(draft || currentDraft),
        branding_logo_url: uploaded.saved_asset,
      };
      const saved = await saveBook(nextDraft);
      setBook(saved);
      setDraft(saved);
      setIsDirty(false);
      updateToast(toastId, "Logo uploaded and linked to brand.", "success");
    } catch (error) {
      updateToast(toastId, error instanceof Error ? error.message : "Logo upload failed.", "error");
    }
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 's',
        ctrl: true,
        description: 'Save book',
        action: () => saveCurrentBook(),
      },
      {
        key: 'n',
        ctrl: true,
        description: 'New chapter',
        action: () => {
          const newChapter = {
            title: `Chapter ${(draft?.chapters.length || 0) + 1}`,
            content: '',
            state: 'draft' as const,
            target_words: 2000,
          };
          updateDraft({ chapters: [...(draft?.chapters || []), newChapter] });
          addToast('New chapter added.', 'success');
        },
      },
      {
        key: '?',
        description: 'Show keyboard shortcuts',
        action: () => setShowKeyboardHelp(true),
      },
    ],
    enabled: true,
  });

  if (!ready) return null;
  if (backendUnavailable) {
    return (
      <AppFrame
        current="workspace"
        layout="book"
        currentBookSlug={slug}
        title="Workspace"
        subtitle="Connection issue occurred."
        books={books}
      >
        <BackendUnavailableState onRetry={() => void hydrateWorkspace()} />
      </AppFrame>
    );
  }

  if (!draft || !book) return null;
  const currentDraft = draft;
  const exportFiles = sortExportsNewestFirst((book.resources?.exports || []).filter((file) => {
    const format = exportFormatForFile(file);
    return format === "pdf" || format === "epub";
  }));
  const selectedExportFile =
    exportFiles.find((file) => file.relative_path === selectedExportRelativePath) ||
    preferredPreviewExport(exportFiles) ||
    null;
  const selectedExportFormat = exportFormatForFile(selectedExportFile);
  const selectedCoverVariant = resolveSelectedCoverVariant(currentDraft);
  const selectedCoverValidation = selectedCoverVariant?.text_validation;

  const actions = [
    { label: "Overview", description: "Main progress summary", run: () => setActiveTab("home") },
    { label: "Book", description: "Title and chapter backbone", run: () => setActiveTab("book") },
    { label: "Content", description: "Outline and chapter writing", run: () => setActiveTab("writing") },
    { label: "Research", description: "KDP and keyword tools", run: () => setActiveTab("research") },
    { label: "Publish", description: "EPUB and PDF delivery", run: () => setActiveTab("publish") },
    { label: "Save", description: "Save book", run: () => saveCurrentBook() },
  ];

  async function triggerWorkflow(payload: Record<string, unknown>) {
    const toastId = addToast("Processing...", "loading");
    try {
      const response = await runWorkflow({ slug, ...payload });
      await refresh();
      updateToast(toastId, responseSummary(response).short, "success");
      if (payload.action === "outline_generate") trackEvent("outline_generated", { slug });
      if (payload.action === "chapter_generate") trackEvent("first_chapter_generated", { slug });
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        setBackendUnavailable(true);
        dismissToast(toastId);
        return;
      }
      updateToast(toastId, error instanceof Error ? error.message : "Operation failed.", "error");
    }
  }

  async function triggerBuild(format: "epub" | "pdf") {
    const hadExportBefore = Number(currentDraft.status?.export_count || 0) > 0;
    const toastId = addToast("Preparing output...", "loading");
    try {
      const response = await buildBook(slug, {
        format,
        author: currentDraft.author,
        publisher: currentDraft.publisher,
        author_bio: currentDraft.author_bio,
        branding_mark: currentDraft.branding_mark,
        branding_logo_url: currentDraft.branding_logo_url,
        cover_brief: currentDraft.cover_brief,
        generate_cover: currentDraft.generate_cover,
        cover_image: currentDraft.cover_image,
        back_cover_image: currentDraft.back_cover_image,
        isbn: currentDraft.isbn,
        year: currentDraft.year,
        fast: currentDraft.fast,
      });
      const loadedBook = await refresh();
      const exportFiles = loadedBook.resources?.exports || [];
      const latestRequestedExport =
        latestExportByFormat(exportFiles, format) ||
        (typeof response.export_relative_path === "string"
          ? exportFiles.find((file) => file.relative_path === response.export_relative_path) || null
          : null);
      if (latestRequestedExport) {
        setSelectedExportRelativePath(latestRequestedExport.relative_path);
      }
      updateToast(toastId, responseSummary(response).short, "success");
      if (!hadExportBefore) trackEvent("first_export_success", { slug, format });
      if (currentDraft.generate_cover) trackEvent("cover_generated", { slug, format });
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        setBackendUnavailable(true);
        dismissToast(toastId);
        return;
      }
      updateToast(toastId, error instanceof Error ? error.message : "Output generation failed.", "error");
    }
  }

  const stats = book.status || {
    chapter_count: currentDraft.chapters.length,
    asset_count: 0,
    extra_count: 0,
    research_count: 0,
    export_count: 0,
  };
  const fullGeneration = stats.full_generation;
  const currentWordCount = stats.current_word_count || fullGeneration?.word_count || 0;
  const targetWordCount = stats.target_word_count || fullGeneration?.target_word_count || currentDraft.book_target_words || 0;
  const readyChapterCount = fullGeneration?.ready_count || stats.chapter_ready_count || stats.chapter_count || currentDraft.chapters.length;
  const targetChapterCount = fullGeneration?.target_count || stats.chapter_target_count || currentDraft.chapter_plan?.length || currentDraft.chapters.length;
  const coverPairScore = Number(selectedCoverVariant?.pair_score || currentDraft.cover_pair_score || 0);
  const selectedCoverConfidence = Number(selectedCoverVariant?.selected_cover_confidence || currentDraft.selected_cover_confidence || 0);
  const frontVisualGrade = Number(selectedCoverVariant?.front_visual_grade || currentDraft.front_visual_grade || 0);
  const frontGenreFitScore = Number(selectedCoverVariant?.front_genre_fit_score || currentDraft.front_genre_fit_score || 0);
  const frontTextValidationScore = Number(selectedCoverVariant?.front_text_validation_score || currentDraft.front_text_validation_score || 0);
  const frontAiAttemptCount = Number(selectedCoverVariant?.front_ai_attempt_count || currentDraft.front_ai_attempt_count || 0);
  const rejectedVariantCount = Object.keys(currentDraft.cover_rejection_reasons || {}).length;
  const selectedCoverFrontUrl = selectedCoverVariant?.front_image ? buildBookAssetUrl(slug, selectedCoverVariant.front_image) : undefined;
  const selectedCoverBackUrl = selectedCoverVariant?.back_image ? buildBookAssetUrl(slug, selectedCoverVariant.back_image) : undefined;
  const coverTextStrategy = selectedCoverVariant?.text_strategy || currentDraft.cover_text_strategy || "full_ai_front";
  const coverMode = selectedCoverVariant?.cover_mode || currentDraft.cover_mode || "full_ai_front";
  const styleDirection = selectedCoverVariant?.style_direction || currentDraft.style_direction || "genre_split";
  const wrapScope = selectedCoverVariant?.wrap_scope || currentDraft.wrap_scope || "ai_front_only";
  const qualityGate = selectedCoverVariant?.quality_gate || currentDraft.quality_gate || "best_available";
  const textSafeZoneStatus = selectedCoverVariant?.text_safe_zone_status || currentDraft.text_safe_zone_status || "";
  const selectedCoverHardRejects = selectedCoverVariant?.front_hard_reject_reasons || currentDraft.front_hard_reject_reasons || [];
  const openingSequenceValid = currentDraft.opening_sequence_valid;
  const nextRetryLabel = formatStatusDate(fullGeneration?.next_retry_at);
  const isFullGenerationWaiting = fullGeneration?.stage === "waiting";

  // --- RESEARCH ---
  const progressScore =
    (book.outline_file ? 25 : 0) +
    (stats.chapter_count > 0 ? 25 : 0) +
    (stats.research_count > 0 ? 25 : 0) +
    (stats.export_count > 0 ? 25 : 0);

  const nextStep = !book.outline_file
    ? { label: "Generate Outline", tab: "writing" as WorkspaceTab, desc: "Don't start chapter generation before building the book's backbone." }
    : stats.chapter_count === 0
    ? { label: "Generate First Chapter", tab: "writing" as WorkspaceTab, desc: "Outline is ready, now it's time to produce content." }
    : stats.export_count === 0
    ? { label: "Get EPUB", tab: "publish" as WorkspaceTab, desc: "Your first goal should be getting the EPUB and checking the structure." }
    : { label: "Get New Version", tab: "publish" as WorkspaceTab, desc: "Improve cover, research and chapter quality." };

  return (
    <AppFrame
      current="workspace"
      layout="book"
      currentBookSlug={slug}
      title={draft.title || "Book"}
      subtitle={isDirty ? "Unsaved changes pending." : "Overview, content production, research and publish delivery in one flow."}
      books={books}
      actions={actions}
    >
      <div className="mb-4 flex items-center justify-end">
        <AutoSaveIndicator
          isDirty={isDirty}
          isSaving={isSaving}
          lastSaved={lastSaved}
          countdown={autoSaveCountdown}
          onSave={() => saveCurrentBook()}
        />
      </div>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WorkspaceTab)}>
        {/* Scrollable tab bar */}
        <div className="relative">
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
          )}
          <div className="overflow-x-auto" ref={tabScrollRef}>
            <TabsList className="w-max min-w-full">
              {tabOptions.map((tab) => (
                <TabsTrigger key={tab} value={tab}>{TAB_LABELS[tab]}</TabsTrigger>
              ))}
            </TabsList>
          </div>
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
          )}
        </div>

        {/* ── HOME ── */}
        <TabsContent value="home" className="mt-6 space-y-6">
          {/* Next Step - Prominent at top */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </div>
                <div className="text-sm font-semibold text-primary">Next Recommended Step</div>
              </div>
              <div className="text-2xl font-bold text-foreground">{nextStep.label}</div>
              <div className="text-sm leading-7 text-muted-foreground">{nextStep.desc}</div>
              <Button className="w-full sm:w-auto" onClick={() => setActiveTab(nextStep.tab)}>
                {nextStep.label} →
              </Button>
            </CardContent>
          </Card>

          {/* Stats - Reduced to 3 */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Layers, value: stats.chapter_count, label: "Chapters", desc: "Completed chapters" },
              { icon: FlaskConical, value: stats.research_count, label: "Research", desc: "Research files" },
              { icon: BarChart3, value: stats.export_count, label: "Exports", desc: "Generated outputs" },
            ].map(({ icon: Icon, value, label, desc }) => (
              <Card key={label}>
                <CardContent className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-3xl font-bold text-foreground">{value}</div>
                    <div className="mt-0.5 text-sm font-medium text-foreground">{label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress bar - More prominent */}
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold text-foreground">Book Progress</div>
                  <div className="mt-1 text-sm text-muted-foreground">Overall completion status</div>
                </div>
                <div className="text-3xl font-bold text-primary">{progressScore}%</div>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progressScore}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {[
                  { label: "Outline", done: !!book.outline_file },
                  { label: "Chapters", done: stats.chapter_count > 0 },
                  { label: "Research", done: stats.research_count > 0 },
                  { label: "Output", done: stats.export_count > 0 },
                ].map(({ label, done }) => (
                  <div key={label} className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full", done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    {done ? <Check className="size-3" /> : <div className="size-3 rounded-full border-2 border-current" />}
                    <span className="font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BOOK ── */}
        <TabsContent value="book" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              {/* Book Information */}
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-5 text-primary" />
                    <div className="text-base font-semibold text-foreground">Book Information</div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2"><Label>Title</Label><Input value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} placeholder="Enter book title" /></div>
                    <div className="md:col-span-2"><Label>Subtitle</Label><Input value={draft.subtitle || ""} onChange={(e) => updateDraft({ subtitle: e.target.value })} placeholder="Optional subtitle" /></div>
                    <div><Label>ISBN</Label><Input value={draft.isbn || ""} onChange={(e) => updateDraft({ isbn: e.target.value })} placeholder="978-0-0000-0000-0" /></div>
                    <div><Label>Year</Label><Input value={draft.year || ""} onChange={(e) => updateDraft({ year: e.target.value })} placeholder="2026" /></div>
                  </div>
                </CardContent>
              </Card>

              {/* Author Information */}
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="text-xs font-bold">A</span>
                    </div>
                    <div className="text-base font-semibold text-foreground">Author Information</div>
                  </div>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="md:col-span-2"><Label>Author Name</Label><Input value={draft.author || ""} onChange={(e) => updateDraft({ author: e.target.value })} placeholder="Full author name" /></div>
                    <div className="md:col-span-2"><Label>Publisher</Label><Input value={draft.publisher || ""} onChange={(e) => updateDraft({ publisher: e.target.value })} placeholder="Publisher name" /></div>
                    <div className="md:col-span-2">
                      <Label>Author Biography</Label>
                      <Textarea value={draft.author_bio || ""} onChange={(e) => updateDraft({ author_bio: e.target.value })} placeholder="Brief author biography for the book cover" rows={3} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Branding */}
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-primary" />
                    <div className="text-base font-semibold text-foreground">Branding & Cover</div>
                  </div>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div><Label>Branding / Wordmark</Label><Input value={draft.branding_mark || ""} onChange={(e) => updateDraft({ branding_mark: e.target.value })} placeholder="Brand or series name" /></div>
                    <div><Label>Logo URL</Label><Input value={draft.branding_logo_url || ""} onChange={(e) => updateDraft({ branding_logo_url: e.target.value })} placeholder="https://..." /></div>
                    <div className="md:col-span-2"><Label>Cover Emphasis</Label><Input value={draft.cover_brief || ""} onChange={(e) => updateDraft({ cover_brief: e.target.value })} placeholder="Key visual elements for cover design" /></div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm">
                        <div className="font-medium text-foreground">Upload Brand Logo</div>
                        <div className="mt-1 text-muted-foreground">PNG, JPG or WebP up to 4MB</div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void handleLogoUpload(file);
                            }
                            event.currentTarget.value = "";
                          }}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                          <ImagePlus className="mr-2 size-4" />
                          Upload
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            triggerWorkflow({
                              action: "cover_script",
                              title: draft.title,
                              author: draft.author,
                              genre: "non-fiction",
                            }).catch((error) => addToast(error instanceof Error ? error.message : "Cover generation failed.", "error"))
                          }
                        >
                          <Sparkles className="mr-2 size-4" />
                          Generate Cover
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cover Preview */}
            <Card>
              <CardContent className="space-y-4">
                <div className="text-sm font-medium text-foreground">Cover Preview</div>
                <BookMockup
                  title={draft.title}
                  subtitle={draft.subtitle || ""}
                  author={draft.author || ""}
                  brand={draft.branding_mark || draft.publisher || ""}
                  logoUrl={draft.branding_logo_url ? buildBookAssetUrl(slug, draft.branding_logo_url) : undefined}
                  imageUrl={draft.cover_image ? buildBookAssetUrl(slug, draft.cover_image) : undefined}
                  accentLabel={draft.cover_brief || "Pre-sale product preview"}
                  size="md"
                />
                {draft.branding_logo_url && (
                  <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Active Logo</div>
                    <img
                      src={buildBookAssetUrl(slug, draft.branding_logo_url)}
                      alt={`${draft.branding_mark || draft.publisher || "Brand"} logo`}
                      className="h-12 w-auto max-w-[160px] rounded-md bg-background object-contain p-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chapters Summary */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">Chapters</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {draft.chapters.length} {draft.chapters.length === 1 ? 'chapter' : 'chapters'} in this book
                  </div>
                </div>
                <Button variant="outline" onClick={() => setActiveTab("writing")}>
                  Go to Writing Tab →
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── WRITING ── */}
        <TabsContent value="writing" className="mt-6 space-y-6">
          {/* Writing Sub-Tabs */}
          <Tabs value={writingSubTab} onValueChange={(value) => setWritingSubTab(value as typeof writingSubTab)}>
            <div className="overflow-x-auto">
              <TabsList className="w-max min-w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Sub-Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              <WritingDashboard chapters={draft.chapters} targetWords={2000} />

              <div className="grid gap-6 lg:grid-cols-2">
                <TimeTracker
                  slug={slug}
                  chapterIndex={activeChapter}
                  chapterTitle={draft.chapters[activeChapter]?.title || `Chapter ${activeChapter + 1}`}
                  onSessionComplete={(session) => {
                    addToast(`Session saved: ${Math.round(session.duration / 60)} minutes`, 'success');
                  }}
                />
                <GoalTracker slug={slug} chapters={draft.chapters} />
              </div>
            </TabsContent>

            {/* Editor Sub-Tab */}
            <TabsContent value="editor" className="mt-6 space-y-6">
              <ChapterTemplates
                onApplyTemplate={(template) => {
                  if (activeChapter < draft.chapters.length) {
                    const chapters = [...draft.chapters];
                    chapters[activeChapter] = {
                      ...chapters[activeChapter],
                      content: template.content,
                    };
                    updateDraft({ chapters });
                    addToast(`Template "${template.name}" applied.`, 'success');
                  }
                }}
              />

              <ChapterEditor
                chapters={draft.chapters}
                targetWords={2000}
                slug={slug}
                author={draft.author || "Author"}
                onUpdate={(chapters) => updateDraft({ chapters })}
                onChapterAction={(action, index) => {
                  if (action === "add") {
                    addToast("Chapter added.", "success");
                  } else if (action === "duplicate") {
                    addToast("Chapter duplicated.", "success");
                  } else if (action === "delete") {
                    addToast("Chapter deleted.", "success");
                  } else if (action === "move") {
                    addToast("Chapter reordered.", "success");
                  }
                }}
              />
            </TabsContent>

            {/* Analytics Sub-Tab */}
            <TabsContent value="analytics" className="mt-6 space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-foreground">AI Workflows</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Generate content and analyze your book with AI assistance</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      disabled={isGeneratingOutline}
                      onClick={async () => {
                        setIsGeneratingOutline(true);
                        try {
                          await triggerWorkflow({
                            action: "outline_generate",
                            topic: draft.title,
                            title: draft.title,
                            subtitle: draft.subtitle,
                            language: draft.language,
                            author: draft.author,
                            publisher: draft.publisher,
                            description: draft.description,
                            genre: "non-fiction",
                            audience: "general readers",
                            style: "clear and practical",
                            tone: "professional",
                            year: draft.year,
                          });
                        } finally {
                          setIsGeneratingOutline(false);
                        }
                      }}
                      className={isGeneratingOutline ? "cursor-not-allowed opacity-70" : ""}
                    >
                      {isGeneratingOutline ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
                      {isGeneratingOutline ? "Generating..." : "Generate Outline"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={isGeneratingChapter}
                      onClick={async () => {
                        setIsGeneratingChapter(true);
                        try {
                          await triggerWorkflow({
                            action: "chapter_generate",
                            chapter_number: activeChapter + 1,
                            chapter_title: draft.chapters[activeChapter]?.title || `Ch. ${activeChapter + 1}`,
                            min_words: 1600,
                            max_words: 2200,
                            style: "clear",
                            tone: "professional",
                          });
                        } finally {
                          setIsGeneratingChapter(false);
                        }
                      }}
                      className={isGeneratingChapter ? "cursor-not-allowed opacity-70" : ""}
                    >
                      {isGeneratingChapter ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      {isGeneratingChapter ? "Generating..." : `Generate Ch. ${activeChapter + 1}`}
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={isReviewing}
                      onClick={async () => {
                        setIsReviewing(true);
                        try {
                          await triggerWorkflow({
                            action: "chapter_review",
                            chapter_number: activeChapter + 1,
                          });
                        } finally {
                          setIsReviewing(false);
                        }
                      }}
                      className={isReviewing ? "cursor-not-allowed opacity-70" : ""}
                    >
                      {isReviewing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      {isReviewing ? "Reviewing..." : "Review"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <OutlinePreview
                chapterPlan={draft.chapter_plan}
                outlineFile={book.outline_file}
                onEdit={() => setActiveTab("book")}
                onRegenerate={() => triggerWorkflow({
                  action: "outline_generate",
                  topic: draft.title,
                  title: draft.title,
                  subtitle: draft.subtitle,
                  language: draft.language,
                  author: draft.author,
                  publisher: draft.publisher,
                  description: draft.description,
                  genre: "non-fiction",
                  audience: "general readers",
                  style: "clear and practical",
                  tone: "professional",
                  year: draft.year,
                }).catch((error) => addToast(error instanceof Error ? error.message : "Outline generation failed.", "error"))}
                onExport={() => {
                  addToast("Outline export coming soon!", "info");
                }}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── RESEARCH ── */}
        <TabsContent value="research" className="mt-6 space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">Market Research Tools</h3>
                <p className="mt-1 text-sm text-muted-foreground">Analyze your book's market potential and discover profitable opportunities</p>
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <Input
                  value={researchTopic}
                  onChange={(event) => setResearchTopic(event.target.value)}
                  placeholder="Enter your book topic or keywords..."
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={() => triggerWorkflow({ action: "market_analyzer", topic: researchTopic }).catch((error) => addToast(error instanceof Error ? error.message : "KDP Analysis failed.", "error"))}
                  className="justify-start"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                      <BarChart3 className="size-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-foreground">KDP Analysis</div>
                      <div className="text-xs text-muted-foreground">Analyze market competition</div>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => triggerWorkflow({ action: "keyword_research", keywords: [researchTopic] }).catch((error) => addToast(error instanceof Error ? error.message : "Keywords failed.", "error"))}
                  className="justify-start"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                      <FlaskConical className="size-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-foreground">Keywords</div>
                      <div className="text-xs text-muted-foreground">Find high-value keywords</div>
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => triggerWorkflow({ action: "topic_finder", topic: researchTopic }).catch((error) => addToast(error instanceof Error ? error.message : "Topic Finder failed.", "error"))}
                  className="justify-start"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                      <Layers className="size-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-foreground">Topic Finder</div>
                      <div className="text-xs text-muted-foreground">Discover trending topics</div>
                    </div>
                  </div>
                </Button>
                <Button
                  onClick={() => triggerWorkflow({ action: "research_insights", focus: researchTopic }).catch((error) => addToast(error instanceof Error ? error.message : "AI Suggestion failed.", "error"))}
                  className="justify-start"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="size-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-foreground">AI Suggestion</div>
                      <div className="text-xs text-muted-foreground">Get AI-powered insights</div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <EnhancedFileList
            files={book.resources?.research || []}
            fileType="research"
            onDownload={(file) => {
              const url = buildAssetUrl(file.url);
              window.open(url, '_blank');
            }}
            onPreview={(file) => {
              const url = buildAssetUrl(file.url);
              window.open(url, '_blank');
            }}
          />
        </TabsContent>

        {/* ── PUBLISH ── */}
        <TabsContent value="publish" className="mt-6 space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
            <div className="space-y-6">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Export Your Book</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Generate publication-ready EPUB and PDF files, then review them inline without leaving the workspace.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Button
                      variant="outline"
                      className="gap-2 border-warning/50 text-warning hover:bg-warning/10"
                      onClick={async () => {
                        const toastId = addToast("Running pre-check...", "loading");
                        try {
                          const response = await preflightBook(slug, { action: "build", format: "epub" });
                          const message = response.ok
                            ? "Build path is ready."
                            : String(response.reason || response.missing || "Build is not ready.");
                          updateToast(toastId, message, response.ok ? "success" : "error");
                        } catch (error) {
                          updateToast(toastId, error instanceof Error ? error.message : "Pre-check failed.", "error");
                        }
                      }}
                    >
                      <Check className="size-4" />
                      <div className="text-left">
                        <div className="font-medium">Pre-check</div>
                        <div className="text-xs opacity-70">Validate covers, Vertex, and exporter</div>
                      </div>
                    </Button>

                    <Button
                      className="gap-2"
                      onClick={() => triggerBuild("epub").catch((error) => addToast(error instanceof Error ? error.message : "EPUB generation failed.", "error"))}
                    >
                      <BookOpen className="size-4" />
                      <div className="text-left">
                        <div className="font-medium">Get EPUB</div>
                        <div className="text-xs opacity-70">Embedded e-book preview</div>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => triggerBuild("pdf").catch((error) => addToast(error instanceof Error ? error.message : "PDF generation failed.", "error"))}
                    >
                      <FileText className="size-4" />
                      <div className="text-left">
                        <div className="font-medium">Get PDF</div>
                        <div className="text-xs opacity-70">Print-ready preview</div>
                      </div>
                    </Button>
                  </div>

                  {fullGeneration ? (
                    <div className={cn(
                      "rounded-2xl border px-4 py-3",
                      isFullGenerationWaiting
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-border/70 bg-muted/20",
                    )}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-border/70 bg-background text-foreground">
                          {humanizeModeLabel(fullGeneration.chapter_generation_mode, "Three Pass Compact")}
                        </Badge>
                        {isFullGenerationWaiting ? (
                          <Badge className="border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            Waiting To Retry
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-2 text-sm font-medium text-foreground">
                        {fullGeneration.message || "Generation status unavailable."}
                      </div>
                      <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                        <div>
                          Progress
                          <div className="mt-1 font-medium text-foreground">
                            {readyChapterCount} / {targetChapterCount} chapters
                          </div>
                        </div>
                        <div>
                          Current segment
                          <div className="mt-1 font-medium text-foreground">
                            {fullGeneration.current_chapter ? `Chapter ${fullGeneration.current_chapter}` : "Idle"}
                            {fullGeneration.segment_count ? ` · ${fullGeneration.segment_index || 0}/${fullGeneration.segment_count}` : ""}
                          </div>
                        </div>
                        <div>
                          Next retry
                          <div className="mt-1 font-medium text-foreground">
                            {nextRetryLabel || "Not scheduled"}
                          </div>
                        </div>
                      </div>
                      {fullGeneration.pause_reason ? (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Pause reason: <span className="font-medium text-foreground">{fullGeneration.pause_reason}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Live Output Preview</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        The latest generated PDF or EPUB opens here automatically after each successful build.
                      </p>
                    </div>
                    {selectedExportFile ? (
                      <div className="flex items-center gap-2">
                        <Badge className="border-border/70 bg-background text-foreground">
                          {selectedExportFormat === "pdf" ? "PDF" : selectedExportFormat === "epub" ? "EPUB" : "Export"}
                        </Badge>
                        <a href={buildAssetUrl(selectedExportFile.url)} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="mr-1.5 size-3.5" />
                            Open
                          </Button>
                        </a>
                        <a href={buildAssetUrl(selectedExportFile.url)} download>
                          <Button size="sm">
                            <Download className="mr-1.5 size-3.5" />
                            Download
                          </Button>
                        </a>
                      </div>
                    ) : null}
                  </div>

                  {selectedExportFile ? (
                    selectedExportFormat === "pdf" ? (
                      <div className="overflow-hidden rounded-2xl border border-border/70 bg-white">
                        <iframe
                          title={selectedExportFile.name}
                          src={`${buildAssetUrl(selectedExportFile.url)}#toolbar=0&view=FitH`}
                          className="h-[780px] w-full"
                        />
                      </div>
                    ) : selectedExportFormat === "epub" ? (
                      <EpubReaderPreview url={buildAssetUrl(selectedExportFile.url)} />
                    ) : null
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-10 text-center">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                        <Upload className="size-5 text-muted-foreground" />
                      </div>
                      <div className="mt-4 text-sm font-medium text-foreground">No preview selected yet</div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Generate EPUB or PDF to open the newest output directly inside the workspace.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Selected Cover For Export</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      The active variant below is the exact cover bundle that the build pipeline exports.
                    </p>
                  </div>

                  {selectedCoverVariant ? (
                    <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-border/70 bg-background text-foreground">{selectedCoverVariant.label}</Badge>
                        <Badge className="border-border/70 bg-background text-foreground">{selectedCoverVariant.provider || "vertex"}</Badge>
                        <Badge className="border-border/70 bg-background text-foreground">{selectedCoverVariant.render_mode || "ai-signature"}</Badge>
                        <Badge className="border-border/70 bg-background text-foreground">{humanizeModeLabel(currentDraft.cover_style_mode, "Bookstore Bold")}</Badge>
                        <Badge className="border-border/70 bg-background text-foreground">{humanizeModeLabel(coverMode, "Full Ai Front")}</Badge>
                        <Badge className="border-border/70 bg-background text-foreground">{humanizeModeLabel(styleDirection, "Genre Split")}</Badge>
                        <Badge className={cn(
                          "border-border/70 bg-background text-foreground"
                        )}>
                          {humanizeModeLabel(coverTextStrategy, "Full Ai Front")}
                        </Badge>
                        <Badge className={cn(
                          "border-transparent",
                          textSafeZoneStatus === "pass"
                            ? "bg-green-500/15 text-green-700 dark:text-green-400"
                            : textSafeZoneStatus === "fail"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {textSafeZoneStatus === "pass"
                            ? "Safe Zone Passed"
                            : textSafeZoneStatus === "fail"
                            ? "Safe Zone Failed"
                            : "Safe Zone Pending"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Family: <span className="font-medium text-foreground">{selectedCoverVariant.family}</span></div>
                        <div>Template: <span className="font-medium text-foreground">{selectedCoverVariant.template || "reference-classic"}</span></div>
                        <div>Layout: <span className="font-medium text-foreground">{selectedCoverVariant.layout || "auto"}</span></div>
                        <div>Wrap scope: <span className="font-medium text-foreground">{humanizeModeLabel(wrapScope, "Ai Front Only")}</span></div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                          Book length mode
                          <div className="mt-1 text-sm font-semibold text-foreground">
                            {humanizeModeLabel(currentDraft.book_length_mode, "25K Standard")}
                          </div>
                        </div>
                        <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                          Word target
                          <div className="mt-1 text-sm font-semibold text-foreground">
                            {formatWordCount(currentWordCount)} / {formatWordCount(targetWordCount)}
                          </div>
                        </div>
                        <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                          Chapter progress
                          <div className="mt-1 text-sm font-semibold text-foreground">
                            {readyChapterCount} / {targetChapterCount}
                          </div>
                        </div>
                        <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                          Pair score
                          <div className="mt-1 text-sm font-semibold text-foreground">
                            {coverPairScore ? coverPairScore.toFixed(1) : "Pending"}
                          </div>
                        </div>
                        <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                          Cover confidence
                          <div className="mt-1 text-sm font-semibold text-foreground">
                            {selectedCoverConfidence ? `${Math.round(selectedCoverConfidence * 100)}%` : "Pending"}
                          </div>
                        </div>
                        <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                          Back-cover mode
                          <div className="mt-1 text-sm font-semibold text-foreground">
                            {humanizeModeLabel(currentDraft.back_cover_mode, "Minimal Blurb")}
                          </div>
                        </div>
                        <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                          Quality gate
                          <div className="mt-1 text-sm font-semibold text-foreground">
                            {humanizeModeLabel(qualityGate, "Best Available")}
                          </div>
                        </div>
                        <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                          Generation mode
                          <div className="mt-1 text-sm font-semibold text-foreground">
                            {humanizeModeLabel(currentDraft.chapter_generation_mode, "Three Pass Compact")}
                          </div>
                        </div>
                        <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                          Visual grade
                          <div className="mt-1 text-sm font-semibold text-foreground">
                            {frontVisualGrade || "Pending"}
                          </div>
                        </div>
                        <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                          Genre fit
                          <div className="mt-1 text-sm font-semibold text-foreground">
                            {frontGenreFitScore || "Pending"}
                          </div>
                        </div>
                        <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                          Rejected variants
                          <div className="mt-1 text-sm font-semibold text-foreground">
                            {rejectedVariantCount}
                          </div>
                        </div>
                        <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                          PDF opening
                          <div className="mt-1 text-sm font-semibold text-foreground">
                            {openingSequenceValid === true ? "Verified" : openingSequenceValid === false ? "Needs Fix" : "Pending"}
                          </div>
                        </div>
                      </div>
                      {(selectedCoverFrontUrl || selectedCoverBackUrl) ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {selectedCoverFrontUrl ? (
                            <div className="overflow-hidden rounded-2xl border border-border/70 bg-background">
                              <div className="border-b border-border/70 px-3 py-2 text-xs font-medium text-muted-foreground">Front cover</div>
                              <img
                                src={selectedCoverFrontUrl}
                                alt={`${currentDraft.title} front cover`}
                                className="aspect-[2/3] w-full object-cover"
                              />
                            </div>
                          ) : null}
                          {selectedCoverBackUrl ? (
                            <div className="overflow-hidden rounded-2xl border border-border/70 bg-background">
                              <div className="border-b border-border/70 px-3 py-2 text-xs font-medium text-muted-foreground">Back cover</div>
                              <img
                                src={selectedCoverBackUrl}
                                alt={`${currentDraft.title} back cover`}
                                className="aspect-[2/3] w-full object-cover"
                              />
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {selectedCoverValidation && coverTextStrategy !== "local_overlay" ? (
                        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                          <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                            Title score
                            <div className="mt-1 text-sm font-semibold text-foreground">
                              {selectedCoverValidation.titleScore ?? 0}
                            </div>
                          </div>
                          <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                            Subtitle score
                            <div className="mt-1 text-sm font-semibold text-foreground">
                              {selectedCoverValidation.subtitleScore ?? 0}
                            </div>
                          </div>
                          <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                            Author score
                            <div className="mt-1 text-sm font-semibold text-foreground">
                              {selectedCoverValidation.authorScore ?? 0}
                            </div>
                          </div>
                          <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                            Text score
                            <div className="mt-1 text-sm font-semibold text-foreground">
                              {frontTextValidationScore ? frontTextValidationScore.toFixed(2) : "Pending"}
                            </div>
                          </div>
                          <div className="rounded-xl bg-background px-3 py-2 text-xs text-muted-foreground">
                            AI attempts
                            <div className="mt-1 text-sm font-semibold text-foreground">
                              {frontAiAttemptCount || "Pending"}
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {!!selectedCoverHardRejects.length && (
                        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                          {selectedCoverHardRejects.join(" ")}
                        </div>
                      )}
                      {!!selectedCoverVariant.rejection_reasons?.length && (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                          {selectedCoverVariant.rejection_reasons.join(" ")}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                      No cover variant has been selected yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Export History</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Select an EPUB or PDF to preview it inline.</p>
                  </div>

                  <div className="space-y-3">
                    {exportFiles.length ? (
                      exportFiles.map((file) => {
                        const format = exportFormatForFile(file);
                        const selected = file.relative_path === selectedExportFile?.relative_path;
                        const url = buildAssetUrl(file.url);
                        return (
                          <div
                            key={file.relative_path}
                            className={cn(
                              "rounded-2xl border p-4 transition-colors",
                              selected ? "border-primary/40 bg-primary/5" : "border-border/70 bg-background",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedExportRelativePath(file.relative_path)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge className="border-border/70 bg-background text-foreground">{format?.toUpperCase()}</Badge>
                                  <span className="truncate text-sm font-medium text-foreground">{file.name}</span>
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground">{file.modified || file.relative_path}</div>
                              </button>
                              <div className="flex shrink-0 items-center gap-2">
                                <a href={url} target="_blank" rel="noreferrer">
                                  <Button variant="outline" size="sm">
                                    <ExternalLink className="mr-1.5 size-3.5" />
                                    Open
                                  </Button>
                                </a>
                                <a href={url} download>
                                  <Button size="sm">
                                    <Download className="mr-1.5 size-3.5" />
                                    Save
                                  </Button>
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
                        <div className="text-sm font-medium text-foreground">No exports yet</div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Build EPUB or PDF to populate the embedded preview list.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

      </Tabs>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        open={showKeyboardHelp}
        onOpenChange={setShowKeyboardHelp}
      />

      {/* Keyboard Help Button */}
      <button
        onClick={() => setShowKeyboardHelp(true)}
        className="fixed bottom-6 right-6 z-40 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Show keyboard shortcuts"
      >
        <Keyboard className="size-5" />
      </button>
    </AppFrame>
  );
}
