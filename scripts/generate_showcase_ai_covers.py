#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import difflib
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
import unicodedata
from pathlib import Path
from typing import Any

import requests
from requests import Response


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "showcase-portfolio.json"
BOOK_OUTPUTS_DIR = ROOT / "book_outputs"
SCORER_SCRIPT = ROOT / "scripts" / "score_cover_art.mjs"
COMPOSER_SCRIPT = ROOT / "scripts" / "compose_cover_bundle.mjs"
PROCEDURAL_ART_SCRIPT = ROOT / "scripts" / "render_procedural_cover_art.mjs"
DEFAULT_ENV_FILES = [
    ROOT / ".env.codefast.local",
    ROOT / "web" / ".env.local",
    ROOT / "web" / ".env",
]
LEGACY_KEY_NAMES = ("CODEFAST_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY")
VERTEX_API_KEY_NAMES = ("GOOGLE_API_KEY", "VERTEX_API_KEY", "GOOGLE_GENAI_API_KEY")
VERTEX_PROJECT_NAMES = ("GOOGLE_CLOUD_PROJECT", "GOOGLE_PROJECT_ID", "VERTEX_PROJECT_ID")
VERTEX_LOCATION_NAMES = ("GOOGLE_CLOUD_LOCATION", "VERTEX_LOCATION")
GROK_IMAGE_URL = "https://grokapi.codefast.app/v1/images/generations"
GROK_HISTORY_URL = "https://grokapi.codefast.app/v1/history?page=1&per_page=10"
NANO_IMAGE_URL = "https://geminiapi.codefast.app/v1/image"
NANO_STATUS_URL = "https://geminiapi.codefast.app/v1/image/status"
VERTEX_IMAGEN_URL_TEMPLATE = "https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/{model}:predict?key={api_key}"
VERTEX_GEMINI_IMAGE_URL_TEMPLATE = "https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent?key={api_key}"
VERTEX_GEMINI_TEXT_URL_TEMPLATE = "https://aiplatform.googleapis.com/v1/publishers/google/models/{model}:generateContent?key={api_key}"
NANO_MODELS = {
    "nano-banana-pro": "gemini-3.0-pro",
    "nano-banana-2": "gemini-3.1-flash",
}
VERTEX_IMAGEN_MODELS = {
    "vertex-imagen-fast": {
        "model": "imagen-4.0-fast-generate-001",
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "3:4",
            "sampleImageSize": "1K",
            "language": "en",
            "personGeneration": "allow_adult",
            "safetySetting": "block_medium_and_above",
            "addWatermark": True,
            "enhancePrompt": False,
            "outputOptions": {"mimeType": "image/png"},
        },
    },
    "vertex-imagen-standard": {
        "model": "imagen-4.0-generate-001",
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "3:4",
            "sampleImageSize": "1K",
            "language": "en",
            "personGeneration": "allow_adult",
            "safetySetting": "block_medium_and_above",
            "addWatermark": True,
            "enhancePrompt": True,
            "outputOptions": {"mimeType": "image/png"},
        },
    },
    "vertex-imagen-ultra": {
        "model": "imagen-4.0-ultra-generate-001",
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "3:4",
            "sampleImageSize": "1K",
            "language": "en",
            "personGeneration": "allow_adult",
            "safetySetting": "block_medium_and_above",
            "addWatermark": True,
            "enhancePrompt": True,
            "outputOptions": {"mimeType": "image/png"},
        },
    },
}
SERVICE_CHOICES = (
    "auto",
    "vertex-imagen-standard",
    "vertex-imagen-ultra",
    "vertex-gemini-flash-image",
    "vertex-imagen-fast",
    "grok-imagine",
    "nano-banana-pro",
    "nano-banana-2",
)
AI_TEXT_ALLOWED_LANGUAGES = {"English", "Spanish", "Portuguese", "Italian", "Dutch"}
AI_TEXT_HYBRID_TITLE_MAX = 42
AI_TEXT_HYBRID_SUBTITLE_MAX = 40
AI_TEXT_MINIMAL_TITLE_MAX = 48
AI_TEXT_AUTHOR_MAX = 24
AI_TEXT_TITLE_MIN_SCORE = 0.8
AI_TEXT_SUBTITLE_MIN_SCORE = 0.72
AI_TEXT_AUTHOR_MIN_SCORE = 0.68
AI_TEXT_OCR_MODEL = "gemini-2.5-flash-lite"
AI_TEXT_OCR_TIMEOUT = 120
AI_TEXT_MAX_ATTEMPTS = 3
VARIANT_COUNT = 3
POLL_ATTEMPTS = 24
POLL_INTERVAL_SECONDS = 4
COVER_LAB_VERSION = "genre-matrix-v3"
try:
    MAX_ART_ATTEMPTS_PER_VARIANT = max(1, int(os.environ.get("SHOWCASE_MAX_ART_ATTEMPTS", "8")))
except ValueError:
    MAX_ART_ATTEMPTS_PER_VARIANT = 8
TEXT_RISK_REJECT_THRESHOLD = 24.0
TEXT_RISK_REUSE_THRESHOLD = 18.0
GENRE_MATRIX: dict[str, dict[str, Any]] = {
    "business-marketing": {
        "branch": "nonfiction",
        "label": "Business & Marketing",
        "families": (
            {
                "id": "commercial-bold",
                "label": "Commercial Bold",
                "art_variant": 1,
                "template": "business-playbook",
                "titleTone": "sharp",
                "frameStyle": "brass-rail",
                "baseMotif": "folio",
                "artDirection": "commercial bookstore clarity, bold negative space, and decisive nonfiction confidence",
            },
            {
                "id": "executive-premium",
                "label": "Executive Premium",
                "art_variant": 2,
                "template": "executive-minimal",
                "titleTone": "classic",
                "frameStyle": "double-line",
                "baseMotif": "pillars",
                "artDirection": "premium executive polish, controlled elegance, and quieter authority",
            },
            {
                "id": "clean-signal",
                "label": "Clean Signal",
                "art_variant": 3,
                "template": "business-playbook",
                "titleTone": "sharp",
                "frameStyle": "double-line",
                "baseMotif": "grid",
                "artDirection": "modern signal-led structure, cleaner systems energy, and sharp visual discipline",
            },
        ),
        "paletteKeys": ("amber-ledger", "ink-copper", "slate-gold", "ivory-graphite"),
        "layoutKeys": ("slab-left", "slab-right", "stack-center", "rail-right"),
    },
    "expertise-authority": {
        "branch": "nonfiction",
        "label": "Expertise & Authority",
        "families": (
            {
                "id": "authority-serif",
                "label": "Authority Serif",
                "art_variant": 1,
                "template": "expertise-authority",
                "titleTone": "classic",
                "frameStyle": "double-line",
                "baseMotif": "folio",
                "artDirection": "editorial credibility, literary premium pacing, and authority-book confidence",
            },
            {
                "id": "method-ledger",
                "label": "Method Ledger",
                "art_variant": 2,
                "template": "business-playbook",
                "titleTone": "sharp",
                "frameStyle": "brass-rail",
                "baseMotif": "seal",
                "artDirection": "structured frameworks, ledger-like order, and method-driven commercial clarity",
            },
            {
                "id": "modern-mentor",
                "label": "Modern Mentor",
                "art_variant": 3,
                "template": "executive-minimal",
                "titleTone": "classic",
                "frameStyle": "corner-bracket",
                "baseMotif": "beams",
                "artDirection": "premium guidance, warm authority, and contemporary expert positioning",
            },
        ),
        "paletteKeys": ("plum-seal", "brass-ledger", "ink-parchment", "emerald-ink"),
        "layoutKeys": ("folio-left", "inset-center", "ledger-right", "mentor-center"),
    },
    "ai-systems": {
        "branch": "nonfiction",
        "label": "AI & Systems",
        "families": (
            {
                "id": "signal-grid",
                "label": "Signal Grid",
                "art_variant": 1,
                "template": "business-playbook",
                "titleTone": "sharp",
                "frameStyle": "double-line",
                "baseMotif": "grid",
                "artDirection": "precise signal geometry, modular clarity, and confident systems thinking",
            },
            {
                "id": "interface-depth",
                "label": "Interface Depth",
                "art_variant": 2,
                "template": "executive-minimal",
                "titleTone": "sharp",
                "frameStyle": "brass-rail",
                "baseMotif": "interface",
                "artDirection": "layered interface depth, luminous pathways, and high-end operational precision",
            },
            {
                "id": "calm-tech",
                "label": "Calm Tech",
                "art_variant": 3,
                "template": "personal-growth",
                "titleTone": "classic",
                "frameStyle": "corner-bracket",
                "baseMotif": "horizon",
                "artDirection": "calmer technology atmosphere, spacious focus, and premium modern restraint",
            },
        ),
        "paletteKeys": ("signal-cyan", "deep-indigo", "glass-blue", "quiet-steel"),
        "layoutKeys": ("grid-left", "interface-right", "stack-center", "tech-lower"),
    },
    "education": {
        "branch": "nonfiction",
        "label": "Education",
        "families": (
            {
                "id": "workbook-clear",
                "label": "Workbook Clear",
                "art_variant": 1,
                "template": "education-workbook",
                "titleTone": "sharp",
                "frameStyle": "double-line",
                "baseMotif": "orbit",
                "artDirection": "clear instructional structure, teaching confidence, and approachable professional warmth",
            },
            {
                "id": "instructor-premium",
                "label": "Instructor Premium",
                "art_variant": 2,
                "template": "expertise-authority",
                "titleTone": "classic",
                "frameStyle": "double-line",
                "baseMotif": "folio",
                "artDirection": "premium educator authority, polished teaching credibility, and refined guidance",
            },
            {
                "id": "curious-learning",
                "label": "Curious Learning",
                "art_variant": 3,
                "template": "narrative-story",
                "titleTone": "classic",
                "frameStyle": "corner-bracket",
                "baseMotif": "tactile-learning",
                "artDirection": "curious discovery, tactile learning forms, and warmer educational invitation",
            },
        ),
        "paletteKeys": ("paper-saffron", "classroom-teal", "curious-coral", "studio-ochre"),
        "layoutKeys": ("panel-left", "workbook-stack", "learning-right", "soft-center"),
    },
    "personal-development": {
        "branch": "nonfiction",
        "label": "Personal Development",
        "families": (
            {
                "id": "calm-focus",
                "label": "Calm Focus",
                "art_variant": 1,
                "template": "personal-growth",
                "titleTone": "classic",
                "frameStyle": "soft-double",
                "baseMotif": "horizon",
                "artDirection": "quiet focus, atmospheric calm, and premium emotional spaciousness",
            },
            {
                "id": "soft-discipline",
                "label": "Soft Discipline",
                "art_variant": 2,
                "template": "executive-minimal",
                "titleTone": "sharp",
                "frameStyle": "corner-bracket",
                "baseMotif": "soft-geometry",
                "artDirection": "disciplined execution with warmer restraint, cleaner edges, and steady energy",
            },
            {
                "id": "elevated-reset",
                "label": "Elevated Reset",
                "art_variant": 3,
                "template": "narrative-story",
                "titleTone": "classic",
                "frameStyle": "glow-rail",
                "baseMotif": "atmospheric-light",
                "artDirection": "reflective premium reset, emotive light, and refined self-renewal energy",
            },
        ),
        "paletteKeys": ("dawn-sand", "quiet-mauve", "sage-haze", "amber-dusk"),
        "layoutKeys": ("band-center", "horizon-left", "glow-center", "quiet-right"),
    },
    "children-illustrated": {
        "branch": "children",
        "label": "Children & Illustrated",
        "families": (
            {
                "id": "storyworld",
                "label": "Storyworld",
                "art_variant": 1,
                "template": "children-storyworld",
                "titleTone": "playful",
                "frameStyle": "storybook-soft",
                "baseMotif": "storybook-scene",
                "artDirection": "storybook warmth, rounded shapes, gentle wonder, and child-safe emotional tone",
            },
            {
                "id": "learning-adventure",
                "label": "Learning Adventure",
                "art_variant": 2,
                "template": "children-learning",
                "titleTone": "playful",
                "frameStyle": "play-panel",
                "baseMotif": "playful-arc",
                "artDirection": "playful learning energy, bright curiosity, and friendly exploratory motion",
            },
            {
                "id": "bedtime-calm",
                "label": "Bedtime Calm",
                "art_variant": 3,
                "template": "children-bedtime",
                "titleTone": "playful",
                "frameStyle": "soft-double",
                "baseMotif": "bedtime-arc",
                "artDirection": "pastel calm, soft storybook safety, and dreamy reassuring stillness",
            },
        ),
        "paletteKeys": ("sunny-story", "meadow-play", "berry-soft", "twilight-dream"),
        "layoutKeys": ("storybook-top", "playful-center", "bedtime-bottom", "scene-left"),
    },
}
FAMILY_LOOKUP = {
    family["id"]: {**family, "genre": genre_key, "branch": genre_config["branch"], "genreLabel": genre_config["label"]}
    for genre_key, genre_config in GENRE_MATRIX.items()
    for family in genre_config["families"]
}


