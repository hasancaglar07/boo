#!/usr/bin/env python3

from __future__ import annotations

import base64
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor, as_completed
import html
import json
import mimetypes
import os
import re
import shlex
import shutil
import subprocess
import threading
import time
import textwrap
import urllib.parse
import weakref
import zipfile
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Callable, TypeVar


ROOT_DIR = Path(__file__).resolve().parent
STATIC_DIR = ROOT_DIR / "dashboard"
BOOK_OUTPUTS_DIR = ROOT_DIR / "book_outputs"
METADATA_FILE_NAME = "dashboard_meta.json"
SETTINGS_FILE_NAME = "dashboard_settings.json"
LOG_FILE_NAME = "dashboard.log"
BOOK_GENERATOR_ENV_FILES = (
    ROOT_DIR / ".env.codefast.local",
    ROOT_DIR / ".env.local",
)
HOST = os.environ.get("BOOK_DASHBOARD_HOST", "127.0.0.1")
PORT = int(os.environ.get("BOOK_DASHBOARD_PORT", "8765"))
PREVIEW_PIPELINE_MIN_WORDS = 900
PREVIEW_PRIMARY_CHAPTER_WORD_LIMIT = int(os.environ.get("BOOK_PREVIEW_PRIMARY_CHAPTER_WORD_LIMIT", "1400"))
PREVIEW_SECONDARY_CHAPTER_WORD_LIMIT = int(os.environ.get("BOOK_PREVIEW_SECONDARY_CHAPTER_WORD_LIMIT", "220"))
PREVIEW_SKIP_NONPRIMARY_DURING_FULL_GENERATION = (
    os.environ.get("BOOK_PREVIEW_SKIP_NONPRIMARY_DURING_FULL_GENERATION", "1").strip() != "0"
)
ACTIVE_PREVIEW_PIPELINES: set[str] = set()
ACTIVE_PREVIEW_PIPELINES_LOCK = threading.Lock()
ACTIVE_FULL_CHAPTER_PIPELINES: set[str] = set()
ACTIVE_FULL_CHAPTER_PIPELINES_LOCK = threading.Lock()
FULL_CHAPTER_PIPELINE_CONCURRENCY = max(
    1,
    min(4, int(os.environ.get("BOOK_FULL_CHAPTER_PIPELINE_CONCURRENCY", "2") or "2")),
)
PIPELINE_RECOVERY_ENABLED = os.environ.get("BOOK_PIPELINE_RECOVERY_ENABLED", "1").strip() != "0"
PIPELINE_WATCHDOG_INTERVAL_SECONDS = max(
    15,
    int(os.environ.get("BOOK_PIPELINE_WATCHDOG_INTERVAL_SECONDS", "30") or "30"),
)
PIPELINE_STALE_SECONDS = max(
    60,
    int(os.environ.get("BOOK_PIPELINE_STALE_SECONDS", "180") or "180"),
)
IMAGE_PROVIDER_POLICY = os.environ.get("BOOK_IMAGE_PROVIDER_POLICY", "vertex_only").strip().lower().replace("-", "_")
PREVIEW_COVER_SERVICE = os.environ.get("BOOK_PREVIEW_COVER_SERVICE", "vertex-imagen-standard").strip() or "vertex-imagen-standard"
VERTEX_IMAGE_SERVICES = {
    "vertex-imagen-fast",
    "vertex-imagen-standard",
    "vertex-imagen-ultra",
    "vertex-gemini-flash-image",
}
VERTEX_API_KEY_ENV_NAMES = (
    "GOOGLE_API_KEY",
    "VERTEX_API_KEY",
    "GOOGLE_GENAI_API_KEY",
)
VERTEX_PROJECT_ENV_NAMES = (
    "GOOGLE_CLOUD_PROJECT",
    "GOOGLE_PROJECT_ID",
    "VERTEX_PROJECT_ID",
)
VERTEX_LOCATION_ENV_NAMES = (
    "GOOGLE_CLOUD_LOCATION",
    "VERTEX_LOCATION",
)

# Retry configuration for subprocess operations
SUBPROCESS_MAX_RETRIES = int(os.environ.get("SUBPROCESS_MAX_RETRIES", "3"))
SUBPROCESS_INITIAL_BACKOFF_MS = int(os.environ.get("SUBPROCESS_INITIAL_BACKOFF_MS", "700"))
SUBPROCESS_TIMEOUT_MULTIPLIER = float(os.environ.get("SUBPROCESS_TIMEOUT_MULTIPLIER", "1.5"))

# Timeout configuration for environment detection
ENV_DETECTION_TIMEOUT_SECONDS = int(os.environ.get("ENV_DETECTION_TIMEOUT_SECONDS", "10"))

# Dynamic timeout calculation
def calculate_timeout(base_timeout: int) -> int:
    """Calculate dynamic timeout based on multiplier and base value."""
    return int(base_timeout * SUBPROCESS_TIMEOUT_MULTIPLIER)


# Global thread pool for pipeline management
PIPELINE_THREAD_POOL_MAX_WORKERS = int(os.environ.get("PIPELINE_THREAD_POOL_MAX_WORKERS", "8"))
_pipeline_thread_pool: ThreadPoolExecutor | None = None
_pipeline_thread_pool_lock = threading.Lock()
_active_threads: weakref.WeakSet[threading.Thread] = weakref.WeakSet()
_active_threads_lock = threading.Lock()
_pipeline_watchdog_thread: threading.Thread | None = None
_pipeline_watchdog_lock = threading.Lock()
_pipeline_watchdog_stop_event = threading.Event()


def get_pipeline_thread_pool() -> ThreadPoolExecutor:
    """Get or create the global pipeline thread pool."""
    global _pipeline_thread_pool
    with _pipeline_thread_pool_lock:
        if _pipeline_thread_pool is None or _pipeline_thread_pool._shutdown:
            _pipeline_thread_pool = ThreadPoolExecutor(
                max_workers=PIPELINE_THREAD_POOL_MAX_WORKERS,
                thread_name_prefix="pipeline_worker",
            )
            append_log(f"Created pipeline thread pool with {PIPELINE_THREAD_POOL_MAX_WORKERS} workers")
        return _pipeline_thread_pool


def submit_pipeline_task(task_func: Callable[..., None], *args: Any, **kwargs: Any) -> threading.Thread:
    """Submit a task to the pipeline thread pool and track the thread."""
    pool = get_pipeline_thread_pool()
    future = pool.submit(task_func, *args, **kwargs)

    # Track the thread for monitoring
    with _active_threads_lock:
        # We can't directly get the thread from future, so we'll track completion
        pass

    # Add callback to track completion
    def task_completed(_: Any) -> None:
        with _active_threads_lock:
            pass  # Task completed, weakref will handle cleanup

    future.add_done_callback(task_completed)
    return future


def shutdown_pipeline_thread_pool(wait: bool = True, timeout: float | None = 30.0) -> None:
    """Gracefully shutdown the pipeline thread pool."""
    global _pipeline_thread_pool
    with _pipeline_thread_pool_lock:
        if _pipeline_thread_pool is not None and not _pipeline_thread_pool._shutdown:
            append_log("Shutting down pipeline thread pool...")
            _pipeline_thread_pool.shutdown(wait=wait, timeout=timeout)
            _pipeline_thread_pool = None
            append_log("Pipeline thread pool shutdown complete")


# LRU Cache implementation to prevent memory leaks
K = TypeVar("K")
V = TypeVar("V")


class LRUCache:
    """Thread-safe LRU cache with TTL and size limits."""

    def __init__(self, max_size: int = 100, default_ttl_seconds: float = 60.0):
        self._cache: OrderedDict[K, tuple[V, float]] = OrderedDict()
        self._max_size = max_size
        self._default_ttl = default_ttl_seconds
        self._lock = threading.Lock()

    def get(self, key: K, default: V | None = None) -> V | None:
        """Get a value from the cache, returning None if not found or expired."""
        with self._lock:
            if key not in self._cache:
                return default

            value, expires_at = self._cache[key]

            # Check if expired
            if time.time() > expires_at:
                del self._cache[key]
                return default

            # Move to end (most recently used)
            self._cache.move_to_end(key)
            return value

    def put(self, key: K, value: V, ttl_seconds: float | None = None) -> None:
        """Put a value in the cache with optional TTL override."""
        with self._lock:
            expires_at = time.time() + (ttl_seconds or self._default_ttl)

            if key in self._cache:
                # Update existing entry
                self._cache[key] = (value, expires_at)
                self._cache.move_to_end(key)
            else:
                # Add new entry, evict oldest if at capacity
                if len(self._cache) >= self._max_size:
                    self._cache.popitem(last=False)
                self._cache[key] = (value, expires_at)

    def invalidate(self, key: K) -> None:
        """Remove a specific key from the cache."""
        with self._lock:
            self._cache.pop(key, None)

    def clear(self) -> None:
        """Clear all entries from the cache."""
        with self._lock:
            self._cache.clear()

    def cleanup_expired(self) -> int:
        """Remove all expired entries, returning count of removed items."""
        with self._lock:
            now = time.time()
            expired_keys = [k for k, (_, expires_at) in self._cache.items() if now > expires_at]
            for key in expired_keys:
                del self._cache[key]
            return len(expired_keys)

    def size(self) -> int:
        """Return current cache size."""
        with self._lock:
            return len(self._cache)

    def stats(self) -> dict[str, Any]:
        """Return cache statistics."""
        with self._lock:
            now = time.time()
            active_count = sum(1 for _, expires_at in self._cache.values() if now <= expires_at)
            expired_count = len(self._cache) - active_count
            return {
                "total_entries": len(self._cache),
                "active_entries": active_count,
                "expired_entries": expired_count,
                "max_size": self._max_size,
                "utilization_percent": round((len(self._cache) / self._max_size) * 100, 2) if self._max_size > 0 else 0,
            }


# Global cache instances with proper LRU eviction
BOOK_SUMMARY_CACHE_TTL_SECONDS = int(os.environ.get("BOOK_SUMMARY_CACHE_TTL_SECONDS", "15"))
BOOK_SUMMARY_CACHE_LOCK = threading.Lock()
BOOK_SUMMARY_REFRESH_LOCK = threading.Lock()
BOOK_SUMMARY_CACHE = LRUCache(max_size=50, default_ttl_seconds=float(BOOK_SUMMARY_CACHE_TTL_SECONDS))

SETTINGS_CACHE_LOCK = threading.Lock()
SETTINGS_CACHE = LRUCache(max_size=10, default_ttl_seconds=300.0)  # 5 minutes default

PYTHON_LAUNCHER_CACHE: list[str] | None = None
PYTHON_LAUNCHER_LOCK = threading.Lock()
BASH_PATH_STYLE_CACHE: str | None = None
BASH_PATH_STYLE_LOCK = threading.Lock()

# Cache statistics endpoint
def get_cache_stats() -> dict[str, Any]:
    """Get statistics for all global caches."""
    return {
        "book_summary_cache": BOOK_SUMMARY_CACHE.stats(),
        "settings_cache": SETTINGS_CACHE.stats(),
    }
ROUTE_ALIASES = {
    "/": "index.html",
    "/kitap-olustur.html": "app/new/index.html",
    "/kullanim.html": "how-it-works/index.html",
}

