import { slugify, titleCase } from "@/lib/utils";

export type FunnelStep = "topic" | "title" | "outline" | "style" | "generate";
export type FunnelBookType = "rehber" | "is" | "egitim" | "cocuk" | "diger";
export type FunnelDepth = "hizli" | "dengeli" | "detayli";
export type FunnelTone = "clear" | "professional" | "warm" | "inspiring";
export type FunnelCoverDirection = "editorial" | "tech" | "minimal" | "energetic";
export type FunnelBookLength = "compact" | "standard" | "extended";
export type FunnelChapterRole = "opening" | "foundation" | "core" | "case" | "advanced" | "closing";
export type FunnelChapterLength = "short" | "medium" | "long";
export const SUPPORTED_LANGUAGES = [
  { value: "Turkish", label: "Türkçe", description: "Local reader tone, Turkish chapter flow, and natural title structure." },
  { value: "English", label: "İngilizce", description: "Clean, clear, and fluent English structure for international readers." },
  { value: "German", label: "Deutsch", description: "Output suited for more technical and systematic German reader expectations." },
  { value: "French", label: "Français", description: "More editorial and fluent French reader rhythm." },
  { value: "Spanish", label: "Español", description: "Strong general language suitable for Latin and European markets." },
  { value: "Italian", label: "Italiano", description: "Daha akıcı ve editoryal İtalyan anlatı yapısı." },
  { value: "Portuguese", label: "Português", description: "Suitable for broad Portuguese market targets." },
  { value: "Dutch", label: "Nederlands", description: "Simple and practical Dutch reader flow." },
  { value: "Polish", label: "Polski", description: "Strong text structure for Central European readers." },
  { value: "Romanian", label: "Română", description: "Clean non-fiction backbone for the Romanian market." },
  { value: "Swedish", label: "Svenska", description: "Scandinavian clean tone and smooth chapter transitions." },
  { value: "Danish", label: "Dansk", description: "Short, clear, and accessible Danish reader tone." },
  { value: "Norwegian", label: "Norsk", description: "Readable book flow for the Nordic market." },
  { value: "Finnish", label: "Suomi", description: "Daha yapısal ve berrak bir Finlandiya okur dili." },
  { value: "Czech", label: "Čeština", description: "Structure suited for the Eastern European market." },
  { value: "Slovak", label: "Slovenčina", description: "Simple and practical flow for Slovak readers." },
  { value: "Hungarian", label: "Magyar", description: "Clear guide structure for Hungarian readership." },
  { value: "Greek", label: "Ελληνικά", description: "Book flow suited for the Greek market." },
  { value: "Russian", label: "Русский", description: "Stronger information density and chapter segmentation." },
  { value: "Ukrainian", label: "Українська", description: "Extended non-fiction structure for Ukrainian." },
  { value: "Arabic", label: "العربية", description: "High accessibility for the Arabic market." },
  { value: "Japanese", label: "日本語", description: "Strong editorial flow for Japanese expertise and educational books." },
  { value: "Hindi", label: "हिन्दी", description: "Broad language option for Indian readership." },
  { value: "Indonesian", label: "Bahasa Indonesia", description: "Fast and readable flow for the SEA market." },
  { value: "Malay", label: "Bahasa Melayu", description: "Simple guide and business book structure in Malay." },
] as const;
export type FunnelLanguage = (typeof SUPPORTED_LANGUAGES)[number]["value"];

export type FunnelOutlineItem = {
  title: string;
  summary: string;
  role: FunnelChapterRole;
  length: FunnelChapterLength;
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
  languageLocked: boolean;
  authorName: string;
  imprint: string;
  logoText: string;
  logoUrl: string;
  authorBio: string;
  coverBrief: string;
  title: string;
  subtitle: string;
  outline: FunnelOutlineItem[];
  bookLength: FunnelBookLength;
  tone: FunnelTone;
  depth: FunnelDepth;
  coverDirection: FunnelCoverDirection;
};

export type PendingGenerateAuthMethod = "google" | "magic" | "credentials";

export type PendingGenerateIntent = {
  source: "start_generate";
  draftId: string;
  step: "generate";
  resumePath: string;
  createdAt: string;
  authMethod?: PendingGenerateAuthMethod | null;
  authMode?: "login" | "register" | null;
};