def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if key.startswith("export "):
            key = key[len("export ") :].strip()
        value = value.strip()
        if not key or key in os.environ:
            continue
        if value and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        os.environ[key] = value


def resolve_env_value(*candidate_names: str) -> str:
    for name in candidate_names:
        value = os.environ.get(name, "").strip()
        if value:
            return value
    return ""


def resolve_api_key() -> str:
    for env_path in DEFAULT_ENV_FILES:
        load_env_file(env_path)
    for names in (VERTEX_API_KEY_NAMES, LEGACY_KEY_NAMES):
        for name in names:
            value = os.environ.get(name, "").strip()
            if value:
                return value
    raise SystemExit("No cover API key found in environment or local env files.")


def resolve_legacy_api_key() -> str:
    for env_path in DEFAULT_ENV_FILES:
        load_env_file(env_path)
    return resolve_env_value(*LEGACY_KEY_NAMES)


def resolve_vertex_config() -> dict[str, str] | None:
    for env_path in DEFAULT_ENV_FILES:
        load_env_file(env_path)
    api_key = resolve_env_value(*VERTEX_API_KEY_NAMES)
    project = resolve_env_value(*VERTEX_PROJECT_NAMES)
    location = resolve_env_value(*VERTEX_LOCATION_NAMES) or "us-central1"
    if not api_key or not project:
        return None
    return {
        "api_key": api_key,
        "project": project,
        "location": location,
    }


def load_manifest() -> list[dict[str, Any]]:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


SHOWCASE_GENRE_ORDER_CACHE: dict[str, dict[str, int]] = {}


def cover_haystack(entry: dict[str, Any]) -> str:
    return " ".join(
        str(entry.get(key) or "")
        for key in (
            "title",
            "subtitle",
            "summary",
            "topic",
            "category",
            "type",
            "audience",
            "promise",
            "coverBrief",
            "coverPrompt",
            "toneArchetype",
            "book_type",
            "bookType",
            "coverBranch",
            "coverGenre",
            "coverSubtopic",
        )
    ).lower()