# Authentication configuration
API_AUTH_ENABLED = os.environ.get("API_AUTH_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}
API_AUTH_KEY = os.environ.get("API_AUTH_KEY", "")
API_AUTH_HEADER = os.environ.get("API_AUTH_HEADER", "X-API-Key").strip()

# Trusted proxy configuration (for Next.js backend proxy)
TRUSTED_PROXIES = os.environ.get("TRUSTED_PROXIES", "127.0.0.1,::1").split(",")


def check_authentication(request_handler: BaseHTTPRequestHandler) -> bool:
    """
    Check if the request is authenticated.

    Returns True if authentication is disabled or valid credentials are provided.
    Returns False if authentication fails.
    """
    if not API_AUTH_ENABLED:
        return True

    if not API_AUTH_KEY:
        # Authentication enabled but no key configured - deny all
        append_log("API authentication enabled but no API_AUTH_KEY configured")
        return False

    # Check if request comes from trusted proxy (bypass auth)
    client_ip = request_handler.client_address[0]
    if client_ip in TRUSTED_PROXIES:
        return True

    # Check API key from header
    auth_header = request_handler.headers.get(API_AUTH_HEADER, "")
    if auth_header == API_AUTH_KEY:
        return True

    # Check API key from query parameter (less secure, for compatibility)
    # Note: This is less secure as the key may be logged
    from urllib.parse import urlparse, parse_qs
    parsed_url = urlparse(request_handler.path)
    query_params = parse_qs(parsed_url.query)
    api_key_param = query_params.get("api_key", [""])[0]
    if api_key_param == API_AUTH_KEY:
        return True

    append_log(f"Authentication failed for {client_ip} to {request_handler.path}")
    return False


def require_authentication(func: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator to require authentication for an endpoint."""
    def wrapper(self: DashboardHandler, *args: Any, **kwargs: Any) -> Any:
        if not check_authentication(self):
            self.send_response(HTTPStatus.UNAUTHORIZED)
            self.send_header("Content-Type", "application/json")
            self.send_header("WWW-Authenticate", f'{API_AUTH_HEADER} realm="Dashboard API"')
            self.end_headers()
            self.wfile.write(json.dumps({
                "ok": False,
                "error": "Authentication required",
                "code": "AUTH_REQUIRED"
            }).encode("utf-8"))
            return
        return func(self, *args, **kwargs)
    return wrapper

TEXT_EXTENSIONS = {
    ".csv",
    ".html",
    ".json",
    ".log",
    ".md",
    ".txt",
    ".toml",
    ".xml",
    ".yaml",
    ".yml",
}
IMAGE_EXTENSIONS = {".jpeg", ".jpg", ".pdf", ".png", ".svg", ".webp"}
PREFERRED_COVER_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp", ".svg")
WINDOWS_DRIVE_PATH_PATTERN = re.compile(r"^[A-Za-z]:[\\/]")
ENV_ASSIGNMENT_PATTERN = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*)=(.*)$")
FRONT_COVER_PREFIX_PRIORITY = (
    "front_cover_final",
    "showcase_front_cover",
    "ai_front_cover",
    "generated_front_cover",
)
BACK_COVER_PREFIX_PRIORITY = (
    "back_cover_final",
    "showcase_back_cover",
    "ai_back_cover",
    "generated_back_cover",
)
BUILD_FORMATS = ("all", "epub", "pdf", "html", "markdown", "mobi", "azw3")
LIGHTWEIGHT_BUILD_FORMATS = {"all", "epub", "pdf"}
CHAPTER_FINAL_FILE_PATTERN = re.compile(r"^chapter_\d+_final\.md$")
EXTRA_FILES = (
    "preface.md",
    "introduction.md",
    "dedication.md",
    "acknowledgments.md",
    "acknowledgements.md",
    "prologue.md",
    "epilogue.md",
    "glossary.md",
    "discussion.md",
    "endnotes.md",
    "further-reading.md",
    "thank-you-readers.md",
    "thank-you-to-readers.md",
    "appendices.md",
)
REFERENCE_ROOT_FILES = ("final_bibliography.md",)

DEFAULT_SETTINGS = {
    "CODEFAST_API_KEY": "",
    "default_author": "Book Creator",
    "default_publisher": "Book Generator",
    "cover_service": "auto",
    "cover_username": "",
    "cover_password": "",
}
SECRET_SETTING_KEYS = {
    "CODEFAST_API_KEY",
    "GOOGLE_API_KEY",
    "cover_password",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def append_log(message: str) -> None:
    log_path = ROOT_DIR / LOG_FILE_NAME
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(f"[{now_iso()}] {message.rstrip()}\n")


def slugify(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return normalized or "kitap"


def clamp_cover_variant_target_count(value: Any, default: int = 1) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = int(default)
    return max(1, min(3, parsed))


def chapter_number(path: Path) -> int:
    match = re.search(r"chapter_(\d+)", path.name)
    return int(match.group(1)) if match else 0


def normalize_book_language(value: Any) -> str:
    text = str(value or "").strip().lower()
    if not text:
        return ""
    if text.startswith("tr") or text in {"turkish", "türkçe", "turkce", "turk"}:
        return "Turkish"
    if text.startswith("en") or text in {"english", "ingilizce"}:
        return "English"
    aliases = {
        "german": "German",
        "deutsch": "German",
        "almanca": "German",
        "french": "French",
        "français": "French",
        "francais": "French",
        "fransızca": "French",
        "spanish": "Spanish",
        "español": "Spanish",
        "espanol": "Spanish",
        "ispanyolca": "Spanish",
        "italian": "Italian",
        "italiano": "Italian",
        "italyanca": "Italian",
        "portuguese": "Portuguese",
        "português": "Portuguese",
        "portugues": "Portuguese",
        "portekizce": "Portuguese",
        "dutch": "Dutch",
        "nederlands": "Dutch",
        "hollandaca": "Dutch",
        "polish": "Polish",
        "polski": "Polish",
        "lehçe": "Polish",
        "lehce": "Polish",
        "romanian": "Romanian",
        "română": "Romanian",
        "romana": "Romanian",
        "romence": "Romanian",
        "swedish": "Swedish",
        "svenska": "Swedish",
        "isveççe": "Swedish",
        "isvecce": "Swedish",
        "danish": "Danish",
        "dansk": "Danish",
        "danca": "Danish",
        "norwegian": "Norwegian",
        "norsk": "Norwegian",
        "norveççe": "Norwegian",
        "norvecce": "Norwegian",
        "finnish": "Finnish",
        "suomi": "Finnish",
        "fince": "Finnish",
        "czech": "Czech",
        "čeština": "Czech",
        "cestina": "Czech",
        "çekçe": "Czech",
        "cekce": "Czech",
        "slovak": "Slovak",
        "slovenčina": "Slovak",
        "slovencina": "Slovak",
        "slovakça": "Slovak",
        "slovakca": "Slovak",
        "hungarian": "Hungarian",
        "magyar": "Hungarian",
        "macarca": "Hungarian",
        "greek": "Greek",
        "ελληνικά": "Greek",
        "yunanca": "Greek",
        "russian": "Russian",
        "русский": "Russian",
        "rusça": "Russian",
        "rusca": "Russian",
        "ukrainian": "Ukrainian",
        "українська": "Ukrainian",
        "ukraynaca": "Ukrainian",
        "arabic": "Arabic",
        "العربية": "Arabic",
        "arapça": "Arabic",
        "arapca": "Arabic",
        "japanese": "Japanese",
        "日本語": "Japanese",
        "japonca": "Japanese",
        "hindi": "Hindi",
        "हिन्दी": "Hindi",
        "indonesian": "Indonesian",
        "bahasa indonesia": "Indonesian",
        "endonezce": "Indonesian",
        "malay": "Malay",
        "bahasa melayu": "Malay",
        "malezce": "Malay",
    }
    if text in aliases:
        return aliases[text]
    return str(value or "").strip()


def detect_book_language(*parts: Any) -> str:
    text = " ".join(str(part or "") for part in parts if str(part or "").strip())
    if not text:
        return ""
    if re.search(r"[çğıöşüÇĞİÖŞÜ]", text):
        return "Turkish"

    lowered = text.lower()
    turkish_hits = len(
        re.findall(
            r"\b(ve|ile|için|icin|bu|bir|kitap|rehber|oyun|bölüm|bolum|başlangıç|baslangic|nasıl|nasil|neden|çünkü|cunku|oyuncu|adım|adim)\b",
            lowered,
        )
    )
    english_hits = len(
        re.findall(
            r"\b(the|and|with|for|chapter|guide|book|game|player|step|tips|build|craft|survival)\b",
            lowered,
        )
    )
    if turkish_hits > english_hits:
        return "Turkish"
    if english_hits > turkish_hits:
        return "English"
    return ""


def infer_book_language(
    book_dir: Path | None = None,
    metadata: dict[str, Any] | None = None,
    hints: list[Any] | None = None,
) -> str:
    metadata = metadata or {}
    normalized = normalize_book_language(metadata.get("language"))
    if normalized:
        return normalized

    texts = [str(item or "") for item in (hints or []) if str(item or "").strip()]
    if book_dir and book_dir.exists():
        outline_path = find_outline_file(book_dir)
        if outline_path and outline_path.exists():
            texts.append(outline_path.read_text(encoding="utf-8", errors="replace")[:4000])
        chapter_paths = sorted(book_dir.glob("chapter_*_final.md"), key=chapter_number)
        if chapter_paths:
            texts.append(chapter_paths[0].read_text(encoding="utf-8", errors="replace")[:4000])

    return detect_book_language(*texts) or "English"


def chapter_label_for_language(language: str) -> str:
    normalized = normalize_book_language(language)
    labels = {
        "Turkish": "Bölüm",
        "English": "Chapter",
        "Spanish": "Capítulo",
        "German": "Kapitel",
        "French": "Chapitre",
        "Portuguese": "Capítulo",
        "Italian": "Capitolo",
        "Dutch": "Hoofdstuk",
        "Arabic": "الفصل",
        "Japanese": "第n章",
    }
    return labels.get(normalized, "Chapter")


def chapter_heading_prefix(language: str, number: int) -> str:
    normalized = normalize_book_language(language)
    if normalized == "Japanese":
        return f"第{number}章"
    return f"{chapter_label_for_language(normalized)} {number}"


def chapter_heading_pattern() -> str:
    labels = [
        "Chapter",
        "Bölüm",
        "Capítulo",
        "Kapitel",
        "Chapitre",
        "Capitolo",
        "Hoofdstuk",
        "الفصل",
    ]
    return "|".join(re.escape(label) for label in labels)


def strip_chapter_heading(heading: str) -> str:
    cleaned = str(heading or "").strip()
    if not cleaned:
        return ""
    japanese = re.sub(r"^第\s*\d+\s*章\s*[:.\-]?\s*", "", cleaned).strip()
    if japanese != cleaned:
        return japanese
    return re.sub(
        rf"^(?:{chapter_heading_pattern()})\s+\d+\b\s*[:.\-]?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    ).strip()


def normalize_structural_heading(title: str, language: str, number: int | None = None) -> str:
    chapter_label = chapter_label_for_language(language)
    cleaned = str(title or "").strip()
    cleaned = strip_chapter_heading(cleaned)
    cleaned = re.sub(r"^第\s*\d+\s*章$", "", cleaned).strip()
    cleaned = re.sub(rf"^(?:{chapter_heading_pattern()})\s+\d+\b$", "", cleaned, flags=re.IGNORECASE).strip()
    if not cleaned:
        return chapter_heading_prefix(language, number) if number else chapter_label
    return cleaned


def count_words(text: str) -> int:
    return len(re.findall(r"\S+", str(text or "")))


def teaser_for_text(text: str, max_words: int = 26) -> str:
    cleaned = re.sub(r"\s+", " ", str(text or "")).strip()
    if not cleaned:
        return ""
    sentence_match = re.search(r"(.{40,220}?[.!?])(?:\s|$)", cleaned)
    if sentence_match:
        return sentence_match.group(1).strip()
    words = cleaned.split()
    if len(words) <= max_words:
        return cleaned
    return " ".join(words[:max_words]).strip() + "…"


def truncate_words(text: str, limit: int) -> tuple[str, bool, int]:
    words = re.findall(r"\S+", str(text or ""))
    if len(words) <= limit:
        return str(text or "").strip(), False, len(words)
    return " ".join(words[:limit]).strip() + "…", True, limit


def build_book_preview(book: dict[str, Any], ratio: float = 0.2) -> dict[str, Any]:
    chapters = list(book.get("chapters") or [])
    book_dir = BOOK_OUTPUTS_DIR / str(book.get("slug") or "")
    generation = build_generation_status(book_dir) if book_dir.exists() else {
        "active": False,
        "stage": "idle",
        "message": "",
        "progress": 0,
        "error": "",
        "cover_ready": False,
        "first_chapter_ready": False,
        "product_ready": False,
        "preview_ready": False,
        "cover_state": "idle",
        "first_chapter_state": "idle",
        "started_at": "",
        "updated_at": "",
        "completed_at": "",
    }
    full_generation = build_full_generation_status(book_dir) if book_dir.exists() else {
        "active": False,
        "stage": "idle",
        "message": "",
        "error": "",
        "progress": 0,
        "ready_count": 0,
        "target_count": 0,
        "failed_count": 0,
        "eta_seconds": 0,
        "avg_chapter_seconds": 0,
        "eta_updated_at": "",
        "complete": False,
        "started_at": "",
        "updated_at": "",
        "completed_at": "",
    }
    generation = {
        **generation,
        "full_generation": full_generation,
    }
    cover_variants = normalize_cover_variants(book.get("cover_variants"))
    recommended_variant_id = str(book.get("recommended_cover_variant") or "").strip()
    if recommended_variant_id not in {variant["id"] for variant in cover_variants} and cover_variants:
        recommended_variant_id = cover_variants[0]["id"]
    selected_variant_id = str(book.get("selected_cover_variant") or "").strip() or recommended_variant_id
    if selected_variant_id not in {variant["id"] for variant in cover_variants} and cover_variants:
        selected_variant_id = recommended_variant_id or cover_variants[0]["id"]

    cover_lab_state = "idle"
    if cover_variants or generation.get("cover_ready"):
        cover_lab_state = "ready"
    elif generation.get("cover_state") in {"queued", "running"}:
        cover_lab_state = "running"
    target_slots = clamp_cover_variant_target_count(book.get("cover_variant_target_count"), default=1)
    fallback_ready_count = 1 if (not cover_variants and generation.get("cover_ready")) else 0
    ready_count = len(cover_variants) + fallback_ready_count
    target_slots = max(target_slots, len(cover_variants), ready_count)

    total_words = sum(max(1, count_words(chapter.get("content", ""))) for chapter in chapters) if chapters else 0
    target_words = max(220, int(total_words * ratio)) if total_words else 0
    max_visible_sections = max(1, min(3, round(max(1, len(chapters)) * ratio))) if chapters else 0
    visible_sections: list[dict[str, Any]] = []
    locked_sections: list[dict[str, Any]] = []
    remaining = target_words

    for chapter in chapters:
        number = chapter.get("number")
        title = str(chapter.get("title") or "").strip()
        content = str(chapter.get("content") or "").strip()
        words = max(1, count_words(content)) if content else 0

        if remaining > 0 and len(visible_sections) < max_visible_sections:
            preview_budget = words if words <= remaining else remaining
            if not visible_sections and words and preview_budget < min(220, words):
                preview_budget = min(words, 220)
            preview_content, partial, used_words = truncate_words(content, max(1, preview_budget)) if content else ("", False, 0)
            visible_sections.append(
                {
                    "number": number,
                    "title": title,
                    "content": preview_content or teaser_for_text(content),
                    "partial": partial,
                    "word_count": used_words or words,
                }
            )
            remaining = max(0, remaining - max(used_words, 0))
            if partial:
                remaining = 0
            continue

        locked_sections.append(
            {
                "number": number,
                "title": title,
                "teaser": teaser_for_text(content),
                "word_count": words,
            }
        )

    if not visible_sections and chapters:
        first = chapters[0]
        visible_sections.append(
            {
                "number": first.get("number"),
                "title": str(first.get("title") or "").strip(),
                "content": teaser_for_text(first.get("content", "")),
                "partial": True,
                "word_count": count_words(first.get("content", "")),
            }
        )
        locked_sections = [
            {
                "number": chapter.get("number"),
                "title": str(chapter.get("title") or "").strip(),
                "teaser": teaser_for_text(chapter.get("content", "")),
                "word_count": count_words(chapter.get("content", "")),
            }
            for chapter in chapters[1:]
        ]

    return {
        "book": {
            "slug": book.get("slug", ""),
            "title": book.get("title", ""),
            "subtitle": book.get("subtitle", ""),
            "language": book.get("language", "English"),
            "author": book.get("author", ""),
            "publisher": book.get("publisher", ""),
            "description": book.get("description", ""),
            "author_bio": book.get("author_bio", ""),
            "branding_mark": book.get("branding_mark", ""),
            "branding_logo_url": book.get("branding_logo_url", ""),
            "cover_brief": book.get("cover_brief", ""),
            "cover_image": book.get("cover_image", ""),
            "back_cover_image": book.get("back_cover_image", ""),
            "status": book.get("status", {}),
        },
        "preview": {
            "ratio": ratio,
            "toc": [{"number": chapter.get("number"), "title": str(chapter.get("title") or "").strip()} for chapter in chapters],
            "visible_sections": visible_sections,
            "locked_sections": locked_sections,
        },
        "entitlements": {
            "can_download_pdf": False,
            "can_download_epub": False,
            "can_view_full_book": False,
        },
        "generation": generation,
        "coverLab": {
            "variants": cover_variants,
            "selectedVariantId": selected_variant_id,
            "recommendedVariantId": recommended_variant_id,
            "generationState": cover_lab_state,
            "slots": target_slots,
            "readyCount": ready_count,
            "queuedSlots": max(0, target_slots - ready_count) if cover_lab_state == "running" else 0,
        },
    }


def ensure_book_layout(book_dir: Path) -> None:
    book_dir.mkdir(parents=True, exist_ok=True)
    for relative in (
        "assets",
        "extras",
        "research",
        "sources",
        "temp_refs",
        "temp_appendices",
    ):
        (book_dir / relative).mkdir(parents=True, exist_ok=True)


def read_json_file(path: Path, defaults: dict[str, Any]) -> dict[str, Any]:
    payload = defaults.copy()
    if not path.exists():
        return payload
    try:
        loaded = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return payload
    payload.update({key: value for key, value in loaded.items() if value is not None})
    return payload


def read_settings() -> dict[str, Any]:
    """Read settings with LRU cache based on file modification time."""
    settings_path = ROOT_DIR / SETTINGS_FILE_NAME
    try:
        mtime_ns: int | None = settings_path.stat().st_mtime_ns
    except OSError:
        mtime_ns = None

    # Create composite cache key with mtime
    cache_key = f"settings_{mtime_ns or 'none'}"
    cached_settings = SETTINGS_CACHE.get(cache_key)
    if cached_settings is not None:
        return cached_settings.copy()

    fresh_settings = read_json_file(settings_path, DEFAULT_SETTINGS)
    # Cache with longer TTL since we use mtime-based invalidation
    SETTINGS_CACHE.put(cache_key, fresh_settings, ttl_seconds=300.0)
    return fresh_settings.copy()


def public_settings(settings: dict[str, Any] | None = None) -> dict[str, Any]:
    settings = (settings or read_settings()).copy()
    shared_key_available = bool(resolve_shared_ai_key(settings, merge_book_generator_local_env(os.environ.copy())))
    for key in SECRET_SETTING_KEYS:
        has_value = bool(str(settings.get(key, "") or "").strip())
        if key == "CODEFAST_API_KEY" and shared_key_available:
            has_value = True
        settings[f"has_{key}"] = has_value
        settings[key] = ""
    return settings


def save_settings(payload: dict[str, Any]) -> dict[str, Any]:
    """Save settings and invalidate cache."""
    settings = read_settings()
    for key, default in DEFAULT_SETTINGS.items():
        if key in SECRET_SETTING_KEYS:
            if key in payload:
                incoming = str(payload.get(key, "") or "").strip()
                if incoming:
                    settings[key] = incoming
            continue
        if isinstance(default, bool):
            settings[key] = bool(payload.get(key, settings.get(key, default)))
        else:
            settings[key] = payload.get(key, settings.get(key, default))
    (ROOT_DIR / SETTINGS_FILE_NAME).write_text(
        json.dumps(settings, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    # Invalidate all settings cache entries
    SETTINGS_CACHE.clear()
    append_log("Updated dashboard settings and invalidated cache.")
    return settings


def read_metadata(
    book_dir: Path,
    *,
    default_author: str | None = None,
    default_publisher: str | None = None,
) -> dict[str, Any]:
    if default_author is None or default_publisher is None:
        settings = read_settings()
        default_author = default_author or settings["default_author"]
        default_publisher = default_publisher or settings["default_publisher"]

    defaults = {
        "author": default_author,
        "publisher": default_publisher,
        "description": "",
        "author_bio": "",
        "branding_mark": "",
        "branding_logo_url": "",
        "cover_brief": "",
        "book_type": "",
        "language": "",
        "generate_cover": True,
        "cover_art_image": "",
        "cover_image": "",
        "back_cover_image": "",
        "cover_template": "",
        "cover_variant_count": 0,
        "cover_variant_target_count": 1,
        "cover_generation_provider": "",
        "cover_composed": False,
        "cover_variants": [],
        "selected_cover_variant": "",
        "recommended_cover_variant": "",
        "back_cover_variant_family": "",
        "cover_family": "",
        "cover_text_strategy": "",
        "cover_branch": "",
        "cover_genre": "",
        "cover_subtopic": "",
        "cover_palette_key": "",
        "cover_layout_key": "",
        "cover_motif": "",
        "cover_lab_version": "",
        "isbn": "",
        "year": "",
        "fast": False,
        "book_length_tier": "standard",
        "target_word_count_min": 0,
        "target_word_count_max": 0,
        "chapter_plan": [],
        "preview_stage": "idle",
        "preview_message": "",
        "preview_error": "",
        "preview_progress": 0,
        "cover_state": "idle",
        "first_chapter_state": "idle",
        "preview_started_at": "",
        "preview_updated_at": "",
        "preview_completed_at": "",
        "full_generation_stage": "idle",
        "full_generation_message": "",
        "full_generation_error": "",
        "full_generation_progress": 0,
        "full_generation_target_count": 0,
        "full_generation_ready_count": 0,
        "full_generation_failed_count": 0,
        "full_generation_eta_seconds": 0,
        "full_generation_avg_chapter_seconds": 0,
        "full_generation_initial_ready_count": 0,
        "full_generation_eta_updated_at": "",
        "full_generation_started_at": "",
        "full_generation_updated_at": "",
        "full_generation_completed_at": "",
    }
    return read_json_file(book_dir / METADATA_FILE_NAME, defaults)


def save_metadata(book_dir: Path, metadata: dict[str, Any]) -> dict[str, Any]:
    ensure_book_layout(book_dir)
    merged = read_metadata(book_dir)
    merged.update(metadata)
    (book_dir / METADATA_FILE_NAME).write_text(
        json.dumps(merged, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return merged


def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalized_image_provider_policy(value: Any = None) -> str:
    policy = str(IMAGE_PROVIDER_POLICY if value is None else value).strip().lower().replace("-", "_")
    if not policy:
        return "auto"
    return policy


def image_provider_policy_vertex_only() -> bool:
    return normalized_image_provider_policy() in {"vertex_only", "vertex"}


def first_nonempty_env_value(env: dict[str, str], keys: tuple[str, ...]) -> str:
    for key in keys:
        value = str(env.get(key, "") or "").strip()
        if value:
            return value
    return ""


def resolve_vertex_image_config(env: dict[str, str] | None = None) -> dict[str, str]:
    resolved_env = env if env is not None else command_env()
    return {
        "api_key": first_nonempty_env_value(resolved_env, VERTEX_API_KEY_ENV_NAMES),
        "project": first_nonempty_env_value(resolved_env, VERTEX_PROJECT_ENV_NAMES),
        "location": first_nonempty_env_value(resolved_env, VERTEX_LOCATION_ENV_NAMES) or "us-central1",
    }


def has_vertex_image_provider_config(env: dict[str, str] | None = None) -> bool:
    config = resolve_vertex_image_config(env)
    return bool(config["api_key"] and config["project"])


def normalize_cover_service_for_policy(service: Any = None) -> str:
    requested = str(service or "").strip().lower()
    if image_provider_policy_vertex_only():
        if requested in VERTEX_IMAGE_SERVICES:
            return requested
        configured = str(PREVIEW_COVER_SERVICE or "").strip().lower()
        if configured in VERTEX_IMAGE_SERVICES:
            return configured
        return "vertex-imagen-standard"
    return requested or "auto"


def parse_iso_datetime(value: Any) -> datetime | None:
    text = str(value or "").strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = f"{text[:-1]}+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def is_timestamp_stale(value: Any, threshold_seconds: int) -> bool:
    parsed = parse_iso_datetime(value)
    if parsed is None:
        return True
    age = datetime.now(timezone.utc) - parsed
    return age.total_seconds() >= threshold_seconds


def is_preview_pipeline_active(slug: str) -> bool:
    with ACTIVE_PREVIEW_PIPELINES_LOCK:
        return slug in ACTIVE_PREVIEW_PIPELINES


def is_full_pipeline_active(slug: str) -> bool:
    with ACTIVE_FULL_CHAPTER_PIPELINES_LOCK:
        return slug in ACTIVE_FULL_CHAPTER_PIPELINES


def resolve_book_asset_path(book_dir: Path, relative_path: str) -> Path | None:
    if not relative_path:
        return None
    asset_path = (book_dir / relative_path).resolve()
    if not asset_path.exists() or (book_dir not in asset_path.parents and asset_path != book_dir):
        return None
    return asset_path


def normalize_book_asset_reference(book_dir: Path, value: Any) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    lowered = raw.lower()
    if lowered.startswith(("http://", "https://", "data:")):
        return ""

    decoded = urllib.parse.unquote(raw).replace("\\", "/").split("?", 1)[0].split("#", 1)[0]
    if decoded.startswith("/workspace/"):
        decoded = decoded.removeprefix("/workspace/")

    prefix = f"book_outputs/{book_dir.name}/"
    if decoded.startswith(prefix):
        decoded = decoded[len(prefix):]
    decoded = decoded.lstrip("/")

    if not decoded:
        return ""
    parts = Path(decoded).parts
    if ".." in parts:
        return ""
    if parts and parts[0] == "book_outputs":
        return ""
    return decoded


def existing_book_asset_reference(book_dir: Path, value: Any) -> str:
    normalized = normalize_book_asset_reference(book_dir, value)
    if not normalized:
        return ""
    resolved = resolve_book_asset_path(book_dir, normalized)
    if not resolved or not resolved.is_file():
        return ""
    return resolved.relative_to(book_dir).as_posix()


def preferred_cover_asset_reference(
    book_dir: Path,
    explicit_reference: Any,
    *,
    prefixes: tuple[str, ...],
) -> str:
    explicit = existing_book_asset_reference(book_dir, explicit_reference)
    if explicit:
        return explicit

    for prefix in prefixes:
        for extension in PREFERRED_COVER_EXTENSIONS:
            candidate = existing_book_asset_reference(book_dir, f"assets/{prefix}{extension}")
            if candidate:
                return candidate

    assets_dir = book_dir / "assets"
    try:
        with os.scandir(assets_dir) as iterator:
            names = sorted(entry.name for entry in iterator if entry.is_file(follow_symlinks=False))
    except OSError:
        names = []

    lowered_pairs = [(name, name.lower()) for name in names]
    for prefix in prefixes:
        for name, lowered in lowered_pairs:
            if lowered.startswith(prefix):
                candidate = existing_book_asset_reference(book_dir, f"assets/{name}")
                if candidate:
                    return candidate
    return ""


def resolve_cover_image_references(book_dir: Path, metadata: dict[str, Any]) -> tuple[str, str]:
    front = preferred_cover_asset_reference(
        book_dir,
        metadata.get("cover_image"),
        prefixes=FRONT_COVER_PREFIX_PRIORITY,
    )
    back = preferred_cover_asset_reference(
        book_dir,
        metadata.get("back_cover_image"),
        prefixes=BACK_COVER_PREFIX_PRIORITY,
    )
    return front, back


def read_book_core_fields(book_dir: Path, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
    metadata = metadata or read_metadata(book_dir)
    outline_path = find_outline_file(book_dir)
    title, subtitle = read_outline_title_subtitle(outline_path)
    return {
        "title": title or book_dir.name,
        "subtitle": subtitle,
        "author": str(metadata.get("author") or ""),
        "description": str(metadata.get("description") or ""),
        "book_type": str(metadata.get("book_type") or ""),
        "cover_genre": str(metadata.get("cover_genre") or ""),
        "cover_brief": str(metadata.get("cover_brief") or ""),
        "cover_prompt": str(metadata.get("cover_prompt") or ""),
    }


def normalize_cover_variants(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []

    variants: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        variant_id = str(item.get("id") or item.get("family") or "").strip()
        front_image = str(item.get("front_image") or "").strip()
        back_image = str(item.get("back_image") or "").strip()
        art_image = str(item.get("art_image") or "").strip()
        if not variant_id or not front_image or not back_image:
            continue
        variants.append(
            {
                "id": variant_id,
                "family": str(item.get("family") or variant_id).strip() or variant_id,
                "label": str(item.get("label") or variant_id.title()).strip() or variant_id.title(),
                "genre": str(item.get("genre") or "").strip(),
                "subtopic": str(item.get("subtopic") or "").strip(),
                "layout": str(item.get("layout") or "").strip(),
                "motif": str(item.get("motif") or "").strip(),
                "paletteKey": str(item.get("paletteKey") or "").strip(),
                "front_image": front_image,
                "front_svg": str(item.get("front_svg") or "").strip(),
                "back_image": back_image,
                "back_svg": str(item.get("back_svg") or "").strip(),
                "art_image": art_image,
                "score": float(item.get("score") or 0),
                "recommended": bool(item.get("recommended", False)),
                "provider": str(item.get("provider") or "").strip(),
                "template": str(item.get("template") or "").strip(),
                "preferred_zone": str(item.get("preferred_zone") or "").strip(),
                "render_mode": str(item.get("render_mode") or "").strip(),
                "text_strategy": str(item.get("text_strategy") or "").strip(),
                "text_validation": item.get("text_validation") if isinstance(item.get("text_validation"), dict) else {},
            }
        )
    return variants


def sync_selected_cover_assets(book_dir: Path, metadata: dict[str, Any]) -> dict[str, Any]:
    variants = normalize_cover_variants(metadata.get("cover_variants"))
    if not variants:
        return metadata

    recommended_id = str(metadata.get("recommended_cover_variant") or "").strip()
    if recommended_id not in {variant["id"] for variant in variants}:
        recommended = next((variant for variant in variants if variant.get("recommended")), variants[0])
        recommended_id = recommended["id"]

    selected_id = str(metadata.get("selected_cover_variant") or "").strip() or recommended_id
    selected = next((variant for variant in variants if variant["id"] == selected_id), None)
    if not selected:
        selected = next((variant for variant in variants if variant["id"] == recommended_id), variants[0])
        selected_id = selected["id"]

    assets_dir = book_dir / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    source_front = resolve_book_asset_path(book_dir, selected["front_image"])
    source_back = resolve_book_asset_path(book_dir, selected["back_image"])
    source_front_svg = resolve_book_asset_path(book_dir, selected.get("front_svg", ""))
    source_back_svg = resolve_book_asset_path(book_dir, selected.get("back_svg", ""))
    source_art = resolve_book_asset_path(book_dir, selected.get("art_image", ""))

    if source_front and source_front != assets_dir / "front_cover_final.png":
        shutil.copyfile(source_front, assets_dir / "front_cover_final.png")
        shutil.copyfile(source_front, assets_dir / "showcase_front_cover.png")
    if source_back and source_back != assets_dir / "back_cover_final.png":
        shutil.copyfile(source_back, assets_dir / "back_cover_final.png")
        shutil.copyfile(source_back, assets_dir / "showcase_back_cover.png")
    if source_front_svg:
        shutil.copyfile(source_front_svg, assets_dir / "front_cover_final.svg")
        shutil.copyfile(source_front_svg, assets_dir / "showcase_front_cover.svg")
    else:
        (assets_dir / "front_cover_final.svg").unlink(missing_ok=True)
        (assets_dir / "showcase_front_cover.svg").unlink(missing_ok=True)
    if source_back_svg:
        shutil.copyfile(source_back_svg, assets_dir / "back_cover_final.svg")
        shutil.copyfile(source_back_svg, assets_dir / "showcase_back_cover.svg")
    else:
        (assets_dir / "back_cover_final.svg").unlink(missing_ok=True)
        (assets_dir / "showcase_back_cover.svg").unlink(missing_ok=True)
    if source_art:
        shutil.copyfile(source_art, assets_dir / "ai_front_cover.png")

    return save_metadata(
        book_dir,
        {
            "cover_variants": variants,
            "cover_variant_count": len(variants),
            "recommended_cover_variant": recommended_id,
            "selected_cover_variant": selected_id,
            "cover_family": selected.get("family", ""),
            "back_cover_variant_family": selected.get("family", ""),
            "cover_genre": selected.get("genre") or str(metadata.get("cover_genre") or ""),
            "cover_subtopic": selected.get("subtopic") or str(metadata.get("cover_subtopic") or ""),
            "cover_palette_key": selected.get("paletteKey") or str(metadata.get("cover_palette_key") or ""),
            "cover_layout_key": selected.get("layout") or str(metadata.get("cover_layout_key") or ""),
            "cover_motif": selected.get("motif") or str(metadata.get("cover_motif") or ""),
            "cover_art_image": selected.get("art_image", ""),
            "cover_image": "assets/front_cover_final.png" if source_front else str(metadata.get("cover_image") or ""),
            "back_cover_image": "assets/back_cover_final.png" if source_back else str(metadata.get("back_cover_image") or ""),
            "cover_template": selected.get("template") or str(metadata.get("cover_template") or ""),
            "cover_composed": bool(source_front) or bool(metadata.get("cover_composed")),
        },
    )


def chapter_body_word_count(book_dir: Path, chapter_number_value: int, stop_at: int | None = None) -> int:
    chapter_path = book_dir / f"chapter_{chapter_number_value}_final.md"
    if not chapter_path.exists():
        return 0
    total_words = 0
    try:
        with chapter_path.open("r", encoding="utf-8", errors="replace") as handle:
            for index, line in enumerate(handle):
                if index < 2:
                    continue
                total_words += count_words(line)
                if stop_at is not None and total_words >= stop_at:
                    return total_words
    except OSError:
        return 0
    return total_words


def cover_asset_ready(book_dir: Path, metadata: dict[str, Any] | None = None) -> bool:
    metadata = metadata or read_metadata(book_dir)
    cover_image, _ = resolve_cover_image_references(book_dir, metadata)
    return bool(cover_image)


def first_preview_chapter_ready(book_dir: Path) -> bool:
    return chapter_body_word_count(book_dir, 1, stop_at=PREVIEW_PIPELINE_MIN_WORDS) >= PREVIEW_PIPELINE_MIN_WORDS


def preview_status_message(
    cover_ready: bool,
    first_chapter_ready: bool,
    stage: str,
    explicit: str = "",
) -> str:
    if explicit.strip():
        return explicit.strip()
    if cover_ready and first_chapter_ready:
        return "Kapak ve ilk okunabilir bölüm hazır."
    if first_chapter_ready:
        return "İlk bölüm hazır. Kapak görseli hazırlanıyor."
    if cover_ready:
        return "Kapak hazır. İlk gerçek bölüm yazılıyor."
    if stage in {"queued", "running", "cover"}:
        return "Kapak görseli hazırlanıyor."
    if stage == "chapter":
        return "İlk okunabilir bölüm yazılıyor."
    if stage in {"error", "needs_attention"}:
        return "Önizleme üretimi tamamlanamadı."
    return "Önizleme hazırlanıyor."


def build_generation_status(
    book_dir: Path,
    metadata: dict[str, Any] | None = None,
    *,
    lightweight: bool = False,
) -> dict[str, Any]:
    metadata = metadata or read_metadata(book_dir)
    slug = book_dir.name
    cover_state = str(metadata.get("cover_state") or "").strip()
    first_chapter_state = str(metadata.get("first_chapter_state") or "").strip()
    if lightweight:
        stage_hint = str(metadata.get("preview_stage") or "").strip()
        cover_image, _ = resolve_cover_image_references(book_dir, metadata)
        cover_ready = bool(cover_image)

        first_chapter_ready = (
            first_chapter_state == "ready"
            or stage_hint in {"ready", "chapter_ready"}
            or bool(str(metadata.get("preview_completed_at") or "").strip())
        )
    else:
        cover_ready = cover_asset_ready(book_dir, metadata)
        first_chapter_ready = first_preview_chapter_ready(book_dir)

    cover_state = cover_state or ("ready" if cover_ready else "idle")
    first_chapter_state = first_chapter_state or ("ready" if first_chapter_ready else "idle")
    stage = str(metadata.get("preview_stage") or "idle").strip()
    active = False
    with ACTIVE_PREVIEW_PIPELINES_LOCK:
        active = slug in ACTIVE_PREVIEW_PIPELINES
    if cover_ready:
        cover_state = "ready"
    if first_chapter_ready:
        first_chapter_state = "ready"
    if not active and stage in {"queued", "running", "cover", "chapter"}:
        active = cover_state in {"queued", "running"} or first_chapter_state in {"queued", "running"}
    if cover_ready and first_chapter_ready:
        stage = "ready"
    elif first_chapter_ready:
        stage = "chapter_ready" if not active else stage
    elif cover_ready:
        stage = "cover_ready" if not active else stage
    progress_value = metadata.get("preview_progress")
    if isinstance(progress_value, (int, float)):
        progress = int(progress_value)
    else:
        progress = 100 if (cover_ready and first_chapter_ready) else 68 if first_chapter_ready else 46 if cover_ready else 18 if active else 0
    if cover_ready and first_chapter_ready:
        progress = max(progress, 100)
    elif first_chapter_ready:
        progress = max(progress, 68)
    elif cover_ready:
        progress = max(progress, 46)
    progress = max(0, min(100, progress))
    error = str(metadata.get("preview_error") or "").strip()
    message = preview_status_message(
        cover_ready,
        first_chapter_ready,
        stage,
        str(metadata.get("preview_message") or ""),
    )
    return {
        "active": active,
        "stage": stage or "idle",
        "message": message,
        "progress": progress,
        "error": error,
        "cover_ready": cover_ready,
        "first_chapter_ready": first_chapter_ready,
        "product_ready": cover_ready and first_chapter_ready,
        "preview_ready": first_chapter_ready,
        "cover_state": cover_state,
        "first_chapter_state": first_chapter_state,
        "started_at": str(metadata.get("preview_started_at") or ""),
        "updated_at": str(metadata.get("preview_updated_at") or ""),
        "completed_at": str(metadata.get("preview_completed_at") or ""),
    }


def sync_preview_generation_metadata(book_dir: Path) -> None:
    generation = build_generation_status(book_dir)
    stage = (
        "ready"
        if generation["product_ready"]
        else "chapter_ready"
        if generation["preview_ready"]
        else "cover_ready"
        if generation["cover_ready"]
        else "idle"
    )
    updates: dict[str, Any] = {
        "preview_stage": stage,
        "preview_message": generation["message"],
        "preview_progress": generation["progress"],
        "cover_state": "ready" if generation["cover_ready"] else generation["cover_state"],
        "first_chapter_state": "ready" if generation["first_chapter_ready"] else generation["first_chapter_state"],
        "preview_updated_at": now_utc_iso(),
    }
    if generation["preview_ready"]:
        updates["preview_error"] = ""
        updates["preview_completed_at"] = now_utc_iso()
    save_metadata(book_dir, updates)


def summarize_workflow_problem(result: dict[str, Any] | None, fallback: str) -> str:
    if not isinstance(result, dict):
        return fallback
    output = str(result.get("output") or "").strip()
    warnings = result.get("warnings")
    if output:
        return output.splitlines()[0].strip()
    if isinstance(warnings, list) and warnings:
        return str(warnings[0]).strip()
    return fallback


def infer_cover_genre(book: dict[str, Any]) -> str:
    explicit = str(book.get("cover_genre") or "").strip().lower()
    if explicit:
        return explicit
    book_type = str(book.get("book_type") or book.get("bookType") or "").strip().lower()
    if book_type == "cocuk":
        return "children-illustrated"
    topic = " ".join(
        [
            str(book.get("title") or ""),
            str(book.get("subtitle") or ""),
            str(book.get("description") or ""),
            str(book.get("cover_brief") or ""),
        ]
    ).lower()
    if any(keyword in topic for keyword in ("çocuk", "cocuk", "kids", "children", "storybook", "bedtime", "picture book")):
        return "children-illustrated"
    if any(keyword in topic for keyword in ("ai", "yapay zeka", "prompt", "workflow", "automation", "system", "teknoloji", "coding", "kod")):
        return "ai-systems"
    if any(keyword in topic for keyword in ("education", "lesson", "teach", "teacher", "stem", "course", "öğret", "eğitim", "trainer", "workshop")):
        return "education"
    if any(keyword in topic for keyword in ("focus", "calm", "discipline", "habit", "kişisel", "personal", "clarte", "ritim", "ritme")):
        return "personal-development"
    if any(keyword in topic for keyword in ("expert", "expertise", "authority", "method", "uzman", "consultant", "mentor")):
        return "expertise-authority"
    return "business-marketing"


def normalize_chapter_plan(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []

    normalized: list[dict[str, Any]] = []
    for index, item in enumerate(raw, start=1):
        if not isinstance(item, dict):
            continue
        try:
            number = int(item.get("number") or index)
        except (TypeError, ValueError):
            number = index
        try:
            target_min_words = int(item.get("target_min_words") or 0)
        except (TypeError, ValueError):
            target_min_words = 0
        try:
            target_max_words = int(item.get("target_max_words") or 0)
        except (TypeError, ValueError):
            target_max_words = 0

        normalized.append(
            {
                "number": number,
                "title": str(item.get("title") or "").strip(),
                "summary": str(item.get("summary") or "").strip(),
                "role": str(item.get("role") or "").strip(),
                "length": str(item.get("length") or "").strip(),
                "target_min_words": target_min_words,
                "target_max_words": target_max_words,
            }
        )
    return normalized


def chapter_plan_for_number(metadata: dict[str, Any], chapter_number: int) -> dict[str, Any] | None:
    for item in normalize_chapter_plan(metadata.get("chapter_plan")):
        if int(item.get("number") or 0) == chapter_number:
            return item
    return None


def chapter_generation_blueprint(book_dir: Path, metadata: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    metadata = metadata or read_metadata(book_dir)
    language = infer_book_language(book_dir, metadata)
    plan_items = sorted(
        normalize_chapter_plan(metadata.get("chapter_plan")),
        key=lambda item: int(item.get("number") or 0),
    )

    blueprint: list[dict[str, Any]] = []
    if plan_items:
        for index, item in enumerate(plan_items, start=1):
            number = int(item.get("number") or index)
            min_words = int(item.get("target_min_words") or 0)
            max_words = int(item.get("target_max_words") or 0)
            if min_words <= 0:
                min_words = 1600
            if max_words <= 0:
                max_words = max(min_words + 400, 2200)
            title = normalize_structural_heading(str(item.get("title") or "").strip(), language, number)
            blueprint.append(
                {
                    "number": number,
                    "title": title,
                    "min_words": min_words,
                    "max_words": max_words,
                }
            )
    else:
        chapters = collect_chapters(book_dir)
        if chapters:
            for index, chapter in enumerate(chapters, start=1):
                number = int(chapter.get("number") or index)
                title = normalize_structural_heading(str(chapter.get("title") or "").strip(), language, number)
                blueprint.append(
                    {
                        "number": number,
                        "title": title,
                        "min_words": 1600,
                        "max_words": 2200,
                    }
                )
        else:
            blueprint.append(
                {
                    "number": 1,
                    "title": normalize_structural_heading("", language, 1),
                    "min_words": 1600,
                    "max_words": 2200,
                }
            )

    deduped: list[dict[str, Any]] = []
    seen: set[int] = set()
    for item in sorted(blueprint, key=lambda entry: int(entry.get("number") or 0)):
        number = int(item.get("number") or 0)
        if number <= 0 or number in seen:
            continue
        seen.add(number)
        deduped.append(item)
    return deduped


def chapter_ready_threshold(target_min_words: int, *, strict: bool = True) -> int:
    if strict:
        return max(1, int(target_min_words or PREVIEW_PIPELINE_MIN_WORDS))
    baseline = int(target_min_words * 0.65) if target_min_words > 0 else PREVIEW_PIPELINE_MIN_WORDS
    return max(220, min(PREVIEW_PIPELINE_MIN_WORDS, baseline))


def chapter_meets_generation_target(
    book_dir: Path,
    chapter_number_value: int,
    target_min_words: int,
    *,
    strict: bool = True,
) -> bool:
    threshold = chapter_ready_threshold(target_min_words, strict=strict)
    return chapter_body_word_count(book_dir, chapter_number_value, stop_at=threshold) >= threshold


def chapter_generation_progress(book_dir: Path, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
    blueprint = chapter_generation_blueprint(book_dir, metadata)
    ready = 0
    for item in blueprint:
        if chapter_meets_generation_target(book_dir, int(item.get("number") or 0), int(item.get("min_words") or 0)):
            ready += 1
    total = len(blueprint)
    return {
        "ready_count": ready,
        "target_count": total,
        "complete": total == 0 or ready >= total,
    }


def build_full_generation_status(
    book_dir: Path,
    metadata: dict[str, Any] | None = None,
    *,
    lightweight: bool = False,
) -> dict[str, Any]:
    metadata = metadata or read_metadata(book_dir)
    slug = book_dir.name
    stage = str(metadata.get("full_generation_stage") or "idle").strip() or "idle"

    if lightweight:
        def parse_int(value: Any, fallback: int = 0) -> int:
            try:
                return int(value)
            except (TypeError, ValueError):
                return fallback

        target_count = max(0, parse_int(metadata.get("full_generation_target_count"), 0))
        ready_count = max(0, parse_int(metadata.get("full_generation_ready_count"), 0))
        if target_count <= 0:
            target_count = len(normalize_chapter_plan(metadata.get("chapter_plan")))
        if target_count <= 0:
            target_count = summary_chapter_count(book_dir)
        if target_count > 0:
            ready_count = min(ready_count, target_count)
        complete = (
            stage == "ready"
            or bool(str(metadata.get("full_generation_completed_at") or "").strip())
            or (target_count > 0 and ready_count >= target_count)
        )
    else:
        progress = chapter_generation_progress(book_dir, metadata)
        target_count = int(progress["target_count"])
        ready_count = int(progress["ready_count"])
        complete = bool(progress["complete"])

    message = str(metadata.get("full_generation_message") or "").strip()
    error = str(metadata.get("full_generation_error") or "").strip()
    failed_count = int(metadata.get("full_generation_failed_count") or 0)
    eta_seconds = int(metadata.get("full_generation_eta_seconds") or 0)
    avg_chapter_seconds = int(metadata.get("full_generation_avg_chapter_seconds") or 0)
    progress_raw = metadata.get("full_generation_progress")

    active = False
    with ACTIVE_FULL_CHAPTER_PIPELINES_LOCK:
        active = slug in ACTIVE_FULL_CHAPTER_PIPELINES

    if active and stage not in {"queued", "running"}:
        stage = "running"
    if not active and complete and stage in {"idle", "queued", "running", "needs_attention"}:
        stage = "ready"
    if not active and not complete and stage in {"queued", "running"}:
        if failed_count > 0 or error:
            stage = "needs_attention"
        else:
            stage = "idle"

    if isinstance(progress_raw, (int, float)):
        progress_value = int(progress_raw)
    else:
        progress_value = int((ready_count / max(1, target_count)) * 100) if target_count else 100
    if complete:
        progress_value = max(progress_value, 100)
    progress_value = max(0, min(100, progress_value))

    if stage == "idle" and not active and not complete:
        message = "Tam metin üretimi beklemede."
    elif not message:
        if complete:
            message = "Tüm bölümler hazır."
        elif active:
            message = "Bölümler arka planda yazılıyor."
        elif stage in {"needs_attention", "error"}:
            message = "Bölümlerin tamamı üretilemedi."
        else:
            message = "Tam metin üretimi beklemede."

    if complete:
        eta_seconds = 0
    eta_seconds = max(0, eta_seconds)
    avg_chapter_seconds = max(0, avg_chapter_seconds)

    return {
        "active": active,
        "stage": stage,
        "message": message,
        "error": error,
        "progress": progress_value,
        "ready_count": ready_count,
        "target_count": target_count,
        "failed_count": failed_count,
        "eta_seconds": eta_seconds,
        "avg_chapter_seconds": avg_chapter_seconds,
        "complete": complete,
        "eta_updated_at": str(metadata.get("full_generation_eta_updated_at") or ""),
        "started_at": str(metadata.get("full_generation_started_at") or ""),
        "updated_at": str(metadata.get("full_generation_updated_at") or ""),
        "completed_at": str(metadata.get("full_generation_completed_at") or ""),
    }


def sync_full_generation_metadata(book_dir: Path) -> None:
    status = build_full_generation_status(book_dir)
    updates: dict[str, Any] = {
        "full_generation_target_count": int(status["target_count"]),
        "full_generation_ready_count": int(status["ready_count"]),
        "full_generation_failed_count": int(status["failed_count"]),
        "full_generation_eta_seconds": int(status.get("eta_seconds") or 0),
        "full_generation_avg_chapter_seconds": int(status.get("avg_chapter_seconds") or 0),
        "full_generation_eta_updated_at": now_utc_iso(),
        "full_generation_progress": int(status["progress"]),
        "full_generation_updated_at": now_utc_iso(),
    }
    if bool(status["complete"]) and not bool(status["active"]):
        updates["full_generation_stage"] = "ready"
        updates["full_generation_message"] = "Tüm bölümler hazır."
        updates["full_generation_error"] = ""
        updates["full_generation_eta_seconds"] = 0
        updates["full_generation_completed_at"] = now_utc_iso()
    save_metadata(book_dir, updates)


def run_full_chapter_pipeline(slug: str, force: bool = False) -> None:
    book_dir = BOOK_OUTPUTS_DIR / slug
    if not book_dir.exists():
        with ACTIVE_FULL_CHAPTER_PIPELINES_LOCK:
            ACTIVE_FULL_CHAPTER_PIPELINES.discard(slug)
        return

    try:
        metadata = read_metadata(book_dir)
        blueprint = chapter_generation_blueprint(book_dir, metadata)
        target_count = len(blueprint)
        if target_count == 0:
            save_metadata(
                book_dir,
                {
                    "full_generation_stage": "ready",
                    "full_generation_message": "Tüm bölümler hazır.",
                    "full_generation_error": "",
                    "full_generation_progress": 100,
                    "full_generation_target_count": 0,
                    "full_generation_ready_count": 0,
                    "full_generation_failed_count": 0,
                    "full_generation_eta_seconds": 0,
                    "full_generation_avg_chapter_seconds": 0,
                    "full_generation_eta_updated_at": now_utc_iso(),
                    "full_generation_updated_at": now_utc_iso(),
                    "full_generation_completed_at": now_utc_iso(),
                },
            )
            return

        initial_progress = chapter_generation_progress(book_dir, metadata)
        save_metadata(
            book_dir,
            {
                "full_generation_stage": "running",
                "full_generation_message": "Tüm bölümler arka planda hazırlanıyor.",
                "full_generation_error": "",
                "full_generation_progress": max(
                    int((initial_progress["ready_count"] / max(1, target_count)) * 100),
                    8,
                ),
                "full_generation_target_count": target_count,
                "full_generation_ready_count": int(initial_progress["ready_count"]),
                "full_generation_failed_count": 0,
                "full_generation_eta_seconds": 0,
                "full_generation_avg_chapter_seconds": 0,
                "full_generation_initial_ready_count": int(initial_progress["ready_count"]),
                "full_generation_eta_updated_at": now_utc_iso(),
                "full_generation_started_at": now_utc_iso(),
                "full_generation_updated_at": now_utc_iso(),
                "full_generation_completed_at": "",
            },
        )

        initial_ready_count = int(initial_progress["ready_count"])
        preview_first_ready = first_preview_chapter_ready(book_dir)
        pending: list[dict[str, Any]] = []
        for index, item in enumerate(blueprint, start=1):
            chapter_number_value = int(item.get("number") or index)
            title = str(item.get("title") or "").strip() or normalize_structural_heading(
                "",
                infer_book_language(book_dir),
                chapter_number_value,
            )
            min_words = int(item.get("min_words") or 1600)
            max_words = int(item.get("max_words") or max(min_words + 400, 2200))
            if (
                chapter_number_value == 1
                and preview_first_ready
                and (book_dir / "chapter_1_final.md").exists()
                and chapter_meets_generation_target(book_dir, chapter_number_value, min_words)
            ):
                continue
            if not force and chapter_meets_generation_target(book_dir, chapter_number_value, min_words):
                continue
            pending.append(
                {
                    "number": chapter_number_value,
                    "title": title,
                    "min_words": min_words,
                    "max_words": max_words,
                }
            )

        if not pending:
            final_progress = chapter_generation_progress(book_dir, read_metadata(book_dir))
            save_metadata(
                book_dir,
                {
                    "full_generation_stage": "ready",
                    "full_generation_message": "Tüm bölümler hazır.",
                    "full_generation_error": "",
                    "full_generation_progress": 100,
                    "full_generation_target_count": int(final_progress["target_count"]),
                    "full_generation_ready_count": int(final_progress["ready_count"]),
                    "full_generation_failed_count": 0,
                    "full_generation_eta_seconds": 0,
                    "full_generation_avg_chapter_seconds": 0,
                    "full_generation_eta_updated_at": now_utc_iso(),
                    "full_generation_updated_at": now_utc_iso(),
                    "full_generation_completed_at": now_utc_iso(),
                },
            )
            sync_preview_generation_metadata(book_dir)
            return

        save_metadata(
            book_dir,
            {
                "full_generation_message": f"Bölümler paralel üretiliyor ({len(pending)} görev).",
                "full_generation_initial_ready_count": initial_ready_count,
                "full_generation_eta_seconds": 0,
                "full_generation_avg_chapter_seconds": 0,
                "full_generation_eta_updated_at": now_utc_iso(),
                "full_generation_updated_at": now_utc_iso(),
            },
        )

        failures: list[dict[str, Any]] = []
        failures_lock = threading.Lock()
        progress_lock = threading.Lock()
        pipeline_started_monotonic = time.monotonic()
        completed_jobs = 0

        def run_single_chapter(item: dict[str, Any]) -> dict[str, Any]:
            chapter_number_value = int(item.get("number") or 0)
            title = str(item.get("title") or "").strip() or normalize_structural_heading(
                "",
                infer_book_language(book_dir),
                chapter_number_value,
            )
            min_words = int(item.get("min_words") or 1600)
            max_words = int(item.get("max_words") or max(min_words + 400, 2200))
            retry_min_words = max(900, int(min_words * 0.75))
            chapter_attempts = [
                {
                    "style": "clear",
                    "tone": "professional",
                    "min_words": min_words,
                    "max_words": max_words,
                },
                {
                    "style": "detailed",
                    "tone": "professional",
                    "min_words": retry_min_words,
                    "max_words": max_words,
                },
            ]
            chapter_result: dict[str, Any] | None = None
            for attempt_index, attempt in enumerate(chapter_attempts, start=1):
                chapter_result = run_workflow(
                    {
                        "action": "chapter_generate",
                        "slug": slug,
                        "chapter_number": chapter_number_value,
                        "chapter_title": title,
                        "min_words": int(attempt["min_words"]),
                        "max_words": int(attempt["max_words"]),
                        "style": str(attempt["style"]),
                        "tone": str(attempt["tone"]),
                    }
                )
                if chapter_result.get("ok") and chapter_meets_generation_target(book_dir, chapter_number_value, min_words):
                    return {
                        "ok": True,
                        "chapter_number": chapter_number_value,
                        "title": title,
                    }
                if attempt_index < len(chapter_attempts):
                    append_log(
                        f"Chapter {chapter_number_value} generate attempt {attempt_index} failed for '{slug}'; retrying."
                    )

            chapter_path = book_dir / f"chapter_{chapter_number_value}_final.md"
            extend_result: dict[str, Any] | None = None
            if chapter_path.exists():
                extend_result = run_workflow(
                    {
                        "action": "chapter_extend",
                        "slug": slug,
                        "chapter_number": chapter_number_value,
                        "min_words": min_words,
                        "max_words": max_words,
                    }
                )
            if chapter_meets_generation_target(book_dir, chapter_number_value, min_words):
                append_log(f"Chapter {chapter_number_value} recovered via extend fallback for '{slug}'.")
                return {
                    "ok": True,
                    "chapter_number": chapter_number_value,
                    "title": title,
                }
            failing_result = (
                extend_result
                if isinstance(extend_result, dict) and not extend_result.get("ok")
                else chapter_result
            )
            failure_message = summarize_workflow_problem(
                failing_result,
                f"Bölüm {chapter_number_value} üretilemedi.",
            )
            return {
                "ok": False,
                "chapter_number": chapter_number_value,
                "title": title,
                "error": failure_message,
            }

        worker_count = max(1, min(FULL_CHAPTER_PIPELINE_CONCURRENCY, len(pending)))
        with ThreadPoolExecutor(max_workers=worker_count) as executor:
            future_map = {executor.submit(run_single_chapter, item): item for item in pending}
            for future in as_completed(future_map):
                result: dict[str, Any]
                try:
                    result = future.result()
                except Exception as exc:  # noqa: BLE001
                    item = future_map[future]
                    result = {
                        "ok": False,
                        "chapter_number": int(item.get("number") or 0),
                        "title": str(item.get("title") or ""),
                        "error": str(exc),
                    }

                with progress_lock:
                    completed_jobs += 1
                    if not bool(result.get("ok")):
                        with failures_lock:
                            failures.append(
                                {
                                    "chapter_number": int(result.get("chapter_number") or 0),
                                    "title": str(result.get("title") or ""),
                                    "error": str(result.get("error") or "Bölüm üretimi başarısız."),
                                }
                            )
                    progress = chapter_generation_progress(book_dir, read_metadata(book_dir))
                    ready_now = int(progress["ready_count"])
                    completed_in_run = max(0, ready_now - initial_ready_count)
                    elapsed_seconds = max(1, int(time.monotonic() - pipeline_started_monotonic))
                    avg_seconds = int(elapsed_seconds / completed_in_run) if completed_in_run > 0 else 0
                    remaining = max(0, target_count - ready_now)
                    eta_seconds = int(avg_seconds * remaining) if avg_seconds > 0 and remaining > 0 else 0

                    chapter_number_value = int(result.get("chapter_number") or 0)
                    chapter_title = str(result.get("title") or "").strip()
                    if bool(result.get("ok")):
                        step_message = (
                            f"Bölüm {chapter_number_value} tamamlandı ({completed_jobs}/{len(pending)}): {chapter_title}"
                            if chapter_title
                            else f"Bölüm {chapter_number_value} tamamlandı ({completed_jobs}/{len(pending)})."
                        )
                    else:
                        step_message = (
                            f"Bölüm {chapter_number_value} hata verdi ({completed_jobs}/{len(pending)}): {chapter_title}"
                            if chapter_title
                            else f"Bölüm {chapter_number_value} hata verdi ({completed_jobs}/{len(pending)})."
                        )

                    save_metadata(
                        book_dir,
                        {
                            "full_generation_stage": "running",
                            "full_generation_message": step_message,
                            "full_generation_progress": max(
                                int((ready_now / max(1, target_count)) * 100),
                                12,
                            ),
                            "full_generation_ready_count": ready_now,
                            "full_generation_target_count": target_count,
                            "full_generation_failed_count": len(failures),
                            "full_generation_eta_seconds": eta_seconds,
                            "full_generation_avg_chapter_seconds": avg_seconds,
                            "full_generation_eta_updated_at": now_utc_iso(),
                            "full_generation_updated_at": now_utc_iso(),
                        },
                    )

        final_progress = chapter_generation_progress(book_dir, read_metadata(book_dir))
        complete = bool(final_progress["complete"])
        failed_count = len(failures)
        if complete and failed_count == 0:
            save_metadata(
                book_dir,
                {
                    "full_generation_stage": "ready",
                    "full_generation_message": "Tüm bölümler hazır.",
                    "full_generation_error": "",
                    "full_generation_progress": 100,
                    "full_generation_target_count": int(final_progress["target_count"]),
                    "full_generation_ready_count": int(final_progress["ready_count"]),
                    "full_generation_failed_count": 0,
                    "full_generation_eta_seconds": 0,
                    "full_generation_eta_updated_at": now_utc_iso(),
                    "full_generation_updated_at": now_utc_iso(),
                    "full_generation_completed_at": now_utc_iso(),
                },
            )
        else:
            first_error = failures[0]["error"] if failures else "Bölümlerin tamamı üretilemedi."
            save_metadata(
                book_dir,
                {
                    "full_generation_stage": "needs_attention",
                    "full_generation_message": "Bazı bölümler tamamlanamadı.",
                    "full_generation_error": str(first_error),
                    "full_generation_progress": max(
                        int((int(final_progress["ready_count"]) / max(1, int(final_progress["target_count"]))) * 100),
                        12,
                    ),
                    "full_generation_target_count": int(final_progress["target_count"]),
                    "full_generation_ready_count": int(final_progress["ready_count"]),
                    "full_generation_failed_count": failed_count,
                    "full_generation_eta_seconds": 0,
                    "full_generation_eta_updated_at": now_utc_iso(),
                    "full_generation_updated_at": now_utc_iso(),
                    "full_generation_completed_at": "",
                },
            )
        sync_preview_generation_metadata(book_dir)
    except Exception as exc:  # noqa: BLE001
        save_metadata(
            book_dir,
            {
                "full_generation_stage": "error",
                "full_generation_message": "Tam metin üretimi yarıda kesildi.",
                "full_generation_error": str(exc),
                "full_generation_eta_seconds": 0,
                "full_generation_eta_updated_at": now_utc_iso(),
                "full_generation_updated_at": now_utc_iso(),
                "full_generation_completed_at": "",
            },
        )
        append_log(f"Full chapter pipeline failed for '{slug}': {exc}")
    finally:
        with ACTIVE_FULL_CHAPTER_PIPELINES_LOCK:
            ACTIVE_FULL_CHAPTER_PIPELINES.discard(slug)


def start_full_chapter_pipeline(slug: str, force: bool = False) -> dict[str, Any]:
    if not slug:
        raise ValueError("Book slug is required.")
    book_dir = BOOK_OUTPUTS_DIR / slug
    if not book_dir.exists():
        raise FileNotFoundError("Book not found.")

    metadata = read_metadata(book_dir)

    with ACTIVE_FULL_CHAPTER_PIPELINES_LOCK:
        if slug in ACTIVE_FULL_CHAPTER_PIPELINES and not force:
            return {
                "ok": True,
                "started": False,
                "slug": slug,
                "full_generation": build_full_generation_status(book_dir, metadata, lightweight=True),
            }

    if not force:
        lightweight_status = build_full_generation_status(book_dir, metadata, lightweight=True)
        if bool(lightweight_status.get("complete")):
            target_count = int(lightweight_status.get("target_count") or 0)
            ready_count = int(lightweight_status.get("ready_count") or target_count)
            save_metadata(
                book_dir,
                {
                    "full_generation_stage": "ready",
                    "full_generation_message": "Tüm bölümler hazır.",
                    "full_generation_error": "",
                    "full_generation_progress": 100,
                    "full_generation_target_count": target_count,
                    "full_generation_ready_count": ready_count,
                    "full_generation_failed_count": 0,
                    "full_generation_eta_seconds": 0,
                    "full_generation_avg_chapter_seconds": 0,
                    "full_generation_eta_updated_at": now_utc_iso(),
                    "full_generation_updated_at": now_utc_iso(),
                    "full_generation_completed_at": now_utc_iso(),
                },
            )
            return {
                "ok": True,
                "started": False,
                "slug": slug,
                "full_generation": build_full_generation_status(book_dir, lightweight=True),
            }

    progress = chapter_generation_progress(book_dir, metadata)
    if progress["complete"] and not force:
        save_metadata(
            book_dir,
            {
                "full_generation_stage": "ready",
                "full_generation_message": "Tüm bölümler hazır.",
                "full_generation_error": "",
                "full_generation_progress": 100,
                "full_generation_target_count": int(progress["target_count"]),
                "full_generation_ready_count": int(progress["ready_count"]),
                "full_generation_failed_count": 0,
                "full_generation_eta_seconds": 0,
                "full_generation_avg_chapter_seconds": 0,
                "full_generation_eta_updated_at": now_utc_iso(),
                "full_generation_updated_at": now_utc_iso(),
                "full_generation_completed_at": now_utc_iso(),
            },
        )
        return {
            "ok": True,
            "started": False,
            "slug": slug,
            "full_generation": build_full_generation_status(book_dir, lightweight=True),
        }

    with ACTIVE_FULL_CHAPTER_PIPELINES_LOCK:
        if slug in ACTIVE_FULL_CHAPTER_PIPELINES:
            return {
                "ok": True,
                "started": False,
                "slug": slug,
                "full_generation": build_full_generation_status(book_dir, lightweight=True),
            }
        ACTIVE_FULL_CHAPTER_PIPELINES.add(slug)

    target_count = int(progress["target_count"])
    ready_count = int(progress["ready_count"])
    save_metadata(
        book_dir,
        {
            "full_generation_stage": "queued",
            "full_generation_message": "Eksik bölümler sıraya alındı.",
            "full_generation_error": "",
            "full_generation_progress": int((ready_count / max(1, target_count)) * 100) if target_count else 100,
            "full_generation_target_count": target_count,
            "full_generation_ready_count": ready_count,
            "full_generation_failed_count": 0,
            "full_generation_eta_seconds": 0,
            "full_generation_avg_chapter_seconds": 0,
            "full_generation_initial_ready_count": ready_count,
            "full_generation_eta_updated_at": now_utc_iso(),
            "full_generation_started_at": now_utc_iso(),
            "full_generation_updated_at": now_utc_iso(),
            "full_generation_completed_at": "",
        },
    )
    # Submit to thread pool instead of creating raw thread
    submit_pipeline_task(run_full_chapter_pipeline, slug, force)
    append_log(f"Submitted full chapter pipeline for book '{slug}' to thread pool")
    return {
        "ok": True,
        "started": True,
        "slug": slug,
        "full_generation": build_full_generation_status(book_dir, lightweight=True),
    }


def resume_interrupted_pipelines() -> dict[str, int]:
    summary = {"preview_requeued": 0, "full_requeued": 0}
    if not PIPELINE_RECOVERY_ENABLED:
        return summary

    if not BOOK_OUTPUTS_DIR.exists():
        return summary

    preview_resume_stages = {"queued", "running", "chapter", "cover"}
    full_resume_stages = {"queued", "running", "error", "needs_attention"}

    for book_dir in sorted(BOOK_OUTPUTS_DIR.iterdir()):
        if not book_dir.is_dir():
            continue
        slug = book_dir.name
        try:
            metadata = read_metadata(book_dir)

            preview_stage = str(metadata.get("preview_stage") or "").strip().lower()
            preview_status = build_generation_status(book_dir, metadata, lightweight=True)
            if (
                not bool(preview_status.get("product_ready"))
                and not is_preview_pipeline_active(slug)
                and preview_stage in preview_resume_stages
            ):
                started = start_preview_pipeline(slug)
                if bool(started.get("started")):
                    summary["preview_requeued"] += 1
                    append_log(f"Recovery requeued preview pipeline for '{slug}' (stage={preview_stage}).")

            full_stage = str(metadata.get("full_generation_stage") or "").strip().lower()
            full_status = build_full_generation_status(book_dir, metadata, lightweight=True)
            if (
                not bool(full_status.get("complete"))
                and not is_full_pipeline_active(slug)
                and full_stage in full_resume_stages
            ):
                started = start_full_chapter_pipeline(slug, force=False)
                if bool(started.get("started")):
                    summary["full_requeued"] += 1
                    append_log(f"Recovery requeued full pipeline for '{slug}' (stage={full_stage}).")
        except Exception as exc:  # noqa: BLE001
            append_log(f"Recovery scan failed for '{slug}': {exc}")
    return summary


def pipeline_watchdog_loop() -> None:
    preview_stale_stages = {"queued", "running", "chapter", "cover"}
    full_stale_stages = {"queued", "running", "error", "needs_attention"}
    while not _pipeline_watchdog_stop_event.wait(PIPELINE_WATCHDOG_INTERVAL_SECONDS):
        if not PIPELINE_RECOVERY_ENABLED or not BOOK_OUTPUTS_DIR.exists():
            continue
        for book_dir in sorted(BOOK_OUTPUTS_DIR.iterdir()):
            if not book_dir.is_dir():
                continue
            slug = book_dir.name
            try:
                metadata = read_metadata(book_dir)

                preview_stage = str(metadata.get("preview_stage") or "").strip().lower()
                preview_active = is_preview_pipeline_active(slug)
                preview_status = build_generation_status(book_dir, metadata, lightweight=True)
                preview_updated_at = metadata.get("preview_updated_at") or metadata.get("preview_started_at")
                should_requeue_preview = (
                    not bool(preview_status.get("product_ready"))
                    and not preview_active
                    and preview_stage in preview_stale_stages
                    and is_timestamp_stale(preview_updated_at, PIPELINE_STALE_SECONDS)
                )
                if should_requeue_preview:
                    append_log(
                        f"Watchdog requeue preview for '{slug}' (stage={preview_stage}, stale>{PIPELINE_STALE_SECONDS}s)."
                    )
                    start_preview_pipeline(slug)

                full_stage = str(metadata.get("full_generation_stage") or "").strip().lower()
                full_active = is_full_pipeline_active(slug)
                full_status = build_full_generation_status(book_dir, metadata, lightweight=True)
                full_updated_at = (
                    metadata.get("full_generation_updated_at")
                    or metadata.get("full_generation_started_at")
                    or metadata.get("full_generation_eta_updated_at")
                )
                should_requeue_full = (
                    not bool(full_status.get("complete"))
                    and not full_active
                    and full_stage in full_stale_stages
                    and is_timestamp_stale(full_updated_at, PIPELINE_STALE_SECONDS)
                )
                if should_requeue_full:
                    append_log(
                        f"Watchdog requeue full pipeline for '{slug}' (stage={full_stage}, stale>{PIPELINE_STALE_SECONDS}s)."
                    )
                    start_full_chapter_pipeline(slug, force=False)
            except Exception as exc:  # noqa: BLE001
                append_log(f"Watchdog scan failed for '{slug}': {exc}")


def ensure_pipeline_watchdog_running() -> None:
    global _pipeline_watchdog_thread
    if not PIPELINE_RECOVERY_ENABLED:
        return
    with _pipeline_watchdog_lock:
        if _pipeline_watchdog_thread and _pipeline_watchdog_thread.is_alive():
            return
        _pipeline_watchdog_stop_event.clear()
        _pipeline_watchdog_thread = threading.Thread(
            target=pipeline_watchdog_loop,
            name="pipeline_watchdog",
            daemon=True,
        )
        _pipeline_watchdog_thread.start()
    append_log(
        "Pipeline watchdog started "
        f"(interval={PIPELINE_WATCHDOG_INTERVAL_SECONDS}s, stale={PIPELINE_STALE_SECONDS}s)."
    )


def stop_pipeline_watchdog(timeout: float = 5.0) -> None:
    global _pipeline_watchdog_thread
    with _pipeline_watchdog_lock:
        thread = _pipeline_watchdog_thread
        _pipeline_watchdog_thread = None
    if thread and thread.is_alive():
        _pipeline_watchdog_stop_event.set()
        thread.join(timeout=timeout)
    _pipeline_watchdog_stop_event.clear()


def run_preview_pipeline(slug: str) -> None:
    book_dir = BOOK_OUTPUTS_DIR / slug
    if not book_dir.exists():
        with ACTIVE_PREVIEW_PIPELINES_LOCK:
            ACTIVE_PREVIEW_PIPELINES.discard(slug)
        return

    try:
        metadata = read_metadata(book_dir)
        save_metadata(
            book_dir,
            {
                "preview_stage": "running",
                "preview_message": "İlk okunabilir bölüm ve kapak hazırlanıyor.",
                "preview_error": "",
                "preview_progress": 16,
                "preview_started_at": now_utc_iso(),
                "preview_updated_at": now_utc_iso(),
                "preview_completed_at": "",
            },
        )

        if not first_preview_chapter_ready(book_dir):
            first_title = chapter_heading_prefix(infer_book_language(book_dir, read_metadata(book_dir)), 1)
            first_plan = chapter_plan_for_number(metadata, 1)
            min_words = int(first_plan.get("target_min_words") or 1800) if first_plan else 1800
            max_words = int(first_plan.get("target_max_words") or 2400) if first_plan else 2400
            chapters = read_book(book_dir).get("chapters") or []
            if chapters:
                first_title = str(chapters[0].get("title") or first_title).strip() or first_title
            if first_plan and str(first_plan.get("title") or "").strip():
                first_title = str(first_plan.get("title") or "").strip() or first_title
            save_metadata(
                book_dir,
                {
                    "preview_stage": "chapter",
                    "preview_message": "İlk okunabilir bölüm yazılıyor.",
                    "first_chapter_state": "running",
                    "preview_progress": 42,
                    "preview_updated_at": now_utc_iso(),
                },
            )
            chapter_result = run_workflow(
                {
                    "action": "chapter_generate",
                    "slug": slug,
                    "chapter_number": 1,
                    "chapter_title": first_title,
                    "min_words": min_words,
                    "max_words": max_words,
                    "style": "clear",
                    "tone": "professional",
                }
            )
            if first_preview_chapter_ready(book_dir):
                save_metadata(
                    book_dir,
                    {
                        "first_chapter_state": "ready",
                        "preview_error": "",
                        "preview_message": "İlk bölüm hazır. Kapak görseli üretiliyor.",
                        "preview_progress": 74,
                        "preview_updated_at": now_utc_iso(),
                    },
                )
            else:
                save_metadata(
                    book_dir,
                    {
                        "first_chapter_state": "error",
                        "preview_error": summarize_workflow_problem(
                            chapter_result,
                            "İlk bölüm üretimi tamamlanamadı.",
                        ),
                        "preview_updated_at": now_utc_iso(),
                    },
                )
        else:
                save_metadata(
                    book_dir,
                    {
                        "first_chapter_state": "ready",
                        "preview_error": "",
                        "preview_message": "İlk bölüm hazır. Kapak görseli üretiliyor.",
                        "preview_progress": 68,
                        "preview_updated_at": now_utc_iso(),
                    },
                )

        if not cover_asset_ready(book_dir):
            save_metadata(
                book_dir,
                {
                    "preview_stage": "cover",
                    "preview_message": "Kapak görseli üretiliyor.",
                    "cover_state": "running",
                    "preview_progress": 78,
                    "preview_updated_at": now_utc_iso(),
                },
            )
            book_metadata = read_metadata(book_dir)
            book = read_book_core_fields(book_dir, book_metadata)
            default_author = read_settings()["default_author"]
            cover_result: dict[str, Any] = {
                "ok": False,
                "action": "cover_variants_generate",
                "returncode": 1,
                "output": "Kapak üretimi başlatılamadı.",
                "warnings": [],
                "produced_files": [],
            }
            if image_provider_policy_vertex_only():
                variants_preflight = preflight_for_workflow("cover_variants_generate", slug)
                if variants_preflight.get("ok"):
                    cover_result = run_workflow(
                        {
                            "action": "cover_variants_generate",
                            "slug": slug,
                            "variant_count": 1,
                            "service": normalize_cover_service_for_policy(PREVIEW_COVER_SERVICE),
                            "safe_mode": False,
                        }
                    )
                else:
                    cover_result = {
                        "ok": False,
                        "action": "cover_variants_generate",
                        "returncode": 1,
                        "output": "\n".join(variants_preflight.get("missing") or [])
                        or "Vertex kapak üretimi için gerekli yapılandırma eksik.",
                        "warnings": list(variants_preflight.get("warnings") or []),
                        "produced_files": [],
                    }
            else:
                cover_result = run_workflow(
                    {
                        "action": "cover_script",
                        "slug": slug,
                        "title": book.get("title") or slug,
                        "author": book.get("author") or default_author,
                        "genre": infer_cover_genre(book),
                    }
                )
                if not cover_result.get("ok") or not cover_asset_ready(book_dir):
                    variants_preflight = preflight_for_workflow("cover_variants_generate", slug)
                    if variants_preflight.get("ok"):
                        cover_result = run_workflow(
                            {
                                "action": "cover_variants_generate",
                                "slug": slug,
                                "variant_count": 1,
                                "safe_mode": True,
                            }
                        )

                if not cover_asset_ready(book_dir):
                    fallback_preflight = preflight_for_workflow("cover_local", slug)
                    if fallback_preflight.get("ok"):
                        cover_result = run_workflow(
                            {
                                "action": "cover_local",
                                "slug": slug,
                                "title": book.get("title") or slug,
                                "subtitle": book.get("subtitle") or "",
                                "author": book.get("author") or default_author,
                                "blurb": book.get("description") or "",
                            }
                        )
            if cover_asset_ready(book_dir):
                save_metadata(
                    book_dir,
                    {
                        "cover_state": "ready",
                        "preview_error": "",
                        "preview_message": "Kapak ve ilk okunabilir bölüm hazır.",
                        "preview_progress": 100,
                        "preview_updated_at": now_utc_iso(),
                    },
                )
            else:
                save_metadata(
                    book_dir,
                    {
                        "cover_state": "error",
                        "preview_error": summarize_workflow_problem(
                            cover_result,
                            "Kapak üretimi tamamlanamadı.",
                        ),
                        "preview_updated_at": now_utc_iso(),
                    },
                )
        else:
                save_metadata(
                    book_dir,
                    {
                        "cover_state": "ready",
                        "preview_error": "",
                        "preview_progress": 100 if first_preview_chapter_ready(book_dir) else 46,
                        "preview_updated_at": now_utc_iso(),
                    },
                )

        generation = build_generation_status(book_dir)
        final_stage = "ready" if generation["product_ready"] else "chapter_ready" if generation["preview_ready"] else "needs_attention"
        save_metadata(
            book_dir,
            {
                "preview_stage": final_stage,
                "preview_message": generation["message"],
                "preview_error": "" if generation["preview_ready"] else str(read_metadata(book_dir).get("preview_error") or ""),
                "preview_progress": 100 if generation["product_ready"] else 78 if generation["preview_ready"] else generation["progress"],
                "preview_updated_at": now_utc_iso(),
                "preview_completed_at": now_utc_iso() if generation["preview_ready"] else "",
            },
        )
        if (
            os.environ.get("BOOK_PREVIEW_AUTO_START_FULL", "1").strip() != "0"
            and generation.get("preview_ready")
        ):
            try:
                start_full_chapter_pipeline(slug, force=False)
            except Exception as exc:  # noqa: BLE001
                append_log(f"Full chapter bootstrap skipped for '{slug}': {exc}")
    except Exception as exc:  # noqa: BLE001
        save_metadata(
            book_dir,
            {
                "preview_stage": "error",
                "preview_message": "Önizleme üretimi yarıda kesildi.",
                "preview_error": str(exc),
                "preview_updated_at": now_utc_iso(),
            },
        )
        append_log(f"Preview pipeline failed for '{slug}': {exc}")
    finally:
        with ACTIVE_PREVIEW_PIPELINES_LOCK:
            ACTIVE_PREVIEW_PIPELINES.discard(slug)


def start_preview_pipeline(slug: str) -> dict[str, Any]:
    if not slug:
        raise ValueError("Book slug is required.")
    book_dir = BOOK_OUTPUTS_DIR / slug
    if not book_dir.exists():
        raise FileNotFoundError("Book not found.")

    generation = build_generation_status(book_dir)
    if generation["product_ready"]:
        return {"ok": True, "started": False, "slug": slug, "generation": generation}

    with ACTIVE_PREVIEW_PIPELINES_LOCK:
        if slug in ACTIVE_PREVIEW_PIPELINES:
            return {"ok": True, "started": False, "slug": slug, "generation": build_generation_status(book_dir)}
        ACTIVE_PREVIEW_PIPELINES.add(slug)

    save_metadata(
        book_dir,
        {
            "preview_stage": "queued",
            "preview_message": "Kapak ve ilk okunabilir bölüm sıraya alındı.",
            "preview_error": "",
            "preview_progress": max(18, generation["progress"]),
            "cover_state": "ready" if generation["cover_ready"] else "queued",
            "first_chapter_state": "ready" if generation["first_chapter_ready"] else "queued",
            "preview_updated_at": now_utc_iso(),
        },
    )
    # Submit to thread pool instead of creating raw thread
    submit_pipeline_task(run_preview_pipeline, slug)
    append_log(f"Submitted preview pipeline for book '{slug}' to thread pool")
    return {"ok": True, "started": True, "slug": slug, "generation": build_generation_status(book_dir)}


def resolve_shared_ai_key(settings: dict[str, Any] | None = None, env: dict[str, str] | None = None) -> str:
    settings = settings or read_settings()
    env = env or os.environ
    for key in ("CODEFAST_API_KEY", "codefast"):
        value = str(settings.get(key, "") or env.get(key, "") or "")
        if value:
            return value
    return ""


def read_local_env_file(path: Path) -> dict[str, str]:
    parsed: dict[str, str] = {}
    if not path.exists() or not path.is_file():
        return parsed
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return parsed

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].strip()
        match = ENV_ASSIGNMENT_PATTERN.match(line)
        if not match:
            continue
        key = match.group(1).strip()
        value = match.group(2).strip()
        if len(value) >= 2 and (
            (value.startswith('"') and value.endswith('"'))
            or (value.startswith("'") and value.endswith("'"))
        ):
            value = value[1:-1]
        parsed[key] = value
    return parsed


def merge_book_generator_local_env(env: dict[str, str]) -> dict[str, str]:
    merged = dict(env)
    for env_file in BOOK_GENERATOR_ENV_FILES:
        for key, value in read_local_env_file(env_file).items():
            merged[key] = value
    return merged


def default_book_generator_env_prefix(env: dict[str, str]) -> Path:
    configured = str(env.get("BOOK_GENERATOR_ENV_PREFIX") or "").strip()
    if configured:
        return Path(configured)
    mamba_root = str(env.get("MAMBA_ROOT_PREFIX") or "").strip() or str(Path.home() / ".local/share/micromamba")
    env_name = str(env.get("BOOK_GENERATOR_ENV_NAME") or "").strip() or "book-generator"
    return Path(mamba_root) / "envs" / env_name


def prepend_unique_path_entries(current_path: str, new_entries: list[str]) -> str:
    seen: set[str] = set()
    ordered: list[str] = []
    for raw_entry in [*new_entries, *str(current_path or "").split(os.pathsep)]:
        entry = str(raw_entry or "").strip()
        if not entry:
            continue
        normalized = os.path.normcase(entry)
        if normalized in seen:
            continue
        seen.add(normalized)
        ordered.append(entry)
    return os.pathsep.join(ordered)


def command_env(settings: dict[str, Any] | None = None, overrides: dict[str, str] | None = None) -> dict[str, str]:
    env = merge_book_generator_local_env(os.environ.copy())
    env.setdefault("BOOK_GENERATOR_ROOT", str(ROOT_DIR))
    env_prefix = default_book_generator_env_prefix(env)
    env["BOOK_GENERATOR_ENV_PREFIX"] = str(env_prefix)
    preferred_path_entries: list[str] = []
    env_bin = env_prefix / "bin"
    scripts_dir = ROOT_DIR / "scripts"
    if env_bin.exists():
        preferred_path_entries.append(str(env_bin))
    if scripts_dir.exists():
        preferred_path_entries.append(str(scripts_dir))
    env["PATH"] = prepend_unique_path_entries(str(env.get("PATH") or ""), preferred_path_entries)

    settings = settings or read_settings()
    shared_key = resolve_shared_ai_key(settings, env)

    if shared_key:
        env["CODEFAST_API_KEY"] = shared_key
        env["codefast"] = shared_key
    else:
        env.pop("CODEFAST_API_KEY", None)
        env.pop("codefast", None)

    value = str(settings.get("CODEFAST_API_KEY", "") or env.get("CODEFAST_API_KEY", "") or "")
    if value:
        env["CODEFAST_API_KEY"] = value
    else:
        env.pop("CODEFAST_API_KEY", None)

    if overrides:
        for key, value in overrides.items():
            env[key] = value
    return env


def tool_exists(tool: str, env: dict[str, str] | None = None) -> bool:
    selected_env = env if env is not None else command_env()
    tool_path = str(selected_env.get("PATH") or "")
    return shutil.which(tool, path=tool_path) is not None


def normalize_windows_path_prefix(value: str) -> str:
    text = str(value or "")
    if text.startswith("\\\\?\\"):
        return text[4:]
    return text


def windows_drive_components(value: str) -> tuple[str, str] | None:
    normalized = normalize_windows_path_prefix(value)
    if not WINDOWS_DRIVE_PATH_PATTERN.match(normalized):
        return None
    drive = normalized[0].lower()
    remainder = normalized[2:].replace("\\", "/").lstrip("/")
    return drive, remainder


def to_bash_path(value: str | Path) -> str:
    return to_bash_path_for_style(value, detect_bash_path_style())


def to_bash_path_for_style(value: str | Path, style: str) -> str:
    text = normalize_windows_path_prefix(str(value or ""))
    if not text:
        return text

    if style == "wsl":
        msys_match = re.match(r"^/([a-zA-Z])/(.*)$", text)
        if msys_match:
            drive = msys_match.group(1).lower()
            remainder = msys_match.group(2).lstrip("/")
            return f"/mnt/{drive}/{remainder}" if remainder else f"/mnt/{drive}"
    else:
        wsl_match = re.match(r"^/mnt/([a-zA-Z])/(.*)$", text)
        if wsl_match:
            drive = wsl_match.group(1).lower()
            remainder = wsl_match.group(2).lstrip("/")
            return f"/{drive}/{remainder}" if remainder else f"/{drive}"

    components = windows_drive_components(text)
    if not components:
        return text
    drive, remainder = components
    if style == "wsl":
        return f"/mnt/{drive}/{remainder}" if remainder else f"/mnt/{drive}"
    return f"/{drive}/{remainder}" if remainder else f"/{drive}"


def maybe_bash_path_arg(value: str | Path) -> str:
    return maybe_bash_path_arg_for_style(value, detect_bash_path_style())


def maybe_bash_path_arg_for_style(value: str | Path, style: str) -> str:
    text = normalize_windows_path_prefix(str(value or ""))
    if (
        WINDOWS_DRIVE_PATH_PATTERN.match(text)
        or text.startswith("/mnt/")
        or re.match(r"^/[a-zA-Z]/", text)
    ):
        return to_bash_path_for_style(text, style)
    return text


def bash_command(script: str | Path, *args: str | Path) -> list[str]:
    return bash_command_for_style(detect_bash_path_style(), script, *args)


def bash_command_for_style(style: str, script: str | Path, *args: str | Path) -> list[str]:
    command = ["bash", to_bash_path_for_style(script, style)]
    command.extend(maybe_bash_path_arg_for_style(arg, style) for arg in args)
    return command


def set_bash_path_style(style: str | None) -> None:
    global BASH_PATH_STYLE_CACHE
    with BASH_PATH_STYLE_LOCK:
        BASH_PATH_STYLE_CACHE = style


def detect_bash_path_style(force_refresh: bool = False) -> str:
    global BASH_PATH_STYLE_CACHE

    with BASH_PATH_STYLE_LOCK:
        if BASH_PATH_STYLE_CACHE and not force_refresh:
            return BASH_PATH_STYLE_CACHE

    # Non-Windows environments should always use `/mnt/<drive>/...` style for
    # Windows-mounted workspace paths.
    if os.name != "nt":
        with BASH_PATH_STYLE_LOCK:
            BASH_PATH_STYLE_CACHE = "wsl"
        return "wsl"

    style = "msys"
    bash_binary = str(shutil.which("bash") or "").strip().lower().replace("\\", "/")
    if "system32/bash.exe" in bash_binary:
        style = "wsl"
    elif bash_binary:
        try:
            probe = subprocess.run(
                ["bash", "-lc", "pwd"],
                cwd=ROOT_DIR,
                text=True,
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=ENV_DETECTION_TIMEOUT_SECONDS,
            )
            probe_pwd = str(probe.stdout or "").strip().lower()
            if probe.returncode == 0 and probe_pwd.startswith("/mnt/"):
                style = "wsl"
        except (OSError, subprocess.TimeoutExpired):
            style = "msys"

    with BASH_PATH_STYLE_LOCK:
        BASH_PATH_STYLE_CACHE = style
    return style


def detect_python_launcher(force_refresh: bool = False) -> list[str] | None:
    global PYTHON_LAUNCHER_CACHE

    with PYTHON_LAUNCHER_LOCK:
        if PYTHON_LAUNCHER_CACHE and not force_refresh:
            return list(PYTHON_LAUNCHER_CACHE)

    candidates: tuple[tuple[str, ...], ...] = (
        ("python3",),
        ("python",),
        ("py", "-3"),
    )
    for candidate in candidates:
        try:
            check = subprocess.run(
                [*candidate, "--version"],
                cwd=ROOT_DIR,
                text=True,
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=ENV_DETECTION_TIMEOUT_SECONDS,
            )
        except (OSError, subprocess.TimeoutExpired):
            continue
        if check.returncode == 0:
            with PYTHON_LAUNCHER_LOCK:
                PYTHON_LAUNCHER_CACHE = list(candidate)
            return list(candidate)

    with PYTHON_LAUNCHER_LOCK:
        PYTHON_LAUNCHER_CACHE = None
    return None


def find_outline_file(book_dir: Path) -> Path | None:
    candidates = sorted(book_dir.glob("book_outline_final_*.md"))
    if candidates:
        return candidates[0]
    for pattern in ("book_outline_*.md", "outline.md"):
        matches = sorted(book_dir.glob(pattern))
        if matches:
            return matches[0]
    markdown_files = sorted(
        path
        for path in book_dir.glob("*.md")
        if "chapter_" not in path.name and "manuscript" not in path.name
    )
    return markdown_files[0] if markdown_files else None


def find_outline_file_from_entries(book_dir: Path, entries: set[str]) -> Path | None:
    final = sorted(name for name in entries if name.startswith("book_outline_final_") and name.endswith(".md"))
    if final:
        return book_dir / final[0]

    secondary = sorted(name for name in entries if name.startswith("book_outline_") and name.endswith(".md"))
    if secondary:
        return book_dir / secondary[0]

    if "outline.md" in entries:
        return book_dir / "outline.md"

    markdown_candidates = sorted(
        name
        for name in entries
        if name.endswith(".md") and "chapter_" not in name and "manuscript" not in name
    )
    if markdown_candidates:
        return book_dir / markdown_candidates[0]
    return None


def read_outline_title_subtitle(path: Path | None) -> tuple[str, str]:
    if not path or not path.exists():
        return "", ""
    title = ""
    subtitle = ""
    try:
        with path.open("r", encoding="utf-8", errors="replace") as handle:
            for line in handle:
                if not title and line.startswith("# "):
                    title = line[2:].strip()
                elif not subtitle and line.startswith("## "):
                    subtitle = line[3:].strip()
                if title and subtitle:
                    break
    except OSError:
        return "", ""
    return title, subtitle


def relative_to_root(path: Path) -> str:
    return path.relative_to(ROOT_DIR).as_posix()


def workspace_url(path: Path) -> str:
    return "/workspace/" + urllib.parse.quote(relative_to_root(path), safe="/")


def is_text_file(path: Path) -> bool:
    return path.suffix.lower() in TEXT_EXTENSIONS


def file_entry(path: Path) -> dict[str, Any]:
    stat = path.stat()
    return {
        "name": path.name,
        "relative_path": relative_to_root(path),
        "url": workspace_url(path),
        "size": stat.st_size,
        "modified": datetime.fromtimestamp(stat.st_mtime).astimezone().isoformat(timespec="seconds"),
        "is_text": is_text_file(path),
    }


def latest_export_dir(book_dir: Path) -> Path | None:
    exports = sorted(
        (path for path in book_dir.glob("exports_*") if path.is_dir()),
        key=lambda item: item.name,
    )
    return exports[-1] if exports else None


def latest_export_file_for_format(book_dir: Path, format_name: str) -> Path | None:
    target_suffix = f".{format_name.lower()}"
    candidates = [
        path
        for path in collect_exports(book_dir)
        if path.is_file() and path.suffix.lower() == target_suffix
    ]
    if not candidates:
        return None
    return max(candidates, key=lambda item: (item.stat().st_mtime, item.name))


def selected_cover_variant_record(metadata: dict[str, Any]) -> dict[str, Any] | None:
    variants = normalize_cover_variants(metadata.get("cover_variants"))
    if not variants:
        return None
    selected_id = str(metadata.get("selected_cover_variant") or "").strip()
    recommended_id = str(metadata.get("recommended_cover_variant") or "").strip()
    target_id = selected_id or recommended_id
    for variant in variants:
        if str(variant.get("id") or "") == target_id:
            return variant
    return variants[0]


def build_export_parity_report(book_dir: Path, metadata: dict[str, Any], format_name: str) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    latest_dir = latest_export_dir(book_dir)
    front_cover, back_cover = resolve_cover_image_references(book_dir, metadata)
    export_file = latest_export_file_for_format(book_dir, format_name) if format_name in {"epub", "pdf"} else None

    if not latest_dir:
        errors.append("No export directory was created.")
    else:
        for label, reference in (("front", front_cover), ("back", back_cover)):
            if not reference:
                errors.append(f"Selected {label} cover asset is missing from metadata.")
                continue
            expected_name = Path(reference).name
            if not (latest_dir / expected_name).is_file():
                errors.append(f"Expected {label} cover '{expected_name}' was not copied into the latest export directory.")
        if format_name in {"epub", "pdf"} and not export_file:
            errors.append(f"No {format_name.upper()} export file was found in the latest export directory.")
        elif export_file and latest_dir not in export_file.parents:
            warnings.append("Resolved export file was not located in the latest export directory.")

    return {
        "ok": not errors,
        "errors": errors,
        "warnings": warnings,
        "latest_export_dir": relative_to_root(latest_dir) if latest_dir else "",
        "export_relative_path": relative_to_root(export_file) if export_file else "",
        "export_url": workspace_url(export_file) if export_file else "",
    }


def list_files(paths: list[Path]) -> list[dict[str, Any]]:
    return [file_entry(path) for path in sorted(paths, key=lambda item: relative_to_root(item))]


def sync_extra_files(book_dir: Path) -> None:
    ensure_book_layout(book_dir)
    extras_dir = book_dir / "extras"
    for name in EXTRA_FILES:
        root_path = book_dir / name
        extra_path = extras_dir / name
        if root_path.exists():
            if not extra_path.exists() or root_path.read_bytes() != extra_path.read_bytes():
                shutil.copy2(root_path, extra_path)
        elif extra_path.exists():
            shutil.copy2(extra_path, root_path)


def collect_extra_files(book_dir: Path) -> list[Path]:
    sync_extra_files(book_dir)
    extras: list[Path] = []
    for name in EXTRA_FILES:
        candidate = book_dir / "extras" / name
        if candidate.exists():
            extras.append(candidate)
    return extras


def collect_reference_files(book_dir: Path) -> list[Path]:
    files: list[Path] = []
    for name in REFERENCE_ROOT_FILES:
        candidate = book_dir / name
        if candidate.exists():
            files.append(candidate)
    for relative in ("sources", "temp_refs", "temp_appendices"):
        directory = book_dir / relative
        if directory.exists():
            files.extend(path for path in directory.rglob("*") if path.is_file())
    return sorted(files, key=lambda item: relative_to_root(item))


def collect_reports(book_dir: Path) -> list[Path]:
    patterns = (
        "chapter_*_plagiarism_report.md",
        "*.before_review",
        "*.before_extension",
        "*.backup_*",
    )
    files: list[Path] = []
    for pattern in patterns:
        files.extend(path for path in book_dir.glob(pattern) if path.is_file())
    return sorted(set(files), key=lambda item: relative_to_root(item))


def collect_assets(book_dir: Path, metadata: dict[str, Any]) -> list[Path]:
    assets = [path for path in (book_dir / "assets").rglob("*") if path.is_file()]
    for key in ("cover_image", "back_cover_image"):
        value = str(metadata.get(key, "") or "")
        if not value:
            continue
        candidate = (book_dir / value).resolve()
        if candidate.is_file() and ROOT_DIR in candidate.parents:
            assets.append(candidate)
    deduped: dict[str, Path] = {relative_to_root(path): path for path in assets}
    return [deduped[key] for key in sorted(deduped)]


def collect_exports(book_dir: Path) -> list[Path]:
    files: list[Path] = []
    for export_dir in sorted(book_dir.glob("exports_*")):
        if export_dir.is_dir():
            files.extend(path for path in export_dir.rglob("*") if path.is_file())
    return sorted(files, key=lambda item: relative_to_root(item))


def collect_research_files(book_dir: Path) -> list[Path]:
    research_dir = book_dir / "research"
    if not research_dir.exists():
        return []
    return sorted(
        (path for path in research_dir.rglob("*") if path.is_file()),
        key=lambda item: relative_to_root(item),
    )


def book_root_index(book_dir: Path) -> dict[str, bool]:
    try:
        with os.scandir(book_dir) as iterator:
            return {entry.name: entry.is_dir(follow_symlinks=False) for entry in iterator}
    except OSError:
        return {}


def summary_asset_count(book_dir: Path, metadata: dict[str, Any]) -> int:
    assets_count = 0
    try:
        with os.scandir(book_dir / "assets") as iterator:
            assets_count = sum(1 for entry in iterator if entry.is_file(follow_symlinks=False))
    except OSError:
        assets_count = 0

    front_cover, back_cover = resolve_cover_image_references(book_dir, metadata)
    referenced_assets: set[str] = {value for value in (front_cover, back_cover) if value}
    cover_art = existing_book_asset_reference(book_dir, metadata.get("cover_art_image"))
    if cover_art:
        referenced_assets.add(cover_art)
    return assets_count + len(referenced_assets)


def summary_export_count(book_dir: Path, root_index: dict[str, bool] | None = None) -> int:
    root_index = root_index or book_root_index(book_dir)
    return sum(1 for name, is_dir in root_index.items() if is_dir and name.startswith("exports_"))


def summary_research_count(book_dir: Path) -> int:
    try:
        with os.scandir(book_dir / "research") as iterator:
            return sum(1 for entry in iterator if entry.is_file(follow_symlinks=False))
    except OSError:
        return 0


def summary_extra_count(book_dir: Path, root_entries: set[str] | None = None) -> int:
    if root_entries is None:
        root_entries = set(book_root_index(book_dir).keys())
    try:
        with os.scandir(book_dir / "extras") as iterator:
            extra_entries = {entry.name for entry in iterator}
    except OSError:
        extra_entries = set()

    count = 0
    for name in EXTRA_FILES:
        if name in extra_entries or name in root_entries:
            count += 1
    return count


def summary_chapter_count(book_dir: Path, root_entries: set[str] | None = None) -> int:
    if root_entries is None:
        root_entries = set(book_root_index(book_dir).keys())
    return sum(1 for name in root_entries if CHAPTER_FINAL_FILE_PATTERN.match(name))


def collect_strategy_research_files(book_dir: Path) -> list[Path]:
    allowed = {".txt", ".md", ".json", ".csv"}
    return [
        path
        for path in collect_research_files(book_dir)
        if path.suffix.lower() in allowed and "/research/insights/" not in relative_to_root(path)
    ]


def collect_chapters(book_dir: Path) -> list[dict[str, Any]]:
    chapters = []
    metadata = read_metadata(book_dir)
    language = infer_book_language(book_dir, metadata)
    for chapter_path in sorted(book_dir.glob("chapter_*_final.md"), key=chapter_number):
        lines = chapter_path.read_text(encoding="utf-8", errors="replace").splitlines()
        heading = ""
        content_start = 0
        for index, line in enumerate(lines):
            if line.startswith("# "):
                heading = line[2:].strip()
                content_start = index + 1
                break
        chapter_title = strip_chapter_heading(heading)
        chapter_title = normalize_structural_heading(chapter_title, language, chapter_number(chapter_path))
        chapters.append(
            {
                "number": chapter_number(chapter_path),
                "title": chapter_title,
                "content": "\n".join(lines[content_start:]).strip(),
                "filename": chapter_path.name,
                "relative_path": relative_to_root(chapter_path),
                "url": workspace_url(chapter_path),
            }
        )
    return chapters


def read_chapter_heading_and_excerpt(
    chapter_path: Path,
    *,
    word_limit: int | None = None,
) -> tuple[str, str]:
    heading = ""
    lines: list[str] = []
    remaining_words = max(0, int(word_limit or 0)) if word_limit is not None else None
    found_heading = False
    try:
        with chapter_path.open("r", encoding="utf-8", errors="replace") as handle:
            for raw_line in handle:
                line = raw_line.rstrip("\n")
                if not found_heading:
                    if line.startswith("# "):
                        heading = line[2:].strip()
                        found_heading = True
                    continue

                if remaining_words is None:
                    lines.append(line)
                    continue

                if remaining_words <= 0:
                    break

                words = re.findall(r"\S+", line)
                if not words:
                    lines.append(line)
                    continue

                if len(words) <= remaining_words:
                    lines.append(line)
                    remaining_words -= len(words)
                    continue

                lines.append(" ".join(words[:remaining_words]).strip() + "…")
                remaining_words = 0
                break
    except OSError:
        return "", ""

    return heading, "\n".join(lines).strip()


def collect_chapters_preview(
    book_dir: Path,
    metadata: dict[str, Any] | None = None,
    *,
    avoid_non_primary_content: bool = False,
) -> list[dict[str, Any]]:
    metadata = metadata or read_metadata(book_dir)
    language = infer_book_language(book_dir, metadata)

    plan_by_number: dict[int, str] = {}
    for item in normalize_chapter_plan(metadata.get("chapter_plan")):
        try:
            number = int(item.get("number") or 0)
        except (TypeError, ValueError):
            number = 0
        if number <= 0:
            continue
        plan_by_number[number] = str(item.get("title") or "").strip()

    chapter_paths = sorted(book_dir.glob("chapter_*_final.md"), key=chapter_number)
    path_by_number = {chapter_number(path): path for path in chapter_paths}

    numbers = sorted(set(path_by_number.keys()) | set(plan_by_number.keys()))
    max_known_number = numbers[-1] if numbers else 0
    try:
        target_count = int(metadata.get("full_generation_target_count") or 0)
    except (TypeError, ValueError):
        target_count = 0
    if target_count > max_known_number:
        numbers.extend(range(max_known_number + 1, target_count + 1))

    chapters: list[dict[str, Any]] = []
    for number in numbers:
        chapter_path = path_by_number.get(number)
        heading = ""
        content = ""

        if chapter_path and (number == 1 or not avoid_non_primary_content):
            word_limit = (
                PREVIEW_PRIMARY_CHAPTER_WORD_LIMIT
                if number == 1
                else PREVIEW_SECONDARY_CHAPTER_WORD_LIMIT
            )
            heading, content = read_chapter_heading_and_excerpt(
                chapter_path,
                word_limit=word_limit,
            )

        plan_title = plan_by_number.get(number, "")
        normalized_plan_title = normalize_structural_heading(plan_title, language, number)
        chapter_title = strip_chapter_heading(heading)
        chapter_title = normalize_structural_heading(
            chapter_title or normalized_plan_title,
            language,
            number,
        )

        if chapter_path:
            filename = chapter_path.name
            relative_path = relative_to_root(chapter_path)
            url = workspace_url(chapter_path)
        else:
            filename = f"chapter_{number}_final.md"
            synthetic_path = book_dir / filename
            relative_path = relative_to_root(synthetic_path)
            url = workspace_url(synthetic_path)

        chapters.append(
            {
                "number": number,
                "title": chapter_title,
                "content": content,
                "filename": filename,
                "relative_path": relative_path,
                "url": url,
            }
        )

    return chapters


def build_capabilities() -> dict[str, Any]:
    env = command_env()
    pandoc_ok = tool_exists("pandoc", env)
    pdf_engine_ok = any(tool_exists(tool, env) for tool in ("tectonic", "xelatex", "pdflatex"))
    calibre_ok = tool_exists("ebook-convert", env)
    return {
        "all": {"available": pandoc_ok, "reason": "" if pandoc_ok else "pandoc missing"},
        "epub": {"available": pandoc_ok, "reason": "" if pandoc_ok else "pandoc missing"},
        "pdf": {
            "available": pandoc_ok and pdf_engine_ok,
            "reason": "" if (pandoc_ok and pdf_engine_ok) else "pandoc or PDF engine missing",
        },
        "html": {"available": pandoc_ok, "reason": "" if pandoc_ok else "pandoc missing"},
        "markdown": {"available": pandoc_ok, "reason": "" if pandoc_ok else "pandoc missing"},
        "mobi": {"available": pandoc_ok and calibre_ok, "reason": "" if (pandoc_ok and calibre_ok) else "ebook-convert missing"},
        "azw3": {"available": pandoc_ok and calibre_ok, "reason": "" if (pandoc_ok and calibre_ok) else "ebook-convert missing"},
    }


def read_book(book_dir: Path) -> dict[str, Any]:
    ensure_book_layout(book_dir)
    outline_path = find_outline_file(book_dir)
    title, subtitle = read_outline_title_subtitle(outline_path)
    metadata = read_metadata(book_dir)
    cover_image, back_cover_image = resolve_cover_image_references(book_dir, metadata)
    effective_metadata = {
        **metadata,
        "cover_image": cover_image,
        "back_cover_image": back_cover_image,
    }
    language = infer_book_language(book_dir, metadata, [title, subtitle, metadata.get("description", "")])
    latest_export = latest_export_dir(book_dir)
    exports = collect_exports(book_dir)
    full_generation = build_full_generation_status(book_dir, effective_metadata, lightweight=True)

    return {
        "slug": book_dir.name,
        "title": title or book_dir.name,
        "subtitle": subtitle,
        "language": language,
        "author": metadata["author"],
        "publisher": metadata["publisher"],
        "description": metadata["description"],
        "author_bio": metadata.get("author_bio", ""),
        "branding_mark": metadata.get("branding_mark", ""),
        "branding_logo_url": metadata.get("branding_logo_url", ""),
        "cover_brief": metadata.get("cover_brief", ""),
        "cover_prompt": metadata.get("cover_prompt", ""),
        "book_type": metadata.get("book_type", ""),
        "generate_cover": bool(metadata.get("generate_cover", True)),
        "cover_art_image": metadata.get("cover_art_image", ""),
        "cover_image": cover_image,
        "back_cover_image": back_cover_image,
        "cover_template": metadata.get("cover_template", ""),
        "cover_variant_count": metadata.get("cover_variant_count", 0),
        "cover_variant_target_count": clamp_cover_variant_target_count(metadata.get("cover_variant_target_count", 1), default=1),
        "cover_generation_provider": metadata.get("cover_generation_provider", ""),
        "cover_composed": bool(metadata.get("cover_composed", False)),
        "cover_variants": normalize_cover_variants(metadata.get("cover_variants")),
        "selected_cover_variant": metadata.get("selected_cover_variant", ""),
        "recommended_cover_variant": metadata.get("recommended_cover_variant", ""),
        "back_cover_variant_family": metadata.get("back_cover_variant_family", ""),
        "cover_family": metadata.get("cover_family", ""),
        "cover_branch": metadata.get("cover_branch", ""),
        "cover_genre": metadata.get("cover_genre", ""),
        "cover_subtopic": metadata.get("cover_subtopic", ""),
        "cover_palette_key": metadata.get("cover_palette_key", ""),
        "cover_layout_key": metadata.get("cover_layout_key", ""),
        "cover_motif": metadata.get("cover_motif", ""),
        "cover_lab_version": metadata.get("cover_lab_version", ""),
        "isbn": metadata.get("isbn", ""),
        "year": metadata.get("year", ""),
        "fast": bool(metadata.get("fast", False)),
        "book_length_tier": metadata.get("book_length_tier", "standard"),
        "target_word_count_min": metadata.get("target_word_count_min", 0),
        "target_word_count_max": metadata.get("target_word_count_max", 0),
        "chapter_plan": normalize_chapter_plan(metadata.get("chapter_plan")),
        "outline_file": outline_path.name if outline_path else "",
        "book_dir": relative_to_root(book_dir),
        "latest_export_dir": relative_to_root(latest_export) if latest_export else "",
        "chapters": collect_chapters(book_dir),
        "artifacts": list_files([path for path in exports if latest_export and latest_export in path.parents]),
        "resources": {
            "outline": file_entry(outline_path) if outline_path and outline_path.exists() else None,
            "assets": list_files(collect_assets(book_dir, effective_metadata)),
            "extras": list_files(collect_extra_files(book_dir)),
            "references": list_files(collect_reference_files(book_dir)),
            "research": list_files(collect_research_files(book_dir)),
            "reports": list_files(collect_reports(book_dir)),
            "exports": list_files(exports),
        },
        "build_capabilities": build_capabilities(),
        "status": {
            "chapter_count": len(list(book_dir.glob("chapter_*_final.md"))),
            "chapter_target_count": full_generation["target_count"],
            "chapter_ready_count": full_generation["ready_count"],
            "chapters_complete": full_generation["complete"],
            "asset_count": len(collect_assets(book_dir, effective_metadata)),
            "extra_count": len(collect_extra_files(book_dir)),
            "research_count": len(collect_research_files(book_dir)),
            "export_count": len(exports),
            **build_generation_status(book_dir, effective_metadata, lightweight=True),
            "full_generation": full_generation,
        },
    }


def read_book_preview_payload(book_dir: Path) -> dict[str, Any]:
    ensure_book_layout(book_dir)
    outline_path = find_outline_file(book_dir)
    title, subtitle = read_outline_title_subtitle(outline_path)
    metadata = read_metadata(book_dir)
    cover_image, back_cover_image = resolve_cover_image_references(book_dir, metadata)
    effective_metadata = {
        **metadata,
        "cover_image": cover_image,
        "back_cover_image": back_cover_image,
    }
    language = infer_book_language(book_dir, metadata, [title, subtitle, metadata.get("description", "")])
    root_index = book_root_index(book_dir)
    root_entries = set(root_index.keys())
    generation = build_generation_status(book_dir, effective_metadata, lightweight=True)
    full_generation = build_full_generation_status(book_dir, effective_metadata, lightweight=True)
    full_stage = str(full_generation.get("stage") or "").strip().lower()
    full_active = bool(full_generation.get("active"))
    full_complete = bool(full_generation.get("complete"))
    avoid_non_primary_content = (
        PREVIEW_SKIP_NONPRIMARY_DURING_FULL_GENERATION
        and not full_complete
        and (full_active or full_stage in {"queued", "running"})
    )
    chapters = collect_chapters_preview(
        book_dir,
        effective_metadata,
        avoid_non_primary_content=avoid_non_primary_content,
    )
    chapter_count = summary_chapter_count(book_dir, root_entries=root_entries)

    return {
        "slug": book_dir.name,
        "title": title or book_dir.name,
        "subtitle": subtitle,
        "language": language,
        "author": metadata["author"],
        "publisher": metadata["publisher"],
        "description": metadata["description"],
        "author_bio": metadata.get("author_bio", ""),
        "branding_mark": metadata.get("branding_mark", ""),
        "branding_logo_url": metadata.get("branding_logo_url", ""),
        "cover_brief": metadata.get("cover_brief", ""),
        "cover_prompt": metadata.get("cover_prompt", ""),
        "cover_image": cover_image,
        "back_cover_image": back_cover_image,
        "cover_variants": normalize_cover_variants(metadata.get("cover_variants")),
        "selected_cover_variant": metadata.get("selected_cover_variant", ""),
        "recommended_cover_variant": metadata.get("recommended_cover_variant", ""),
        "cover_variant_target_count": clamp_cover_variant_target_count(
            metadata.get("cover_variant_target_count", 1),
            default=1,
        ),
        "status": {
            "chapter_count": chapter_count,
            "chapter_target_count": full_generation["target_count"],
            "chapter_ready_count": full_generation["ready_count"],
            "chapters_complete": full_generation["complete"],
            "asset_count": summary_asset_count(book_dir, effective_metadata),
            "extra_count": summary_extra_count(book_dir, root_entries=root_entries),
            "research_count": summary_research_count(book_dir),
            "export_count": summary_export_count(book_dir, root_index=root_index),
            **generation,
            "full_generation": full_generation,
        },
        "chapters": chapters,
    }


def read_book_summary(
    book_dir: Path,
    *,
    default_author: str | None = None,
    default_publisher: str | None = None,
) -> dict[str, Any] | None:
    root_index = book_root_index(book_dir)
    root_entries = set(root_index.keys())
    chapter_count = summary_chapter_count(book_dir, root_entries=root_entries)
    outline_path = find_outline_file_from_entries(book_dir, root_entries)
    if not outline_path and chapter_count == 0:
        return None

    title, subtitle = read_outline_title_subtitle(outline_path)
    metadata = read_metadata(
        book_dir,
        default_author=default_author,
        default_publisher=default_publisher,
    )
    cover_image, back_cover_image = resolve_cover_image_references(book_dir, metadata)
    effective_metadata = {
        **metadata,
        "cover_image": cover_image,
        "back_cover_image": back_cover_image,
    }
    asset_count = summary_asset_count(book_dir, effective_metadata)
    extra_count = summary_extra_count(book_dir, root_entries=root_entries)
    research_count = summary_research_count(book_dir)
    export_count = summary_export_count(book_dir, root_index=root_index)
    generation = build_generation_status(book_dir, effective_metadata, lightweight=True)

    return {
        "slug": book_dir.name,
        "title": title or book_dir.name,
        "subtitle": subtitle,
        "author": metadata["author"],
        "publisher": metadata["publisher"],
        "branding_mark": metadata.get("branding_mark", ""),
        "branding_logo_url": metadata.get("branding_logo_url", ""),
        "cover_brief": metadata.get("cover_brief", ""),
        "cover_art_image": metadata.get("cover_art_image", ""),
        "cover_image": cover_image,
        "back_cover_image": back_cover_image,
        "cover_template": metadata.get("cover_template", ""),
        "cover_variant_count": metadata.get("cover_variant_count", 0),
        "cover_variant_target_count": clamp_cover_variant_target_count(metadata.get("cover_variant_target_count", 1), default=1),
        "cover_generation_provider": metadata.get("cover_generation_provider", ""),
        "cover_composed": bool(metadata.get("cover_composed", False)),
        "selected_cover_variant": metadata.get("selected_cover_variant", ""),
        "recommended_cover_variant": metadata.get("recommended_cover_variant", ""),
        "cover_family": metadata.get("cover_family", ""),
        "cover_branch": metadata.get("cover_branch", ""),
        "cover_genre": metadata.get("cover_genre", ""),
        "chapter_count": chapter_count,
        "artifacts": [],
        "status": {
            "chapter_count": chapter_count,
            "asset_count": asset_count,
            "extra_count": extra_count,
            "research_count": research_count,
            "export_count": export_count,
            **generation,
        },
    }


def list_books() -> list[dict[str, Any]]:
    BOOK_OUTPUTS_DIR.mkdir(exist_ok=True)
    settings = read_settings()
    default_author = str(settings.get("default_author") or DEFAULT_SETTINGS["default_author"])
    default_publisher = str(settings.get("default_publisher") or DEFAULT_SETTINGS["default_publisher"])
    books = []
    try:
        with os.scandir(BOOK_OUTPUTS_DIR) as iterator:
            dir_names = sorted(entry.name for entry in iterator if entry.is_dir(follow_symlinks=False))
    except OSError:
        dir_names = []

    for dir_name in dir_names:
        summary = read_book_summary(
            BOOK_OUTPUTS_DIR / dir_name,
            default_author=default_author,
            default_publisher=default_publisher,
        )
        if summary is not None:
            books.append(summary)
    return books


def invalidate_books_cache() -> None:
    with BOOK_SUMMARY_CACHE_LOCK:
        BOOK_SUMMARY_CACHE["books"] = None
        BOOK_SUMMARY_CACHE["expires_at"] = 0.0


def list_books_cached(force: bool = False) -> list[dict[str, Any]]:
    """Get list of books with LRU caching."""
    # Try to get from cache first
    cached_books = BOOK_SUMMARY_CACHE.get("books")
    if cached_books is not None and not force:
        return cached_books

    # Acquire refresh lock to prevent cache stamping
    acquired_refresh_lock = BOOK_SUMMARY_REFRESH_LOCK.acquire(blocking=False)
    if not acquired_refresh_lock:
        # Another thread is refreshing, return stale data if available
        if cached_books is not None and not force:
            return cached_books
        # Wait for refresh and retry
        with BOOK_SUMMARY_REFRESH_LOCK:
            cached_books = BOOK_SUMMARY_CACHE.get("books")
            if cached_books is not None and not force:
                return cached_books
        acquired_refresh_lock = True
        BOOK_SUMMARY_REFRESH_LOCK.acquire()

    try:
        # Double-check after acquiring lock
        cached_books = BOOK_SUMMARY_CACHE.get("books")
        if cached_books is not None and not force:
            return cached_books

        # Refresh cache
        try:
            fresh = list_books()
        except Exception:
            if cached_books is not None:
                append_log("list_books refresh failed; serving stale cache")
                return cached_books
            raise

        # Store in cache with TTL
        BOOK_SUMMARY_CACHE.put("books", fresh, ttl_seconds=float(BOOK_SUMMARY_CACHE_TTL_SECONDS))
        return fresh
    finally:
        if acquired_refresh_lock:
            BOOK_SUMMARY_REFRESH_LOCK.release()


def invalidate_books_cache() -> None:
    """Invalidate the books cache."""
    BOOK_SUMMARY_CACHE.invalidate("books")


def write_outline(
    book_dir: Path,
    title: str,
    subtitle: str,
    chapters: list[dict[str, Any]],
    language: str = "English",
) -> Path:
    ensure_book_layout(book_dir)
    slug = slugify(title or book_dir.name)
    for old_outline in book_dir.glob("book_outline_final_*.md"):
        old_outline.unlink()
    outline_path = book_dir / f"book_outline_final_{slug}.md"
    summary_label = "Özet" if language == "Turkish" else "Summary"
    target_label = "Hedef uzunluk" if language == "Turkish" else "Target length"
    chapter_blocks: list[str] = []
    for index, chapter in enumerate(chapters, start=1):
        chapter_title = normalize_structural_heading(str(chapter.get("title") or ""), language, index)
        chapter_summary = str(chapter.get("summary") or chapter.get("content") or "").strip()
        target_min = int(chapter.get("target_min_words") or 0)
        target_max = int(chapter.get("target_max_words") or 0)
        lines = [f"### {chapter_heading_prefix(language, index)}: {chapter_title}"]
        if chapter_summary:
          lines.append(f"- {summary_label}: {chapter_summary}")
        if target_min > 0 and target_max > 0:
          word_unit = "kelime" if language == "Turkish" else "words"
          lines.append(f"- {target_label}: {target_min}-{target_max} {word_unit}")
        chapter_blocks.append("\n".join(lines))
    outline_content = "\n".join([f"# {title}", f"## {subtitle}" if subtitle else "##", "", *chapter_blocks, ""])
    outline_path.write_text(outline_content, encoding="utf-8")
    return outline_path


def save_book(payload: dict[str, Any]) -> dict[str, Any]:
    title = str(payload.get("title", "")).strip()
    if not title:
        raise ValueError("Title is required.")

    settings = read_settings()
    slug = slugify(str(payload.get("slug") or title).strip())
    subtitle = str(payload.get("subtitle", "")).strip()
    description = str(payload.get("description", "")).strip()
    author = str(payload.get("author") or settings["default_author"]).strip()
    publisher = str(payload.get("publisher") or settings["default_publisher"]).strip()
    author_bio = str(payload.get("author_bio", "")).strip()
    branding_mark = str(payload.get("branding_mark", "")).strip()
    branding_logo_url = str(payload.get("branding_logo_url", "")).strip()
    cover_brief = str(payload.get("cover_brief", "")).strip()
    cover_prompt = str(payload.get("cover_prompt", "")).strip()
    book_type = str(payload.get("book_type") or payload.get("bookType") or "").strip()
    language = normalize_book_language(payload.get("language")) or detect_book_language(title, subtitle, description) or "English"
    default_title = "Başlangıç" if language == "Turkish" else "Getting Started"
    chapters = payload.get("chapters") or [{"title": default_title, "content": ""}]
    generate_cover = bool(payload.get("generate_cover", True))
    cover_art_image = str(payload.get("cover_art_image", "")).strip()
    cover_image = str(payload.get("cover_image", "")).strip()
    back_cover_image = str(payload.get("back_cover_image", "")).strip()
    cover_template = str(payload.get("cover_template", "")).strip()
    cover_variant_count = int(payload.get("cover_variant_count", 0) or 0)
    cover_variant_target_count = clamp_cover_variant_target_count(payload.get("cover_variant_target_count", 1), default=1)
    cover_generation_provider = str(payload.get("cover_generation_provider", "")).strip()
    cover_composed = bool(payload.get("cover_composed", False))
    cover_variants = normalize_cover_variants(payload.get("cover_variants"))
    selected_cover_variant = str(payload.get("selected_cover_variant", "")).strip()
    recommended_cover_variant = str(payload.get("recommended_cover_variant", "")).strip()
    back_cover_variant_family = str(payload.get("back_cover_variant_family", "")).strip()
    cover_family = str(payload.get("cover_family", "")).strip()
    cover_branch = str(payload.get("cover_branch", "")).strip()
    cover_genre = str(payload.get("cover_genre", "")).strip()
    cover_subtopic = str(payload.get("cover_subtopic", "")).strip()
    cover_palette_key = str(payload.get("cover_palette_key", "")).strip()
    cover_layout_key = str(payload.get("cover_layout_key", "")).strip()
    cover_motif = str(payload.get("cover_motif", "")).strip()
    cover_lab_version = str(payload.get("cover_lab_version", "")).strip()
    isbn = str(payload.get("isbn", "")).strip()
    year = str(payload.get("year", "")).strip()
    fast = bool(payload.get("fast", False))
    book_length_tier = str(payload.get("book_length_tier") or "standard").strip() or "standard"
    target_word_count_min = int(payload.get("target_word_count_min") or 0)
    target_word_count_max = int(payload.get("target_word_count_max") or 0)
    chapter_plan = normalize_chapter_plan(payload.get("chapter_plan"))

    book_dir = BOOK_OUTPUTS_DIR / slug
    ensure_book_layout(book_dir)
    write_outline(book_dir, title, subtitle, chapters, language)

    kept = set()
    for index, chapter in enumerate(chapters, start=1):
        chapter_title = normalize_structural_heading(str(chapter.get("title") or ""), language, index)
        chapter_content = str(chapter.get("content") or "").strip()
        chapter_path = book_dir / f"chapter_{index}_final.md"
        chapter_path.write_text(
            f"# {chapter_heading_prefix(language, index)}: {chapter_title}\n\n{chapter_content}\n",
            encoding="utf-8",
        )
        kept.add(chapter_path.name)

    for old_chapter in book_dir.glob("chapter_*_final.md"):
        if old_chapter.name not in kept:
            old_chapter.unlink()

    saved_meta = save_metadata(
        book_dir,
        {
            "author": author,
            "publisher": publisher,
            "description": description,
            "author_bio": author_bio,
            "branding_mark": branding_mark,
            "branding_logo_url": branding_logo_url,
            "cover_brief": cover_brief,
            "cover_prompt": cover_prompt,
            "book_type": book_type,
            "language": language,
            "generate_cover": generate_cover,
            "cover_art_image": cover_art_image,
            "cover_image": cover_image,
            "back_cover_image": back_cover_image,
            "cover_template": cover_template,
            "cover_variant_count": cover_variant_count,
            "cover_variant_target_count": cover_variant_target_count,
            "cover_generation_provider": cover_generation_provider,
            "cover_composed": cover_composed,
            "cover_variants": cover_variants,
            "selected_cover_variant": selected_cover_variant,
            "recommended_cover_variant": recommended_cover_variant,
            "back_cover_variant_family": back_cover_variant_family,
            "cover_family": cover_family,
            "cover_branch": cover_branch,
            "cover_genre": cover_genre,
            "cover_subtopic": cover_subtopic,
            "cover_palette_key": cover_palette_key,
            "cover_layout_key": cover_layout_key,
            "cover_motif": cover_motif,
            "cover_lab_version": cover_lab_version,
            "isbn": isbn,
            "year": year,
            "fast": fast,
            "book_length_tier": book_length_tier,
            "target_word_count_min": target_word_count_min,
            "target_word_count_max": target_word_count_max,
            "chapter_plan": chapter_plan,
            "full_generation_stage": "idle",
            "full_generation_message": "",
            "full_generation_error": "",
            "full_generation_progress": 0,
            "full_generation_target_count": 0,
            "full_generation_ready_count": 0,
            "full_generation_failed_count": 0,
            "full_generation_eta_seconds": 0,
            "full_generation_avg_chapter_seconds": 0,
            "full_generation_initial_ready_count": 0,
            "full_generation_eta_updated_at": "",
            "full_generation_started_at": "",
            "full_generation_updated_at": "",
            "full_generation_completed_at": "",
        },
    )
    saved_meta = sync_selected_cover_assets(book_dir, saved_meta)
    sync_full_generation_metadata(book_dir)
    append_log(f"Saved book '{slug}'.")
    return read_book(book_dir)


def create_sample_book() -> dict[str, Any]:
    sample_dir = BOOK_OUTPUTS_DIR / "ornek-kitap"
    BOOK_OUTPUTS_DIR.mkdir(exist_ok=True)
    subprocess.run(
        bash_command(ROOT_DIR / "create_sample_book.sh", sample_dir),
        cwd=ROOT_DIR,
        check=True,
        text=True,
        capture_output=True,
        encoding="utf-8",
        errors="replace",
        env=command_env(),
    )
    ensure_book_layout(sample_dir)
    metadata_path = sample_dir / METADATA_FILE_NAME
    if not metadata_path.exists():
        save_metadata(
            sample_dir,
            {
                "author": read_settings()["default_author"],
                "publisher": read_settings()["default_publisher"],
                "description": "Ornek kitap dashboard denemesi.",
                "language": "Turkish",
            },
        )
    append_log("Created sample book.")
    return read_book(sample_dir)


def file_snapshot(book_dir: Path) -> set[str]:
    return {
        path.relative_to(book_dir).as_posix()
        for path in book_dir.rglob("*")
        if path.is_file()
    }


def cover_artifact_mtimes(book_dir: Path) -> dict[str, int]:
    assets_dir = book_dir / "assets"
    if not assets_dir.exists():
        return {}
    patterns = (
        "front_cover_*",
        "back_cover_*",
        "cover_art_*",
        "showcase_front_cover*",
        "showcase_back_cover*",
        "ai_front_cover*",
        "generated_front_cover*",
        "generated_back_cover*",
    )
    snapshot: dict[str, int] = {}
    for pattern in patterns:
        for path in assets_dir.glob(pattern):
            if not path.is_file():
                continue
            try:
                snapshot[path.name] = path.stat().st_mtime_ns
            except OSError:
                continue
    return snapshot


def produced_files(book_dir: Path, before: set[str]) -> list[dict[str, Any]]:
    after = file_snapshot(book_dir)
    created = sorted(after - before)
    return [file_entry(book_dir / relative) for relative in created if (book_dir / relative).is_file()]


def _process_output_as_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return str(value)


def run_process(
    command: list[str],
    *,
    cwd: Path,
    env: dict[str, str] | None = None,
    timeout_seconds: int | None = None,
    max_retries: int = 0,
    initial_backoff_ms: int = 700,
) -> subprocess.CompletedProcess[str]:
    """
    Run a subprocess with optional retry and exponential backoff.

    Args:
        command: Command to execute
        cwd: Working directory
        env: Environment variables
        timeout_seconds: Timeout for each attempt
        max_retries: Maximum number of retry attempts (0 = no retry)
        initial_backoff_ms: Initial backoff in milliseconds

    Returns:
        CompletedProcess result
    """
    append_log(f"RUN cwd={cwd} cmd={' '.join(shlex.quote(part) for part in command)}")

    if max_retries <= 0:
        return _run_process_once(command, cwd, env, timeout_seconds)

    # Retry with exponential backoff
    last_error: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            result = _run_process_once(command, cwd, env, timeout_seconds)
            if result.returncode == 0:
                if attempt > 0:
                    append_log(f"Command succeeded on attempt {attempt + 1}/{max_retries + 1}")
                return result
            # Non-zero return code, don't retry
            return result
        except (subprocess.TimeoutExpired, OSError) as exc:
            last_error = exc
            if attempt < max_retries:
                # Exponential backoff with jitter
                backoff_ms = initial_backoff_ms * (2 ** attempt)
                jitter_ms = int(backoff_ms * 0.1)  # 10% jitter
                total_backoff = backoff_ms + (hash(id(exc)) % (2 * jitter_ops + 1)) - jitter_ops
                append_log(f"Attempt {attempt + 1}/{max_retries + 1} failed, retrying in {total_backoff}ms: {exc}")
                time.sleep(total_backoff / 1000.0)
            else:
                append_log(f"All {max_retries + 1} attempts failed")

    # All retries exhausted
    if isinstance(last_error, subprocess.TimeoutExpired):
        stdout = _process_output_as_text(last_error.stdout)
        stderr = _process_output_as_text(last_error.stderr)
        timeout_message = (
            f"Command timed out after {int(timeout_seconds or 0)} seconds (all {max_retries + 1} attempts)."
            if timeout_seconds
            else f"Command timed out (all {max_retries + 1} attempts)."
        )
        combined_stderr = f"{stderr}\n{timeout_message}".strip()
        append_log("EXIT 124 (timeout after retries)")
        return subprocess.CompletedProcess(
            command,
            124,
            stdout=stdout,
            stderr=combined_stderr,
        )
    elif isinstance(last_error, OSError):
        append_log(f"EXIT 127 (oserror after retries: {last_error})")
        return subprocess.CompletedProcess(
            command,
            127,
            stdout="",
            stderr=str(last_error),
        )
    else:
        # Should not reach here
        return subprocess.CompletedProcess(command, 1, stdout="", stderr="All retry attempts failed")


def _run_process_once(
    command: list[str],
    cwd: Path,
    env: dict[str, str] | None,
    timeout_seconds: int | None,
) -> subprocess.CompletedProcess[str]:
    """Single attempt at running a subprocess."""
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            text=True,
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            env=env,
            timeout=timeout_seconds,
        )
        append_log(f"EXIT {result.returncode}")
        return result
    except OSError as exc:
        append_log(f"EXIT 127 (oserror: {exc})")
        raise
    except subprocess.TimeoutExpired as exc:
        raise


def run_process(
    command: list[str],
    *,
    cwd: Path,
    env: dict[str, str] | None = None,
    timeout_seconds: int | None = None,
) -> subprocess.CompletedProcess[str]:
    """Legacy wrapper for backward compatibility. Use run_process_with_retry instead."""
    return _run_process_once(command, cwd, env, timeout_seconds)


# Jitter calculation for retry backoff
jitter_ops = 50


def has_any_ai_provider(settings: dict[str, Any] | None = None) -> bool:
    settings = settings or read_settings()
    env = command_env(settings=settings)
    return bool(resolve_shared_ai_key(settings, env))


def fallback_export_dir(book_dir: Path) -> Path:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    candidate = book_dir / f"exports_{stamp}"
    suffix = 1
    while candidate.exists():
        candidate = book_dir / f"exports_{stamp}_{suffix:02d}"
        suffix += 1
    candidate.mkdir(parents=True, exist_ok=True)
    return candidate


def fallback_split_paragraphs(text: str) -> list[str]:
    blocks = [block.strip() for block in re.split(r"\n\s*\n", str(text or "").strip()) if block.strip()]
    if blocks:
        return blocks
    single = str(text or "").strip()
    return [single] if single else []


FALLBACK_PENDING_TEXT = "Content pending. Generate at least one chapter for full export quality."


def fallback_outline_headings(path: Path, language: str) -> list[str]:
    if not path.exists():
        return []

    headings: list[str] = []
    chapter_prefix_pattern = re.compile(
        rf"^(?:{chapter_heading_pattern()})\s+\d+\b\s*[:.\-]?\s*(.+)$",
        flags=re.IGNORECASE,
    )
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return []

    for line in lines:
        stripped = line.strip()
        if not stripped.startswith("###"):
            continue
        heading = stripped.lstrip("#").strip()
        matched = chapter_prefix_pattern.match(heading)
        if matched:
            heading = matched.group(1).strip()
        heading = strip_chapter_heading(heading)
        heading = normalize_structural_heading(heading, language, len(headings) + 1)
        if heading:
            headings.append(heading)

    deduped: list[str] = []
    seen: set[str] = set()
    for heading in headings:
        key = heading.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(heading)
    return deduped


def fallback_outline_excerpt(path: Path, max_chars: int = 4000) -> str:
    if not path.exists():
        return ""
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return ""

    parts: list[str] = []
    used = 0
    for raw_line in lines:
        stripped = raw_line.strip()
        if not stripped:
            continue
        cleaned = stripped.lstrip("#").strip() if stripped.startswith("#") else stripped
        if not cleaned:
            continue
        remaining = max_chars - used
        if remaining <= 0:
            break
        chunk = cleaned[:remaining]
        parts.append(chunk)
        used += len(chunk) + 1
    return "\n".join(parts).strip()


def synthesize_fallback_chapters(
    *,
    book_dir: Path,
    metadata: dict[str, Any],
    language: str,
    description: str,
) -> tuple[list[dict[str, Any]], list[str]]:
    notes: list[str] = []
    chapters: list[dict[str, Any]] = []

    chapter_plan = sorted(
        normalize_chapter_plan(metadata.get("chapter_plan")),
        key=lambda item: int(item.get("number") or 0),
    )
    for index, item in enumerate(chapter_plan, start=1):
        chapter_number_value = int(item.get("number") or index)
        chapter_title = normalize_structural_heading(str(item.get("title") or "").strip(), language, chapter_number_value)
        chapter_summary = str(item.get("summary") or "").strip()
        chapters.append(
            {
                "number": chapter_number_value,
                "title": chapter_title,
                "content": chapter_summary or FALLBACK_PENDING_TEXT,
            }
        )
    if chapters:
        notes.append("No chapter files found; lightweight export used chapter plan summaries.")
        return chapters, notes

    outline_path = find_outline_file(book_dir)
    if outline_path and outline_path.exists():
        outline_headings = fallback_outline_headings(outline_path, language)
        if outline_headings:
            chapters = [
                {"number": index, "title": heading, "content": FALLBACK_PENDING_TEXT}
                for index, heading in enumerate(outline_headings, start=1)
            ]
            notes.append("No chapter files found; lightweight export used outline headings with placeholder chapter text.")
            return chapters, notes
        outline_excerpt = fallback_outline_excerpt(outline_path)
        if outline_excerpt:
            chapters = [
                {
                    "number": 1,
                    "title": normalize_structural_heading("", language, 1),
                    "content": outline_excerpt,
                }
            ]
            notes.append("No chapter files found; lightweight export used outline text excerpt.")
            return chapters, notes

    description = str(description or "").strip()
    if description:
        chapters = [
            {
                "number": 1,
                "title": normalize_structural_heading("", language, 1),
                "content": description,
            }
        ]
        notes.append("No chapter files found; lightweight export used book description.")
        return chapters, notes

    chapters = [
        {
            "number": 1,
            "title": normalize_structural_heading("", language, 1),
            "content": FALLBACK_PENDING_TEXT,
        }
    ]
    notes.append("No chapter files found; lightweight export generated a placeholder chapter.")
    return chapters, notes


def fallback_book_markdown(
    *,
    title: str,
    subtitle: str,
    author: str,
    publisher: str,
    language: str,
    description: str,
    chapters: list[dict[str, Any]],
) -> str:
    lines: list[str] = [f"# {title}"]
    if subtitle:
        lines.extend(["", f"## {subtitle}"])
    lines.extend(
        [
            "",
            f"- Author: {author or 'Book Creator'}",
            f"- Publisher: {publisher or 'Book Generator'}",
            f"- Language: {language or 'English'}",
        ]
    )
    if description:
        lines.extend(["", description.strip()])
    for index, chapter in enumerate(chapters, start=1):
        chapter_number = int(chapter.get("number") or index)
        chapter_title = str(chapter.get("title") or "").strip() or f"Chapter {chapter_number}"
        chapter_content = str(chapter.get("content") or "").strip()
        lines.extend(
            [
                "",
                f"## {chapter_heading_prefix(language, chapter_number)}: {chapter_title}",
                "",
                chapter_content or "Content pending.",
            ]
        )
    lines.append("")
    return "\n".join(lines)


def fallback_xhtml_page(title: str, body_html: str, direction: str) -> str:
    return f"""<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" dir="{direction}">
  <head>
    <title>{html.escape(title)}</title>
    <link rel="stylesheet" type="text/css" href="styles.css" />
  </head>
  <body>
    {body_html}
  </body>
</html>
"""


def fallback_epub_language_code(language: str) -> str:
    normalized = normalize_book_language(language)
    mapping = {
        "Turkish": "tr",
        "English": "en",
        "German": "de",
        "French": "fr",
        "Spanish": "es",
        "Italian": "it",
        "Portuguese": "pt",
        "Dutch": "nl",
        "Arabic": "ar",
        "Japanese": "ja",
    }
    return mapping.get(normalized, "en")


def write_lightweight_epub(
    *,
    output_path: Path,
    slug: str,
    title: str,
    subtitle: str,
    author: str,
    publisher: str,
    language: str,
    description: str,
    chapters: list[dict[str, Any]],
    cover_path: Path | None = None,
    back_cover_path: Path | None = None,
) -> None:
    direction = "rtl" if fallback_epub_language_code(language) in {"ar", "fa", "he", "ur"} else "ltr"
    with zipfile.ZipFile(output_path, "w") as archive:
        archive.writestr("mimetype", "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        archive.writestr(
            "META-INF/container.xml",
            """<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
""",
        )
        archive.writestr(
            "OEBPS/styles.css",
            """
body { font-family: Georgia, 'Times New Roman', serif; margin: 5%; line-height: 1.6; }
h1, h2 { line-height: 1.25; }
.meta { color: #6f6156; font-family: Arial, sans-serif; font-size: 0.85rem; }
.chapter-ref { text-transform: uppercase; letter-spacing: 0.12em; font-family: Arial, sans-serif; color: #725441; font-size: 0.72rem; }
.cover img { width: 100%; max-width: 520px; display: block; margin: 0 auto 1.25rem; }
.back-cover { page-break-before: always; }
.back-cover img { width: 100%; max-width: 520px; display: block; margin: 0 auto; }
""".strip(),
        )

        chapter_links: list[str] = []
        manifest_items = [
            "<item id='nav' href='nav.xhtml' media-type='application/xhtml+xml' properties='nav'/>",
            "<item id='title-page' href='title.xhtml' media-type='application/xhtml+xml'/>",
            "<item id='styles' href='styles.css' media-type='text/css'/>",
        ]
        spine_items = ["<itemref idref='title-page'/>"]

        cover_file_name = ""
        back_cover_file_name = ""
        if cover_path and cover_path.exists() and cover_path.is_file():
            cover_file_name = f"cover{cover_path.suffix.lower() or '.png'}"
            cover_media_type = mimetypes.guess_type(cover_file_name)[0] or "image/png"
            archive.writestr(f"OEBPS/{cover_file_name}", cover_path.read_bytes())
            manifest_items.append(
                f"<item id='cover-image' href='{cover_file_name}' media-type='{cover_media_type}' properties='cover-image'/>"
            )
        if back_cover_path and back_cover_path.exists() and back_cover_path.is_file():
            back_cover_file_name = f"back-cover{back_cover_path.suffix.lower() or '.png'}"
            back_cover_media_type = mimetypes.guess_type(back_cover_file_name)[0] or "image/png"
            archive.writestr(f"OEBPS/{back_cover_file_name}", back_cover_path.read_bytes())
            manifest_items.append(
                f"<item id='back-cover-image' href='{back_cover_file_name}' media-type='{back_cover_media_type}'/>"
            )

        for index, chapter in enumerate(chapters, start=1):
            chapter_number = int(chapter.get("number") or index)
            chapter_title = str(chapter.get("title") or "").strip() or f"Chapter {chapter_number}"
            chapter_file = f"chapter-{chapter_number:03d}.xhtml"
            paragraphs = fallback_split_paragraphs(str(chapter.get("content") or ""))
            body_html = "".join(
                f"<p>{html.escape(paragraph).replace(chr(10), '<br/>')}</p>"
                for paragraph in (paragraphs or ["Content pending."])
            )
            archive.writestr(
                f"OEBPS/{chapter_file}",
                fallback_xhtml_page(
                    chapter_title,
                    f"""
                    <section>
                      <div class="chapter-ref">{html.escape(chapter_heading_prefix(language, chapter_number))}</div>
                      <h2>{html.escape(chapter_title)}</h2>
                      {body_html}
                    </section>
                    """,
                    direction,
                ),
            )
            manifest_items.append(
                f"<item id='chapter-{chapter_number:03d}' href='{chapter_file}' media-type='application/xhtml+xml'/>"
            )
            spine_items.append(f"<itemref idref='chapter-{chapter_number:03d}'/>")
            chapter_links.append(
                f"<li><a href='{chapter_file}'>{html.escape(chapter_heading_prefix(language, chapter_number))} · {html.escape(chapter_title)}</a></li>"
            )

        archive.writestr(
            "OEBPS/nav.xhtml",
            fallback_xhtml_page(
                title,
                "<nav epub:type='toc' id='toc'><h1>Contents</h1><ol>" + "".join(chapter_links) + "</ol></nav>",
                direction,
            ),
        )
        cover_markup = (
            f"<img src='{html.escape(cover_file_name)}' alt='{html.escape(title)}' />"
            if cover_file_name
            else ""
        )
        archive.writestr(
            "OEBPS/title.xhtml",
            fallback_xhtml_page(
                title,
                f"""
                <section class="cover">
                  {cover_markup}
                  <h1>{html.escape(title)}</h1>
                  <p>{html.escape(subtitle)}</p>
                  <p class="meta"><strong>{html.escape(author or 'Book Creator')}</strong> · {html.escape(publisher or 'Book Generator')}</p>
                  <p>{html.escape(description)}</p>
                </section>
                """,
                direction,
            ),
        )
        if back_cover_file_name:
            archive.writestr(
                "OEBPS/back-cover.xhtml",
                fallback_xhtml_page(
                    f"{title} Back Cover",
                    f"""
                    <section class="back-cover">
                      <img src='{html.escape(back_cover_file_name)}' alt='{html.escape(title)} back cover' />
                    </section>
                    """,
                    direction,
                ),
            )
            manifest_items.append(
                "<item id='back-cover-page' href='back-cover.xhtml' media-type='application/xhtml+xml'/>"
            )
            spine_items.append("<itemref idref='back-cover-page'/>")
        archive.writestr(
            "OEBPS/content.opf",
            f"""<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">{html.escape(slug)}</dc:identifier>
    <dc:title>{html.escape(title)}</dc:title>
    <dc:language>{html.escape(fallback_epub_language_code(language))}</dc:language>
    <dc:creator>{html.escape(author or 'Book Creator')}</dc:creator>
    <dc:publisher>{html.escape(publisher or 'Book Generator')}</dc:publisher>
    <dc:description>{html.escape(description)}</dc:description>
  </metadata>
  <manifest>
    {"".join(manifest_items)}
  </manifest>
  <spine>
    {"".join(spine_items)}
  </spine>
</package>
""",
        )


def fallback_pdf_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def fallback_pdf_text(value: str) -> str:
    return str(value or "").encode("latin-1", errors="replace").decode("latin-1", errors="replace")


def write_lightweight_pdf(output_path: Path, lines: list[str]) -> None:
    objects: list[bytes] = []

    def add_object(payload: str | bytes) -> int:
        if isinstance(payload, str):
            payload = payload.encode("latin-1", errors="replace")
        objects.append(payload)
        return len(objects)

    font_id = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    pages_id = add_object("<< /Type /Pages /Kids [] /Count 0 >>")
    page_ids: list[int] = []
    page_chunks = [lines[index : index + 42] for index in range(0, len(lines), 42)] or [[""]]

    for chunk in page_chunks:
        content_stream = ["BT", "/F1 11 Tf", "60 780 Td", "14 TL"]
        for index, line in enumerate(chunk):
            safe_line = fallback_pdf_escape(fallback_pdf_text(line))
            if index == 0:
                content_stream.append(f"({safe_line}) Tj")
            else:
                content_stream.append(f"T* ({safe_line}) Tj")
        content_stream.append("ET")
        stream = "\n".join(content_stream).encode("latin-1", errors="replace")
        content_id = add_object(
            f"<< /Length {len(stream)} >>\nstream\n".encode("latin-1") + stream + b"\nendstream"
        )
        page_id = add_object(
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {content_id} 0 R >>"
        )
        page_ids.append(page_id)

    kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
    objects[pages_id - 1] = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>".encode("latin-1")
    catalog_id = add_object(f"<< /Type /Catalog /Pages {pages_id} 0 R >>")

    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for index, payload in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("latin-1"))
        pdf.extend(payload)
        pdf.extend(b"\nendobj\n")
    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))
    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode(
            "latin-1"
        )
    )
    output_path.write_bytes(pdf)


def build_book_with_lightweight_fallback(
    *,
    book_dir: Path,
    slug: str,
    format_name: str,
    preflight: dict[str, Any],
    before_snapshot: set[str],
) -> dict[str, Any] | None:
    if format_name not in LIGHTWEIGHT_BUILD_FORMATS:
        return None

    book = read_book(book_dir)
    chapters = list(book.get("chapters") or [])
    metadata = read_metadata(book_dir)
    title = str(book.get("title") or slug).strip() or slug
    subtitle = str(book.get("subtitle") or "").strip()
    author = str(book.get("author") or metadata.get("author") or "Book Creator").strip()
    publisher = str(book.get("publisher") or metadata.get("publisher") or "Book Generator").strip()
    language = str(book.get("language") or metadata.get("language") or "English").strip() or "English"
    description = str(book.get("description") or metadata.get("description") or "").strip()
    fallback_notes: list[str] = []
    if not chapters:
        chapters, fallback_notes = synthesize_fallback_chapters(
            book_dir=book_dir,
            metadata=metadata,
            language=language,
            description=description,
        )
    export_dir = fallback_export_dir(book_dir)
    base_name = f"manuscript_final_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
    manuscript_path = export_dir / f"{base_name}.md"

    manuscript = fallback_book_markdown(
        title=title,
        subtitle=subtitle,
        author=author,
        publisher=publisher,
        language=language,
        description=description,
        chapters=chapters,
    )
    manuscript_path.write_text(manuscript, encoding="utf-8")

    cover_reference, back_cover_reference = resolve_cover_image_references(book_dir, metadata)
    cover_path = resolve_book_asset_path(book_dir, cover_reference) if cover_reference else None
    back_cover_path = resolve_book_asset_path(book_dir, back_cover_reference) if back_cover_reference else None
    exported_formats: list[str] = []
    if format_name in {"all", "epub"}:
        write_lightweight_epub(
            output_path=export_dir / f"{base_name}.epub",
            slug=slug,
            title=title,
            subtitle=subtitle,
            author=author,
            publisher=publisher,
            language=language,
            description=description,
            chapters=chapters,
            cover_path=cover_path,
            back_cover_path=back_cover_path,
        )
        exported_formats.append("epub")
    if format_name in {"all", "pdf"}:
        pdf_lines = [
            title,
            subtitle,
            "",
            f"Author: {author}",
            f"Publisher: {publisher}",
            f"Language: {language}",
            "",
            description,
            "",
        ]
        if cover_path and cover_path.exists():
            pdf_lines.extend(["Front cover: " + cover_path.name, ""])
        for index, chapter in enumerate(chapters, start=1):
            chapter_number = int(chapter.get("number") or index)
            chapter_title = str(chapter.get("title") or "").strip() or f"Chapter {chapter_number}"
            pdf_lines.extend(
                [
                    "",
                    f"{chapter_heading_prefix(language, chapter_number)}: {chapter_title}",
                    "-" * 72,
                ]
            )
            chapter_body = str(chapter.get("content") or "").strip()
            if not chapter_body:
                pdf_lines.append("Content pending.")
                continue
            for raw_line in chapter_body.splitlines():
                text = raw_line.strip()
                if not text:
                    pdf_lines.append("")
                    continue
                pdf_lines.extend(textwrap.wrap(text, width=95) or [""])
        if back_cover_path and back_cover_path.exists():
            pdf_lines.extend(["", "Back cover: " + back_cover_path.name])
        write_lightweight_pdf(export_dir / f"{base_name}.pdf", pdf_lines)
        exported_formats.append("pdf")

    warning_reason = str(preflight.get("reason") or "").strip()
    warnings = list(preflight.get("warnings") or [])
    warnings.extend(fallback_notes)
    fallback_warning = (
        "Primary export tools unavailable; generated lightweight fallback export."
    )
    warnings.append(fallback_warning)
    if warning_reason:
        warnings.append(warning_reason)
    deduped_warnings: list[str] = []
    seen_warnings: set[str] = set()
    for warning in warnings:
        text = str(warning or "").strip()
        if not text or text in seen_warnings:
            continue
        seen_warnings.add(text)
        deduped_warnings.append(text)
    warnings = deduped_warnings
    parity = build_export_parity_report(book_dir, metadata, "pdf" if format_name == "all" else format_name)

    return {
        "ok": True,
        "action": "build",
        "returncode": 0,
        "output": f"{', '.join(exported_formats).upper()} fallback export hazır.",
        "warnings": warnings,
        "produced_files": produced_files(book_dir, before_snapshot),
        "preflight": preflight,
        "export_relative_path": parity.get("export_relative_path", ""),
        "export_url": parity.get("export_url", ""),
        "parity": parity,
        "book": read_book(book_dir),
    }


def preflight_for_build(format_name: str, slug: str | None = None) -> dict[str, Any]:
    capabilities = build_capabilities()
    if format_name not in capabilities:
        raise ValueError("Unsupported format.")
    warnings: list[str] = []
    missing: list[str] = []
    capability = capabilities[format_name]
    primary_ok = bool(capability["available"])
    fallback_ok = format_name in LIGHTWEIGHT_BUILD_FORMATS
    if format_name == "all" and not tool_exists("ebook-convert"):
        warnings.append("ebook-convert missing: mobi/azw3 conversions may be unavailable in all-in-one builds.")
    reason = str(capability["reason"] or "")
    if not primary_ok and fallback_ok:
        fallback_note = "Primary exporter missing; lightweight fallback export will be used."
        warnings.append(fallback_note)
        reason = fallback_note
    if slug:
        book_dir = BOOK_OUTPUTS_DIR / slug
        metadata = read_metadata(book_dir) if book_dir.exists() else {}
        env = command_env()
        if image_provider_policy_vertex_only() and not has_vertex_image_provider_config(env):
            missing.append(
                "Vertex image config is incomplete. Set GOOGLE_API_KEY (or VERTEX_API_KEY / GOOGLE_GENAI_API_KEY) "
                "and GOOGLE_CLOUD_PROJECT (or GOOGLE_PROJECT_ID / VERTEX_PROJECT_ID)."
            )
            missing.append("Vertex OCR validation cannot run until the Vertex image config is complete.")
        if book_dir.exists():
            front_cover, back_cover = resolve_cover_image_references(book_dir, metadata)
            if not front_cover:
                missing.append("Selected final front cover asset is missing.")
            if not back_cover:
                missing.append("Selected final back cover asset is missing.")
            selected_variant = selected_cover_variant_record(metadata)
            if selected_variant:
                validation = selected_variant.get("text_validation") if isinstance(selected_variant.get("text_validation"), dict) else {}
                render_mode = str(selected_variant.get("render_mode") or "").strip()
                if render_mode in {"ai-signature", "ai-minimal"} and not bool(validation.get("valid")):
                    missing.append("Selected cover variant did not pass Vertex text validation.")
            elif normalize_cover_variants(metadata.get("cover_variants")):
                missing.append("Selected cover variant could not be resolved from metadata.")
        else:
            missing.append("Book directory not found.")
    return {
        "ok": (primary_ok or fallback_ok) and not missing,
        "primary_ok": primary_ok,
        "fallback_ok": fallback_ok,
        "warnings": warnings,
        "missing": missing,
        "capabilities": capabilities,
        "reason": "; ".join(missing) if missing else reason,
    }


def build_book(slug: str, payload: dict[str, Any]) -> dict[str, Any]:
    if not slug:
        raise ValueError("Book slug is required.")
    book_dir = BOOK_OUTPUTS_DIR / slug
    if not book_dir.exists():
        raise FileNotFoundError("Book directory not found.")

    format_name = str(payload.get("format") or "epub").strip().lower()
    preflight = preflight_for_build(format_name, slug)
    if not bool(preflight.get("ok", False)):
        return {
            "ok": False,
            "action": "build",
            "returncode": 1,
            "output": preflight["reason"],
            "warnings": preflight["warnings"] + ([preflight["reason"]] if preflight["reason"] else []),
            "produced_files": [],
            "preflight": preflight,
            "book": read_book(book_dir),
        }

    primary_export_ok = bool(preflight.get("primary_ok", False))
    if not primary_export_ok:
        fallback_before = file_snapshot(book_dir)
        fallback_result = build_book_with_lightweight_fallback(
            book_dir=book_dir,
            slug=slug,
            format_name=format_name,
            preflight=preflight,
            before_snapshot=fallback_before,
        )
        if fallback_result:
            append_log(
                f"Build primary exporter unavailable for '{slug}' ({preflight.get('reason')}); returned lightweight fallback export."
            )
            return fallback_result
        return {
            "ok": False,
            "action": "build",
            "returncode": 1,
            "output": preflight["reason"],
            "warnings": preflight["warnings"] + ([preflight["reason"]] if preflight["reason"] else []),
            "produced_files": [],
            "preflight": preflight,
            "book": read_book(book_dir),
        }

    metadata = read_metadata(book_dir)
    author = str(payload.get("author") or metadata["author"]).strip()
    publisher = str(payload.get("publisher") or metadata["publisher"]).strip()
    author_bio = str(payload.get("author_bio") or metadata.get("author_bio") or "").strip()
    branding_mark = str(payload.get("branding_mark") or metadata.get("branding_mark") or "").strip()
    branding_logo_url = str(payload.get("branding_logo_url") or metadata.get("branding_logo_url") or "").strip()
    cover_brief = str(payload.get("cover_brief") or metadata.get("cover_brief") or "").strip()
    cover_prompt = str(payload.get("cover_prompt") or metadata.get("cover_prompt") or "").strip()
    book_type = str(payload.get("book_type") or payload.get("bookType") or metadata.get("book_type") or "").strip()
    generate_cover = bool(payload.get("generate_cover", metadata.get("generate_cover", True)))
    cover_art_image = str(payload.get("cover_art_image") or metadata.get("cover_art_image") or "").strip()
    cover_image = str(payload.get("cover_image") or metadata.get("cover_image") or "").strip()
    back_cover_image = str(payload.get("back_cover_image") or metadata.get("back_cover_image") or "").strip()
    cover_template = str(payload.get("cover_template") or metadata.get("cover_template") or "").strip()
    cover_variant_count = int(payload.get("cover_variant_count") or metadata.get("cover_variant_count") or 0)
    cover_variant_target_count = clamp_cover_variant_target_count(
        payload.get("cover_variant_target_count") or metadata.get("cover_variant_target_count") or 1,
        default=1,
    )
    cover_generation_provider = str(payload.get("cover_generation_provider") or metadata.get("cover_generation_provider") or "").strip()
    cover_composed = bool(payload.get("cover_composed", metadata.get("cover_composed", False)))
    cover_variants = normalize_cover_variants(payload.get("cover_variants") or metadata.get("cover_variants"))
    selected_cover_variant = str(payload.get("selected_cover_variant") or metadata.get("selected_cover_variant") or "").strip()
    recommended_cover_variant = str(payload.get("recommended_cover_variant") or metadata.get("recommended_cover_variant") or "").strip()
    back_cover_variant_family = str(payload.get("back_cover_variant_family") or metadata.get("back_cover_variant_family") or "").strip()
    cover_family = str(payload.get("cover_family") or metadata.get("cover_family") or "").strip()
    cover_branch = str(payload.get("cover_branch") or metadata.get("cover_branch") or "").strip()
    cover_genre = str(payload.get("cover_genre") or metadata.get("cover_genre") or "").strip()
    cover_subtopic = str(payload.get("cover_subtopic") or metadata.get("cover_subtopic") or "").strip()
    cover_palette_key = str(payload.get("cover_palette_key") or metadata.get("cover_palette_key") or "").strip()
    cover_layout_key = str(payload.get("cover_layout_key") or metadata.get("cover_layout_key") or "").strip()
    cover_motif = str(payload.get("cover_motif") or metadata.get("cover_motif") or "").strip()
    cover_lab_version = str(payload.get("cover_lab_version") or metadata.get("cover_lab_version") or "").strip()
    isbn = str(payload.get("isbn") or metadata.get("isbn") or "").strip()
    year = str(payload.get("year") or metadata.get("year") or "").strip()
    fast = bool(payload.get("fast", metadata.get("fast", False)))
    book_length_tier = str(payload.get("book_length_tier") or metadata.get("book_length_tier") or "standard").strip() or "standard"
    target_word_count_min = int(payload.get("target_word_count_min") or metadata.get("target_word_count_min") or 0)
    target_word_count_max = int(payload.get("target_word_count_max") or metadata.get("target_word_count_max") or 0)
    chapter_plan = normalize_chapter_plan(payload.get("chapter_plan") or metadata.get("chapter_plan"))

    saved_meta = save_metadata(
        book_dir,
        {
            "author": author,
            "publisher": publisher,
            "author_bio": author_bio,
            "branding_mark": branding_mark,
            "branding_logo_url": branding_logo_url,
            "cover_brief": cover_brief,
            "cover_prompt": cover_prompt,
            "book_type": book_type,
            "generate_cover": generate_cover,
            "cover_art_image": cover_art_image,
            "cover_image": cover_image,
            "back_cover_image": back_cover_image,
            "cover_template": cover_template,
            "cover_variant_count": cover_variant_count,
            "cover_variant_target_count": cover_variant_target_count,
            "cover_generation_provider": cover_generation_provider,
            "cover_composed": cover_composed,
            "cover_variants": cover_variants,
            "selected_cover_variant": selected_cover_variant,
            "recommended_cover_variant": recommended_cover_variant,
            "back_cover_variant_family": back_cover_variant_family,
            "cover_family": cover_family,
            "cover_branch": cover_branch,
            "cover_genre": cover_genre,
            "cover_subtopic": cover_subtopic,
            "cover_palette_key": cover_palette_key,
            "cover_layout_key": cover_layout_key,
            "cover_motif": cover_motif,
            "cover_lab_version": cover_lab_version,
            "isbn": isbn,
            "year": year,
            "fast": fast,
            "book_length_tier": book_length_tier,
            "target_word_count_min": target_word_count_min,
            "target_word_count_max": target_word_count_max,
            "chapter_plan": chapter_plan,
        },
    )
    saved_meta = sync_selected_cover_assets(book_dir, saved_meta)
    resolved_cover_image, resolved_back_cover_image = resolve_cover_image_references(book_dir, saved_meta)
    normalized_cover_image = existing_book_asset_reference(book_dir, cover_image) or resolved_cover_image
    normalized_back_cover_image = existing_book_asset_reference(book_dir, back_cover_image) or resolved_back_cover_image
    metadata_updates: dict[str, Any] = {}
    if normalized_cover_image and normalized_cover_image != str(saved_meta.get("cover_image") or "").strip():
        metadata_updates["cover_image"] = normalized_cover_image
    if normalized_back_cover_image and normalized_back_cover_image != str(saved_meta.get("back_cover_image") or "").strip():
        metadata_updates["back_cover_image"] = normalized_back_cover_image
    if metadata_updates:
        saved_meta = save_metadata(book_dir, metadata_updates)
    cover_image = normalized_cover_image
    back_cover_image = normalized_back_cover_image
    selected_variant = selected_cover_variant_record(saved_meta)

    front_cover_path = (book_dir / cover_image).resolve() if cover_image else None
    back_cover_path = (book_dir / back_cover_image).resolve() if back_cover_image else None
    if front_cover_path and not front_cover_path.exists():
        front_cover_path = None
    if back_cover_path and not back_cover_path.exists():
        back_cover_path = None
    if not front_cover_path or not back_cover_path:
        return {
            "ok": False,
            "action": "build",
            "returncode": 1,
            "output": "Selected final cover assets are missing.",
            "warnings": ["Selected final cover assets are missing."],
            "produced_files": [],
            "preflight": preflight,
            "book": read_book(book_dir),
        }
    if selected_variant:
        validation = selected_variant.get("text_validation") if isinstance(selected_variant.get("text_validation"), dict) else {}
        render_mode = str(selected_variant.get("render_mode") or "").strip()
        if render_mode in {"ai-signature", "ai-minimal"} and not bool(validation.get("valid")):
            return {
                "ok": False,
                "action": "build",
                "returncode": 1,
                "output": "Selected cover variant failed Vertex text validation.",
                "warnings": ["Selected cover variant failed Vertex text validation."],
                "produced_files": [],
                "preflight": preflight,
                "book": read_book(book_dir),
            }

    command = bash_command(
        ROOT_DIR / "compile_book.sh",
        book_dir,
        format_name,
        "3",
        "--author",
        author,
        "--publisher",
        publisher,
    )
    # Prefer stable, already-generated cover assets during build.
    # Auto-generation stays available when no usable cover exists yet.
    if front_cover_path:
        command.extend(["--cover", maybe_bash_path_arg(front_cover_path)])
    elif generate_cover:
        command.append("--generate-cover")
    if back_cover_path:
        command.extend(["--backcover", maybe_bash_path_arg(back_cover_path)])
    if isbn:
        command.extend(["--isbn", isbn])
    if year:
        command.extend(["--year", year])
    if fast:
        command.append("--fast")

    used_cover_generation_retry = False
    before = file_snapshot(book_dir)
    result = run_process(command, cwd=ROOT_DIR, env=command_env())
    if result.returncode != 0 and "--generate-cover" in command:
        retry_command = [part for part in command if part != "--generate-cover"]
        retry_result = run_process(retry_command, cwd=ROOT_DIR, env=command_env())
        if retry_result.returncode == 0:
            result = retry_result
            used_cover_generation_retry = True
    sync_extra_files(book_dir)
    if used_cover_generation_retry:
        preflight = {
            **preflight,
            "warnings": [
                *list(preflight.get("warnings") or []),
                "Auto cover generation failed; build succeeded using the existing/static cover path.",
            ],
        }
    if result.returncode != 0 and format_name in LIGHTWEIGHT_BUILD_FORMATS:
        fallback_warning = "Primary build command failed; lightweight fallback export was used."
        fallback_preflight = {
            **preflight,
            "primary_ok": False,
            "fallback_ok": True,
            "reason": fallback_warning,
            "warnings": [*list(preflight.get("warnings") or []), fallback_warning],
        }
        fallback_result = build_book_with_lightweight_fallback(
            book_dir=book_dir,
            slug=slug,
            format_name=format_name,
            preflight=fallback_preflight,
            before_snapshot=before,
        )
        if fallback_result:
            primary_output = ((result.stdout or "") + (result.stderr or "")).strip()
            first_primary_line = primary_output.splitlines()[0].strip() if primary_output else ""
            if first_primary_line:
                fallback_result["warnings"] = [
                    *list(fallback_result.get("warnings") or []),
                    f"Primary build error: {first_primary_line}",
                ]
            append_log(
                f"Build command failed for '{slug}' (rc={result.returncode}); returned lightweight fallback export."
            )
            return fallback_result
    parity = build_export_parity_report(book_dir, saved_meta, format_name)
    warnings = [*list(preflight.get("warnings") or []), *list(parity.get("warnings") or [])]
    return {
        "ok": result.returncode == 0 and bool(parity.get("ok")),
        "action": "build",
        "returncode": result.returncode if parity.get("ok") else 1,
        "output": (result.stdout or "") + (result.stderr or ""),
        "warnings": warnings + list(parity.get("errors") or []),
        "produced_files": produced_files(book_dir, before),
        "preflight": preflight,
        "export_relative_path": parity.get("export_relative_path", ""),
        "export_url": parity.get("export_url", ""),
        "parity": parity,
        "book": read_book(book_dir),
    }


def run_dashboard_action(
    *args: str,
    env_overrides: dict[str, str] | None = None,
    timeout_seconds: int | None = None,
) -> subprocess.CompletedProcess[str]:
    env = command_env(overrides=env_overrides)
    script_path = ROOT_DIR / "dashboard_actions.sh"
    base_style = detect_bash_path_style()
    style_candidates = [base_style]
    if os.name == "nt":
        # Prefer WSL path flavor first on Windows; fall back to MSYS.
        style_candidates = ["wsl", "msys"]

    best_result: subprocess.CompletedProcess[str] | None = None

    def result_rank(candidate: subprocess.CompletedProcess[str]) -> tuple[int, int]:
        # Prefer results where the script actually ran (non 126/127), then
        # prefer the richer stderr/stdout payload for diagnostics.
        ran_script = 0 if candidate.returncode in {126, 127} else 1
        payload_len = len((candidate.stdout or "") + (candidate.stderr or ""))
        return (ran_script, payload_len)

    for style in style_candidates:
        set_bash_path_style(style)
        command = bash_command_for_style(style, script_path, *args)
        result = run_process(
            command,
            cwd=ROOT_DIR,
            env=env,
            timeout_seconds=timeout_seconds,
        )
        if result.returncode == 0:
            if style != base_style:
                append_log(f"Recovered dashboard action using bash style '{style}'.")
            set_bash_path_style(style)
            return result
        if best_result is None or result_rank(result) > result_rank(best_result):
            best_result = result

        # Windows hosts may fail direct script execution even when bash is healthy.
        # Retry with `bash -lc` command form before moving to the next style.
        if os.name == "nt" and result.returncode in {126, 127}:
            command_parts = [to_bash_path_for_style(script_path, style)]
            command_parts.extend(maybe_bash_path_arg_for_style(arg, style) for arg in args)
            shell_command = " ".join(shlex.quote(part) for part in command_parts)
            shell_retry = run_process(
                ["bash", "-lc", shell_command],
                cwd=ROOT_DIR,
                env=env,
                timeout_seconds=timeout_seconds,
            )
            if shell_retry.returncode == 0:
                append_log(f"Recovered dashboard action with bash -lc using style '{style}'.")
                set_bash_path_style(style)
                return shell_retry
            if result_rank(shell_retry) > result_rank(best_result):
                best_result = shell_retry

    # Keep the original style after total failure to avoid caching a broken path
    # flavor selected only by verbose error output.
    set_bash_path_style(base_style)
    if best_result is not None:
        return best_result
    return subprocess.CompletedProcess(
        ["bash", to_bash_path(script_path), *args],
        127,
        stdout="",
        stderr="Dashboard action could not be executed.",
    )


def run_python_script_with_fallback(
    script_path: Path,
    script_args: list[str],
    *,
    env: dict[str, str],
    timeout_seconds: int | None = None,
) -> subprocess.CompletedProcess[str]:
    script_abs = script_path.resolve()
    attempts: list[subprocess.CompletedProcess[str]] = []

    if os.name == "nt":
        base_style = detect_bash_path_style()
        style_candidates = ["wsl", "msys"]
        for style in style_candidates:
            set_bash_path_style(style)
            wsl_parts = ["python3", to_bash_path(script_abs)]
            wsl_parts.extend(maybe_bash_path_arg(arg) for arg in script_args)
            wsl_command = " ".join(shlex.quote(part) for part in wsl_parts)
            wsl_result = run_process(
                ["bash", "-lc", wsl_command],
                cwd=ROOT_DIR,
                env=env,
                timeout_seconds=timeout_seconds,
            )
            attempts.append(wsl_result)
            if wsl_result.returncode == 0:
                if style != base_style:
                    append_log(f"Recovered Python script execution using bash style '{style}'.")
                return wsl_result
        set_bash_path_style(base_style)

    launcher_candidates: list[list[str]] = []
    detected = detect_python_launcher()
    if detected:
        launcher_candidates.append(detected)
    for fallback in (["python"], ["py", "-3"], ["python3"]):
        if fallback not in launcher_candidates:
            launcher_candidates.append(fallback)

    for launcher in launcher_candidates:
        native_result = run_process(
            [*launcher, str(script_abs), *script_args],
            cwd=ROOT_DIR,
            env=env,
            timeout_seconds=timeout_seconds,
        )
        attempts.append(native_result)
        if native_result.returncode == 0:
            return native_result

    if not attempts:
        return subprocess.CompletedProcess(
            [str(script_abs), *script_args],
            127,
            stdout="",
            stderr="No Python launcher could be executed.",
        )
    return max(
        attempts,
        key=lambda item: len((item.stdout or "") + (item.stderr or "")),
    )


def save_asset(slug: str, payload: dict[str, Any]) -> dict[str, Any]:
    book_dir = BOOK_OUTPUTS_DIR / slug
    if not book_dir.exists():
        raise FileNotFoundError("Book directory not found.")
    ensure_book_layout(book_dir)

    kind = str(payload.get("kind") or "").strip()
    if kind not in {"cover_image", "back_cover_image", "asset"}:
        raise ValueError("Unknown asset kind.")
    filename = str(payload.get("filename") or "").strip()
    if not filename:
        raise ValueError("Filename is required.")
    content_base64 = payload.get("content_base64") or ""
    if not content_base64:
        raise ValueError("Asset content missing.")

    ext = Path(filename).suffix.lower() or ".png"
    safe_stem = {
        "cover_image": "dashboard_cover",
        "back_cover_image": "dashboard_back_cover",
    }.get(kind, slugify(Path(filename).stem or "asset"))
    target = book_dir / "assets" / f"{safe_stem}{ext}"
    target.write_bytes(base64.b64decode(content_base64))

    if kind in {"cover_image", "back_cover_image"}:
        save_metadata(book_dir, {kind: f"assets/{target.name}"})
    append_log(f"Saved asset '{target.name}' for book '{slug}'.")
    return {
        "saved_asset": f"assets/{target.name}",
        "book": read_book(book_dir),
    }


def read_book_file(slug: str, relative_path: str) -> dict[str, Any]:
    book_dir = BOOK_OUTPUTS_DIR / slug
    if not book_dir.exists():
        raise FileNotFoundError("Book directory not found.")
    path = resolve_book_path(book_dir, relative_path)
    if not path.is_file():
        raise FileNotFoundError("File not found.")
    if not is_text_file(path):
        raise ValueError("Binary files cannot be edited in the panel.")
    return {
        "file": file_entry(path),
        "content": path.read_text(encoding="utf-8", errors="replace"),
    }


def resolve_book_path(book_dir: Path, relative_path: str) -> Path:
    if not relative_path:
        raise ValueError("relative_path is required.")
    path = (book_dir / relative_path).resolve()
    if book_dir not in path.parents and path != book_dir:
        raise ValueError("Invalid path.")
    return path


def save_book_file(slug: str, relative_path: str, content: str) -> dict[str, Any]:
    book_dir = BOOK_OUTPUTS_DIR / slug
    if not book_dir.exists():
        raise FileNotFoundError("Book directory not found.")
    ensure_book_layout(book_dir)
    path = resolve_book_path(book_dir, relative_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")

    if path.parent == book_dir / "extras":
        root_copy = book_dir / path.name
        root_copy.write_text(content, encoding="utf-8")
    elif path.parent == book_dir and path.name in EXTRA_FILES:
        extra_copy = book_dir / "extras" / path.name
        extra_copy.write_text(content, encoding="utf-8")

    append_log(f"Saved file '{relative_path}' for book '{slug}'.")
    return read_book(book_dir)


def preflight_for_workflow(action: str, slug: str | None = None) -> dict[str, Any]:
    settings = read_settings()
    env = command_env(settings=settings)
    python_launcher = detect_python_launcher()
    warnings: list[str] = []
    missing: list[str] = []
    ok = True
    needs_ai = {
        "topic_suggest",
        "outline_suggest",
        "outline_generate",
        "chapter_generate",
        "chapters_generate_all",
        "chapter_review",
        "chapter_extend",
        "chapter_plagiarism",
        "chapter_rewrite",
        "appendices",
        "references",
        "research_insights",
    }
    if action in needs_ai and not has_any_ai_provider(settings):
        ok = False
        missing.append("No AI provider configured. CODEFAST_API_KEY is required.")

    if action == "research_insights":
        if not python_launcher:
            ok = False
            missing.append("Python runtime is missing.")
        if slug:
            book_dir = BOOK_OUTPUTS_DIR / slug
            if book_dir.exists() and not collect_strategy_research_files(book_dir):
                ok = False
                missing.append("No research result found yet. Run KDP analysis, keyword research, or topic finder first.")

    if action == "cover_local":
        if image_provider_policy_vertex_only():
            ok = False
            missing.append("Image provider policy is vertex_only; local cover rendering is disabled.")
        elif not any(tool_exists(tool, env) for tool in ("magick", "convert")):
            ok = False
            missing.append("ImageMagick is missing.")

    if action == "cover_script":
        if image_provider_policy_vertex_only():
            ok = False
            missing.append("Image provider policy is vertex_only; browser cover script is disabled.")
        else:
            if not tool_exists("jq", env):
                ok = False
                missing.append("jq is missing.")
            if not python_launcher:
                ok = False
                missing.append("Python runtime is missing.")
            if not tool_exists("playwright", env):
                warnings.append("playwright command not found. The script may install it on first run.")

    if action == "cover_variants_generate":
        wsl_binary_path = Path(os.environ.get("SystemRoot", r"C:\Windows")) / "System32" / "wsl.exe"
        wsl_binary_present = os.name == "nt" and (
            bool(shutil.which("wsl")) or wsl_binary_path.exists()
        )
        wsl_cover_bridge = os.name == "nt" and (
            detect_bash_path_style() == "wsl" or wsl_binary_present
        )
        if not wsl_cover_bridge:
            if not python_launcher:
                ok = False
                missing.append("Python runtime is missing.")
            if not tool_exists("node", env):
                ok = False
                missing.append("node is missing.")
        if os.name == "nt" and not (wsl_cover_bridge or wsl_binary_present or python_launcher):
            ok = False
            missing.append("WSL bridge or Python runtime is required for cover variants generation.")
        if image_provider_policy_vertex_only() and not has_vertex_image_provider_config(env):
            ok = False
            missing.append(
                "Vertex image config is incomplete. Set GOOGLE_API_KEY (or VERTEX_API_KEY / GOOGLE_GENAI_API_KEY) "
                "and GOOGLE_CLOUD_PROJECT (or GOOGLE_PROJECT_ID / VERTEX_PROJECT_ID)."
            )

    if action == "topic_finder" and not tool_exists("xmllint", env):
        ok = False
        missing.append("xmllint is missing.")

    if action == "keyword_research" and not tool_exists("jq", env):
        ok = False
        missing.append("jq is missing.")

    if action.startswith("market_") and slug:
        book_dir = BOOK_OUTPUTS_DIR / slug
        config_path = book_dir / "research" / "topic_market_research" / "book_research_config"
        if action not in {"market_init", "market_status"} and not config_path.exists():
            warnings.append("Research config missing. Dashboard will auto-run init before this action.")

    return {"ok": ok, "warnings": warnings, "missing": missing}


def run_workflow(payload: dict[str, Any]) -> dict[str, Any]:
    action = str(payload.get("action") or "").strip()
    slug = str(payload.get("slug") or "").strip()
    preflight = preflight_for_workflow(action, slug or None)
    book_dir = BOOK_OUTPUTS_DIR / slug if slug else None

    if not action:
        raise ValueError("Workflow action is required.")
    if slug and (not book_dir or not book_dir.exists()) and action not in {"outline_generate", "outline_suggest", "migrate_outputs"}:
        raise FileNotFoundError("Book directory not found.")
    if not preflight["ok"]:
        return {
            "ok": False,
            "action": action,
            "returncode": 1,
            "output": "\n".join(preflight["missing"]) or "Preflight failed.",
            "warnings": preflight["warnings"] + preflight["missing"],
            "produced_files": [],
            "preflight": preflight,
            "book": read_book(book_dir) if book_dir and book_dir.exists() else None,
        }

    if action == "provider_status":
        result = run_process(
            bash_command(ROOT_DIR / "multi_provider_ai_simple.sh", "status"),
            cwd=ROOT_DIR,
            env=command_env(),
        )
        return workflow_result(action, result, None, preflight)

    if action == "provider_test":
        result = run_process(
            bash_command(ROOT_DIR / "multi_provider_ai_simple.sh", "test"),
            cwd=ROOT_DIR,
            env=command_env(),
        )
        return workflow_result(action, result, None, preflight)

    if action == "custom_command":
        raw_command = str(payload.get("command") or "").strip()
        if not raw_command:
            raise ValueError("Custom command is required.")
        root_for_shell = to_bash_path(ROOT_DIR)
        env_file_for_shell = to_bash_path(ROOT_DIR / "book-generator-env.sh")
        shell_command = (
            f"cd {shlex.quote(root_for_shell)} && "
            f"source {shlex.quote(env_file_for_shell)} && "
            f"{raw_command}"
        )
        result = run_process(["bash", "-lc", shell_command], cwd=ROOT_DIR, env=command_env())
        return workflow_result(action, result, None, preflight)

    if action == "outline_suggest":
        topic = str(payload.get("topic") or payload.get("title") or "").strip()
        if not topic:
            raise ValueError("Topic is required.")
        language = normalize_book_language(payload.get("language")) or detect_book_language(
            payload.get("title"),
            payload.get("subtitle"),
            payload.get("description"),
            topic,
        ) or "English"
        result = run_dashboard_action(
            "outline-json",
            topic,
            str(payload.get("genre") or "non-fiction"),
            str(payload.get("audience") or "general readers"),
            str(payload.get("style") or "detailed"),
            str(payload.get("tone") or "professional"),
            language,
        )
        response = workflow_result(action, result, None, preflight)
        if result.returncode == 0:
            generated = json.loads((result.stdout or "{}").strip())
            response["generated"] = {
                "title": generated.get("title") or topic,
                "subtitle": generated.get("subtitle") or "",
                "description": generated.get("description") or "",
                "chapters": [
                    {
                        "title": normalize_structural_heading(
                            str(chapter.get("title") or ""),
                            language,
                            index + 1,
                        ),
                        "summary": str(chapter.get("summary") or "").strip(),
                    }
                    for index, chapter in enumerate(generated.get("chapters") or [])
                ],
            }
        return response

    if action == "outline_generate":
        topic = str(payload.get("topic") or payload.get("title") or "").strip()
        if not topic:
            raise ValueError("Topic is required.")
        language = normalize_book_language(payload.get("language")) or detect_book_language(
            payload.get("title"),
            payload.get("subtitle"),
            payload.get("description"),
            topic,
        ) or "English"
        before = file_snapshot(BOOK_OUTPUTS_DIR / slug) if slug and (BOOK_OUTPUTS_DIR / slug).exists() else set()
        result = run_dashboard_action(
            "outline-json",
            topic,
            str(payload.get("genre") or "non-fiction"),
            str(payload.get("audience") or "general readers"),
            str(payload.get("style") or "detailed"),
            str(payload.get("tone") or "professional"),
            language,
        )
        if result.returncode != 0:
            return workflow_result(action, result, None, preflight)
        generated = json.loads((result.stdout or "{}").strip())
        saved = save_book(
            {
                "slug": slug or generated.get("title") or topic,
                "title": payload.get("title") or generated.get("title") or topic,
                "subtitle": payload.get("subtitle") or generated.get("subtitle") or "",
                "author": payload.get("author") or read_settings()["default_author"],
                "publisher": payload.get("publisher") or read_settings()["default_publisher"],
                "description": payload.get("description") or generated.get("description") or "",
                "language": language,
                "generate_cover": payload.get("generate_cover", True),
                "cover_image": payload.get("cover_image") or "",
                "back_cover_image": payload.get("back_cover_image") or "",
                "isbn": payload.get("isbn") or "",
                "year": payload.get("year") or "",
                "fast": payload.get("fast", False),
                "chapters": [
                    {
                        "title": normalize_structural_heading(
                            str(chapter.get("title") or ""),
                            language,
                            index + 1,
                        ),
                        "content": chapter.get("summary") or "",
                    }
                    for index, chapter in enumerate(generated.get("chapters") or [])
                ],
            }
        )
        return {
            "ok": True,
            "action": action,
            "returncode": 0,
            "output": "Outline generated and saved.",
            "warnings": preflight["warnings"],
            "produced_files": produced_files(BOOK_OUTPUTS_DIR / saved["slug"], before if saved["slug"] == slug else set()),
            "preflight": preflight,
            "book": saved,
            "generated": generated,
        }

    if action == "topic_suggest":
        topic = str(payload.get("topic") or payload.get("niche") or "").strip()
        if not topic:
            raise ValueError("Topic is required.")
        language = normalize_book_language(payload.get("language")) or detect_book_language(
            payload.get("title"),
            payload.get("subtitle"),
            topic,
            payload.get("audience"),
        ) or "English"
        result = run_dashboard_action(
            "topic-suggest",
            topic,
            str(payload.get("audience") or "general readers"),
            str(payload.get("category") or "non-fiction"),
            language,
        )
        response = workflow_result(action, result, None, preflight)
        if result.returncode == 0:
            response["generated"] = json.loads((result.stdout or "{}").strip())
        return response

    if action == "migrate_outputs":
        result = run_dashboard_action("migrate-outputs")
        response = workflow_result(action, result, None, preflight)
        response["books"] = list_books()
        return response

    if not book_dir or not book_dir.exists():
        raise FileNotFoundError("Book directory not found.")

    if action == "chapters_generate_all":
        force = bool(payload.get("force", False))
        started = start_full_chapter_pipeline(slug, force=force)
        started["ok"] = True
        started["action"] = action
        started["returncode"] = 0
        started["output"] = (
            "Eksik bölümler üretim kuyruğuna alındı."
            if started.get("started")
            else "Tam metin bölümler zaten hazır."
        )
        started["warnings"] = preflight["warnings"]
        started["produced_files"] = []
        started["preflight"] = preflight
        return started

    before = file_snapshot(book_dir)

    if action == "chapter_generate":
        metadata = read_metadata(book_dir)
        book_language = infer_book_language(book_dir, metadata)
        chapter_number = int(payload.get("chapter_number") or 1)
        chapter_plan = chapter_plan_for_number(metadata, chapter_number)
        min_words = str(payload.get("min_words") or (chapter_plan.get("target_min_words") if chapter_plan else 0) or 1800)
        max_words = str(payload.get("max_words") or (chapter_plan.get("target_max_words") if chapter_plan else 0) or 2400)
        chapter_title = str(
            payload.get("chapter_title")
            or (chapter_plan.get("title") if chapter_plan else "")
            or normalize_structural_heading("", book_language, chapter_number)
        )
        result = run_dashboard_action(
            "chapter-generate",
            str(book_dir),
            str(chapter_number),
            chapter_title,
            min_words,
            max_words,
            str(payload.get("style") or "clear"),
            str(payload.get("tone") or "professional"),
            book_language,
        )
    elif action == "chapter_review":
        result = run_dashboard_action("chapter-review", str(book_dir), str(payload.get("chapter_number") or 1))
    elif action == "chapter_extend":
        result = run_dashboard_action(
            "chapter-extend",
            str(book_dir),
            str(payload.get("chapter_number") or 1),
            str(payload.get("min_words") or 2000),
            str(payload.get("max_words") or 2500),
        )
    elif action == "chapter_plagiarism":
        result = run_dashboard_action("chapter-plagiarism", str(book_dir), str(payload.get("chapter_number") or 1))
    elif action == "chapter_rewrite":
        result = run_dashboard_action("chapter-rewrite", str(book_dir), str(payload.get("chapter_number") or 1))
    elif action == "appendices":
        result = run_dashboard_action("appendices", str(book_dir))
        sync_extra_files(book_dir)
    elif action == "references":
        result = run_dashboard_action("references", str(book_dir))
    elif action == "cover_local":
        metadata = read_metadata(book_dir)
        book_core = read_book_core_fields(book_dir, metadata)
        result = run_dashboard_action(
            "cover-local",
            str(book_dir),
            str(payload.get("title") or book_core["title"]),
            str(payload.get("subtitle") or book_core["subtitle"]),
            str(payload.get("author") or metadata["author"]),
            str(payload.get("blurb") or metadata["description"]),
            timeout_seconds=75,
        )
    elif action == "cover_script":
        settings = read_settings()
        metadata = read_metadata(book_dir)
        book_core = read_book_core_fields(book_dir, metadata)
        result = run_dashboard_action(
            "cover-script-run",
            str(book_dir),
            str(payload.get("mode") or "generate"),
            str(payload.get("service") or settings["cover_service"]),
            str(payload.get("username") or settings["cover_username"]),
            str(payload.get("password") or settings["cover_password"]),
            str(payload.get("title") or book_core["title"]),
            str(payload.get("author") or metadata["author"]),
            str(payload.get("genre") or infer_cover_genre(book_core) or "non-fiction"),
            timeout_seconds=210,
        )
    elif action == "cover_variants_generate":
        settings = read_settings()
        policy_vertex_only = image_provider_policy_vertex_only()
        variant_count = clamp_cover_variant_target_count(payload.get("variant_count", 1), default=1)
        save_metadata(book_dir, {"cover_variant_target_count": variant_count})
        service_value = normalize_cover_service_for_policy(payload.get("service") or settings["cover_service"] or "auto")
        if not service_value:
            service_value = "auto"
        force_generate = bool(payload.get("force", False))
        selected_override = str(payload.get("selected_cover_variant") or "").strip()
        safe_mode_requested = bool(payload.get("safe_mode", False))
        safe_mode = safe_mode_requested and not policy_vertex_only
        if safe_mode_requested and policy_vertex_only:
            append_log(
                "Ignoring safe_mode for cover_variants_generate because BOOK_IMAGE_PROVIDER_POLICY=vertex_only."
            )
        env_overrides: dict[str, str] = {
            "SHOWCASE_IMAGE_PROVIDER_POLICY": normalized_image_provider_policy(),
            "BOOK_IMAGE_PROVIDER_POLICY": normalized_image_provider_policy(),
        }
        timeout_seconds = 210
        if safe_mode:
            # Safe mode avoids long remote provider waits and forces fast local fallback paths.
            env_overrides.update(
                {
                "CODEFAST_API_KEY": "",
                "OPENAI_API_KEY": "",
                "GEMINI_API_KEY": "",
                "GROQ_API_KEY": "",
                "GOOGLE_API_KEY": "",
                "VERTEX_API_KEY": "",
                "GOOGLE_GENAI_API_KEY": "",
                "SHOWCASE_MAX_ART_ATTEMPTS": "1",
                }
            )
            timeout_seconds = 90
        script_args = [
            str(book_dir),
            "--service",
            service_value,
            "--variant-count",
            str(variant_count),
        ]
        if force_generate:
            script_args.append("--force")
        if selected_override:
            script_args.extend(["--selected", selected_override])
        result = run_python_script_with_fallback(
            ROOT_DIR / "scripts" / "generate_book_cover_variants.py",
            script_args,
            env=command_env(overrides=env_overrides or None),
            timeout_seconds=timeout_seconds,
        )
        if result.returncode != 0 and not safe_mode and not policy_vertex_only:
            safe_env = {
                "CODEFAST_API_KEY": "",
                "OPENAI_API_KEY": "",
                "GEMINI_API_KEY": "",
                "GROQ_API_KEY": "",
                "GOOGLE_API_KEY": "",
                "VERTEX_API_KEY": "",
                "GOOGLE_GENAI_API_KEY": "",
                "SHOWCASE_MAX_ART_ATTEMPTS": "1",
                "SHOWCASE_IMAGE_PROVIDER_POLICY": "auto",
                "BOOK_IMAGE_PROVIDER_POLICY": "auto",
            }
            safe_args = [
                str(book_dir),
                "--service",
                service_value,
                "--variant-count",
                "1",
                "--force",
            ]
            if selected_override:
                safe_args.extend(["--selected", selected_override])
            fallback_result = run_python_script_with_fallback(
                ROOT_DIR / "scripts" / "generate_book_cover_variants.py",
                safe_args,
                env=command_env(overrides=safe_env),
                timeout_seconds=120,
            )
            if fallback_result.returncode == 0:
                append_log("cover_variants_generate recovered with safe-mode fallback.")
                result = fallback_result
            elif (fallback_result.stdout or "").strip() or (fallback_result.stderr or "").strip():
                result = fallback_result
    elif action == "market_init":
        result = run_dashboard_action("market-init", str(book_dir))
    elif action == "market_search":
        book_core = read_book_core_fields(book_dir)
        topic = str(payload.get("topic") or book_core["title"]).strip()
        if not topic:
            raise ValueError("Topic is required.")
        result = run_dashboard_action("market-search", str(book_dir), topic, str(payload.get("count") or 20))
    elif action == "market_discover":
        result = run_dashboard_action("market-discover", str(book_dir))
    elif action == "market_report":
        result = run_dashboard_action("market-report", str(book_dir))
    elif action == "market_clean":
        result = run_dashboard_action("market-clean", str(book_dir))
    elif action == "market_status":
        result = run_dashboard_action("market-status", str(book_dir))
    elif action == "market_analyzer":
        book_core = read_book_core_fields(book_dir)
        topic = str(payload.get("topic") or book_core["title"]).strip()
        if not topic:
            raise ValueError("Topic is required.")
        result = run_dashboard_action("market-analyzer", str(book_dir), topic)
    elif action == "keyword_research":
        keywords = payload.get("keywords") or []
        if not keywords:
            raise ValueError("At least one keyword is required.")
        result = run_dashboard_action("keyword-research", str(book_dir), *[str(keyword) for keyword in keywords])
    elif action == "topic_finder":
        topic = str(payload.get("topic") or "").strip()
        result = run_dashboard_action("topic-finder", str(book_dir), topic) if topic else run_dashboard_action("topic-finder", str(book_dir))
    elif action == "research_insights":
        book_core = read_book_core_fields(book_dir)
        focus = str(payload.get("focus") or payload.get("topic") or book_core["title"]).strip()
        result = run_dashboard_action("research-insights", str(book_dir), focus)
    elif action == "plagiarism_reports":
        result = run_dashboard_action(
            "plagiarism-reports",
            str(book_dir),
            str(payload.get("report_action") or "summary"),
        )
    else:
        raise ValueError("Unknown workflow action.")

    response = workflow_result(action, result, book_dir, preflight, before)
    if action == "research_insights" and result.returncode == 0:
        response["generated"] = json.loads((result.stdout or "{}").strip())
    if action == "cover_local" and result.returncode == 0:
        save_metadata(
            book_dir,
            {
                "cover_image": "assets/front_cover_final.png",
                "back_cover_image": "assets/back_cover_final.png",
                "cover_template": "local-compositor",
                "cover_variant_count": 1,
                "cover_generation_provider": "local-compositor",
                "cover_composed": True,
            },
        )
        response["book"] = read_book(book_dir)
    if action == "cover_script" and result.returncode == 0:
        assets = collect_assets(book_dir, read_metadata(book_dir))
        front = next(
            (
                path
                for path in assets
                if path.name.startswith("front_cover_final")
                or path.name.startswith("ai_front_cover")
                or path.name.startswith("generated_front_cover")
            ),
            None,
        )
        back = next(
            (
                path
                for path in assets
                if path.name.startswith("back_cover_final")
                or path.name.startswith("ai_back_cover")
                or path.name.startswith("generated_back_cover")
            ),
            None,
        )
        updates: dict[str, Any] = {}
        if front:
            updates["cover_image"] = f"assets/{front.name}"
        if back:
            updates["back_cover_image"] = f"assets/{back.name}"
        if front:
            updates["cover_composed"] = True
        if updates:
            save_metadata(book_dir, updates)
            response["book"] = read_book(book_dir)
        elif not response["warnings"]:
            response["warnings"] = ["Browser automation started, but no downloaded cover file was detected yet."]
    if action == "cover_variants_generate" and result.returncode == 0:
        metadata = sync_selected_cover_assets(book_dir, read_metadata(book_dir))
        response["book"] = read_book(book_dir)
        try:
            response["generated"] = json.loads((result.stdout or "{}").strip())
        except json.JSONDecodeError:
            response["generated"] = {
                "selected_cover_variant": metadata.get("selected_cover_variant", ""),
                "recommended_cover_variant": metadata.get("recommended_cover_variant", ""),
                "cover_variant_count": metadata.get("cover_variant_count", 0),
                "cover_variant_target_count": metadata.get("cover_variant_target_count", 1),
            }
    if (
        book_dir
        and result.returncode == 0
        and action
        in {
            "chapter_generate",
            "chapter_extend",
            "chapter_rewrite",
            "cover_local",
            "cover_script",
            "cover_variants_generate",
        }
    ):
        sync_preview_generation_metadata(book_dir)
        sync_full_generation_metadata(book_dir)
        response["book"] = read_book(book_dir)
    return response


def workflow_result(
    action: str,
    result: subprocess.CompletedProcess[str],
    book_dir: Path | None,
    preflight: dict[str, Any],
    before: set[str] | None = None,
) -> dict[str, Any]:
    produced = produced_files(book_dir, before or set()) if book_dir and before is not None else []
    return {
        "ok": result.returncode == 0,
        "action": action,
        "returncode": result.returncode,
        "output": (result.stdout or "") + (result.stderr or ""),
        "warnings": preflight["warnings"],
        "produced_files": produced,
        "preflight": preflight,
        "book": read_book(book_dir) if book_dir and book_dir.exists() else None,
    }


def read_log_lines(limit: int = 400) -> list[str]:
    log_path = ROOT_DIR / LOG_FILE_NAME
    if not log_path.exists():
        return []
    lines = log_path.read_text(encoding="utf-8", errors="replace").splitlines()
    return lines[-limit:]


class DashboardHandler(BaseHTTPRequestHandler):
    server_version = "BookDashboard/2.0"

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        try:
            if path == "/api/health":
                # Health check is always public
                env = command_env()
                vertex_config = resolve_vertex_image_config(env)
                with ACTIVE_PREVIEW_PIPELINES_LOCK:
                    preview_active_count = len(ACTIVE_PREVIEW_PIPELINES)
                with ACTIVE_FULL_CHAPTER_PIPELINES_LOCK:
                    full_active_count = len(ACTIVE_FULL_CHAPTER_PIPELINES)
                watchdog_running = bool(_pipeline_watchdog_thread and _pipeline_watchdog_thread.is_alive())
                self.respond_json(
                    {
                        "ok": True,
                        "host": HOST,
                        "port": PORT,
                        "time": now_iso(),
                        "pipeline_recovery_enabled": PIPELINE_RECOVERY_ENABLED,
                        "watchdog_running": watchdog_running,
                        "watchdog_interval_seconds": PIPELINE_WATCHDOG_INTERVAL_SECONDS,
                        "pipeline_stale_seconds": PIPELINE_STALE_SECONDS,
                        "active_preview_pipelines": preview_active_count,
                        "active_full_generation_pipelines": full_active_count,
                        "image_provider_policy": normalized_image_provider_policy(),
                        "preview_cover_service": normalize_cover_service_for_policy(PREVIEW_COVER_SERVICE),
                        "vertex_image_configured": bool(vertex_config["api_key"] and vertex_config["project"]),
                        "vertex_project_configured": bool(vertex_config["project"]),
                        "vertex_location": vertex_config["location"],
                    }
                )
                return
            if path == "/api/books":
                # Public endpoint - data is filtered by Next.js layer
                self.respond_json({"books": list_books_cached()})
                return
            if path == "/api/settings":
                # Settings endpoint requires auth
                if not check_authentication(self):
                    self.respond_error_json(HTTPStatus.UNAUTHORIZED, "Authentication required")
                    return
                self.respond_json(public_settings())
                return
            if path == "/api/logs":
                # Logs endpoint requires auth
                if not check_authentication(self):
                    self.respond_error_json(HTTPStatus.UNAUTHORIZED, "Authentication required")
                    return
                limit = int(query.get("limit", ["400"])[0])
                self.respond_json({"lines": read_log_lines(limit)})
                return
            if path.startswith("/api/books/"):
                # Book API requires auth
                if not check_authentication(self):
                    self.respond_error_json(HTTPStatus.UNAUTHORIZED, "Authentication required")
                    return
                self.handle_book_get(path, query)
                return
            if path.startswith("/workspace/"):
                # Workspace files require auth
                if not check_authentication(self):
                    self.respond_error_json(HTTPStatus.UNAUTHORIZED, "Authentication required")
                    return
                self.serve_workspace_file(path.removeprefix("/workspace/"))
                return
            self.serve_static_file(path)
        except FileNotFoundError as exc:
            self.respond_error_json(HTTPStatus.NOT_FOUND, str(exc))
        except ValueError as exc:
            self.respond_error_json(HTTPStatus.BAD_REQUEST, str(exc))
        except Exception as exc:  # noqa: BLE001
            self.respond_error_json(HTTPStatus.INTERNAL_SERVER_ERROR, str(exc))

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)

        # All POST endpoints require authentication
        if not check_authentication(self):
            self.respond_error_json(HTTPStatus.UNAUTHORIZED, "Authentication required")
            return

        try:
            payload = self.read_json_body()
            if parsed.path == "/api/books":
                self.respond_json(save_book(payload))
                invalidate_books_cache()
                return
            if parsed.path == "/api/books/sample":
                self.respond_json(create_sample_book())
                invalidate_books_cache()
                return
            if parsed.path == "/api/settings":
                self.respond_json(public_settings(save_settings(payload)))
                return
            if parsed.path == "/api/build":
                slug = str(payload.get("slug") or "").strip()
                self.respond_json(build_book(slug, payload))
                return
            if parsed.path == "/api/workflows":
                self.respond_json(run_workflow(payload))
                return
            if parsed.path.startswith("/api/books/"):
                self.handle_book_post(parsed.path, payload)
                invalidate_books_cache()
                return
            self.respond_error_json(HTTPStatus.NOT_FOUND, "Unknown endpoint.")
        except FileNotFoundError as exc:
            self.respond_error_json(HTTPStatus.NOT_FOUND, str(exc))
        except ValueError as exc:
            self.respond_error_json(HTTPStatus.BAD_REQUEST, str(exc))
        except subprocess.CalledProcessError as exc:
            output = (exc.stdout or "") + (exc.stderr or "")
            self.respond_error_json(HTTPStatus.INTERNAL_SERVER_ERROR, output or str(exc))
        except Exception as exc:  # noqa: BLE001
            self.respond_error_json(HTTPStatus.INTERNAL_SERVER_ERROR, str(exc))

    def handle_book_get(self, path: str, query: dict[str, list[str]]) -> None:
        parts = path.strip("/").split("/")
        if len(parts) < 3:
            self.respond_error_json(HTTPStatus.NOT_FOUND, "Unknown endpoint.")
            return
        slug = urllib.parse.unquote(parts[2])
        book_dir = BOOK_OUTPUTS_DIR / slug
        if not book_dir.exists():
            raise FileNotFoundError("Book not found.")
        if len(parts) == 3:
            self.respond_json(read_book(book_dir))
            return
        tail = parts[3]
        if tail == "preview":
            self.respond_json(build_book_preview(read_book_preview_payload(book_dir)))
            return
        if tail == "full-bootstrap":
            force = str(query.get("force", [""])[0]).strip().lower() in {"1", "true", "yes", "on"}
            self.respond_json(start_full_chapter_pipeline(slug, force=force))
            return
        if tail == "file":
            relative_path = query.get("path", [""])[0]
            self.respond_json(read_book_file(slug, relative_path))
            return
        self.respond_error_json(HTTPStatus.NOT_FOUND, "Unknown endpoint.")

    def handle_book_post(self, path: str, payload: dict[str, Any]) -> None:
        parts = path.strip("/").split("/")
        if len(parts) < 4:
            self.respond_error_json(HTTPStatus.NOT_FOUND, "Unknown endpoint.")
            return
        slug = urllib.parse.unquote(parts[2])
        action = parts[3]
        if action == "asset":
            self.respond_json(save_asset(slug, payload))
            return
        if action == "preview-bootstrap":
            self.respond_json(start_preview_pipeline(slug))
            return
        if action == "full-bootstrap":
            self.respond_json(start_full_chapter_pipeline(slug, force=bool(payload.get("force", False))))
            return
        if action == "file":
            relative_path = str(payload.get("relative_path") or "").strip()
            content = str(payload.get("content") or "")
            self.respond_json(save_book_file(slug, relative_path, content))
            return
        if action == "build":
            self.respond_json(build_book(slug, payload))
            return
        if action == "preflight":
            workflow_action = str(payload.get("action") or "").strip()
            if workflow_action == "build":
                format_name = str(payload.get("format") or "epub").strip().lower()
                self.respond_json(preflight_for_build(format_name, slug))
            else:
                self.respond_json(preflight_for_workflow(workflow_action, slug))
            return
        self.respond_error_json(HTTPStatus.NOT_FOUND, "Unknown endpoint.")

    def serve_static_file(self, request_path: str) -> None:
        relative = ROUTE_ALIASES.get(request_path, request_path).lstrip("/")
        if request_path.startswith("/app/book/"):
            relative = "app/book/index.html"
        elif request_path.startswith("/blog/") and request_path.rstrip("/") != "/blog":
            relative = "blog/post.html"
        elif not relative or relative == "/":
            relative = "index.html"

        file_path = (STATIC_DIR / relative).resolve()
        if file_path.is_dir():
            file_path = (file_path / "index.html").resolve()
        elif not file_path.exists() and not Path(relative).suffix:
            file_path = (STATIC_DIR / relative / "index.html").resolve()

        if not file_path.is_file() or (STATIC_DIR not in file_path.parents and file_path != STATIC_DIR / "index.html"):
            self.respond_error_json(HTTPStatus.NOT_FOUND, "Static file not found.")
            return
        self.send_file(file_path)

    def serve_workspace_file(self, relative_path: str) -> None:
        file_path = (ROOT_DIR / urllib.parse.unquote(relative_path)).resolve()
        if not file_path.is_file() or ROOT_DIR not in file_path.parents:
            self.respond_error_json(HTTPStatus.NOT_FOUND, "File not found.")
            return
        self.send_file(file_path)

    def cache_control_for_file(self, file_path: Path) -> str:
        suffix = file_path.suffix.lower()
        if STATIC_DIR in file_path.parents:
            if suffix in {".js", ".css", ".png", ".jpg", ".jpeg", ".svg", ".webp", ".ico", ".woff", ".woff2"}:
                return "public, max-age=3600, must-revalidate"
            return "public, max-age=300, must-revalidate"
        if BOOK_OUTPUTS_DIR in file_path.parents:
            if suffix in IMAGE_EXTENSIONS or suffix in {".pdf", ".epub", ".mobi", ".azw3"}:
                return "private, max-age=600, must-revalidate"
            return "private, max-age=60, must-revalidate"
        return "no-cache"

    def send_file(self, file_path: Path) -> None:
        content_type, _ = mimetypes.guess_type(file_path.name)
        stat = file_path.stat()
        cache_control = self.cache_control_for_file(file_path)
        etag = f'W/"{stat.st_mtime_ns:x}-{stat.st_size:x}"'

        if self.headers.get("If-None-Match") == etag:
            self.send_response(HTTPStatus.NOT_MODIFIED)
            self.send_header("ETag", etag)
            self.send_header("Cache-Control", cache_control)
            self.send_header("Last-Modified", self.date_time_string(stat.st_mtime))
            self.end_headers()
            return

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type or "application/octet-stream")
        self.send_header("Content-Length", str(stat.st_size))
        self.send_header("Cache-Control", cache_control)
        self.send_header("ETag", etag)
        self.send_header("Last-Modified", self.date_time_string(stat.st_mtime))
        self.end_headers()
        with file_path.open("rb") as handle:
            shutil.copyfileobj(handle, self.wfile, length=256 * 1024)

    def read_json_body(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length) if content_length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def respond_json(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def respond_error_json(self, status: HTTPStatus, message: str) -> None:
        self.respond_json({"error": message}, status=status)

    def log_message(self, format: str, *args: object) -> None:  # noqa: A003
        return


def main() -> None:
    BOOK_OUTPUTS_DIR.mkdir(exist_ok=True)
    recovery_summary = resume_interrupted_pipelines()
    if recovery_summary["preview_requeued"] or recovery_summary["full_requeued"]:
        append_log(
            "Startup recovery summary: "
            f"preview_requeued={recovery_summary['preview_requeued']} "
            f"full_requeued={recovery_summary['full_requeued']}"
        )
    ensure_pipeline_watchdog_running()
    server = ThreadingHTTPServer((HOST, PORT), DashboardHandler)
    print(f"Book dashboard running at http://{HOST}:{PORT}")

    # Setup graceful shutdown handlers
    def shutdown_handler(signum: int, frame: Any) -> None:
        print(f"\nReceived signal {signum}, shutting down gracefully...")
        stop_pipeline_watchdog(timeout=5.0)
        server.shutdown()
        shutdown_pipeline_thread_pool(wait=True, timeout=30.0)
        print("Shutdown complete")
        import sys
        sys.exit(0)

    import signal
    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nKeyboard interrupt received")
        shutdown_handler(signal.SIGINT, None)


if __name__ == "__main__":
    main()
