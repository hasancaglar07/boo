import { slugify, titleCase } from "@/lib/utils";

export type FunnelStep = "topic" | "title" | "outline" | "style" | "generate";
export type FunnelBookType = "rehber" | "is" | "egitim" | "cocuk" | "diger";
export type FunnelDepth = "hizli" | "dengeli" | "detayli";
export type FunnelTone = "clear" | "professional" | "warm" | "inspiring";
export type FunnelCoverDirection = "editorial" | "tech" | "minimal" | "energetic";
export const SUPPORTED_LANGUAGES = [
  { value: "Turkish", label: "Türkçe", description: "Yerel okur tonu, Türkçe bölüm akışı ve doğal başlık yapısı." },
  { value: "English", label: "English", description: "International reader framing with clean English structure." },
  { value: "German", label: "Deutsch", description: "Daha teknik ve sistemli Alman okur beklentisine uygun çıktı." },
  { value: "French", label: "Français", description: "Daha editoryal ve akıcı Fransız okur ritmi." },
  { value: "Spanish", label: "Español", description: "Latin ve Avrupa pazarına uygun güçlü genel dil." },
  { value: "Italian", label: "Italiano", description: "Daha akıcı ve editoryal İtalyan anlatı yapısı." },
  { value: "Portuguese", label: "Português", description: "Portekizce geniş pazar hedefleri için uygun." },
  { value: "Dutch", label: "Nederlands", description: "Sade ve pratik Hollanda okur akışı." },
  { value: "Polish", label: "Polski", description: "Orta Avrupa okurları için güçlü metin yapısı." },
  { value: "Romanian", label: "Română", description: "Romanian market için temiz non-fiction omurgası." },
  { value: "Swedish", label: "Svenska", description: "İskandinav sade tonu ve temiz bölüm geçişleri." },
  { value: "Danish", label: "Dansk", description: "Kısa, net ve erişilebilir Danimarka okuyucu tonu." },
  { value: "Norwegian", label: "Norsk", description: "Nordic pazar için okunabilir kitap akışı." },
  { value: "Finnish", label: "Suomi", description: "Daha yapısal ve berrak bir Finlandiya okur dili." },
  { value: "Czech", label: "Čeština", description: "Doğu Avrupa pazarına uygun yapı." },
  { value: "Slovak", label: "Slovenčina", description: "Slovak okur için sade ve pratik akış." },
  { value: "Hungarian", label: "Magyar", description: "Macar okur kitlesi için net rehber kurgusu." },
  { value: "Greek", label: "Ελληνικά", description: "Yunan pazarına uygun kitap akışı." },
  { value: "Russian", label: "Русский", description: "Daha güçlü bilgi yoğunluğu ve bölümlenme." },
  { value: "Ukrainian", label: "Українська", description: "Ukraynaca genişletilmiş non-fiction yapı." },
  { value: "Arabic", label: "العربية", description: "Arapça pazarı için yüksek erişilebilirlik." },
  { value: "Japanese", label: "日本語", description: "Japonca uzmanlık ve eğitim kitapları için güçlü editoryal akış." },
  { value: "Hindi", label: "हिन्दी", description: "Hint okur kitlesi için geniş kapsamlı dil seçeneği." },
  { value: "Indonesian", label: "Bahasa Indonesia", description: "SEA pazarı için hızlı ve okunabilir akış." },
  { value: "Malay", label: "Bahasa Melayu", description: "Malayca sade rehber ve iş kitabı kurgusu." },
] as const;
export type FunnelLanguage = (typeof SUPPORTED_LANGUAGES)[number]["value"];

export type FunnelOutlineItem = {
  title: string;
  summary: string;
};