def explicit_string(entry: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = str(entry.get(key) or "").strip()
        if value:
            return value
    return ""


def haystack_has(haystack: str, keyword: str) -> bool:
    if " " in keyword or any(char in keyword for char in "çğıöşüÇĞİÖŞÜ-"):
        return keyword.lower() in haystack
    return re.search(rf"(?<!\w){re.escape(keyword.lower())}(?!\w)", haystack, flags=re.IGNORECASE) is not None


def hash_index(*parts: str, modulo: int) -> int:
    if not modulo:
        return 0
    seed = "|".join(parts).encode("utf-8")
    return int(hashlib.sha256(seed).hexdigest()[:8], 16) % modulo


def infer_cover_branch(entry: dict[str, Any]) -> str:
    explicit = explicit_string(entry, "coverBranch", "cover_branch")
    if explicit in {"children", "nonfiction"}:
        return explicit
    haystack = cover_haystack(entry)
    book_type = explicit_string(entry, "book_type", "bookType", "type").lower()
    if book_type == "cocuk":
        return "children"
    category_or_type = f"{explicit_string(entry, 'category')} {explicit_string(entry, 'type')}".lower()
    if any(marker in category_or_type for marker in ("children", "çocuk", "cocuk")):
        return "children"
    child_markers = ("storybook", "picture book", "bedtime", "masal", "resimli hikaye", "illustrated tale", "fairy tale")
    if any(marker in haystack for marker in child_markers):
        return "children"
    return "nonfiction"


def infer_cover_genre(entry: dict[str, Any], branch: str | None = None) -> str:
    explicit = explicit_string(entry, "coverGenre", "cover_genre").lower()
    if explicit in GENRE_MATRIX:
        return explicit

    branch = branch or infer_cover_branch(entry)
    if branch == "children":
        return "children-illustrated"

    category = str(entry.get("category") or "").lower()
    if "business" in category or "creator" in category or "marketing" in category or "leadership" in category:
        return "business-marketing"
    if "expertise" in category or "uzman" in category:
        return "expertise-authority"
    if "ai workflow" in category:
        return "ai-systems"
    if "education" in category:
        return "education"
    if "personal" in category or "kişisel" in category:
        return "personal-development"
    haystack = cover_haystack(entry)
    if any(
        haystack_has(haystack, marker) for marker in ("ai", "workflow", "prompt", "automation", "system", "sistem", "nizam")
    ):
        return "ai-systems"
    if any(
        haystack_has(haystack, marker) for marker in ("training", "teach", "teacher", "stem", "course", "workbook", "öğret", "egitim", "ensenar", "formateur")
    ):
        return "education"
    if any(
        haystack_has(haystack, marker) for marker in ("focus", "discipline", "calm", "ritme", "clarte", "ruhe")
    ):
        return "personal-development"
    if any(
        haystack_has(haystack, marker) for marker in ("authority", "uzman", "method", "mentor", "consultant", "autorit")
    ):
        return "expertise-authority"
    return "business-marketing"


def infer_cover_subtopic(entry: dict[str, Any], genre: str | None = None, branch: str | None = None) -> str:
    explicit = explicit_string(entry, "coverSubtopic", "cover_subtopic")
    if explicit:
        return explicit

    branch = branch or infer_cover_branch(entry)
    genre = genre or infer_cover_genre(entry, branch)
    haystack = cover_haystack(entry)

    if branch == "children":
        if any(marker in haystack for marker in ("bedtime", "sleep", "night", "uyku", "moon", "dream")):
            return "bedtime"
        if any(marker in haystack for marker in ("learn", "learning", "stem", "activity", "count", "alphabet", "parent", "school", "öğren")):
            return "learning"
        return "storyworld"

    if genre == "business-marketing":
        if any(marker in haystack for marker in ("marketing", "offer", "positioning", "demand", "creator")):
            return "marketing"
        if any(marker in haystack for marker in ("leadership", "manager", "team lead", "remote", "fuhrung")):
            return "leadership"
        if any(marker in haystack for marker in ("system", "ops", "operations", "handoff", "agency", "team")):
            return "operations"
        return "growth"

    if genre == "expertise-authority":
        if any(marker in haystack for marker in ("method", "framework", "sistem", "metodo", "méthode", "metodo")):
            return "method"
        if any(marker in haystack for marker in ("mentor", "guide", "coach", "trainer", "formateur", "eğitmen")):
            return "mentor"
        return "authority"

    if genre == "ai-systems":
        if any(marker in haystack for marker in ("team", "agency", "small teams", "ops leads", "operator")):
            return "team-systems"
        if any(marker in haystack for marker in ("productivity", "focus", "deep work", "odak")):
            return "productivity"
        if any(marker in haystack for marker in ("small business", "negocios pequenos", "küçük", "business")):
            return "small-business"
        return "systems"

    if genre == "education":
        if any(marker in haystack for marker in ("stem", "science", "math", "home")):
            return "stem"
        if any(marker in haystack for marker in ("parent", "family", "evde", "home")):
            return "family-learning"
        if any(marker in haystack for marker in ("workshop", "teacher", "trainer", "formateur", "facilitator")):
            return "instruction"
        return "learning"

    if any(marker in haystack for marker in ("focus", "deep work", "odak", "attention")):
        return "focus"
    if any(marker in haystack for marker in ("discipline", "ritim", "ritme", "cadence", "habit")):
        return "discipline"
    if any(marker in haystack for marker in ("energy", "reset", "rest", "clarte", "calm", "ruhe")):
        return "reset"
    return "focus"


def normalized_cover_entry(entry: dict[str, Any]) -> dict[str, Any]:
    enriched = dict(entry)
    branch = infer_cover_branch(enriched)
    genre = infer_cover_genre(enriched, branch)
    subtopic = infer_cover_subtopic(enriched, genre, branch)
    enriched["coverBranch"] = branch
    enriched["coverGenre"] = genre
    enriched["coverSubtopic"] = subtopic
    return enriched


def showcase_genre_position(entry: dict[str, Any], genre: str) -> int | None:
    slug = str(entry.get("slug") or "")
    if not slug:
        return None
    cached = SHOWCASE_GENRE_ORDER_CACHE.get(genre)
    if cached is None:
        cached = {}
        index = 0
        for raw in load_manifest():
            normalized = normalized_cover_entry(raw)
            if normalized.get("coverGenre") != genre:
                continue
            cached[str(normalized.get("slug") or "")] = index
            index += 1
        SHOWCASE_GENRE_ORDER_CACHE[genre] = cached
    return cached.get(slug)


def genre_config_for_entry(entry: dict[str, Any]) -> dict[str, Any]:
    return GENRE_MATRIX[infer_cover_genre(entry, infer_cover_branch(entry))]


def families_for_entry(entry: dict[str, Any]) -> tuple[dict[str, Any], ...]:
    return tuple(genre_config_for_entry(entry)["families"])


def family_by_id(family_id: str) -> dict[str, Any]:
    return FAMILY_LOOKUP.get(family_id, next(iter(FAMILY_LOOKUP.values())))


def palette_key_for_variant(entry: dict[str, Any], family: dict[str, Any]) -> str:
    explicit = explicit_string(entry, "coverPaletteKey", "cover_palette_key")
    if explicit:
        return explicit
    genre = infer_cover_genre(entry, infer_cover_branch(entry))
    palette_keys = tuple(GENRE_MATRIX[genre]["paletteKeys"])
    ordinal = showcase_genre_position(entry, genre)
    if ordinal is None:
        choice = hash_index(str(entry.get("slug") or ""), family["id"], genre, modulo=len(palette_keys))
    else:
        choice = (ordinal + int(family.get("art_variant") or 1) - 1) % len(palette_keys)
    return palette_keys[choice]


def layout_key_for_variant(entry: dict[str, Any], family: dict[str, Any]) -> str:
    explicit = explicit_string(entry, "coverLayoutKey", "cover_layout_key")
    if explicit:
        return explicit
    genre = infer_cover_genre(entry, infer_cover_branch(entry))
    layout_keys = tuple(GENRE_MATRIX[genre]["layoutKeys"])
    title = str(entry.get("title") or "")
    long_title_bias = 1 if len(title) > 32 or str(entry.get("languageCode") or "") in {"Arabic", "Japanese", "German", "Turkish"} else 0
    ordinal = showcase_genre_position(entry, genre)
    if ordinal is None:
        choice = hash_index(str(entry.get("slug") or ""), family["id"], genre, modulo=len(layout_keys))
    else:
        choice = (ordinal * 2 + int(family.get("art_variant") or 1) - 1) % len(layout_keys)
    choice = (choice + long_title_bias) % len(layout_keys)
    return layout_keys[choice]


def preferred_zone_for_layout(layout_key: str, fallback_zone: str = "") -> str:
    mapping = {
        "slab-left": "top-left",
        "folio-left": "top-left",
        "panel-left": "top-left",
        "scene-left": "lower-left",
        "slab-right": "top-right",
        "rail-right": "top-right",
        "ledger-right": "lower-right",
        "learning-right": "top-right",
        "interface-right": "top-right",
        "stack-center": "center",
        "mentor-center": "center",
        "workbook-stack": "center",
        "soft-center": "center",
        "glow-center": "center",
        "band-center": "center",
        "playful-center": "center",
        "storybook-top": "top-left",
        "bedtime-bottom": "lower-left",
        "tech-lower": "lower-right",
        "horizon-left": "lower-left",
        "quiet-right": "lower-right",
        "inset-center": "center",
    }
    return mapping.get(layout_key, fallback_zone)


def motif_for_variant(entry: dict[str, Any], family: dict[str, Any]) -> str:
    branch = infer_cover_branch(entry)
    genre = infer_cover_genre(entry, branch)
    subtopic = infer_cover_subtopic(entry, genre, branch)
    if branch == "children":
        if subtopic == "bedtime":
            return "bedtime-arc"
        if subtopic == "learning":
            return "playful-arc" if family["id"] != "storyworld" else "tactile-learning"
        return "storybook-scene"

    if genre == "business-marketing":
        return {"marketing": "signal", "leadership": "pillars", "operations": "grid", "growth": family["baseMotif"]}.get(subtopic, family["baseMotif"])
    if genre == "expertise-authority":
        return {"method": "seal", "mentor": "beams", "authority": "folio"}.get(subtopic, family["baseMotif"])
    if genre == "ai-systems":
        return {"systems": "grid", "team-systems": "interface", "productivity": "horizon", "small-business": "beams"}.get(subtopic, family["baseMotif"])
    if genre == "education":
        return {"stem": "orbit", "family-learning": "tactile-learning", "instruction": "folio", "learning": "orbit"}.get(subtopic, family["baseMotif"])
    return {"focus": "horizon", "discipline": "soft-geometry", "reset": "atmospheric-light"}.get(subtopic, family["baseMotif"])


def template_hint_for_variant(entry: dict[str, Any], family: dict[str, Any]) -> str:
    explicit = explicit_string(entry, "coverTemplateHint")
    if explicit:
        return explicit
    return str(family.get("template") or "business-playbook")


def title_tone_for_variant(entry: dict[str, Any], family: dict[str, Any]) -> str:
    explicit = explicit_string(entry, "titleTone")
    if explicit:
        return explicit
    language = str(entry.get("languageCode") or "")
    if language == "Japanese":
        return "cjk"
    if language == "Arabic":
        return "rtl"
    return str(family.get("titleTone") or "classic")


def cover_hierarchy_for_variant(entry: dict[str, Any], family: dict[str, Any]) -> str:
    explicit = explicit_string(entry, "coverHierarchy")
    if explicit:
        return explicit
    branch = infer_cover_branch(entry)
    genre = infer_cover_genre(entry, branch)
    if branch == "children":
        return "title-scene-author"
    if genre == "personal-development":
        return "title-subtitle-emotive"
    if genre == "ai-systems":
        return "title-first"
    if genre == "expertise-authority":
        return "title-author-seal"
    return "title-first"


def normalize_service(service: str, entry: dict[str, Any] | None = None) -> list[str]:
    if service != "auto":
        return [service]
    providers = ["vertex-imagen-standard", "vertex-imagen-ultra"]
    if entry:
        normalized = normalized_cover_entry(entry)
        branch = infer_cover_branch(normalized)
        genre = infer_cover_genre(normalized, branch)
        if branch == "children" or genre == "education":
            providers.append("vertex-gemini-flash-image")
    providers.extend(["grok-imagine", "nano-banana-pro", "nano-banana-2"])
    return providers


def normalize_compare_text(value: str) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = text.casefold()
    text = re.sub(r"[^a-z0-9\\s]", " ", text)
    return re.sub(r"\\s+", " ", text).strip()


def compare_text_score(expected: str, observed: str) -> float:
    expected_norm = normalize_compare_text(expected)
    observed_norm = normalize_compare_text(observed)
    if not expected_norm or not observed_norm:
        return 0.0
    if expected_norm == observed_norm:
        return 1.0
    expected_tokens = set(expected_norm.split())
    observed_tokens = set(observed_norm.split())
    token_overlap = len(expected_tokens & observed_tokens) / max(1, len(expected_tokens))
    sequence = difflib.SequenceMatcher(None, expected_norm, observed_norm).ratio()
    score = (sequence * 0.65) + (token_overlap * 0.35)
    if expected_norm in observed_norm:
        score = max(score, 0.94)
    return round(min(score, 0.999), 4)


def ai_text_strategy_for_entry(entry: dict[str, Any]) -> str:
    entry = normalized_cover_entry(entry)
    branch = infer_cover_branch(entry)
    if branch == "children":
        return "studio-safe"
    language = str(entry.get("languageCode") or "").strip() or "English"
    title = str(entry.get("title") or "").strip()
    subtitle = str(entry.get("subtitle") or "").strip()
    author = str(entry.get("author") or "").strip()
    if language not in AI_TEXT_ALLOWED_LANGUAGES:
        return "studio-safe"
    if not title or len(title) > AI_TEXT_MINIMAL_TITLE_MAX:
        return "studio-safe"
    if author and len(author) > AI_TEXT_AUTHOR_MAX:
        return "studio-safe"
    return "hybrid-ai-text"


def truncate_words(text: str, max_chars: int) -> str:
    words = text.split()
    if not words:
        return ""
    current: list[str] = []
    for word in words:
        candidate = " ".join([*current, word]).strip()
        if len(candidate) > max_chars:
            break
        current.append(word)
    return " ".join(current).strip()


def ai_signature_subtitle(entry: dict[str, Any]) -> str:
    subtitle = str(entry.get("subtitle") or "").strip()
    if not subtitle:
        return ""
    if len(subtitle) <= AI_TEXT_HYBRID_SUBTITLE_MAX:
        return subtitle

    candidates = [part.strip(" -,:;.") for part in re.split(r"[;:.!?]|(?:\s[-–—]\s)|,\s", subtitle) if part.strip()]
    strong_candidates = [candidate for candidate in candidates if len(candidate) >= 18 and len(candidate.split()) >= 3]
    for candidate in strong_candidates:
        if len(candidate) <= AI_TEXT_HYBRID_SUBTITLE_MAX:
            return candidate
    if candidates:
        first_candidate = candidates[0]
        truncated = truncate_words(first_candidate, AI_TEXT_HYBRID_SUBTITLE_MAX)
        if truncated and len(truncated.split()) >= 3:
            return truncated

    summary = str(entry.get("summary") or "").strip()
    if summary:
        summary_candidates = [part.strip(" -,:;.") for part in re.split(r"[;:.!?]|(?:\s[-–—]\s)|,\s", summary) if part.strip()]
        for candidate in summary_candidates:
            if candidate and len(candidate) >= 18 and len(candidate.split()) >= 3 and len(candidate) <= AI_TEXT_HYBRID_SUBTITLE_MAX:
                return candidate
        if summary_candidates:
            truncated = truncate_words(summary_candidates[0], AI_TEXT_HYBRID_SUBTITLE_MAX)
            if truncated and len(truncated.split()) >= 3:
                return truncated

    return truncate_words(subtitle, AI_TEXT_HYBRID_SUBTITLE_MAX)


def ai_text_targets(entry: dict[str, Any], mode: str) -> dict[str, str]:
    title = str(entry.get("title") or "").strip()
    author = str(entry.get("author") or "").strip()
    subtitle = ""
    if mode == "ai-signature":
        subtitle = ai_signature_subtitle(entry)
    return {
        "title": title,
        "subtitle": subtitle,
        "author": author,
    }


def has_disallowed_text_prefix(fields: dict[str, str]) -> bool:
    for key in ("title", "subtitle", "author"):
        value = str(fields.get(key) or "").strip()
        if not value:
            continue
        if value[0] in {"#", "@", "*", "•"}:
            return True
        lowered = value.casefold()
        if lowered.startswith(("author:", "author ", "title:", "title ", "subtitle:", "subtitle ")):
            return True
    return False


def variant_specs_for_entry(entry: dict[str, Any]) -> list[dict[str, Any]]:
    entry = normalized_cover_entry(entry)
    families = list(families_for_entry(entry))
    strategy = ai_text_strategy_for_entry(entry)
    if strategy != "hybrid-ai-text":
        return [
            {
                "id": str(family["id"]),
                "label": str(family["label"]),
                "family": family,
                "render_mode": "studio-exact",
                "text_strategy": "studio-safe",
            }
            for family in families
        ]

    return [
        {
            "id": f"{families[0]['id']}-signature",
            "label": "Signature",
            "family": families[0],
            "render_mode": "ai-signature",
            "text_strategy": strategy,
        },
        {
            "id": f"{families[1]['id']}-minimal",
            "label": "Minimal",
            "family": families[1],
            "render_mode": "ai-minimal",
            "text_strategy": strategy,
        },
        {
            "id": f"{families[2]['id']}-exact",
            "label": "Exact",
            "family": families[2],
            "render_mode": "studio-exact",
            "text_strategy": strategy,
        },
    ]


def ai_text_providers_for_entry(service: str, entry: dict[str, Any]) -> list[str]:
    ordered = normalize_service(service, entry)
    allowed = [
        provider
        for provider in ordered
        if provider in {"vertex-imagen-standard", "vertex-imagen-ultra", "grok-imagine", "nano-banana-pro", "nano-banana-2"}
    ]
    return allowed or ordered


def extract_from_payload(payload: Any, *paths: tuple[Any, ...]) -> Any:
    for path in paths:
        current = payload
        try:
            for key in path:
                current = current[key]
        except (KeyError, IndexError, TypeError):
            current = None
        if current not in (None, ""):
            return current
    return None


def safe_json_response(response: Response) -> dict[str, Any]:
    if not response.content:
        return {}
    try:
        payload = response.json()
    except requests.exceptions.JSONDecodeError:
        return {}
    return payload if isinstance(payload, dict) else {}


def download_image(url: str, output_path: Path) -> bool:
    response = requests.get(url, timeout=180)
    response.raise_for_status()
    output_path.write_bytes(response.content)
    return output_path.stat().st_size > 0


def save_image_from_payload(payload: dict[str, Any], output_path: Path) -> bool:
    url = extract_from_payload(
        payload,
        ("data", 0, "url"),
        ("url",),
        ("result", "url"),
        ("job", "result", "url"),
        ("job", "result", "storage_url"),
        ("job", "result", "storage_urls", 0),
        ("storage_url",),
        ("storage_urls", 0),
    )
    if isinstance(url, str) and url:
        return download_image(url, output_path)

    b64 = extract_from_payload(
        payload,
        ("data", 0, "b64_json"),
        ("b64_json",),
        ("images", 0),
        ("job", "result", "images", 0),
    )
    if isinstance(b64, str) and b64:
        output_path.write_bytes(base64.b64decode(b64))
        return output_path.stat().st_size > 0

    return False


def save_vertex_imagen_prediction(prediction: dict[str, Any], output_path: Path) -> bool:
    b64 = str(prediction.get("bytesBase64Encoded") or "").strip()
    if not b64:
        return False
    output_path.write_bytes(base64.b64decode(b64))
    return output_path.stat().st_size > 0


def generate_with_vertex_imagen(prompt: str, output_path: Path, provider: str) -> bool:
    config = resolve_vertex_config()
    if not config:
        return False
    model_config = VERTEX_IMAGEN_MODELS.get(provider)
    if not model_config:
        return False
    response = requests.post(
        VERTEX_IMAGEN_URL_TEMPLATE.format(
            location=config["location"],
            project=config["project"],
            model=model_config["model"],
            api_key=config["api_key"],
        ),
        headers={"Content-Type": "application/json; charset=utf-8"},
        json={
            "instances": [{"prompt": prompt}],
            "parameters": model_config["parameters"],
        },
        timeout=240,
    )
    payload = safe_json_response(response)
    prediction = (payload.get("predictions") or [{}])[0]
    return response.ok and save_vertex_imagen_prediction(prediction, output_path)


def generate_with_vertex_gemini(prompt: str, output_path: Path) -> bool:
    config = resolve_vertex_config()
    if not config:
        return False
    response = requests.post(
        VERTEX_GEMINI_IMAGE_URL_TEMPLATE.format(
            model="gemini-2.5-flash-image",
            api_key=config["api_key"],
        ),
        headers={"Content-Type": "application/json; charset=utf-8"},
        json={
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseModalities": ["TEXT", "IMAGE"],
                "imageConfig": {"aspectRatio": "3:4"},
            },
        },
        timeout=240,
    )
    payload = safe_json_response(response)
    if not response.ok:
        return False
    for candidate in payload.get("candidates") or []:
        content = candidate.get("content") or {}
        for part in content.get("parts") or []:
            inline_data = part.get("inlineData") or {}
            b64 = str(inline_data.get("data") or "").strip()
            if not b64:
                continue
            output_path.write_bytes(base64.b64decode(b64))
            return output_path.stat().st_size > 0
    return False


