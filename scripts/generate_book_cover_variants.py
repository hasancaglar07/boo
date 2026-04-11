#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from generate_showcase_ai_covers import (  # noqa: E402
    COVER_LAB_VERSION,
    SERVICE_CHOICES,
    build_cover_variants,
    infer_cover_branch,
    infer_cover_genre,
    infer_cover_subtopic,
    is_vertex_only_policy,
    normalized_cover_entry,
    resolve_api_key,
    resolve_vertex_config,
)


LANGUAGE_LABELS = {
    "English": "English",
    "Turkish": "Türkçe",
    "Spanish": "Español",
    "German": "Deutsch",
    "French": "Français",
    "Portuguese": "Português",
    "Italian": "Italiano",
    "Dutch": "Nederlands",
    "Arabic": "العربية",
    "Japanese": "日本語",
}

PALETTES = {
    "business-playbook": [
        {
            "spineColor": "#d5652d",
            "coverGradient": "linear-gradient(160deg,#fff3e6 0%,#ffb067 52%,#f46d32 100%)",
            "accentColor": "#ef7d32",
            "textAccent": "#1b1b1b",
        },
        {
            "spineColor": "#d05b25",
            "coverGradient": "linear-gradient(160deg,#fff7ef 0%,#ffc47e 52%,#ff7f3f 100%)",
            "accentColor": "#d05b25",
            "textAccent": "#161616",
        },
    ],
    "education-book": [
        {
            "spineColor": "#2a86ab",
            "coverGradient": "linear-gradient(160deg,#fff9e9 0%,#8ad0ef 55%,#3aa6d0 100%)",
            "accentColor": "#ffbe55",
            "textAccent": "#14212b",
        },
        {
            "spineColor": "#347ca5",
            "coverGradient": "linear-gradient(160deg,#fffdf4 0%,#9dd8ef 52%,#5baed1 100%)",
            "accentColor": "#f5b64d",
            "textAccent": "#13202b",
        },
    ],
    "expertise-guide": [
        {
            "spineColor": "#244b72",
            "coverGradient": "linear-gradient(160deg,#faf4eb 0%,#d7ba72 48%,#5e8ec2 100%)",
            "accentColor": "#c99737",
            "textAccent": "#1a1a1a",
        },
        {
            "spineColor": "#31557a",
            "coverGradient": "linear-gradient(160deg,#fff8ee 0%,#e1c07a 48%,#729dcb 100%)",
            "accentColor": "#b8862c",
            "textAccent": "#181818",
        },
    ],
    "ai-workflow-guide": [
        {
            "spineColor": "#227a99",
            "coverGradient": "linear-gradient(160deg,#eefaff 0%,#86dbff 52%,#33a7d6 100%)",
            "accentColor": "#1f89b3",
            "textAccent": "#111827",
        },
        {
            "spineColor": "#1e7190",
            "coverGradient": "linear-gradient(160deg,#f3fcff 0%,#a1e6ff 50%,#4fbce6 100%)",
            "accentColor": "#15779d",
            "textAccent": "#121a23",
        },
    ],
    "personal-development": [
        {
            "spineColor": "#8d6a7f",
            "coverGradient": "linear-gradient(160deg,#fbf4ee 0%,#efc6a3 48%,#caa7be 100%)",
            "accentColor": "#c07c52",
            "textAccent": "#1d1a1e",
        },
        {
            "spineColor": "#947485",
            "coverGradient": "linear-gradient(160deg,#fff7f1 0%,#f2d4b1 48%,#cfb4c7 100%)",
            "accentColor": "#bb8359",
            "textAccent": "#1c1a1e",
        },
    ],
    "narrative-fiction": [
        {
            "spineColor": "#3d4568",
            "coverGradient": "linear-gradient(160deg,#f9efe5 0%,#d8ab78 34%,#5f5d88 100%)",
            "accentColor": "#d07a47",
            "textAccent": "#17161b",
        },
        {
            "spineColor": "#4f496b",
            "coverGradient": "linear-gradient(160deg,#fff6ec 0%,#e5bf96 34%,#746792 100%)",
            "accentColor": "#c86f43",
            "textAccent": "#16151a",
        },
    ],
    "children-illustrated": [
        {
            "spineColor": "#438dc4",
            "coverGradient": "linear-gradient(160deg,#fff7bf 0%,#ffb96a 48%,#62b6e8 100%)",
            "accentColor": "#ffb23f",
            "textAccent": "#1f2430",
        }
    ],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate adaptive cover variants for a book output.")
    parser.add_argument("book_dir", help="Absolute or repo-relative path to the book output directory.")
    parser.add_argument(
        "--service",
        default="auto",
        choices=SERVICE_CHOICES,
        help="Cover generation service order.",
    )
    parser.add_argument("--force", action="store_true", help="Regenerate AI art and composed variants.")
    parser.add_argument(
        "--variant-count",
        type=int,
        default=3,
        choices=(1, 2, 3),
        help="How many front/back cover concepts to generate.",
    )
    parser.add_argument("--selected", default="", help="Force a selected family id after generation.")
    return parser.parse_args()


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def read_outline_title(book_dir: Path) -> tuple[str, str]:
    outlines = sorted(book_dir.glob("book_outline_final_*.md"))
    if not outlines:
        return book_dir.name.replace("-", " ").title(), ""
    title = ""
    subtitle = ""
    for line in outlines[-1].read_text(encoding="utf-8", errors="replace").splitlines():
        if not title and line.startswith("# "):
            title = line[2:].strip()
        elif not subtitle and line.startswith("## "):
            subtitle = line[3:].strip()
        if title and subtitle:
            break
    return title or book_dir.name.replace("-", " ").title(), subtitle


def detect_category(meta: dict[str, Any], title: str, subtitle: str, summary: str) -> str:
    source = " ".join([str(meta.get("book_type") or meta.get("bookType") or ""), str(meta.get("cover_brief") or ""), title, subtitle, summary]).lower()
    if "cocuk" in source or "children" in source:
        return "Children Illustrated"
    if any(keyword in source for keyword in ("storybook", "picture book", "illustrated tale", "fairy tale", "masal", "resimli hikaye")):
        return "Children Illustrated"
    if any(keyword in source for keyword in ("fiction", "novel", "roman", "hikaye", "istasyon", "tren", "station", "railway drama", "literary fiction")):
        return "Narrative Fiction"
    if any(keyword in source for keyword in ("stem", "teach", "education", "lesson", "course", "öğret", "eğitim")):
        return "Education Book"
    if any(keyword in source for keyword in ("ai", "prompt", "workflow", "system", "automation", "yapay zeka")):
        return "AI Workflow Guide"
    if any(keyword in source for keyword in ("focus", "calm", "discipline", "mindset", "kişisel", "habit")):
        return "Personal Development"
    if any(keyword in source for keyword in ("expert", "method", "authority", "consult", "uzman")):
        return "Expertise Guide"
    return "Business Playbook"


def default_tone(category: str) -> str:
    mapping = {
        "Business Playbook": "Operator Playbook",
        "Education Book": "Workbook",
        "Expertise Guide": "Mentor Guide",
        "AI Workflow Guide": "Systems Manual",
        "Personal Development": "Calm Executive Brief",
        "Narrative Fiction": "Narrative Story",
        "Children Illustrated": "Story-led Manifesto",
    }
    return mapping.get(category, "Operator Playbook")


def palette_key(category: str) -> str:
    return {
        "Business Playbook": "business-playbook",
        "Education Book": "education-book",
        "Expertise Guide": "expertise-guide",
        "AI Workflow Guide": "ai-workflow-guide",
        "Personal Development": "personal-development",
        "Narrative Fiction": "narrative-fiction",
        "Children Illustrated": "children-illustrated",
    }.get(category, "business-playbook")


def pick_palette(category: str, slug: str) -> dict[str, str]:
    options = PALETTES[palette_key(category)]
    digest = hashlib.sha256(slug.encode("utf-8")).digest()[0]
    return options[digest % len(options)]


def language_label(language_code: str) -> str:
    return LANGUAGE_LABELS.get(language_code, language_code or "English")


def sanitize_placeholder_name(value: str) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    lowered = text.casefold()
    if lowered in {
        "book creator",
        "book generator",
        "studio author",
        "studio press",
    }:
        return ""
    return text


def load_entry(book_dir: Path) -> dict[str, Any]:
    meta = read_json(book_dir / "dashboard_meta.json")
    title, subtitle = read_outline_title(book_dir)
    language = str(meta.get("language") or "English").strip() or "English"
    summary = str(meta.get("description") or "").strip() or subtitle or title
    category = detect_category(meta, title, subtitle, summary)
    palette = pick_palette(category, book_dir.name)
    cover_prompt = str(meta.get("cover_prompt") or "").strip()
    cover_brief = str(meta.get("cover_brief") or "").strip() or f"Premium {category.lower()} cover with strong bookstore presence."
    if cover_prompt:
        normalized_prompt = cover_prompt.lower()
        normalized_brief = cover_brief.lower()
        if normalized_prompt not in normalized_brief:
            cover_brief = f"{cover_prompt}. {cover_brief}".strip()
    author = sanitize_placeholder_name(str(meta.get("author") or ""))
    publisher = sanitize_placeholder_name(str(meta.get("publisher") or ""))
    branding_mark = str(meta.get("branding_mark") or "").strip()
    if not branding_mark and publisher:
        branding_mark = publisher[:3].upper()
    entry = {
        "slug": book_dir.name,
        "title": title,
        "subtitle": subtitle,
        "author": author,
        "publisher": publisher,
        "summary": summary,
        "authorBio": str(meta.get("author_bio") or "").strip(),
        "coverBrief": cover_brief,
        "brandingMark": branding_mark,
        "languageCode": language,
        "languageLabel": language_label(language),
        "category": category,
        "toneArchetype": str(meta.get("tone_archetype") or "").strip() or default_tone(category),
        "topic": summary,
        "coverPrompt": cover_prompt,
        "coverGradient": palette["coverGradient"],
        "accentColor": palette["accentColor"],
        "textAccent": palette["textAccent"],
        "spineColor": palette["spineColor"],
        "year": str(meta.get("year") or "").strip(),
        "coverTemplateHint": str(meta.get("cover_template") or "").strip(),
        "titleTone": str(meta.get("title_tone") or "").strip(),
        "coverHierarchy": str(meta.get("cover_hierarchy") or "").strip(),
        "coverStyleMode": str(meta.get("cover_style_mode") or "").strip() or "bookstore_bold",
        "backCoverMode": str(meta.get("back_cover_mode") or "").strip() or "minimal_blurb",
        "coverMode": str(meta.get("cover_mode") or "").strip() or "full_ai_front",
        "styleDirection": str(meta.get("style_direction") or "").strip() or "genre_split",
        "wrapScope": str(meta.get("wrap_scope") or "").strip() or "ai_front_only",
        "qualityGate": str(meta.get("quality_gate") or "").strip() or "best_available",
        "book_type": str(meta.get("book_type") or meta.get("bookType") or "").strip(),
        "coverBranch": str(meta.get("cover_branch") or "").strip(),
        "coverGenre": str(meta.get("cover_genre") or "").strip(),
        "coverSubtopic": str(meta.get("cover_subtopic") or "").strip(),
    }
    entry = normalized_cover_entry(entry)
    entry["coverBranch"] = str(meta.get("cover_branch") or entry["coverBranch"]).strip() or infer_cover_branch(entry)
    entry["coverGenre"] = str(meta.get("cover_genre") or entry["coverGenre"]).strip() or infer_cover_genre(entry)
    entry["coverSubtopic"] = str(meta.get("cover_subtopic") or entry["coverSubtopic"]).strip() or infer_cover_subtopic(entry)
    return entry


def existing_art_ready(book_dir: Path) -> bool:
    assets_dir = book_dir / "assets"
    return any((assets_dir / f"cover_art_v{index}.png").exists() for index in (1, 2, 3)) or (assets_dir / "ai_front_cover.png").exists()


def main() -> None:
    args = parse_args()
    book_dir = Path(args.book_dir)
    if not book_dir.is_absolute():
        book_dir = (ROOT / book_dir).resolve()
    if not book_dir.exists():
        raise SystemExit(f"Book directory not found: {book_dir}")

    api_key = ""
    if is_vertex_only_policy():
        api_key = resolve_api_key()
        if not resolve_vertex_config():
            raise SystemExit(
                "Vertex-only image policy requires GOOGLE_API_KEY (or VERTEX_API_KEY / GOOGLE_GENAI_API_KEY) "
                "and GOOGLE_CLOUD_PROJECT (or GOOGLE_PROJECT_ID / VERTEX_PROJECT_ID)."
            )
    elif args.force or not existing_art_ready(book_dir):
        try:
            api_key = resolve_api_key()
        except SystemExit as exc:
            # Keep going without remote API providers. Downstream flow can still
            # render procedural studio art and compose usable covers.
            api_key = ""
            print(
                f"[cover-lab] {exc}. Falling back to procedural studio art.",
                file=sys.stderr,
            )

    entry = load_entry(book_dir)
    meta = build_cover_variants(
        entry,
        book_dir,
        args.service,
        api_key,
        args.force,
        variant_count=args.variant_count,
        selected_override=str(args.selected or "").strip() or None,
    )

    output = {
        "slug": entry["slug"],
        "selected_cover_variant": meta.get("selected_cover_variant"),
        "recommended_cover_variant": meta.get("recommended_cover_variant"),
        "cover_variant_count": meta.get("cover_variant_count"),
        "cover_variant_target_count": meta.get("cover_variant_target_count"),
        "cover_lab_version": meta.get("cover_lab_version") or COVER_LAB_VERSION,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
