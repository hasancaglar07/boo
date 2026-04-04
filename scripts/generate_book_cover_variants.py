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
    normalized_cover_entry,
    resolve_api_key,
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
            "spineColor": "#0f172a",
            "coverGradient": "linear-gradient(145deg,#f1c27a 0%,#6e4228 54%,#17110f 100%)",
            "accentColor": "#f1c27a",
            "textAccent": "#fff8ef",
        },
        {
            "spineColor": "#10213a",
            "coverGradient": "linear-gradient(145deg,#d8b36b 0%,#4a2d1f 48%,#101722 100%)",
            "accentColor": "#d8b36b",
            "textAccent": "#fff9f2",
        },
    ],
    "education-book": [
        {
            "spineColor": "#143b4d",
            "coverGradient": "linear-gradient(145deg,#f0cf7f 0%,#3e7b9a 52%,#12212d 100%)",
            "accentColor": "#f0cf7f",
            "textAccent": "#fffdf8",
        },
        {
            "spineColor": "#28465c",
            "coverGradient": "linear-gradient(145deg,#ffd38f 0%,#5f94aa 55%,#172534 100%)",
            "accentColor": "#ffd38f",
            "textAccent": "#fffdf7",
        },
    ],
    "expertise-guide": [
        {
            "spineColor": "#1d2030",
            "coverGradient": "linear-gradient(145deg,#e4c487 0%,#53406d 52%,#17131f 100%)",
            "accentColor": "#e4c487",
            "textAccent": "#fff9f1",
        },
        {
            "spineColor": "#2a2038",
            "coverGradient": "linear-gradient(145deg,#ddb777 0%,#73537c 52%,#1c1724 100%)",
            "accentColor": "#ddb777",
            "textAccent": "#fff8f0",
        },
    ],
    "ai-workflow-guide": [
        {
            "spineColor": "#0f2536",
            "coverGradient": "linear-gradient(145deg,#87d3f3 0%,#22465e 48%,#10141b 100%)",
            "accentColor": "#87d3f3",
            "textAccent": "#f4fbff",
        },
        {
            "spineColor": "#122b3d",
            "coverGradient": "linear-gradient(145deg,#65c6f5 0%,#314f73 54%,#11151c 100%)",
            "accentColor": "#65c6f5",
            "textAccent": "#f4fbff",
        },
    ],
    "personal-development": [
        {
            "spineColor": "#352440",
            "coverGradient": "linear-gradient(145deg,#f3c89c 0%,#6d4d78 50%,#19151f 100%)",
            "accentColor": "#f3c89c",
            "textAccent": "#fff8f2",
        },
        {
            "spineColor": "#40304d",
            "coverGradient": "linear-gradient(145deg,#f0d0aa 0%,#78648a 55%,#1b1820 100%)",
            "accentColor": "#f0d0aa",
            "textAccent": "#fff9f4",
        },
    ],
    "children-illustrated": [
        {
            "spineColor": "#1d3d67",
            "coverGradient": "linear-gradient(145deg,#ffd56f 0%,#5b90d2 50%,#163050 100%)",
            "accentColor": "#ffd56f",
            "textAccent": "#fffef8",
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
        "Children Illustrated": "children-illustrated",
    }.get(category, "business-playbook")


def pick_palette(category: str, slug: str) -> dict[str, str]:
    options = PALETTES[palette_key(category)]
    digest = hashlib.sha256(slug.encode("utf-8")).digest()[0]
    return options[digest % len(options)]


def language_label(language_code: str) -> str:
    return LANGUAGE_LABELS.get(language_code, language_code or "English")


def load_entry(book_dir: Path) -> dict[str, Any]:
    meta = read_json(book_dir / "dashboard_meta.json")
    title, subtitle = read_outline_title(book_dir)
    language = str(meta.get("language") or "English").strip() or "English"
    summary = str(meta.get("description") or "").strip() or subtitle or title
    category = detect_category(meta, title, subtitle, summary)
    palette = pick_palette(category, book_dir.name)
    entry = {
        "slug": book_dir.name,
        "title": title,
        "subtitle": subtitle,
        "author": str(meta.get("author") or "").strip() or "Studio Author",
        "publisher": str(meta.get("publisher") or "").strip() or "Studio Press",
        "summary": summary,
        "authorBio": str(meta.get("author_bio") or "").strip(),
        "coverBrief": str(meta.get("cover_brief") or "").strip() or f"Premium {category.lower()} cover with strong bookstore presence.",
        "brandingMark": str(meta.get("branding_mark") or "").strip() or str(meta.get("publisher") or "SP")[:3].upper(),
        "languageCode": language,
        "languageLabel": language_label(language),
        "category": category,
        "toneArchetype": str(meta.get("tone_archetype") or "").strip() or default_tone(category),
        "topic": summary,
        "coverPrompt": str(meta.get("cover_prompt") or "").strip(),
        "coverGradient": palette["coverGradient"],
        "accentColor": palette["accentColor"],
        "textAccent": palette["textAccent"],
        "spineColor": palette["spineColor"],
        "year": str(meta.get("year") or "").strip(),
        "coverTemplateHint": str(meta.get("cover_template") or "").strip(),
        "titleTone": str(meta.get("title_tone") or "").strip(),
        "coverHierarchy": str(meta.get("cover_hierarchy") or "").strip(),
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
    if args.force or not existing_art_ready(book_dir):
        api_key = resolve_api_key()

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