def ai_text_prompt(entry: dict[str, Any], family: dict[str, Any], mode: str, attempt_index: int = 1) -> str:
    entry = normalized_cover_entry(entry)
    targets = ai_text_targets(entry, mode)
    title = targets["title"]
    subtitle = targets["subtitle"]
    author = targets["author"]
    category = str(entry.get("category") or "").strip().lower() or "nonfiction"
    topic = derive_visual_topic(entry)
    style = str(family.get("artDirection") or "").strip()
    title_instruction = f'Render the exact title text: "{title}".'
    subtitle_instruction = f'Render the exact subtitle text: "{subtitle}".' if subtitle and mode == "ai-signature" else ""
    author_instruction = f'Render the exact author name: "{author}".' if author else ""
    minimal_instruction = (
        "Use a very clean hierarchy: dominant title, optional small author, and no extra copy. The title may wrap to two lines if needed, but the exact words must stay intact and in the same order."
        if mode == "ai-minimal"
        else "Use a premium bookstore hierarchy: dominant title, controlled subtitle, and author line."
    )
    retry_instruction = ""
    if attempt_index > 1:
        retry_instruction = (
            " Retry rule: the previous attempt likely misspelled or distorted text. "
            "Keep the wording exact, remove any extra characters, and do not invent punctuation."
        )
    return (
        f"Create a finished premium portrait {category} book cover, not just background art. "
        f"Art direction: {topic}. Visual language: {style}. "
        f"{title_instruction} {subtitle_instruction} {author_instruction} "
        f"{minimal_instruction} "
        "Only render the requested title, subtitle, and author. Do not add any other words, badges, blurbs, fake endorsements, logos, watermarks, glyphs, icons, publisher names, or extra typography. "
        "Do not add prefixed characters such as #, bullets, quote marks, labels like Author:, or decorative prefixes before any line of text. "
        "The text must be crisp, professional, centered or cleanly aligned, and look like a real bookstore-ready cover. "
        "No misspellings. No random extra letters. No gibberish. No ghost text in the background. "
        f"{retry_instruction}"
    ).strip()


