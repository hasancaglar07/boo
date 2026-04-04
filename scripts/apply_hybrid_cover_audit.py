#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REPORT_PATH = ROOT / "tmp" / "hybrid-cover-audit" / "report.json"
BOOK_OUTPUTS_DIR = ROOT / "book_outputs"
sys.path.insert(0, str(Path(__file__).resolve().parent))

from generate_book_cover_variants import load_entry  # noqa: E402
from generate_showcase_ai_covers import (  # noqa: E402
    promote_selected_variant,
    read_dashboard_meta,
    variant_specs_for_entry,
    write_dashboard_meta,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Apply curated hybrid cover audit results to production metadata/assets.")
    parser.add_argument("--report", default=str(DEFAULT_REPORT_PATH), help="Path to hybrid audit report.json")
    parser.add_argument("--slug", action="append", default=[], help="Apply only to specific slug(s).")
    return parser.parse_args()


def existing_variants_by_family(meta: dict[str, Any]) -> dict[str, dict[str, Any]]:
    mapping: dict[str, dict[str, Any]] = {}
    for item in meta.get("cover_variants") or []:
        if not isinstance(item, dict):
            continue
        family = str(item.get("family") or "").strip()
        if family:
            mapping[family] = item
    return mapping


def first_existing(*paths: str) -> str:
    for path in paths:
        if path:
            return path
    return ""


def report_variant_payload(
    report_item: dict[str, Any],
    key: str,
) -> dict[str, Any]:
    payload = report_item.get(key)
    return payload if isinstance(payload, dict) else {}


def copy_audit_image(source: str, destination: Path) -> str:
    if not source:
        return ""
    source_path = Path(source)
    if not source_path.exists():
        return ""
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source_path, destination)
    return f"assets/{destination.name}"


def build_variant(
    slug: str,
    report_payload: dict[str, Any],
    spec: dict[str, Any],
    existing_variant: dict[str, Any] | None,
    recommendation: str,
) -> dict[str, Any]:
    family = spec["family"]
    family_id = str(family["id"])
    variant_id = str(spec["id"])
    render_mode = str(spec["render_mode"])
    assets_dir = BOOK_OUTPUTS_DIR / slug / "assets"

    existing_variant = existing_variant or {}
    front_image = str(existing_variant.get("front_image") or f"assets/front_cover_{family_id}.png")
    front_svg = str(existing_variant.get("front_svg") or f"assets/front_cover_{family_id}.svg")
    back_image = str(existing_variant.get("back_image") or f"assets/back_cover_{family_id}.png")
    back_svg = str(existing_variant.get("back_svg") or f"assets/back_cover_{family_id}.svg")
    provider = str(report_payload.get("provider") or existing_variant.get("provider") or "")
    text_validation = dict(report_payload)
    valid = bool(report_payload.get("valid"))

    if render_mode in {"ai-signature", "ai-minimal"}:
        copied = copy_audit_image(
            str(report_payload.get("image") or ""),
            assets_dir / f"front_cover_{variant_id}.png",
        )
        if valid and copied:
            front_image = copied
            front_svg = ""
        else:
            render_mode = "studio-exact-fallback"

    base_score = float(existing_variant.get("score") or 100.0)
    if recommendation == "signature" and spec["label"] == "Signature":
        base_score += 40
    elif recommendation == "minimal" and spec["label"] == "Minimal":
        base_score += 40
    elif recommendation == "exact" and spec["label"] == "Exact":
        base_score += 40
    elif valid:
        base_score += 20

    art_image = str(existing_variant.get("art_image") or "")
    if valid and render_mode in {"ai-signature", "ai-minimal"}:
        art_image = front_image

    return {
        "id": variant_id,
        "family": family_id,
        "label": str(spec["label"]),
        "genre": str(existing_variant.get("genre") or ""),
        "subtopic": str(existing_variant.get("subtopic") or ""),
        "layout": str(existing_variant.get("layout") or ""),
        "motif": str(existing_variant.get("motif") or ""),
        "paletteKey": str(existing_variant.get("paletteKey") or ""),
        "front_image": front_image,
        "front_svg": front_svg,
        "back_image": back_image,
        "back_svg": back_svg,
        "art_image": art_image,
        "score": round(base_score, 2),
        "recommended": False,
        "provider": provider,
        "template": str(existing_variant.get("template") or ""),
        "preferred_zone": str(existing_variant.get("preferred_zone") or ""),
        "render_mode": render_mode,
        "text_strategy": "hybrid-ai-text",
        "text_validation": text_validation if render_mode != "studio-exact" else {},
    }


