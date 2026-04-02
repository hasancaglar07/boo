#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
import tempfile
from pathlib import Path
from typing import Any

from generate_showcase_ai_covers import (
    BOOK_OUTPUTS_DIR,
    TEXT_RISK_REJECT_THRESHOLD,
    compose_cover_bundle,
    families_for_entry,
    family_fit_bonus,
    generate_variant,
    infer_cover_branch,
    infer_cover_genre,
    infer_cover_subtopic,
    load_manifest,
    normalize_service,
    normalized_cover_entry,
    render_procedural_art,
    resolve_api_key,
    score_variant,
)


DEFAULT_HERO_SLUGS = (
    "authority-in-100-pages",
    "prompt-systems-for-small-teams",
    "uzmanligini-kitaba-donustur",
    "focus-by-design",
    "tu-metodo-hecho-libro",
    "ia-pratica-para-negocios-pequenos",
    "parent-friendly-stem-at-home",
    "clarte-calme-execution",
)

VISUAL_BRIEFS: dict[str, str] = {
    "authority-in-100-pages": "a powerful editorial desk still life with blank cream manuscript folios, a fountain pen, brass publishing tools, dark wood, and cinematic lamp light",
    "prompt-systems-for-small-teams": "a sleek modern workspace still life with blank workflow cards, subtle process lines, a closed laptop, a notebook, and calm collaborative technology cues",
    "uzmanligini-kitaba-donustur": "a premium writer's desk with blank manuscript folios, layered paper forms, a notebook, and warm focused author lighting",
    "focus-by-design": "a calm sunrise workspace with a blank journal, pencil, ceramic mug, architectural shadows, and quiet focus energy",
    "tu-metodo-hecho-libro": "a refined method-building desk scene with an elegant ledger notebook, blank structured cards, an unlabeled seal detail, and premium author tools",
    "ia-pratica-para-negocios-pequenos": "a polished small-business desk with unlabeled receipts, a tablet, blank workflow notes, a coffee cup, and subtle AI assistance cues",
    "parent-friendly-stem-at-home": "a warm family learning scene with a paper rocket, simple science tools, colorful tactile STEM objects, blank sketch pages, and inviting home light",
    "clarte-calme-execution": "a serene French editorial still life with a blank notebook, clean paper stack, water glass, soft dawn light, and restrained emotional clarity",
}

STYLE_VARIANTS: tuple[dict[str, str], ...] = (
    {
        "id": "still-life",
        "directive": "Use premium editorial still-life realism, close camera framing, tactile materials, refined depth, and believable studio light.",
    },
    {
        "id": "paper-scene",
        "directive": "Use dimensional mixed-media paper-craft artwork with handcrafted objects, layered forms, premium print texture, and a memorable bookstore-ready scene.",
    },
    {
        "id": "cinematic",
        "directive": "Use a cinematic single-scene composition with one strong visual metaphor, atmospheric depth, refined premium texture, and clearly readable physical objects.",
    },
)

HERO_MAX_ATTEMPTS_PER_STYLE = 5
HERO_TEXT_RISK_ACCEPT_THRESHOLD = 12.0
HERO_TEXT_RISK_MAX_KEEP_THRESHOLD = 18.0