export type FunnelDraft = {
  id: string;
  createdAt: string;
  updatedAt: string;
  currentStep: FunnelStep;
  status: "draft" | "generating" | "awaiting_signup" | "preview_ready";
  generatedSlug: string;
  topic: string;
  bookType: FunnelBookType;
  audience: string;
  language: FunnelLanguage;
  authorName: string;
  imprint: string;
  logoText: string;
  logoUrl: string;
  authorBio: string;
  coverBrief: string;
  title: string;
  subtitle: string;
  outline: FunnelOutlineItem[];
  tone: FunnelTone;
  depth: FunnelDepth;
  coverDirection: FunnelCoverDirection;
};

const STORAGE_KEY = "book-product-funnel-draft:v1";
export const FUNNEL_STEPS: FunnelStep[] = ["topic", "title", "outline", "style", "generate"];

const LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES.map((item) => item.value));

export function isTurkishLanguage(language?: string) {
  return String(language || "").trim() === "Turkish";
}

export function isEnglishLanguage(language?: string) {
  return String(language || "").trim() === "English";
}

export function languageLabel(language?: string) {
  return SUPPORTED_LANGUAGES.find((item) => item.value === language)?.label || String(language || "English");
}

export function languageDescription(language?: string) {
  return (
    SUPPORTED_LANGUAGES.find((item) => item.value === language)?.description ||
    "Global okur için temiz ve profesyonel kitap akışı."
  );
}

export function normalizeFunnelLanguage(language?: string): FunnelLanguage {
  const value = String(language || "").trim();
  if (LANGUAGE_SET.has(value)) {
    return value as FunnelLanguage;
  }
  return "Turkish";
}

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultFunnelDraft(): FunnelDraft {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    createdAt: now,
    updatedAt: now,
    currentStep: "topic",
    status: "draft",
    generatedSlug: "",
    topic: "",
    bookType: "rehber",
    audience: "",
    language: "Turkish",
    authorName: "",
    imprint: "Book Generator",
    logoText: "",
    logoUrl: "",
    authorBio: "",
    coverBrief: "",
    title: "",
    subtitle: "",
    outline: [],
    tone: "professional",
    depth: "dengeli",
    coverDirection: "editorial",
  };
}

export function normalizeFunnelDraft(payload?: Partial<FunnelDraft> | null): FunnelDraft {
  const base = createDefaultFunnelDraft();
  return {
    ...base,
    ...payload,
    language: normalizeFunnelLanguage(payload?.language),
    outline: Array.isArray(payload?.outline)
      ? payload?.outline.map((item) => ({
          title: String(item?.title || "").trim(),
          summary: String(item?.summary || "").trim(),
        }))
      : base.outline,
    updatedAt: new Date().toISOString(),
  };
}

export function loadFunnelDraft() {
  if (!canUseStorage()) return createDefaultFunnelDraft();
  return normalizeFunnelDraft(safeParse<FunnelDraft | null>(localStorage.getItem(STORAGE_KEY), null));
}

export function saveFunnelDraft(payload: FunnelDraft) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeFunnelDraft(payload)));
}

export function clearFunnelDraft() {
  if (!canUseStorage()) return;
  localStorage.removeItem(STORAGE_KEY);
}

export function stepIndex(step: FunnelStep) {
  return FUNNEL_STEPS.indexOf(step);
}

export function previousStep(step: FunnelStep) {
  const index = stepIndex(step);
  return index > 0 ? FUNNEL_STEPS[index - 1] : null;
}

export function nextStep(step: FunnelStep) {
  const index = stepIndex(step);
  return index >= 0 && index < FUNNEL_STEPS.length - 1 ? FUNNEL_STEPS[index + 1] : null;
}

export function canOpenStep(draft: FunnelDraft, step: FunnelStep) {
  switch (step) {
    case "topic":
      return true;
    case "title":
      return Boolean(draft.topic.trim());
    case "outline":
      return Boolean(draft.topic.trim() && draft.title.trim());
    case "style":
      return Boolean(draft.topic.trim() && draft.title.trim() && draft.outline.length >= 3);
    case "generate":
      return Boolean(
        draft.topic.trim() &&
          draft.title.trim() &&
          draft.outline.length >= 3 &&
          draft.language &&
          draft.tone &&
          draft.depth &&
          draft.coverDirection,
      );
    default:
      return false;
  }
}