def selected_variant_id_for_recommendation(recommendation: str, specs: list[dict[str, Any]]) -> str:
    mapping = {
        "signature": "ai-signature",
        "minimal": "ai-minimal",
        "exact": "studio-exact",
    }
    desired = mapping.get(recommendation, "studio-exact")
    for spec in specs:
        if spec["render_mode"] == desired:
            return str(spec["id"])
    return str(specs[-1]["id"])


def apply_item(report_item: dict[str, Any]) -> dict[str, Any]:
    slug = str(report_item["slug"])
    book_dir = BOOK_OUTPUTS_DIR / slug
    meta = read_dashboard_meta(book_dir)
    entry = load_entry(book_dir)
    specs = variant_specs_for_entry(entry)
    by_family = existing_variants_by_family(meta)

    signature_payload = report_variant_payload(report_item, "signature")
    minimal_payload = report_variant_payload(report_item, "minimal")
    exact_payload = report_variant_payload(report_item, "exact")
    recommendation = str(report_item.get("recommendation") or "exact")

    cover_variants: list[dict[str, Any]] = []
    for spec in specs:
        family_id = str(spec["family"]["id"])
        payload = {}
        if spec["render_mode"] == "ai-signature":
            payload = signature_payload
        elif spec["render_mode"] == "ai-minimal":
            payload = minimal_payload
        else:
            payload = exact_payload
        cover_variants.append(build_variant(slug, payload, spec, by_family.get(family_id), recommendation))

    selected_id = selected_variant_id_for_recommendation(recommendation, specs)
    for variant in cover_variants:
        variant["recommended"] = variant["id"] == selected_id

    selected_variant = next(variant for variant in cover_variants if variant["id"] == selected_id)
    promote_selected_variant(book_dir, selected_variant)

    meta.update(
        {
            "cover_variants": cover_variants,
            "cover_variant_count": len(cover_variants),
            "recommended_cover_variant": selected_id,
            "selected_cover_variant": selected_id,
            "cover_text_strategy": "hybrid-ai-text",
            "cover_image": "assets/front_cover_final.png",
            "back_cover_image": "assets/back_cover_final.png",
            "cover_generation_provider": str(selected_variant.get("provider") or meta.get("cover_generation_provider") or ""),
            "cover_composed": True,
            "cover_family": selected_variant.get("family", ""),
            "back_cover_variant_family": selected_variant.get("family", ""),
            "cover_genre": selected_variant.get("genre") or str(meta.get("cover_genre") or ""),
            "cover_subtopic": selected_variant.get("subtopic") or str(meta.get("cover_subtopic") or ""),
            "cover_palette_key": selected_variant.get("paletteKey") or str(meta.get("cover_palette_key") or ""),
            "cover_layout_key": selected_variant.get("layout") or str(meta.get("cover_layout_key") or ""),
            "cover_motif": selected_variant.get("motif") or str(meta.get("cover_motif") or ""),
            "cover_art_image": selected_variant.get("art_image", ""),
            "cover_template": selected_variant.get("template") or str(meta.get("cover_template") or ""),
        }
    )
    write_dashboard_meta(book_dir, meta)
    return {
        "slug": slug,
        "selected_cover_variant": selected_id,
        "recommendation": recommendation,
        "cover_text_strategy": meta.get("cover_text_strategy"),
    }


def main() -> None:
    args = parse_args()
    report_path = Path(args.report)
    report = json.loads(report_path.read_text(encoding="utf-8"))
    if args.slug:
        requested = set(args.slug)
        report = [item for item in report if str(item.get("slug") or "") in requested]

    results = [apply_item(item) for item in report if item.get("status") == "audited"]
    print(json.dumps({"applied": len(results), "results": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
