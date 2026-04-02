import { chapterLabelForLanguage, formatChapterReference } from "@/lib/book-language";
import { slugify, titleCase } from "@/lib/utils";

export type Artifact = {
  name: string;
  relative_path: string;
  url: string;
  size?: number;
  modified?: string;
  is_text?: boolean;
};

export type CoverVariant = {
  id: string;
  family: string;
  label: string;
  genre?: string;
  subtopic?: string;
  layout?: string;
  motif?: string;
  paletteKey?: string;
  front_image: string;
  front_svg?: string;
  back_image: string;
  back_svg?: string;
  art_image?: string;
  score?: number;
  recommended?: boolean;
  provider?: string;
  template?: string;
  preferred_zone?: string;
};

export type Chapter = {
  number?: number;
  title: string;
  content: string;
  filename?: string;
  relative_path?: string;
  url?: string;
};

export type BookChapterPlan = {
  number?: number;
  title: string;
  summary?: string;
  role?: string;
  length?: string;
  target_min_words?: number;
  target_max_words?: number;
};

export type BookStatus = {
  chapter_count: number;
  asset_count: number;
  extra_count: number;
  research_count: number;
  export_count: number;
  active?: boolean;
  stage?: string;
  message?: string;
  progress?: number;
  error?: string;
  cover_ready?: boolean;
  first_chapter_ready?: boolean;
  product_ready?: boolean;
  preview_ready?: boolean;
  cover_state?: string;
  first_chapter_state?: string;
  started_at?: string;
  updated_at?: string;
  completed_at?: string;
};

export type Book = {
  slug: string;
  title: string;
  subtitle?: string;
  language?: string;
  author?: string;
  publisher?: string;
  description?: string;
  author_bio?: string;
  branding_mark?: string;
  branding_logo_url?: string;
  cover_brief?: string;
  book_type?: string;
  generate_cover?: boolean;
  cover_art_image?: string;
  cover_image?: string;
  back_cover_image?: string;
  cover_template?: string;
  cover_variant_count?: number;
  cover_generation_provider?: string;
  cover_composed?: boolean;
  cover_variants?: CoverVariant[];
  selected_cover_variant?: string;
  recommended_cover_variant?: string;
  back_cover_variant_family?: string;
  cover_family?: string;
  cover_branch?: string;
  cover_genre?: string;
  cover_subtopic?: string;
  cover_palette_key?: string;
  cover_layout_key?: string;
  cover_motif?: string;
  cover_lab_version?: string;
  isbn?: string;
  year?: string;
  fast?: boolean;
  book_length_tier?: string;
  target_word_count_min?: number;
  target_word_count_max?: number;
  chapter_plan?: BookChapterPlan[];
  outline_file?: string;
  book_dir?: string;
  latest_export_dir?: string;
  chapters: Chapter[];
  artifacts?: Artifact[];
  resources?: {
    outline?: Artifact | null;
    assets?: Artifact[];
    extras?: Artifact[];
    references?: Artifact[];
    research?: Artifact[];
    reports?: Artifact[];
    exports?: Artifact[];
  };
  status: BookStatus;
  chapter_count?: number;
};

export type BookPreviewSection = {
  number?: number;
  title: string;
  content?: string;
  teaser?: string;
  partial?: boolean;
  word_count?: number;
};

export type BookPreviewCoverLab = {
  variants: CoverVariant[];
  selectedVariantId: string;
  recommendedVariantId: string;
  generationState: "idle" | "queued" | "running" | "ready";
  slots: number;
  readyCount: number;
  queuedSlots: number;
};

export type BookPreviewCommerce = {
  primaryOffer: {
    planId: "premium";
    label: string;
    priceCents: number;
    originalPriceCents: number;
    badge: string;
    description: string;
  };
  secondaryOffer: {
    planId: "starter";
    label: string;
    priceCents: number;
    interval: string;
    quotaLabel: string;
    description: string;
  };
  bonusDeadlineAt: string | null;
  paywallState: "locked" | "unlocked";
  launchBonus: string[];
  trustPoints: string[];
  recoveryEmailEnabled: boolean;
};