export function localTitleSuggestions(draft: FunnelDraft) {
  const subject = titleCase(draft.topic || "Kitap Fikri");
  const audience = draft.audience?.trim() || (isTurkishLanguage(draft.language) ? "başlangıç okurları" : "first-time readers");
  if (isTurkishLanguage(draft.language)) {
    return [
      {
        title: `${subject} Rehberi`,
        subtitle: `${audience} için başlangıçtan ileri seviyeye net yol haritası`,
      },
      {
        title: `${subject}: Adım Adım Uygulama Kitabı`,
        subtitle: `${audience} için sade, pratik ve tutarlı bir öğrenme akışı`,
      },
      {
        title: `${subject} Ustalığı`,
        subtitle: `${audience} için temel mantık, kritik taktikler ve uygulanabilir sistem`,
      },
    ];
  }

  return [
    {
      title: `${subject} Playbook`,
      subtitle: `A clear step-by-step guide for ${audience}`,
    },
    {
      title: `${subject}: Practical Guide`,
      subtitle: `A structured path from fundamentals to confident execution`,
    },
    {
      title: `Mastering ${subject}`,
      subtitle: `The practical framework for ${audience}`,
    },
  ];
}

export function localOutlineSuggestions(draft: FunnelDraft) {
  const subject = titleCase(draft.topic || "Konu");
  const language = draft.language;
  if (isTurkishLanguage(language)) {
    return [
      { title: `${subject} Dünyasına Giriş`, summary: `${subject} için temel kavramlar, beklentiler ve başlangıç çerçevesi.` },
      { title: "İlk Adımlar ve Temel Kurulum", summary: "Başlamak için gereken hazırlıklar, ayarlar ve ilk uygulamalar." },
      { title: "Ana Mekanikler ve Kritik Mantık", summary: "Konuya dair en önemli sistemleri sade örneklerle açıklayan bölüm." },
      { title: "Sık Yapılan Hatalar", summary: "Başlangıç seviyesinde görülen hatalar ve bunları düzeltmenin yolları." },
      { title: "Strateji ve İlerlemenin Temeli", summary: "Daha iyi sonuç almak için izlenecek düzenli ilerleme planı." },
      { title: "İleri Seviye Taktikler", summary: "Temeller oturduktan sonra fark yaratan yöntemler ve ince ayarlar." },
      { title: "Uzun Vadeli Gelişim Planı", summary: "Kazanımı kalıcı hale getirecek çalışma, tekrar ve geliştirme önerileri." },
    ];
  }

  return [
    { title: `Understanding ${subject}`, summary: `A clean introduction to the fundamentals and the mental model behind ${subject}.` },
    { title: "Getting Set Up", summary: "The tools, choices, and first actions needed for a confident start." },
    { title: "Core Mechanics", summary: "The most important systems and workflows explained in a practical order." },
    { title: "Common Mistakes", summary: "The traps beginners fall into and the adjustments that fix them fast." },
    { title: "Building Consistency", summary: "How to make progress predictable with routines and better decisions." },
    { title: "Advanced Tactics", summary: "The higher-leverage moves that separate casual use from confident execution." },
    { title: "Next-Level Progress", summary: "A long-term roadmap for improving results beyond the basics." },
  ];
}

export function suggestedStyleProfile(draft: FunnelDraft) {
  const topic = draft.topic.toLowerCase();
  const techLike = /ai|yapay zeka|minecraft|oyun|kod|coding|software|teknoloji/.test(topic);
  const warmLike = draft.bookType === "cocuk";

  return {
    tone: warmLike ? "warm" : techLike ? "clear" : "professional",
    depth: techLike ? "dengeli" : draft.bookType === "egitim" ? "detayli" : "dengeli",
    coverDirection: warmLike ? "energetic" : techLike ? "tech" : "editorial",
  } satisfies Pick<FunnelDraft, "tone" | "depth" | "coverDirection">;
}

