#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
import os
import posixpath
import re
import shlex
import shutil
import struct
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from zipfile import ZipFile


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run post-export EPUB/PDF quality checks and emit JSON report.")
    parser.add_argument("--export-dir", required=True, help="Export directory path (exports_YYYY...).")
    parser.add_argument("--manuscript", default="", help="Path to the source markdown manuscript.")
    parser.add_argument("--book-title", default="", help="Expected book title for TOC checks.")
    parser.add_argument("--book-profile", default="nonfiction_premium", help="Book profile mode.")
    parser.add_argument("--variation-mode", default="controlled", help="Variation mode.")
    parser.add_argument("--quality-target", default="kdp", help="Quality target (kdp|balanced|dev).")
    parser.add_argument("--format", default="all", help="Requested export format (all|epub|pdf|...).")
    parser.add_argument("--omit-covers", action="store_true", help="Expect exports without front/back cover assets.")
    parser.add_argument("--output", default="", help="Optional report output path.")
    return parser.parse_args()


def latest_file_by_suffix(export_dir: Path, suffix: str) -> Path | None:
    candidates = [path for path in export_dir.glob(f"*{suffix}") if path.is_file()]
    if not candidates:
        return None
    return max(candidates, key=lambda path: (path.stat().st_mtime, path.name))


def normalize_label(value: str) -> str:
    cleaned = html.unescape(value or "")
    cleaned = re.sub(r"\s+", " ", cleaned).strip().casefold()
    cleaned = re.sub(r"[\W_]+", "", cleaned, flags=re.UNICODE)
    return cleaned


def strip_tags(value: str) -> str:
    return re.sub(r"<[^>]+>", "", value or "")


def add_check(bucket: list[dict[str, Any]], check_id: str, ok: bool, message: str) -> None:
    bucket.append(
        {
            "id": check_id,
            "status": "PASS" if ok else "FAIL",
            "message": message,
        }
    )


def add_warn_check(bucket: list[dict[str, Any]], check_id: str, ok: bool, message: str) -> None:
    bucket.append(
        {
            "id": check_id,
            "status": "PASS" if ok else "WARN",
            "message": message,
        }
    )


def should_expect(format_name: str, target: str) -> bool:
    normalized = (format_name or "").strip().lower()
    if normalized == "all":
        return True
    return normalized == target


def image_dimensions(data: bytes) -> tuple[int, int] | None:
    if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 24:
        width, height = struct.unpack(">II", data[16:24])
        return width, height

    if data[:2] == b"\xFF\xD8":
        i = 2
        n = len(data)
        sof_markers = {
            0xC0,
            0xC1,
            0xC2,
            0xC3,
            0xC5,
            0xC6,
            0xC7,
            0xC9,
            0xCA,
            0xCB,
            0xCD,
            0xCE,
            0xCF,
        }
        while i + 9 < n:
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            if marker in sof_markers:
                height, width = struct.unpack(">HH", data[i + 5 : i + 9])
                return width, height
            if marker in {0xD8, 0xD9}:
                i += 2
                continue
            if i + 4 >= n:
                break
            seg_len = struct.unpack(">H", data[i + 2 : i + 4])[0]
            if seg_len < 2:
                break
            i += 2 + seg_len
    return None


def parse_first_cover_src(cover_text: str) -> str:
    patterns = (
        r"<img[^>]+src=[\"']([^\"']+)[\"']",
        r"<image[^>]+xlink:href=[\"']([^\"']+)[\"']",
        r"<image[^>]+href=[\"']([^\"']+)[\"']",
    )
    for pattern in patterns:
        match = re.search(pattern, cover_text, flags=re.IGNORECASE | re.DOTALL)
        if match:
            return match.group(1).strip()
    return ""


def resolve_epub_relative_path(base_entry: str, relative_ref: str) -> str:
    if not relative_ref:
        return ""
    cleaned = relative_ref.split("#", 1)[0].split("?", 1)[0].strip()
    if not cleaned:
        return ""
    base_dir = posixpath.dirname(base_entry)
    joined = posixpath.normpath(posixpath.join(base_dir, cleaned))
    return joined.lstrip("/")


def toc_chapter_sequence_from_hrefs(hrefs: list[str]) -> list[int]:
    sequence: list[int] = []
    for href in hrefs:
        match = re.search(r"ch0*([0-9]+)\.xhtml", href, flags=re.IGNORECASE)
        if match:
            sequence.append(int(match.group(1)))
    return sequence


