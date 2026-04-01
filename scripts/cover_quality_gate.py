#!/usr/bin/env python3

import argparse
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


RESAMPLING = Image.Resampling if hasattr(Image, "Resampling") else Image


def clamp(value, low, high):
    return max(low, min(high, value))


def frac_box(width, height, left, top, right, bottom):
    return (
        int(width * left),
        int(height * top),
        int(width * right),
        int(height * bottom),
    )


def region_activity(image, box, sample_width=84, sample_height=126):
    crop = image.crop(box).convert("L")
    crop = crop.resize((sample_width, sample_height), RESAMPLING.BILINEAR)
    pixels = crop.load()
    total = 0
    count = 0
    for y in range(sample_height - 1):
        for x in range(sample_width - 1):
            here = pixels[x, y]
            total += abs(here - pixels[x + 1, y]) + abs(here - pixels[x, y + 1])
            count += 2
    if count == 0:
        return 0.0
    return total / (count * 255.0)


def component_map(image, size=(132, 198)):
    gray = image.convert("L").resize(size, RESAMPLING.BILINEAR)
    blur = gray.filter(ImageFilter.GaussianBlur(radius=1.6))
    base = gray.load()
    smooth = blur.load()
    width, height = gray.size
    binary = [[0 for _ in range(width)] for _ in range(height)]
    for y in range(height):
        for x in range(width):
            pixel = base[x, y]
            diff = abs(pixel - smooth[x, y])
            if diff > 30 and (pixel < 108 or pixel > 152):
                binary[y][x] = 1
    return binary