export function buildDraftDescription(draft: FunnelDraft) {
  if (isTurkishLanguage(draft.language)) {
    return `${draft.topic} konusunda ${draft.audience || "hedef okur"} için hazırlanan, adım adım ilerleyen bir ${bookTypeLabel(draft.bookType).toLowerCase()}.`;
  }
  return `A ${bookTypeLabel(draft.bookType).toLowerCase()} about ${draft.topic} for ${draft.audience || "the target reader"}.`;
}

export function buildGuidedBookPayload(draft: FunnelDraft, author: string) {
  const chapters = (draft.outline.length ? draft.outline : localOutlineSuggestions(draft)).map((item) => ({
    title: item.title.trim(),
    content: item.summary.trim(),
  }));

  return {
    slug: slugify(draft.generatedSlug || draft.title || draft.topic),
    title: (draft.title || titleCase(draft.topic)).trim(),
    subtitle: draft.subtitle.trim(),
    language: draft.language,
    author: draft.authorName.trim() || author.trim() || "Book Creator",
    publisher: draft.imprint.trim() || "Book Generator",
    year: String(new Date().getFullYear()),
    description: buildDraftDescription(draft),
    author_bio: draft.authorBio.trim(),
    branding_mark: draft.logoText.trim(),
    branding_logo_url: draft.logoUrl.trim(),
    cover_brief: draft.coverBrief.trim(),
    generate_cover: true,
    fast: draft.depth === "hizli",
    chapters,
  };
}

export function workflowStyleLabel(depth: FunnelDepth) {
  if (depth === "hizli") return "clear and concise";
  if (depth === "detayli") return "detailed and example-driven";
  return "clear and practical";
}

export function workflowToneLabel(tone: FunnelTone) {
  if (tone === "warm") return "warm";
  if (tone === "inspiring") return "inspiring";
  if (tone === "clear") return "clear";
  return "professional";
}

export function workflowGenreLabel(bookType: FunnelBookType) {
  if (bookType === "rehber") return "guide";
  if (bookType === "is") return "business";
  if (bookType === "egitim") return "education";
  if (bookType === "cocuk") return "children";
  return "non-fiction";
}

export function bookTypeLabel(bookType: FunnelBookType) {
  switch (bookType) {
    case "rehber":
      return "Rehber";
    case "is":
      return "İş kitabı";
    case "egitim":
      return "Eğitim";
    case "cocuk":
      return "Çocuk kitabı";
    default:
      return "Kitap";
  }
}

export function toneLabel(tone: FunnelTone, language: FunnelLanguage) {
  if (!isTurkishLanguage(language)) {
    return tone === "warm"
      ? "Warm"
      : tone === "inspiring"
        ? "Inspiring"
        : tone === "clear"
          ? "Clear"
          : "Professional";
  }
  return tone === "warm"
    ? "Samimi"
    : tone === "inspiring"
      ? "İlham verici"
      : tone === "clear"
        ? "Açık ve öğretici"
        : "Profesyonel";
}

export function depthLabel(depth: FunnelDepth, language: FunnelLanguage) {
  if (!isTurkishLanguage(language)) {
    return depth === "hizli" ? "Fast" : depth === "detayli" ? "Detailed" : "Balanced";
  }
  return depth === "hizli" ? "Kısa ve hızlı" : depth === "detayli" ? "Daha detaylı" : "Dengeli";
}

export function coverDirectionLabel(direction: FunnelCoverDirection, language: FunnelLanguage) {
  if (!isTurkishLanguage(language)) {
    return direction === "tech"
      ? "Bold tech"
      : direction === "minimal"
        ? "Minimal"
        : direction === "energetic"
          ? "Energetic"
          : "Editorial";
  }
  return direction === "tech"
    ? "Cesur teknoloji"
    : direction === "minimal"
      ? "Minimal profesyonel"
      : direction === "energetic"
        ? "Genç ve enerjik"
        : "Modern editoryal";
}