def css_zero_shorthand(value: str) -> bool:
    cleaned = re.sub(r"!important", "", value or "", flags=re.IGNORECASE).strip()
    if not cleaned:
        return False
    tokens = [token for token in re.split(r"\s+", cleaned) if token]
    if not tokens:
        return False
    for token in tokens:
        normalized = token.strip().rstrip(",")
        if re.fullmatch(r"0+(?:\.0+)?(?:[a-z%]+)?", normalized, flags=re.IGNORECASE):
            continue
        return False
    return True


def check_epub_css_reflow(css_text: str) -> tuple[list[str], list[str]]:
    failures: list[str] = []
    warnings: list[str] = []

    body_block = re.search(r"body\s*\{(.*?)\}", css_text, flags=re.IGNORECASE | re.DOTALL)
    if not body_block:
        warnings.append("No explicit body{} block found in EPUB CSS.")
        return failures, warnings

    body_css = body_block.group(1)
    if re.search(r"\bmax-width\s*:", body_css, flags=re.IGNORECASE):
        failures.append("EPUB CSS body block contains max-width, which can break reflow on Kindle.")

    if re.search(r"\bfont-size\s*:\s*[^;]*(pt|px|rem|em)", body_css, flags=re.IGNORECASE):
        failures.append("EPUB CSS body block sets font-size explicitly; Kindle reflow body should use defaults.")

    if re.search(r"\bline-height\s*:\s*[^;]+", body_css, flags=re.IGNORECASE):
        failures.append("EPUB CSS body block sets line-height explicitly; Kindle recommends body defaults.")

    padding_values = re.findall(r"\bpadding\s*:\s*([^;}{]+)", body_css, flags=re.IGNORECASE)
    if any(not css_zero_shorthand(value) for value in padding_values):
        failures.append("EPUB CSS body block has non-zero global padding.")

    lr_padding_values = re.findall(r"\bpadding-(?:left|right)\s*:\s*([^;}{]+)", body_css, flags=re.IGNORECASE)
    if any(not css_zero_shorthand(value) for value in lr_padding_values):
        failures.append("EPUB CSS body block has non-zero left/right padding.")

    if re.search(r"\bmargin\s*:\s*auto", body_css, flags=re.IGNORECASE):
        failures.append("EPUB CSS body block uses margin:auto; avoid forced body centering in reflowable books.")

    if re.search(r"\btext-align\s*:\s*(center|right)", body_css, flags=re.IGNORECASE):
        failures.append("EPUB CSS body block forces center/right text alignment.")

    return failures, warnings