export type BookPreview = {
  book: Pick<
    Book,
    | "slug"
    | "title"
    | "subtitle"
    | "language"
    | "author"
    | "publisher"
    | "description"
    | "author_bio"
    | "branding_mark"
    | "branding_logo_url"
    | "cover_brief"
    | "cover_image"
    | "back_cover_image"
    | "status"
  >;
  preview: {
    ratio: number;
    toc: Array<{ number?: number; title: string }>;
    visible_sections: BookPreviewSection[];
    locked_sections: BookPreviewSection[];
  };
  entitlements: {
    can_download_pdf: boolean;
    can_download_epub: boolean;
    can_view_full_book: boolean;
  };
  generation: BookStatus;
  coverLab?: BookPreviewCoverLab;
  commerce?: BookPreviewCommerce;
};

export type Settings = {
  CODEFAST_API_KEY: string;
  GEMINI_API_KEY: string;
  OPENAI_API_KEY: string;
  GROQ_API_KEY: string;
  has_CODEFAST_API_KEY?: boolean;
  has_GEMINI_API_KEY?: boolean;
  has_OPENAI_API_KEY?: boolean;
  has_GROQ_API_KEY?: boolean;
  has_cover_password?: boolean;
  default_author: string;
  default_publisher: string;
  ollama_enabled: boolean;
  ollama_base_url: string;
  ollama_model: string;
  cover_service: string;
  cover_username: string;
  cover_password: string;
};

type ApiOptions = RequestInit & {
  json?: unknown;
};

export const BACKEND_PUBLIC_ORIGIN =
  process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN || "http://127.0.0.1:8765";

export class BackendUnavailableError extends Error {
  readonly code = "BACKEND_UNAVAILABLE";

  constructor(message = "Servis gecici olarak erisilemez durumda.") {
    super(message);
    this.name = "BackendUnavailableError";
  }
}

export function isBackendUnavailableError(error: unknown) {
  return (
    error instanceof BackendUnavailableError ||
    (error instanceof Error && error.message.includes("BACKEND_UNAVAILABLE"))
  );
}

async function api<T>(path: string, options: ApiOptions = {}) {
  const headers = new Headers(options.headers || {});
  let body = options.body;
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
  }

  let response: Response;
  try {
    response = await fetch(`/api/backend${path}`, {
      ...options,
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    throw new BackendUnavailableError();
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (
      response.status === 503 ||
      (typeof payload !== "string" && payload?.code === "BACKEND_UNAVAILABLE")
    ) {
      const message =
        typeof payload === "string"
          ? payload
          : (payload?.error as string) || "BACKEND_UNAVAILABLE: Servis gecici olarak erisilemiyor.";
      throw new BackendUnavailableError(message);
    }

    const message =
      typeof payload === "string"
        ? payload
        : (payload?.error as string) || (payload?.output as string) || "İstek başarısız.";
    throw new Error(message);
  }

  return payload as T;
}

export async function loadBooks() {
  const payload = await api<{ books: Book[] }>("/api/books");
  return payload.books || [];
}

export async function loadBook(slug: string) {
  return api<Book>(`/api/books/${encodeURIComponent(slug)}`);
}

export async function loadBookPreview(slug: string) {
  return api<BookPreview>(`/api/books/${encodeURIComponent(slug)}/preview`);
}

export async function saveBook(payload: Partial<Book>) {
  return api<Book>("/api/books", { method: "POST", json: payload });
}

export async function startBookPreviewPipeline(slug: string) {
  return api<{ ok: boolean; started: boolean; book: Book; generation: BookStatus }>(
    `/api/books/${encodeURIComponent(slug)}/preview-bootstrap`,
    {
      method: "POST",
      json: {},
    },
  );
}

export async function selectBookCoverVariant(slug: string, variantId: string) {
  const response = await fetch(`/api/books/${encodeURIComponent(slug)}/cover-variant/select`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variantId }),
    credentials: "include",
  });
  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; error?: string; book?: Book; selectedVariantId?: string }
    | null;
  if (!response.ok || !payload?.book) {
    throw new Error(payload?.error || "Kapak seçimi kaydedilemedi.");
  }
  return {
    ok: true,
    book: payload.book,
    selectedVariantId: payload.selectedVariantId || variantId,
  };
}

export async function loadSettings() {
  return api<Settings>("/api/settings");
}

export async function saveSettings(payload: Partial<Settings>) {
  return api<Settings>("/api/settings", { method: "POST", json: payload });
}

export async function runWorkflow(payload: Record<string, unknown>) {
  return api<Record<string, unknown>>("/api/workflows", { method: "POST", json: payload });
}