const STORAGE_KEY = "book-product-funnel-draft:v1";
const PENDING_GENERATE_INTENT_KEY = "book-product-pending-generate:v1";
const PENDING_GENERATE_INTENT_MAX_AGE_MS = 1000 * 60 * 60 * 24;
export const FUNNEL_STEPS: FunnelStep[] = ["topic", "title", "outline", "style", "generate"];
export const BOOK_LENGTHS: FunnelBookLength[] = ["compact", "standard", "extended"];
export const CHAPTER_ROLES: FunnelChapterRole[] = ["opening", "foundation", "core", "case", "advanced", "closing"];
export const CHAPTER_LENGTHS: FunnelChapterLength[] = ["short", "medium", "long"];

const LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES.map((item) => item.value));

export function isTurkishLanguage(language?: string) {
  return String(language || "").trim() === "Turkish";
}

export function isEnglishLanguage(language?: string) {
  return String(language || "").trim() === "English";
}

export function languageLabel(language?: string) {
  return SUPPORTED_LANGUAGES.find((item) => item.value === language)?.label || String(language || "İngilizce");
}

export function languageDescription(language?: string) {
  return (
    SUPPORTED_LANGUAGES.find((item) => item.value === language)?.description ||
    "Clean and professional book flow for international readers."
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
    languageLocked: false,
    authorName: "",
    imprint: "Book Generator",
    logoText: "",
    logoUrl: "",
    authorBio: "",
    coverBrief: "",
    title: "",
    subtitle: "",
    outline: [],
    bookLength: "standard",
    tone: "professional",
    depth: "dengeli",
    coverDirection: "editorial",
  };
}

function normalizeBookLength(bookLength?: string): FunnelBookLength {
  return BOOK_LENGTHS.includes(bookLength as FunnelBookLength) ? (bookLength as FunnelBookLength) : "standard";
}

function normalizeChapterRole(role?: string): FunnelChapterRole | null {
  return CHAPTER_ROLES.includes(role as FunnelChapterRole) ? (role as FunnelChapterRole) : null;
}

function normalizeChapterLength(length?: string): FunnelChapterLength | null {
  return CHAPTER_LENGTHS.includes(length as FunnelChapterLength) ? (length as FunnelChapterLength) : null;
}

function suggestedChapterRole(index: number, total: number, bookType: FunnelBookType): FunnelChapterRole {
  if (index === 0) return "opening";
  if (index === total - 1) return "closing";
  if (index === 1) return "foundation";
  if (total >= 6 && index === total - 2) return "advanced";
  if (bookType === "egitim" && index === Math.floor(total / 2)) return "case";
  if (bookType === "is" && index % 3 === 0) return "case";
  return "core";
}

function suggestedChapterLength(role: FunnelChapterRole, bookLength: FunnelBookLength): FunnelChapterLength {
  if (bookLength === "compact") {
    if (role === "opening" || role === "closing") return "short";
    if (role === "core" || role === "advanced") return "medium";
    return "medium";
  }
  if (bookLength === "extended") {
    if (role === "opening" || role === "closing") return "medium";
    if (role === "advanced") return "medium";
    return "long";
  }
  if (role === "opening" || role === "closing") return "short";
  if (role === "core") return "long";
  return "medium";
}

export function enrichOutlineItems(
  items: Array<Partial<FunnelOutlineItem>>,
  input: Pick<FunnelDraft, "bookLength" | "bookType">,
): FunnelOutlineItem[] {
  const filtered = items.filter((item) => String(item?.title || "").trim());
  return filtered.map((item, index) => {
    const role = normalizeChapterRole(item.role) || suggestedChapterRole(index, filtered.length, input.bookType);
    return {
      title: String(item.title || "").trim(),
      summary: String(item.summary || "").trim(),
      role,
      length: normalizeChapterLength(item.length) || suggestedChapterLength(role, input.bookLength),
    };
  });
}