def connected_components(binary):
    height = len(binary)
    width = len(binary[0]) if height else 0
    seen = [[False for _ in range(width)] for _ in range(height)]
    components = []

    for y in range(height):
        for x in range(width):
            if not binary[y][x] or seen[y][x]:
                continue
            queue = deque([(x, y)])
            seen[y][x] = True
            points = []
            min_x = max_x = x
            min_y = max_y = y
            while queue:
                px, py = queue.popleft()
                points.append((px, py))
                min_x = min(min_x, px)
                max_x = max(max_x, px)
                min_y = min(min_y, py)
                max_y = max(max_y, py)
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if 0 <= nx < width and 0 <= ny < height and binary[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        queue.append((nx, ny))

            area = len(points)
            box_width = max_x - min_x + 1
            box_height = max_y - min_y + 1
            density = area / max(1, box_width * box_height)
            center_x = (min_x + max_x) / 2 / max(1, width - 1)
            center_y = (min_y + max_y) / 2 / max(1, height - 1)
            touches_border = min_x == 0 or min_y == 0 or max_x == width - 1 or max_y == height - 1
            components.append(
                {
                    "area": area,
                    "width": box_width,
                    "height": box_height,
                    "density": density,
                    "center_x": center_x,
                    "center_y": center_y,
                    "touches_border": touches_border,
                }
            )
    return components


def classify_components(components):
    text_like = []
    monogram_like = []
    border_touch = []
    for comp in components:
        width = comp["width"]
        height = comp["height"]
        area = comp["area"]
        density = comp["density"]
        aspect = max(width, height) / max(1, min(width, height))

        if 8 <= area <= 240 and 3 <= height <= 16 and 5 <= width <= 42 and 0.14 <= density <= 0.92 and 1.20 <= aspect <= 6.5:
            text_like.append(comp)
        if 160 <= area <= 3200 and 12 <= width <= 96 and 12 <= height <= 96 and 0.06 <= density <= 0.82:
            monogram_like.append(comp)
        if comp["touches_border"] and area >= 80:
            border_touch.append(comp)

    return text_like, monogram_like, border_touch


def count_in_region(components, left, top, right, bottom):
    return sum(
        1
        for comp in components
        if left <= comp["center_x"] <= right and top <= comp["center_y"] <= bottom
    )


def front_score(metrics):
    score = 100.0
    score -= max(0.0, metrics["top_activity"] - 0.035) * 520
    score -= max(0.0, metrics["bottom_activity"] - 0.040) * 360
    score -= abs(metrics["center_activity"] - 0.110) * 160
    score -= max(0.0, metrics["left_edge_activity"] - 0.085) * 320
    score -= max(0.0, metrics["right_edge_activity"] - 0.085) * 250
    score -= min(metrics["top_text_like"] * 6 + metrics["center_text_like"] * 4, 34)
    score -= min(metrics["monogram_like"] * 16, 28)
    score -= min(metrics["border_touch_count"] * 10, 24)
    score += min(metrics["global_activity"] * 90, 12)
    score += min(metrics["center_activity"] * 180, 12)
    return clamp(score, 0.0, 100.0)


def back_score(metrics):
    score = 100.0
    score -= max(0.0, metrics["reading_activity"] - 0.060) * 700
    score -= max(0.0, metrics["barcode_activity"] - 0.030) * 900
    score -= min(metrics["reading_text_like"] * 5 + metrics["barcode_text_like"] * 8, 36)
    score -= min(metrics["monogram_like"] * 12, 24)
    score -= min(metrics["border_touch_count"] * 7, 18)
    if metrics["ribbon_activity"] < 0.018:
        score -= 6
    if metrics["ribbon_activity"] > 0.150:
        score -= 8
    score += min(metrics["global_activity"] * 28, 5)
    return clamp(score, 0.0, 100.0)


def front_warnings(metrics):
    warnings = []
    if metrics["top_activity"] > 0.070:
        warnings.append("ust metin bolgesi fazla hareketli")
    if metrics["bottom_activity"] > 0.070:
        warnings.append("alt yazar bolgesi fazla hareketli")
    if metrics["top_text_like"] > 0:
        warnings.append("ust bolgede metin benzeri artefaktlar var")
    if metrics["center_text_like"] > 2:
        warnings.append("merkezde metin ya da logo benzeri sekiller var")
    if metrics["monogram_like"] > 0:
        warnings.append("logo veya monogram benzeri buyuk sekil algilandi")
    if metrics["left_edge_activity"] > 0.14 or metrics["right_edge_activity"] > 0.14:
        warnings.append("kenarlarda mockup veya sert nesne izi olabilir")
    return warnings


def back_warnings(metrics):
    warnings = []
    if metrics["reading_activity"] > 0.075:
        warnings.append("arka kapak okuma alani fazla detayli")
    if metrics["barcode_activity"] > 0.040:
        warnings.append("barkod bolgesi fazla hareketli")
    if metrics["reading_text_like"] > 1:
        warnings.append("okuma alaninda metin benzeri artefaktlar var")
    if metrics["barcode_text_like"] > 0:
        warnings.append("barkod alaninda istenmeyen artefaktlar var")
    if metrics["monogram_like"] > 0:
        warnings.append("buyuk sembol ya da logo benzeri sekil algilandi")
    return warnings


def evaluate_front(image):
    width, height = image.size
    binary = component_map(image)
    components = connected_components(binary)
    text_like, monogram_like, border_touch = classify_components(components)

    metrics = {
        "global_activity": region_activity(image, (0, 0, width, height)),
        "top_activity": region_activity(image, frac_box(width, height, 0.0, 0.0, 1.0, 0.28)),
        "bottom_activity": region_activity(image, frac_box(width, height, 0.0, 0.82, 1.0, 1.0)),
        "center_activity": region_activity(image, frac_box(width, height, 0.15, 0.38, 0.85, 0.78)),
        "left_edge_activity": region_activity(image, frac_box(width, height, 0.0, 0.0, 0.12, 1.0)),
        "right_edge_activity": region_activity(image, frac_box(width, height, 0.88, 0.0, 1.0, 1.0)),
        "top_text_like": count_in_region(text_like, 0.0, 0.0, 1.0, 0.34),
        "center_text_like": count_in_region(text_like, 0.12, 0.26, 0.88, 0.82),
        "monogram_like": count_in_region(monogram_like, 0.10, 0.12, 0.90, 0.88),
        "border_touch_count": len(border_touch),
    }
    score = front_score(metrics)
    return score, metrics, front_warnings(metrics)


def evaluate_back(image):
    width, height = image.size
    binary = component_map(image)
    components = connected_components(binary)
    text_like, monogram_like, border_touch = classify_components(components)

    metrics = {
        "global_activity": region_activity(image, (0, 0, width, height)),
        "reading_activity": region_activity(image, frac_box(width, height, 0.06, 0.08, 0.78, 0.80)),
        "barcode_activity": region_activity(image, frac_box(width, height, 0.72, 0.82, 0.98, 0.98)),
        "ribbon_activity": region_activity(image, frac_box(width, height, 0.82, 0.0, 1.0, 1.0)),
        "reading_text_like": count_in_region(text_like, 0.0, 0.0, 0.80, 0.82),
        "barcode_text_like": count_in_region(text_like, 0.70, 0.76, 1.0, 1.0),
        "monogram_like": count_in_region(monogram_like, 0.0, 0.0, 1.0, 1.0),
        "border_touch_count": len(border_touch),
    }
    score = back_score(metrics)
    return score, metrics, back_warnings(metrics)


def main():
    parser = argparse.ArgumentParser(description="Score generated book-cover art for quality and text safety.")
    parser.add_argument("--cover-type", choices=["front", "back"], required=True)
    parser.add_argument("--input", required=True)
    parser.add_argument("--min-score", type=float, default=None)
    args = parser.parse_args()

    image = Image.open(args.input).convert("RGB")
    if args.cover_type == "front":
        score, metrics, warnings = evaluate_front(image)
        recommended_min = 72.0
    else:
        score, metrics, warnings = evaluate_back(image)
        recommended_min = 78.0

    min_score = args.min_score if args.min_score is not None else recommended_min
    result = {
        "cover_type": args.cover_type,
        "input": str(Path(args.input)),
        "score": round(score, 2),
        "min_score": min_score,
        "decision": "pass" if score >= min_score else "retry",
        "metrics": {key: round(value, 4) if isinstance(value, float) else value for key, value in metrics.items()},
        "warnings": warnings,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