def check_epub(epub_path: Path, book_title: str, quality_target: str, omit_covers: bool = False) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []
    errors: list[str] = []
    warnings: list[str] = []

    with ZipFile(epub_path, "r") as epub:
        names = [name for name in epub.namelist() if name and not name.endswith("/")]
        xhtml_names = [name for name in names if name.lower().endswith(".xhtml")]
        text_xhtml_names = [name for name in xhtml_names if "/text/" in name.lower()]
        cover_candidates = [
            name for name in xhtml_names if name.lower().endswith("/cover.xhtml") or name.lower() == "cover.xhtml"
        ]
        nav_candidates = [name for name in xhtml_names if name.lower().endswith("/nav.xhtml") or name.lower() == "nav.xhtml"]
        ncx_candidates = [name for name in names if name.lower().endswith("toc.ncx")]
        opf_candidates = [name for name in names if name.lower().endswith("content.opf")]
        css_entries = [name for name in names if name.lower().endswith(".css")]

        if omit_covers:
            add_check(
                checks,
                "epub_single_cover_file",
                len(cover_candidates) == 0,
                f"Expected no cover.xhtml file when --omit-covers is enabled, found {len(cover_candidates)}.",
            )
            if len(cover_candidates) != 0:
                errors.append(f"EPUB cover.xhtml should be omitted but found {len(cover_candidates)} file(s).")
        else:
            add_check(
                checks,
                "epub_single_cover_file",
                len(cover_candidates) == 1,
                f"Expected exactly 1 cover.xhtml file, found {len(cover_candidates)}.",
            )
            if len(cover_candidates) != 1:
                errors.append(f"EPUB cover.xhtml count invalid ({len(cover_candidates)}).")

        cover_name = cover_candidates[0] if cover_candidates else ""
        cover_text = ""
        cover_image_entry = ""
        cover_dimensions_value: tuple[int, int] | None = None
        if cover_name and not omit_covers:
            cover_text = epub.read(cover_name).decode("utf-8", errors="replace")
            has_img_cover = bool(re.search(r"<img\b[^>]+src=[\"'][^\"']+[\"']", cover_text, flags=re.IGNORECASE))
            has_svg_cover = bool(re.search(r"<svg\b", cover_text, flags=re.IGNORECASE))
            add_check(
                checks,
                "epub_cover_xhtml_img_based",
                has_img_cover and not has_svg_cover,
                "cover.xhtml must use direct <img> full-bleed and must not keep SVG wrapper.",
            )
            if not has_img_cover or has_svg_cover:
                errors.append("cover.xhtml is not normalized to <img>-based full-bleed cover.")

            has_cover_body_override = bool(
                re.search(r"body#cover\s*\{[^}]*max-width\s*:\s*none", cover_text, flags=re.IGNORECASE | re.DOTALL)
            )
            add_check(
                checks,
                "epub_cover_body_override",
                has_cover_body_override,
                "cover.xhtml must include body#cover max-width/margin/padding overrides.",
            )
            if not has_cover_body_override:
                errors.append("cover.xhtml is missing body#cover override styles.")

            cover_src = parse_first_cover_src(cover_text)
            if cover_src:
                cover_image_entry = resolve_epub_relative_path(cover_name, cover_src)
            if cover_image_entry and cover_image_entry in names:
                cover_dimensions_value = image_dimensions(epub.read(cover_image_entry))

            cover_size_ok = bool(
                cover_dimensions_value
                and cover_dimensions_value[0] >= 1600
                and cover_dimensions_value[1] >= 2560
                and (cover_dimensions_value[1] / max(1, cover_dimensions_value[0])) >= 1.6
            )
            add_check(
                checks,
                "epub_cover_resolution_profile",
                cover_size_ok,
                "Cover image should be at least 1600x2560 and ratio >= 1.6 for KDP-quality output.",
            )
            if not cover_size_ok:
                if cover_dimensions_value:
                    errors.append(
                        "Cover image quality profile failed "
                        f"({cover_dimensions_value[0]}x{cover_dimensions_value[1]})."
                    )
                else:
                    errors.append("Cover image dimensions could not be resolved from EPUB package.")

        frontcover_repeats: list[str] = []
        backcover_container_count = 0
        backcover_insert_count = 0
        raw_artifact_hits = 0

        for name in text_xhtml_names:
            text = epub.read(name).decode("utf-8", errors="replace")
            if cover_name and name == cover_name:
                if re.search(r"\{[.]unnumbered|\{[.]unlisted", text):
                    raw_artifact_hits += 1
                continue
            if re.search(r"(frontcover-container|id=[\"']cover-image[\"'])", text, flags=re.IGNORECASE):
                frontcover_repeats.append(name)
            backcover_container_count += len(re.findall(r"backcover-container", text, flags=re.IGNORECASE))
            backcover_insert_count += len(re.findall(r"class=[\"'][^\"']*\bback-cover\b[^\"']*[\"']", text, flags=re.IGNORECASE))
            if re.search(r"\{[.]unnumbered|\{[.]unlisted", text):
                raw_artifact_hits += 1

        add_check(
            checks,
            "epub_no_frontcover_repeat_in_chapters",
            len(frontcover_repeats) == 0,
            "No repeated front-cover container should appear in chapter XHTML files.",
        )
        if frontcover_repeats:
            errors.append(f"Repeated front cover content found in: {', '.join(frontcover_repeats)}")

        if omit_covers:
            no_backcover_duplicates = backcover_insert_count == 0 and backcover_container_count == 0
        else:
            no_backcover_duplicates = backcover_insert_count == 0 and backcover_container_count <= 1
        add_check(
            checks,
            "epub_single_backcover_source",
            no_backcover_duplicates,
            (
                "Back cover entries must be absent when --omit-covers is enabled."
                if omit_covers
                else "Back cover must come from one source only (container only, no injected back-cover block)."
            ),
        )
        if not no_backcover_duplicates:
            if omit_covers:
                errors.append(
                    "EPUB contains back-cover markup even though --omit-covers is enabled "
                    f"(backcover-container={backcover_container_count}, back-cover={backcover_insert_count})."
                )
            else:
                errors.append(
                    "EPUB has duplicate back-cover sources "
                    f"(backcover-container={backcover_container_count}, back-cover={backcover_insert_count})."
                )

        add_check(
            checks,
            "epub_no_raw_unnumbered_unlisted_artifacts",
            raw_artifact_hits == 0,
            "No raw {.unnumbered}/{.unlisted} markdown artifacts should leak into EPUB XHTML.",
        )
        if raw_artifact_hits:
            errors.append("Raw unnumbered/unlisted markdown artifacts were found in EPUB XHTML.")

        first_toc_label = ""
        toc_hrefs: list[str] = []
        if nav_candidates:
            nav_text = epub.read(nav_candidates[0]).decode("utf-8", errors="replace")
            toc_fragment_match = re.search(
                r"<nav\b[^>]*epub:type=[\"']toc[\"'][^>]*>(.*?)</nav>",
                nav_text,
                flags=re.IGNORECASE | re.DOTALL,
            )
            toc_fragment = toc_fragment_match.group(1) if toc_fragment_match else nav_text
            first_link = re.search(r"<a\b[^>]*>(.*?)</a>", toc_fragment, flags=re.IGNORECASE | re.DOTALL)
            if first_link:
                first_toc_label = strip_tags(first_link.group(1))
            toc_hrefs = [
                href.strip()
                for href in re.findall(r"<a\b[^>]*href=[\"']([^\"']+)[\"']", toc_fragment, flags=re.IGNORECASE | re.DOTALL)
                if href.strip()
            ]
        else:
            warnings.append("EPUB nav.xhtml not found; TOC title leak check could not run.")

        if first_toc_label and book_title:
            title_leak = normalize_label(first_toc_label) == normalize_label(book_title)
            add_check(
                checks,
                "epub_toc_first_item_not_book_title",
                not title_leak,
                "TOC first item must not be the book title/front-matter heading.",
            )
            if title_leak:
                errors.append(f"TOC first item leaks book title: '{first_toc_label}'.")
        else:
            add_check(
                checks,
                "epub_toc_first_item_not_book_title",
                bool(first_toc_label),
                "TOC first item was detected and validated.",
            )
            if not first_toc_label:
                errors.append("Could not resolve first TOC item from EPUB nav.xhtml.")

        nav_sequence = toc_chapter_sequence_from_hrefs(toc_hrefs)
        nav_chrono_ok = nav_sequence == sorted(nav_sequence)
        add_check(
            checks,
            "epub_toc_nav_chronological",
            nav_chrono_ok,
            "EPUB nav TOC chapter links should be in chronological order.",
        )
        if not nav_chrono_ok:
            errors.append("EPUB nav TOC chapter links are not in chronological order.")

        ncx_sequence: list[int] = []
        if ncx_candidates:
            ncx_text = epub.read(ncx_candidates[0]).decode("utf-8", errors="replace")
            ncx_hrefs = re.findall(r"<content\b[^>]*src=[\"']([^\"']+)[\"']", ncx_text, flags=re.IGNORECASE)
            ncx_sequence = toc_chapter_sequence_from_hrefs(ncx_hrefs)
        ncx_chrono_ok = not ncx_sequence or ncx_sequence == sorted(ncx_sequence)
        add_check(
            checks,
            "epub_toc_ncx_chronological",
            ncx_chrono_ok,
            "EPUB NCX chapter links should be in chronological order.",
        )
        if not ncx_chrono_ok:
            errors.append("EPUB NCX chapter links are not in chronological order.")

        metadata_ok = False
        if opf_candidates:
            opf_text = epub.read(opf_candidates[0]).decode("utf-8", errors="replace")
            has_title = bool(re.search(r"<dc:title\b", opf_text, flags=re.IGNORECASE))
            has_language = bool(re.search(r"<dc:language\b", opf_text, flags=re.IGNORECASE))
            has_identifier = bool(re.search(r"<dc:identifier\b", opf_text, flags=re.IGNORECASE))
            has_description = bool(re.search(r"<dc:description\b", opf_text, flags=re.IGNORECASE))
            has_subject = bool(re.search(r"<dc:subject\b", opf_text, flags=re.IGNORECASE))
            placeholder_identifier = "[No ISBN Provided]" in opf_text

            metadata_ok = has_title and has_language and has_identifier and not placeholder_identifier
            add_check(
                checks,
                "epub_metadata_core_required",
                metadata_ok,
                "OPF must include title, language, and a non-placeholder identifier.",
            )
            if not metadata_ok:
                errors.append("EPUB OPF is missing required metadata or uses placeholder identifier.")

            add_warn_check(
                checks,
                "epub_metadata_description_present",
                has_description,
                "OPF should include dc:description for professional distribution metadata.",
            )
            if not has_description:
                warnings.append("EPUB OPF metadata missing dc:description.")

            add_warn_check(
                checks,
                "epub_metadata_subject_present",
                has_subject,
                "OPF should include at least one dc:subject/keyword.",
            )
            if not has_subject:
                warnings.append("EPUB OPF metadata missing dc:subject.")
        else:
            errors.append("EPUB content.opf file was not found.")
            add_check(checks, "epub_metadata_core_required", False, "OPF metadata file is required.")

        css_failures: list[str] = []
        css_warnings: list[str] = []
        if css_entries:
            for css_entry in css_entries:
                css_text = epub.read(css_entry).decode("utf-8", errors="replace")
                local_failures, local_warnings = check_epub_css_reflow(css_text)
                css_failures.extend(local_failures)
                css_warnings.extend(local_warnings)
        else:
            css_warnings.append("No CSS files were found in EPUB package.")

        add_check(
            checks,
            "epub_reflow_body_css_defaults",
            not css_failures,
            "Reflowable EPUB should not impose body max-width/padding/font-size/line-height constraints.",
        )
        if css_failures:
            errors.extend(css_failures)
        if css_warnings:
            warnings.extend(css_warnings)

    status = "PASS" if not errors else "FAIL"
    return {
        "status": status,
        "errors": errors,
        "warnings": warnings,
        "checks": checks,
        "epub_path": str(epub_path),
    }