def extract_text_candidate(payload: dict[str, Any]) -> str:
    for candidate in payload.get("candidates") or []:
        content = candidate.get("content") or {}
        texts: list[str] = []
        for part in content.get("parts") or []:
            text = str(part.get("text") or "").strip()
            if text:
                texts.append(text)
        if texts:
            return "\n".join(texts).strip()
    return ""


def ocr_cover_fields(image_path: Path) -> dict[str, str]:
    config = resolve_vertex_config()
    if not config or not image_path.exists():
        return {"title": "", "subtitle": "", "author": "", "all_text": ""}
    encoded = base64.b64encode(image_path.read_bytes()).decode("ascii")
    response = requests.post(
        VERTEX_GEMINI_TEXT_URL_TEMPLATE.format(model=AI_TEXT_OCR_MODEL, api_key=config["api_key"]),
        headers={"Content-Type": "application/json; charset=utf-8"},
        json={
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": (
                                "Read all visible text on this book cover image. "
                                "Return strict JSON with keys title, subtitle, author, and all_text. "
                                "If a field is missing or unreadable, use an empty string."
                            )
                        },
                        {"inlineData": {"mimeType": "image/png", "data": encoded}},
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0,
                "responseMimeType": "application/json",
            },
        },
        timeout=AI_TEXT_OCR_TIMEOUT,
    )
    payload = safe_json_response(response)
    raw_text = extract_text_candidate(payload)
    if not raw_text:
        return {"title": "", "subtitle": "", "author": "", "all_text": ""}
    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        return {"title": "", "subtitle": "", "author": "", "all_text": raw_text}
    return {
        "title": str(parsed.get("title") or "").strip(),
        "subtitle": str(parsed.get("subtitle") or "").strip(),
        "author": str(parsed.get("author") or "").strip(),
        "all_text": str(parsed.get("all_text") or "").strip(),
    }


def validate_ai_cover_text(entry: dict[str, Any], image_path: Path, mode: str) -> dict[str, Any]:
    fields = ocr_cover_fields(image_path)
    targets = ai_text_targets(entry, mode)
    title = targets["title"]
    subtitle = targets["subtitle"]
    author = targets["author"]
    title_observed = fields["title"] or fields["all_text"]
    if mode == "ai-minimal":
        title_observed = " ".join(part for part in (fields["title"], fields["subtitle"]) if part).strip() or fields["all_text"]
    subtitle_observed = fields["subtitle"] or fields["all_text"]
    author_observed = fields["author"] or fields["all_text"]
    title_score = compare_text_score(title, title_observed)
    subtitle_score = compare_text_score(subtitle, subtitle_observed) if subtitle and mode == "ai-signature" else 1.0
    author_score = compare_text_score(author, author_observed) if author else 1.0
    prefix_guard = has_disallowed_text_prefix(fields)
    valid = title_score >= AI_TEXT_TITLE_MIN_SCORE and author_score >= AI_TEXT_AUTHOR_MIN_SCORE
    if mode == "ai-signature" and subtitle:
        valid = valid and subtitle_score >= AI_TEXT_SUBTITLE_MIN_SCORE
    valid = valid and not prefix_guard
    return {
        "valid": bool(valid),
        "ocrText": "\n".join(part for part in fields.values() if part).strip(),
        "ocrFields": fields,
        "targets": targets,
        "prefixGuardFailed": prefix_guard,
        "titleScore": round(title_score, 4),
        "subtitleScore": round(subtitle_score, 4),
        "authorScore": round(author_score, 4),
    }


def generate_ai_finished_cover(
    entry: dict[str, Any],
    family: dict[str, Any],
    output_path: Path,
    providers: list[str],
    api_key: str,
    mode: str,
) -> dict[str, Any] | None:
    best: dict[str, Any] | None = None
    for attempt_index in range(1, AI_TEXT_MAX_ATTEMPTS + 1):
        prompt = ai_text_prompt(entry, family, mode, attempt_index)
        for provider in providers:
            with tempfile.TemporaryDirectory(prefix=f"ai-text-cover-{entry['slug']}-{mode}-") as temp_dir:
                temp_image = Path(temp_dir) / "cover.png"
                if not generate_variant(prompt, temp_image, api_key, provider):
                    continue
                validation = validate_ai_cover_text(entry, temp_image, mode)
                candidate = {
                    "provider": provider,
                    "validation": validation,
                    "path": temp_image,
                }
                if best is None or (
                    validation["titleScore"] + validation["subtitleScore"] + validation["authorScore"]
                    > best["validation"]["titleScore"] + best["validation"]["subtitleScore"] + best["validation"]["authorScore"]
                ):
                    shutil.copyfile(temp_image, output_path)
                    best = {
                        "provider": provider,
                        "validation": validation,
                        "path": output_path,
                    }
                if validation["valid"]:
                    shutil.copyfile(temp_image, output_path)
                    return {
                        "provider": provider,
                        "validation": validation,
                        "path": output_path,
                    }
    return best


def generate_with_grok(prompt: str, output_path: Path, api_key: str) -> bool:
    response = requests.post(
        GROK_IMAGE_URL,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"prompt": prompt, "aspect_ratio": "2:3", "n": 1},
        timeout=180,
    )
    payload = safe_json_response(response)
    if response.ok and save_image_from_payload(payload, output_path):
        return True

    if not response.ok:
        return False

    for _ in range(POLL_ATTEMPTS):
        history = requests.get(
            GROK_HISTORY_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=180,
        )
        history_payload = safe_json_response(history)
        items = history_payload.get("items") or []
        for item in items:
            if item.get("type", "image") != "image":
                continue
            if item.get("prompt") == prompt and isinstance(item.get("url"), str):
                return download_image(item["url"], output_path)
        time.sleep(POLL_INTERVAL_SECONDS)

    return False


def generate_with_nano(prompt: str, output_path: Path, api_key: str, model: str) -> bool:
    response = requests.post(
        NANO_IMAGE_URL,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"prompt": prompt, "aspect_ratio": "portrait", "model": model, "seed": None},
        timeout=180,
    )
    if not response.ok:
        return False
    payload = safe_json_response(response)
    job_id = payload.get("jobId") or payload.get("job_id")
    if not job_id:
        return False

    for _ in range(POLL_ATTEMPTS):
        status = requests.post(
            NANO_STATUS_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"job_id": job_id},
            timeout=180,
        )
        status_payload = safe_json_response(status)
        job_status = extract_from_payload(status_payload, ("job", "status")) or ""
        if job_status == "SUCCESS":
            return save_image_from_payload(status_payload, output_path)
        if job_status in {"ERROR", "CANCELED", "CANCELLED"}:
            return False
        time.sleep(POLL_INTERVAL_SECONDS)

    return False


def derive_visual_topic(entry: dict[str, Any]) -> str:
    title = str(entry.get("title") or "").strip()
    title_tokens = [token for token in re.findall(r"\w+", title.lower()) if len(token) >= 4]
    candidates = [
        entry.get("coverBrief"),
        entry.get("summary"),
        entry.get("topic"),
        entry.get("subtitle"),
        entry.get("category"),
    ]
    for raw in candidates:
        value = str(raw or "").strip()
        if not value:
            continue
        if title:
            value = re.sub(re.escape(title), "", value, flags=re.IGNORECASE).strip(" -,:;.'\"")
        for token in title_tokens:
            value = re.sub(rf"\b{re.escape(token)}\b", "", value, flags=re.IGNORECASE)
        value = re.sub(r"\s{2,}", " ", value).strip(" -,:;.'\"")
        if value and value.lower() != title.lower():
            return value
    category = str(entry.get("category") or "high-end nonfiction").strip().lower()
    return f"{category} ideas, premium insight, and commercially credible visual metaphors"


def build_prompt(entry: dict[str, Any]) -> str:
    entry = normalized_cover_entry(entry)
    topic = derive_visual_topic(entry)
    branch = str(entry.get("coverBranch") or "nonfiction")
    genre = str(entry.get("coverGenre") or "business-marketing")
    subtopic = str(entry.get("coverSubtopic") or "")
    category = str(entry.get("category") or GENRE_MATRIX[genre]["label"]).strip().lower()
    if branch == "children":
        motif = {
            "storyworld": "warm storybook scenes, rounded layered shapes, child-safe wonder, playful depth, and gentle illustrative atmosphere",
            "learning": "bright tactile learning objects, curious arcs, rounded forms, cheerful depth, and friendly discovery scenes",
            "bedtime": "soft moonlit arcs, dreamy layered clouds, calm rounded scenery, pastel glow, and reassuring bedtime atmosphere",
        }.get(subtopic, "storybook warmth, rounded illustrated forms, playful depth, and calm family-safe composition")
        return (
            f"Create premium portrait children's book background artwork for a {category} cover. Art direction: {topic}. "
            "This is background art only, not a finished cover. All typography will be added later by layout software, so the image must stay completely typography-free. "
            f"Use {motif}. Make it feel like a real high-quality children's picture book cover sold in bookstores, with generous title-safe space, rounded shapes, warm emotional safety, and illustration-ready composition. "
            "Absolutely do not render any letters, words, numbers, initials, monograms, captions, logos, symbols, watermarks, signage, classroom posters, alphabet fragments, faux text, typographic echoes, or glyph-like marks anywhere in the image. "
            "Avoid hard-edged corporate geometry, harsh monoliths, dark executive slabs, brass-rail authority frames, and severe adult nonfiction energy. "
            "If any shape looks even remotely like text, treat that as a failure and remove it. "
            "Background artwork only. Typography-free. Letterform-free. Text-free. OCR-clean. No words. No letters. No numbers. No symbols. No logos. No watermarks."
        )

    if genre == "expertise-authority":
        motif = "architectural folio planes, seal-like structure, premium shadow depth, and refined authority geometry"
    elif genre == "ai-systems":
        motif = "precise geometric lattices, structured light corridors, layered interface depth, and clean signal pathways"
    elif genre == "personal-development":
        motif = "calm atmospheric gradients, restrained horizon bands, emotive light, and sculpted negative space"
    elif genre == "education":
        motif = "orbital learning forms, tactile paper arcs, luminous pathways, and elegant instructional geometry"
    elif subtopic == "leadership":
        motif = "confident vertical structures, disciplined spacing, directional sightlines, and executive-grade depth"
    else:
        motif = "editorial abstract structures, tactile paper grain, sculpted contrast, and controlled premium geometry"

    if any(keyword in cover_haystack(entry) for keyword in ("story", "manifesto", "energy", "creative")):
        frame_note = "Keep the edges refined but not rigid, with cinematic falloff and room for a sophisticated frame."
    else:
        frame_note = "Keep the edges disciplined and frame-friendly, with clean perimeter control for a real bookstore cover layout."

    return (
        f"Create premium portrait editorial background artwork for a {category} nonfiction cover. Art direction: {topic}. "
        "This is background art only, not a finished cover. All typography will be added later by layout software, so the image must stay completely typography-free. "
        f"Use {motif}. {frame_note} "
        "Make it feel like a real high-end nonfiction bestseller cover sold in bookstores, with bold typography-safe negative space, tactile print texture, and coherent composition from edge to edge. "
        "Absolutely do not render any letters, words, numbers, initials, monograms, headlines, captions, logos, symbols, watermarks, engraved text, embossed text, faux text, typographic echoes, glyph-like shapes, rune-like marks, poster headlines, signage, title fragments, or any abstract forms that resemble readable characters anywhere in the image. "
        "Do not write the book title. Do not write any fake title. Do not place giant faded word-shapes in the background. Do not create ghost typography, billboard lettering, cover-copy silhouettes, or decorative marks that could be mistaken for text. "
        "If any shape looks even remotely like text, treat that as a failure and remove it. "
        "Background artwork only. Typography-free. Letterform-free. Text-free. OCR-clean. No words. No letters. No numbers. No symbols. No logos. No watermarks."
    )


