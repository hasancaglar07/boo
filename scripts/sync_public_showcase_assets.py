#!/usr/bin/env python3

from __future__ import annotations

import json
import shutil
from pathlib import Path


SUPPORTED_EXTENSIONS = {".png", ".webp", ".jpg", ".jpeg", ".svg"}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def load_showcase_slugs(root: Path) -> list[str]:
    manifest_path = root / "data" / "showcase-portfolio.json"
    entries = json.loads(manifest_path.read_text(encoding="utf-8"))
    return [entry["slug"] for entry in entries if entry.get("slug")]


def sync_slug_assets(root: Path, slug: str) -> int:
    source_dir = root / "book_outputs" / slug / "assets"
    target_dir = root / "web" / "public" / "showcase-covers" / slug
    target_dir.mkdir(parents=True, exist_ok=True)

    copied = 0
    if not source_dir.exists():
        return copied

    for source_path in source_dir.iterdir():
        if not source_path.is_file():
            continue
        if source_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue
        shutil.copy2(source_path, target_dir / source_path.name)
        copied += 1

    return copied


def main() -> int:
    root = repo_root()
    total_files = 0
    slugs_with_assets = 0

    for slug in load_showcase_slugs(root):
        copied = sync_slug_assets(root, slug)
        total_files += copied
        if copied:
            slugs_with_assets += 1

    print(
        json.dumps(
            {
                "ok": True,
                "slugs": slugs_with_assets,
                "files": total_files,
                "target": str(root / "web" / "public" / "showcase-covers"),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
