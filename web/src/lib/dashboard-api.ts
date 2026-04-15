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
  render_mode?: string;
  front_render_mode?: string;
  text_strategy?: string;
  cover_mode?: string;
  style_direction?: string;
  wrap_scope?: string;
  quality_gate?: string;
  cover_style_mode?: string;
  back_cover_mode?: string;
  pair_score?: number;
  text_safe_zone_status?: string;
  front_ai_attempt_count?: number;
  front_text_validation_score?: number;
  front_visual_grade?: number;
  front_genre_fit_score?: number;
  front_hard_reject_reasons?: string[];
  selected_cover_confidence?: number;
  visual_flags?: {
    hasPeople?: boolean;
    focalConceptCount?: number;
    looksLikeDashboard?: boolean;
    hasCleanTypographyBands?: boolean;
    noisyFullPage?: boolean;
    hasWatermarkOrBadge?: boolean;
    hasExtraneousText?: boolean;
    categoryFit?: number;
    thumbnailReadability?: number;
    titleReadability?: number;
    typographyQuality?: number;
    bookstoreRealism?: number;
    notes?: string[];
  };
  rejection_reasons?: string[];
  text_validation?: {
    valid?: boolean;
    eligible?: boolean;
    validationMode?: string;
    ocrText?: string;
    ocrFields?: {
      title?: string;
      subtitle?: string;
      author?: string;
      all_text?: string;
    };
    targets?: {
      title?: string;
      subtitle?: string;
      author?: string;
    };
    prefixGuardFailed?: boolean;
    promptLeakageFailed?: boolean;
    titleDuplicationFailed?: boolean;
    watermarkOrBadgeFailed?: boolean;
    titleScore?: number;
    subtitleScore?: number;
    authorScore?: number;
    combinedScore?: number;
    extraWordCount?: number;
    textSimilarityScore?: number;
    hardRejectReasons?: string[];
    minorIssues?: string[];
  };
};

export type ChapterState = 'draft' | 'writing' | 'review' | 'done';

