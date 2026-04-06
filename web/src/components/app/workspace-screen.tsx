"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Check, Download, FileText, FlaskConical, ImagePlus, Layers, Loader2, Sparkles, Upload, X } from "lucide-react";

import { AppFrame } from "@/components/app/app-frame";
import { BackendUnavailableState } from "@/components/app/backend-unavailable-state";
import { BookMockup } from "@/components/books/book-mockup";
import { ReferralBanner } from "@/components/app/referral-banner";
import { ReferralShareDialog, hasReferralDialogBeenShown } from "@/components/app/referral-share-dialog";
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

  selectBookCoverVariant,
  uploadBookAsset,
  type Artifact,
  type Book,
  type CoverVariant,

} from "@/lib/dashboard-api";
import { useSessionGuard } from "@/lib/use-session-guard";
import { cn } from "@/lib/utils";

const tabOptions = ["home", "book", "writing", "research", "publish"] as const;
type WorkspaceTab = (typeof tabOptions)[number];

const TAB_LABELS: Record<WorkspaceTab, string> = {
  home: "Genel",
  book: "Book",
  writing: "Content",
  research: "Research",
  publish: "Yayın",
};

function normalizeTab(tab?: string): WorkspaceTab {
  return tab && tabOptions.includes(tab as WorkspaceTab) ? (tab as WorkspaceTab) : "home";
}

function coverGenreLabel(genre?: string) {
  switch (genre) {
    case "business-marketing":
      return "Business & Marketing";
    case "expertise-authority":
      return "Expertise & Authority";
    case "ai-systems":
      return "AI & Systems";
    case "education":
      return "Education";
    case "personal-development":
      return "Personal Development";
    case "children-illustrated":
      return "Children & Illustrated";
    default:
      return "Adaptive";
  }
}

function coverPickerSummary(book: Book | null) {
  const branch = book?.cover_branch || "nonfiction";
  const genre = coverGenreLabel(book?.cover_genre);
  const variantCount = Array.isArray(book?.cover_variants) ? book.cover_variants.length : 0;
  if (variantCount <= 1) {
    return "The system first generates 1 front + 1 back cover concept. If you don't like it, you can get an alternative set with AI regenerate.";
  }
  if (book?.cover_text_strategy === "hybrid-ai-text") {
    return `This book operates in hybrid cover mode. The system generates 2 AI text suggestions: Signature tries the full title layout directly from the model, Minimal tries a simpler typography, and Exact always uses our error-free studio layout.`;
  }
  if (branch === "children") {
    return `This book operates in the ${genre.toLowerCase()} line. The system generates more cheerful Storyworld, more educational Learning Adventure, and softer Bedtime Calm suggestions; the variant you choose is reflected directly in the export and sales surface.`;
  }
  return `This book operates in the ${genre.toLowerCase()} line. The system suggests 3 covers based on the genre: one more directly commercial, one more premium/editorial, and one that reads warmer or more modern depending on the sub-topic. The variant you choose is reflected directly in the export and sales surface.`;
}

function coverRenderModeLabel(mode?: string) {
  switch (mode) {
    case "ai-signature":
      return "Signature";
    case "ai-minimal":
      return "Minimal";
    case "studio-exact":
      return "Exact";
    case "studio-exact-fallback":
      return "Studio Fallback";
    default:
      return "";
  }
}

function coverValidationSummary(variant: CoverVariant) {
  const validation = variant.text_validation;
  if (!validation) return "";
  if (variant.render_mode === "studio-exact-fallback") {
    return "AI text was attempted but did not pass the verification threshold; studio exact is used as a safe fallback.";
  }
  if (variant.render_mode === "ai-signature" || variant.render_mode === "ai-minimal") {
    if (validation.valid) {
      return "OCR doğrulaması geçti. Bu varyantta kapak yazısı doğrudan model tarafından üretildi.";
    }
    return "AI text denemesi yapıldı ama doğrulama tamamlanmadı.";
  }
  return "Bu varyantta başlık ve yazar her zaman studio compositor ile tam yerleştirilir.";
}

function countWords(text?: string) {
  return String(text || "").split(/\s+/).filter(Boolean).length;
}

function formatCompactWordCount(count: number) {
  if (count >= 10_000) return `${Math.round(count / 1_000)}k`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
}