def first_meaningful_line(text: str) -> str:
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("<!--") and line.endswith("-->") and line != "<!-- PDF_FRONT_COVER_BEGIN -->":
            continue
        return line
    return ""


def has_consecutive_breaks(opening: str) -> bool:
    break_pattern = re.compile(r"\\(?:clearpage|newpage|pagebreak)\b|:::\s*\{\.pagebreak\}", re.IGNORECASE)
    matches = list(break_pattern.finditer(opening))
    for current, nxt in zip(matches, matches[1:]):
        between = opening[current.end() : nxt.start()]
        between = re.sub(r"<!--.*?-->", "", between, flags=re.DOTALL)
        between = re.sub(r"%[^\n]*", "", between)
        if not between.strip():
            return True
    return False


def check_pdf_opening(manuscript_path: Path) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []
    errors: list[str] = []
    warnings: list[str] = []

    text = manuscript_path.read_text(encoding="utf-8", errors="replace")
    chapter_anchor = text.find('<a id="chapter-1"')
    opening = text[:chapter_anchor] if chapter_anchor != -1 else text

    begin_count = text.count("<!-- PDF_FRONT_COVER_BEGIN -->")
    end_count = text.count("<!-- PDF_FRONT_COVER_END -->")
    toc_index = opening.find("\\tableofcontents")
    begin_index = opening.find("<!-- PDF_FRONT_COVER_BEGIN -->")
    end_index = opening.find("<!-- PDF_FRONT_COVER_END -->")

    single_frontcover_ok = begin_count == 1 and end_count == 1
    add_check(
        checks,
        "pdf_single_frontcover_block",
        single_frontcover_ok,
        f"Opening markdown must include exactly one PDF front cover block (begin={begin_count}, end={end_count}).",
    )
    if not single_frontcover_ok:
        errors.append(f"PDF opening front cover block count invalid (begin={begin_count}, end={end_count}).")

    first_block_ok = first_meaningful_line(opening) == "<!-- PDF_FRONT_COVER_BEGIN -->"
    add_check(
        checks,
        "pdf_first_meaningful_block_frontcover",
        first_block_ok,
        "The first meaningful block before chapter 1 must be PDF front cover.",
    )
    if not first_block_ok:
        errors.append("The first meaningful opening block is not PDF front cover.")

    order_ok = begin_index != -1 and end_index != -1 and toc_index != -1 and begin_index < end_index < toc_index
    add_check(
        checks,
        "pdf_frontcover_break_order",
        order_ok,
        "Front cover begin/end and table of contents order must be valid before chapter 1.",
    )
    if not order_ok:
        errors.append("Invalid front cover / TOC ordering in opening markdown.")

    no_consecutive_breaks = not has_consecutive_breaks(opening)
    add_check(
        checks,
        "pdf_no_consecutive_pagebreaks_before_chapter1",
        no_consecutive_breaks,
        "No consecutive page-break markers are allowed before chapter 1.",
    )
    if not no_consecutive_breaks:
        errors.append("Consecutive page-break markers found before chapter 1.")

    if "\\tableofcontents" not in opening:
        warnings.append("Table of contents marker was not found before chapter 1.")

    status = "PASS" if not errors else "FAIL"
    return {
        "status": status,
        "errors": errors,
        "warnings": warnings,
        "checks": checks,
        "manuscript_path": str(manuscript_path),
    }