export type Chapter = {
  number?: number;
  title: string;
  content: string;
  state?: ChapterState;
  target_words?: number;
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
  chapter_target_count?: number;
  chapter_ready_count?: number;
  chapters_complete?: boolean;
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
  exports_dirty?: boolean;
  started_at?: string;
  updated_at?: string;
  completed_at?: string;
  current_word_count?: number;
  target_word_count?: number;
  current_step_code?: "cover" | "first_chapter" | "full_book" | "export";
  current_step_label?: string;
  cover_eta_seconds?: number;
  first_chapter_eta_seconds?: number;
  preview_retry?: {
    limit: number;
    used: number;
    remaining: number;
    allowed: boolean;
    reason?: string;
    policy?: "bounded" | "transient";
    retry_after_seconds?: number;
  };
  cover_gate_state?: "waiting_for_cover" | "cover_ready" | "timed_out";
  activity_timeline?: Array<{
    code: string;
    label: string;
    status: "done" | "active" | "queued" | "waiting" | "error";
    timestamp?: string;
    detail?: string;
  }>;
  activity_log?: Array<{
    code: string;
    label: string;
    status: "done" | "active" | "queued" | "waiting" | "error";
    timestamp?: string;
    detail?: string;
  }>;
  full_generation?: {
    active?: boolean;
    stage?: string;
    message?: string;
    error?: string;
    progress?: number;
    ready_count?: number;
    target_count?: number;
    failed_count?: number;
    eta_seconds?: number;
    avg_chapter_seconds?: number;
    eta_updated_at?: string;
    complete?: boolean;
    started_at?: string;
    updated_at?: string;
    completed_at?: string;
    word_count?: number;
    target_word_count?: number;
    chapter_count_floor?: number;
    chapter_count_ok?: boolean;
    length_complete?: boolean;
    chapter_generation_mode?: string;
    segment_count?: number;
    segment_index?: number;
    current_segment?: number;
    current_chapter?: number;
    pause_reason?: string;
    next_retry_at?: string;
  };
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
  front_cover_source?: "manual" | "variant" | "";
  back_cover_source?: "manual" | "variant" | "";
  cover_template?: string;
  cover_variant_count?: number;
  cover_generation_provider?: string;
  cover_composed?: boolean;
  cover_variants?: CoverVariant[];
  selected_cover_variant?: string;
  recommended_cover_variant?: string;
  back_cover_variant_family?: string;
  cover_family?: string;
  cover_text_strategy?: string;
  cover_mode?: string;
  style_direction?: string;
  wrap_scope?: string;
  quality_gate?: string;
  cover_style_mode?: string;
  back_cover_mode?: string;
  text_safe_zone_status?: string;
  cover_branch?: string;
  cover_genre?: string;
  cover_subtopic?: string;
  cover_palette_key?: string;
  cover_layout_key?: string;
  cover_motif?: string;
  cover_lab_version?: string;
  cover_pair_score?: number;
  cover_rejection_reasons?: Record<string, string[]>;
  front_render_mode?: string;
  front_ai_attempt_count?: number;
  front_text_validation_score?: number;
  front_visual_grade?: number;
  front_genre_fit_score?: number;
  front_hard_reject_reasons?: string[];
  selected_cover_confidence?: number;
  isbn?: string;
  year?: string;
  edition_label?: string;
  print_label?: string;
  publication_city?: string;
  publication_country?: string;
  publisher_address?: string;
  publisher_phone?: string;
  publisher_email?: string;
  publisher_website?: string;
  publisher_certificate_no?: string;
  isbn13?: string;
  editor_name?: string;
  proofreader_name?: string;
  typesetter_name?: string;
  cover_designer_name?: string;
  printer_name?: string;
  printer_address?: string;
  printer_certificate_no?: string;
  copyright_statement?: string;
  imprint_block?: string;
  regenerate_professional_details?: boolean;
  details_generation_nonce?: string;
  fast?: boolean;
  book_length_mode?: string;
  book_length_tier?: string;
  chapter_generation_mode?: string;
  target_word_count_min?: number;
  target_word_count_max?: number;
  chapter_target_words?: number;
  book_target_words?: number;
  book_generation_complete?: boolean;
  opening_sequence_valid?: boolean | null;
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
    | "edition_label"
    | "print_label"
    | "publication_city"
    | "publication_country"
    | "publisher_address"
    | "publisher_phone"
    | "publisher_email"
    | "publisher_website"
    | "publisher_certificate_no"
    | "isbn13"
    | "editor_name"
    | "proofreader_name"
    | "typesetter_name"
    | "cover_designer_name"
    | "printer_name"
    | "printer_address"
    | "printer_certificate_no"
    | "copyright_statement"
    | "imprint_block"
    | "cover_image"
    | "back_cover_image"
    | "front_cover_source"
    | "back_cover_source"
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
  has_CODEFAST_API_KEY?: boolean;
  has_cover_password?: boolean;
  cover_service: string;
  cover_username: string;
  cover_password: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  GROQ_API_KEY?: string;
  ollama_model?: string;
  default_author?: string;
  default_publisher?: string;
};

type ApiOptions = RequestInit & {
  json?: unknown;
  timeoutMs?: number;
};

export const BACKEND_PUBLIC_ORIGIN =
  process.env.NEXT_PUBLIC_DASHBOARD_ORIGIN || "http://127.0.0.1:8765";
const API_TIMEOUT_MS = 20_000;
const API_BOOKS_TIMEOUT_MS = 35_000;
const API_BOOK_PREVIEW_TIMEOUT_MS = 45_000;
const API_WORKFLOW_TIMEOUT_MS = 240_000;
const API_BOOKS_BACKOFF_MS = 5_000;
const API_SETTINGS_BACKOFF_MS = 5_000;
const API_BOOK_CREATE_RETRY_DELAYS_MS = [1_200, 2_500, 5_000];
const API_WORKFLOW_RETRY_DELAYS_MS = [700, 1_600, 3_200];
const API_BOOKS_CACHE_TTL_MS = 2_000;
const API_BOOKS_STALE_CACHE_TTL_MS = 60_000;
const API_SETTINGS_CACHE_TTL_MS = 5_000;

