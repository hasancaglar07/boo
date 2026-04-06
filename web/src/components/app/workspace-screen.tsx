"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Check, FileText, FlaskConical, ImagePlus, Layers, Loader2, Sparkles, Upload, X } from "lucide-react";

import { AppFrame } from "@/components/app/app-frame";
import { BackendUnavailableState } from "@/components/app/backend-unavailable-state";
import { BookMockup } from "@/components/books/book-mockup";
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
  loadSettings,
  preflightBook,
  responseSummary,
  runWorkflow,
  saveBook,
  saveSettings,
  uploadBookAsset,
  type Book,
  type Settings,
} from "@/lib/dashboard-api";
import { useSessionGuard } from "@/lib/use-session-guard";
import { cn } from "@/lib/utils";

const tabOptions = ["home", "book", "writing", "research", "publish", "settings"] as const;
type WorkspaceTab = (typeof tabOptions)[number];

const TAB_LABELS: Record<WorkspaceTab, string> = {
  home: "Overview",
  book: "Book",
  writing: "Content",
  research: "Research",
  publish: "Publish",
  settings: "Settings",
};

function normalizeTab(tab?: string): WorkspaceTab {
  return tab && tabOptions.includes(tab as WorkspaceTab) ? (tab as WorkspaceTab) : "home";
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
  const [settings, setSettings] = useState<Settings | null>(null);
  const [researchTopic, setResearchTopic] = useState("");
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

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
      const [bookList, loadedBook, loadedSettings] = await Promise.all([
        loadBooks(),
        loadBook(slug),
        loadSettings(),
      ]);
      setBooks(bookList);
      setBook(loadedBook);
      setDraft(loadedBook);
      setResearchTopic(loadedBook.title);
      setSettings(loadedSettings);
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
    const toastId = addToast("Auto-saving...", "loading");
    try {
      const saved = await saveBook(draft);
      setBook(saved);
      setDraft(saved);
      setIsDirty(false);
      updateToast(toastId, "Auto-saved.", "success");
    } catch {
      updateToast(toastId, "Auto-save failed.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function refresh() {
    const [bookList, loadedBook, loadedSettings] = await Promise.all([
      loadBooks(),
      loadBook(slug),
      loadSettings(),
    ]);
    setBooks(bookList);
    setBook(loadedBook);
    setDraft(loadedBook);
    setSettings(loadedSettings);
    setBackendUnavailable(false);
    setIsDirty(false);
  }

  async function saveCurrentBook() {
    if (!draft) return;
    setIsSaving(true);
    const toastId = addToast("Saving...", "loading");
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

  if (!draft || !book || !settings) return null;
  const currentDraft = draft;

  const actions = [
    { label: "Overview", description: "Main progress summary", run: () => setActiveTab("home") },
    { label: "Book", description: "Title and chapter backbone", run: () => setActiveTab("book") },
    { label: "Content", description: "Outline and chapter writing", run: () => setActiveTab("writing") },
    { label: "Research", description: "KDP and keyword tools", run: () => setActiveTab("research") },
    { label: "Publish", description: "EPUB and PDF delivery", run: () => setActiveTab("publish") },
    { label: "Settings", description: "API Keys", run: () => setActiveTab("settings") },
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
      await refresh();
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

  const activeChapterData = draft.chapters[activeChapter];

  return (
    <AppFrame
      current="workspace"
      layout="book"
      currentBookSlug={slug}
      title={draft.title || "Book"}
      subtitle={isDirty ? "Unsaved changes pending." : "Overview, content production, research and publish delivery in one flow."}
      books={books}
      actions={actions}
      primaryAction={{
        label: isSaving ? "Saving..." : isDirty ? "Save *" : "Save",
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
              { icon: Layers, value: stats.chapter_count, label: "Chapter" },
              { icon: FlaskConical, value: stats.research_count, label: "Research" },
              { icon: BarChart3, value: stats.export_count, label: "Output" },
              { icon: BookOpen, value: book.outline_file ? "Ready" : "Missing", label: "Draft" },
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
                  { label: "Chapters", done: stats.chapter_count > 0 },
                  { label: "Research", done: stats.research_count > 0 },
                  { label: "Output", done: stats.export_count > 0 },
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
              <div className="text-sm font-medium text-foreground">Next recommended step</div>
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
                <div className="text-sm font-medium text-foreground">Book information</div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><Label>Title</Label><Input value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} /></div>
                  <div><Label>Subtitle</Label><Input value={draft.subtitle || ""} onChange={(e) => updateDraft({ subtitle: e.target.value })} /></div>
                  <div><Label>Author</Label><Input value={draft.author || ""} onChange={(e) => updateDraft({ author: e.target.value })} /></div>
                  <div><Label>Publisher</Label><Input value={draft.publisher || ""} onChange={(e) => updateDraft({ publisher: e.target.value })} /></div>
                  <div><Label>ISBN</Label><Input value={draft.isbn || ""} onChange={(e) => updateDraft({ isbn: e.target.value })} /></div>
                  <div><Label>Year</Label><Input value={draft.year || ""} onChange={(e) => updateDraft({ year: e.target.value })} /></div>
                  <div><Label>Branding / wordmark</Label><Input value={draft.branding_mark || ""} onChange={(e) => updateDraft({ branding_mark: e.target.value })} /></div>
                  <div><Label>Logo URL</Label><Input value={draft.branding_logo_url || ""} onChange={(e) => updateDraft({ branding_logo_url: e.target.value })} /></div>
                  <div className="md:col-span-2"><Label>Cover emphasis</Label><Input value={draft.cover_brief || ""} onChange={(e) => updateDraft({ cover_brief: e.target.value })} /></div>
                </div>
                <div className="rounded-2xl border border-border/80 bg-background/70 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">Upload logo</div>
                      <div className="mt-1 text-sm leading-7 text-muted-foreground">
                        You can upload PNG, JPG or WebP. It automatically links to the branding area when uploaded.
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
                        Upload Logo
                      </Button>
                      <Button
                        type="button"
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
                        Regenerate Cover
                      </Button>
                </div>
                <div>
                  <Label>Author biography</Label>
                  <Textarea value={draft.author_bio || ""} onChange={(e) => updateDraft({ author_bio: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4">
                <div className="text-sm font-medium text-foreground">Cover mockup</div>
                <BookMockup
                  title={draft.title}
                  subtitle={draft.subtitle || ""}
                  author={draft.author || ""}
                  brand={draft.branding_mark || draft.publisher || ""}
                  logoUrl={draft.branding_logo_url ? buildBookAssetUrl(slug, draft.branding_logo_url) : undefined}
                  imageUrl={draft.cover_image ? buildBookAssetUrl(slug, draft.cover_image) : undefined}
                  accentLabel={draft.cover_brief || "Pre-sale product preview"}
                  size="lg"
                />
                {draft.branding_logo_url ? (
                  <div className="rounded-2xl border border-border/80 bg-background/70 px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active logo</div>
                    <img
                      src={buildBookAssetUrl(slug, draft.branding_logo_url)}
                      alt={`${draft.branding_mark || draft.publisher || "Brand"} logo`}
                      className="mt-3 h-14 w-auto max-w-[180px] rounded-md bg-muted/30 object-contain p-1"
                    />
                  </div>
                ) : null}
                <div className="rounded-2xl border border-border/80 bg-background/70 px-4 py-4 text-sm leading-7 text-muted-foreground">
                  This view strengthens the sales feel on the preview and upgrade screens. Branding and title are directly recognized here.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chapters */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Chapters ({draft.chapters.length})</div>
            {draft.chapters.map((chapter, index) => (
              <Card key={`${chapter.title}-${index}`}>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge >Ch. {index + 1}</Badge>
                    {chapter.content && (
                      <Badge >
                        {chapter.content.split(/\s+/).filter(Boolean).length} words
                      </Badge>
                    )}
                  </div>
                  <div>
                    <Label>Title</Label>
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
                    <Label>Content</Label>
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
                }).catch((error) => addToast(error instanceof Error ? error.message : "Outline generation failed.", "error"))
              }
            >
              Generate Outline
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                triggerWorkflow({
                  action: "chapter_generate",
                  chapter_number: activeChapter + 1,
                  chapter_title: draft.chapters[activeChapter]?.title || `Ch. ${activeChapter + 1}`,
                  min_words: 1600,
                  max_words: 2200,
                  style: "clear",
                  tone: "professional",
                }).catch((error) => addToast(error instanceof Error ? error.message : "Chapter generation failed.", "error"))
              }
            >
              Generate Ch. {activeChapter + 1}
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                triggerWorkflow({
                  action: "chapter_review",
                  chapter_number: activeChapter + 1,
                }).catch((error) => addToast(error instanceof Error ? error.message : "Review failed.", "error"))
              }
            >
              Review
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
                      {ch.content.split(/\s+/).filter(Boolean).length}k
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
                  {activeChapterData?.title || `Ch. ${activeChapter + 1}`}
                </div>
                {activeChapterData?.content && (
                  <Badge >
                    <FileText className="mr-1 size-3" />
                    {activeChapterData.content.split(/\s+/).filter(Boolean).length} words
                  </Badge>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {activeChapterData?.content || "No content yet. Use the generate button above."}
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
              placeholder="Research topic"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => triggerWorkflow({ action: "market_analyzer", topic: researchTopic }).catch((error) => addToast(error instanceof Error ? error.message : KDP Analysis failed., "error"))}>KDP Analysis</Button>
              <Button variant="outline" onClick={() => triggerWorkflow({ action: "keyword_research", keywords: [researchTopic] }).catch((error) => addToast(error instanceof Error ? error.message : Keywords failed., "error"))}>Keywords</Button>
              <Button variant="outline" onClick={() => triggerWorkflow({ action: "topic_finder", topic: researchTopic }).catch((error) => addToast(error instanceof Error ? error.message : Topic Finder failed., "error"))}>Topic Finder</Button>
              <Button onClick={() => triggerWorkflow({ action: "research_insights", focus: researchTopic }).catch((error) => addToast(error instanceof Error ? error.message : AI Suggestion failed., "error"))}>AI Suggestion</Button>
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
                    <Button variant="ghost" size="sm">Open</Button>
                  </a>
                </CardContent>
              </Card>
            ))}
            {!book.resources?.research?.length ? (
              <Card><CardContent><div className="text-sm text-muted-foreground">No research files yet.</div></CardContent></Card>
            ) : null}
          </div>
        </TabsContent>

        {/* ── PUBLISH ── */}
        <TabsContent value="publish" className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={async () => {
                const toastId = addToast("Running pre-check...", "loading");
                try {
                  const response = await preflightBook(slug, { action: "build", format: "epub" });
                  updateToast(toastId, response.ok ? "Ready for EPUB." : String(response.reason || "Not ready."), response.ok ? "success" : "error");
                } catch (error) {
                  updateToast(toastId, error instanceof Error ? error.message : "Pre-check failed.", "error");
                }
              }}
            >
              Ön kontrol
            </Button>
            <Button onClick={() => triggerBuild("epub").catch((error) => addToast(error instanceof Error ? error.message : "EPUB generation failed.", "error"))}>
              <Upload className="mr-2 size-4" />
              Get EPUB
            </Button>
            <Button variant="ghost" onClick={() => triggerBuild("pdf").catch((error) => addToast(error instanceof Error ? error.message : "PDF generation failed.", "error"))}>Get PDF</Button>
          </div>
          <div className="grid gap-4">
            {(book.resources?.exports || []).slice(-12).reverse().map((file) => (
              <Card key={file.relative_path}>
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-foreground">{file.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{file.relative_path}</div>
                  </div>
                  <a href={buildAssetUrl(file.url)} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm">Open</Button>
                  </a>
                </CardContent>
              </Card>
            ))}
            {!book.resources?.exports?.length ? (
              <Card><CardContent><div className="text-sm text-muted-foreground">No output yet.</div></CardContent></Card>
            ) : null}
          </div>
        </TabsContent>

        {/* ── SETTINGS ── */}
        <TabsContent value="settings" className="mt-6 space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <div className="text-sm font-medium text-foreground">API Keys</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>GEMINI_API_KEY</Label><Input type="password" value={settings.GEMINI_API_KEY || ""} onChange={(e) => setSettings({ ...settings, GEMINI_API_KEY: e.target.value })} /></div>
                <div><Label>OPENAI_API_KEY</Label><Input type="password" value={settings.OPENAI_API_KEY || ""} onChange={(e) => setSettings({ ...settings, OPENAI_API_KEY: e.target.value })} /></div>
                <div><Label>GROQ_API_KEY</Label><Input type="password" value={settings.GROQ_API_KEY || ""} onChange={(e) => setSettings({ ...settings, GROQ_API_KEY: e.target.value })} /></div>
                <div><Label>Ollama model</Label><Input value={settings.ollama_model || ""} onChange={(e) => setSettings({ ...settings, ollama_model: e.target.value })} /></div>
              </div>
              <div className="text-sm font-medium text-foreground">Defaults</div>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Author</Label><Input value={settings.default_author || ""} onChange={(e) => setSettings({ ...settings, default_author: e.target.value })} /></div>
                <div><Label>Publisher</Label><Input value={settings.default_publisher || ""} onChange={(e) => setSettings({ ...settings, default_publisher: e.target.value })} /></div>
              </div>
              <Button
                onClick={async () => {
                  const toastId = addToast("Saving settings...", "loading");
                  try {
                    const saved = await saveSettings(settings);
                    setSettings(saved);
                    updateToast(toastId, "Settings saved.", "success");
                  } catch (error) {
                    updateToast(toastId, error instanceof Error ? error.message : "Settings could not be saved.", "error");
                  }
                }}
              >
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </AppFrame>
  );
}