export async function buildBook(slug: string, payload: Record<string, unknown>) {
  return api<Record<string, unknown>>(`/api/books/${encodeURIComponent(slug)}/build`, {
    method: "POST",
    json: payload,
  });
}

export async function preflightBook(slug: string, payload: Record<string, unknown>) {
  return api<Record<string, unknown>>(`/api/books/${encodeURIComponent(slug)}/preflight`, {
    method: "POST",
    json: payload,
  });
}

export async function readBookFile(slug: string, relativePath: string) {
  return api<{ content: string }>(
    `/api/books/${encodeURIComponent(slug)}/file?path=${encodeURIComponent(relativePath)}`,
  );
}

export async function saveBookFile(slug: string, relativePath: string, content: string) {
  return api<Record<string, unknown>>(`/api/books/${encodeURIComponent(slug)}/file`, {
    method: "POST",
    json: { relative_path: relativePath, content },
  });
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      if (!base64) {
        reject(new Error("Dosya içeriği çözümlenemedi."));
        return;
      }
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadBookAsset(
  slug: string,
  file: File,
  kind: "cover_image" | "back_cover_image" | "asset" = "asset",
) {
  const content_base64 = await fileToBase64(file);
  return api<{ saved_asset: string; book: Book }>(`/api/books/${encodeURIComponent(slug)}/asset`, {
    method: "POST",
    json: {
      kind,
      filename: file.name,
      content_base64,
    },
  });
}

export function providerLooksReady(settings: Partial<Settings>) {
  return Boolean(
    settings.has_CODEFAST_API_KEY ||
      settings.has_GEMINI_API_KEY ||
      settings.has_OPENAI_API_KEY ||
      settings.has_GROQ_API_KEY ||
      settings.CODEFAST_API_KEY ||
      settings.GEMINI_API_KEY ||
      settings.OPENAI_API_KEY ||
      settings.GROQ_API_KEY ||
      settings.ollama_enabled,
  );
}

export function responseSummary(response: Record<string, unknown>) {
  const produced = Array.isArray(response.produced_files)
    ? (response.produced_files as Artifact[])
    : [];
  const warnings = Array.isArray(response.warnings)
    ? (response.warnings as string[])
    : [];
  const firstLine = String(response.output || "").trim().split("\n").find(Boolean) || "";
  const short = response.ok
    ? produced.length
      ? `${produced.length} dosya üretildi veya güncellendi.`
      : "İşlem tamamlandı."
    : firstLine || "İşlem başarısız.";
  return { short, produced, warnings };
}

export function buildAssetUrl(url?: string) {
  if (!url) return "#";
  if (/^(https?:\/\/|data:)/.test(url)) return url;
  if (url.startsWith("/api/backend/")) return url;
  const normalized = url.startsWith("/") ? url : `/${url}`;
  return `/api/backend${normalized}`;
}

export function buildBookAssetUrl(slug?: string, relativePath?: string) {
  if (!relativePath) return "#";
  if (/^(https?:\/\/|data:)/.test(relativePath)) return relativePath;
  if (relativePath.startsWith("/workspace/")) {
    return buildAssetUrl(relativePath);
  }
  const cleaned = relativePath.replace(/^\/+/, "");
  const rooted = cleaned.startsWith("book_outputs/") || !slug ? cleaned : `book_outputs/${slug}/${cleaned}`;
  const encoded = rooted
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/api/backend/workspace/${encoded}`;
}

export function latestInsightFile(book?: Book | null) {
  const files = book?.resources?.research || [];
  return (
    files
      .filter((file) =>
        /\/research\/insights\/ai_research_insights_.*\.json$/i.test(file.relative_path || ""),
      )
      .sort(
        (left, right) =>
          new Date(right.modified || 0).getTime() - new Date(left.modified || 0).getTime(),
      )[0] || null
  );
}

function normalizeBookLanguage(language?: string) {
  const value = String(language || "").trim().toLowerCase();
  if (value.startsWith("tr") || value === "turkish" || value === "türkçe" || value === "turkce") {
    return "Turkish";
  }
  if (value.startsWith("en") || value === "english" || value === "ingilizce") {
    return "English";
  }
  const aliases: Record<string, string> = {
    german: "German",
    deutsch: "German",
    almanca: "German",
    french: "French",
    français: "French",
    francais: "French",
    fransızca: "French",
    spanish: "Spanish",
    espanol: "Spanish",
    español: "Spanish",
    ispanyolca: "Spanish",
    italian: "Italian",
    italiano: "Italian",
    italyanca: "Italian",
    portuguese: "Portuguese",
    português: "Portuguese",
    portugues: "Portuguese",
    portekizce: "Portuguese",
    dutch: "Dutch",
    nederlands: "Dutch",
    hollandaca: "Dutch",
    polish: "Polish",
    polski: "Polish",
    lehçe: "Polish",
    lehce: "Polish",
    romanian: "Romanian",
    romana: "Romanian",
    română: "Romanian",
    romanaca: "Romanian",
    swedish: "Swedish",
    svenska: "Swedish",
    isveççe: "Swedish",
    isvecce: "Swedish",
    danish: "Danish",
    dansk: "Danish",
    danca: "Danish",
    norwegian: "Norwegian",
    norsk: "Norwegian",
    norveççe: "Norwegian",
    norvecce: "Norwegian",
    finnish: "Finnish",
    suomi: "Finnish",
    fince: "Finnish",
    czech: "Czech",
    čeština: "Czech",
    cestina: "Czech",
    çekçe: "Czech",
    cekce: "Czech",
    slovak: "Slovak",
    slovenčina: "Slovak",
    slovencina: "Slovak",
    slovakca: "Slovak",
    hungarian: "Hungarian",
    magyar: "Hungarian",
    macarca: "Hungarian",
    greek: "Greek",
    ελληνικά: "Greek",
    yunanca: "Greek",
    russian: "Russian",
    русский: "Russian",
    rusça: "Russian",
    rusca: "Russian",
    ukrainian: "Ukrainian",
    українська: "Ukrainian",
    ukraynaca: "Ukrainian",
    arabic: "Arabic",
    العربية: "Arabic",
    arapça: "Arabic",
    arapca: "Arabic",
    hindi: "Hindi",
    हिन्दी: "Hindi",
    indonesian: "Indonesian",
    "bahasa indonesia": "Indonesian",
    endonezce: "Indonesian",
    malay: "Malay",
    "bahasa melayu": "Malay",
    malezce: "Malay",
  };
  if (aliases[value]) {
    return aliases[value];
  }
  return language?.trim() || "English";
}

export function createFallbackBookPayload(input: {
  type: string;
  topic: string;
  audience: string;
  language: string;
  depth: string;
  author: string;
}) {
  const chapterCount = input.depth === "hizli" ? 5 : input.depth === "detayli" ? 9 : 7;
  const title = titleCase(input.topic);
  const language = normalizeBookLanguage(input.language);
  const chapterLabel = chapterLabelForLanguage(language);
  const subtitleMap: Record<string, Record<string, string>> = {
    Turkish: {
      rehber: "Başlangıçtan ileri seviyeye adım adım uygulanabilir rehber",
      is: "Daha tutarlı sonuçlar için pratik uygulama planı",
      egitim: "Yeni başlayanlar için sade ve sistemli öğrenme yolu",
      cocuk: "Genç okurlar için sıcak ve anlaşılır anlatım",
      diger: "Tek bir güçlü fikir etrafında kurulan odaklı içerik",
    },
    English: {
      rehber: "A clear step-by-step guide",
      is: "A practical playbook for consistent results",
      egitim: "A simple training path for beginners",
      cocuk: "A warm and easy story for young readers",
      diger: "A focused book built from one clear idea",
    },
  };
  const subtitleSet = subtitleMap[language] || subtitleMap.English;
  const description =
    language === "Turkish"
      ? `${input.audience} için ${input.topic} konusunda hazırlanmış ${input.language} bir kitap.`
      : `A ${input.language} book about ${input.topic} for ${input.audience}.`;

  return {
    slug: slugify(title),
    title,
    subtitle: subtitleSet[input.type] || subtitleSet.diger,
    language,
    book_type: input.type,
    author: input.author,
    publisher: "Book Generator",
    year: String(new Date().getFullYear()),
    description,
    generate_cover: true,
    fast: input.depth === "hizli",
    chapters: Array.from({ length: chapterCount }, (_, index) => ({
      title: formatChapterReference(language, index + 1) || `${chapterLabel} ${index + 1}`,
      content:
        language === "Turkish"
          ? `${input.topic} konusunda ${input.audience} için odaklı bir bölüm taslağı.`
          : `Focus on ${input.topic} for ${input.audience}.`,
    })),
  };
}
