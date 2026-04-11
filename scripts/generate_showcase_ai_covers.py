#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import collections
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
# Grok removed â€“ no longer available
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
    "nano-banana-pro",
    "nano-banana-2",
)
IMAGE_PROVIDER_POLICY = (
    os.environ.get("SHOWCASE_IMAGE_PROVIDER_POLICY", "")
    or os.environ.get("BOOK_IMAGE_PROVIDER_POLICY", "")
    or "auto"
).strip().lower().replace("-", "_")
AI_TEXT_ALLOWED_LANGUAGES = {"English", "Turkish", "Spanish", "Portuguese", "Italian", "Dutch", "German", "French"}
AI_TEXT_HYBRID_TITLE_MAX = 42
AI_TEXT_HYBRID_SUBTITLE_MAX = 40
AI_TEXT_MINIMAL_TITLE_MAX = 48
AI_TEXT_AUTHOR_MAX = 24
AI_TEXT_TITLE_MIN_SCORE = 0.84
AI_TEXT_SUBTITLE_MIN_SCORE = 0.76
AI_TEXT_AUTHOR_MIN_SCORE = 0.78
AI_FRONT_OCR_ENABLED = os.environ.get("SHOWCASE_USE_OCR_FOR_AI_FRONT", "0").strip().lower() in {"1", "true", "yes", "on"}
DEFAULT_COVER_MODE = "full_ai_front"
DEFAULT_STYLE_DIRECTION = "genre_split"
DEFAULT_WRAP_SCOPE = "ai_front_only"
DEFAULT_QUALITY_GATE = "best_available"
try:
    AI_TEXT_MAX_ATTEMPTS = max(1, int(os.environ.get("SHOWCASE_AI_TEXT_MAX_ATTEMPTS", "5")))
except ValueError:
    AI_TEXT_MAX_ATTEMPTS = 5
VARIANT_COUNT = 3
POLL_ATTEMPTS = 24
POLL_INTERVAL_SECONDS = 4
COVER_LAB_VERSION = "genre-matrix-v5-full-ai-front"
try:
    MAX_ART_ATTEMPTS_PER_VARIANT = max(1, int(os.environ.get("SHOWCASE_MAX_ART_ATTEMPTS", "8")))
except ValueError:
    MAX_ART_ATTEMPTS_PER_VARIANT = 8
