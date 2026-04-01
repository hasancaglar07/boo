"use client";

import { Check, ImagePlus, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { FunnelShell } from "@/components/funnel/funnel-shell";
import { GenerateLoadingScreen } from "@/components/funnel/generate-loading-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics";
import {
  loadSettings,
  providerLooksReady,
  runWorkflow,
  saveBook,
  startBookPreviewPipeline,
} from "@/lib/dashboard-api";
import {
  bookTypeLabel,
  buildGuidedBookPayload,
  canOpenStep,
  clearFunnelDraft,
  coverDirectionLabel,
  createDefaultFunnelDraft,
  depthLabel,
  FUNNEL_STEPS,
  isTurkishLanguage,
  languageDescription,
  languageLabel,
  loadFunnelDraft,
  localOutlineSuggestions,
  localTitleSuggestions,
  nextStep,
  normalizeFunnelDraft,
  previousStep,
  saveFunnelDraft,
  stepIndex,
  suggestedStyleProfile,
  SUPPORTED_LANGUAGES,
  toneLabel,
  workflowStyleLabel,
  workflowGenreLabel,
  workflowToneLabel,
  type FunnelBookType,
  type FunnelCoverDirection,
  type FunnelDepth,
  type FunnelDraft,
  type FunnelLanguage,
  type FunnelOutlineItem,
  type FunnelStep,
  type FunnelTone,
} from "@/lib/funnel-draft";
import { formatChapterReference } from "@/lib/book-language";
import { PUBLISHER_LOGO_PRESETS, pickRandomPublisherLogo } from "@/lib/publisher-logo-library";
import { getAccount, getSession, syncPreviewAuthState } from "@/lib/preview-auth";
import { cn } from "@/lib/utils";

const BOOK_TYPES: FunnelBookType[] = ["rehber", "is", "egitim", "cocuk", "diger"];
const TONES: FunnelTone[] = ["clear", "professional", "warm", "inspiring"];
const DEPTHS: FunnelDepth[] = ["hizli", "dengeli", "detayli"];
const COVER_DIRECTIONS: FunnelCoverDirection[] = ["editorial", "tech", "minimal", "energetic"];
const GENERATION_STAGES = [
  "Kitap yapısı hazırlanıyor",
  "Başlık ve outline kaydediliyor",
  "Önizleme bölümleri hazırlanıyor",
  "Kilitli bölümler düzenleniyor",
  "Preview ekranı açılıyor",
] as const;

const BOOK_TYPE_DESCRIPTIONS: Record<FunnelBookType, string> = {
  rehber: "Adım adım öğreten, net ve uygulanabilir akış.",
  is: "Uzmanlık, danışmanlık veya marka otoritesi için güçlü kurgu.",
  egitim: "Öğretici, örnekli ve daha sistemli anlatım.",
  cocuk: "Daha sıcak, ritimli ve sade anlatım düzeni.",
  diger: "Özel konu veya hibrit kurgular için esnek alan.",
};

const TONE_DESCRIPTIONS: Record<FunnelTone, string> = {
  clear: "Hızlı taranır, doğrudan ve net.",
  professional: "Güven veren, düzenli ve uzman hissi taşıyan anlatım.",
  warm: "Daha yakın, akıcı ve dostane ton.",
  inspiring: "Enerji veren, motive eden ve vizyon odaklı dil.",
};

const DEPTH_DESCRIPTIONS: Record<FunnelDepth, string> = {
  hizli: "Kısa sürede okunan, öz ve yüksek tempolu kurgu.",
  dengeli: "Çoğu kitap için en güvenli denge; netlik ve kapsam birlikte.",
  detayli: "Daha çok örnek, daha çok bağlam ve daha güçlü derinlik.",
};

const COVER_DESCRIPTIONS: Record<FunnelCoverDirection, string> = {
  editorial: "Yayıncılık hissi veren raf kalitesi, daha ciddi bir yüz.",
  tech: "Teknoloji, oyun ve AI başlıkları için daha keskin görünüm.",
  minimal: "Daha sakin, temiz ve premium sade yön.",
  energetic: "Daha canlı, parlak ve hareketli görsel ritim.",
};

const RANDOM_COVER_BRIEFS = [
  "Premium guide edition",
  "Strategy • Systems • Clarity",
  "Practical framework",
  "Field guide edition",
  "Build • Learn • Apply",
  "Blueprint for growth",
] as const;

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Logo dosyası okunamadı."));
    reader.onload = () => {
      const result = String(reader.result || "");
      if (!result.startsWith("data:image/")) {
        reject(new Error("Geçerli bir görsel yüklenemedi."));
        return;
      }
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
}

function defaultAudience(language: FunnelLanguage) {
  return isTurkishLanguage(language) ? "genel okur" : "general readers";
}

function defaultChapterReference(language: FunnelLanguage, number: number) {
  return formatChapterReference(language, number);
}

function randomCoverBrief() {
  return RANDOM_COVER_BRIEFS[Math.floor(Math.random() * RANDOM_COVER_BRIEFS.length)];
}

function firstAllowedStep(draft: FunnelDraft, desired: FunnelStep) {
  const targetIndex = stepIndex(desired);
  for (let index = targetIndex; index >= 0; index -= 1) {
    const candidate = FUNNEL_STEPS[index];
    if (canOpenStep(draft, candidate)) return candidate;
  }
  return "topic";
}

function SummaryCards({ draft }: { draft: FunnelDraft }) {
  const items = [
    { label: "Konu", value: draft.topic || "Henüz seçilmedi" },
    { label: "Başlık", value: draft.title || "Henüz seçilmedi" },
    { label: "Yazar", value: draft.authorName || "Henüz girilmedi" },
    { label: "Branding", value: draft.logoText || draft.imprint || "Henüz girilmedi" },
    { label: "Okur", value: draft.audience || "Henüz seçilmedi" },
    { label: "Dil", value: languageLabel(draft.language) },
    { label: "Bölümler", value: draft.outline.length ? `${draft.outline.length} bölüm` : "Henüz oluşturulmadı" },
    { label: "Stil", value: `${toneLabel(draft.tone, draft.language)} • ${depthLabel(draft.depth, draft.language)}` },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-[22px] border border-border/80 bg-background/74 px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{item.label}</div>
          <div className="mt-2 text-[15px] font-medium leading-7 text-foreground">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function LiveBookCard({ draft }: { draft: FunnelDraft }) {
  const displayTitle = draft.title || "Kitabının adı burada görünecek";
  const displaySubtitle =
    draft.subtitle ||
    "Başlık, alt başlık ve kapak yönü ilerledikçe burada daha net bir kitap hissi oluşturur.";
  const displayBrand = draft.logoText || draft.imprint || "Wordmark";
  const displayAuthor = draft.authorName || "Yazar adı";

  return (
    <div className="overflow-hidden rounded-[28px] border border-border/80 bg-[radial-gradient(circle_at_top,_rgba(188,104,67,0.18),_transparent_34%),linear-gradient(180deg,_#261c16_0%,_#523629_52%,_#b96a42_100%)] p-6 text-white shadow-[0_24px_48px_rgba(37,27,20,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
          {displayBrand}
        </div>
        {draft.logoUrl ? (
          <img
            src={draft.logoUrl}
            alt={`${displayBrand} logosu`}
            className="h-10 w-auto max-w-[92px] rounded-md bg-white/8 object-contain p-1"
          />
        ) : null}
      </div>
      <div className="mt-12">
        <div className="max-w-[12ch] text-3xl font-semibold leading-[1.02] md:text-4xl">{displayTitle}</div>
        <div className="mt-4 max-w-[28ch] text-sm leading-7 text-white/82">{displaySubtitle}</div>
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {draft.coverBrief ? (
          <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/78">
            {draft.coverBrief}
          </span>
        ) : null}
        <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/78">
          {coverDirectionLabel(draft.coverDirection, draft.language)}
        </span>
        <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/78">
          {toneLabel(draft.tone, draft.language)}
        </span>
      </div>
      <div className="mt-10 text-sm font-medium tracking-[0.14em] text-white/82 uppercase">{displayAuthor}</div>
    </div>
  );
}

function ChoiceGrid<T extends string>({
  values,
  selected,
  labelFor,
  descriptionFor,
  onSelect,
  columns = "sm:grid-cols-2",
}: {
  values: T[];
  selected: T;
  labelFor: (value: T) => string;
  descriptionFor?: (value: T) => string;
  onSelect: (value: T) => void;
  columns?: string;
}) {
  return (
    <div className={cn("grid gap-3", columns)}>
      {values.map((value) => {
        const isSelected = selected === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isSelected}
            className={cn(
              "group relative min-h-[76px] rounded-[22px] border px-5 py-5 text-left outline-none",
              "transition-all duration-150 ease-out",
              "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
              isSelected
                ? "scale-[1.02] border-primary/50 bg-primary/10 shadow-[0_4px_16px_rgba(var(--primary),0.12)] ring-1 ring-primary/25"
                : "border-border bg-background/72 hover:scale-[1.01] hover:border-primary/30 hover:bg-accent/70 hover:shadow-md active:scale-[0.995]",
            )}
            onClick={() => onSelect(value)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-[15px] font-semibold leading-snug transition-colors duration-150",
                  isSelected ? "text-primary" : "text-foreground group-hover:text-foreground",
                )}>
                  {labelFor(value)}
                </div>
                {descriptionFor ? (
                  <div className="mt-1.5 text-sm leading-6 text-muted-foreground">{descriptionFor(value)}</div>
                ) : null}
              </div>
              <div
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/60 bg-card text-transparent group-hover:border-primary/30",
                )}
              >
                <Check className={cn("size-3.5 transition-all duration-150", isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75")} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function GuidedWizardScreen({ step }: { step: FunnelStep }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<FunnelDraft>(() => createDefaultFunnelDraft());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [titleOptions, setTitleOptions] = useState<Array<{ title: string; subtitle: string }>>([]);
  const [aiLoading, setAiLoading] = useState<"" | "title" | "outline" | "style" | "generate">("");
  const [generationStageIndex, setGenerationStageIndex] = useState(0);
  const [pendingRedirect, setPendingRedirect] = useState("");
  const autoFillRef = useRef({ title: false, outline: false, style: false });
  const topicPrefillRef = useRef(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = normalizeFunnelDraft(loadFunnelDraft());
    const allowedStep = firstAllowedStep(stored, step);
    if (allowedStep !== step) {
      router.replace(`/start/${allowedStep}`);
      return;
    }
    const account = getAccount();
    const nextDraft = {
      ...stored,
      currentStep: step,
      authorName: stored.authorName || account.name || "",
      imprint: stored.imprint || "Book Generator",
    };
    setDraft(nextDraft);
    saveFunnelDraft(nextDraft);
    setReady(true);
  }, [router, step]);

  useEffect(() => {
    if (!ready) return;
    saveFunnelDraft({ ...draft, currentStep: step });
  }, [draft, ready, step]);

  useEffect(() => {
    if (!ready || step !== "topic" || topicPrefillRef.current) return;
    topicPrefillRef.current = true;
    const topic = (searchParams.get("topic") || "").trim();
    if (!topic) return;
    setDraft((current) =>
      current.topic.trim()
        ? current
        : {
            ...current,
            topic,
            updatedAt: new Date().toISOString(),
          },
    );
  }, [ready, searchParams, step]);

  useEffect(() => {
    if (step === "topic") {
      trackEvent("wizard_started", { source: "start_topic" });
    }
  }, [step]);

  useEffect(() => {
    if (aiLoading !== "generate") {
      setGenerationStageIndex(0);
      return;
    }

    setGenerationStageIndex(0);
    const timer = window.setInterval(() => {
      setGenerationStageIndex((current) => Math.min(GENERATION_STAGES.length - 1, current + 1));
    }, 1400);
    return () => window.clearInterval(timer);
  }, [aiLoading]);

  const summary = useMemo(
    () => [
      { label: "Konu", value: draft.topic || "Henüz seçilmedi" },
      { label: "Başlık", value: draft.title || "Henüz seçilmedi" },
      { label: "Yazar", value: draft.authorName || "Henüz girilmedi" },
      { label: "Dil", value: languageLabel(draft.language) },
      { label: "Bölümler", value: draft.outline.length ? `${draft.outline.length} bölüm` : "Henüz oluşturulmadı" },
    ],
    [draft],
  );

  function updateDraft(changes: Partial<FunnelDraft>) {
    setDraft((current) => ({ ...current, ...changes, updatedAt: new Date().toISOString() }));
    setError("");
  }

  function updateOutline(index: number, changes: Partial<FunnelOutlineItem>) {
    setDraft((current) => ({
      ...current,
      outline: current.outline.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
      updatedAt: new Date().toISOString(),
    }));
    trackEvent("outline_manual_edited", { index });
  }

  function goBack() {
    const prev = previousStep(step);
    if (prev) router.push(`/start/${prev}`);
  }

  function goNext() {
    if (step === "topic") {
      if (!draft.topic.trim()) {
        setError("Konu boş bırakılamaz.");
        return;
      }
      trackEvent("wizard_topic_completed", { language: draft.language });
    }

    if (step === "title" && !draft.title.trim()) {
      setError("Başlık gerekli.");
      return;
    }

    if (step === "outline" && draft.outline.filter((item) => item.title.trim()).length < 3) {
      setError("En az 3 bölüm gerekli.");
      return;
    }

    const next = nextStep(step);
    if (next) router.push(`/start/${next}`);
  }

  async function handleTitleAi(forceReplace = false) {
    if (!draft.topic.trim()) {
      setError("Önce konuyu netleştir.");
      router.push("/start/topic");
      return;
    }

    setAiLoading("title");
    try {
      const settings = await loadSettings().catch(() => null);
      let suggestions = localTitleSuggestions(draft);

      if (settings && providerLooksReady(settings)) {
        const response = await runWorkflow({
          action: "topic_suggest",
          topic: draft.topic,
          audience: draft.audience || defaultAudience(draft.language),
          category: bookTypeLabel(draft.bookType),
        });
        const generatedPayload = response.generated as { titles?: Array<Record<string, unknown>> } | undefined;
        const generated = Array.isArray(generatedPayload?.titles) ? generatedPayload.titles : [];
        if (generated.length) {
          suggestions = generated.map((item) => ({
            title: String(item.title || "").trim(),
            subtitle: String(item.subtitle || "").trim(),
          }));
        }
      }

      setTitleOptions(suggestions.filter((item) => item.title));
      if ((forceReplace || !draft.title.trim()) && suggestions[0]) {
        updateDraft({ title: suggestions[0].title, subtitle: suggestions[0].subtitle });
      }
      trackEvent("title_ai_used", { language: draft.language });
    } catch {
      const suggestions = localTitleSuggestions(draft);
      setTitleOptions(suggestions);
      if (suggestions[0] && (forceReplace || !draft.title.trim())) {
        updateDraft({ title: suggestions[0].title, subtitle: suggestions[0].subtitle });
      }
      trackEvent("title_ai_used", { fallback: true });
    } finally {
      setAiLoading("");
    }
  }

  async function handleSubtitleAi() {
    if (!titleOptions.length) {
      await handleTitleAi();
      return;
    }
    const nextOption = titleOptions.find((item) => item.subtitle && item.subtitle !== draft.subtitle) || titleOptions[0];
    updateDraft({ subtitle: nextOption.subtitle });
    trackEvent("subtitle_ai_used", { language: draft.language });
  }

  async function handleOutlineAi() {
    if (!draft.topic.trim()) {
      setError("Önce konuyu belirle.");
      router.push("/start/topic");
      return;
    }

    setAiLoading("outline");
    try {
      const settings = await loadSettings().catch(() => null);
      let chapters = localOutlineSuggestions(draft);
      let maybeTitle = draft.title;
      let maybeSubtitle = draft.subtitle;

      if (settings && providerLooksReady(settings)) {
        const response = await runWorkflow({
          action: "outline_suggest",
          topic: draft.topic,
          title: draft.title,
          subtitle: draft.subtitle,
          language: draft.language,
          audience: draft.audience || defaultAudience(draft.language),
          genre: workflowGenreLabel(draft.bookType),
          style: workflowStyleLabel(draft.depth),
          tone: workflowToneLabel(draft.tone),
        });
        const generated = response.generated as
          | {
              title?: string;
              subtitle?: string;
              chapters?: Array<{ title?: string; summary?: string }>;
            }
          | undefined;
        if (generated?.chapters?.length) {
          chapters = generated.chapters.map((item, index) => ({
            title: String(item.title || defaultChapterReference(draft.language, index + 1)).trim(),
            summary: String(item.summary || "").trim(),
          }));
          maybeTitle = String(generated.title || maybeTitle || "").trim();
          maybeSubtitle = String(generated.subtitle || maybeSubtitle || "").trim();
        }
      }

      updateDraft({
        title: maybeTitle || draft.title || localTitleSuggestions(draft)[0]?.title || "",
        subtitle: maybeSubtitle || draft.subtitle || localTitleSuggestions(draft)[0]?.subtitle || "",
        outline: chapters,
      });
      trackEvent("outline_ai_used", { language: draft.language, count: chapters.length });
    } catch {
      const fallback = localOutlineSuggestions(draft);
      updateDraft({
        title: draft.title || localTitleSuggestions(draft)[0]?.title || "",
        subtitle: draft.subtitle || localTitleSuggestions(draft)[0]?.subtitle || "",
        outline: fallback,
      });
      trackEvent("outline_ai_used", { fallback: true, count: fallback.length });
    } finally {
      setAiLoading("");
    }
  }

  function applyRandomStyleProfile(forceReplace = false) {
    const style = suggestedStyleProfile(draft);
    const preset = pickRandomPublisherLogo();
    updateDraft({
      ...style,
      authorName: forceReplace ? draft.authorName || getAccount().name || "İhsan Yılmaz" : draft.authorName || getAccount().name || "İhsan Yılmaz",
      imprint: forceReplace ? preset.imprint : draft.imprint && draft.imprint !== "Book Generator" ? draft.imprint : preset.imprint,
      logoText: forceReplace ? preset.mark : draft.logoText || preset.mark,
      logoUrl: forceReplace ? preset.url : draft.logoUrl || preset.url,
      coverBrief: forceReplace ? randomCoverBrief() : draft.coverBrief || randomCoverBrief(),
      authorBio: forceReplace
        ? draft.authorBio ||
          (isTurkishLanguage(draft.language)
            ? "Uzmanlığını kitaplaştıran bağımsız yazar ve yayın üreticisi."
            : "Independent author building polished books from expert knowledge.")
        : draft.authorBio ||
        (isTurkishLanguage(draft.language)
          ? "Uzmanlığını kitaplaştıran bağımsız yazar ve yayın üreticisi."
          : "Independent author building polished books from expert knowledge."),
    });
    return style;
  }

  function handleStyleAi() {
    const style = applyRandomStyleProfile(true);
    setAiLoading("style");
    trackEvent("style_ai_used", {
      tone: style.tone,
      depth: style.depth,
      cover: style.coverDirection,
    });
    window.setTimeout(() => setAiLoading(""), 400);
  }

  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Yalnızca görsel dosyası yükleyebilirsin.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Logo dosyası 4 MB'den küçük olmalı.");
      return;
    }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      updateDraft({ logoUrl: dataUrl });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Logo yüklenemedi.");
    }
  }

  useEffect(() => {
    if (!ready || step !== "title" || autoFillRef.current.title) return;
    autoFillRef.current.title = true;
    const local = localTitleSuggestions(draft);
    if (!draft.title.trim() && local[0]) {
      setTitleOptions(local);
      updateDraft({ title: local[0].title, subtitle: local[0].subtitle || draft.subtitle });
    } else if (!titleOptions.length) {
      setTitleOptions(local);
    }
    if (!draft.topic.trim()) return;
    void handleTitleAi(true);
  }, [ready, step]);

  useEffect(() => {
    if (!ready || step !== "outline" || autoFillRef.current.outline) return;
    autoFillRef.current.outline = true;
    if (!draft.outline.length) {
      updateDraft({
        title: draft.title || localTitleSuggestions(draft)[0]?.title || "",
        subtitle: draft.subtitle || localTitleSuggestions(draft)[0]?.subtitle || "",
        outline: localOutlineSuggestions(draft),
      });
    }
    if (!draft.topic.trim()) return;
    void handleOutlineAi();
  }, [ready, step]);

  useEffect(() => {
    if (!ready || step !== "style" || autoFillRef.current.style) return;
    autoFillRef.current.style = true;
    applyRandomStyleProfile(false);
  }, [ready, step]);

  async function handleGenerate() {
    setAiLoading("generate");
    setError("");
    setPendingRedirect("");
    trackEvent("wizard_generate_clicked", {
      language: draft.language,
      chapter_count: draft.outline.length,
    });

    try {
      const account = getAccount();
      const payload = buildGuidedBookPayload(draft, account.name);
      const book = await saveBook(payload);
      if (!book) throw new Error("Kitap kaydedilemedi: sunucu geçersiz yanıt döndürdü.");

      const authState = await syncPreviewAuthState().catch(() => null);
      const hasSession = Boolean(authState?.authenticated || getSession());

      const nextDraft = {
        ...draft,
        currentStep: "generate" as const,
        status: hasSession ? ("generating" as const) : ("awaiting_signup" as const),
        generatedSlug: book.slug,
        updatedAt: new Date().toISOString(),
      };
      saveFunnelDraft(nextDraft);
      trackEvent("generate_started", { slug: book.slug });
      void startBookPreviewPipeline(book.slug).catch(() => undefined);

      const destination = hasSession
        ? `/app/book/${encodeURIComponent(book.slug)}/preview`
        : `/signup/continue?slug=${encodeURIComponent(book.slug)}&next=${encodeURIComponent(`/app/book/${book.slug}/preview`)}`;

      if (!hasSession) {
        trackEvent("signup_prompt_shown", { slug: book.slug });
      }

      // Store destination — GenerateLoadingScreen will navigate after its 5-second animation
      setPendingRedirect(destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kitap oluşturulamadı. Lütfen tekrar dene.");
      setAiLoading("");
    }
    // Note: aiLoading stays "generate" until GenerateLoadingScreen completes
  }

  if (!ready) return null;

  // ── TOPIC ──────────────────────────────────────────────────────────────────
  if (step === "topic") {
    return (
      <FunnelShell
        step={step}
        title="Kitabın konusu ne?"
        description="Konuyu yaz, hedef okurunu belirt, kitap tipini seç — hepsi bu."
        summary={summary}
      >
        <div className="space-y-8">
          <div className="space-y-2">
            <label htmlFor="topic" className="text-sm font-semibold text-foreground">
              Konu
            </label>
            <Textarea
              id="topic"
              value={draft.topic}
              onChange={(event) => updateDraft({ topic: event.target.value })}
              placeholder="örnek: Minecraft oyun rehberi — hayatta kalma, inşa ve macera stratejileri"
              rows={3}
              autoFocus
              className="resize-none text-base leading-7 placeholder:text-muted-foreground/60"
            />
            <p className="text-xs text-muted-foreground/70">
              Ne kadar ayrıntılı yazarsan AI o kadar iyi sonuç üretir.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-foreground">Kitap tipi</div>
            <ChoiceGrid
              values={BOOK_TYPES}
              selected={draft.bookType}
              labelFor={(value) => bookTypeLabel(value)}
              descriptionFor={(value) => BOOK_TYPE_DESCRIPTIONS[value]}
              onSelect={(value) => updateDraft({ bookType: value })}
              columns="md:grid-cols-2 xl:grid-cols-3"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="audience" className="text-sm font-semibold text-foreground">
              Hedef okur <span className="font-normal text-muted-foreground">(isteğe bağlı)</span>
            </label>
            <Input
              id="audience"
              value={draft.audience}
              onChange={(event) => updateDraft({ audience: event.target.value })}
              placeholder="örnek: yeni başlayan oyuncular ve ebeveynler"
              className="h-12 text-base"
            />
          </div>

          {error ? (
            <div role="alert" className="rounded-[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button size="lg" onClick={goNext}>
              Devam Et
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                updateDraft({
                  topic: draft.topic || "Minecraft oyun rehberi",
                  audience: draft.audience || "yeni başlayan oyuncular",
                })
              }
            >
              Örnek Doldur
            </Button>
          </div>
        </div>
      </FunnelShell>
    );
  }

  // ── TITLE ──────────────────────────────────────────────────────────────────
  if (step === "title") {
    return (
      <FunnelShell
        step={step}
        title="Başlık ve alt başlık"
        description="Kendin yaz ya da AI’dan öneri al."
        summary={summary}
      >
        <div className="space-y-8">
          <LiveBookCard draft={draft} />

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void handleTitleAi()} isLoading={aiLoading === "title"}>
              <Sparkles className="mr-1.5 size-3.5" />
              Başlık öner
            </Button>
            <Button size="sm" variant="outline" onClick={() => void handleSubtitleAi()}>
              <Wand2 className="mr-1.5 size-3.5" />
              Alt başlık öner
            </Button>
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-semibold text-foreground">
              Başlık
            </label>
            <Input
              id="title"
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
              placeholder="örnek: Minecraft Oyun Rehberi"
              className="h-12 text-base font-medium"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="subtitle" className="text-sm font-semibold text-foreground">
              Alt başlık <span className="font-normal text-muted-foreground">(isteğe bağlı)</span>
            </label>
            <Textarea
              id="subtitle"
              value={draft.subtitle}
              onChange={(event) => updateDraft({ subtitle: event.target.value })}
              placeholder="örnek: Hayatta kalma, inşa ve macera için başlangıçtan ileri seviyeye Türkçe rehber"
              rows={3}
              className="resize-none leading-7"
            />
          </div>

          {titleOptions.length ? (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">AI önerileri</div>
              <div className="grid gap-2">
                {titleOptions.slice(0, 4).map((option) => (
                  <button
                    key={`${option.title}-${option.subtitle}`}
                    type="button"
                    className="group rounded-[20px] border border-border/70 bg-background/72 px-4 py-4 text-left transition-all duration-150 hover:scale-[1.005] hover:border-primary/25 hover:bg-accent hover:shadow-sm active:scale-[0.998]"
                    onClick={() => updateDraft({ title: option.title, subtitle: option.subtitle })}
                  >
                    <div className="text-[15px] font-semibold text-foreground group-hover:text-foreground">{option.title}</div>
                    {option.subtitle ? (
                      <div className="mt-1.5 text-sm leading-6 text-muted-foreground">{option.subtitle}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <div role="alert" className="rounded-[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button variant="ghost" size="lg" onClick={goBack}>
              Geri
            </Button>
            <Button size="lg" onClick={goNext}>
              Bölümleri Kur
            </Button>
          </div>
        </div>
      </FunnelShell>
    );
  }

  // ── OUTLINE ────────────────────────────────────────────────────────────────
  if (step === "outline") {
    return (
      <FunnelShell
        step={step}
        title="Bölüm planı"
        description="AI ile otomatik oluştur ya da kendin düzenle. En az 3 bölüm gerekli."
        summary={summary}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void handleOutlineAi()} isLoading={aiLoading === "outline"}>
              <Sparkles className="mr-1.5 size-3.5" />
              AI ile oluştur
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                updateDraft({
                  outline: [
                    ...draft.outline,
                    {
                      title: defaultChapterReference(draft.language, draft.outline.length + 1),
                      summary: isTurkishLanguage(draft.language) ? "Bu bölümün kısa amacı." : "Short purpose of this section.",
                    },
                  ],
                });
                trackEvent("outline_manual_edited", { action: "add" });
              }}
            >
              + Bölüm ekle
            </Button>
          </div>

          <div className="space-y-3">
            {draft.outline.map((item, index) => (
              <div
                key={`${index}-${item.title}`}
                className="group relative rounded-[22px] border border-border/70 bg-card transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start gap-0 p-4">
                  {/* Chapter number badge */}
                  <div className="mr-4 mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <Input
                      id={`outline-title-${index}`}
                      value={item.title}
                      onChange={(event) => updateOutline(index, { title: event.target.value })}
                      placeholder="Bölüm başlığı"
                      className="h-10 font-medium"
                    />
                    <Textarea
                      id={`outline-summary-${index}`}
                      value={item.summary}
                      onChange={(event) => updateOutline(index, { summary: event.target.value })}
                      placeholder="Bu bölümde ne anlatılacak?"
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 mt-0.5 h-8 w-8 shrink-0 p-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    disabled={draft.outline.length <= 3}
                    onClick={() => {
                      updateDraft({
                        outline: draft.outline.filter((_, itemIndex) => itemIndex !== index),
                      });
                      trackEvent("outline_manual_edited", { action: "remove", index });
                    }}
                    title="Sil"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {error ? (
            <div role="alert" className="rounded-[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="ghost" size="lg" onClick={goBack}>
              Geri
            </Button>
            <Button size="lg" onClick={goNext}>
              Stili Seç
            </Button>
          </div>
        </div>
      </FunnelShell>
    );
  }

  // ── STYLE ──────────────────────────────────────────────────────────────────
  if (step === "style") {
    return (
      <FunnelShell
        step={step}
        title="Dil ve stil"
        description="Bu ekran otomatik doldu. İstersen dili, markayı ve kapağın genel hissini burada değiştir."
        summary={summary}
      >
        <div className="space-y-8">
          <LiveBookCard draft={draft} />

          <div className="rounded-[22px] border border-border/80 bg-background/72 px-6 py-6">
            <div className="text-[15px] font-semibold text-foreground">AI ilk stil paketini hazırladı</div>
            <div className="mt-1.5 text-sm leading-6 text-muted-foreground">
              Dil, ton, kapak yönü ve yayın evi markası otomatik yerleştirildi. Beğenmezsen değiştir, beğenirsen devam et.
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="language" className="text-sm font-semibold text-foreground">Kitap dili</label>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
                <select
                  id="language"
                  value={draft.language}
                  onChange={(event) => updateDraft({ language: event.target.value as FunnelLanguage })}
                  className="flex h-14 w-full rounded-[20px] border border-input bg-card px-5 text-[15px] text-foreground shadow-[0_1px_0_rgba(255,255,255,0.35)_inset] outline-none transition focus:border-ring/50 focus:ring-2 focus:ring-ring/20"
                >
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <option key={language.value} value={language.value}>
                      {language.label}
                    </option>
                  ))}
                </select>
                <div className="rounded-[20px] border border-border/80 bg-background/72 px-4 py-4 text-sm leading-7 text-muted-foreground">
                  <span className="font-semibold text-foreground">{languageLabel(draft.language)}:</span> {languageDescription(draft.language)}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="author-name" className="text-sm font-semibold text-foreground">Yazar adı</label>
              <Input
                id="author-name"
                value={draft.authorName}
                onChange={(event) => updateDraft({ authorName: event.target.value })}
                placeholder="örnek: İhsan Yılmaz"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="imprint" className="text-sm font-semibold text-foreground">İmprint / yayınevi</label>
              <Input
                id="imprint"
                value={draft.imprint}
                onChange={(event) => updateDraft({ imprint: event.target.value })}
                placeholder="örnek: North Peak Books"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="logo-text" className="text-sm font-semibold text-foreground">Logo / wordmark metni</label>
              <Input
                id="logo-text"
                value={draft.logoText}
                onChange={(event) => updateDraft({ logoText: event.target.value })}
                placeholder="örnek: IY Studio"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cover-brief" className="text-sm font-semibold text-foreground">Kapakta öne çıkan vurgu</label>
              <Input
                id="cover-brief"
                value={draft.coverBrief}
                onChange={(event) => updateDraft({ coverBrief: event.target.value })}
                placeholder="örnek: Survival • Build • Explore"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="logo-url" className="text-sm font-semibold text-foreground">İstersen logo URL de ekleyebilirsin</label>
              <Input
                id="logo-url"
                value={draft.logoUrl.startsWith("data:image/") ? "" : draft.logoUrl}
                onChange={(event) => updateDraft({ logoUrl: event.target.value })}
                placeholder="örnek: https://site.com/logo.png"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="author-bio" className="text-sm font-semibold text-foreground">Kısa yazar biyografisi</label>
            <Textarea
              id="author-bio"
              rows={3}
              value={draft.authorBio}
              onChange={(event) => updateDraft({ authorBio: event.target.value })}
              placeholder="örnek: Oyun rehberleri ve yapay zeka destekli yayıncılık üzerine çalışan bağımsız yazar."
              className="resize-none leading-7"
            />
          </div>

          <div className="space-y-4 rounded-[24px] border border-border/80 bg-background/72 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[15px] font-semibold text-foreground">Yayın evi logosu</div>
                <div className="mt-1 text-sm leading-6 text-muted-foreground">
                  30 hazır yayın evi logosundan birini seçebilir ya da kendi logonu yükleyebilirsin.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
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
                <Button size="sm" variant="outline" onClick={handleStyleAi} isLoading={aiLoading === "style"}>
                  <Sparkles className="mr-1.5 size-3.5" />
                  AI ile yenile
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const preset = pickRandomPublisherLogo();
                    updateDraft({
                      imprint: preset.imprint,
                      logoText: preset.mark,
                      logoUrl: preset.url,
                    });
                  }}
                >
                  <Wand2 className="mr-1.5 size-3.5" />
                  Rastgele logo
                </Button>
                <Button size="sm" variant="outline" onClick={() => logoInputRef.current?.click()}>
                  <ImagePlus className="mr-1.5 size-3.5" />
                  Logo yükle
                </Button>
              </div>
            </div>

            <div className="grid max-h-[280px] gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-5">
              {PUBLISHER_LOGO_PRESETS.map((preset) => {
                const selected = draft.logoUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={cn(
                      "rounded-[18px] border p-3 text-left transition",
                      selected ? "border-primary/40 bg-primary/8 ring-1 ring-primary/20" : "border-border/80 bg-card hover:border-primary/20 hover:bg-accent",
                    )}
                    onClick={() =>
                      updateDraft({
                        imprint: preset.imprint,
                        logoText: preset.mark,
                        logoUrl: preset.url,
                      })
                    }
                  >
                    <img src={preset.url} alt={preset.imprint} className="h-14 w-14 rounded-[14px] object-contain" />
                    <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{preset.mark}</div>
                    <div className="mt-1 text-sm font-medium leading-6 text-foreground">{preset.imprint}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-foreground">Ton</div>
            <ChoiceGrid
              values={TONES}
              selected={draft.tone}
              labelFor={(value) => toneLabel(value, draft.language)}
              descriptionFor={(value) => TONE_DESCRIPTIONS[value]}
              onSelect={(value) => updateDraft({ tone: value })}
            />
          </div>

          <details className="rounded-[22px] border border-border/60 bg-background/60 overflow-hidden">
            <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-foreground select-none hover:bg-accent/40 transition-colors">
              <span>Gelişmiş seçenekler</span>
              <svg className="size-4 text-muted-foreground transition-transform [[open]>&]:rotate-180" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </summary>
            <div className="space-y-6 px-5 pb-5 pt-2">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Derinlik</div>
                <ChoiceGrid
                  values={DEPTHS}
                  selected={draft.depth}
                  labelFor={(value) => depthLabel(value, draft.language)}
                  descriptionFor={(value) => DEPTH_DESCRIPTIONS[value]}
                  onSelect={(value) => updateDraft({ depth: value })}
                />
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Kapak yönü</div>
                <ChoiceGrid
                  values={COVER_DIRECTIONS}
                  selected={draft.coverDirection}
                  labelFor={(value) => coverDirectionLabel(value, draft.language)}
                  descriptionFor={(value) => COVER_DESCRIPTIONS[value]}
                  onSelect={(value) => updateDraft({ coverDirection: value })}
                  columns="md:grid-cols-2"
                />
              </div>
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button variant="ghost" size="lg" onClick={goBack}>
              Geri
            </Button>
            <Button size="lg" onClick={goNext}>
              Önizlemeyi Hazırla
            </Button>
          </div>
        </div>
      </FunnelShell>
    );
  }

  // ── GENERATE ───────────────────────────────────────────────────────────────
  return (
    <FunnelShell
      step={step}
      title="Önizlemeyi başlat"
      description="Tek tıkla kitap vitrini oluşur. Kapak ve ilk okunabilir bölüm arka planda hazırlanır."
      summary={summary}
    >
      {aiLoading === "generate" ? (
        <GenerateLoadingScreen redirectPath={pendingRedirect || undefined} />
      ) : (
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="rounded-[24px] border border-border/80 bg-background/72 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] border border-border/80 bg-card px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Başlık</div>
                <div className="mt-2 text-lg font-semibold text-foreground">{draft.title}</div>
              </div>
              <div className="rounded-[18px] border border-border/80 bg-card px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dil</div>
                <div className="mt-2 text-lg font-semibold text-foreground">{languageLabel(draft.language)}</div>
              </div>
              <div className="rounded-[18px] border border-border/80 bg-card px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Bölüm sayısı</div>
                <div className="mt-2 text-lg font-semibold text-foreground">{draft.outline.length} bölüm</div>
              </div>
              <div className="rounded-[18px] border border-border/80 bg-card px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Branding</div>
                <div className="mt-2 text-lg font-semibold text-foreground">{draft.imprint || draft.logoText || "Hazır"}</div>
              </div>
            </div>
            <div className="mt-5 rounded-[18px] border border-border/80 bg-card px-4 py-4 text-sm leading-7 text-muted-foreground">
              Generate&apos;a bastığında kullanıcıyı doğrudan preview ekranına taşıyacağız. İlk bölüm gelir gelmez sayfa açılır, kapak da arka planda görünür hale gelir.
            </div>
          </div>

          {error ? (
            <div role="alert" className="rounded-[16px] border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="lg" onClick={goBack}>
              Geri
            </Button>
            <Button size="lg" onClick={() => void handleGenerate()}>
              Önizlemeyi Oluştur
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                clearFunnelDraft();
                router.push("/start/topic");
              }}
            >
              Baştan Kur
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Kayıt gerekmez · Ücretsiz önizleme · Kapak + ilk bölüm canlı hazırlanır
          </p>
        </div>
      )}
    </FunnelShell>
  );
}