def section_skip(reason: str) -> dict[str, Any]:
    return {
        "status": "SKIP",
        "errors": [],
        "warnings": [reason],
        "checks": [],
    }


def run_command(command: list[str], timeout: int = 180) -> tuple[int, str]:
    try:
        proc = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        output = ((proc.stdout or "") + "\n" + (proc.stderr or "")).strip()
        return proc.returncode, output
    except Exception as exc:  # pragma: no cover - defensive
        return 127, str(exc)


def run_epub_validators(epub_path: Path, quality_target: str) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []
    errors: list[str] = []
    warnings: list[str] = []

    epubcheck_path = shutil.which("epubcheck")
    if epubcheck_path:
        rc, output = run_command([epubcheck_path, str(epub_path)])
        ok = rc == 0
        add_check(checks, "validator_epubcheck", ok, "EPUBCheck must pass without errors.")
        if not ok:
            errors.append(f"epubcheck failed (rc={rc}). {output.splitlines()[:1][0] if output else ''}".strip())
    else:
        if quality_target == "kdp":
            add_check(checks, "validator_epubcheck", False, "EPUBCheck binary is required for strict EPUB validation.")
            errors.append("epubcheck is not installed but quality target is kdp.")
        else:
            add_warn_check(checks, "validator_epubcheck", False, "EPUBCheck not installed; validator skipped.")
            warnings.append("epubcheck is not installed; EPUB conformance validator was skipped.")

    ace_path = shutil.which("ace")
    if ace_path:
        output_dir = epub_path.parent / ".ace_report"
        rc, output = run_command([ace_path, "-o", str(output_dir), str(epub_path)], timeout=300)
        ok = rc == 0
        add_warn_check(checks, "validator_ace_accessibility", ok, "Ace by DAISY accessibility check should pass.")
        if not ok:
            warnings.append(f"ace accessibility check reported issues (rc={rc}).")
            if output:
                warnings.append(output.splitlines()[0])
    else:
        add_warn_check(checks, "validator_ace_accessibility", False, "Ace by DAISY not installed; accessibility check skipped.")
        warnings.append("Ace by DAISY is not installed; accessibility check skipped.")

    previewer_cmd_raw = str(os.environ.get("KINDLE_PREVIEWER_CLI", "")).strip()
    if previewer_cmd_raw:
        previewer_parts = shlex.split(previewer_cmd_raw)
        if "{epub}" in previewer_cmd_raw:
            joined = " ".join(previewer_parts).replace("{epub}", shlex.quote(str(epub_path)))
            rc, output = run_command(["bash", "-lc", joined], timeout=300)
        else:
            rc, output = run_command([*previewer_parts, str(epub_path)], timeout=300)
        ok = rc == 0
        add_warn_check(checks, "validator_kindle_previewer", ok, "Kindle Previewer CLI validation should pass.")
        if not ok:
            msg = f"Kindle Previewer CLI reported issues (rc={rc})."
            if quality_target == "kdp":
                errors.append(msg)
            else:
                warnings.append(msg)
            if output:
                warnings.append(output.splitlines()[0])
    else:
        add_warn_check(
            checks,
            "validator_kindle_previewer",
            False,
            "KINDLE_PREVIEWER_CLI not configured; Kindle Previewer validation skipped.",
        )
        warnings.append("KINDLE_PREVIEWER_CLI is not configured; Kindle Previewer validation skipped.")

    status = "PASS" if not errors else "FAIL"
    return {
        "status": status,
        "errors": errors,
        "warnings": warnings,
        "checks": checks,
    }