TEXT_RISK_REJECT_THRESHOLD = 0.18
TEXT_RISK_REUSE_THRESHOLD = 0.08
GENRE_MATRIX: dict[str, dict[str, Any]] = {
    "business-marketing": {
        "branch": "nonfiction",
        "label": "Business & Marketing",
        "families": (
            {
                "id": "commercial-bold",
                "label": "Reference Classic",
                "art_variant": 1,
                "template": "business-playbook",
                "titleTone": "sharp",
                "frameStyle": "brass-rail",
                "baseMotif": "seal",
                "artDirection": "classic commercial nonfiction cover, bright high-contrast field, giant title-first hierarchy, one central symbolic icon, and airport-bookstore clarity",
            },
            {
                "id": "executive-premium",
                "label": "Signal Ledger",
                "art_variant": 2,
                "template": "business-playbook",
                "titleTone": "sharp",
                "frameStyle": "double-line",
                "baseMotif": "folio",
                "artDirection": "reference-inspired sales cover with strong color blocking, central badge-or-icon emphasis, and clean lower author lockup",
            },
            {
                "id": "clean-signal",
                "label": "Reference Minimal",
                "art_variant": 3,
                "template": "business-playbook",
                "titleTone": "sharp",
                "frameStyle": "double-line",
                "baseMotif": "beams",
                "artDirection": "clean trade-book simplicity, vivid background, one hero symbol, and highly readable bookstore thumbnail presence",
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
                "label": "Reference Authority",
                "art_variant": 1,
                "template": "business-playbook",
                "titleTone": "sharp",
                "frameStyle": "double-line",
                "baseMotif": "seal",
                "artDirection": "classic expert-book cover, bold headline dominance, central authority symbol, bright commercial color, and clean author finish",
            },
            {
                "id": "method-ledger",
                "label": "Reference Method",
                "art_variant": 2,
                "template": "business-playbook",
                "titleTone": "sharp",
                "frameStyle": "brass-rail",
                "baseMotif": "seal",
                "artDirection": "method-driven trade paperback styling, strong visual badge, simplified background, and direct bestseller-like hierarchy",
            },
            {
                "id": "modern-mentor",
                "label": "Reference Mentor",
                "art_variant": 3,
                "template": "business-playbook",
                "titleTone": "sharp",
                "frameStyle": "corner-bracket",
                "baseMotif": "folio",
                "artDirection": "mentor-led commercial cover energy, simplified symbolic centerpiece, confident color field, and strong bottom author line",
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
    "narrative-fiction": {
        "branch": "fiction",
        "label": "Narrative Fiction",
        "families": (
            {
                "id": "midnight-platform",
                "label": "Midnight Platform",
                "art_variant": 1,
                "template": "narrative-story",
                "titleTone": "classic",
                "frameStyle": "glow-rail",
                "baseMotif": "atmospheric-light",
                "artDirection": "adult literary fiction with a cinematic night platform, one emotional focal scene, atmospheric rail light, and premium trade paperback poise",
            },
            {
                "id": "ember-carriage",
                "label": "Ember Carriage",
                "art_variant": 2,
                "template": "narrative-story",
                "titleTone": "classic",
                "frameStyle": "corner-bracket",
                "baseMotif": "horizon",
                "artDirection": "warm railway drama, elegant dusk glow, one symbolic carriage-or-platform cue, and refined adult novel hierarchy",
            },
            {
                "id": "echo-rail",
                "label": "Echo Rail",
                "art_variant": 3,
                "template": "narrative-story",
                "titleTone": "classic",
                "frameStyle": "soft-double",
                "baseMotif": "atmospheric-light",
                "artDirection": "quiet ensemble drama, memory-soaked station atmosphere, disciplined negative space, and bookstore-ready literary fiction polish",
            },
        ),
        "paletteKeys": ("deep-indigo", "amber-dusk", "quiet-mauve", "ink-parchment"),
        "layoutKeys": ("glow-center", "quiet-right", "horizon-left", "soft-center"),
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


def is_vertex_only_policy() -> bool:
    return IMAGE_PROVIDER_POLICY in {"vertex_only", "vertex"}


def resolve_api_key() -> str:
    for env_path in DEFAULT_ENV_FILES:
        load_env_file(env_path)
    if is_vertex_only_policy():
        vertex_config = resolve_vertex_config()
        if vertex_config:
            return vertex_config["api_key"]
        raise SystemExit(
            "Vertex-only image policy requires GOOGLE_API_KEY (or VERTEX_API_KEY / GOOGLE_GENAI_API_KEY) "
            "and GOOGLE_CLOUD_PROJECT (or GOOGLE_PROJECT_ID / VERTEX_PROJECT_ID)."
        )
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
    if " " in keyword or any(char in keyword for char in "Ã§ÄŸÄ±Ã¶ÅŸÃ¼Ã‡ÄÄ°Ã–ÅÃœ-"):
        return keyword.lower() in haystack
    return re.search(rf"(?<!\w){re.escape(keyword.lower())}(?!\w)", haystack, flags=re.IGNORECASE) is not None


def hash_index(*parts: str, modulo: int) -> int:
    if not modulo:
        return 0
    seed = "|".join(parts).encode("utf-8")
    return int(hashlib.sha256(seed).hexdigest()[:8], 16) % modulo


def infer_cover_branch(entry: dict[str, Any]) -> str:
    explicit = explicit_string(entry, "coverBranch", "cover_branch")
    if explicit in {"children", "nonfiction", "fiction"}:
        return explicit
    haystack = cover_haystack(entry)
    book_type = explicit_string(entry, "book_type", "bookType", "type").lower()
    if book_type == "cocuk":
        return "children"
    if book_type in {"fiction", "novel", "roman", "hikaye", "story", "literary-fiction", "edebi kurgu"}:
        return "fiction"
    category_or_type = f"{explicit_string(entry, 'category')} {explicit_string(entry, 'type')}".lower()
    if any(marker in category_or_type for marker in ("children", "Ã§ocuk", "cocuk")):
        return "children"
    if any(marker in category_or_type for marker in ("fiction", "novel", "roman", "hikaye", "story")):
        return "fiction"
    child_markers = ("storybook", "picture book", "bedtime", "masal", "resimli hikaye", "illustrated tale", "fairy tale")
    if any(marker in haystack for marker in child_markers):
        return "children"
    fiction_markers = ("roman", "novel", "hikaye", "istasyon", "tren", "railway drama", "literary fiction", "ensemble drama")
    if any(marker in haystack for marker in fiction_markers):
        return "fiction"
    return "nonfiction"


def infer_cover_genre(entry: dict[str, Any], branch: str | None = None) -> str:
    explicit = explicit_string(entry, "coverGenre", "cover_genre").lower()
    if explicit in GENRE_MATRIX:
        return explicit

    branch = branch or infer_cover_branch(entry)
    if branch == "children":
        return "children-illustrated"
    if branch == "fiction":
        return "narrative-fiction"

    book_type = explicit_string(entry, "book_type", "bookType", "type").lower()
    if book_type in {"fiction", "novel", "roman", "hikaye", "story", "literary-fiction", "edebi kurgu"}:
        return "narrative-fiction"
    if book_type in {"business", "marketing", "growth", "leadership", "non-fiction", "nonfiction"}:
        return "business-marketing"
    if book_type in {"expertise", "authority", "consulting", "consultant", "method"}:
        return "expertise-authority"
    if book_type in {"education", "training", "course", "workbook"}:
        return "education"
    if book_type in {"ai", "automation", "systems", "workflow"}:
        return "ai-systems"
    if book_type in {"self-help", "personal-development", "mindset", "habits"}:
        return "personal-development"

    category = str(entry.get("category") or "").lower()
    if "business" in category or "creator" in category or "marketing" in category or "leadership" in category:
        return "business-marketing"
    if "expertise" in category or "uzman" in category:
        return "expertise-authority"
    if "ai workflow" in category:
        return "ai-systems"
    if "education" in category:
        return "education"
    if "personal" in category or "kiÅŸisel" in category:
        return "personal-development"
    haystack = cover_haystack(entry)
    if any(
        haystack_has(haystack, marker) for marker in ("ai", "workflow", "prompt", "automation", "system", "sistem", "nizam")
    ):
        return "ai-systems"
    if any(
        haystack_has(haystack, marker) for marker in ("training", "teach", "teacher", "stem", "course", "workbook", "Ã¶ÄŸret", "egitim", "ensenar", "formateur")
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
        if any(marker in haystack for marker in ("learn", "learning", "stem", "activity", "count", "alphabet", "parent", "school", "Ã¶ÄŸren")):
            return "learning"
        return "storyworld"

    if genre == "narrative-fiction":
        if any(marker in haystack for marker in ("train", "rail", "istasyon", "platform", "peron", "station")):
            return "railway"
        if any(marker in haystack for marker in ("memory", "letter", "mektup", "geçmiş", "hatıra")):
            return "memory"
        return "ensemble"

    if genre == "business-marketing":
        if any(marker in haystack for marker in ("marketing", "offer", "positioning", "demand", "creator")):
            return "marketing"
        if any(marker in haystack for marker in ("leadership", "manager", "team lead", "remote", "fuhrung")):
            return "leadership"
        if any(marker in haystack for marker in ("system", "ops", "operations", "handoff", "agency", "team")):
            return "operations"
        return "growth"

    if genre == "expertise-authority":
        if any(marker in haystack for marker in ("method", "framework", "sistem", "metodo", "mÃ©thode", "metodo")):
            return "method"
        if any(marker in haystack for marker in ("mentor", "guide", "coach", "trainer", "formateur", "eÄŸitmen")):
            return "mentor"
        return "authority"

    if genre == "ai-systems":
        if any(marker in haystack for marker in ("team", "agency", "small teams", "ops leads", "operator")):
            return "team-systems"
        if any(marker in haystack for marker in ("productivity", "focus", "deep work", "odak")):
            return "productivity"
        if any(marker in haystack for marker in ("small business", "negocios pequenos", "kÃ¼Ã§Ã¼k", "business")):
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
    enriched["coverStyleMode"] = explicit_string(enriched, "coverStyleMode", "cover_style_mode") or "bookstore_bold"
    enriched["backCoverMode"] = explicit_string(enriched, "backCoverMode", "back_cover_mode") or "minimal_blurb"
    enriched["coverMode"] = explicit_string(enriched, "coverMode", "cover_mode") or DEFAULT_COVER_MODE
    enriched["styleDirection"] = explicit_string(enriched, "styleDirection", "style_direction") or DEFAULT_STYLE_DIRECTION
    enriched["wrapScope"] = explicit_string(enriched, "wrapScope", "wrap_scope") or DEFAULT_WRAP_SCOPE
    enriched["qualityGate"] = explicit_string(enriched, "qualityGate", "quality_gate") or DEFAULT_QUALITY_GATE
    return enriched


def cover_style_mode_for_entry(entry: dict[str, Any]) -> str:
    return str(normalized_cover_entry(entry).get("coverStyleMode") or "bookstore_bold")


def back_cover_mode_for_entry(entry: dict[str, Any]) -> str:
    return str(normalized_cover_entry(entry).get("backCoverMode") or "minimal_blurb")


def cover_mode_for_entry(entry: dict[str, Any]) -> str:
    return str(normalized_cover_entry(entry).get("coverMode") or DEFAULT_COVER_MODE)


def style_direction_for_entry(entry: dict[str, Any]) -> str:
    return str(normalized_cover_entry(entry).get("styleDirection") or DEFAULT_STYLE_DIRECTION)


def wrap_scope_for_entry(entry: dict[str, Any]) -> str:
    return str(normalized_cover_entry(entry).get("wrapScope") or DEFAULT_WRAP_SCOPE)


def quality_gate_for_entry(entry: dict[str, Any]) -> str:
    return str(normalized_cover_entry(entry).get("qualityGate") or DEFAULT_QUALITY_GATE)


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


def family_visual_directives(family: dict[str, Any]) -> str:
    family_id = str(family.get("id") or "").strip().lower()
    directives = {
        "commercial-bold": "Use a typography-first flat commercial cover with one bold emblem, bright controlled color, strong top title space, and true airport-bookstore clarity.",
        "executive-premium": "Use a flat premium-business cover with disciplined geometry, one centered symbol, restrained blocks, and clean hardcover-style hierarchy.",
        "clean-signal": "Use a clean trade-book cover with wide negative space, one sharp abstract signal, and crisp minimalist bestseller hierarchy.",
        "authority-serif": "Use an expert-authority trade-book cover with refined symmetry, a single authority mark, and serious nonfiction polish.",
        "method-ledger": "Use a method-book cover with controlled flat geometry, a single central badge motif, and practical commercial paperback energy.",
        "modern-mentor": "Use a mentor-led nonfiction cover with warmer flat color fields, one guiding motif, and polished bookstore typography.",
        "signal-grid": "Use a systems-book cover with modular flat structure, one luminous systems motif, and clean technical authority.",
        "interface-depth": "Use a technical trade-book cover with flatter interface geometry, one focal device-free symbol, and precise composition.",
        "calm-tech": "Use a restrained modern-tech cover with spacious flat color, one quiet focal cue, and premium simplicity.",
        "workbook-clear": "Use a bright educational trade-book cover with simple teaching geometry, clear typography, and clean instructional energy.",
        "instructor-premium": "Use a premium educator cover with cleaner flat structure, one academic focal motif, and strong title-first readability.",
        "curious-learning": "Use a discovery-led learning cover with brighter flat shapes, a simple focal form, and real educational bookstore polish.",
        "calm-focus": "Use a quiet self-development cover language with meditative spaciousness, gentle horizon cues, and premium reflective calm.",
        "soft-discipline": "Use a disciplined self-improvement cover language with warm restraint, cleaner geometry, and steady action-oriented clarity.",
        "elevated-reset": "Use a reflective renewal cover language with emotive light, elevated softness, and premium restorative atmosphere.",
        "midnight-platform": "Use an adult literary fiction cover with one cinematic night-platform scene, clean title room, and premium trade-paperback elegance.",
        "ember-carriage": "Use a warm railway-drama cover with one iconic station-or-carriage cue, restrained typography, and commercial literary polish.",
        "echo-rail": "Use a quiet ensemble-fiction cover with memory-rich rail atmosphere, negative space, and refined novel-shelf presence.",
        "storyworld": "Use a true storybook-cover language with rounded scenery, charming focal action, and child-safe emotional warmth.",
        "learning-adventure": "Use a playful educational picture-book language with lively motion, bright curiosity, and tactile exploratory shapes.",
        "bedtime-calm": "Use a bedtime picture-book language with soft moonlit calm, dreamy arcs, and reassuring gentle stillness.",
    }
    return directives.get(
        family_id,
        "Make it look like a real bookstore-ready book cover with one clear focal concept, disciplined typography space, and category-appropriate polish.",
    )


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
    requested = str(service or "auto").strip().lower() or "auto"
    if requested != "auto":
        if is_vertex_only_policy() and requested not in VERTEX_IMAGEN_MODELS and requested != "vertex-gemini-flash-image":
            return ["vertex-imagen-standard"]
        return [requested]
    providers = ["vertex-imagen-standard", "vertex-imagen-ultra"]
    if entry:
        normalized = normalized_cover_entry(entry)
        branch = infer_cover_branch(normalized)
        genre = infer_cover_genre(normalized, branch)
        if branch == "children" or genre == "education":
            providers.append("vertex-gemini-flash-image")
    if not is_vertex_only_policy():
        providers.extend(["nano-banana-pro", "nano-banana-2"])
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
    expected_words = expected_norm.split()
    observed_words = observed_norm.split()
    expected_tokens = set(expected_words)
    observed_tokens = set(observed_words)
    overlap = len(expected_tokens & observed_tokens)
    recall = overlap / max(1, len(expected_tokens))
    precision = overlap / max(1, len(observed_tokens))
    sequence = difflib.SequenceMatcher(None, expected_norm, observed_norm).ratio()
    ordered = difflib.SequenceMatcher(None, expected_words, observed_words).ratio()
    extra_penalty = max(0, len(observed_words) - len(expected_words)) * 0.045
    missing_penalty = max(0, len(expected_words) - overlap) * 0.07
    score = (sequence * 0.32) + (ordered * 0.28) + (recall * 0.22) + (precision * 0.18)
    score -= extra_penalty + missing_penalty
    if expected_norm in observed_norm and precision >= 0.72:
        score = max(score, 0.9 - extra_penalty)
    return round(max(0.0, min(score, 0.999)), 4)


def ai_text_strategy_for_entry(entry: dict[str, Any]) -> str:
    return "full_ai_front" if cover_mode_for_entry(entry) == "full_ai_front" else "local_overlay"


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

    candidates = [part.strip(" -,:;.") for part in re.split(r"[;:.!?]|(?:\s[-â€“â€”]\s)|,\s", subtitle) if part.strip()]
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
        summary_candidates = [part.strip(" -,:;.") for part in re.split(r"[;:.!?]|(?:\s[-â€“â€”]\s)|,\s", summary) if part.strip()]
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
        if value[0] in {"#", "@", "*", "â€¢"}:
            return True
        lowered = value.casefold()
        if lowered.startswith(("author:", "author ", "title:", "title ", "subtitle:", "subtitle ")):
            return True
    return False


def has_unexpected_adjacent_duplicate_words(expected: str, observed: str) -> bool:
    expected_words = normalize_compare_text(expected).split()
    observed_words = normalize_compare_text(observed).split()
    if not expected_words or not observed_words:
        return False
    expected_counts = collections.Counter(expected_words)
    for index in range(len(observed_words) - 1):
        token = observed_words[index]
        if token and token == observed_words[index + 1] and expected_counts.get(token, 0) < 2:
            return True
    return False


def has_prompt_leakage(fields: dict[str, str]) -> bool:
    observed = normalize_compare_text(
        " ".join(str(fields.get(key) or "") for key in ("title", "subtitle", "author", "all_text"))
    )
    if not observed:
        return False
    leak_markers = (
        "title title",
        "typography",
        "layout",
        "background simple",
        "commercial field",
        "no extra elements",
        "no extro elements",
        "central emblem",
        "icon stylized",
        "author background",
    )
    return any(marker in observed for marker in leak_markers)


def variant_specs_for_entry(entry: dict[str, Any]) -> list[dict[str, Any]]:
    entry = normalized_cover_entry(entry)
    families = list(families_for_entry(entry))
    full_ai_front = cover_mode_for_entry(entry) == "full_ai_front"
    render_mode = "ai-signature" if full_ai_front else "studio-exact"
    text_strategy = "full_ai_front" if full_ai_front else "local_overlay"
    suffixes = ("reference", "minimal", "classic")
    specs: list[dict[str, Any]] = []
    for index, family in enumerate(families[:3]):
        specs.append(
            {
                "id": f"{family['id']}-{suffixes[index]}",
                "label": str(family["label"]),
                "family": family,
                "render_mode": render_mode,
                "text_strategy": text_strategy,
            }
        )
    return specs


def ai_text_providers_for_entry(service: str, entry: dict[str, Any]) -> list[str]:
    ordered = normalize_service(service, entry)
    if str(service or "auto").strip().lower() == "auto" and cover_mode_for_entry(entry) == "full_ai_front":
        preferred_order = [
            "vertex-gemini-flash-image",
            "vertex-imagen-fast",
            "vertex-imagen-standard",
            "vertex-imagen-ultra",
            "nano-banana-pro",
            "nano-banana-2",
        ]
        ranked: list[str] = []
        for provider in preferred_order:
            if provider in ordered and provider not in ranked:
                ranked.append(provider)
        for provider in ordered:
            if provider not in ranked:
                ranked.append(provider)
        ordered = ranked
    allowed = [
        provider
        for provider in ordered
        if provider
        in {
            "vertex-imagen-standard",
            "vertex-imagen-ultra",
            "vertex-gemini-flash-image",
            "nano-banana-pro",
            "nano-banana-2",
        }
    ]
    if is_vertex_only_policy():
        allowed = [provider for provider in allowed if provider.startswith("vertex-")]
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


def provider_request_timeout() -> tuple[int, int]:
    try:
        connect_timeout = max(5, int(os.environ.get("BOOK_COVER_PROVIDER_CONNECT_TIMEOUT_SECONDS", "10") or "10"))
    except (TypeError, ValueError):
        connect_timeout = 10
    try:
        read_timeout = max(20, int(os.environ.get("BOOK_COVER_PROVIDER_READ_TIMEOUT_SECONDS", "90") or "90"))
    except (TypeError, ValueError):
        read_timeout = 90
    return (connect_timeout, read_timeout)


def download_image(url: str, output_path: Path) -> bool:
    response = requests.get(url, timeout=provider_request_timeout())
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
        timeout=provider_request_timeout(),
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
        timeout=provider_request_timeout(),
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


def genre_split_cover_profile(entry: dict[str, Any], family: dict[str, Any], mode: str) -> dict[str, str]:
    entry = normalized_cover_entry(entry)
    branch = str(entry.get("coverBranch") or "nonfiction")
    genre = str(entry.get("coverGenre") or "business-marketing")
    family_label = str(family.get("label") or family.get("id") or "studio")

    if branch == "children":
        return {
            "direction": (
                "Create a warm illustration-first children's bookstore cover with a clear story moment, rounded shapes, vivid color, "
                "and friendly hand-painted energy."
            ),
            "composition": (
                f"Use the {family_label} family to build one memorable child-safe focal scene, generous clean title room, and a small elegant author line."
            ),
            "hard_rules": (
                "No dark thriller mood, no adult nonfiction layout, no empty corporate gradient, and no product-ad styling."
            ),
        }

    if branch == "fiction" or genre == "narrative-fiction":
        return {
            "direction": (
                "Create a cinematic literary-fiction cover with one emotionally charged scene or object, richer atmosphere, and elegant bookstore realism."
            ),
            "composition": (
                f"Use the {family_label} family to anchor one central dramatic cue, atmospheric depth, and refined novel-shelf composition."
            ),
            "hard_rules": (
                "No business-book badges, no dashboard geometry, no fake productivity graphics, no generic poster typography, and no brochure layout."
            ),
        }

    if genre == "ai-systems":
        return {
            "direction": (
                "Create a technical trade-book cover for AI systems with one clean luminous systems symbol, controlled futurism, and real bookstore polish."
            ),
            "composition": (
                f"Use the {family_label} family with a high-end technical emblem, disciplined spacing, and strong title-first hierarchy."
            ),
            "hard_rules": (
                "No robots, no human portraits, no laptops, no SaaS dashboards, no UI screenshots, and no slide-deck styling."
            ),
        }

    if genre == "education":
        return {
            "direction": (
                "Create a clear educational trade-book cover with approachable teaching energy, brighter color, and a practical but commercial bookstore finish."
            ),
            "composition": (
                f"Use the {family_label} family with one teaching motif, open hierarchy, and strong instructional readability."
            ),
            "hard_rules": (
                "No classroom stock photography, no worksheet clutter, no toy-store look, and no flat poster-board composition."
            ),
        }

    if genre == "personal-development":
        return {
            "direction": (
                "Create a premium self-development cover with calm atmosphere, modern emotional restraint, and believable bookstore realism."
            ),
            "composition": (
                f"Use the {family_label} family with one clean emotive cue, soft premium color, and refined title presence."
            ),
            "hard_rules": (
                "No meditation-app UI, no wellness poster clichés, no sticker bursts, and no noisy geometric clutter."
            ),
        }

    return {
        "direction": (
            "Create a commercial nonfiction trade-book cover with bold title dominance, one strong symbol, and clean airport-bookstore readability."
        ),
        "composition": (
            f"Use the {family_label} family with one symbolic focal element, direct hierarchy, and strong paperback realism."
        ),
        "hard_rules": (
            "No people, no office scenes, no devices, no brochure styling, no product mockups, and no extra sticker copy."
        ),
    }


def ai_front_quality_targets(entry: dict[str, Any], mode: str) -> str:
    entry = normalized_cover_entry(entry)
    subtitle = ai_text_targets(entry, mode).get("subtitle") or ""
    branch = str(entry.get("coverBranch") or "nonfiction")
    genre = str(entry.get("coverGenre") or "business-marketing")
    if branch == "children":
        return (
            "The finished image must look like a real children's book cover sold in bookstores, with cohesive title lettering, vivid scene clarity, "
            "and strong readability even at thumbnail size."
        )
    if branch == "fiction" or genre == "narrative-fiction":
        return (
            "The finished image must feel like a professionally published novel cover, with elegant integrated title typography, emotional atmosphere, "
            "and high credibility on a bookstore shelf."
        )
    subtitle_requirement = (
        "Include a compact subtitle line with the exact wording requested. "
        if subtitle and mode == "ai-signature"
        else "Keep secondary copy extremely limited and elegant. "
    )
    return (
        "The finished image must look unmistakably like a professionally published bookstore book cover. "
        f"{subtitle_requirement}"
        "Keep the title crisp and dominant, the author line clean, and the composition simple enough for strong thumbnail readability."
    )


def ai_text_prompt(entry: dict[str, Any], family: dict[str, Any], mode: str, attempt_index: int = 1) -> str:
    entry = normalized_cover_entry(entry)
    targets = ai_text_targets(entry, mode)
    title = targets["title"]
    subtitle = targets["subtitle"]
    author = targets["author"]
    category = str(entry.get("category") or "").strip().lower() or "nonfiction"
    topic = derive_visual_topic(entry)
    style = str(family.get("artDirection") or "").strip()
    family_directive = family_visual_directives(family)
    split_profile = genre_split_cover_profile(entry, family, mode)
    title_instruction = f'Render the exact title text: "{title}".'
    subtitle_instruction = f'Render the exact subtitle text: "{subtitle}".' if subtitle and mode == "ai-signature" else ""
    author_instruction = f'Render the exact author name: "{author}".' if author else ""
    missing_line_instruction = ""
    if not subtitle or mode != "ai-signature":
        missing_line_instruction += " Do not invent or add any subtitle line."
    if not author:
        missing_line_instruction += " Do not invent or add any author name, author placeholder, byline, imprint, or publisher line."
    minimal_instruction = (
        "Use a very clean hierarchy: dominant title, optional small author, no sticker copy, no subtitle unless explicitly requested, and no extra copy. The title may wrap to two or three lines, but the exact words must stay intact and in the same order."
        if mode == "ai-minimal"
        else "Use a classic bookstore hierarchy: oversized title, compact subtitle, clear author line, and a single central emblem or scene."
    )
    genre_bias = ""
    if str(entry.get("coverGenre") or "") in {"business-marketing", "expertise-authority"}:
        genre_bias = (
            " For business and authority nonfiction, prefer a bright commercial field with warm amber, saffron, sand, coral, or disciplined teal tones, "
            "large elegant title typography, one centered seal or symbolic icon, minimal secondary copy, a premium mass-market paperback feel, and no portrait photography or human figures."
        )
    retry_instruction = ""
    if attempt_index > 1:
        retry_instruction = (
            " Retry rule: the previous attempt likely misspelled, reordered, or crowded the text. "
            "Keep the wording exact, preserve word order, simplify the composition, enlarge the title, and remove any extra characters or invented punctuation."
        )
    return (
        f"Create a finished premium portrait {category} book cover, not just background art. "
        f"Art direction: {topic}. Visual language: {style}. "
        f"{family_directive} "
        f"{split_profile['direction']} {split_profile['composition']} {split_profile['hard_rules']} "
        f"{title_instruction} {subtitle_instruction} {author_instruction} {missing_line_instruction} "
        f"{minimal_instruction} "
        f"{genre_bias} "
        f"{ai_front_quality_targets(entry, mode)} "
        "Use only one main symbol or focal object. "
        "Keep the title in the top third or upper-middle area with generous breathing room and clear margin from the trim. "
        "Reserve a clean uninterrupted title-safe zone. No line, frame, symbol, glow, texture, or object may cross over the title letters. "
        "Use large publication-quality lettering that feels typeset for a real hardcover or trade paperback, not poster text or app UI text. "
        "Place the author on a separate calm band near the bottom and keep subtitle smaller and quieter than the title. "
        "Keep the background simple enough that the text remains perfectly readable. "
        "It must look unmistakably like a professionally published book cover, not a poster, brochure, slide, product render, or generic AI scene. "
        "Do not render any instruction words from this prompt, including title, subtitle, author, typography, layout, background, or icon. "
        "Only render the requested title, subtitle, and author. Do not add any other words, badges, blurbs, fake endorsements, logos, watermarks, glyphs, icons, publisher names, or extra typography. "
        "Every requested word matters, including short words such as The, Of, For, And, or With. Do not omit them. "
        "Preserve the exact casing and spelling of brand-like words such as ChatGPT, OpenAI, YouTube, TikTok, or LinkedIn when they appear in the requested text. "
        "Do not rewrite, abbreviate, phoneticize, or creatively reinterpret the requested text. "
        "Render the title once as a single clear title block. Do not echo part of the title in a smaller header line, kicker, eyebrow, or category label. "
        "Do not add any category tag, genre line, imprint line, or topic label above the title. "
        "Do not add prefixed characters such as #, bullets, quote marks, labels like Author:, or decorative prefixes before any line of text. "
        "The text must be crisp, professional, centered or cleanly aligned, and look like a real bookstore-ready cover. "
        "Do not let decorative lines or scene details touch the text. Do not put text inside badges, ribbons, fake stickers, seals, speech bubbles, or UI panels. "
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


def extract_json_object(text: str) -> dict[str, Any]:
    stripped = str(text or "").strip()
    if not stripped:
        return {}
    candidates = [stripped]
    match = re.search(r"\{.*\}", stripped, flags=re.DOTALL)
    if match:
        candidates.insert(0, match.group(0))
    for candidate in candidates:
        try:
            payload = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(payload, dict):
            return payload
    return {}


def image_mime_type(image_path: Path) -> str:
    suffix = image_path.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        return "image/jpeg"
    if suffix == ".webp":
        return "image/webp"
    return "image/png"


def clean_ocr_value(value: Any) -> str:
    text = str(value or "").strip().strip('"').strip("'")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def gemini_ocr_models() -> tuple[str, ...]:
    return ("gemini-2.5-flash", "gemini-2.5-flash-lite")


def gemini_visual_review_models() -> tuple[str, ...]:
    return ("gemini-2.5-flash-lite", "gemini-2.5-flash")


def ocr_cover_fields(image_path: Path) -> dict[str, str]:
    config = resolve_vertex_config()
    if not config or not image_path.exists():
        return {"title": "", "subtitle": "", "author": "", "all_text": ""}

    encoded_image = base64.b64encode(image_path.read_bytes()).decode("utf-8")
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": (
                            "Read the visible text on this book cover and return JSON only. "
                            'Use exactly these keys: "title", "subtitle", "author", "all_text". '
                            "Preserve the visible wording and word order exactly as shown. "
                            "Do not infer missing letters. If a field is absent, use an empty string. "
                            "Put every readable word into all_text in natural reading order."
                        )
                    },
                    {
                        "inlineData": {
                            "mimeType": image_mime_type(image_path),
                            "data": encoded_image,
                        }
                    },
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0,
            "topP": 0.1,
            "responseMimeType": "application/json",
        },
    }

    for model in gemini_ocr_models():
        response = requests.post(
            VERTEX_GEMINI_TEXT_URL_TEMPLATE.format(model=model, api_key=config["api_key"]),
            headers={"Content-Type": "application/json; charset=utf-8"},
            json=payload,
            timeout=120,
        )
        if not response.ok:
            continue
        parsed = extract_json_object(extract_text_candidate(safe_json_response(response)))
        if not parsed:
            continue
        title = clean_ocr_value(parsed.get("title"))
        subtitle = clean_ocr_value(parsed.get("subtitle"))
        author = clean_ocr_value(parsed.get("author"))
        all_text = clean_ocr_value(parsed.get("all_text")) or " ".join(
            part for part in (title, subtitle, author) if part
        ).strip()
        return {
            "title": title,
            "subtitle": subtitle,
            "author": author,
            "all_text": all_text,
        }

    return {"title": "", "subtitle": "", "author": "", "all_text": ""}


def validation_text_similarity_score(
    *,
    title_score: float,
    subtitle_score: float,
    author_score: float,
    combined_score: float,
    subtitle_present: bool,
    author_present: bool,
) -> float:
    score = (title_score * 0.5) + (combined_score * 0.26)
    if subtitle_present:
        score += subtitle_score * 0.14
    else:
        score += 0.14
    if author_present:
        score += author_score * 0.1
    else:
        score += 0.1
    return round(max(0.0, min(score, 0.999)), 4)


def watermark_or_badge_text_detected(fields: dict[str, str]) -> bool:
    observed = normalize_compare_text(" ".join(str(fields.get(key) or "") for key in ("title", "subtitle", "author", "all_text")))
    if not observed:
        return False
    markers = (
        "watermark",
        "sample",
        "stock",
        "preview",
        "demo",
        "award winning",
        "best seller",
        "badge",
        "logo",
    )
    return any(marker in observed for marker in markers)


def should_run_ocr_for_cover(entry: dict[str, Any]) -> bool:
    if cover_mode_for_entry(entry) == "full_ai_front":
        return AI_FRONT_OCR_ENABLED
    return True


def validate_ai_cover_text(entry: dict[str, Any], image_path: Path, mode: str) -> dict[str, Any]:
    targets = ai_text_targets(entry, mode)
    if not should_run_ocr_for_cover(entry):
        subtitle_requested = bool(targets["subtitle"] and mode == "ai-signature")
        return {
            "valid": True,
            "eligible": True,
            "validationMode": "visual_only",
            "ocrText": "",
            "ocrFields": {"title": "", "subtitle": "", "author": "", "all_text": ""},
            "targets": targets,
            "prefixGuardFailed": False,
            "promptLeakageFailed": False,
            "titleDuplicationFailed": False,
            "watermarkOrBadgeFailed": False,
            "authorExtraWords": 0,
            "combinedScore": 0.62,
            "extraWordCount": 0,
            "titleScore": 0.62,
            "subtitleScore": 0.62 if subtitle_requested else 1.0,
            "authorScore": 0.62 if targets["author"] else 1.0,
            "textSimilarityScore": 0.62,
            "hardRejectReasons": [],
            "minorIssues": ["OCR disabled for AI front cover iteration; candidate ranked by visual review."],
        }

    fields = ocr_cover_fields(image_path)
    title = targets["title"]
    subtitle = targets["subtitle"]
    author = targets["author"]
    title_observed = fields["title"] or fields["all_text"]
    if mode == "ai-minimal":
        title_observed = " ".join(part for part in (fields["title"], fields["subtitle"]) if part).strip() or fields["all_text"]
    subtitle_observed = fields["subtitle"] or fields["all_text"]
    author_observed = fields["author"] or fields["all_text"]
    combined_expected = " ".join(part for part in (title, subtitle, author) if part).strip()
    combined_observed = fields["all_text"] or " ".join(
        part for part in (title_observed, subtitle_observed, author_observed) if part
    ).strip()
    title_score = compare_text_score(title, title_observed)
    subtitle_score = compare_text_score(subtitle, subtitle_observed) if subtitle and mode == "ai-signature" else 1.0
    author_score = compare_text_score(author, author_observed) if author else 1.0
    combined_score = compare_text_score(combined_expected, combined_observed) if combined_expected else 1.0
    prefix_guard = has_disallowed_text_prefix(fields)
    prompt_leakage = has_prompt_leakage(fields)
    title_duplication = has_unexpected_adjacent_duplicate_words(title, title_observed)
    author_expected_words = normalize_compare_text(author).split()
    author_observed_words = normalize_compare_text(author_observed).split()
    author_extra_words = max(0, len(author_observed_words) - len(author_expected_words)) if author_expected_words else 0
    combined_expected_words = normalize_compare_text(combined_expected).split()
    combined_observed_words = normalize_compare_text(combined_observed).split()
    extra_word_count = max(0, len(combined_observed_words) - len(combined_expected_words))
    watermark_or_badge = watermark_or_badge_text_detected(fields)
    text_similarity_score = validation_text_similarity_score(
        title_score=title_score,
        subtitle_score=subtitle_score,
        author_score=author_score,
        combined_score=combined_score,
        subtitle_present=bool(subtitle and mode == "ai-signature"),
        author_present=bool(author),
    )
    valid = title_score >= AI_TEXT_TITLE_MIN_SCORE and author_score >= AI_TEXT_AUTHOR_MIN_SCORE
    if mode == "ai-signature" and subtitle:
        valid = valid and subtitle_score >= AI_TEXT_SUBTITLE_MIN_SCORE
    valid = valid and combined_score >= 0.72
    valid = valid and extra_word_count <= 8
    valid = valid and author_extra_words == 0
    valid = valid and not prefix_guard and not prompt_leakage and not title_duplication
    hard_reject_reasons: list[str] = []
    if title_score < 0.34:
        hard_reject_reasons.append("Title is missing, wrong, or unreadable.")
    if combined_score < 0.28:
        hard_reject_reasons.append("Cover text is mostly unreadable or uses the wrong alphabet.")
    if extra_word_count >= 14:
        hard_reject_reasons.append("Cover contains too many extra words beyond the requested book text.")
    if prefix_guard or prompt_leakage:
        hard_reject_reasons.append("Prompt leakage or label-like instruction text appeared on the cover.")
    if title_duplication:
        hard_reject_reasons.append("Title text was duplicated or rendered with repeated adjacent words.")
    if watermark_or_badge:
        hard_reject_reasons.append("Unexpected watermark, badge, or stock-like text appeared on the cover.")

    minor_issues: list[str] = []
    if not hard_reject_reasons:
        if mode == "ai-signature" and subtitle and subtitle_score < AI_TEXT_SUBTITLE_MIN_SCORE:
            minor_issues.append("Subtitle text is imperfect.")
        if author and author_score < AI_TEXT_AUTHOR_MIN_SCORE:
            minor_issues.append("Author line is imperfect.")
        if extra_word_count > 0:
            minor_issues.append("Minor extra text was detected.")

    return {
        "valid": bool(valid),
        "eligible": not hard_reject_reasons,
        "validationMode": "ocr",
        "ocrText": "\n".join(part for part in fields.values() if part).strip(),
        "ocrFields": fields,
        "targets": targets,
        "prefixGuardFailed": prefix_guard,
        "promptLeakageFailed": prompt_leakage,
        "titleDuplicationFailed": title_duplication,
        "watermarkOrBadgeFailed": watermark_or_badge,
        "authorExtraWords": author_extra_words,
        "combinedScore": round(combined_score, 4),
        "extraWordCount": extra_word_count,
        "titleScore": round(title_score, 4),
        "subtitleScore": round(subtitle_score, 4),
        "authorScore": round(author_score, 4),
        "textSimilarityScore": text_similarity_score,
        "hardRejectReasons": hard_reject_reasons,
        "minorIssues": minor_issues,
    }


def art_has_excess_text(image_path: Path) -> bool:
    fields = ocr_cover_fields(image_path)
    observed_words = normalize_compare_text(fields.get("all_text") or "").split()
    return len(observed_words) > 2


def clean_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    cleaned: list[str] = []
    for item in value:
        text = str(item or "").strip()
        if text:
            cleaned.append(text)
    return cleaned


def heuristic_cover_review(
    entry: dict[str, Any],
    front_score: dict[str, Any],
    back_score: dict[str, Any],
) -> dict[str, Any]:
    entry = normalized_cover_entry(entry)
    genre = str(entry.get("coverGenre") or "")
    branch = str(entry.get("coverBranch") or "")
    center_stats = (front_score.get("zones") or {}).get("center") or {}
    rejection_reasons: list[str] = []
    visual_flags = {
        "hasPeople": False,
        "focalConceptCount": 1,
        "looksLikeDashboard": False,
        "hasCleanTypographyBands": True,
        "noisyFullPage": False,
        "hasWatermarkOrBadge": False,
        "hasExtraneousText": False,
        "categoryFit": 7,
        "thumbnailReadability": 7,
        "titleReadability": 7,
        "typographyQuality": 7,
        "bookstoreRealism": 7,
        "notes": [],
    }

    if branch != "children" and genre in {"business-marketing", "expertise-authority", "education", "personal-development", "ai-systems"}:
        if float(center_stats.get("stdDev") or 0.0) >= 78 and float(center_stats.get("edge") or 0.0) >= 66:
            rejection_reasons.append("Cover reads as unusably cluttered with too many competing concepts.")
        elif float(center_stats.get("stdDev") or 0.0) >= 64 or float(center_stats.get("edge") or 0.0) >= 54:
            visual_flags["focalConceptCount"] = 2
            visual_flags["noisyFullPage"] = True
            visual_flags["thumbnailReadability"] = 5
            visual_flags["bookstoreRealism"] = 5
        if float((front_score.get("overall") or {}).get("mean") or 0.0) <= 84:
            visual_flags["looksLikeDashboard"] = True
            visual_flags["bookstoreRealism"] = min(int(visual_flags["bookstoreRealism"]), 5)

    pair_score = max(
        0.0,
        min(
            100.0,
            (float(front_score.get("score") or 0.0) * 0.56)
            + (float(back_score.get("score") or 0.0) * 0.2)
            + 18.0,
        ),
    )
    return {
        "valid": not rejection_reasons,
        "pairScore": round(pair_score, 2),
        "rejectionReasons": rejection_reasons,
        "visualFlags": visual_flags,
    }


def review_cover_visuals(image_path: Path, entry: dict[str, Any]) -> dict[str, Any]:
    config = resolve_vertex_config()
    if not config or not image_path.exists():
        return {}

    try:
        visual_review_timeout = max(
            10,
            int(os.environ.get("BOOK_COVER_VISUAL_REVIEW_TIMEOUT_SECONDS", "25") or "25"),
        )
    except (TypeError, ValueError):
        visual_review_timeout = 25
    try:
        visual_review_model_limit = max(
            1,
            int(os.environ.get("BOOK_COVER_VISUAL_REVIEW_MAX_MODELS", "1") or "1"),
        )
    except (TypeError, ValueError):
        visual_review_model_limit = 1

    encoded_image = base64.b64encode(image_path.read_bytes()).decode("utf-8")
    entry = normalized_cover_entry(entry)
    genre = str(entry.get("coverGenre") or "nonfiction")
    branch = str(entry.get("coverBranch") or "nonfiction")
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": (
                            "Review this composed book cover as a professional bookstore cover and return JSON only. "
                            'Use exactly these keys: "hasPeople", "focalConceptCount", "looksLikeDashboard", '
                            '"hasCleanTypographyBands", "noisyFullPage", "hasWatermarkOrBadge", "categoryFit", '
                            '"thumbnailReadability", "titleReadability", "typographyQuality", '
                            '"bookstoreRealism", "hasExtraneousText", "notes". '
                            f"The book branch is {branch} and the genre is {genre}. "
                            "Be strict about commercial paperback quality. "
                            "If this looks like a dashboard card, poster, brochure, or cluttered art board, mark looksLikeDashboard true. "
                            "If any decorative line, frame, symbol, or art element intrudes on the title or author safe area, mark hasCleanTypographyBands false. "
                            "If it has people, faces, or portrait photography on a nonfiction business or expertise cover, mark hasPeople true. "
                            "If it contains a fake badge, watermark, fake logo, or stock-site residue, mark hasWatermarkOrBadge true. "
                            "If there is stray text, extra words, ghost letters, or unwanted copy beyond the intended cover text, mark hasExtraneousText true. "
                            "categoryFit, thumbnailReadability, titleReadability, typographyQuality, and bookstoreRealism should be integers from 0 to 10."
                        )
                    },
                    {
                        "inlineData": {
                            "mimeType": image_mime_type(image_path),
                            "data": encoded_image,
                        }
                    },
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0,
            "topP": 0.1,
            "responseMimeType": "application/json",
        },
    }

    for model in gemini_visual_review_models()[:visual_review_model_limit]:
        try:
            response = requests.post(
                VERTEX_GEMINI_TEXT_URL_TEMPLATE.format(model=model, api_key=config["api_key"]),
                headers={"Content-Type": "application/json; charset=utf-8"},
                json=payload,
                timeout=(8, visual_review_timeout),
            )
        except requests.RequestException:
            continue
        if not response.ok:
            continue
        parsed = extract_json_object(extract_text_candidate(safe_json_response(response)))
        if not parsed:
            continue
        try:
            focal_count = int(parsed.get("focalConceptCount") or 0)
        except (TypeError, ValueError):
            focal_count = 0
        try:
            category_fit = int(parsed.get("categoryFit") or 0)
        except (TypeError, ValueError):
            category_fit = 0
        try:
            thumbnail_readability = int(parsed.get("thumbnailReadability") or 0)
        except (TypeError, ValueError):
            thumbnail_readability = 0
        try:
            title_readability = int(parsed.get("titleReadability") or 0)
        except (TypeError, ValueError):
            title_readability = 0
        try:
            typography_quality = int(parsed.get("typographyQuality") or 0)
        except (TypeError, ValueError):
            typography_quality = 0
        try:
            bookstore_realism = int(parsed.get("bookstoreRealism") or 0)
        except (TypeError, ValueError):
            bookstore_realism = 0
        return {
            "hasPeople": bool(parsed.get("hasPeople", False)),
            "focalConceptCount": max(0, focal_count),
            "looksLikeDashboard": bool(parsed.get("looksLikeDashboard", False)),
            "hasCleanTypographyBands": parsed.get("hasCleanTypographyBands") is not False,
            "noisyFullPage": bool(parsed.get("noisyFullPage", False)),
            "hasWatermarkOrBadge": bool(parsed.get("hasWatermarkOrBadge", False)),
            "hasExtraneousText": bool(parsed.get("hasExtraneousText", False)),
            "categoryFit": max(0, min(10, category_fit)),
            "thumbnailReadability": max(0, min(10, thumbnail_readability)),
            "titleReadability": max(0, min(10, title_readability)),
            "typographyQuality": max(0, min(10, typography_quality)),
            "bookstoreRealism": max(0, min(10, bookstore_realism)),
            "notes": clean_string_list(parsed.get("notes")),
        }

    return {}