def variant_prompt_suffix(family: dict[str, Any], entry: dict[str, Any], attempt_index: int = 1) -> str:
    branch = infer_cover_branch(entry)
    genre_label = GENRE_MATRIX[infer_cover_genre(entry, branch)]["label"]
    suffix = (
        f"Favor the {family['label']} cover family for the {genre_label} genre: {family['artDirection']}. "
        "Keep the background OCR-clean and entirely typography-free."
    )
    if branch == "children":
        suffix += " Keep the emotional tone child-safe, warm, rounded, and inviting. No harsh corporate edges."
    retry = ""
    if attempt_index > 1:
        retry = (
            " Retry rule: the previous attempt likely contained text-like artifacts. "
            "Remove all poster-like letters, ghosted title fragments, signage, headline silhouettes, typographic scaffolding, engraved plates, alphanumeric forms, and glyph-shaped geometry. "
            "Use only abstract geometry, illustration, architecture, gradients, paper forms, light, and shadow."
        )
    return f"{suffix} {retry}".strip()


def build_variant_prompt(entry: dict[str, Any], family: dict[str, Any], attempt_index: int = 1) -> str:
    return f"{build_prompt(entry)} {variant_prompt_suffix(family, entry, attempt_index)}"


def read_dashboard_meta(book_dir: Path) -> dict[str, Any]:
    meta_path = book_dir / "dashboard_meta.json"
    if not meta_path.exists():
        return {}
    return json.loads(meta_path.read_text(encoding="utf-8"))


def write_dashboard_meta(book_dir: Path, meta: dict[str, Any]) -> None:
    meta_path = book_dir / "dashboard_meta.json"
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def derive_cover_template_hint(entry: dict[str, Any]) -> str:
    entry = normalized_cover_entry(entry)
    if entry.get("coverTemplateHint"):
        return str(entry["coverTemplateHint"])
    genre = str(entry.get("coverGenre") or "business-marketing")
    branch = str(entry.get("coverBranch") or "nonfiction")
    if branch == "children":
        subtopic = str(entry.get("coverSubtopic") or "")
        if subtopic == "bedtime":
            return "children-bedtime"
        if subtopic == "learning":
            return "children-learning"
        return "children-storyworld"
    return {
        "business-marketing": "business-playbook",
        "expertise-authority": "expertise-authority",
        "ai-systems": "business-playbook",
        "education": "education-workbook",
        "personal-development": "personal-growth",
    }.get(genre, "business-playbook")


def derive_title_tone(entry: dict[str, Any]) -> str:
    entry = normalized_cover_entry(entry)
    if entry.get("titleTone"):
        return str(entry["titleTone"])
    language = str(entry.get("languageCode") or "")
    if language == "Japanese":
        return "cjk"
    if language == "Arabic":
        return "rtl"
    if infer_cover_branch(entry) == "children":
        return "playful"
    genre = infer_cover_genre(entry)
    if genre in {"business-marketing", "ai-systems"}:
        return "sharp"
    return "classic"


def derive_cover_hierarchy(entry: dict[str, Any]) -> str:
    entry = normalized_cover_entry(entry)
    if entry.get("coverHierarchy"):
        return str(entry["coverHierarchy"])
    branch = infer_cover_branch(entry)
    genre = infer_cover_genre(entry, branch)
    if branch == "children":
        return "title-scene-author"
    if genre == "personal-development":
        return "title-subtitle-emotive"
    if genre == "expertise-authority":
        return "title-author-seal"
    if genre == "ai-systems":
        return "title-first"
    return "title-first"


