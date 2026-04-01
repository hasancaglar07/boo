#!/usr/bin/env python3

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


FONT_CANDIDATES = {
    "title": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
    "regular": [
        "/usr/share/fonts/truetype/ubuntu/UbuntuSans[wdth,wght].ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/home/caglar/.local/share/micromamba/envs/book-generator/fonts/DejaVuSans.ttf",
    ],
    "bold": [
        "/usr/share/fonts/truetype/ubuntu/UbuntuSans[wdth,wght].ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/home/caglar/.local/share/micromamba/envs/book-generator/fonts/DejaVuSans.ttf",
    ],
    "mono": [
        "/usr/share/fonts/truetype/ubuntu/UbuntuSansMono[wght].ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ],
}


def first_existing(paths):
    for path in paths:
        if Path(path).exists():
            return path
    raise FileNotFoundError(f"Missing font candidates: {paths}")


FONT_TITLE = first_existing(FONT_CANDIDATES["title"])
FONT_REGULAR = first_existing(FONT_CANDIDATES["regular"])
FONT_BOLD = first_existing(FONT_CANDIDATES["bold"])
FONT_MONO = first_existing(FONT_CANDIDATES["mono"])
RESAMPLING = Image.Resampling if hasattr(Image, "Resampling") else Image

EAN13_PARITY = {
    "0": "LLLLLL",
    "1": "LLGLGG",
    "2": "LLGGLG",
    "3": "LLGGGL",
    "4": "LGLLGG",
    "5": "LGGLLG",
    "6": "LGGGLL",
    "7": "LGLGLG",
    "8": "LGLGGL",
    "9": "LGGLGL",
}
EAN13_L = {
    "0": "0001101",
    "1": "0011001",
    "2": "0010011",
    "3": "0111101",
    "4": "0100011",
    "5": "0110001",
    "6": "0101111",
    "7": "0111011",
    "8": "0110111",
    "9": "0001011",
}
EAN13_G = {
    "0": "0100111",
    "1": "0110011",
    "2": "0011011",
    "3": "0100001",
    "4": "0011101",
    "5": "0111001",
    "6": "0000101",
    "7": "0010001",
    "8": "0001001",
    "9": "0010111",
}
EAN13_R = {
    "0": "1110010",
    "1": "1100110",
    "2": "1101100",
    "3": "1000010",
    "4": "1011100",
    "5": "1001110",
    "6": "1010000",
    "7": "1000100",
    "8": "1001000",
    "9": "1110100",
}


def load_config(path: Path):
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_text(value, fallback=""):
    if value is None:
        return fallback
    value = str(value).strip()
    return value or fallback


def load_font(path, size):
    return ImageFont.truetype(path, size=size)


def mix_colors(left, right, ratio):
    ratio = max(0.0, min(1.0, ratio))
    return tuple(int(left[i] * (1.0 - ratio) + right[i] * ratio) for i in range(3))


def vertical_gradient(size, top_color, bottom_color):
    width, height = size
    gradient = Image.new("RGB", size, top_color)
    draw = ImageDraw.Draw(gradient)
    for y in range(height):
        ratio = y / max(1, height - 1)
        color = mix_colors(top_color, bottom_color, ratio)
        draw.line((0, y, width, y), fill=color)
    return gradient


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def derive_palette(image):
    sample = image.convert("RGB").resize((8, 8), RESAMPLING.BOX)
    pixels = [sample.getpixel((x, y)) for y in range(sample.height) for x in range(sample.width)]
    avg = tuple(int(sum(pixel[idx] for pixel in pixels) / len(pixels)) for idx in range(3))
    center = sample.getpixel((sample.width // 2, sample.height // 2))
    base = mix_colors(avg, (9, 18, 38), 0.76)
    accent = mix_colors(center, (120, 215, 255), 0.42)
    ink = mix_colors(base, (3, 7, 14), 0.55)
    return base, accent, ink


def abstract_source(image, size, crop_box=None, blur_radius=10):
    source = image.convert("RGB")
    if crop_box is not None:
        source = source.crop(crop_box)
    tiny_size = (
        max(12, size[0] // 28),
        max(16, size[1] // 28),
    )
    source = source.resize(tiny_size, RESAMPLING.BILINEAR)
    source = source.resize(size, RESAMPLING.BICUBIC)
    source = ImageEnhance.Color(source).enhance(1.25)
    source = ImageEnhance.Contrast(source).enhance(1.18)
    source = source.filter(ImageFilter.GaussianBlur(radius=blur_radius))
    return source


def add_alpha(image, alpha):
    rgba = image.convert("RGBA")
    rgba.putalpha(alpha)
    return rgba


def paste_rounded(base, image, xy, radius):
    panel = image.convert("RGBA")
    mask = rounded_mask(panel.size, radius)
    base.paste(panel, xy, mask)


def draw_centered_badge(base, text, center_x, top_y, fill, text_fill):
    if not normalize_text(text):
        return top_y

    draw = ImageDraw.Draw(base)
    font, lines = fit_text_block(draw, text, FONT_BOLD, 24, 13, int(base.width * 0.62), 28, max_lines=1)
    badge_width = int(max(draw.textbbox((0, 0), line, font=font)[2] for line in lines) + 40)
    badge_height = max(34, font.size + 18)
    x0 = int(center_x - badge_width / 2)
    y0 = top_y
    x1 = x0 + badge_width
    y1 = y0 + badge_height
    draw.rounded_rectangle((x0, y0, x1, y1), radius=badge_height // 2, fill=fill)
    draw_lines_centered(draw, lines, font, center_x, y0 + 7, text_fill, 2)
    return y1 + 18


def draw_author_pill(base, text, center_x, bottom_y, fill, text_fill):
    if not normalize_text(text):
        return

    draw = ImageDraw.Draw(base)
    font, lines = fit_text_block(draw, text, FONT_BOLD, 34, 18, int(base.width * 0.55), 30, max_lines=1)
    pill_width = int(max(draw.textbbox((0, 0), line, font=font)[2] for line in lines) + 40)
    pill_height = max(40, font.size + 18)
    x0 = int(center_x - pill_width / 2)
    y0 = bottom_y - pill_height
    x1 = x0 + pill_width
    y1 = bottom_y
    draw.rounded_rectangle((x0, y0, x1, y1), radius=pill_height // 2, fill=fill)
    draw_lines_centered(draw, lines, font, center_x, y0 + 7, text_fill, 2)


def draw_text_with_shadow(draw, position, text, font, fill, shadow_fill=(0, 0, 0, 110), offset=(0, 3)):
    x, y = position
    draw.text((x + offset[0], y + offset[1]), text, font=font, fill=shadow_fill)
    draw.text((x, y), text, font=font, fill=fill)


def barcode_seed(cfg):
    seed_text = " | ".join(
        normalize_text(cfg.get(key))
        for key in ("book_title", "book_subtitle", "author_name", "publisher_name", "publication_year")
    )
    seed_text = seed_text or "codefast-book"
    digest = hashlib.sha256(seed_text.encode("utf-8")).hexdigest()
    numeric = "".join(str(int(char, 16) % 10) for char in digest)
    return "978" + numeric[:9]


def ean13_checksum(digits12):
    total = 0
    for idx, char in enumerate(digits12):
        digit = int(char)
        total += digit if idx % 2 == 0 else digit * 3
    return str((10 - (total % 10)) % 10)


def ean13_digits(cfg):
    digits12 = barcode_seed(cfg)
    return digits12 + ean13_checksum(digits12)


def isbn_label(digits):
    return f"ISBN {digits[:3]}-{digits[3:4]}-{digits[4:8]}-{digits[8:12]}-{digits[12:]}"


def ean13_modules(digits):
    parity = EAN13_PARITY[digits[0]]
    left = "".join(
        (EAN13_L if parity[idx] == "L" else EAN13_G)[digits[idx + 1]]
        for idx in range(6)
    )
    right = "".join(EAN13_R[digit] for digit in digits[7:])
    return "101" + left + "01010" + right + "101"


def draw_barcode(base, box, cfg):
    digits = ean13_digits(cfg)
    modules = ean13_modules(digits)
    draw = ImageDraw.Draw(base)
    x0, y0, x1, y1 = box
    box_width = x1 - x0
    box_height = y1 - y0
    padding_x = 16
    padding_top = 12
    text_gap = 18
    module_width = max(1, (box_width - padding_x * 2) // 95)
    barcode_width = module_width * 95
    start_x = x0 + (box_width - barcode_width) // 2
    start_y = y0 + padding_top
    bar_bottom = y1 - 28
    normal_height = bar_bottom - start_y - 8
    guard_height = bar_bottom - start_y

    guard_indexes = set(range(0, 3)) | set(range(45, 50)) | set(range(92, 95))
    for index, module in enumerate(modules):
        if module != "1":
            continue
        left = start_x + index * module_width
        right = left + module_width - 1
        height = guard_height if index in guard_indexes else normal_height
        draw.rectangle((left, start_y, right, start_y + height), fill=(20, 20, 20))

    digits_font = load_font(FONT_MONO, 12)
    isbn_font = load_font(FONT_REGULAR, 11)
    digit_y = start_y + guard_height + 2
    draw.text((start_x - 9, digit_y), digits[0], font=digits_font, fill=(28, 32, 36))
    left_group_x = start_x + 4 * module_width
    for idx, digit in enumerate(digits[1:7]):
        draw.text((left_group_x + idx * 7 * module_width, digit_y), digit, font=digits_font, fill=(28, 32, 36))
    right_group_x = start_x + 50 * module_width
    for idx, digit in enumerate(digits[7:]):
        draw.text((right_group_x + idx * 7 * module_width, digit_y), digit, font=digits_font, fill=(28, 32, 36))

    label = isbn_label(digits)
    label_bbox = draw.textbbox((0, 0), label, font=isbn_font)
    label_x = x0 + (box_width - (label_bbox[2] - label_bbox[0])) / 2
    draw.text((label_x, y1 - 15), label, font=isbn_font, fill=(72, 76, 82))


def art_crop_box(width, height, cover_type):
    if cover_type == "front":
        return (
            int(width * 0.12),
            int(height * 0.18),
            int(width * 0.88),
            int(height * 0.82),
        )
    return (
        int(width * 0.08),
        int(height * 0.08),
        int(width * 0.92),
        int(height * 0.92),
    )


def wrap_to_pixels(draw, text, font, max_width):
    words = text.split()
    if not words:
        return []

    lines = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        bbox = draw.textbbox((0, 0), candidate, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def fit_text_block(draw, text, font_path, start_size, min_size, max_width, max_height, max_lines=None):
    text = normalize_text(text)
    if not text:
        return load_font(font_path, min_size), []

    for size in range(start_size, min_size - 1, -2):
        font = load_font(font_path, size)
        lines = wrap_to_pixels(draw, text, font, max_width)
        if max_lines and len(lines) > max_lines:
            continue
        line_height = draw.textbbox((0, 0), "Ag", font=font)[3]
        total_height = len(lines) * line_height + max(0, len(lines) - 1) * max(4, size // 6)
        if total_height <= max_height:
            return font, lines

    font = load_font(font_path, min_size)
    lines = wrap_to_pixels(draw, text, font, max_width)
    if max_lines and len(lines) > max_lines:
        lines = lines[:max_lines]
        last = lines[-1]
        while last and draw.textbbox((0, 0), f"{last}...", font=font)[2] > max_width:
            last = last[:-1].rstrip()
        lines[-1] = f"{last}..." if last else "..."
    return font, lines


def draw_lines_centered(draw, lines, font, x_center, y_start, fill, line_gap):
    y = y_start
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        width = bbox[2] - bbox[0]
        height = bbox[3] - bbox[1]
        draw.text((x_center - width / 2, y), line, font=font, fill=fill)
        y += height + line_gap
    return y


def draw_lines_left(draw, lines, font, x_start, y_start, fill, line_gap):
    y = y_start
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        height = bbox[3] - bbox[1]
        draw.text((x_start, y), line, font=font, fill=fill)
        y += height + line_gap
    return y


def derive_label_line(cfg):
    label_line = normalize_text(cfg.get("label_line"))
    if label_line:
        return label_line

    theme = normalize_text(cfg.get("theme_summary"))
    if theme:
        parts = [part.strip() for part in theme.split(",") if part.strip()]
        if 1 <= len(parts) <= 3:
            return " • ".join(parts)

    return ""


def compose_front(image, cfg):
    source = image.convert("RGB")
    width, height = source.size
    base_color, accent_color, ink_color = derive_palette(source)

    background = vertical_gradient(
        (width, height),
        mix_colors(base_color, (4, 8, 16), 0.18),
        mix_colors(ink_color, (1, 3, 8), 0.28),
    ).convert("RGBA")

    ambient = abstract_source(
        source,
        (width, height),
        art_crop_box(width, height, "front"),
        blur_radius=max(12, width // 38),
    )
    background.alpha_composite(add_alpha(ambient, 48))

    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    top_block = int(height * 0.36)
    footer_top = int(height * 0.85)
    draw.rectangle((0, 0, width, top_block), fill=(*mix_colors(base_color, (6, 11, 22), 0.35), 244))
    draw.rectangle((0, footer_top, width, height), fill=(*mix_colors(ink_color, (4, 7, 14), 0.14), 252))
    draw.ellipse(
        (int(width * 0.56), -int(height * 0.08), int(width * 1.12), int(height * 0.42)),
        fill=(*mix_colors(accent_color, (255, 255, 255), 0.08), 52),
    )
    draw.ellipse(
        (-int(width * 0.28), int(height * 0.48), int(width * 0.36), int(height * 1.08)),
        fill=(*mix_colors(accent_color, base_color, 0.3), 30),
    )
    draw.line((42, top_block - 2, width - 42, top_block - 2), fill=(*accent_color, 170), width=3)
    draw.line((42, footer_top + 2, width - 42, footer_top + 2), fill=(*accent_color, 110), width=2)

    panel_width = int(width * 0.82)
    panel_height = int(height * 0.34)
    panel_x = (width - panel_width) // 2
    panel_y = int(height * 0.43)
    shadow_box = (panel_x + 12, panel_y + 16, panel_x + panel_width + 12, panel_y + panel_height + 16)
    draw.rounded_rectangle(shadow_box, radius=34, fill=(0, 0, 0, 90))

    art_panel = abstract_source(
        source,
        (panel_width, panel_height),
        art_crop_box(width, height, "front"),
        blur_radius=max(5, width // 80),
    ).convert("RGBA")
    art_panel = ImageEnhance.Brightness(art_panel).enhance(0.94)
    panel_tint = vertical_gradient(
        (panel_width, panel_height),
        mix_colors(accent_color, (255, 255, 255), 0.14),
        mix_colors(base_color, (0, 0, 0), 0.38),
    ).convert("RGBA")
    panel_tint.putalpha(70)
    art_panel = Image.alpha_composite(art_panel, panel_tint)
    composed = Image.alpha_composite(background, overlay)
    paste_rounded(composed, art_panel, (panel_x, panel_y), 28)
    frame = ImageDraw.Draw(composed)
    frame.rounded_rectangle(
        (panel_x, panel_y, panel_x + panel_width, panel_y + panel_height),
        radius=28,
        outline=(*mix_colors(accent_color, (255, 255, 255), 0.32), 220),
        width=2,
    )
    frame.line(
        (panel_x + 26, panel_y + 26, panel_x + panel_width - 26, panel_y + 26),
        fill=(*mix_colors(accent_color, (255, 255, 255), 0.24), 110),
        width=2,
    )

    draw = ImageDraw.Draw(composed)

    title = normalize_text(cfg.get("book_title"), "Untitled Book")
    subtitle = normalize_text(cfg.get("book_subtitle"))
    author = normalize_text(cfg.get("author_name"), "Unknown Author")
    label_line = derive_label_line(cfg)

    y = 38
    if label_line:
        y = draw_centered_badge(
            composed,
            label_line,
            width / 2,
            y,
            fill=(*mix_colors(accent_color, (12, 18, 30), 0.24), 220),
            text_fill=(248, 251, 255, 255),
        )

    title_font, title_lines = fit_text_block(
        draw, title, FONT_TITLE, 92, 42, width - 96, int(height * 0.15), max_lines=3
    )
    subtitle_font, subtitle_lines = fit_text_block(
        draw, subtitle, FONT_REGULAR, 32, 17, width - 124, int(height * 0.085), max_lines=4
    )
    author_font, author_lines = fit_text_block(
        draw, author, FONT_BOLD, 32, 18, width - 180, int(height * 0.05), max_lines=1
    )

    y = draw_lines_centered(draw, title_lines, title_font, width / 2, y, "white", max(4, title_font.size // 7))
    if subtitle_lines:
        y += 8
        draw_lines_centered(
            draw,
            subtitle_lines,
            subtitle_font,
            width / 2,
            y,
            (232, 238, 248, 255),
            max(3, subtitle_font.size // 6),
        )

    author_text = " ".join(author_lines)
    if author_text:
        draw_author_pill(
            composed,
            author_text,
            width / 2,
            height - 28,
            fill=(*mix_colors(accent_color, (10, 16, 28), 0.2), 228),
            text_fill=(248, 251, 255, 255),
        )

    return composed.convert("RGB")


def fit_paragraphs(draw, paragraphs, start_size, min_size, width, height):
    paragraphs = [normalize_text(paragraph) for paragraph in paragraphs if normalize_text(paragraph)]
    for size in range(start_size, min_size - 1, -1):
        font = load_font(FONT_REGULAR, size)
        wrapped = [wrap_to_pixels(draw, paragraph, font, width) for paragraph in paragraphs]
        line_height = draw.textbbox((0, 0), "Ag", font=font)[3]
        total_lines = sum(len(lines) for lines in wrapped)
        total_height = total_lines * line_height + max(0, total_lines - 1) * 4 + max(0, len(wrapped) - 1) * 12
        if total_height <= height:
            return font, wrapped

    font = load_font(FONT_REGULAR, min_size)
    wrapped = [wrap_to_pixels(draw, paragraph, font, width) for paragraph in paragraphs]
    while True:
        line_height = draw.textbbox((0, 0), "Ag", font=font)[3]
        total_lines = sum(len(lines) for lines in wrapped)
        total_height = total_lines * line_height + max(0, total_lines - 1) * 4 + max(0, len(wrapped) - 1) * 12
        if total_height <= height or not wrapped:
            break
        last_block = wrapped[-1]
        if last_block:
            last_line = last_block[-1]
            while last_line and draw.textbbox((0, 0), f"{last_line}...", font=font)[2] > width:
                last_line = last_line[:-1].rstrip()
            last_block[-1] = f"{last_line}..." if last_line else "..."
            break
    return font, wrapped


def compose_back(image, cfg):
    source = image.convert("RGB")
    width, height = source.size
    base_color, accent_color, ink_color = derive_palette(source)

    background = vertical_gradient(
        (width, height),
        mix_colors(base_color, (8, 10, 18), 0.22),
        mix_colors(ink_color, (2, 4, 8), 0.14),
    ).convert("RGBA")

    ribbon_width = int(width * 0.16)
    ribbon = abstract_source(
        source,
        (ribbon_width, height),
        art_crop_box(width, height, "back"),
        blur_radius=max(12, width // 36),
    )
    ribbon_overlay = vertical_gradient(
        (ribbon_width, height),
        mix_colors(accent_color, (255, 255, 255), 0.2),
        mix_colors(ink_color, (0, 0, 0), 0.15),
    ).convert("RGBA")
    ribbon_overlay.putalpha(86)
    ribbon = Image.alpha_composite(ribbon.convert("RGBA"), ribbon_overlay)
    background.alpha_composite(add_alpha(ribbon, 220), dest=(width - ribbon_width, 0))
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(
        (-int(width * 0.25), -int(height * 0.1), int(width * 0.45), int(height * 0.28)),
        fill=(*mix_colors(accent_color, (255, 255, 255), 0.16), 36),
    )
    background.alpha_composite(glow)

    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    panel = (28, 22, width - ribbon_width - 24, height - 112)
    barcode_box = (width - 188, height - 158, width - 26, height - 24)
    draw.rectangle((0, height - 96, width, height), fill=(*mix_colors(ink_color, (12, 16, 24), 0.25), 255))
    draw.rounded_rectangle(
        panel,
        radius=20,
        fill=(252, 252, 252, 255),
        outline=(*mix_colors(accent_color, (210, 214, 220), 0.55), 255),
        width=2,
    )
    draw.rounded_rectangle(
        barcode_box,
        radius=10,
        fill=(255, 255, 255, 255),
        outline=(190, 194, 200, 255),
        width=2,
    )
    draw.line((panel[0] + 18, panel[1] + 54, panel[2] - 18, panel[1] + 54), fill=accent_color, width=3)

    composed = Image.alpha_composite(background, overlay)
    draw = ImageDraw.Draw(composed)

    blurb = normalize_text(
        cfg.get("back_cover_blurb"),
        normalize_text(
            cfg.get("theme_summary"),
            "Bu kapak, yapay zeka ile üretilen arka plan sanatını deterministik tipografi yerleşimiyle birleştirir.",
        ),
    )
    author_name = normalize_text(cfg.get("author_name"), "Unknown Author")
    author_bio = normalize_text(
        cfg.get("author_bio"),
        f"{author_name}, bu kitap için konu araştırması ve içerik çerçevesi oluşturan yazar/editördür.",
    )
    publisher = normalize_text(cfg.get("publisher_name"))
    year = normalize_text(cfg.get("publication_year"))

    heading_font = load_font(FONT_BOLD, 28)
    section_font = load_font(FONT_BOLD, 21)
    footer_font = load_font(FONT_REGULAR, 15)

    x = panel[0] + 14
    y = panel[1] + 10
    draw.text((x, y), "Kitap Hakkında", font=heading_font, fill=(18, 22, 30, 255))
    y += 46

    body_width = panel[2] - panel[0] - 28
    body_height = int(height * 0.31)
    body_font, body_blocks = fit_paragraphs(draw, [blurb], 21, 15, body_width, body_height)
    for lines in body_blocks:
        y = draw_lines_left(draw, lines, body_font, x, y, (44, 50, 60, 255), 4)
        y += 10

    draw.line((x, y + 4, panel[2] - 14, y + 4), fill=(*mix_colors(accent_color, (205, 209, 216), 0.45), 255), width=2)
    y += 18
    draw.text((x, y), "Yazar Hakkında", font=section_font, fill=(18, 22, 30, 255))
    y += 34
    bio_font, bio_blocks = fit_paragraphs(draw, [author_bio], 18, 14, body_width, int(height * 0.16))
    for lines in bio_blocks:
        y = draw_lines_left(draw, lines, bio_font, x, y, (52, 58, 66, 255), 4)
        y += 8

    footer_text = " • ".join(part for part in [publisher, year] if part)
    if footer_text:
        draw.text((x, height - 48), footer_text, font=footer_font, fill=(224, 229, 236, 255))

    draw_barcode(composed, barcode_box, cfg)

    return composed.convert("RGB")


def main():
    parser = argparse.ArgumentParser(description="Compose deterministic text onto AI-generated book cover art.")
    parser.add_argument("--config", required=True)
    parser.add_argument("--cover-type", choices=["front", "back"], required=True)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    config = load_config(Path(args.config))
    image = Image.open(args.input)

    if args.cover_type == "front":
        result = compose_front(image, config)
    else:
        result = compose_back(image, config)

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    result.save(args.output, quality=95)


if __name__ == "__main__":
    main()