def evaluate_cover_pair_quality(
    entry: dict[str, Any],
    front_score: dict[str, Any],
    back_score: dict[str, Any],
    front_visual_review: dict[str, Any] | None = None,
) -> dict[str, Any]:
    entry = normalized_cover_entry(entry)
    branch = str(entry.get("coverBranch") or "")
    heuristic = heuristic_cover_review(entry, front_score, back_score)
    review = dict(front_visual_review or {})
    rejection_reasons = list(heuristic.get("rejectionReasons") or [])
    visual_flags = dict(heuristic.get("visualFlags") or {})

    if review:
        visual_flags.update({key: value for key, value in review.items() if key != "notes"})
        notes = clean_string_list(review.get("notes"))
        if notes:
            visual_flags["notes"] = notes
        if review.get("hasPeople") and branch == "nonfiction":
            rejection_reasons.append("Cover contains people or portrait cues not allowed for this nonfiction category.")
        if bool(review.get("hasWatermarkOrBadge")):
            rejection_reasons.append("Cover contains a watermark, badge, or fake stock/logo artifact.")
        if bool(review.get("hasExtraneousText")):
            rejection_reasons.append("Cover contains stray text or unwanted extra lettering.")
        if review.get("hasCleanTypographyBands") is False:
            rejection_reasons.append("Cover does not preserve clean typography bands for title and author.")
        if int(review.get("focalConceptCount") or 0) >= 3:
            rejection_reasons.append("Cover has too many competing focal concepts.")
        if int(review.get("thumbnailReadability") or 0) <= 2:
            rejection_reasons.append("Cover title area is too weak for readable thumbnail presentation.")
        if int(review.get("titleReadability") or 0) <= 2:
            rejection_reasons.append("Cover title itself is not readable enough for a professional book cover.")
        if int(review.get("typographyQuality") or 0) <= 2:
            rejection_reasons.append("Cover typography quality is too weak for a published-book presentation.")
        if int(review.get("categoryFit") or 0) <= 2:
            rejection_reasons.append("Cover is far outside the expected genre language.")

    deduped_reasons: list[str] = []
    seen_reasons: set[str] = set()
    for reason in rejection_reasons:
        text = str(reason or "").strip()
        if not text or text in seen_reasons:
            continue
        seen_reasons.add(text)
        deduped_reasons.append(text)

    pair_score = float(heuristic.get("pairScore") or 0.0)
    category_fit = int((review or {}).get("categoryFit") or 0)
    thumbnail_readability = int((review or {}).get("thumbnailReadability") or 0)
    title_readability = int((review or {}).get("titleReadability") or 0)
    typography_quality = int((review or {}).get("typographyQuality") or 0)
    bookstore_realism = int((review or {}).get("bookstoreRealism") or 0)
    if category_fit > 0:
        pair_score = max(0.0, min(100.0, pair_score + ((category_fit - 6) * 3.4)))
    if thumbnail_readability > 0:
        pair_score = max(0.0, min(100.0, pair_score + ((thumbnail_readability - 6) * 3.2)))
    if title_readability > 0:
        pair_score = max(0.0, min(100.0, pair_score + ((title_readability - 6) * 3.8)))
    if typography_quality > 0:
        pair_score = max(0.0, min(100.0, pair_score + ((typography_quality - 6) * 3.5)))
    if bookstore_realism > 0:
        pair_score = max(0.0, min(100.0, pair_score + ((bookstore_realism - 6) * 3.0)))
    if bool((review or {}).get("looksLikeDashboard")):
        pair_score = max(0.0, pair_score - 12.0)
    if bool((review or {}).get("noisyFullPage")):
        pair_score = max(0.0, pair_score - 10.0)
    if int((review or {}).get("focalConceptCount") or 0) > 1:
        pair_score = max(0.0, pair_score - (min(3, int((review or {}).get("focalConceptCount") or 0)) - 1) * 7.5)
    if deduped_reasons:
        pair_score = max(0.0, pair_score - min(18.0, len(deduped_reasons) * 4.5))

    return {
        "valid": not deduped_reasons,
        "pairScore": round(pair_score, 2),
        "rejectionReasons": deduped_reasons,
        "visualFlags": visual_flags,
        "visualGrade": max(0, min(10, bookstore_realism or int(visual_flags.get("bookstoreRealism") or 0))),
        "genreFitScore": max(0, min(10, category_fit or int(visual_flags.get("categoryFit") or 0))),
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
    attempt_count = 0
    quality_gate = quality_gate_for_entry(entry)
    for attempt_index in range(1, AI_TEXT_MAX_ATTEMPTS + 1):
        prompt = ai_text_prompt(entry, family, mode, attempt_index)
        for provider in providers:
            with tempfile.TemporaryDirectory(prefix=f"ai-text-cover-{entry['slug']}-{mode}-") as temp_dir:
                temp_image = Path(temp_dir) / "cover.png"
                if not generate_variant(prompt, temp_image, api_key, provider):
                    continue
                attempt_count += 1
                validation = validate_ai_cover_text(entry, temp_image, mode)
                visual_review = review_cover_visuals(temp_image, entry)
                validation["visualReview"] = visual_review
                visual_hard_rejects: list[str] = []
                if visual_review:
                    if bool(visual_review.get("hasWatermarkOrBadge")):
                        visual_hard_rejects.append("Cover contains a watermark, badge, or fake stock/logo artifact.")
                    if bool(visual_review.get("hasExtraneousText")):
                        visual_hard_rejects.append("Cover contains stray text or unwanted extra lettering.")
                    if visual_review.get("hasCleanTypographyBands") is False:
                        visual_hard_rejects.append("Cover does not preserve clean typography bands for title and author.")
                    if int(visual_review.get("titleReadability") or 0) <= 2:
                        visual_hard_rejects.append("Cover title itself is not readable enough for a professional book cover.")
                    if int(visual_review.get("typographyQuality") or 0) <= 2:
                        visual_hard_rejects.append("Cover typography quality is too weak for a published-book presentation.")
                if visual_hard_rejects:
                    validation["hardRejectReasons"] = list(validation.get("hardRejectReasons") or []) + visual_hard_rejects
                if validation.get("hardRejectReasons"):
                    continue
                base_text_score = float(validation.get("textSimilarityScore") or 0.0)
                visual_score = 0.0
                if visual_review:
                    visual_score = max(
                        0.0,
                        min(
                            1.0,
                            (
                                (float(visual_review.get("titleReadability") or 0.0) * 0.28)
                                + (float(visual_review.get("typographyQuality") or 0.0) * 0.24)
                                + (float(visual_review.get("thumbnailReadability") or 0.0) * 0.18)
                                + (float(visual_review.get("bookstoreRealism") or 0.0) * 0.18)
                                + (float(visual_review.get("categoryFit") or 0.0) * 0.12)
                            )
                            / 10.0,
                        ),
                    )
                validation_mode = str(validation.get("validationMode") or "ocr")
                if validation_mode == "visual_only":
                    candidate_score = (visual_score * 0.78) + (base_text_score * 0.22)
                else:
                    candidate_score = (base_text_score * 0.54) + (visual_score * 0.46 if visual_score > 0 else 0.0)
                if validation.get("valid"):
                    candidate_score += 0.06
                candidate_score -= min(0.09, len(validation.get("minorIssues") or []) * 0.03)
                if best is None or candidate_score > float(best.get("candidateScore") or 0.0):
                    shutil.copyfile(temp_image, output_path)
                    best = {
                        "provider": provider,
                        "validation": validation,
                        "visualReview": visual_review,
                        "path": output_path,
                        "candidateScore": round(candidate_score, 4),
                        "attemptCount": attempt_count,
                    }
                if quality_gate != "best_available" and validation["valid"]:
                    shutil.copyfile(temp_image, output_path)
                    return {
                        "provider": provider,
                        "validation": validation,
                        "visualReview": visual_review,
                        "path": output_path,
                        "candidateScore": round(candidate_score, 4),
                        "attemptCount": attempt_count,
                    }
    return best


# generate_with_grok removed â€“ Grok no longer available


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
            f"Use {motif}. Make it feel like a real high-quality children's picture book cover sold in bookstores. "
            "Leave generous empty space at top and bottom for title and author text. "
            "Rich colors, warm emotional safety, and illustration-ready composition. "
            "Avoid hard-edged corporate geometry, harsh monoliths, or severe adult nonfiction energy. "
            "Background artwork only - do not include any text, letters, words, or numbers."
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

    if genre in {"business-marketing", "expertise-authority"}:
        return (
            f"Create premium portrait background artwork for a commercial {category} nonfiction cover. Art direction: {topic}. "
            "Use one centered symbolic emblem or seal, a bright solid or gently graded color field, restrained editorial texture, and strong negative space. "
            "No people, no portrait photography, no faces, no office scenes, no devices, and no busy collage elements. "
            f"{frame_note} "
            "Make it feel like a real mass-market business paperback with high thumbnail readability and clean top and bottom typography bands. "
            "Background artwork only - do not include any text, letters, words, numbers, logos, or watermarks."
        )

    return (
        f"Create premium portrait editorial background artwork for a {category} nonfiction cover. Art direction: {topic}. "
        f"Use {motif}. {frame_note} "
        "Make it feel like a real high-end nonfiction bestseller cover sold in bookstores. "
        "Leave generous empty space at top and bottom for title and author text. "
        "Cinematic composition, tactile print texture, and coherent layout from edge to edge. "
        "Background artwork only - do not include any text, letters, words, numbers, or logos."
    )


def variant_prompt_suffix(
    family: dict[str, Any],
    entry: dict[str, Any],
    attempt_index: int = 1,
) -> str:
    entry = normalized_cover_entry(entry)
    genre_key = str(entry.get("coverGenre") or infer_cover_genre(entry))
    genre_label = str(GENRE_MATRIX.get(genre_key, {}).get("label") or "nonfiction")
    branch = str(entry.get("coverBranch") or infer_cover_branch(entry))
    family_label = str(family.get("label") or family.get("id") or "studio")
    art_direction = str(family.get("artDirection") or "").strip()
    family_directive = family_visual_directives(family)

    suffix = (
        f"Favor the {family_label} cover family for the {genre_label} genre."
        + (f" {art_direction}." if art_direction else "")
        + f" {family_directive}"
        + " Leave generous empty space for typography overlay."
    )
    if genre_key in {"business-marketing", "expertise-authority"}:
        suffix += " Prefer one centered symbol, bright commercial color blocking, and no people or portrait photography."
    elif genre_key == "ai-systems":
        suffix += " Avoid generic robots, laptops, dashboards, or device renders; stay in abstract systems-book territory."
    elif genre_key == "education":
        suffix += " Avoid stock classroom photos or random school objects; make it feel like a real educational trade book."
    elif genre_key == "personal-development":
        suffix += " Avoid generic wellness posters; it should read as a premium self-development book cover."
    if branch == "children":
        suffix += " Keep the emotional tone child-safe, warm, rounded, and inviting. It must read as a real children's book cover, not a toy ad or nursery poster."

    retry = ""
    if attempt_index > 1:
        retry = (
            " Retry with a distinctly different composition, richer color separation, and deeper atmosphere."
            " Use only abstract geometry, illustration, architecture, gradients, paper forms, light, and shadow."
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
        "coverStyleMode": cover_style_mode_for_entry(entry),
        "backCoverMode": back_cover_mode_for_entry(entry),
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
    try:
        if provider in VERTEX_IMAGEN_MODELS:
            return generate_with_vertex_imagen(prompt, output_path, provider)
        if provider == "vertex-gemini-flash-image":
            return generate_with_vertex_gemini(prompt, output_path)
        if is_vertex_only_policy():
            return False
        legacy_key = resolve_legacy_api_key() or api_key
        if not legacy_key:
            return False
        if provider in NANO_MODELS:
            return generate_with_nano(prompt, output_path, legacy_key, NANO_MODELS[provider])
        return False
    except Exception:
        # Network/provider failures should not crash generation; caller can
        # continue with other providers or procedural fallback art.
        return False


def art_candidate_rank(score_payload: dict[str, Any]) -> tuple[float, float]:
    quality = float(score_payload.get("score") or 0.0)
    return (0.0, -quality)



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
    allow_procedural_fallback = not is_vertex_only_policy()
    target_families = families or families_for_entry(entry)
    for family in target_families:
        variant_index = int(family["art_variant"])
        target = assets_dir / f"cover_art_v{variant_index}.png"
        provider_used = ""
        reused = False
        backup_target: Path | None = None

        if not force and target.exists():
            reused = True
        elif not force and variant_index == 1 and legacy_ai_cover.exists():
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
                        if art_has_excess_text(temp_image):
                            continue
                        # Accept first successful generation â€“ user can regenerate if not satisfied
                        shutil.copyfile(temp_image, target)
                        provider_used = provider
                        accepted = True
                        break
                if accepted:
                    break

            if not provider_used and allow_procedural_fallback:
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
    base_score = float(art.get("score") or 0.0)
    return round(base_score, 2)

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


def cover_variant_bundle_complete(book_dir: Path, metadata: dict[str, Any], *, minimum_variants: int = 1) -> bool:
    variants = metadata.get("cover_variants") or []
    if not isinstance(variants, list) or len(variants) < max(1, minimum_variants):
        return False
    selected_id = str(metadata.get("selected_cover_variant") or "").strip()
    recommended_id = str(metadata.get("recommended_cover_variant") or "").strip()
    valid_ids = {str(item.get("id") or "").strip() for item in variants if isinstance(item, dict)}
    if not selected_id or selected_id not in valid_ids:
        return False
    if not recommended_id or recommended_id not in valid_ids:
        return False
    assets_dir = book_dir / "assets"
    if not (assets_dir / "front_cover_final.png").exists():
        return False
    if not (assets_dir / "back_cover_final.png").exists():
        return False
    if str(metadata.get("cover_image") or "").strip() != "assets/front_cover_final.png":
        return False
    if str(metadata.get("back_cover_image") or "").strip() != "assets/back_cover_final.png":
        return False
    return True


def ensure_cover_variant_bundle_complete(book_dir: Path, metadata: dict[str, Any], *, minimum_variants: int = 1) -> dict[str, Any]:
    if not cover_variant_bundle_complete(book_dir, metadata, minimum_variants=minimum_variants):
        raise RuntimeError(
            "Cover generation completed without a persisted selected/recommended variant pair and promoted final cover assets."
        )
    return metadata


def promote_selected_variant(book_dir: Path, selected_variant: dict[str, Any]) -> None:
    assets_dir = book_dir / "assets"
    selected_front = asset_source(book_dir, str(selected_variant["front_image"]))
    selected_back = asset_source(book_dir, str(selected_variant["back_image"]))
    selected_front_svg = asset_source(book_dir, str(selected_variant.get("front_svg") or ""))
    selected_back_svg = asset_source(book_dir, str(selected_variant.get("back_svg") or ""))
    selected_art = asset_source(book_dir, str(selected_variant["art_image"]))

    copy_or_remove(selected_front, assets_dir / "front_cover_final.png")
    copy_or_remove(selected_back, assets_dir / "back_cover_final.png")
    copy_or_remove(selected_front_svg, assets_dir / "front_cover_final.svg")
    copy_or_remove(selected_back_svg, assets_dir / "back_cover_final.svg")
    copy_or_remove(selected_front, assets_dir / "showcase_front_cover.png")
    copy_or_remove(selected_front_svg, assets_dir / "showcase_front_cover.svg")
    copy_or_remove(selected_back, assets_dir / "showcase_back_cover.png")
    copy_or_remove(selected_back_svg, assets_dir / "showcase_back_cover.svg")
    copy_or_remove(selected_art, assets_dir / "ai_front_cover.png")


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
        key=lambda item: art_quality_score(item),
        reverse=True,
    )
    cover_variants: list[dict[str, Any]] = []
    rejection_map: dict[str, list[str]] = {}
    cover_style_mode = cover_style_mode_for_entry(entry)
    back_cover_mode = back_cover_mode_for_entry(entry)
    cover_mode = cover_mode_for_entry(entry)
    style_direction = style_direction_for_entry(entry)
    wrap_scope = wrap_scope_for_entry(entry)
    quality_gate = quality_gate_for_entry(entry)
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
        ai_result: dict[str, Any] | None = None

        if render_mode in {"ai-signature", "ai-minimal"}:
            ai_front_path = assets_dir / f"front_cover_{variant_id}.png"
            candidate_modes = [render_mode]
            if render_mode == "ai-signature":
                candidate_modes.append("ai-minimal")
            best_ai_mode = render_mode
            best_ai_score = -1.0
            for candidate_mode in candidate_modes:
                candidate_ai_result = generate_ai_finished_cover(
                    entry,
                    family,
                    ai_front_path,
                    ai_text_providers_for_entry(service, entry),
                    api_key,
                    candidate_mode,
                )
                candidate_validation = dict((candidate_ai_result or {}).get("validation") or {})
                if candidate_ai_result and not candidate_validation.get("hardRejectReasons"):
                    candidate_score = float(candidate_ai_result.get("candidateScore") or candidate_validation.get("textSimilarityScore") or 0.0)
                    if candidate_score > best_ai_score:
                        ai_result = candidate_ai_result
                        best_ai_mode = candidate_mode
                        best_ai_score = candidate_score
                    if quality_gate != "best_available" and candidate_validation.get("valid"):
                        break
            validation_payload = dict((ai_result or {}).get("validation") or {})
            if not ai_result or validation_payload.get("hardRejectReasons"):
                continue
            effective_render_mode = best_ai_mode
            front_image = f"assets/front_cover_{variant_id}.png"
            front_svg = ""
            provider = str(ai_result.get("provider") or provider)

        score_bonus = 10.0
        if effective_render_mode == "ai-signature":
            score_bonus = 18.0
        elif effective_render_mode == "ai-minimal":
            score_bonus = 15.0

        front_score_payload = score_variant(asset_source(book_dir, front_image))
        back_score_payload = score_variant(asset_source(book_dir, f"assets/back_cover_{variant_id}.png"))
        visual_review = review_cover_visuals(asset_source(book_dir, front_image), entry)
        pair_quality = evaluate_cover_pair_quality(entry, front_score_payload, back_score_payload, visual_review)
        if not pair_quality["valid"]:
            rejection_map[variant_id] = list(pair_quality["rejectionReasons"])
            continue

        text_validation_score = float(validation_payload.get("textSimilarityScore") or (1.0 if render_mode == "studio-exact" else 0.0))
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
                "score": round(
                    (art_quality_score(art) * 0.3)
                    + family_fit_bonus(entry, family_id)
                    + score_bonus
                    + (float(pair_quality["pairScore"]) * 0.3)
                    + (text_validation_score * 24.0),
                    2,
                ),
                "recommended": False,
                "provider": provider,
                "template": composition.get("template") or derive_cover_template_hint(entry),
                "preferred_zone": preferred_zone,
                "render_mode": effective_render_mode,
                "text_strategy": str(spec.get("text_strategy") or "studio-safe"),
                "text_validation": validation_payload or {},
                "cover_mode": cover_mode,
                "style_direction": style_direction,
                "wrap_scope": wrap_scope,
                "quality_gate": quality_gate,
                "cover_style_mode": cover_style_mode,
                "back_cover_mode": back_cover_mode,
                "pair_score": pair_quality["pairScore"],
                "visual_flags": pair_quality["visualFlags"],
                "rejection_reasons": list(pair_quality["rejectionReasons"]),
                "text_safe_zone_status": "pass" if pair_quality["visualFlags"].get("hasCleanTypographyBands", True) else "fail",
                "front_render_mode": effective_render_mode,
                "front_ai_attempt_count": int((ai_result or {}).get("attemptCount") or 0),
                "front_text_validation_score": text_validation_score,
                "front_visual_grade": int(pair_quality.get("visualGrade") or 0),
                "front_genre_fit_score": int(pair_quality.get("genreFitScore") or 0),
                "front_hard_reject_reasons": list(validation_payload.get("hardRejectReasons") or []),
                "selected_cover_confidence": round(
                    max(
                        0.0,
                        min(
                            1.0,
                            (float(validation_payload.get("textSimilarityScore") or 0.0) * 0.46)
                            + ((float(pair_quality["pairScore"]) / 100.0) * 0.54),
                        ),
                    ),
                    4,
                ),
            }
        )

    if not cover_variants:
        raise RuntimeError("No cover variants passed the reference-flat quality gate.")

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
            "cover_text_strategy": str(selected_variant.get("text_strategy") or ai_text_strategy_for_entry(entry)),
            "cover_mode": cover_mode,
            "style_direction": style_direction,
            "wrap_scope": wrap_scope,
            "quality_gate": quality_gate,
            "cover_style_mode": cover_style_mode,
            "back_cover_mode": back_cover_mode,
            "text_safe_zone_status": str(selected_variant.get("text_safe_zone_status") or "unknown"),
            "cover_pair_score": float(selected_variant.get("pair_score") or 0.0),
            "cover_rejection_reasons": rejection_map,
            "front_render_mode": str(selected_variant.get("front_render_mode") or selected_variant.get("render_mode") or ""),
            "front_ai_attempt_count": int(selected_variant.get("front_ai_attempt_count") or 0),
            "front_text_validation_score": float(selected_variant.get("front_text_validation_score") or 0.0),
            "front_visual_grade": int(selected_variant.get("front_visual_grade") or 0),
            "front_genre_fit_score": int(selected_variant.get("front_genre_fit_score") or 0),
            "front_hard_reject_reasons": list(selected_variant.get("front_hard_reject_reasons") or []),
            "selected_cover_confidence": float(selected_variant.get("selected_cover_confidence") or 0.0),
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
    return ensure_cover_variant_bundle_complete(book_dir, meta, minimum_variants=desired_variant_count)


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
        and cover_variant_bundle_complete(book_dir, meta, minimum_variants=VARIANT_COUNT)
        and int(meta.get("cover_variant_count") or 0) >= VARIANT_COUNT
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