let booksUnavailableUntil = 0;
let settingsUnavailableUntil = 0;
let booksInFlight: Promise<Book[]> | null = null;
let settingsInFlight: Promise<Settings> | null = null;
let booksCache: { value: Book[]; expiresAt: number } | null = null;
let booksStaleCache: { value: Book[]; expiresAt: number } | null = null;
let settingsCache: { value: Settings; expiresAt: number } | null = null;

export class BackendUnavailableError extends Error {
  readonly code = "BACKEND_UNAVAILABLE";

  constructor(message = "Service is temporarily unavailable.") {
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

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

function isRetryableBackendError(error: unknown) {
  return isBackendUnavailableError(error) || (isApiRequestError(error) && error.status >= 500);
}

function readBooksCache() {
  if (!booksCache) return null;
  if (Date.now() >= booksCache.expiresAt) {
    booksCache = null;
    return null;
  }
  return booksCache.value;
}

function writeBooksCache(value: Book[]) {
  booksCache = { value, expiresAt: Date.now() + API_BOOKS_CACHE_TTL_MS };
  booksStaleCache = { value, expiresAt: Date.now() + API_BOOKS_STALE_CACHE_TTL_MS };
}

function clearBooksCache() {
  booksCache = null;
}

function readBooksStaleCache() {
  if (!booksStaleCache) return null;
  if (Date.now() >= booksStaleCache.expiresAt) {
    booksStaleCache = null;
    return null;
  }
  return booksStaleCache.value;
}

function readSettingsCache() {
  if (!settingsCache) return null;
  if (Date.now() >= settingsCache.expiresAt) {
    settingsCache = null;
    return null;
  }
  return settingsCache.value;
}

function writeSettingsCache(value: Settings) {
  settingsCache = { value, expiresAt: Date.now() + API_SETTINGS_CACHE_TTL_MS };
}

function timeoutForPath(path: string) {
  const normalized = path.split("?")[0] || path;
  if (normalized === "/api/books") {
    return API_BOOKS_TIMEOUT_MS;
  }
  if (/^\/api\/books\/[^/]+\/preview(?:-bootstrap)?$/.test(normalized)) {
    return API_BOOK_PREVIEW_TIMEOUT_MS;
  }
  if (/^\/api\/books\/[^/]+\/build$/.test(normalized)) {
    return API_WORKFLOW_TIMEOUT_MS;
  }
  if (normalized === "/api/workflows") {
    return API_WORKFLOW_TIMEOUT_MS;
  }
  return API_TIMEOUT_MS;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function retryTransientRequest<T>(
  operation: () => Promise<T>,
  retryDelays: readonly number[],
  fallbackMessage: string,
) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const canRetry = isRetryableBackendError(error) && attempt < retryDelays.length;
      if (!canRetry) {
        if (isRetryableBackendError(error)) {
          throw new BackendUnavailableError(fallbackMessage);
        }
        throw error;
      }
      await wait(retryDelays[attempt]);
    }
  }

  if (isRetryableBackendError(lastError)) {
    throw new BackendUnavailableError(fallbackMessage);
  }
  throw lastError instanceof Error ? lastError : new BackendUnavailableError(fallbackMessage);
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
    const timeoutMs = options.timeoutMs ?? timeoutForPath(path);
    response = await fetchWithTimeout(`/api/backend${path}`, {
      ...options,
      headers,
      body,
      cache: "no-store",
    }, timeoutMs);
  } catch {
    throw new BackendUnavailableError();
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const payloadCode =
      typeof payload === "string" ? undefined : (payload?.code as string | undefined);
    if (
      response.status === 503 ||
      payloadCode === "BACKEND_UNAVAILABLE"
    ) {
      const message =
        typeof payload === "string"
          ? payload
          : (payload?.error as string) || "BACKEND_UNAVAILABLE: Service is temporarily unavailable.";
      throw new BackendUnavailableError(message);
    }

    const message =
      typeof payload === "string"
        ? payload
        : (payload?.error as string) || (payload?.output as string) || "Request failed.";
    throw new ApiRequestError(message, response.status, payloadCode);
  }

  return payload as T;
}

