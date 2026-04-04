#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
TMP_ROOT = ROOT / "tmp" / "hybrid-cover-audit"
BOOK_OUTPUTS_DIR = ROOT / "book_outputs"
sys.path.insert(0, str(Path(__file__).resolve().parent))

from generate_book_cover_variants import load_entry  # noqa: E402
from generate_showcase_ai_covers import (  # noqa: E402
    ai_text_providers_for_entry,
    ai_text_strategy_for_entry,
    generate_variant,
    load_manifest,
    validate_ai_cover_text,
    variant_specs_for_entry,
    ai_text_prompt,
    resolve_api_key,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit AI text cover variants for eligible showcase books.")
    parser.add_argument("--slug", action="append", default=[], help="Run only for specific slug(s).")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of books for the run.")
    parser.add_argument(
        "--providers",
        type=int,
        default=2,
        help="How many providers from the normal priority list to try for each AI variant.",
    )
    return parser.parse_args()


def eligible_showcase_slugs() -> list[str]:
    slugs: list[str] = []
    for entry in load_manifest():
        if ai_text_strategy_for_entry(entry) == "hybrid-ai-text":
            slugs.append(str(entry["slug"]))
    return slugs


def choose_recommendation(signature: dict[str, Any] | None, minimal: dict[str, Any] | None) -> str:
    if signature and signature.get("valid"):
        return "signature"
    if minimal and minimal.get("valid"):
        return "minimal"
    return "exact"


def summarize_variant_result(result: dict[str, Any] | None) -> dict[str, Any]:
    if not result:
        return {
            "status": "failed",
            "valid": False,
            "provider": "",
            "image": "",
            "titleScore": 0.0,
            "subtitleScore": 0.0,
            "authorScore": 0.0,
            "prefixGuardFailed": False,
            "targets": {},
        }
    validation = result.get("validation") or {}
    return {
        "status": "valid" if validation.get("valid") else "fallback",
        "valid": bool(validation.get("valid")),
        "provider": str(result.get("provider") or ""),
        "image": str(result.get("image") or ""),
        "titleScore": float(validation.get("titleScore") or 0.0),
        "subtitleScore": float(validation.get("subtitleScore") or 0.0),
        "authorScore": float(validation.get("authorScore") or 0.0),
        "prefixGuardFailed": bool(validation.get("prefixGuardFailed")),
        "targets": validation.get("targets") if isinstance(validation.get("targets"), dict) else {},
    }


def run_ai_variant(
    entry: dict[str, Any],
    family: dict[str, Any],
    mode: str,
    providers: list[str],
    book_dir: Path,
) -> dict[str, Any] | None:
    slug = str(entry["slug"])
    variant_dir = TMP_ROOT / slug
    variant_dir.mkdir(parents=True, exist_ok=True)

    best: dict[str, Any] | None = None
    for provider in providers:
        output_path = variant_dir / f"{mode}-{provider}.png"
        if not output_path.exists():
            prompt = ai_text_prompt(entry, family, mode, 1)
            ok = generate_variant(prompt, output_path, "", provider)
            if not ok or not output_path.exists():
                continue
        validation = validate_ai_cover_text(entry, output_path, mode)
        candidate = {
            "provider": provider,
            "image": str(output_path),
            "validation": validation,
        }
        if best is None:
            best = candidate
        else:
            current_total = sum(
                float(best["validation"].get(key) or 0.0) for key in ("titleScore", "subtitleScore", "authorScore")
            )
            candidate_total = sum(
                float(candidate["validation"].get(key) or 0.0) for key in ("titleScore", "subtitleScore", "authorScore")
            )
            if candidate_total > current_total:
                best = candidate
        if validation.get("valid"):
            return candidate

    return best


def audit_slug(slug: str, provider_limit: int) -> dict[str, Any]:
    book_dir = BOOK_OUTPUTS_DIR / slug
    if not book_dir.exists():
        return {"slug": slug, "status": "missing-book-dir"}

    entry = load_entry(book_dir)
    if ai_text_strategy_for_entry(entry) != "hybrid-ai-text":
        return {
            "slug": slug,
            "title": entry.get("title"),
            "status": "not-eligible",
            "language": entry.get("languageCode"),
        }

    specs = variant_specs_for_entry(entry)
    signature_spec = next((spec for spec in specs if spec["render_mode"] == "ai-signature"), None)
    minimal_spec = next((spec for spec in specs if spec["render_mode"] == "ai-minimal"), None)
    exact_spec = next((spec for spec in specs if spec["render_mode"] == "studio-exact"), None)
    providers = ai_text_providers_for_entry("auto", entry)[:provider_limit]

    signature = None
    minimal = None
    if signature_spec:
        signature = run_ai_variant(entry, signature_spec["family"], "ai-signature", providers, book_dir)
    if minimal_spec:
        minimal = run_ai_variant(entry, minimal_spec["family"], "ai-minimal", providers, book_dir)

    exact_image = ""
    if exact_spec:
        family_id = str(exact_spec["family"]["id"])
        exact_path = book_dir / "assets" / f"front_cover_{family_id}.png"
        if exact_path.exists():
            exact_image = str(exact_path)

    signature_summary = summarize_variant_result(signature)
    minimal_summary = summarize_variant_result(minimal)
    recommendation = choose_recommendation(signature_summary, minimal_summary)

    return {
        "slug": slug,
        "title": entry.get("title"),
        "author": entry.get("author"),
        "language": entry.get("languageCode"),
        "status": "audited",
        "providersTried": providers,
        "recommendation": recommendation,
        "signature": signature_summary,
        "minimal": minimal_summary,
        "exact": {
            "status": "ready",
            "image": exact_image,
            "label": exact_spec["label"] if exact_spec else "Exact",
            "family": exact_spec["family"]["id"] if exact_spec else "",
        },
    }


def write_report(results: list[dict[str, Any]]) -> tuple[Path, Path]:
    TMP_ROOT.mkdir(parents=True, exist_ok=True)
    json_path = TMP_ROOT / "report.json"
    md_path = TMP_ROOT / "report.md"
    json_path.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = ["# Hybrid Cover Audit", ""]
    for item in results:
        lines.append(f"## {item.get('title', item['slug'])}")
        lines.append(f"- slug: `{item['slug']}`")
        lines.append(f"- language: `{item.get('language', '')}`")
        lines.append(f"- recommendation: `{item.get('recommendation', item.get('status', 'unknown'))}`")
        if item.get("status") != "audited":
            lines.append(f"- status: `{item.get('status')}`")
            lines.append("")
            continue
        for key in ("signature", "minimal", "exact"):
            variant = item.get(key) or {}
            lines.append(f"- {key}: `{variant.get('status', '')}`")
            image = str(variant.get("image") or "").strip()
            if image:
                lines.append(f"![{item['slug']}-{key}]({image})")
            if key != "exact":
                lines.append(
                    f"  title={variant.get('titleScore', 0):.2f} subtitle={variant.get('subtitleScore', 0):.2f} author={variant.get('authorScore', 0):.2f}"
                )
        lines.append("")

    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return json_path, md_path


def main() -> None:
    args = parse_args()
    resolve_api_key()
    slugs = eligible_showcase_slugs()
    if args.slug:
        requested = set(args.slug)
        slugs = [slug for slug in slugs if slug in requested]
    if args.limit > 0:
        slugs = slugs[: args.limit]

    results = [audit_slug(slug, max(1, args.providers)) for slug in slugs]
    json_path, md_path = write_report(results)
    summary = {
        "eligible": len(slugs),
        "signature_winners": sum(1 for item in results if item.get("recommendation") == "signature"),
        "minimal_winners": sum(1 for item in results if item.get("recommendation") == "minimal"),
        "exact_winners": sum(1 for item in results if item.get("recommendation") == "exact"),
        "json": str(json_path),
        "markdown": str(md_path),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
