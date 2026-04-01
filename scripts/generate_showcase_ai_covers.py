#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import json
import os
import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any

import requests


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "showcase-portfolio.json"
BOOK_OUTPUTS_DIR = ROOT / "book_outputs"
SCORER_SCRIPT = ROOT / "scripts" / "score_cover_art.mjs"
COMPOSER_SCRIPT = ROOT / "scripts" / "compose_cover_bundle.mjs"
DEFAULT_ENV_FILES = [
    ROOT / ".env.codefast.local",
    ROOT / "web" / ".env.local",
    ROOT / "web" / ".env",
]
KEY_NAMES = ("CODEFAST_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY")
GROK_IMAGE_URL = "https://grokapi.codefast.app/v1/images/generations"
GROK_HISTORY_URL = "https://grokapi.codefast.app/v1/history?page=1&per_page=10"
NANO_IMAGE_URL = "https://geminiapi.codefast.app/v1/image"
NANO_STATUS_URL = "https://geminiapi.codefast.app/v1/image/status"
NANO_MODELS = {
    "nano-banana-pro": "gemini-3.0-pro",
    "nano-banana-2": "gemini-3.1-flash",
}
VARIANT_COUNT = 3
POLL_ATTEMPTS = 24
POLL_INTERVAL_SECONDS = 4


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


def resolve_api_key() -> str:
    for env_path in DEFAULT_ENV_FILES:
        load_env_file(env_path)
    for name in KEY_NAMES:
        value = os.environ.get(name, "").strip()
        if value:
            return value
    raise SystemExit("No cover API key found in environment or local env files.")


def load_manifest() -> list[dict[str, Any]]:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def normalize_service(service: str) -> list[str]:
    if service == "auto":
        return ["grok-imagine", "nano-banana-pro", "nano-banana-2"]
    return [service]


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


def generate_with_grok(prompt: str, output_path: Path, api_key: str) -> bool:
    response = requests.post(
        GROK_IMAGE_URL,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"prompt": prompt, "aspect_ratio": "2:3", "n": 1},
        timeout=180,
    )
    payload = response.json() if response.content else {}
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
        history_payload = history.json() if history.content else {}
        items = history_payload.get("items") or []
        for item in items:
            if item.get("type", "image") != "image":
                continue
            if item.get("prompt") == prompt and isinstance(item.get("url"), str):
                return download_image(item["url"], output_path)
        for item in items:
            if item.get("type", "image") == "image" and isinstance(item.get("url"), str):
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
    payload = response.json() if response.content else {}
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
        status_payload = status.json() if status.content else {}
        job_status = extract_from_payload(status_payload, ("job", "status")) or ""
        if job_status == "SUCCESS":
            return save_image_from_payload(status_payload, output_path)
        if job_status in {"ERROR", "CANCELED", "CANCELLED"}:
            return False
        time.sleep(POLL_INTERVAL_SECONDS)

    return False


def build_prompt(entry: dict[str, Any]) -> str:
    prompt = str(entry.get("coverPrompt") or "").strip()
    if prompt:
        return prompt
    topic = str(entry.get("topic") or entry.get("summary") or entry.get("title") or "a high-end nonfiction topic").strip()
    category = str(entry.get("category") or "nonfiction").strip().lower()
    return (
        f"Create premium portrait editorial background artwork for a {category} book about {topic}. "
        "Use cinematic lighting, refined texture, layered depth, and calm premium negative space. "
        "Make it feel like a high-end nonfiction bestseller cover. "
        "No words, no letters, no numbers, no symbols, no logos, no watermarks."
    )


def variant_prompt_suffix(variant_index: int) -> str:
    suffixes = {
        1: "Favor strong bookstore nonfiction authority, elegant negative space, and a restrained upper title zone.",
        2: "Favor layered editorial geometry, premium contrast, and a calm lower third with cleaner typography room.",
        3: "Favor cinematic abstraction, refined material texture, and uncluttered edge detail for composition flexibility.",
    }
    return suffixes.get(variant_index, "Favor premium editorial clarity and clean title space.")


def build_variant_prompt(entry: dict[str, Any], variant_index: int) -> str:
    return f"{build_prompt(entry)} {variant_prompt_suffix(variant_index)}"


def read_dashboard_meta(book_dir: Path) -> dict[str, Any]:
    meta_path = book_dir / "dashboard_meta.json"
    if not meta_path.exists():
        return {}
    return json.loads(meta_path.read_text(encoding="utf-8"))


def write_dashboard_meta(book_dir: Path, meta: dict[str, Any]) -> None:
    meta_path = book_dir / "dashboard_meta.json"
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def derive_cover_template_hint(entry: dict[str, Any]) -> str:
    if entry.get("coverTemplateHint"):
        return str(entry["coverTemplateHint"])
    category = str(entry.get("category") or "").lower()
    tone = str(entry.get("toneArchetype") or "").lower()
    if "story" in tone:
        return "narrative-story"
    if "calm executive" in tone or "executive" in tone:
        return "executive-minimal"
    if "education" in category:
        return "education-workbook"
    if "personal" in category:
        return "personal-growth"
    if "expertise" in category or "uzman" in category:
        return "expertise-authority"
    return "business-playbook"


def derive_title_tone(entry: dict[str, Any]) -> str:
    if entry.get("titleTone"):
        return str(entry["titleTone"])
    language = str(entry.get("languageCode") or "")
    if language == "Japanese":
        return "cjk"
    if language == "Arabic":
        return "rtl"
    tone = str(entry.get("toneArchetype") or "").lower()
    if "operator" in tone or "systems" in tone or "executive" in tone:
        return "sharp"
    return "classic"