export function normalizeFunnelDraft(payload?: Partial<FunnelDraft> | null): FunnelDraft {
  const base = createDefaultFunnelDraft();
  const bookLength = normalizeBookLength(payload?.bookLength);
  return {
    ...base,
    ...payload,
    language: normalizeFunnelLanguage(payload?.language),
    languageLocked: Boolean(payload?.languageLocked),
    bookLength,
    outline: Array.isArray(payload?.outline)
      ? enrichOutlineItems(payload.outline, {
          bookLength,
          bookType: (payload?.bookType as FunnelBookType) || base.bookType,
        })
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

export function loadPendingGenerateIntent() {
  if (!canUseStorage()) return null as PendingGenerateIntent | null;
  const parsed = safeParse<PendingGenerateIntent | null>(
    localStorage.getItem(PENDING_GENERATE_INTENT_KEY),
    null,
  );
  if (!parsed) return null;
  if (
    parsed.source !== "start_generate" ||
    parsed.step !== "generate" ||
    !String(parsed.draftId || "").trim() ||
    !String(parsed.resumePath || "").trim()
  ) {
    localStorage.removeItem(PENDING_GENERATE_INTENT_KEY);
    return null;
  }
  const createdAt = new Date(parsed.createdAt || "");
  if (
    Number.isNaN(createdAt.getTime()) ||
    Date.now() - createdAt.getTime() > PENDING_GENERATE_INTENT_MAX_AGE_MS
  ) {
    localStorage.removeItem(PENDING_GENERATE_INTENT_KEY);
    return null;
  }
  return parsed;
}

export function savePendingGenerateIntent(payload: PendingGenerateIntent) {
  if (!canUseStorage()) return;
  localStorage.setItem(PENDING_GENERATE_INTENT_KEY, JSON.stringify(payload));
}

export function clearPendingGenerateIntent() {
  if (!canUseStorage()) return;
  localStorage.removeItem(PENDING_GENERATE_INTENT_KEY);
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
  const subject = titleCase(draft.topic || (isTurkishLanguage(draft.language) ? "Kitap Fikri" : "Book Idea"));
  const audience = draft.audience?.trim() || (isTurkishLanguage(draft.language) ? "first-time readers" : "first-time readers");
  if (isTurkishLanguage(draft.language)) {
    return [
      {
        title: `${subject} Rehberi`,
        subtitle: `A clear roadmap from beginner to advanced for ${audience}`,
      },
      {
        title: `${subject}: Adım Adım Uygulama Kitabı`,
        subtitle: `A simple, practical, and consistent learning flow for ${audience}`,
      },
      {
        title: `${subject} Mastery`,
        subtitle: `Core logic, critical tactics, and actionable systems for ${audience}`,
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
  const subject = titleCase(draft.topic || (isTurkishLanguage(draft.language) ? "Konu" : "Topic"));
  const language = draft.language;
  if (isTurkishLanguage(language)) {
    return enrichOutlineItems([
      { title: `Introduction to ${subject}`, summary: `Core concepts, expectations, and starting framework for ${subject}.` },
      { title: "First Steps and Basic Setup", summary: "Preparations, settings, and first applications needed to get started." },
      { title: "Core Mechanics and Critical Logic", summary: "Chapter explaining the most important systems with simple examples." },
      { title: "Common Mistakes", summary: "Mistakes seen at the beginner level and ways to fix them." },
      { title: "Strategy and Foundation for Progress", summary: "A regular progress plan to follow for better results." },
      { title: "İleri Seviye Taktikler", summary: "Temeller oturduktan sonra fark yaratan yöntemler ve ince ayarlar." },
      { title: "Long-Term Development Plan", summary: "Practice, review, and improvement suggestions to make gains permanent." },
    ], draft);
  }

  return enrichOutlineItems([
    { title: `Understanding ${subject}`, summary: `A clean introduction to the fundamentals and the mental model behind ${subject}.` },
    { title: "Getting Set Up", summary: "The tools, choices, and first actions needed for a confident start." },
    { title: "Core Mechanics", summary: "The most important systems and workflows explained in a practical order." },
    { title: "Common Mistakes", summary: "The traps beginners fall into and the adjustments that fix them fast." },
    { title: "Building Consistency", summary: "How to make progress predictable with routines and better decisions." },
    { title: "Advanced Tactics", summary: "The higher-leverage moves that separate casual use from confident execution." },
    { title: "Next-Level Progress", summary: "A long-term roadmap for improving results beyond the basics." },
  ], draft);
}

function inferLatinLanguage(text: string): FunnelLanguage {
  const normalized = ` ${text.toLowerCase()} `;

  if (/[çğıöşü]/.test(normalized) || /\b(ve|için|rehber|rehberi|kitap|başlangıç|adım|okur)\b/u.test(normalized)) {
    return "Turkish";
  }
  if (/[äöüß]/.test(normalized) || /\b(und|für|leitfaden|kapitel)\b/u.test(normalized)) {
    return "German";
  }
  if (/[éèêëàâîïôùûçœ]/.test(normalized) || /\b(pour|avec|guide|chapitre)\b/u.test(normalized)) {
    return "French";
  }
  if (/[ñ¿¡]/.test(normalized) || /\b(para|con|guía|capítulo)\b/u.test(normalized)) {
    return "Spanish";
  }
  if (/[ãõ]/.test(normalized) || /\b(para|com|guia|capítulo)\b/u.test(normalized)) {
    return "Portuguese";
  }
  if (/\b(per|con|guida|capitolo)\b/u.test(normalized)) {
    return "Italian";
  }
  if (/\b(voor|met|gids|hoofdstuk)\b/u.test(normalized)) {
    return "Dutch";
  }
  return "English";
}

export function inferFunnelLanguageFromText(...parts: Array<string | null | undefined>): FunnelLanguage | null {
  const text = parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length < 3) {
    return null;
  }

  if (/[\u3040-\u30ff\u4e00-\u9faf]/u.test(text)) {
    return "Japanese";
  }
  if (/[\u0600-\u06ff]/u.test(text)) {
    return "Arabic";
  }
  if (/[\u0900-\u097f]/u.test(text)) {
    return "Hindi";
  }
  if (/[\u0370-\u03ff]/u.test(text)) {
    return "Greek";
  }
  if (/[\u0400-\u04ff]/u.test(text)) {
    return /[іїєґІЇЄҐ]/u.test(text) ? "Ukrainian" : "Russian";
  }
  if (/[a-zA-Z]/.test(text)) {
    return inferLatinLanguage(text);
  }
  return null;
}

type WordRange = { min: number; max: number };

const BOOK_LENGTH_WORD_RANGES: Record<FunnelBookLength, Record<FunnelChapterLength, WordRange>> = {
  compact: {
    short: { min: 900, max: 1200 },
    medium: { min: 1300, max: 1800 },
    long: { min: 1900, max: 2400 },
  },
  standard: {
    short: { min: 1200, max: 1600 },
    medium: { min: 1800, max: 2400 },
    long: { min: 2500, max: 3400 },
  },
  extended: {
    short: { min: 1600, max: 2100 },
    medium: { min: 2400, max: 3200 },
    long: { min: 3400, max: 4300 },
  },
};

export function chapterWordRange(length: FunnelChapterLength, bookLength: FunnelBookLength): WordRange {
  return BOOK_LENGTH_WORD_RANGES[bookLength][length];
}

export function outlineWordRange(outline: FunnelOutlineItem[], bookLength: FunnelBookLength) {
  return outline.reduce(
    (total, item) => {
      const range = chapterWordRange(item.length, bookLength);
      return {
        min: total.min + range.min,
        max: total.max + range.max,
      };
    },
    { min: 0, max: 0 },
  );
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
    return `A step-by-step ${bookTypeLabel(draft.bookType).toLowerCase()} prepared on ${draft.topic} for ${draft.audience || "target readers"}.`;
  }
  return `A ${bookTypeLabel(draft.bookType).toLowerCase()} about ${draft.topic} for ${draft.audience || "the target reader"}.`;
}

export function chapterRoleLabel(role: FunnelChapterRole, language: FunnelLanguage) {
  if (!isTurkishLanguage(language)) {
    switch (role) {
      case "opening":
        return "Opening";
      case "foundation":
        return "Foundation";
      case "core":
        return "Core";
      case "case":
        return "Application";
      case "advanced":
        return "Advanced";
      case "closing":
        return "Closing";
    }
  }
  switch (role) {
    case "opening":
      return "Opening";
    case "foundation":
      return "Temel";
    case "core":
      return "Ana bölüm";
    case "case":
      return "Uygulama";
    case "advanced":
      return "İleri seviye";
    case "closing":
      return "Closing";
  }
}

export function chapterRoleDescription(role: FunnelChapterRole, language: FunnelLanguage) {
  if (!isTurkishLanguage(language)) {
    switch (role) {
      case "opening":
        return "Sets the promise, context, and why this book matters.";
      case "foundation":
        return "Builds the reader's basics before the heavier sections.";
      case "core":
        return "Carries the main framework, method, or transformation.";
      case "case":
        return "Shows application, examples, and real-world translation.";
      case "advanced":
        return "Adds nuance, edge cases, and leverage for stronger readers.";
      case "closing":
        return "Wraps the book with synthesis, next steps, and momentum.";
    }
  }
  switch (role) {
    case "opening":
      return "Establishes the book's promise, context, and why it matters.";
    case "foundation":
      return "Grounds the reader before heavier chapters.";
    case "core":
      return "Carries the main method, system, or transformation.";
    case "case":
      return "Shows application, examples, and real-world counterpart.";
    case "advanced":
      return "Adds nuance, exceptions, and higher-leverage insights.";
    case "closing":
      return "Wraps up the book, provides next steps, and delivers the closing rhythm.";
  }
}

export function chapterLengthLabel(length: FunnelChapterLength, language: FunnelLanguage) {
  if (!isTurkishLanguage(language)) {
    return length === "short" ? "Short" : length === "medium" ? "Medium" : "Long";
  }
  return length === "short" ? "Kısa" : length === "medium" ? "Orta" : "Uzun";
}

export function bookLengthLabel(bookLength: FunnelBookLength, language: FunnelLanguage) {
  if (!isTurkishLanguage(language)) {
    return bookLength === "compact" ? "Compact book" : bookLength === "extended" ? "Extended book" : "Standard book";
  }
  return bookLength === "compact" ? "Kompakt kitap" : bookLength === "extended" ? "Detaylı kitap" : "Standart kitap";
}

export function bookLengthDescription(bookLength: FunnelBookLength, language: FunnelLanguage) {
  const range = {
    compact: "10k-16k",
    standard: "16k-24k",
    extended: "24k-34k",
  }[bookLength];
  if (!isTurkishLanguage(language)) {
    return bookLength === "compact"
      ? `Fast to read and more focused. Usually around ${range} words.`
      : bookLength === "extended"
      ? `More shelf presence, more examples, more breathing room. Usually around ${range} words.`
      : `The safest nonfiction balance for paid books. Usually around ${range} words.`;
  }
  return bookLength === "compact"
    ? `Daha hızlı okunan ve odaklı yapı. Genelde ${range} kelime civarı.`
    : bookLength === "extended"
    ? `Daha raf hissi veren, daha örnekli ve daha nefesli yapı. Genelde ${range} kelime civarı.`
    : `The safest balance for paid non-fiction. Usually around ${range} words.`;
}

function buildChapterGenerationBrief(item: FunnelOutlineItem, bookLength: FunnelBookLength, language: FunnelLanguage) {
  const words = chapterWordRange(item.length, bookLength);
  if (!isTurkishLanguage(language)) {
    return `${item.summary.trim()} Chapter role: ${chapterRoleLabel(item.role, language)}. Suggested depth: ${chapterLengthLabel(item.length, language)}. Target length: ${words.min}-${words.max} words.`;
  }
  return `${item.summary.trim()} Bölüm rolü: ${chapterRoleLabel(item.role, language)}. Önerilen derinlik: ${chapterLengthLabel(item.length, language)}. Hedef uzunluk: ${words.min}-${words.max} kelime.`;
}

export function buildGuidedBookPayload(draft: FunnelDraft, author: string) {
  const plannedOutline = draft.outline.length ? draft.outline : localOutlineSuggestions(draft);
  const totalWords = outlineWordRange(plannedOutline, draft.bookLength);
  const chapters = plannedOutline.map((item, index) => {
    const words = chapterWordRange(item.length, draft.bookLength);
    return {
      title: item.title.trim(),
      summary: item.summary.trim(),
      role: item.role,
      length: item.length,
      target_min_words: words.min,
      target_max_words: words.max,
      content: buildChapterGenerationBrief(item, draft.bookLength, draft.language),
      number: index + 1,
    };
  });

  return {
    slug: slugify(draft.generatedSlug || draft.title || draft.topic),
    title: (draft.title || titleCase(draft.topic)).trim(),
    subtitle: draft.subtitle.trim(),
    language: draft.language,
    author: draft.authorName.trim() || author.trim() || "Kitap Sahibi",
    publisher: draft.imprint.trim() || "Book Generator",
    year: String(new Date().getFullYear()),
    description: buildDraftDescription(draft),
    author_bio: draft.authorBio.trim(),
    branding_mark: draft.logoText.trim(),
    branding_logo_url: draft.logoUrl.trim(),
    cover_brief: draft.coverBrief.trim(),
    generate_cover: true,
    fast: draft.depth === "hizli",
    book_length_tier: draft.bookLength,
    target_word_count_min: totalWords.min,
    target_word_count_max: totalWords.max,
    chapter_plan: chapters.map(({ title, summary, role, length, target_min_words, target_max_words, number }) => ({
      number,
      title,
      summary,
      role,
      length,
      target_min_words,
      target_max_words,
    })),
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
      return "Business book";
    case "egitim":
      return "Education";
    case "cocuk":
      return "Children's book";
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
        ? "Clear and instructive"
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
        ? "Young and energetic"
        : "Modern editoryal";
}