def check_manuscript_style(manuscript_path: Path, book_profile: str, variation_mode: str) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []
    errors: list[str] = []
    warnings: list[str] = []

    text = manuscript_path.read_text(encoding="utf-8", errors="replace")
    lower = text.lower()
    word_count = len(re.findall(r"\b\w+\b", text, flags=re.UNICODE))

    phrase_limits = {
        "in this chapter": 2,
        "we will explore": 2,
        "let's dive": 2,
        "to sum up": 1,
        "in conclusion": 1,
    }
    repeated_hits: dict[str, int] = {}
    for phrase, base_limit in phrase_limits.items():
        hits = len(re.findall(re.escape(phrase), lower))
        repeated_hits[phrase] = hits
        limit = base_limit
        if variation_mode == "fixed_classic":
            limit += 1
        if hits > limit:
            warnings.append(f"Repeated phrase '{phrase}' appears {hits} times (target <= {limit}).")

    chapter_heading_count = len(re.findall(r"^#\s+(Chapter|Bölüm)\b", text, flags=re.IGNORECASE | re.MULTILINE))
    h2_count = len(re.findall(r"^##\s+", text, flags=re.MULTILINE))
    h3_count = len(re.findall(r"^###\s+", text, flags=re.MULTILINE))
    subheading_count = h2_count + h3_count

    words_per_subheading = (word_count / subheading_count) if subheading_count else float(word_count)
    target_words_per_subheading = 1200 if book_profile == "nonfiction_premium" else 1800
    density_ok = words_per_subheading <= target_words_per_subheading
    add_warn_check(
        checks,
        "layout_subheading_density",
        density_ok,
        f"Words per subheading target <= {target_words_per_subheading} (current {words_per_subheading:.1f}).",
    )
    if not density_ok:
        warnings.append(
            f"Low subheading density: {words_per_subheading:.1f} words per subheading (target <= {target_words_per_subheading})."
        )

    body_only = "\n".join(line for line in text.splitlines() if not line.strip().startswith("#"))
    paragraphs = [
        re.sub(r"\s+", " ", p).strip()
        for p in re.split(r"\n\s*\n", body_only)
        if p.strip()
    ]
    paragraph_lengths = [len(re.findall(r"\b\w+\b", p, flags=re.UNICODE)) for p in paragraphs]
    long_paragraphs = sum(1 for n in paragraph_lengths if n >= 180)
    very_short_paragraphs = sum(1 for n in paragraph_lengths if 0 < n <= 20)

    rhythm_ok = long_paragraphs <= max(2, len(paragraph_lengths) // 12)
    add_warn_check(
        checks,
        "layout_paragraph_rhythm",
        rhythm_ok,
        "Paragraph rhythm should avoid too many very long text blocks.",
    )
    if not rhythm_ok:
        warnings.append(
            f"Paragraph rhythm issue: {long_paragraphs} long paragraphs (>=180 words) across {len(paragraph_lengths)} paragraphs."
        )

    repetition_ok = all(
        hits <= phrase_limits.get(phrase, 2) + (1 if variation_mode == "fixed_classic" else 0)
        for phrase, hits in repeated_hits.items()
    )
    add_warn_check(
        checks,
        "voice_repetition_guard",
        repetition_ok,
        "Frequent AI-like scaffolding phrases should stay below threshold.",
    )

    severe_repetition = repeated_hits.get("in this chapter", 0) > max(4, chapter_heading_count)
    if severe_repetition:
        errors.append(
            f"Severe repetition: 'in this chapter' appears {repeated_hits.get('in this chapter', 0)} times for {chapter_heading_count} chapters."
        )

    status = "FAIL" if errors else ("WARN" if warnings else "PASS")
    return {
        "status": status,
        "errors": errors,
        "warnings": warnings,
        "checks": checks,
        "metrics": {
            "word_count": word_count,
            "chapter_heading_count": chapter_heading_count,
            "h2_count": h2_count,
            "h3_count": h3_count,
            "subheading_count": subheading_count,
            "words_per_subheading": round(words_per_subheading, 2),
            "paragraph_count": len(paragraph_lengths),
            "long_paragraph_count": long_paragraphs,
            "short_paragraph_count": very_short_paragraphs,
            "repeated_phrases": repeated_hits,
        },
        "manuscript_path": str(manuscript_path),
    }


def summarize_status(parts: list[str]) -> str:
    normalized = [p.upper() for p in parts if p]
    if any(p == "FAIL" for p in normalized):
        return "FAIL"
    if any(p == "WARN" for p in normalized):
        return "WARN"
    if normalized and all(p == "SKIP" for p in normalized):
        return "SKIP"
    if any(p == "PASS" for p in normalized):
        return "PASS"
    return "UNKNOWN"


def main() -> int:
    args = parse_args()
    export_dir = Path(args.export_dir).resolve()
    if not export_dir.is_dir():
        raise SystemExit(f"Export directory not found: {export_dir}")

    quality_target = str(args.quality_target or "kdp").strip().lower()
    book_profile = str(args.book_profile or "nonfiction_premium").strip().lower()
    variation_mode = str(args.variation_mode or "controlled").strip().lower()
    format_name = str(args.format or "all").strip().lower()
    omit_covers = bool(args.omit_covers)

    output_path = Path(args.output).resolve() if args.output else export_dir / "export_quality_report.json"
    manuscript_path = Path(args.manuscript).resolve() if args.manuscript else latest_file_by_suffix(export_dir, ".md")
    epub_path = latest_file_by_suffix(export_dir, ".epub")
    pdf_path = latest_file_by_suffix(export_dir, ".pdf")

    epub_expected = should_expect(format_name, "epub")
    pdf_expected = should_expect(format_name, "pdf")
    if format_name == "all":
        epub_expected = True
        pdf_expected = True

    if epub_path:
        epub_result = check_epub(epub_path, str(args.book_title or ""), quality_target, omit_covers=omit_covers)
    elif epub_expected:
        epub_result = {
            "status": "FAIL",
            "errors": ["Expected EPUB export file was not found in export directory."],
            "warnings": [],
            "checks": [],
        }
    else:
        epub_result = section_skip("EPUB was not requested for this build.")

    if pdf_expected:
        if manuscript_path and manuscript_path.is_file():
            pdf_opening_result = check_pdf_opening(manuscript_path)
            style_result = check_manuscript_style(manuscript_path, book_profile, variation_mode)
        else:
            pdf_opening_result = {
                "status": "FAIL",
                "errors": ["Expected manuscript markdown source was not found for PDF opening checks."],
                "warnings": [],
                "checks": [],
            }
            style_result = {
                "status": "SKIP",
                "errors": [],
                "warnings": ["Manuscript style checks skipped because manuscript source is missing."],
                "checks": [],
                "metrics": {},
            }
    else:
        pdf_opening_result = section_skip("PDF opening markdown check was not requested for this build.")
        style_result = {
            "status": "SKIP",
            "errors": [],
            "warnings": ["Manuscript style checks skipped because PDF/manuscript checks were not requested."],
            "checks": [],
            "metrics": {},
        }

    if pdf_expected:
        if pdf_path and pdf_path.is_file():
            pdf_file_result = {
                "status": "PASS",
                "errors": [],
                "warnings": [],
                "checks": [
                    {
                        "id": "pdf_export_file_present",
                        "status": "PASS",
                        "message": f"PDF export file exists: {pdf_path.name}",
                    }
                ],
            }
        else:
            pdf_file_result = {
                "status": "FAIL",
                "errors": ["Expected PDF export file was not found in export directory."],
                "warnings": [],
                "checks": [
                    {
                        "id": "pdf_export_file_present",
                        "status": "FAIL",
                        "message": "PDF export file must exist when format includes PDF.",
                    }
                ],
            }
    else:
        pdf_file_result = section_skip("PDF artifact check skipped because PDF was not requested.")

    if epub_path and epub_expected:
        validator_result = run_epub_validators(epub_path, quality_target)
    else:
        validator_result = section_skip("EPUB validators skipped because EPUB artifact is missing or not requested.")

    kdp_errors = [
        *list(epub_result.get("errors") or []),
        *list(pdf_opening_result.get("errors") or []),
        *list(pdf_file_result.get("errors") or []),
        *list(validator_result.get("errors") or []),
    ]
    kdp_warnings = [
        *list(epub_result.get("warnings") or []),
        *list(pdf_opening_result.get("warnings") or []),
        *list(pdf_file_result.get("warnings") or []),
        *list(validator_result.get("warnings") or []),
    ]

    kdp_compliance_status = "PASS" if not kdp_errors else "FAIL"
    voice_quality_status = summarize_status([style_result.get("status", "")])
    layout_quality_status = summarize_status([style_result.get("status", "")])

    errors = [*kdp_errors, *list(style_result.get("errors") or [])]
    warnings = [*kdp_warnings, *list(style_result.get("warnings") or [])]
    status = "PASS" if not errors else "FAIL"

    report: dict[str, Any] = {
        "status": status,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "export_dir": str(export_dir),
        "format": format_name,
        "quality_target": quality_target,
        "book_profile": book_profile,
        "variation_mode": variation_mode,
        "book_title": str(args.book_title or ""),
        "epub": epub_result,
        "pdf": {
            "status": summarize_status([pdf_opening_result.get("status", ""), pdf_file_result.get("status", "")]),
            "opening": pdf_opening_result,
            "artifact": pdf_file_result,
            "errors": [*list(pdf_opening_result.get("errors") or []), *list(pdf_file_result.get("errors") or [])],
            "warnings": [*list(pdf_opening_result.get("warnings") or []), *list(pdf_file_result.get("warnings") or [])],
            "checks": [*list(pdf_opening_result.get("checks") or []), *list(pdf_file_result.get("checks") or [])],
            "manuscript_path": str(manuscript_path) if manuscript_path else "",
            "pdf_path": str(pdf_path) if pdf_path else "",
        },
        "validators": validator_result,
        "kdp_compliance": {
            "status": kdp_compliance_status,
            "error_count": len(kdp_errors),
            "warning_count": len(kdp_warnings),
        },
        "voice_quality": {
            "status": voice_quality_status,
            "errors": list(style_result.get("errors") or []),
            "warnings": list(style_result.get("warnings") or []),
            "checks": list(style_result.get("checks") or []),
            "metrics": style_result.get("metrics") or {},
        },
        "layout_quality": {
            "status": layout_quality_status,
            "metrics": style_result.get("metrics") or {},
        },
        "errors": errors,
        "warnings": warnings,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Quality report written to: {output_path}")
    print(f"Quality status: {status}")
    return 0 if status == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