GENRE_FAMILY_PREFERENCE: dict[str, tuple[str, ...]] = {
    "business-marketing": ("executive-premium", "commercial-bold", "clean-signal"),
    "expertise-authority": ("modern-mentor", "authority-serif", "method-ledger"),
    "ai-systems": ("interface-depth", "signal-grid", "calm-tech"),
    "education": ("curious-learning", "instructor-premium", "workbook-clear"),
    "personal-development": ("elevated-reset", "calm-focus", "soft-discipline"),
    "children-illustrated": ("storyworld", "learning-adventure", "bedtime-calm"),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate image-led homepage hero covers for selected showcase books.")
    parser.add_argument(
        "--service",
        default="auto",
        choices=["auto", "grok-imagine", "nano-banana-pro", "nano-banana-2"],
        help="Image generation service order.",
    )
    parser.add_argument("--slug", action="append", default=[], help="Generate only specific hero slug(s).")
    parser.add_argument("--force", action="store_true", help="Regenerate hero art and hero covers.")
    return parser.parse_args()


def load_entries(selected_slugs: list[str]) -> list[dict[str, Any]]:
    manifest = [normalized_cover_entry(item) for item in load_manifest()]
    if not selected_slugs:
        wanted = set(DEFAULT_HERO_SLUGS)
    else:
        wanted = set(selected_slugs)
    return [item for item in manifest if str(item.get("slug") or "") in wanted]


def preferred_family(entry: dict[str, Any]) -> dict[str, Any]:
    genre = infer_cover_genre(entry, infer_cover_branch(entry))
    ordered = GENRE_FAMILY_PREFERENCE.get(genre, ())
    families = list(families_for_entry(entry))
    families.sort(
        key=lambda family: (
            0 if str(family["id"]) in ordered else 1,
            -(family_fit_bonus(entry, str(family["id"]))),
        ),
    )
    return families[0]


def hero_template_hint(entry: dict[str, Any]) -> str:
    if infer_cover_branch(entry) == "children":
        subtopic = infer_cover_subtopic(entry)
        if subtopic == "bedtime":
            return "children-bedtime"
        if subtopic == "learning":
            return "children-learning"
        return "children-storyworld"
    return "hero-visual-led"


def hero_visual_brief(entry: dict[str, Any]) -> str:
    slug = str(entry.get("slug") or "")
    if slug in VISUAL_BRIEFS:
        return VISUAL_BRIEFS[slug]

    genre = infer_cover_genre(entry, infer_cover_branch(entry))
    subtopic = infer_cover_subtopic(entry, genre, infer_cover_branch(entry))
    if genre == "business-marketing":
        return "a polished editorial business scene with publishing objects, structured paper tools, and one strong commercial visual metaphor"
    if genre == "expertise-authority":
        return "a premium expert-author scene with notebook, manuscript forms, refined seal details, and a bookstore-quality authority mood"
    if genre == "ai-systems":
        return "a modern workflow scene with organized cards, luminous process cues, subtle interface depth, and real desk objects"
    if genre == "education":
        return "a warm educational scene with tactile learning objects, clean instructional shapes, and premium inviting clarity"
    if genre == "personal-development":
        if subtopic == "reset":
            return "a reflective lifestyle scene with soft light, calm interior objects, and gentle premium renewal energy"
        return "a calm focus scene with journal, orderly desk elements, and soft atmospheric light"
    return "a premium editorial scene with one memorable visual metaphor and real bookstore-cover presence"


def build_hero_prompt(entry: dict[str, Any], style_variant: dict[str, str], attempt_index: int = 1) -> str:
    branch = infer_cover_branch(entry)
    genre = infer_cover_genre(entry, branch)
    subtopic = infer_cover_subtopic(entry, genre, branch)
    category = str(entry.get("category") or genre.replace("-", " ")).lower()
    topic = hero_visual_brief(entry)
    tone = str(entry.get("toneArchetype") or "").strip()
    retry_guard = ""
    if attempt_index > 1:
        retry_guard = (
            " Previous attempt likely contained fake title text or letter-like marks. "
            "Do not render any printed cover text, poster typography, signage, embossed letters, book spine words, UI labels, or ghost glyphs. "
            "If a shape resembles even one letter, remove it."
        )
    realism_guard = (
        "Show a tangible portrait scene with 3 to 5 recognizable physical objects or illustrated elements, believable material texture, real lighting, and depth. "
        "Do not simplify the scene into app UI cards, empty icon blocks, placeholder panels, flat geometric posters, abstract dashboard shapes, or generic minimalist rectangles."
    )

    if branch == "children":
        return (
            f"Create premium portrait storybook scene artwork for use behind a children's book cover for a {category} book. "
            f"Subject: {topic}. {style_variant['directive']} Tone: {tone}. "
            f"{realism_guard} "
            "Make it feel like a real bookstore children's cover with a memorable illustrated scene, rounded emotional safety, friendly characters or objects, and room for a title band near the bottom. "
            "Do not make it abstract corporate design. Do not use hard monoliths, luxury brass rails, executive geometry, or dark adult nonfiction slabs. "
            "Absolutely no letters, words, numbers, logos, symbols, poster text, classroom text, signage, watermarks, faux typography, glyphs, typographic shadows, or ghost title shapes anywhere. "
            "No readable book spines. No alphabet fragments. No OCR-detectable marks. Text-free artwork only."
            f"{retry_guard}"
        )

    genre_notes = {
        "business-marketing": "Make it feel commercially sharp and premium, with a single clear metaphor instead of generic abstraction.",
        "expertise-authority": "Make it feel premium, literary, and trustworthy, like a polished authority book from a real bookstore.",
        "ai-systems": "Make it feel modern and intelligent, but tangible and scene-led rather than cold abstract rectangles.",
        "education": "Make it feel warm, smart, and instructive, with tactile learning cues instead of generic dark geometry.",
        "personal-development": "Make it feel calm and emotionally resonant, with atmosphere, light, and grounded lifestyle cues.",
    }.get(genre, "Make it feel like a real premium nonfiction bookstore cover.")

    return (
        f"Create premium portrait editorial still-life or scene artwork for use behind a {category} nonfiction book cover. "
        f"Subject: {topic}. {style_variant['directive']} Tone: {tone}. "
        f"{realism_guard} "
        f"{genre_notes} Leave clean room for a compact title band near the bottom without flattening the whole image into empty abstract space. "
        "Use a concrete scene, still life, or visual metaphor with real objects, not a poster layout. Avoid generic dark blocks, sterile slabs, diagram boards, and cheap AI abstraction. "
        "This is not a finished printed cover and must not contain any title, subtitle, author line, label, UI text, or faux publishing text inside the artwork. "
        "Absolutely no letters, words, numbers, logos, symbols, watermarks, signage, ghost typography, faux title shapes, typographic echoes, engraved text, or glyph-like forms anywhere in the image. "
        "No readable screens. No readable books within the scene. No poster text. No OCR-detectable marks. Text-free artwork only."
        f"{retry_guard}"
    )


def candidate_score(payload: dict[str, Any]) -> tuple[float, float]:
    text_risk = float(payload.get("textRisk") or 0.0)
    quality = float(payload.get("score") or 0.0)
    return (text_risk, -quality)


def pick_short_subtitle(entry: dict[str, Any]) -> str:
    subtitle = str(entry.get("subtitle") or "").strip()
    if len(subtitle) <= 96:
        return subtitle
    shortened = subtitle[:93].rsplit(" ", 1)[0].strip()
    return f"{shortened}..." if shortened else subtitle[:96]


def generate_best_art(entry: dict[str, Any], output_path: Path, service: str, api_key: str) -> dict[str, Any]:
    providers = normalize_service(service)
    best_score: tuple[float, float] | None = None
    best_payload: dict[str, Any] | None = None
    best_provider = ""

    with tempfile.TemporaryDirectory(prefix=f"hero-cover-{entry['slug']}-") as temp_dir:
        temp_dir_path = Path(temp_dir)
        for style_variant in STYLE_VARIANTS:
            for attempt_index in range(1, HERO_MAX_ATTEMPTS_PER_STYLE + 1):
                prompt = build_hero_prompt(entry, style_variant, attempt_index)
                for provider in providers:
                    candidate_path = temp_dir_path / f"{style_variant['id']}-{attempt_index}-{provider}.png"
                    if not generate_variant(prompt, candidate_path, api_key, provider):
                        continue
                    score_payload = score_variant(candidate_path)
                    score = candidate_score(score_payload)
                    if best_score is None or score < best_score:
                        shutil.copyfile(candidate_path, output_path)
                        best_score = score
                        best_payload = {
                            "provider": provider,
                            "style": style_variant["id"],
                            "details": score_payload,
                        }
                        best_provider = provider
                    if float(score_payload.get("textRisk") or 0.0) <= HERO_TEXT_RISK_ACCEPT_THRESHOLD:
                        shutil.copyfile(candidate_path, output_path)
                        return {
                            "provider": provider,
                            "style": style_variant["id"],
                            "details": score_payload,
                        }

    if best_payload and float((best_payload.get("details") or {}).get("textRisk") or 0.0) <= HERO_TEXT_RISK_MAX_KEEP_THRESHOLD:
        best_payload["provider"] = best_provider or str(best_payload.get("provider") or "")
        return best_payload
    family = preferred_family(entry)
    render_procedural_art({**entry, "renderMode": "hero"}, output_path, str(family["id"]))
    score_payload = score_variant(output_path)
    return {
        "provider": "procedural-hero",
        "style": "scene-fallback",
        "details": score_payload,
    }


def generate_hero_cover(entry: dict[str, Any], service: str, api_key: str, force: bool) -> None:
    slug = str(entry["slug"])
    book_dir = BOOK_OUTPUTS_DIR / slug
    if not book_dir.exists():
        raise FileNotFoundError(f"Missing book output directory for {slug}")

    assets_dir = book_dir / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    art_path = assets_dir / "homepage_hero_art.png"
    front_png = assets_dir / "homepage_hero_cover.png"
    front_svg = assets_dir / "homepage_hero_cover.svg"
    back_png = assets_dir / "homepage_hero_back.png"
    back_svg = assets_dir / "homepage_hero_back.svg"

    if force or not art_path.exists():
        result = generate_best_art(entry, art_path, service, api_key)
        print(
            f"  art: {slug} provider={result.get('provider')} style={result.get('style')} textRisk={float((result.get('details') or {}).get('textRisk') or 0.0):.2f}"
        )
    else:
        print(f"  art: {slug} reusing existing homepage hero art")

    family = preferred_family(entry)
    overrides = {
        "coverTemplateHint": hero_template_hint(entry),
        "subtitle": pick_short_subtitle(entry),
        "coverVariantFamily": family["id"],
        "coverVariantLabel": family["label"],
    }
    compose_cover_bundle(
        entry,
        book_dir,
        art_path,
        "lower-left",
        family_id=str(family["id"]),
        front_svg_name=str(front_svg),
        front_png_name=str(front_png),
        back_svg_name=str(back_svg),
        back_png_name=str(back_png),
        config_overrides=overrides,
    )


def main() -> None:
    args = parse_args()
    api_key = resolve_api_key()
    entries = load_entries(args.slug)
    if not entries:
        raise SystemExit("No hero entries selected.")

    for index, entry in enumerate(entries, start=1):
        print(f"[{index}/{len(entries)}] generating homepage hero cover for {entry['slug']}")
        generate_hero_cover(entry, args.service, api_key, args.force)

    print(f"homepage hero covers ready: {len(entries)} books")


if __name__ == "__main__":
    main()