def derive_cover_hierarchy(entry: dict[str, Any]) -> str:
    if entry.get("coverHierarchy"):
        return str(entry["coverHierarchy"])
    tone = str(entry.get("toneArchetype") or "").lower()
    if "story" in tone:
        return "title-subtitle-emotive"
    if "executive" in tone:
        return "title-author-minimal"
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


def score_variant(image_path: Path) -> dict[str, Any]:
    return run_node_json(SCORER_SCRIPT, "--input", str(image_path))


def compose_cover_bundle(entry: dict[str, Any], book_dir: Path, art_path: Path, preferred_zone: str) -> dict[str, Any]:
    assets_dir = book_dir / "assets"
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
        "coverTemplateHint": derive_cover_template_hint(entry),
        "titleTone": derive_title_tone(entry),
        "coverHierarchy": derive_cover_hierarchy(entry),
        "brandingLogoPath": str(assets_dir / "publisher_logo.svg"),
    }

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
            str(assets_dir / "front_cover_final.svg"),
            "--front-png",
            str(assets_dir / "front_cover_final.png"),
            "--back-svg",
            str(assets_dir / "back_cover_final.svg"),
            "--back-png",
            str(assets_dir / "back_cover_final.png"),
        )
    finally:
        config_path.unlink(missing_ok=True)


def generate_variant(prompt: str, output_path: Path, api_key: str, provider: str) -> bool:
    if provider == "grok-imagine":
        return generate_with_grok(prompt, output_path, api_key)
    if provider in NANO_MODELS:
        return generate_with_nano(prompt, output_path, api_key, NANO_MODELS[provider])
    return False


def ensure_variant_art(entry: dict[str, Any], assets_dir: Path, api_key: str, service: str, force: bool) -> list[dict[str, Any]]:
    generated: list[dict[str, Any]] = []
    legacy_ai_cover = assets_dir / "ai_front_cover.png"
    providers = normalize_service(service)

    for variant_index in range(1, VARIANT_COUNT + 1):
        target = assets_dir / f"cover_art_v{variant_index}.png"
        provider_used = ""
        reused = False

        if not force and target.exists():
            reused = True
        elif not force and variant_index == 1 and legacy_ai_cover.exists():
            shutil.copyfile(legacy_ai_cover, target)
            reused = True
        else:
            prompt = build_variant_prompt(entry, variant_index)
            for provider in providers:
                with tempfile.TemporaryDirectory(prefix=f"showcase-cover-{entry['slug']}-v{variant_index}-") as temp_dir:
                    temp_image = Path(temp_dir) / "variant.png"
                    if generate_variant(prompt, temp_image, api_key, provider):
                        shutil.copyfile(temp_image, target)
                        provider_used = provider
                        break
            if not provider_used and not target.exists():
                raise RuntimeError(f"All cover providers failed for {entry['slug']} variant {variant_index}")

        if not target.exists():
            raise RuntimeError(f"Variant output missing for {entry['slug']} variant {variant_index}")
        generated.append(
            {
                "variant": variant_index,
                "path": target,
                "provider": provider_used or ("existing" if reused else service),
            }
        )

    return generated


def promote_legacy_aliases(assets_dir: Path, selected_art_path: Path) -> None:
    shutil.copyfile(selected_art_path, assets_dir / "ai_front_cover.png")
    shutil.copyfile(assets_dir / "front_cover_final.png", assets_dir / "showcase_front_cover.png")
    shutil.copyfile(assets_dir / "front_cover_final.svg", assets_dir / "showcase_front_cover.svg")
    shutil.copyfile(assets_dir / "back_cover_final.svg", assets_dir / "showcase_back_cover.svg")


def generate_cover_for_entry(entry: dict[str, Any], service: str, api_key: str, force: bool) -> None:
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
    ):
        return

    variants = ensure_variant_art(entry, assets_dir, api_key, service, force)
    scored_variants = []
    for variant in variants:
        score_payload = score_variant(Path(variant["path"]))
        scored_variants.append(
            {
                **variant,
                "path": str(variant["path"]),
                "score": score_payload["score"],
                "preferredZone": score_payload.get("preferredZone") or "",
                "details": score_payload,
            }
        )

    scored_variants.sort(key=lambda item: item["score"], reverse=True)
    best = scored_variants[0]
    composition = compose_cover_bundle(entry, book_dir, Path(best["path"]), str(best.get("preferredZone") or ""))
    promote_legacy_aliases(assets_dir, Path(best["path"]))
    (assets_dir / "cover_art_scores.json").write_text(
        json.dumps(scored_variants, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    meta.update(
        {
            "cover_art_image": f"assets/{Path(best['path']).name}",
            "cover_image": "assets/front_cover_final.png",
            "back_cover_image": "assets/back_cover_final.svg",
            "cover_template": composition.get("template") or derive_cover_template_hint(entry),
            "cover_variant_count": len(scored_variants),
            "cover_generation_provider": best.get("provider") or service,
            "cover_composed": True,
        }
    )
    write_dashboard_meta(book_dir, meta)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate AI showcase covers for /examples books.")
    parser.add_argument(
        "--service",
        default="auto",
        choices=["auto", "grok-imagine", "nano-banana-pro", "nano-banana-2"],
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