function latestExportArtifact(files: Artifact[], format: "epub" | "pdf") {
  const extension = `.${format}`;
  return (
    [...files]
      .filter((file) => {
        const name = String(file.name || "").toLowerCase();
        const relativePath = String(file.relative_path || "").toLowerCase();
        return name.endsWith(extension) || relativePath.endsWith(extension);
      })
      .sort(
        (left, right) =>
          new Date(left.modified || 0).getTime() - new Date(right.modified || 0).getTime(),
      )
      .at(-1) || null
  );
}

function downloadArtifact(file: Artifact) {
  const link = document.createElement("a");
  link.href = buildAssetUrl(file.url);
  link.download = file.name || "";
  link.target = "_blank";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// ─── Toast ───────────────────────────────────────────────────────────────────
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

function CoverVariantCard({
  slug,
  variant,
  selected,
  selecting,
  onSelect,
}: {
  slug: string;
  variant: CoverVariant;
  selected: boolean;
  selecting?: boolean;
  onSelect: () => void;
}) {
  const frontUrl = buildBookAssetUrl(slug, variant.front_image);
  const backUrl = variant.back_image ? buildBookAssetUrl(slug, variant.back_image) : undefined;
  const validation = variant.text_validation;
  const hasValidationScores =
    typeof validation?.titleScore === "number" ||
    typeof validation?.subtitleScore === "number" ||
    typeof validation?.authorScore === "number";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={selecting}
      className={cn(
        "group rounded-[28px] border p-4 text-left transition disabled:cursor-wait disabled:opacity-80",
        selected
          ? "border-primary/50 bg-primary/5 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.35)]"
          : "border-border/80 bg-background hover:border-primary/25 hover:bg-accent/30",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">{variant.label}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {variant.genre ? coverGenreLabel(variant.genre) : variant.family}
            {typeof variant.score === "number" ? ` · ${variant.score.toFixed(1)}` : ""}
          </div>
          {variant.genre || variant.motif ? (
            <div className="mt-1 text-[11px] text-muted-foreground">
              {[coverGenreLabel(variant.genre), variant.motif].filter(Boolean).join(" · ")}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {variant.render_mode ? (
            <Badge className="border-primary/20 bg-primary/5 text-primary">
              {coverRenderModeLabel(variant.render_mode)}
            </Badge>
          ) : null}
          {validation?.valid ? (
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              Text Verified
            </Badge>
          ) : null}
          {variant.recommended ? (
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              Recommended
            </Badge>
          ) : null}
          {selected ? <Badge>Seçili</Badge> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_88px]">
        <div className="overflow-hidden rounded-[22px] border border-border/70 bg-muted/20">
          <img
            src={frontUrl}
            alt={`${variant.label} kapak varyantı`}
            className="aspect-[2/3] h-full w-full object-cover transition duration-300 group-hover:scale-[1.015]"
          />
        </div>
        <div className="space-y-3">
          {backUrl ? (
            <div className="overflow-hidden rounded-[20px] border border-border/70 bg-muted/20">
              <img src={backUrl} alt={`${variant.label} arka kapak`} className="aspect-[2/3] h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center rounded-[20px] border border-dashed border-border/70 bg-muted/20 px-3 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Back
            </div>
          )}
          <div className="rounded-2xl border border-border/70 bg-background/70 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Template</div>
            <div className="mt-1 text-xs font-medium text-foreground">{variant.template || "Adaptive"}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border/70 bg-background/60 px-3 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Render</div>
        <div className="mt-2 text-xs leading-6 text-muted-foreground">{coverValidationSummary(variant)}</div>
        {hasValidationScores ? (
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-foreground/80">
            {typeof validation?.titleScore === "number" ? <span className="rounded-full border border-border/70 px-2 py-1">Title {validation.titleScore.toFixed(2)}</span> : null}
            {typeof validation?.subtitleScore === "number" && variant.render_mode === "ai-signature" ? (
              <span className="rounded-full border border-border/70 px-2 py-1">Subtitle {validation.subtitleScore.toFixed(2)}</span>
            ) : null}
            {typeof validation?.authorScore === "number" ? <span className="rounded-full border border-border/70 px-2 py-1">Author {validation.authorScore.toFixed(2)}</span> : null}
          </div>
        ) : null}
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
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
  const [selectingCoverVariantId, setSelectingCoverVariantId] = useState("");
  const [activeChapter, setActiveChapter] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const frontCoverInputRef = useRef<HTMLInputElement | null>(null);
  const backCoverInputRef = useRef<HTMLInputElement | null>(null);

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
      addToast(error instanceof Error ? error.message : "Yükleme başarısız.", "error");
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

  // Auto-save: trigger 30s after last change
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
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
    const toastId = addToast("Otomatik kaydediliyor...", "loading");
    try {
      const saved = await saveBook(draft);
      setBook(saved);
      setDraft(saved);
      setIsDirty(false);
      updateToast(toastId, "Otomatik kaydedildi.", "success");
    } catch {
      updateToast(toastId, "Otomatik kayıt başarısız.", "error");
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
  }

  async function saveCurrentBook() {
    if (!draft) return;
    setIsSaving(true);
    const toastId = addToast("Kaydediliyor...", "loading");
    try {
      const saved = await saveBook(draft);
      setBook(saved);
      setDraft(saved);
      await refresh();
      setIsDirty(false);
      updateToast(toastId, "Book saved.", "success");
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        setBackendUnavailable(true);
        dismissToast(toastId);
        return;
      }
      updateToast(toastId, error instanceof Error ? error.message : "Kaydetme başarısız.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSelectCoverVariant(variant: CoverVariant) {
    if (selectingCoverVariantId || !slug) return;
    setSelectingCoverVariantId(variant.id);
    const toastId = addToast("Kapak seçimi kaydediliyor...", "loading");
    try {
      const response = await selectBookCoverVariant(slug, variant.id);
      setBook(response.book);
      setDraft(response.book);
      setIsDirty(false);
      trackEvent("cover_variant_selected", { slug, variantId: variant.id, renderMode: variant.render_mode || "" });
      updateToast(toastId, "Kapak seçimi kaydedildi.", "success");
    } catch (error) {
      updateToast(toastId, error instanceof Error ? error.message : "Kapak seçimi kaydedilemedi.", "error");
    } finally {
      setSelectingCoverVariantId("");
    }
  }

  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      addToast("Yalnızca görsel dosyası yükleyebilirsin.", "error");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      addToast("Logo dosyası 4 MB'den küçük olmalı.", "error");
      return;
    }

    const toastId = addToast("Logo yükleniyor...", "loading");
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
      updateToast(toastId, "Logo yüklendi ve markaya bağlandı.", "success");
    } catch (error) {
      updateToast(toastId, error instanceof Error ? error.message : "Logo yüklenemedi.", "error");
    }
  }

  async function handleCoverUpload(file: File, kind: "cover_image" | "back_cover_image") {
    if (!file.type.startsWith("image/")) {
      addToast("Kapak için yalnızca görsel dosyası yükleyebilirsin.", "error");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      addToast("Kapak dosyası 12 MB'den küçük olmalı.", "error");
      return;
    }

    const toastId = addToast(kind === "cover_image" ? "Ön kapak yükleniyor..." : "Arka kapak yükleniyor...", "loading");
    try {
      const uploaded = await uploadBookAsset(slug, file, kind);
      setBook(uploaded.book);
      setDraft(uploaded.book);
      setIsDirty(false);
      updateToast(
        toastId,
        kind === "cover_image" ? "Ön kapak yüklendi." : "Arka kapak yüklendi.",
        "success",
      );
    } catch (error) {
      updateToast(toastId, error instanceof Error ? error.message : "Kapak yüklenemedi.", "error");
    }
  }

  if (!ready) return null;
  if (backendUnavailable) {
    return (
      <AppFrame
        current="workspace"
        layout="book"
        currentBookSlug={slug}
        title="Çalışma alanı"
        subtitle="Bağlantı sorunu oluştu."
        books={books}
      >
        <BackendUnavailableState onRetry={() => void hydrateWorkspace()} />
      </AppFrame>
    );
  }

  if (!draft || !book) return null;
  const currentDraft = draft;
  const coverVariants = currentDraft.cover_variants || [];
  const selectedCoverVariantId =
    currentDraft.selected_cover_variant ||
    currentDraft.recommended_cover_variant ||
    coverVariants[0]?.id ||
    "";

  const actions = [
    { label: "Genel", description: "Ana ilerleme özeti", run: () => setActiveTab("home") },
    { label: "Book", description: "Title and chapter outline", run: () => setActiveTab("book") },
    { label: "İçerik", description: "Outline ve bölüm yazımı", run: () => setActiveTab("writing") },
    { label: "Araştırma", description: "KDP ve anahtar kelime araçları", run: () => setActiveTab("research") },
    { label: "Yayın", description: "EPUB ve PDF teslimi", run: () => setActiveTab("publish") },
    { label: "Kaydet", description: "Kitabı kaydet", run: () => saveCurrentBook() },
  ];

  async function triggerWorkflow(payload: Record<string, unknown>) {
    const toastId = addToast("İşlem çalışıyor...", "loading");
    try {
      const response = await runWorkflow({ slug, ...payload });
      await refresh();
      const summary = responseSummary(response);
      if (response.ok === false) {
        updateToast(toastId, summary.short, "error");
        return;
      }
      updateToast(toastId, summary.short, "success");
      if (payload.action === "outline_generate") trackEvent("outline_generated", { slug });
      if (payload.action === "chapter_generate") trackEvent("first_chapter_generated", { slug });
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        setBackendUnavailable(true);
        dismissToast(toastId);
        return;
      }
      updateToast(toastId, error instanceof Error ? error.message : "İşlem başarısız.", "error");
    }
  }

  async function triggerBuild(format: "epub" | "pdf") {
    const hadExportBefore = Number(currentDraft.status?.export_count || 0) > 0;
    const toastId = addToast("Çıktı hazırlanıyor...", "loading");
    if (format === "pdf") trackEvent("pdf_export_started", { slug });
    if (format === "epub") trackEvent("epub_export_started", { slug });
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
        cover_art_image: currentDraft.cover_art_image,
        cover_image: currentDraft.cover_image,
        back_cover_image: currentDraft.back_cover_image,
        cover_template: currentDraft.cover_template,
        cover_variant_count: currentDraft.cover_variant_count,
        cover_generation_provider: currentDraft.cover_generation_provider,
        cover_composed: currentDraft.cover_composed,
        cover_variants: currentDraft.cover_variants,
        selected_cover_variant: currentDraft.selected_cover_variant,
        recommended_cover_variant: currentDraft.recommended_cover_variant,
        back_cover_variant_family: currentDraft.back_cover_variant_family,
        cover_family: currentDraft.cover_family,
        cover_lab_version: currentDraft.cover_lab_version,
        isbn: currentDraft.isbn,
        year: currentDraft.year,
        fast: currentDraft.fast,
      });
      await refresh();
      const summary = responseSummary(response);
      if (response.ok === false) {
        updateToast(toastId, summary.short, "error");
        return;
      }
      updateToast(toastId, summary.short, "success");
      const responseBook = response.book as { resources?: { exports?: Artifact[] } } | undefined;
      const exportedArtifact =
        latestExportArtifact(summary.produced, format) ||
        latestExportArtifact(responseBook?.resources?.exports || [], format);
      if (exportedArtifact) {
        downloadArtifact(exportedArtifact);
      }
      if (format === "pdf") trackEvent("pdf_export_completed", { slug });
      if (format === "epub") trackEvent("epub_export_completed", { slug });
      if (!hadExportBefore) trackEvent("first_export_success", { slug, format });
      if (!hadExportBefore && !hasReferralDialogBeenShown()) setShowReferralDialog(true);
      if (currentDraft.generate_cover) trackEvent("cover_generated", { slug, format });
    } catch (error) {
      if (isBackendUnavailableError(error)) {
        setBackendUnavailable(true);
        dismissToast(toastId);
        return;
      }
      updateToast(toastId, error instanceof Error ? error.message : "Çıktı oluşturma başarısız.", "error");
    }
  }

  const stats = book.status || {
    chapter_count: currentDraft.chapters.length,
    asset_count: 0,
    extra_count: 0,
    research_count: 0,
    export_count: 0,
  };

  // Progress score: outline(25) + chapters(25 if >0) + research(25 if >0) + export(25 if >0)
  const progressScore =
    (book.outline_file ? 25 : 0) +
    (stats.chapter_count > 0 ? 25 : 0) +
    (stats.research_count > 0 ? 25 : 0) +
    (stats.export_count > 0 ? 25 : 0);

  const nextStep = !book.outline_file
    ? { label: "Outline üret", tab: "writing" as WorkspaceTab, desc: "Kitabın omurgası oluşmadan bölüm üretimine geçme." }
    : stats.chapter_count === 0
    ? { label: "İlk bölümü üret", tab: "writing" as WorkspaceTab, desc: "Outline hazır, şimdi içerik üretme vakti." }
    : stats.export_count === 0
    ? { label: "EPUB al", tab: "publish" as WorkspaceTab, desc: "İlk hedefin EPUB alıp yapıyı kontrol etmek olmalı." }
    : { label: "Yeni sürüm al", tab: "publish" as WorkspaceTab, desc: "Kapak, araştırma ve bölüm kalitesini güçlendir." };

  const activeChapterData = draft.chapters[activeChapter];

  return (
    <AppFrame
      current="workspace"
      layout="book"
      currentBookSlug={slug}
      title={draft.title || "Book"}
      subtitle={isDirty ? "Kaydedilmemiş değişiklik var." : "Genel görünüm, içerik üretimi, araştırma ve yayın teslimi tek akışta."}
      books={books}
      actions={actions}
      primaryAction={{
        label: isSaving ? "Kaydediliyor..." : isDirty ? "Kaydet *" : "Kaydet",
        onClick: () => saveCurrentBook(),
      }}
    >
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WorkspaceTab)}>
        {/* Scrollable tab bar */}
        <div className="overflow-x-auto">
          <TabsList className="w-max min-w-full">
            {tabOptions.map((tab) => (
              <TabsTrigger key={tab} value={tab}>{TAB_LABELS[tab]}</TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── HOME ── */}
        <TabsContent value="home" className="mt-6 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Layers, value: stats.chapter_count, label: "Bölüm" },
              { icon: FlaskConical, value: stats.research_count, label: "Araştırma" },
              { icon: BarChart3, value: stats.export_count, label: "Çıktı" },
              { icon: BookOpen, value: book.outline_file ? "Ready" : "Missing", label: "Outline" },
            ].map(({ icon: Icon, value, label }) => (
              <Card key={label}>
                <CardContent className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-3xl font-semibold text-foreground">{value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progress bar */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Book progress</span>
                <span className="text-sm font-semibold text-primary">{progressScore}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progressScore}%` }}
                />
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                {[
                  { label: "Outline", done: !!book.outline_file },
                  { label: "Bölümler", done: stats.chapter_count > 0 },
                  { label: "Araştırma", done: stats.research_count > 0 },
                  { label: "Çıktı", done: stats.export_count > 0 },
                ].map(({ label, done }) => (
                  <div key={label} className={cn("flex items-center gap-1", done && "text-primary")}>
                    {done ? <Check className="size-3" /> : <div className="size-3 rounded-full border border-current" />}
                    {label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next step */}
          <Card>
            <CardContent>
              <div className="text-sm font-medium text-foreground">Sonraki önerilen adım</div>
              <div className="mt-3 text-2xl font-medium text-foreground">{nextStep.label}</div>
              <div className="mt-2 text-sm leading-7 text-muted-foreground">{nextStep.desc}</div>
              <Button className="mt-4" onClick={() => setActiveTab(nextStep.tab)}>
                {nextStep.label} →
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BOOK ── */}
        <TabsContent value="book" className="mt-6 space-y-6">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card>
              <CardContent className="space-y-4">
                <div className="text-sm font-medium text-foreground">Book details</div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><Label>Başlık</Label><Input value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} /></div>
                  <div><Label>Alt başlık</Label><Input value={draft.subtitle || ""} onChange={(e) => updateDraft({ subtitle: e.target.value })} /></div>
                  <div><Label>Yazar</Label><Input value={draft.author || ""} onChange={(e) => updateDraft({ author: e.target.value })} /></div>
                  <div><Label>Yayınevi</Label><Input value={draft.publisher || ""} onChange={(e) => updateDraft({ publisher: e.target.value })} /></div>
                  <div><Label>ISBN</Label><Input value={draft.isbn || ""} onChange={(e) => updateDraft({ isbn: e.target.value })} /></div>
                  <div><Label>Yıl</Label><Input value={draft.year || ""} onChange={(e) => updateDraft({ year: e.target.value })} /></div>
                  <div><Label>Branding / wordmark</Label><Input value={draft.branding_mark || ""} onChange={(e) => updateDraft({ branding_mark: e.target.value })} /></div>
                  <div><Label>Logo URL</Label><Input value={draft.branding_logo_url || ""} onChange={(e) => updateDraft({ branding_logo_url: e.target.value })} /></div>
                  <div className="md:col-span-2"><Label>Kapak vurgusu</Label><Input value={draft.cover_brief || ""} onChange={(e) => updateDraft({ cover_brief: e.target.value })} /></div>
                </div>
                <div className="rounded-2xl border border-border/80 bg-background/70 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">Logo yükle</div>
                      <div className="mt-1 text-sm leading-7 text-muted-foreground">
                        PNG, JPG veya WebP yükleyebilirsin. Yüklendiğinde branding alanına otomatik bağlanır.
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
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
                      <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>
                        <ImagePlus className="mr-2 size-4" />
                        Logo Yükle
                      </Button>
                      <input
                        ref={frontCoverInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void handleCoverUpload(file, "cover_image");
                          }
                          event.currentTarget.value = "";
                        }}
                      />
                      <input
                        ref={backCoverInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void handleCoverUpload(file, "back_cover_image");
                          }
                          event.currentTarget.value = "";
                        }}
                      />
                      <Button type="button" variant="outline" onClick={() => frontCoverInputRef.current?.click()}>
                        <Upload className="mr-2 size-4" />
                        Ön Kapak Yükle
                      </Button>
                      <Button type="button" variant="outline" onClick={() => backCoverInputRef.current?.click()}>
                        <Upload className="mr-2 size-4" />
                        Arka Kapak Yükle
                      </Button>
                      <Button
                        type="button"
                        onClick={() =>
                          triggerWorkflow({
                            action: "cover_variants_generate",
                            variant_count: 1,
                            force: true,
                          }).catch((error) => addToast(error instanceof Error ? error.message : "Kapak üretimi başarısız.", "error"))
                        }
                      >
                        <Sparkles className="mr-2 size-4" />
                        1 Kapak Konsepti Üret
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Açıklama</Label>
                  <Textarea value={draft.description || ""} onChange={(e) => updateDraft({ description: e.target.value })} />
                </div>
                <div>
                  <Label>Yazar biyografisi</Label>
                  <Textarea value={draft.author_bio || ""} onChange={(e) => updateDraft({ author_bio: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4">
                <div className="text-sm font-medium text-foreground">Kapak mockup</div>
                <BookMockup
                  title={draft.title}
                  subtitle={draft.subtitle || ""}
                  author={draft.author || ""}
                  brand={draft.branding_mark || draft.publisher || ""}
                  logoUrl={draft.branding_logo_url ? buildBookAssetUrl(slug, draft.branding_logo_url) : undefined}
                  imageUrl={draft.cover_image ? buildBookAssetUrl(slug, draft.cover_image) : undefined}
                  accentLabel={draft.cover_brief || "Ödeme öncesi ürün görünümü"}
                  size="lg"
                />
                {draft.branding_logo_url ? (
                  <div className="rounded-2xl border border-border/80 bg-background/70 px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Aktif logo</div>
                    <img
                      src={buildBookAssetUrl(slug, draft.branding_logo_url)}
                      alt={`${draft.branding_mark || draft.publisher || "Brand"} logosu`}
                      className="mt-3 h-14 w-auto max-w-[180px] rounded-md bg-muted/30 object-contain p-1"
                    />
                  </div>
                ) : null}
                <div className="rounded-2xl border border-border/80 bg-background/70 px-4 py-4 text-sm leading-7 text-muted-foreground">
                  Bu görünüm önizleme ve yükseltme ekranındaki satış hissini güçlendirir. Branding ve başlık burada doğrudan algılanır.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chapters */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Bölümler ({draft.chapters.length})</div>
            {draft.chapters.map((chapter, index) => (
              <Card key={`${chapter.title}-${index}`}>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge >Bölüm {index + 1}</Badge>
                    {chapter.content && (
                      <Badge >
                        {chapter.content.split(/\s+/).filter(Boolean).length} kelime
                      </Badge>
                    )}
                  </div>
                  <div>
                    <Label>Başlık</Label>
                    <Input
                      value={chapter.title}
                      onChange={(event) => {
                        const chapters = [...draft.chapters];
                        chapters[index] = { ...chapter, title: event.target.value };
                        updateDraft({ chapters });
                      }}
                    />
                  </div>
                  <div>
                    <Label>İçerik</Label>
                    <Textarea
                      value={chapter.content}
                      onChange={(event) => {
                        const chapters = [...draft.chapters];
                        chapters[index] = { ...chapter, content: event.target.value };
                        updateDraft({ chapters });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── WRITING ── */}
        <TabsContent value="writing" className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() =>
                triggerWorkflow({
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
                }).catch((error) => addToast(error instanceof Error ? error.message : "Outline başarısız.", "error"))
              }
            >
              Outline üret
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                triggerWorkflow({
                  action: "chapter_generate",
                  chapter_number: activeChapter + 1,
                  chapter_title: draft.chapters[activeChapter]?.title || `Bölüm ${activeChapter + 1}`,
                  min_words: 1600,
                  max_words: 2200,
                  style: "clear",
                  tone: "professional",
                }).catch((error) => addToast(error instanceof Error ? error.message : "Bölüm üretimi başarısız.", "error"))
              }
            >
              Bölüm {activeChapter + 1}&apos;i üret
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                triggerWorkflow({
                  action: "chapter_review",
                  chapter_number: activeChapter + 1,
                }).catch((error) => addToast(error instanceof Error ? error.message : "Gözden geçirme başarısız.", "error"))
              }
            >
              Gözden geçir
            </Button>
          </div>

          {/* Chapter selector */}
          {draft.chapters.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {draft.chapters.map((ch, i) => (
                <button
                  key={i}
                  onClick={() => setActiveChapter(i)}
                  className={cn(
                    "shrink-0 rounded-xl border px-3 py-1.5 text-sm transition",
                    activeChapter === i
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-accent",
                  )}
                >
                  <span className="font-medium">B{i + 1}</span>
                  {ch.content && (
                    <span className="ml-1.5 text-xs opacity-70">
                      {formatCompactWordCount(countWords(ch.content))}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">
                  {activeChapterData?.title || `Bölüm ${activeChapter + 1}`}
                </div>
                {activeChapterData?.content && (
                  <Badge >
                    <FileText className="mr-1 size-3" />
                    {activeChapterData.content.split(/\s+/).filter(Boolean).length} kelime
                  </Badge>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {activeChapterData?.content || "Henüz içerik yok. Yukarıdan üret butonunu kullan."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RESEARCH ── */}
        <TabsContent value="research" className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <Input
              value={researchTopic}
              onChange={(event) => setResearchTopic(event.target.value)}
              placeholder="Araştırma konusu"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => triggerWorkflow({ action: "market_analyzer", topic: researchTopic }).catch((error) => addToast(error instanceof Error ? error.message : "KDP analiz başarısız.", "error"))}>KDP analiz</Button>
              <Button variant="outline" onClick={() => triggerWorkflow({ action: "keyword_research", keywords: [researchTopic] }).catch((error) => addToast(error instanceof Error ? error.message : "Anahtar kelime başarısız.", "error"))}>Anahtar kelime</Button>
              <Button variant="outline" onClick={() => triggerWorkflow({ action: "topic_finder", topic: researchTopic }).catch((error) => addToast(error instanceof Error ? error.message : "Konu bulucu başarısız.", "error"))}>Konu bulucu</Button>
              <Button onClick={() => triggerWorkflow({ action: "research_insights", focus: researchTopic }).catch((error) => addToast(error instanceof Error ? error.message : "AI öneri başarısız.", "error"))}>AI öneri</Button>
            </div>
          </div>
          <div className="grid gap-4">
            {(book.resources?.research || []).slice(0, 12).map((file) => (
              <Card key={file.relative_path}>
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-foreground">{file.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{file.relative_path}</div>
                  </div>
                  <a href={buildAssetUrl(file.url)} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm">Aç</Button>
                  </a>
                </CardContent>
              </Card>
            ))}
            {!book.resources?.research?.length ? (
              <Card><CardContent><div className="text-sm text-muted-foreground">Henüz araştırma dosyası yok.</div></CardContent></Card>
            ) : null}
          </div>
        </TabsContent>

        {/* ── PUBLISH ── */}
        <TabsContent value="publish" className="mt-6 space-y-8">
          {/* ── Publish Hero ── */}
          <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="size-4 text-primary" />
                  </span>
                  <h3 className="text-xl font-bold text-foreground">Yayın ve Dışa Aktar</h3>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Kitabını profesyonel formatta dışa aktar. Önce EPUB ile içeriği kontrol et, ardından PDF ile baskıya hazır dosya al.
                </p>
              </div>
            </div>
          </div>

          {/* ── Cover Variants ── */}
          <Card>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="text-sm font-medium text-foreground">Kapak varyantları</div>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {coverPickerSummary(currentDraft)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      triggerWorkflow({ action: "cover_variants_generate", variant_count: 1 }).catch((error) =>
                        addToast(error instanceof Error ? error.message : "Kapak varyantları üretilemedi.", "error"),
                      )
                    }
                  >
                    <Layers className="mr-2 size-4" />
                    Tek Konsept Üret
                  </Button>
                  <Button
                    onClick={() =>
                      triggerWorkflow({ action: "cover_variants_generate", force: true, variant_count: 3 }).catch((error) =>
                        addToast(error instanceof Error ? error.message : "Kapak varyantları yeniden üretilemedi.", "error"),
                      )
                    }
                  >
                    <Sparkles className="mr-2 size-4" />
                    AI ile Yeniden Üret
                  </Button>
                </div>
              </div>

              {coverVariants.length ? (
                <div className="grid gap-4 xl:grid-cols-3">
                  {coverVariants.map((variant) => (
                    <CoverVariantCard
                      key={variant.id}
                      slug={slug}
                      variant={variant}
                      selected={variant.id === selectedCoverVariantId}
                      selecting={selectingCoverVariantId === variant.id}
                      onSelect={() => void handleSelectCoverVariant(variant)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6">
                  <div className="text-sm font-semibold text-foreground">Henüz cover picker hazır değil.</div>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                    Önce tek konsepti üret. Sistem ön kapak + arka kapağı metadata içine yazar; beğenmezsen AI ile
                    yeniden üret ile alternatif set alabilirsin.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Export Actions ── */}
          <Card className="border-primary/15">
            <CardContent className="space-y-5 p-6">
              <div className="text-sm font-medium text-foreground">Dosya Oluştur</div>
              <p className="text-sm leading-7 text-muted-foreground">
                Kitabını seçtiğin formatta dışa aktar. Dosya otomatik olarak indirilir.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* EPUB Button */}
                <button
                  type="button"
                  className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-background p-5 text-left transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10"
                  onClick={() => triggerBuild("epub").catch((error) => addToast(error instanceof Error ? error.message : "EPUB başarısız.", "error"))}
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
                    <BookOpen className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold text-foreground">EPUB Oluştur</div>
                    <div className="mt-1 text-xs text-muted-foreground">E-book format • Compatible with all readers • Ideal for content review</div>
                  </div>
                </button>

                {/* PDF Button */}
                <button
                  type="button"
                  className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-background p-5 text-left transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10"
                  onClick={() => triggerBuild("pdf").catch((error) => addToast(error instanceof Error ? error.message : "PDF başarısız.", "error"))}
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                    <FileText className="size-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold text-foreground">PDF Oluştur</div>
                    <div className="mt-1 text-xs text-muted-foreground">Baskıya hazır • KDP uyumlu • Profesyonel format</div>
                  </div>
                </button>
              </div>

              {/* Preflight - secondary action */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const toastId = addToast("Ön kontrol yapılıyor...", "loading");
                    try {
                      const response = await preflightBook(slug, { action: "build", format: "epub" });
                      updateToast(toastId, response.ok ? "EPUB için hazır." : String(response.reason || "Hazır değil."), response.ok ? "success" : "error");
                    } catch (error) {
                      updateToast(toastId, error instanceof Error ? error.message : "Ön kontrol başarısız.", "error");
                    }
                  }}
                >
                  <FlaskConical className="mr-2 size-3.5" />
                  Dosya Ön Kontrolü
                </Button>
                <span className="text-xs text-muted-foreground">
                  Export almadan önce kitabın hazır olduğunu doğrula
                </span>
              </div>
            </CardContent>
          </Card>

          {/* ── Export History ── */}
          <div>
            <div className="mb-3 text-sm font-medium text-foreground">Önceki Çıktılar</div>
            <div className="grid gap-3">
              {(book.resources?.exports || []).slice(-12).reverse().map((file) => {
                const name = String(file.name || "").toLowerCase();
                const isPdf = name.endsWith(".pdf");
                const isEpub = name.endsWith(".epub");
                return (
                  <div
                    key={file.relative_path}
                    className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition hover:border-border hover:shadow-sm"
                  >
                    <div className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg",
                      isPdf && "bg-blue-500/10",
                      isEpub && "bg-emerald-500/10",
                      !isPdf && !isEpub && "bg-muted",
                    )}>
                      {isPdf ? (
                        <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                      ) : isEpub ? (
                        <BookOpen className="size-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <FileText className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{file.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{file.relative_path}</div>
                    </div>
                    <a href={buildAssetUrl(file.url)} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="opacity-60 group-hover:opacity-100 transition-opacity">
                        <Download className="mr-1.5 size-3.5" />
                        İndir
                      </Button>
                    </a>
                  </div>
                );
              })}
              {!book.resources?.exports?.length ? (
                <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-8 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                    <Upload className="size-5 text-muted-foreground" />
                  </div>
                  <div className="mt-3 text-sm font-medium text-muted-foreground">Henüz çıktı yok</div>
                  <p className="mt-1 text-xs text-muted-foreground">Yukarıdaki EPUB veya PDF butonuna tıklayarak ilk dosyanı oluştur</p>
                </div>
              ) : null}
            </div>
          </div>
        </TabsContent>

      </Tabs>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <ReferralShareDialog open={showReferralDialog} onOpenChange={setShowReferralDialog} />
    </AppFrame>
  );
}