def run_node_json(script_path: Path, *args: str) -> dict[str, Any]:
    result = subprocess.run(
        ["node", str(script_path), *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout or "{}")


def render_procedural_art(entry: dict[str, Any], output_path: Path, family_id: str) -> dict[str, Any]:
    entry = normalized_cover_entry(entry)
    family = family_by_id(family_id)
    config = {
        "slug": entry["slug"],
        "title": entry.get("title") or "",
        "subtitle": entry.get("subtitle") or "",
        "topic": derive_visual_topic(entry),
        "category": entry.get("category") or "Nonfiction",
        "toneArchetype": entry.get("toneArchetype") or "",
        "coverGradient": entry.get("coverGradient") or "linear-gradient(145deg,#111827 0%,#1f2937 55%,#0b1020 100%)",
        "accentColor": entry.get("accentColor") or "#caa15b",
        "textAccent": entry.get("textAccent") or "#fff8ef",
        "coverBranch": entry.get("coverBranch") or family["branch"],
        "coverGenre": entry.get("coverGenre") or family["genre"],
        "coverSubtopic": entry.get("coverSubtopic") or infer_cover_subtopic(entry),
        "coverPaletteKey": palette_key_for_variant(entry, family),
        "coverLayoutKey": layout_key_for_variant(entry, family),
        "coverMotif": motif_for_variant(entry, family),
        "coverVariantFamily": family_id,
        "renderMode": entry.get("renderMode") or "",
    }
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json", encoding="utf-8") as handle:
        json.dump(config, handle, ensure_ascii=False, indent=2)
        config_path = Path(handle.name)
    try:
        svg_path = output_path.with_suffix(".svg")
        return run_node_json(PROCEDURAL_ART_SCRIPT, "--config", str(config_path), "--output", str(output_path), "--svg", str(svg_path))
    finally:
        config_path.unlink(missing_ok=True)


def score_variant(image_path: Path) -> dict[str, Any]:
    return run_node_json(SCORER_SCRIPT, "--input", str(image_path))


def cover_variant_family_by_id(family_id: str) -> dict[str, Any]:
    return family_by_id(family_id)


def compose_cover_bundle(
    entry: dict[str, Any],
    book_dir: Path,
    art_path: Path,
    preferred_zone: str,
    *,
    family_id: str,
    front_svg_name: str,
    front_png_name: str,
    back_svg_name: str,
    back_png_name: str,
    config_overrides: dict[str, Any] | None = None,
) -> dict[str, Any]:
    entry = normalized_cover_entry(entry)
    assets_dir = book_dir / "assets"
    family = cover_variant_family_by_id(family_id)
    front_svg_path = Path(front_svg_name)
    front_png_path = Path(front_png_name)
    back_svg_path = Path(back_svg_name)
    back_png_path = Path(back_png_name)
    if not front_svg_path.is_absolute():
        front_svg_path = assets_dir / front_svg_path
    if not front_png_path.is_absolute():
        front_png_path = assets_dir / front_png_path
    if not back_svg_path.is_absolute():
        back_svg_path = assets_dir / back_svg_path
    if not back_png_path.is_absolute():
        back_png_path = assets_dir / back_png_path
    config = {
        "slug": entry["slug"],
        "title": entry.get("title") or book_dir.name,
        "subtitle": entry.get("subtitle") or "",
        "author": entry.get("author") or "",
        "publisher": entry.get("publisher") or "",
        "summary": entry.get("summary") or "",
        "authorBio": entry.get("authorBio") or "",
        "coverBrief": entry.get("coverBrief") or "",
        "brandingMark": entry.get("brandingMark") or "",
        "languageCode": entry.get("languageCode") or "English",
        "languageLabel": entry.get("languageLabel") or entry.get("languageCode") or "English",
        "category": entry.get("category") or "Nonfiction",
        "toneArchetype": entry.get("toneArchetype") or "",
        "coverGradient": entry.get("coverGradient") or "linear-gradient(145deg,#111111 0%,#333333 100%)",
        "accentColor": entry.get("accentColor") or "#caa15b",
        "textAccent": entry.get("textAccent") or "#fff8ef",
        "year": entry.get("year") or "",
        "preferredZone": preferred_zone,
        "coverPrompt": entry.get("coverPrompt") or "",
        "topic": entry.get("topic") or "",
        "summary": entry.get("summary") or "",
        "coverTemplateHint": derive_cover_template_hint(entry),
        "titleTone": derive_title_tone(entry),
        "coverHierarchy": derive_cover_hierarchy(entry),
        "coverBranch": entry.get("coverBranch") or family["branch"],
        "coverGenre": entry.get("coverGenre") or family["genre"],
        "coverSubtopic": entry.get("coverSubtopic") or infer_cover_subtopic(entry),
        "coverPaletteKey": palette_key_for_variant(entry, family),
        "coverLayoutKey": layout_key_for_variant(entry, family),
        "coverMotif": motif_for_variant(entry, family),
        "coverVariantFamily": family_id,
        "coverVariantLabel": family["label"],
        "brandingLogoPath": str(assets_dir / "publisher_logo.svg"),
    }
    if config_overrides:
        config.update(config_overrides)

    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json", encoding="utf-8") as handle:
        json.dump(config, handle, ensure_ascii=False, indent=2)
        config_path = Path(handle.name)

    try:
        return run_node_json(
            COMPOSER_SCRIPT,
            "--config",
            str(config_path),
            "--art",
            str(art_path),
            "--front-svg",
            str(front_svg_path),
            "--front-png",
            str(front_png_path),
            "--back-svg",
            str(back_svg_path),
            "--back-png",
            str(back_png_path),
        )
    finally:
        config_path.unlink(missing_ok=True)


def generate_variant(prompt: str, output_path: Path, api_key: str, provider: str) -> bool:
    if provider in VERTEX_IMAGEN_MODELS:
        return generate_with_vertex_imagen(prompt, output_path, provider)
    if provider == "vertex-gemini-flash-image":
        return generate_with_vertex_gemini(prompt, output_path)
    legacy_key = resolve_legacy_api_key() or api_key
    if not legacy_key:
        return False
    if provider == "grok-imagine":
        return generate_with_grok(prompt, output_path, legacy_key)
    if provider in NANO_MODELS:
        return generate_with_nano(prompt, output_path, legacy_key, NANO_MODELS[provider])
    return False


def art_candidate_rank(score_payload: dict[str, Any]) -> tuple[float, float]:
    text_risk = float(score_payload.get("textRisk") or 0.0)
    quality = float(score_payload.get("score") or 0.0)
    return (text_risk, -quality)


def ensure_variant_art(
    entry: dict[str, Any],
    assets_dir: Path,
    api_key: str,
    service: str,
    force: bool,
    *,
    families: tuple[dict[str, Any], ...] | None = None,
) -> list[dict[str, Any]]:
    entry = normalized_cover_entry(entry)
    generated: list[dict[str, Any]] = []
    legacy_ai_cover = assets_dir / "ai_front_cover.png"
    providers = normalize_service(service, entry)
    target_families = families or families_for_entry(entry)
    for family in target_families:
        variant_index = int(family["art_variant"])
        target = assets_dir / f"cover_art_v{variant_index}.png"
        provider_used = ""
        reused = False
        backup_target: Path | None = None

        if not force and target.exists():
            existing_score = score_variant(target)
            if float(existing_score.get("textRisk") or 0.0) <= TEXT_RISK_REUSE_THRESHOLD:
                reused = True
        elif not force and variant_index == 1 and legacy_ai_cover.exists():
            legacy_score = score_variant(legacy_ai_cover)
            if float(legacy_score.get("textRisk") or 0.0) <= TEXT_RISK_REUSE_THRESHOLD:
                shutil.copyfile(legacy_ai_cover, target)
                reused = True

        if not reused:
            if target.exists():
                backup_target = assets_dir / f"cover_art_v{variant_index}.previous.png"
                shutil.copyfile(target, backup_target)
                target.unlink(missing_ok=True)
            best_provider = ""
            best_rank: tuple[float, float] | None = None

            for attempt_index in range(1, MAX_ART_ATTEMPTS_PER_VARIANT + 1):
                prompt = build_variant_prompt(entry, family, attempt_index)
                accepted = False
                for provider in providers:
                    with tempfile.TemporaryDirectory(prefix=f"showcase-cover-{entry['slug']}-v{variant_index}-") as temp_dir:
                        temp_image = Path(temp_dir) / "variant.png"
                        if not generate_variant(prompt, temp_image, api_key, provider):
                            continue
                        score_payload = score_variant(temp_image)
                        rank = art_candidate_rank(score_payload)
                        if best_rank is None or rank < best_rank:
                            shutil.copyfile(temp_image, target)
                            best_provider = provider
                            best_rank = rank
                        if float(score_payload.get("textRisk") or 0.0) <= TEXT_RISK_REJECT_THRESHOLD:
                            shutil.copyfile(temp_image, target)
                            provider_used = provider
                            accepted = True
                            break
                if accepted:
                    break

            if not provider_used:
                try:
                    render_procedural_art(entry, target, str(family["id"]))
                    provider_used = "procedural-studio"
                except Exception:
                    pass
            if not provider_used and best_provider:
                provider_used = best_provider
            if not target.exists() and backup_target and backup_target.exists():
                shutil.copyfile(backup_target, target)
            if not provider_used and not target.exists():
                raise RuntimeError(f"All cover providers failed for {entry['slug']} variant {variant_index}")
            if backup_target:
                backup_target.unlink(missing_ok=True)

        if not target.exists():
            raise RuntimeError(f"Variant output missing for {entry['slug']} variant {variant_index}")
        generated.append(
            {
                "variant": variant_index,
                "family": str(family["id"]),
                "path": target,
                "provider": provider_used or ("existing" if reused else service),
            }
        )

    return generated


def family_fit_bonus(entry: dict[str, Any], family_id: str) -> float:
    entry = normalized_cover_entry(entry)
    genre = infer_cover_genre(entry)
    subtopic = infer_cover_subtopic(entry, genre, infer_cover_branch(entry))
    bonuses: dict[str, dict[str, float]] = {
        "business-marketing": {
            "commercial-bold": 18.0 if subtopic in {"marketing", "growth"} else 11.0,
            "executive-premium": 18.0 if subtopic == "leadership" else 10.0,
            "clean-signal": 18.0 if subtopic == "operations" else 12.0,
        },
        "expertise-authority": {
            "authority-serif": 18.0 if subtopic == "authority" else 12.0,
            "method-ledger": 18.0 if subtopic == "method" else 12.0,
            "modern-mentor": 18.0 if subtopic == "mentor" else 11.0,
        },
        "ai-systems": {
            "signal-grid": 18.0 if subtopic in {"systems", "team-systems"} else 12.0,
            "interface-depth": 18.0 if subtopic == "team-systems" else 11.0,
            "calm-tech": 18.0 if subtopic == "productivity" else 11.0,
        },
        "education": {
            "workbook-clear": 18.0 if subtopic in {"stem", "instruction"} else 12.0,
            "instructor-premium": 18.0 if subtopic == "instruction" else 10.0,
            "curious-learning": 18.0 if subtopic in {"learning", "family-learning"} else 12.0,
        },
        "personal-development": {
            "calm-focus": 18.0 if subtopic == "focus" else 12.0,
            "soft-discipline": 18.0 if subtopic == "discipline" else 12.0,
            "elevated-reset": 18.0 if subtopic == "reset" else 11.0,
        },
        "children-illustrated": {
            "storyworld": 18.0 if subtopic == "storyworld" else 12.0,
            "learning-adventure": 18.0 if subtopic == "learning" else 12.0,
            "bedtime-calm": 18.0 if subtopic == "bedtime" else 12.0,
        },
    }
    return bonuses.get(genre, {}).get(family_id, 9.0)


def art_quality_score(art: dict[str, Any]) -> float:
    details = art.get("details") or {}
    text_risk = float(details.get("textRisk") or 0.0)
    base_score = float(art.get("score") or 0.0)
    penalty = min(text_risk * 1.6, 54.0)
    return round(base_score - penalty, 2)


def asset_source(book_dir: Path, relative_path: str) -> Path:
    relative = str(relative_path or "").strip()
    if not relative:
        return book_dir / "__missing_asset__"
    return (book_dir / relative).resolve()


def copy_if_exists(source: Path, destination: Path) -> None:
    if source.exists():
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)


def copy_or_remove(source: Path, destination: Path) -> None:
    if source.exists():
        copy_if_exists(source, destination)
    else:
        destination.unlink(missing_ok=True)


def promote_selected_variant(book_dir: Path, selected_variant: dict[str, Any]) -> None:
    assets_dir = book_dir / "assets"
    selected_front = asset_source(book_dir, str(selected_variant["front_image"]))
    selected_back = asset_source(book_dir, str(selected_variant["back_image"]))
    selected_front_svg = asset_source(book_dir, str(selected_variant.get("front_svg") or ""))
    selected_back_svg = asset_source(book_dir, str(selected_variant.get("back_svg") or ""))
    selected_art = asset_source(book_dir, str(selected_variant["art_image"]))

    copy_if_exists(selected_front, assets_dir / "front_cover_final.png")
    copy_if_exists(selected_back, assets_dir / "back_cover_final.png")
    copy_or_remove(selected_front_svg, assets_dir / "front_cover_final.svg")
    copy_or_remove(selected_back_svg, assets_dir / "back_cover_final.svg")
    copy_if_exists(selected_front, assets_dir / "showcase_front_cover.png")
    copy_or_remove(selected_front_svg, assets_dir / "showcase_front_cover.svg")
    copy_if_exists(selected_back, assets_dir / "showcase_back_cover.png")
    copy_or_remove(selected_back_svg, assets_dir / "showcase_back_cover.svg")
    copy_if_exists(selected_art, assets_dir / "ai_front_cover.png")