export async function loadBooks() {
  const cachedBooks = readBooksCache();
  if (cachedBooks) {
    return cachedBooks;
  }

  if (Date.now() < booksUnavailableUntil) {
    const staleBooks = readBooksStaleCache();
    if (staleBooks) {
      return staleBooks;
    }
    throw new BackendUnavailableError();
  }

  if (booksInFlight) {
    return booksInFlight;
  }

  booksInFlight = (async () => {
    try {
      const payload = await api<{ books: Book[] }>("/api/books");
      const nextBooks = payload.books || [];
      booksUnavailableUntil = 0;
      writeBooksCache(nextBooks);
      return nextBooks;
    } catch (error) {
      if (isApiRequestError(error)) {
        if (error.status >= 500) {
          const staleBooks = readBooksStaleCache();
          if (staleBooks) {
            return staleBooks;
          }
          booksUnavailableUntil = Date.now() + API_BOOKS_BACKOFF_MS;
          throw new BackendUnavailableError(error.message);
        }
        return [];
      }
      if (isBackendUnavailableError(error)) {
        const staleBooks = readBooksStaleCache();
        if (staleBooks) {
          return staleBooks;
        }
        booksUnavailableUntil = Date.now() + API_BOOKS_BACKOFF_MS;
      }
      throw error;
    } finally {
      booksInFlight = null;
    }
  })();

  return booksInFlight;
}

export async function loadBook(slug: string) {
  return api<Book>(`/api/books/${encodeURIComponent(slug)}`);
}

export async function loadBookPreview(slug: string) {
  return api<BookPreview>(`/api/books/${encodeURIComponent(slug)}/preview`);
}

export async function saveBook(payload: Partial<Book>) {
  const nextBook = await retryTransientRequest(
    () => api<Book>("/api/books", { method: "POST", json: payload }),
    API_BOOK_CREATE_RETRY_DELAYS_MS,
    "Preview service is waking up. Please wait a few seconds and try Generate again.",
  );
  clearBooksCache();
  return nextBook;
}

export async function startBookPreviewPipeline(
  slug: string,
  options?: {
    trigger?: "manual" | "admin" | "system";
    bypassManualRetryLimit?: boolean;
  },
) {
  const path = `/api/books/${encodeURIComponent(slug)}/preview-bootstrap`;
  const retryDelays = [700, 1500, 3000];
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      const result = await api<{ ok: boolean; started: boolean; slug?: string; generation: BookStatus }>(path, {
        method: "POST",
        json: {
          trigger: options?.trigger || "system",
          bypass_manual_retry_limit: Boolean(options?.bypassManualRetryLimit),
        },
      });
      clearBooksCache();
      return result;
    } catch (error) {
      lastError = error;
      const canRetry = isBackendUnavailableError(error) && attempt < retryDelays.length;
      if (!canRetry) {
        throw error;
      }
      await wait(retryDelays[attempt]);
    }
  }

  throw lastError instanceof Error ? lastError : new BackendUnavailableError();
}

export async function startBookFullPipeline(
  slug: string,
  options?: { force?: boolean },
) {
  const path = `/api/books/${encodeURIComponent(slug)}/full-bootstrap`;
  if (options?.force) {
    return api<{ ok: boolean; started: boolean; generation?: BookStatus; full_generation?: BookStatus["full_generation"] }>(
      path,
      {
        method: "POST",
        json: { force: true },
      },
    );
  }
  return api<{ ok: boolean; started: boolean; generation?: BookStatus; full_generation?: BookStatus["full_generation"] }>(
    path,
    { method: "GET" },
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
    throw new Error(payload?.error || "Cover selection could not be saved.");
  }
  clearBooksCache();
  return {
    ok: true,
    book: payload.book,
    selectedVariantId: payload.selectedVariantId || variantId,
  };
}

