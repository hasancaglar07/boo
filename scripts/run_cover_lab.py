#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from generate_book_cover_variants import load_entry  # noqa: E402
from generate_showcase_ai_covers import compose_cover_bundle, families_for_entry, load_manifest, normalized_cover_entry  # noqa: E402


REPRESENTATIVE_SLUGS = [
    "authority-in-100-pages",
    "parent-friendly-stem-at-home",
    "uzmanligini-kitaba-donustur",
    "prompt-systems-for-small-teams",
    "focus-by-design",
]

SHOWCASE_BY_SLUG = {entry["slug"]: entry for entry in load_manifest()}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate 4-up cover lab batches without touching production assets.")
    parser.add_argument("--slug", action="append", default=[], help="Book slug(s) to generate lab batches for.")
    parser.add_argument("--round", type=int, default=1, choices=[1, 2, 3, 4], help="Lab round to generate.")
    parser.add_argument("--representatives", action="store_true", help="Use the default representative slug set.")
    return parser.parse_args()


def book_dir_for(slug: str) -> Path:
    return ROOT / "book_outputs" / slug


def preferred_art(book_dir: Path, art_variant: int) -> Path:
    assets_dir = book_dir / "assets"
    candidate = assets_dir / f"cover_art_v{art_variant}.png"
    if candidate.exists():
        return candidate
    for fallback in ("ai_front_cover.png", "front_cover_final.png", "showcase_front_cover.png"):
        fallback_path = assets_dir / fallback
        if fallback_path.exists():
            return fallback_path
    raise FileNotFoundError(f"No reusable art found for {book_dir.name}")


def round_configs(entry: dict[str, Any], round_number: int) -> list[dict[str, Any]]:
    families = list(families_for_entry(entry))
    primary = families[0]
    secondary = families[1] if len(families) > 1 else families[0]
    tertiary = families[2] if len(families) > 2 else families[-1]
    if round_number == 1:
        return [
            {"name": f"{primary['id']}-left", "family": primary["id"], "art_variant": primary["art_variant"], "preferredZone": "top-left"},
            {"name": f"{primary['id']}-right", "family": primary["id"], "art_variant": primary["art_variant"], "preferredZone": "top-right"},
            {"name": f"{secondary['id']}-left", "family": secondary["id"], "art_variant": secondary["art_variant"], "preferredZone": "top-left"},
            {"name": f"{secondary['id']}-right", "family": secondary["id"], "art_variant": secondary["art_variant"], "preferredZone": "top-right"},
        ]
    if round_number == 2:
        return [
            {"name": f"{primary['id']}-frame-a", "family": primary["id"], "art_variant": primary["art_variant"], "overrides": {"frameStyle": primary.get("frameStyle", "double-line")}},
            {"name": f"{primary['id']}-frame-b", "family": primary["id"], "art_variant": primary["art_variant"], "overrides": {"frameStyle": "double-line"}},
            {"name": f"{secondary['id']}-tone-a", "family": secondary["id"], "art_variant": secondary["art_variant"], "overrides": {"titleTone": secondary.get("titleTone", "classic"), "frameStyle": secondary.get("frameStyle", "double-line")}},
            {"name": f"{secondary['id']}-tone-b", "family": secondary["id"], "art_variant": secondary["art_variant"], "overrides": {"titleTone": "sharp", "frameStyle": "corner-bracket"}},
        ]
    if round_number == 3:
        return [
            {"name": f"{primary['id']}-motif-a", "family": primary["id"], "art_variant": primary["art_variant"], "overrides": {"coverMotif": entry.get("coverSubtopic") == "learning" and "tactile-learning" or primary.get("baseMotif", "folio")}},
            {"name": f"{secondary['id']}-motif-b", "family": secondary["id"], "art_variant": secondary["art_variant"], "overrides": {"coverMotif": secondary.get("baseMotif", "grid")}},
            {"name": f"{tertiary['id']}-motif-c", "family": tertiary["id"], "art_variant": tertiary["art_variant"], "overrides": {"coverMotif": tertiary.get("baseMotif", "horizon")}},
            {"name": f"{tertiary['id']}-motif-d", "family": tertiary["id"], "art_variant": tertiary["art_variant"], "overrides": {"coverMotif": entry.get("coverBranch") == "children" and "storybook-scene" or "orbit"}},
        ]
    return [
        {"name": f"back-{primary['id']}", "family": primary["id"], "art_variant": primary["art_variant"], "overrides": {"frameStyle": primary.get("frameStyle", "double-line")}},
        {"name": f"back-{secondary['id']}", "family": secondary["id"], "art_variant": secondary["art_variant"], "overrides": {"frameStyle": secondary.get("frameStyle", "double-line")}},
        {"name": f"back-{tertiary['id']}", "family": tertiary["id"], "art_variant": tertiary["art_variant"], "overrides": {"frameStyle": tertiary.get("frameStyle", "corner-bracket")}},
        {"name": "back-alt", "family": secondary["id"], "art_variant": secondary["art_variant"], "overrides": {"frameStyle": "double-line", "coverTemplateHint": "executive-minimal"}},
    ]


def generate_round(slug: str, round_number: int) -> dict[str, Any]:
    book_dir = book_dir_for(slug)
    if not book_dir.exists():
        raise FileNotFoundError(f"Missing book directory for {slug}")
    entry = normalized_cover_entry(dict(SHOWCASE_BY_SLUG.get(slug) or load_entry(book_dir)))
    output_dir = ROOT / "tmp" / "cover-lab" / slug / f"round-{round_number:02d}"
    output_dir.mkdir(parents=True, exist_ok=True)

    outputs: list[dict[str, Any]] = []
    for config in round_configs(entry, round_number):
        art_path = preferred_art(book_dir, int(config["art_variant"]))
        name = str(config["name"])
        composition = compose_cover_bundle(
            entry,
            book_dir,
            art_path,
            str(config.get("preferredZone") or ""),
            family_id=str(config["family"]),
            front_svg_name=str(output_dir / f"{name}.svg"),
            front_png_name=str(output_dir / f"{name}.png"),
            back_svg_name=str(output_dir / f"{name}-back.svg"),
            back_png_name=str(output_dir / f"{name}-back.png"),
            config_overrides=config.get("overrides"),
        )
        outputs.append(
            {
                "name": name,
                "family": config["family"],
                "art_path": str(art_path),
                "front_png": str(output_dir / f"{name}.png"),
                "back_png": str(output_dir / f"{name}-back.png"),
                "template": composition.get("template"),
            }
        )

    summary = {"slug": slug, "round": round_number, "outputs": outputs}
    (output_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return summary


def main() -> None:
    args = parse_args()
    slugs = list(args.slug)
    if args.representatives:
        slugs.extend(slug for slug in REPRESENTATIVE_SLUGS if slug not in slugs)
    if not slugs:
        raise SystemExit("No slugs selected. Use --slug or --representatives.")

    results = [generate_round(slug, args.round) for slug in slugs]
    print(json.dumps({"round": args.round, "results": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
