#!/usr/bin/env python3

from __future__ import annotations

import base64
import json
import mimetypes
import os
import re
import shlex
import shutil
import subprocess
import threading
import urllib.parse
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parent
STATIC_DIR = ROOT_DIR / "dashboard"
BOOK_OUTPUTS_DIR = ROOT_DIR / "book_outputs"
METADATA_FILE_NAME = "dashboard_meta.json"
SETTINGS_FILE_NAME = "dashboard_settings.json"
LOG_FILE_NAME = "dashboard.log"
HOST = os.environ.get("BOOK_DASHBOARD_HOST", "127.0.0.1")
PORT = int(os.environ.get("BOOK_DASHBOARD_PORT", "8765"))
PREVIEW_PIPELINE_MIN_WORDS = 900
ACTIVE_PREVIEW_PIPELINES: set[str] = set()
ACTIVE_PREVIEW_PIPELINES_LOCK = threading.Lock()
ROUTE_ALIASES = {
    "/": "index.html",
    "/kitap-olustur.html": "app/new/index.html",
    "/kullanim.html": "how-it-works/index.html",
}

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
BUILD_FORMATS = ("all", "epub", "pdf", "html", "markdown", "mobi", "azw3")
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
    "GEMINI_API_KEY": "",
    "OPENAI_API_KEY": "",
    "GROQ_API_KEY": "",
    "default_author": "Ihsan",
    "default_publisher": "Speedy Quick Publishing",
    "ollama_enabled": True,
    "ollama_base_url": "http://localhost:11434",
    "ollama_model": "llama3.2:1b",
    "cover_service": "auto",
    "cover_username": "",
    "cover_password": "",
}
SECRET_SETTING_KEYS = {
    "CODEFAST_API_KEY",
    "GEMINI_API_KEY",
    "OPENAI_API_KEY",
    "GROQ_API_KEY",
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
    return "Bölüm" if normalize_book_language(language) == "Turkish" else "Chapter"


def strip_chapter_heading(heading: str) -> str:
    return re.sub(r"^(?:Chapter|Bölüm)\s+\d+\b\s*[:.\-]?\s*", "", heading, flags=re.IGNORECASE).strip()


def normalize_structural_heading(title: str, language: str, number: int | None = None) -> str:
    chapter_label = chapter_label_for_language(language)
    cleaned = str(title or "").strip()
    cleaned = re.sub(r"^(?:Chapter|Bölüm)\s+\d+\b\s*[:.\-]?\s*", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"^(?:Chapter|Bölüm)\s+\d+\b$", "", cleaned, flags=re.IGNORECASE).strip()
    if not cleaned:
        return f"{chapter_label} {number}" if number else chapter_label
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
    return read_json_file(ROOT_DIR / SETTINGS_FILE_NAME, DEFAULT_SETTINGS)


def public_settings(settings: dict[str, Any] | None = None) -> dict[str, Any]:
    settings = (settings or read_settings()).copy()
    for key in SECRET_SETTING_KEYS:
        settings[f"has_{key}"] = bool(str(settings.get(key, "") or "").strip())
        settings[key] = ""
    return settings


def save_settings(payload: dict[str, Any]) -> dict[str, Any]:
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
    append_log("Updated dashboard settings.")
    return settings


def read_metadata(book_dir: Path) -> dict[str, Any]:
    defaults = {
        "author": read_settings()["default_author"],
        "publisher": read_settings()["default_publisher"],
        "description": "",
        "author_bio": "",
        "branding_mark": "",
        "branding_logo_url": "",
        "cover_brief": "",
        "language": "",
        "generate_cover": True,
        "cover_image": "",
        "back_cover_image": "",
        "isbn": "",
        "year": "",
        "fast": False,
        "preview_stage": "idle",
        "preview_message": "",
        "preview_error": "",
        "preview_progress": 0,
        "cover_state": "idle",
        "first_chapter_state": "idle",
        "preview_started_at": "",
        "preview_updated_at": "",
        "preview_completed_at": "",
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


def resolve_book_asset_path(book_dir: Path, relative_path: str) -> Path | None:
    if not relative_path:
        return None
    asset_path = (book_dir / relative_path).resolve()
    if not asset_path.exists() or (book_dir not in asset_path.parents and asset_path != book_dir):
        return None
    return asset_path


def chapter_body_word_count(book_dir: Path, chapter_number_value: int) -> int:
    chapter_path = book_dir / f"chapter_{chapter_number_value}_final.md"
    if not chapter_path.exists():
        return 0
    lines = chapter_path.read_text(encoding="utf-8", errors="replace").splitlines()
    content = "\n".join(lines[2:]).strip() if len(lines) >= 2 else "\n".join(lines).strip()
    return count_words(content)


def cover_asset_ready(book_dir: Path, metadata: dict[str, Any] | None = None) -> bool:
    metadata = metadata or read_metadata(book_dir)
    cover_image = str(metadata.get("cover_image") or "").strip()
    return bool(resolve_book_asset_path(book_dir, cover_image)) if cover_image else False


def first_preview_chapter_ready(book_dir: Path) -> bool:
    return chapter_body_word_count(book_dir, 1) >= PREVIEW_PIPELINE_MIN_WORDS


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


def build_generation_status(book_dir: Path, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
    metadata = metadata or read_metadata(book_dir)
    slug = book_dir.name
    cover_ready = cover_asset_ready(book_dir, metadata)
    first_chapter_ready = first_preview_chapter_ready(book_dir)
    cover_state = str(metadata.get("cover_state") or ("ready" if cover_ready else "idle")).strip()
    first_chapter_state = str(
        metadata.get("first_chapter_state") or ("ready" if first_chapter_ready else "idle")
    ).strip()
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
    topic = " ".join(
        [
            str(book.get("title") or ""),
            str(book.get("subtitle") or ""),
            str(book.get("description") or ""),
        ]
    ).lower()
    if any(keyword in topic for keyword in ("minecraft", "oyun", "game", "gaming", "grok", "ai", "yapay zeka", "teknoloji", "coding", "kod")):
        return "technology"
    if any(keyword in topic for keyword in ("çocuk", "cocuk", "kids", "children")):
        return "children"
    if any(keyword in topic for keyword in ("iş", "business", "startup", "kariyer", "career", "marketing")):
        return "business"
    return "non-fiction"


def run_preview_pipeline(slug: str) -> None:
    book_dir = BOOK_OUTPUTS_DIR / slug
    if not book_dir.exists():
        with ACTIVE_PREVIEW_PIPELINES_LOCK:
            ACTIVE_PREVIEW_PIPELINES.discard(slug)
        return

    try:
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
            first_title = "Bölüm 1"
            chapters = read_book(book_dir).get("chapters") or []
            if chapters:
                first_title = str(chapters[0].get("title") or first_title).strip() or first_title
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
                    "min_words": 1800,
                    "max_words": 2400,
                    "style": "clear",
                    "tone": "professional",
                }
            )
            if first_preview_chapter_ready(book_dir):
                save_metadata(
                    book_dir,
                    {
                        "first_chapter_state": "ready",
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
            book = read_book(book_dir)
            cover_result = run_workflow(
                {
                    "action": "cover_script",
                    "slug": slug,
                    "title": book.get("title") or slug,
                    "author": book.get("author") or read_settings()["default_author"],
                    "genre": infer_cover_genre(book),
                }
            )
            if not cover_result.get("ok") or not cover_asset_ready(book_dir):
                fallback_preflight = preflight_for_workflow("cover_local", slug)
                if fallback_preflight.get("ok"):
                    cover_result = run_workflow(
                        {
                            "action": "cover_local",
                            "slug": slug,
                            "title": book.get("title") or slug,
                            "subtitle": book.get("subtitle") or "",
                            "author": book.get("author") or read_settings()["default_author"],
                            "blurb": book.get("description") or "",
                        }
                    )
            if cover_asset_ready(book_dir):
                save_metadata(
                    book_dir,
                    {
                        "cover_state": "ready",
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
                "preview_progress": 100 if generation["product_ready"] else 78 if generation["preview_ready"] else generation["progress"],
                "preview_updated_at": now_utc_iso(),
                "preview_completed_at": now_utc_iso() if generation["preview_ready"] else "",
            },
        )
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
        return {"ok": True, "started": False, "book": read_book(book_dir), "generation": generation}

    with ACTIVE_PREVIEW_PIPELINES_LOCK:
        if slug in ACTIVE_PREVIEW_PIPELINES:
            return {"ok": True, "started": False, "book": read_book(book_dir), "generation": build_generation_status(book_dir)}
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
    worker = threading.Thread(target=run_preview_pipeline, args=(slug,), daemon=True)
    worker.start()
    return {"ok": True, "started": True, "book": read_book(book_dir), "generation": build_generation_status(book_dir)}


def resolve_shared_ai_key(settings: dict[str, Any] | None = None, env: dict[str, str] | None = None) -> str:
    settings = settings or read_settings()
    env = env or os.environ
    for key in ("CODEFAST_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY"):
        value = str(settings.get(key, "") or env.get(key, "") or "")
        if value:
            return value
    return ""


def command_env(settings: dict[str, Any] | None = None, overrides: dict[str, str] | None = None) -> dict[str, str]:
    env = os.environ.copy()
    settings = settings or read_settings()
    shared_key = resolve_shared_ai_key(settings, env)

    if shared_key:
        env["CODEFAST_API_KEY"] = shared_key
        env["codefast"] = shared_key
    else:
        env.pop("CODEFAST_API_KEY", None)
        env.pop("codefast", None)

    for key in ("GEMINI_API_KEY", "OPENAI_API_KEY", "GROQ_API_KEY", "CODEFAST_API_KEY"):
        value = str(settings.get(key, "") or env.get(key, "") or "")
        if value:
            env[key] = value
        else:
            env.pop(key, None)

    if settings.get("ollama_enabled", True):
        env["OLLAMA_DISABLED"] = "0"
        if settings.get("ollama_base_url"):
            env["OLLAMA_BASE_URL"] = str(settings["ollama_base_url"])
        if settings.get("ollama_model"):
            env["OLLAMA_PREFERRED_MODEL"] = str(settings["ollama_model"])
    else:
        env["OLLAMA_DISABLED"] = "1"

    if overrides:
        for key, value in overrides.items():
            env[key] = value
    return env


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


def read_outline_title_subtitle(path: Path | None) -> tuple[str, str]:
    if not path or not path.exists():
        return "", ""
    title = ""
    subtitle = ""
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if not title and line.startswith("# "):
            title = line[2:].strip()
        elif not subtitle and line.startswith("## "):
            subtitle = line[3:].strip()
        if title and subtitle:
            break
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
    chapter_label = chapter_label_for_language(language)
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


def build_capabilities() -> dict[str, Any]:
    pandoc_ok = shutil.which("pandoc") is not None
    pdf_engine_ok = any(shutil.which(tool) for tool in ("tectonic", "xelatex", "pdflatex"))
    calibre_ok = shutil.which("ebook-convert") is not None
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
    language = infer_book_language(book_dir, metadata, [title, subtitle, metadata.get("description", "")])
    latest_export = latest_export_dir(book_dir)
    exports = collect_exports(book_dir)

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
        "generate_cover": bool(metadata.get("generate_cover", True)),
        "cover_image": metadata.get("cover_image", ""),
        "back_cover_image": metadata.get("back_cover_image", ""),
        "isbn": metadata.get("isbn", ""),
        "year": metadata.get("year", ""),
        "fast": bool(metadata.get("fast", False)),
        "outline_file": outline_path.name if outline_path else "",
        "book_dir": relative_to_root(book_dir),
        "latest_export_dir": relative_to_root(latest_export) if latest_export else "",
        "chapters": collect_chapters(book_dir),
        "artifacts": list_files([path for path in exports if latest_export and latest_export in path.parents]),
        "resources": {
            "outline": file_entry(outline_path) if outline_path and outline_path.exists() else None,
            "assets": list_files(collect_assets(book_dir, metadata)),
            "extras": list_files(collect_extra_files(book_dir)),
            "references": list_files(collect_reference_files(book_dir)),
            "research": list_files(collect_research_files(book_dir)),
            "reports": list_files(collect_reports(book_dir)),
            "exports": list_files(exports),
        },
        "build_capabilities": build_capabilities(),
        "status": {
            "chapter_count": len(list(book_dir.glob("chapter_*_final.md"))),
            "asset_count": len(collect_assets(book_dir, metadata)),
            "extra_count": len(collect_extra_files(book_dir)),
            "research_count": len(collect_research_files(book_dir)),
            "export_count": len(exports),
            **build_generation_status(book_dir, metadata),
        },
    }


def list_books() -> list[dict[str, Any]]:
    BOOK_OUTPUTS_DIR.mkdir(exist_ok=True)
    books = []
    for book_dir in sorted((path for path in BOOK_OUTPUTS_DIR.iterdir() if path.is_dir()), key=lambda item: item.name):
        outline = find_outline_file(book_dir)
        if not outline and not list(book_dir.glob("chapter_*_final.md")):
            continue
        book = read_book(book_dir)
        books.append(
            {
                "slug": book["slug"],
                "title": book["title"],
                "subtitle": book["subtitle"],
                "author": book["author"],
                "publisher": book["publisher"],
                "branding_mark": book.get("branding_mark", ""),
                "branding_logo_url": book.get("branding_logo_url", ""),
                "cover_brief": book.get("cover_brief", ""),
                "cover_image": book.get("cover_image", ""),
                "back_cover_image": book.get("back_cover_image", ""),
                "chapter_count": len(book["chapters"]),
                "artifacts": book["artifacts"],
                "status": book["status"],
            }
        )
    return books


def write_outline(
    book_dir: Path,
    title: str,
    subtitle: str,
    chapters: list[dict[str, Any]],
    language: str = "English",
) -> Path:
    ensure_book_layout(book_dir)
    slug = slugify(title or book_dir.name)
    chapter_label = chapter_label_for_language(language)
    for old_outline in book_dir.glob("book_outline_final_*.md"):
        old_outline.unlink()
    outline_path = book_dir / f"book_outline_final_{slug}.md"
    chapter_lines = [
        f"### {chapter_label} {index}: {normalize_structural_heading(str(chapter.get('title') or ''), language, index)}"
        for index, chapter in enumerate(chapters, start=1)
    ]
    outline_content = "\n".join([f"# {title}", f"## {subtitle}" if subtitle else "##", "", *chapter_lines, ""])
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
    language = normalize_book_language(payload.get("language")) or detect_book_language(title, subtitle, description) or "English"
    default_title = "Başlangıç" if language == "Turkish" else "Getting Started"
    chapters = payload.get("chapters") or [{"title": default_title, "content": ""}]
    generate_cover = bool(payload.get("generate_cover", True))
    cover_image = str(payload.get("cover_image", "")).strip()
    back_cover_image = str(payload.get("back_cover_image", "")).strip()
    isbn = str(payload.get("isbn", "")).strip()
    year = str(payload.get("year", "")).strip()
    fast = bool(payload.get("fast", False))
    chapter_label = chapter_label_for_language(language)

    book_dir = BOOK_OUTPUTS_DIR / slug
    ensure_book_layout(book_dir)
    write_outline(book_dir, title, subtitle, chapters, language)

    kept = set()
    for index, chapter in enumerate(chapters, start=1):
        chapter_title = normalize_structural_heading(str(chapter.get("title") or ""), language, index)
        chapter_content = str(chapter.get("content") or "").strip()
        chapter_path = book_dir / f"chapter_{index}_final.md"
        chapter_path.write_text(
            f"# {chapter_label} {index}: {chapter_title}\n\n{chapter_content}\n",
            encoding="utf-8",
        )
        kept.add(chapter_path.name)

    for old_chapter in book_dir.glob("chapter_*_final.md"):
        if old_chapter.name not in kept:
            old_chapter.unlink()

    save_metadata(
        book_dir,
        {
            "author": author,
            "publisher": publisher,
            "description": description,
            "author_bio": author_bio,
            "branding_mark": branding_mark,
            "branding_logo_url": branding_logo_url,
            "cover_brief": cover_brief,
            "language": language,
            "generate_cover": generate_cover,
            "cover_image": cover_image,
            "back_cover_image": back_cover_image,
            "isbn": isbn,
            "year": year,
            "fast": fast,
        },
    )
    append_log(f"Saved book '{slug}'.")
    return read_book(book_dir)


def create_sample_book() -> dict[str, Any]:
    sample_dir = BOOK_OUTPUTS_DIR / "ornek-kitap"
    BOOK_OUTPUTS_DIR.mkdir(exist_ok=True)
    subprocess.run(
        ["bash", str(ROOT_DIR / "create_sample_book.sh"), str(sample_dir)],
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


def produced_files(book_dir: Path, before: set[str]) -> list[dict[str, Any]]:
    after = file_snapshot(book_dir)
    created = sorted(after - before)
    return [file_entry(book_dir / relative) for relative in created if (book_dir / relative).is_file()]


def run_process(
    command: list[str],
    *,
    cwd: Path,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
    append_log(f"RUN cwd={cwd} cmd={' '.join(shlex.quote(part) for part in command)}")
    result = subprocess.run(
        command,
        cwd=cwd,
        text=True,
        capture_output=True,
        encoding="utf-8",
        errors="replace",
        env=env,
    )
    append_log(f"EXIT {result.returncode}")
    return result


def has_any_ai_provider(settings: dict[str, Any] | None = None) -> bool:
    settings = settings or read_settings()
    if resolve_shared_ai_key(settings):
        return True
    return bool(settings.get("ollama_enabled", True) and shutil.which("ollama"))


def preflight_for_build(format_name: str) -> dict[str, Any]:
    capabilities = build_capabilities()
    if format_name not in capabilities:
        raise ValueError("Unsupported format.")
    warnings: list[str] = []
    capability = capabilities[format_name]
    if format_name == "all" and not shutil.which("ebook-convert"):
        warnings.append("ebook-convert missing: mobi/azw3 conversions may be unavailable in all-in-one builds.")
    return {
        "ok": bool(capability["available"]),
        "warnings": warnings,
        "capabilities": capabilities,
        "reason": capability["reason"],
    }


def build_book(slug: str, payload: dict[str, Any]) -> dict[str, Any]:
    if not slug:
        raise ValueError("Book slug is required.")
    book_dir = BOOK_OUTPUTS_DIR / slug
    if not book_dir.exists():
        raise FileNotFoundError("Book directory not found.")

    format_name = str(payload.get("format") or "epub").strip().lower()
    preflight = preflight_for_build(format_name)
    if not preflight["ok"]:
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
    generate_cover = bool(payload.get("generate_cover", metadata.get("generate_cover", True)))
    cover_image = str(payload.get("cover_image") or metadata.get("cover_image") or "").strip()
    back_cover_image = str(payload.get("back_cover_image") or metadata.get("back_cover_image") or "").strip()
    isbn = str(payload.get("isbn") or metadata.get("isbn") or "").strip()
    year = str(payload.get("year") or metadata.get("year") or "").strip()
    fast = bool(payload.get("fast", metadata.get("fast", False)))

    save_metadata(
        book_dir,
        {
            "author": author,
            "publisher": publisher,
            "author_bio": author_bio,
            "branding_mark": branding_mark,
            "branding_logo_url": branding_logo_url,
            "cover_brief": cover_brief,
            "generate_cover": generate_cover,
            "cover_image": cover_image,
            "back_cover_image": back_cover_image,
            "isbn": isbn,
            "year": year,
            "fast": fast,
        },
    )

    command = [
        "bash",
        str(ROOT_DIR / "compile_book.sh"),
        str(book_dir),
        format_name,
        "3",
        "--author",
        author,
        "--publisher",
        publisher,
    ]
    if generate_cover:
        command.append("--generate-cover")
    elif cover_image:
        command.extend(["--cover", str(book_dir / cover_image)])
    if back_cover_image:
        command.extend(["--backcover", str(book_dir / back_cover_image)])
    if isbn:
        command.extend(["--isbn", isbn])
    if year:
        command.extend(["--year", year])
    if fast:
        command.append("--fast")

    before = file_snapshot(book_dir)
    result = run_process(command, cwd=ROOT_DIR, env=command_env())
    sync_extra_files(book_dir)
    return {
        "ok": result.returncode == 0,
        "action": "build",
        "returncode": result.returncode,
        "output": (result.stdout or "") + (result.stderr or ""),
        "warnings": preflight["warnings"],
        "produced_files": produced_files(book_dir, before),
        "preflight": preflight,
        "book": read_book(book_dir),
    }


def run_dashboard_action(*args: str, env_overrides: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    return run_process(
        ["bash", str(ROOT_DIR / "dashboard_actions.sh"), *args],
        cwd=ROOT_DIR,
        env=command_env(overrides=env_overrides),
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
    warnings: list[str] = []
    missing: list[str] = []
    ok = True
    needs_ai = {
        "topic_suggest",
        "outline_suggest",
        "outline_generate",
        "chapter_generate",
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
        missing.append("No AI provider configured. Add Gemini/Groq/OpenAI key or enable Ollama.")

    if action == "research_insights":
        if not shutil.which("python3"):
            ok = False
            missing.append("python3 is missing.")
        if slug:
            book_dir = BOOK_OUTPUTS_DIR / slug
            if book_dir.exists() and not collect_strategy_research_files(book_dir):
                ok = False
                missing.append("No research result found yet. Run KDP analysis, keyword research, or topic finder first.")

    if action == "cover_local" and not any(shutil.which(tool) for tool in ("magick", "convert")):
        ok = False
        missing.append("ImageMagick is missing.")

    if action == "cover_script":
        if not shutil.which("jq"):
            ok = False
            missing.append("jq is missing.")
        if not shutil.which("python3"):
            ok = False
            missing.append("python3 is missing.")
        if not shutil.which("playwright"):
            warnings.append("playwright command not found. The script may install it on first run.")

    if action == "topic_finder" and not shutil.which("xmllint"):
        ok = False
        missing.append("xmllint is missing.")

    if action == "keyword_research" and not shutil.which("jq"):
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
            ["bash", str(ROOT_DIR / "multi_provider_ai_simple.sh"), "status"],
            cwd=ROOT_DIR,
            env=command_env(),
        )
        return workflow_result(action, result, None, preflight)

    if action == "provider_test":
        result = run_process(
            ["bash", str(ROOT_DIR / "multi_provider_ai_simple.sh"), "test"],
            cwd=ROOT_DIR,
            env=command_env(),
        )
        return workflow_result(action, result, None, preflight)

    if action == "custom_command":
        raw_command = str(payload.get("command") or "").strip()
        if not raw_command:
            raise ValueError("Custom command is required.")
        shell_command = (
            f"cd {shlex.quote(str(ROOT_DIR))} && "
            f"source {shlex.quote(str(ROOT_DIR / 'book-generator-env.sh'))} && "
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
        chapter_label = chapter_label_for_language(language)
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
        result = run_dashboard_action(
            "topic-suggest",
            topic,
            str(payload.get("audience") or "general readers"),
            str(payload.get("category") or "non-fiction"),
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

    before = file_snapshot(book_dir)

    if action == "chapter_generate":
        book_language = infer_book_language(book_dir, read_metadata(book_dir))
        result = run_dashboard_action(
            "chapter-generate",
            str(book_dir),
            str(payload.get("chapter_number") or 1),
            str(payload.get("chapter_title") or ("Yeni Bölüm" if book_language == "Turkish" else "New Chapter")),
            str(payload.get("min_words") or 1800),
            str(payload.get("max_words") or 2400),
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
        result = run_dashboard_action(
            "cover-local",
            str(book_dir),
            str(payload.get("title") or read_book(book_dir)["title"]),
            str(payload.get("subtitle") or read_book(book_dir)["subtitle"]),
            str(payload.get("author") or metadata["author"]),
            str(payload.get("blurb") or metadata["description"]),
        )
    elif action == "cover_script":
        settings = read_settings()
        metadata = read_metadata(book_dir)
        result = run_dashboard_action(
            "cover-script-run",
            str(book_dir),
            str(payload.get("mode") or "generate"),
            str(payload.get("service") or settings["cover_service"]),
            str(payload.get("username") or settings["cover_username"]),
            str(payload.get("password") or settings["cover_password"]),
            str(payload.get("title") or read_book(book_dir)["title"]),
            str(payload.get("author") or metadata["author"]),
            str(payload.get("genre") or "non-fiction"),
        )
    elif action == "market_init":
        result = run_dashboard_action("market-init", str(book_dir))
    elif action == "market_search":
        topic = str(payload.get("topic") or read_book(book_dir)["title"]).strip()
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
        topic = str(payload.get("topic") or read_book(book_dir)["title"]).strip()
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
        focus = str(payload.get("focus") or payload.get("topic") or read_book(book_dir)["title"]).strip()
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
                "cover_image": "assets/generated_front_cover.png",
                "back_cover_image": "assets/generated_back_cover.png",
            },
        )
        response["book"] = read_book(book_dir)
    if action == "cover_script" and result.returncode == 0:
        assets = collect_assets(book_dir, read_metadata(book_dir))
        front = next((path for path in assets if path.name.startswith("ai_front_cover")), None)
        back = next((path for path in assets if path.name.startswith("ai_back_cover")), None)
        updates: dict[str, str] = {}
        if front:
            updates["cover_image"] = f"assets/{front.name}"
        if back:
            updates["back_cover_image"] = f"assets/{back.name}"
        if updates:
            save_metadata(book_dir, updates)
            response["book"] = read_book(book_dir)
        elif not response["warnings"]:
            response["warnings"] = ["Browser automation started, but no downloaded cover file was detected yet."]
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
                self.respond_json({"ok": True, "host": HOST, "port": PORT, "time": now_iso()})
                return
            if path == "/api/books":
                self.respond_json({"books": list_books()})
                return
            if path == "/api/settings":
                self.respond_json(public_settings())
                return
            if path == "/api/logs":
                limit = int(query.get("limit", ["400"])[0])
                self.respond_json({"lines": read_log_lines(limit)})
                return
            if path.startswith("/api/books/"):
                self.handle_book_get(path, query)
                return
            if path.startswith("/workspace/"):
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
        try:
            payload = self.read_json_body()
            if parsed.path == "/api/books":
                self.respond_json(save_book(payload))
                return
            if parsed.path == "/api/books/sample":
                self.respond_json(create_sample_book())
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
            self.respond_json(build_book_preview(read_book(book_dir)))
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
                self.respond_json(preflight_for_build(format_name))
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

    def send_file(self, file_path: Path) -> None:
        content_type, _ = mimetypes.guess_type(file_path.name)
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type or "application/octet-stream")
        self.send_header("Content-Length", str(file_path.stat().st_size))
        self.end_headers()
        self.wfile.write(file_path.read_bytes())

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
    server = ThreadingHTTPServer((HOST, PORT), DashboardHandler)
    print(f"Book dashboard running at http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