export async function loadSettings() {
  const cachedSettings = readSettingsCache();
  if (cachedSettings) {
    return cachedSettings;
  }

  if (Date.now() < settingsUnavailableUntil) {
    throw new BackendUnavailableError();
  }

  if (settingsInFlight) {
    return settingsInFlight;
  }

  settingsInFlight = (async () => {
    try {
      const payload = await api<Settings>("/api/settings");
      settingsUnavailableUntil = 0;
      writeSettingsCache(payload);
      return payload;
    } catch (error) {
      if (isApiRequestError(error) && error.status >= 500) {
        settingsUnavailableUntil = Date.now() + API_SETTINGS_BACKOFF_MS;
        throw new BackendUnavailableError(error.message);
      }
      if (isBackendUnavailableError(error)) {
        settingsUnavailableUntil = Date.now() + API_SETTINGS_BACKOFF_MS;
      }
      throw error;
    } finally {
      settingsInFlight = null;
    }
  })();

  return settingsInFlight;
}

export async function saveSettings(payload: Partial<Settings>) {
  const nextSettings = await api<Settings>("/api/settings", { method: "POST", json: payload });
  settingsUnavailableUntil = 0;
  writeSettingsCache(nextSettings);
  return nextSettings;
}

export async function runWorkflow(
  payload: Record<string, unknown>,
  options?: { timeoutMs?: number; retryDelaysMs?: readonly number[] },
) {
  const result = await retryTransientRequest(
    () =>
      api<Record<string, unknown>>("/api/workflows", {
        method: "POST",
        json: payload,
        timeoutMs: options?.timeoutMs,
      }),
    options?.retryDelaysMs || API_WORKFLOW_RETRY_DELAYS_MS,
    "AI suggestions are temporarily warming up. Please try again in a few seconds.",
  );
  clearBooksCache();
  return result;
}

export async function buildBook(slug: string, payload: Record<string, unknown>) {
  const result = await api<Record<string, unknown>>(`/api/books/${encodeURIComponent(slug)}/build`, {
    method: "POST",
    json: payload,
  });
  clearBooksCache();
  return result;
}

export async function preflightBook(slug: string, payload: Record<string, unknown>) {
  const result = await api<Record<string, unknown>>(`/api/books/${encodeURIComponent(slug)}/preflight`, {
    method: "POST",
    json: payload,
  });
  clearBooksCache();
  return result;
}

export async function readBookFile(slug: string, relativePath: string) {
  return api<{ content: string }>(
    `/api/books/${encodeURIComponent(slug)}/file?path=${encodeURIComponent(relativePath)}`,
  );
}

export async function saveBookFile(slug: string, relativePath: string, content: string) {
  const result = await api<Record<string, unknown>>(`/api/books/${encodeURIComponent(slug)}/file`, {
    method: "POST",
    json: { relative_path: relativePath, content },
  });
  clearBooksCache();
  return result;
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File could not be read."));
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      if (!base64) {
        reject(new Error("File content could not be parsed."));
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
  const result = await api<{ saved_asset: string; book: Book }>(`/api/books/${encodeURIComponent(slug)}/asset`, {
    method: "POST",
    json: {
      kind,
      filename: file.name,
      content_base64,
    },
  });
  clearBooksCache();
  return result;
}

export function providerLooksReady(settings: Partial<Settings>) {
  return Boolean(
    settings.has_CODEFAST_API_KEY ||
      settings.CODEFAST_API_KEY,
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
      ? `${produced.length} files produced or updated.`
      : "Operation completed."
    : firstLine || "Operation failed.";
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
      rehber: "Step-by-step applicable guide from beginner to advanced",
      is: "Practical application plan for more consistent results",
      egitim: "Simple and systematic learning path for beginners",
      cocuk: "Warm and clear narrative for young readers",
      diger: "Focused content built around a single powerful idea",
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
      ? `A ${input.language} book prepared on ${input.topic} for ${input.audience}.`
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
          ? `A focused chapter draft on ${input.topic} for ${input.audience}.`
          : `Focus on ${input.topic} for ${input.audience}.`,
    })),
  };
}