def build_cover_variants(
    entry: dict[str, Any],
    book_dir: Path,
    service: str,
    api_key: str,
    force: bool,
    *,
    variant_count: int | None = None,
    selected_override: str | None = None,
) -> dict[str, Any]:
    entry = normalized_cover_entry(entry)
    assets_dir = book_dir / "assets"
    meta = read_dashboard_meta(book_dir)
    desired_variant_count = VARIANT_COUNT
    if variant_count is not None:
        try:
            desired_variant_count = int(variant_count)
        except (TypeError, ValueError):
            desired_variant_count = VARIANT_COUNT
    desired_variant_count = max(1, min(VARIANT_COUNT, desired_variant_count))

    variant_specs = variant_specs_for_entry(entry)[:desired_variant_count]
    family_ids: set[str] = set()
    families_to_generate: list[dict[str, Any]] = []
    for spec in variant_specs:
        family = dict(spec["family"])
        family_id = str(family.get("id") or "")
        if not family_id or family_id in family_ids:
            continue
        family_ids.add(family_id)
        families_to_generate.append(family)
    if not families_to_generate:
        families_to_generate = [dict(family) for family in families_for_entry(entry)[:desired_variant_count]]

    variants = ensure_variant_art(
        entry,
        assets_dir,
        api_key,
        service,
        force,
        families=tuple(families_to_generate),
    )

    art_scores: list[dict[str, Any]] = []
    by_variant: dict[int, dict[str, Any]] = {}
    for variant in variants:
        score_payload = score_variant(Path(variant["path"]))
        scored = {
            **variant,
            "path": str(variant["path"]),
            "score": score_payload["score"],
            "preferredZone": score_payload.get("preferredZone") or "",
            "details": score_payload,
        }
        art_scores.append(scored)
        by_variant[int(variant["variant"])] = scored

    art_scores.sort(
        key=lambda item: (
            float((item.get("details") or {}).get("textRisk") or 0.0) <= TEXT_RISK_REJECT_THRESHOLD,
            art_quality_score(item),
        ),
        reverse=True,
    )
    fallback_art = art_scores[0]

    cover_variants: list[dict[str, Any]] = []
    for spec in variant_specs:
        family = spec["family"]
        art = by_variant.get(int(family["art_variant"])) or fallback_art
        family_id = str(family["id"])
        variant_id = str(spec["id"])
        palette_key = palette_key_for_variant(entry, family)
        layout_key = layout_key_for_variant(entry, family)
        motif = motif_for_variant(entry, family)
        preferred_zone = preferred_zone_for_layout(layout_key, str(art.get("preferredZone") or ""))
        render_mode = str(spec.get("render_mode") or "studio-exact")
        studio_front_name = f"front_cover_{variant_id}.png"
        studio_front_svg = f"front_cover_{variant_id}.svg"
        if render_mode != "studio-exact":
            studio_front_name = f"front_cover_{variant_id}_studio.png"
            studio_front_svg = f"front_cover_{variant_id}_studio.svg"
        composition = compose_cover_bundle(
            entry,
            book_dir,
            Path(art["path"]),
            preferred_zone,
            family_id=family_id,
            front_svg_name=studio_front_svg,
            front_png_name=studio_front_name,
            back_svg_name=f"back_cover_{variant_id}.svg",
            back_png_name=f"back_cover_{variant_id}.png",
            config_overrides={
                "coverTemplateHint": template_hint_for_variant(entry, family),
                "titleTone": title_tone_for_variant(entry, family),
                "coverHierarchy": cover_hierarchy_for_variant(entry, family),
                "coverBranch": entry["coverBranch"],
                "coverGenre": entry["coverGenre"],
                "coverSubtopic": entry["coverSubtopic"],
                "coverPaletteKey": palette_key,
                "coverLayoutKey": layout_key,
                "coverMotif": motif,
                "frameStyle": family.get("frameStyle") or "",
                "preferredZone": preferred_zone,
            },
        )
        front_image = f"assets/{studio_front_name}"
        front_svg = f"assets/{studio_front_svg}"
        provider = art.get("provider") or service
        validation_payload: dict[str, Any] | None = None
        effective_render_mode = render_mode

        if render_mode in {"ai-signature", "ai-minimal"}:
            ai_front_path = assets_dir / f"front_cover_{variant_id}.png"
            ai_result = generate_ai_finished_cover(
                entry,
                family,
                ai_front_path,
                ai_text_providers_for_entry(service, entry),
                api_key,
                render_mode,
            )
            if ai_result and ai_result.get("validation", {}).get("valid"):
                front_image = f"assets/front_cover_{variant_id}.png"
                front_svg = ""
                provider = str(ai_result.get("provider") or provider)
                validation_payload = dict(ai_result.get("validation") or {})
            else:
                effective_render_mode = "studio-exact-fallback"
                validation_payload = dict((ai_result or {}).get("validation") or {})

        score_bonus = 10.0
        if effective_render_mode == "ai-signature":
            score_bonus = 18.0
        elif effective_render_mode == "ai-minimal":
            score_bonus = 15.0
        elif effective_render_mode == "studio-exact-fallback":
            score_bonus = 9.0

        cover_variants.append(
            {
                "id": variant_id,
                "family": family_id,
                "label": spec["label"],
                "genre": entry["coverGenre"],
                "subtopic": entry["coverSubtopic"],
                "layout": layout_key,
                "motif": motif,
                "paletteKey": palette_key,
                "front_image": front_image,
                "front_svg": front_svg,
                "back_image": f"assets/back_cover_{variant_id}.png",
                "back_svg": f"assets/back_cover_{variant_id}.svg",
                "art_image": f"assets/{Path(str(art['path'])).name}",
                "score": round(art_quality_score(art) + family_fit_bonus(entry, family_id) + score_bonus, 2),
                "recommended": False,
                "provider": provider,
                "template": composition.get("template") or derive_cover_template_hint(entry),
                "preferred_zone": preferred_zone,
                "render_mode": effective_render_mode,
                "text_strategy": str(spec.get("text_strategy") or "studio-safe"),
                "text_validation": validation_payload or {},
            }
        )

    cover_variants.sort(key=lambda item: float(item.get("score") or 0), reverse=True)
    recommended_id = str(cover_variants[0]["id"])
    selected_id = (
        selected_override
        or str(meta.get("selected_cover_variant") or "").strip()
        or recommended_id
    )
    valid_ids = {str(item["id"]) for item in cover_variants}
    if selected_id not in valid_ids:
        selected_id = recommended_id

    for item in cover_variants:
        item["recommended"] = str(item["id"]) == recommended_id

    selected_variant = next(item for item in cover_variants if str(item["id"]) == selected_id)
    promote_selected_variant(book_dir, selected_variant)
    (assets_dir / "cover_art_scores.json").write_text(
        json.dumps(art_scores, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    meta.update(
        {
            "cover_art_image": selected_variant["art_image"],
            "cover_image": "assets/front_cover_final.png",
            "back_cover_image": "assets/back_cover_final.png",
            "cover_template": selected_variant.get("template") or derive_cover_template_hint(entry),
            "cover_variant_count": len(cover_variants),
            "cover_variant_target_count": desired_variant_count,
            "cover_generation_provider": selected_variant.get("provider") or service,
            "cover_composed": True,
            "cover_text_strategy": ai_text_strategy_for_entry(entry),
            "cover_branch": entry["coverBranch"],
            "cover_genre": entry["coverGenre"],
            "cover_subtopic": entry["coverSubtopic"],
            "cover_variants": cover_variants,
            "recommended_cover_variant": recommended_id,
            "selected_cover_variant": selected_id,
            "back_cover_variant_family": selected_variant["family"],
            "cover_family": selected_variant["family"],
            "cover_palette_key": selected_variant.get("paletteKey", ""),
            "cover_layout_key": selected_variant.get("layout", ""),
            "cover_motif": selected_variant.get("motif", ""),
            "cover_lab_version": COVER_LAB_VERSION,
        }
    )
    write_dashboard_meta(book_dir, meta)
    return meta


def generate_cover_for_entry(entry: dict[str, Any], service: str, api_key: str, force: bool) -> None:
    entry = normalized_cover_entry(entry)
    slug = str(entry["slug"])
    book_dir = BOOK_OUTPUTS_DIR / slug
    if not book_dir.exists():
        raise FileNotFoundError(f"Missing showcase output directory for {slug}")

    assets_dir = book_dir / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    meta = read_dashboard_meta(book_dir)
    if (
        not force
        and meta.get("cover_composed") is True
        and str(meta.get("cover_image") or "").strip() == "assets/front_cover_final.png"
        and (assets_dir / "front_cover_final.png").exists()
        and int(meta.get("cover_variant_count") or 0) >= VARIANT_COUNT
        and len(meta.get("cover_variants") or []) >= VARIANT_COUNT
        and str(meta.get("cover_lab_version") or "").strip() == COVER_LAB_VERSION
    ):
        return
    build_cover_variants(entry, book_dir, service, api_key, force)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate AI showcase covers for /examples books.")
    parser.add_argument(
        "--service",
        default="auto",
        choices=SERVICE_CHOICES,
        help="Cover generation service order.",
    )
    parser.add_argument("--slug", action="append", default=[], help="Generate only specific showcase slug(s).")
    parser.add_argument("--force", action="store_true", help="Regenerate all 3 art variants and recomposed covers.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    api_key = resolve_api_key()
    entries = load_manifest()
    if args.slug:
        requested = set(args.slug)
        entries = [entry for entry in entries if entry["slug"] in requested]

    if not entries:
        raise SystemExit("No showcase entries selected.")

    for index, entry in enumerate(entries, start=1):
        slug = entry["slug"]
        print(f"[{index}/{len(entries)}] generating composed AI cover bundle for {slug}")
        generate_cover_for_entry(entry, args.service, api_key, args.force)

    print(f"showcase AI covers ready: {len(entries)} books")


if __name__ == "__main__":
    main()
