#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const vendorRoot = path.resolve(SCRIPT_DIR, "vendor/node_modules/@resvg/resvg-js/package.json");
const requireVendor = createRequire(vendorRoot);
const { Resvg } = requireVendor("@resvg/resvg-js");

const WIDTH = 1200;
const HEIGHT = 1800;
const FONT_FILES = [
  "/mnt/c/Windows/Fonts/georgia.ttf",
  "/mnt/c/Windows/Fonts/georgiab.ttf",
  "/mnt/c/Windows/Fonts/arial.ttf",
  "/mnt/c/Windows/Fonts/arialbd.ttf",
  "/mnt/c/Windows/Fonts/segoeui.ttf",
  "/mnt/c/Windows/Fonts/segoeuib.ttf",
  "/mnt/c/Windows/Fonts/tahoma.ttf",
  "/mnt/c/Windows/Fonts/tahomabd.ttf",
  "/mnt/c/Windows/Fonts/msgothic.ttc",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
].filter((candidate) => fs.existsSync(candidate));

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function safeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex) {
  const normalized = String(hex || "").replace("#", "").slice(0, 6);
  return {
    r: parseInt(normalized.slice(0, 2), 16) || 0,
    g: parseInt(normalized.slice(2, 4), 16) || 0,
    b: parseInt(normalized.slice(4, 6), 16) || 0,
  };
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function gradientColors(value) {
  const colors = String(value || "").match(/#[0-9a-fA-F]{6}/g) || [];
  return [...colors, "#0f172a", "#1e293b", "#caa15b"].slice(0, 3);
}

function fileDataUri(filePath) {
  const buffer = fs.readFileSync(filePath);
  let mime = "image/png";
  if (buffer.slice(0, 4).toString("utf8") === "<svg") {
    mime = "image/svg+xml";
  } else if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    mime = "image/jpeg";
  } else if (
    buffer.length > 12 &&
    buffer.slice(0, 4).toString("ascii") === "RIFF" &&
    buffer.slice(8, 12).toString("ascii") === "WEBP"
  ) {
    mime = "image/webp";
  } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    mime = "image/png";
  } else if (path.extname(filePath).toLowerCase() === ".svg") {
    mime = "image/svg+xml";
  }
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function isRtl(languageCode) {
  return languageCode === "Arabic";
}

function isCjk(languageCode) {
  return languageCode === "Japanese";
}

function coverVariantFamily(config) {
  return String(config.coverVariantFamily || "").trim().toLowerCase();
}

function deriveTemplateName(config) {
  const family = coverVariantFamily(config);
  const hint = String(config.coverTemplateHint || "").trim();
  if (hint) return hint;

  if (family === "operator") return "business-playbook";
  if (family === "authority") return "expertise-authority";
  if (family === "warm-guide") {
    const category = String(config.category || "").toLowerCase();
    if (category.includes("education")) return "education-workbook";
    if (category.includes("personal") || category.includes("kişisel")) return "personal-growth";
    return "narrative-story";
  }
  if (family === "commercial-bold" || family === "clean-signal") return "business-playbook";
  if (family === "executive-premium") return "executive-minimal";
  if (family === "authority-serif") return "expertise-authority";
  if (family === "method-ledger") return "business-playbook";
  if (family === "modern-mentor") return "executive-minimal";
  if (family === "signal-grid") return "business-playbook";
  if (family === "interface-depth") return "executive-minimal";
  if (family === "calm-tech") return "personal-growth";
  if (family === "workbook-clear") return "education-workbook";
  if (family === "instructor-premium") return "expertise-authority";
  if (family === "curious-learning") return "narrative-story";
  if (family === "calm-focus") return "personal-growth";
  if (family === "soft-discipline") return "executive-minimal";
  if (family === "elevated-reset") return "narrative-story";
  if (family === "midnight-platform") return "narrative-story";
  if (family === "ember-carriage") return "narrative-story";
  if (family === "echo-rail") return "narrative-story";
  if (family === "storyworld") return "children-storyworld";
  if (family === "learning-adventure") return "children-learning";
  if (family === "bedtime-calm") return "children-bedtime";

  const category = String(config.category || "").toLowerCase();
  const tone = String(config.toneArchetype || "").toLowerCase();
  if (tone.includes("story")) return "narrative-story";
  if (tone.includes("calm executive") || tone.includes("executive")) return "executive-minimal";
  if (category.includes("education")) return "education-workbook";
  if (category.includes("personal")) return "personal-growth";
  if (category.includes("expertise") || category.includes("uzman")) return "expertise-authority";
  return "business-playbook";
}

function deriveTitleTone(config, templateName) {
  if (config.titleTone) return String(config.titleTone);
  if (isCjk(config.languageCode)) return "cjk";
  if (isRtl(config.languageCode)) return "rtl";
  if (String(config.coverBranch || "").trim().toLowerCase() === "children") return "playful";
  const family = coverVariantFamily(config);
  if (family === "operator") return "sharp";
  if (family === "authority") return "classic";
  if (family === "warm-guide") return "classic";
  if (["commercial-bold", "clean-signal", "signal-grid", "interface-depth", "workbook-clear", "soft-discipline"].includes(family)) {
    return "sharp";
  }
  if (["storyworld", "learning-adventure", "bedtime-calm"].includes(family)) {
    return "playful";
  }
  if (["midnight-platform", "ember-carriage", "echo-rail"].includes(family)) {
    return "classic";
  }
  if (templateName === "business-playbook" || templateName === "executive-minimal") return "sharp";
  return "classic";
}

function titleFontFamily(languageCode, titleTone) {
  if (isCjk(languageCode) || titleTone === "cjk") {
    return "'MS Gothic', 'Segoe UI', Arial, sans-serif";
  }
  if (isRtl(languageCode) || titleTone === "rtl") {
    return "'Segoe UI', Tahoma, Arial, sans-serif";
  }
  if (titleTone === "playful") {
    return "'Trebuchet MS', 'Segoe UI', Arial, sans-serif";
  }
  if (titleTone === "sharp") {
    return "Arial, 'Segoe UI', sans-serif";
  }
  return "Georgia, 'Times New Roman', serif";
}

function bodyFontFamily(languageCode) {
  if (isCjk(languageCode)) return "'Segoe UI', 'MS Gothic', Arial, sans-serif";
  if (isRtl(languageCode)) return "'Segoe UI', Tahoma, Arial, sans-serif";
  return "Arial, 'Segoe UI', sans-serif";
}

function coverBodyFamily(config) {
  if (String(config.coverBranch || "").trim().toLowerCase() === "children") {
    return "'Trebuchet MS', 'Segoe UI', Arial, sans-serif";
  }
  return bodyFontFamily(config.languageCode);
}

function visiblePublisherLabel(config) {
  const publisher = String(config.publisher || "").trim();
  const normalized = publisher.toLowerCase();
  if (!publisher || ["book generator", "book creator", "studio press"].includes(normalized)) return "";
  return `${publisher}${config.year ? ` / ${config.year}` : ""}`;
}

function visibleAuthorName(config) {
  const author = String(config.author || "").trim();
  const normalized = author.toLowerCase();
  if (!author || ["book creator", "book generator", "studio author", "unknown author"].includes(normalized)) {
    return "";
  }
  return author;
}

function visibleAuthorBio(config) {
  const bio = String(config.authorBio || "").trim();
  if (!bio) return "";
  if (/^(book creator|book generator|studio author|unknown author)\b/iu.test(bio)) {
    return "";
  }
  return bio;
}

function isNarrativeFiction(config) {
  const branch = String(config.coverBranch || "").trim().toLowerCase();
  const genre = String(config.coverGenre || "").trim().toLowerCase();
  const templateHint = String(config.coverTemplateHint || "").trim().toLowerCase();
  return branch === "fiction" || genre === "narrative-fiction" || templateHint === "narrative-story";
}

function tokenize(text, languageCode) {
  const cleaned = String(text || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return [];
  if (isCjk(languageCode)) return Array.from(cleaned);
  return cleaned.split(" ");
}

function averageCharWidthFactor(languageCode, kind) {
  if (isCjk(languageCode)) return kind === "title" ? 1 : 0.9;
  if (isRtl(languageCode)) return kind === "title" ? 0.72 : 0.64;
  return kind === "title" ? 0.56 : 0.5;
}

function charWidthUnits(character, languageCode, kind = "body", tone = "classic") {
  if (!character) return 0;
  if (/\s/u.test(character)) return kind === "title" ? 0.34 : 0.3;
  if (isCjk(languageCode)) return kind === "title" ? 1 : 0.9;
  if (isRtl(languageCode)) return kind === "title" ? 0.76 : 0.66;
  if (/[-–—]/u.test(character)) return 0.42;
  if (/[.,:;'"`!?]/u.test(character)) return 0.26;
  if (/[(){}[\]\\/]/u.test(character)) return 0.34;
  if (/[MWQGODCBRNSÜÖÇĞŞ0-9@%&]/u.test(character)) return tone === "sharp" ? 0.8 : 0.88;
  if (/[A-ZİI]/u.test(character)) return tone === "sharp" ? 0.7 : 0.78;
  if (/[fijlrtı]/u.test(character)) return tone === "sharp" ? 0.34 : 0.38;
  if (/[a-zçğıöşü]/u.test(character)) return tone === "sharp" ? 0.5 : 0.56;
  return tone === "sharp" ? 0.54 : 0.6;
}

function estimateLineWidth(line, fontSize, languageCode, kind = "body", tone = "classic") {
  let units = 0;
  for (const character of Array.from(String(line || ""))) {
    units += charWidthUnits(character, languageCode, kind, tone);
  }
  return units * Math.max(fontSize, 1);
}

function widthThreshold(kind, tone) {
  if (kind !== "title") return 0.95;
  if (tone === "classic") return 0.89;
  if (tone === "rtl") return 0.9;
  if (tone === "cjk") return 0.92;
  return 0.91;
}

function wrapTextRaw(text, width, fontSize, languageCode, kind = "body") {
  const maxChars = Math.max(
    4,
    Math.floor(width / (Math.max(fontSize, 1) * averageCharWidthFactor(languageCode, kind))),
  );
  const parts = tokenize(text, languageCode);
  if (!parts.length) return [];

  const lines = [];
  let current = "";
  for (const part of parts) {
    const separator = current && !isCjk(languageCode) ? " " : "";
    const candidate = `${current}${separator}${part}`.trim();
    if (!current || candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = part;
  }
  if (current) lines.push(current);
  return lines;
}

function wrapText(text, width, fontSize, languageCode, maxLines, kind = "body") {
  const lines = wrapTextRaw(text, width, fontSize, languageCode, kind);
  if (lines.length <= maxLines) return lines;
  const clamped = lines.slice(0, maxLines);
  clamped[maxLines - 1] = `${clamped[maxLines - 1].replace(/[.,;:!?-]+$/u, "")}...`;
  return clamped;
}

function fitTextBlock(text, width, languageCode, options) {
  const tone = String(options.tone || "classic");
  let fontSize = options.maxSize;
  let rawLines = wrapTextRaw(text, width, fontSize, languageCode, options.kind);

  while (fontSize > options.minSize && rawLines.length > options.maxLines) {
    fontSize -= options.step;
    rawLines = wrapTextRaw(text, width, fontSize, languageCode, options.kind);
  }

  let longestWidth = Math.max(
    0,
    ...rawLines.map((line) => estimateLineWidth(line, fontSize, languageCode, options.kind, tone)),
  );
  while (fontSize > options.minSize && longestWidth > width * widthThreshold(options.kind, tone)) {
    fontSize -= options.step;
    rawLines = wrapTextRaw(text, width, fontSize, languageCode, options.kind);
    longestWidth = Math.max(
      0,
      ...rawLines.map((line) => estimateLineWidth(line, fontSize, languageCode, options.kind, tone)),
    );
  }

  const lines = rawLines.length > options.maxLines
    ? wrapText(text, width, fontSize, languageCode, options.maxLines, options.kind)
    : rawLines;

  return { fontSize, lines };
}

function templateConfig(templateName, preferredZone) {
  const base = {
    "business-playbook": {
      layout: "side-slab",
      panelOpacity: 0.76,
      panelFill: "#070b14",
      accentStyle: "bar",
      defaultZone: "top-left",
      badgeTone: "dark",
      titleMaxSize: 156,
      subtitleMaxSize: 26,
      titleMaxLines: 4,
      slabWidth: 720,
    },
    "education-workbook": {
      layout: "side-slab",
      panelOpacity: 0.72,
      panelFill: "#0c1220",
      accentStyle: "line",
      defaultZone: "top-left",
      badgeTone: "soft",
      titleMaxSize: 144,
      subtitleMaxSize: 24,
      titleMaxLines: 4,
      slabWidth: 700,
    },
    "expertise-authority": {
      layout: "side-slab",
      panelOpacity: 0.78,
      panelFill: "#090d16",
      accentStyle: "bar",
      defaultZone: "top-left",
      badgeTone: "dark",
      titleMaxSize: 164,
      subtitleMaxSize: 25,
      titleMaxLines: 4,
      slabWidth: 730,
    },
    "personal-growth": {
      layout: "bottom-band",
      panelOpacity: 0.72,
      panelFill: "#101521",
      accentStyle: "glow",
      defaultZone: "lower-right",
      badgeTone: "soft",
      titleMaxSize: 142,
      subtitleMaxSize: 28,
      titleMaxLines: 5,
      bandHeight: 760,
    },
    "executive-minimal": {
      layout: "center-stack",
      panelOpacity: 0.7,
      panelFill: "#070b14",
      accentStyle: "line",
      defaultZone: "center",
      badgeTone: "dark",
      titleMaxSize: 172,
      subtitleMaxSize: 26,
      titleMaxLines: 4,
    },
    "narrative-story": {
      layout: "bottom-band",
      panelOpacity: 0.74,
      panelFill: "#121212",
      accentStyle: "glow",
      defaultZone: "lower-left",
      badgeTone: "soft",
      titleMaxSize: 150,
      subtitleMaxSize: 27,
      titleMaxLines: 5,
      bandHeight: 820,
    },
    "hero-visual-led": {
      layout: "bottom-band",
      panelOpacity: 0.5,
      panelFill: "#0f1218",
      accentStyle: "glow",
      defaultZone: "lower-left",
      badgeTone: "soft",
      titleMaxSize: 104,
      subtitleMaxSize: 20,
      titleMaxLines: 4,
      bandHeight: 540,
    },
    "children-storyworld": {
      layout: "center-stack",
      panelOpacity: 0.48,
      panelFill: "#0d1d2f",
      accentStyle: "glow",
      defaultZone: "center",
      badgeTone: "soft",
      titleMaxSize: 148,
      subtitleMaxSize: 28,
      titleMaxLines: 4,
      bandHeight: 760,
    },
    "children-learning": {
      layout: "center-stack",
      panelOpacity: 0.52,
      panelFill: "#10243a",
      accentStyle: "line",
      defaultZone: "center",
      badgeTone: "soft",
      titleMaxSize: 150,
      subtitleMaxSize: 26,
      titleMaxLines: 4,
      bandHeight: 740,
    },
    "children-bedtime": {
      layout: "bottom-band",
      panelOpacity: 0.5,
      panelFill: "#101a31",
      accentStyle: "glow",
      defaultZone: "lower-left",
      badgeTone: "soft",
      titleMaxSize: 144,
      subtitleMaxSize: 28,
      titleMaxLines: 4,
      bandHeight: 900,
    },
  }[templateName] || {
    layout: "side-slab",
    panelOpacity: 0.7,
    panelFill: "#111827",
    accentStyle: "bar",
    defaultZone: "top-left",
    badgeTone: "dark",
    titleMaxSize: 150,
    subtitleMaxSize: 26,
    titleMaxLines: 4,
    slabWidth: 720,
  };

  const zone = preferredZone || base.defaultZone;
  const maps = {
    "top-left": { x: 78, y: 86, width: 612, height: 820, align: "start", textX: 132, footerAlign: "start" },
    "top-right": { x: 510, y: 86, width: 612, height: 820, align: "end", textX: 1068, footerAlign: "end" },
    "lower-left": { x: 78, y: 860, width: 620, height: 780, align: "start", textX: 132, footerAlign: "start" },
    "lower-right": { x: 502, y: 860, width: 620, height: 780, align: "end", textX: 1068, footerAlign: "end" },
    center: { x: 132, y: 930, width: 936, height: 720, align: "middle", textX: 600, footerAlign: "middle" },
  };

  return { ...base, name: templateName, zone, panel: maps[zone] || maps[base.defaultZone] };
}

function buildTspanLines(lines, x, startY, lineHeight, attrs = "") {
  return lines
    .map((line, index) => `<tspan x="${x}" y="${startY + index * lineHeight}" ${attrs}>${safeXml(line)}</tspan>`)
    .join("");
}

function accentMarkup(template, panel, accentColor) {
  if (template.accentStyle === "bar") {
    return `<rect x="${panel.align === "end" ? panel.x + panel.width - 16 : panel.x}" y="${panel.y}" width="16" height="${panel.height}" fill="${accentColor}" fill-opacity="0.92" />`;
  }
  if (template.accentStyle === "corner") {
    return `<path d="M${panel.x + panel.width - 132} ${panel.y}h132v132" fill="${rgba(accentColor, 0.78)}" />`;
  }
  if (template.accentStyle === "line") {
    return `<rect x="${panel.x + 42}" y="${panel.y + 42}" width="${panel.width - 84}" height="4" rx="2" fill="${accentColor}" fill-opacity="0.9" />`;
  }
  return `<circle cx="${panel.align === "end" ? panel.x + panel.width - 86 : panel.x + 86}" cy="${panel.y + 86}" r="52" fill="${rgba(accentColor, 0.26)}" />`;
}

function titlePanelSvg(config, template) {
  const { panel } = template;
  const panelPaddingX = 54;
  const panelPaddingTop = 62;
  const bodyFamily = coverBodyFamily(config);
  const titleTone = deriveTitleTone(config, deriveTemplateName(config));
  const titleFamily = titleFontFamily(config.languageCode, titleTone);
  const textWidth = panel.width - panelPaddingX * 2;
  const titleBlock = fitTextBlock(config.title, textWidth, config.languageCode, {
    maxSize: template.titleMaxSize,
    minSize: isCjk(config.languageCode) ? 64 : 58,
    step: 4,
    maxLines: template.titleMaxLines,
    kind: "title",
    tone: titleTone,
  });
  const subtitleSource = String(config.subtitle || "").trim();
  const subtitleBlock = fitTextBlock(subtitleSource, textWidth, config.languageCode, {
    maxSize: template.subtitleMaxSize,
    minSize: 20,
    step: 2,
    maxLines: template.name === "narrative-story" ? 4 : 3,
    kind: "subtitle",
  });
  const authorBlock = fitTextBlock(config.author, textWidth * 0.82, config.languageCode, {
    maxSize: 28,
    minSize: 20,
    step: 1,
    maxLines: 1,
    kind: "body",
  });
  const publisherBlock = fitTextBlock(config.publisher, textWidth * 0.76, config.languageCode, {
    maxSize: 18,
    minSize: 14,
    step: 1,
    maxLines: 1,
    kind: "body",
  });
  const align = panel.align === "end" ? "end" : panel.align === "middle" ? "middle" : "start";
  const titleStartY = panel.y + panelPaddingTop + 104;
  const footerY = panel.y + panel.height - 148;
  const titleLineHeight = titleBlock.fontSize * (isCjk(config.languageCode) ? 1.2 : 1.05);
  const subtitleStartY = titleStartY + titleBlock.lines.length * titleLineHeight + 40;
  const badgeFill = template.badgeTone === "soft" ? rgba(config.textAccent || "#fff8ef", 0.12) : rgba("#04070d", 0.24);
  const badgeStroke = rgba(config.textAccent || "#fff8ef", 0.24);
  const badgeText = rgba(config.textAccent || "#fff8ef", 0.9);
  const subtitleLineHeight = subtitleBlock.fontSize * (isCjk(config.languageCode) ? 1.35 : 1.28);
  const subtitleRoom = Math.max(0, footerY - 54 - subtitleStartY);
  const subtitleMaxLinesAvailable = Math.max(0, Math.floor(subtitleRoom / Math.max(subtitleLineHeight, 1)));
  const subtitleLines =
    subtitleMaxLinesAvailable <= 0
      ? []
      : subtitleBlock.lines.slice(0, subtitleMaxLinesAvailable).map((line, index, all) =>
          index === all.length - 1 && subtitleBlock.lines.length > all.length ? `${line.replace(/[.,;:!?-]+$/u, "")}...` : line,
        );
  const directionAttrs = isRtl(config.languageCode) ? 'direction="rtl" unicode-bidi="plaintext"' : "";
  const anchorX = panel.textX;
  const footerX =
    panel.footerAlign === "end" ? panel.x + panel.width - panelPaddingX : panel.footerAlign === "middle" ? panel.x + panel.width / 2 : panel.x + panelPaddingX;

  return `
    <g filter="url(#panel-shadow)">
      <rect x="${panel.x}" y="${panel.y}" width="${panel.width}" height="${panel.height}" rx="36" fill="${rgba(template.panelFill, template.panelOpacity)}" />
      <rect x="${panel.x + 10}" y="${panel.y + 10}" width="${panel.width - 20}" height="${panel.height - 20}" rx="28" fill="none" stroke="${rgba(config.textAccent || "#fff8ef", 0.18)}" />
    </g>
    ${accentMarkup(template, panel, config.accentColor || "#caa15b")}
    <g>
      <rect x="${panel.x + panelPaddingX}" y="${panel.y + 30}" width="${Math.min(panel.width - panelPaddingX * 2, 320)}" height="46" rx="23" fill="${badgeFill}" stroke="${badgeStroke}" />
      <text x="${panel.align === "end" ? panel.x + panel.width - panelPaddingX - 20 : panel.align === "middle" ? panel.x + panel.width / 2 : panel.x + panelPaddingX + 20}" y="${panel.y + 61}" fill="${badgeText}" font-family="${bodyFamily}" font-size="16" font-weight="700" letter-spacing="2.1" text-anchor="${align}" ${directionAttrs}>${safeXml(
        `${config.category} / ${config.languageLabel || config.languageCode}`,
      )}</text>
    </g>
    <text x="${anchorX}" y="${titleStartY}" fill="${config.textAccent || "#fff8ef"}" font-family="${titleFamily}" font-size="${titleBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>
      ${buildTspanLines(titleBlock.lines, anchorX, titleStartY, titleLineHeight, directionAttrs)}
    </text>
    ${
      subtitleLines.length
        ? `<text x="${anchorX}" y="${subtitleStartY}" fill="${rgba(config.textAccent || "#fff8ef", 0.9)}" font-family="${bodyFamily}" font-size="${subtitleBlock.fontSize}" font-weight="500" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(
            subtitleLines,
            anchorX,
            subtitleStartY,
            subtitleLineHeight,
            directionAttrs,
          )}</text>`
        : ""
    }
    <g>
      <text x="${footerX}" y="${footerY}" fill="${config.textAccent || "#fff8ef"}" font-family="${bodyFamily}" font-size="${authorBlock.fontSize}" font-weight="700" text-anchor="${panel.footerAlign === "middle" ? "middle" : panel.footerAlign === "end" ? "end" : "start"}" ${directionAttrs}>${safeXml(authorBlock.lines[0] || config.author)}</text>
      ${
        visiblePublisherLabel(config)
          ? `<text x="${footerX}" y="${footerY + 34}" fill="${rgba(config.textAccent || "#fff8ef", 0.74)}" font-family="${bodyFamily}" font-size="${publisherBlock.fontSize}" font-weight="600" text-anchor="${panel.footerAlign === "middle" ? "middle" : panel.footerAlign === "end" ? "end" : "start"}" letter-spacing="1.2" ${directionAttrs}>${safeXml(
              visiblePublisherLabel(config),
            )}</text>`
          : ""
      }
    </g>
    ${
      config.brandingMark
        ? `<g>
            <rect x="${panel.align === "end" ? panel.x + 36 : panel.x + panel.width - 132}" y="${panel.y + panel.height - 126}" width="96" height="96" rx="28" fill="${rgba("#06090f", 0.24)}" stroke="${rgba(config.textAccent || "#fff8ef", 0.16)}" />
            <text x="${panel.align === "end" ? panel.x + 84 : panel.x + panel.width - 84}" y="${panel.y + panel.height - 65}" fill="${config.textAccent || "#fff8ef"}" font-family="${titleFamily}" font-size="34" font-weight="700" text-anchor="middle">${safeXml(
              String(config.brandingMark).slice(0, 3).toUpperCase(),
            )}</text>
          </g>`
        : ""
    }
  `;
}

function frontTextAnchor(side, languageCode, alignMode = "side") {
  if (alignMode === "center") return "middle";
  if (isRtl(languageCode)) return side === "left" ? "start" : "end";
  return side === "right" ? "end" : "start";
}

function preferredSide(zone, languageCode) {
  if (zone === "top-right" || zone === "lower-right") return "right";
  if (zone === "top-left" || zone === "lower-left") return "left";
  return isRtl(languageCode) ? "right" : "left";
}

function categoryKicker(config) {
  const language = String(config.languageLabel || config.languageCode || "").trim();
  if (String(config.coverBranch || "").trim().toLowerCase() === "children") {
    return language ? `Illustrated / ${language}` : "Illustrated Story";
  }
  return `${config.category}${language ? ` / ${language}` : ""}`;
}

function coverHaystack(config) {
  return [
    config.title,
    config.subtitle,
    config.topic,
    config.summary,
    config.category,
    config.toneArchetype,
    config.coverPrompt,
    config.coverBrief,
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
}

function deriveCoverMotif(config) {
  if (config.coverMotif) return String(config.coverMotif);
  if (String(config.coverBranch || "").trim().toLowerCase() === "children") {
    const subtopic = String(config.coverSubtopic || "").toLowerCase();
    if (subtopic === "bedtime") return "bedtime-arc";
    if (subtopic === "learning") return "playful-arc";
    return "storybook-scene";
  }
  const haystack = coverHaystack(config);
  if (/(authority|expert|expertise|uzman|book|bestseller|method)/u.test(haystack)) return "folio";
  if (/(system|workflow|ai|prompt|productivity|signal|sistem|nizam)/u.test(haystack)) return "grid";
  if (/(focus|calm|discipline|clarte|ritme|quiet|ruhe|energy)/u.test(haystack)) return "horizon";
  if (/(education|teach|stem|learn|ensenar|formateur|egitim)/u.test(haystack)) return "orbit";
  if (/(leadership|remote|team|executive|fuhrung)/u.test(haystack)) return "pillars";
  return "beams";
}

function deriveFrameStyle(config, template) {
  if (config.frameStyle) return String(config.frameStyle);
  if (String(config.coverBranch || "").trim().toLowerCase() === "children") return "storybook-soft";
  const family = coverVariantFamily(config);
  if (family === "operator") return "brass-rail";
  if (family === "authority") return "double-line";
  if (family === "warm-guide") return template.layout === "bottom-band" ? "corner-bracket" : "double-line";
  if (template.layout === "center-stack") return "double-line";
  if (template.name === "expertise-authority" || template.name === "business-playbook") return "brass-rail";
  if (template.layout === "bottom-band") return "corner-bracket";
  return "double-line";
}

function motifOverlayMarkup(config) {
  const motif = deriveCoverMotif(config);
  const accent = config.accentColor || "#caa15b";
  const pale = rgba(config.textAccent || "#fff8ef", 0.12);
  const brass = rgba(accent, 0.18);

  if (motif === "grid") {
    return `
      <g opacity="0.9">
        <path d="M740 0V1800" stroke="${brass}" stroke-width="1.5" />
        <path d="M900 0V1800" stroke="${rgba(accent, 0.1)}" stroke-width="1" />
        <path d="M0 360H1200" stroke="${rgba(accent, 0.08)}" stroke-width="1" />
        <path d="M0 1040H1200" stroke="${rgba(accent, 0.08)}" stroke-width="1" />
        <path d="M770 180 L1130 180" stroke="${pale}" stroke-width="1.5" />
        <path d="M770 230 L1130 230" stroke="${brass}" stroke-width="1" />
      </g>
    `;
  }
  if (motif === "orbit") {
    return `
      <g opacity="0.95">
        <ellipse cx="930" cy="410" rx="300" ry="220" fill="none" stroke="${rgba(accent, 0.16)}" stroke-width="2" />
        <ellipse cx="930" cy="410" rx="230" ry="162" fill="none" stroke="${rgba(accent, 0.1)}" stroke-width="1.5" />
        <circle cx="1040" cy="286" r="14" fill="${rgba(accent, 0.38)}" />
        <circle cx="850" cy="540" r="10" fill="${rgba(config.textAccent || "#fff8ef", 0.22)}" />
      </g>
    `;
  }
  if (motif === "horizon") {
    return `
      <g opacity="0.9">
        <rect x="0" y="1220" width="1200" height="240" fill="${rgba("#06090f", 0.2)}" />
        <path d="M0 1280C220 1210 420 1210 640 1280C860 1350 1030 1350 1200 1290" stroke="${rgba(accent, 0.2)}" stroke-width="3" fill="none" />
        <path d="M0 1350C220 1305 420 1300 640 1365C860 1430 1030 1420 1200 1370" stroke="${rgba(config.textAccent || "#fff8ef", 0.08)}" stroke-width="2" fill="none" />
      </g>
    `;
  }
  if (motif === "pillars") {
    return `
      <g opacity="0.9">
        <rect x="840" y="180" width="88" height="1420" rx="20" fill="${rgba("#0d131d", 0.24)}" />
        <rect x="960" y="140" width="122" height="1480" rx="28" fill="${rgba(accent, 0.13)}" />
        <rect x="1110" y="260" width="40" height="1320" rx="20" fill="${rgba(config.textAccent || "#fff8ef", 0.08)}" />
      </g>
    `;
  }
  if (motif === "seal") {
    return `
      <g opacity="0.94">
        <circle cx="950" cy="360" r="170" fill="none" stroke="${rgba(accent, 0.16)}" stroke-width="3" />
        <circle cx="950" cy="360" r="124" fill="none" stroke="${rgba(config.textAccent || "#fff8ef", 0.1)}" stroke-width="2" />
        <path d="M820 1060L960 820L1120 1080L960 1320Z" fill="${rgba("#0f1218", 0.2)}" />
      </g>
    `;
  }
  if (motif === "interface") {
    return `
      <g opacity="0.94">
        <rect x="720" y="160" width="340" height="220" rx="30" fill="${rgba("#0c1220", 0.18)}" stroke="${rgba(accent, 0.16)}" />
        <rect x="760" y="220" width="260" height="24" rx="12" fill="${rgba(config.textAccent || "#fff8ef", 0.1)}" />
        <rect x="760" y="274" width="190" height="16" rx="8" fill="${rgba(accent, 0.16)}" />
        <rect x="760" y="330" width="230" height="360" rx="28" fill="${rgba("#0f1726", 0.16)}" />
        <path d="M760 760L1060 760" stroke="${rgba(accent, 0.14)}" stroke-width="2" />
      </g>
    `;
  }
  if (motif === "tactile-learning") {
    return `
      <g opacity="0.95">
        <circle cx="930" cy="430" r="170" fill="${rgba(accent, 0.08)}" />
        <rect x="770" y="260" width="260" height="170" rx="34" fill="${rgba("#fff7ef", 0.08)}" />
        <rect x="880" y="520" width="210" height="150" rx="30" fill="${rgba(accent, 0.14)}" />
        <circle cx="810" cy="610" r="22" fill="${rgba(config.textAccent || "#fff8ef", 0.18)}" />
      </g>
    `;
  }
  if (motif === "soft-geometry") {
    return `
      <g opacity="0.9">
        <ellipse cx="900" cy="420" rx="260" ry="190" fill="${rgba(accent, 0.1)}" />
        <rect x="700" y="820" width="300" height="520" rx="60" fill="${rgba("#0d121a", 0.18)}" />
        <rect x="840" y="980" width="150" height="380" rx="54" fill="${rgba(config.textAccent || "#fff8ef", 0.08)}" />
      </g>
    `;
  }
  if (motif === "atmospheric-light") {
    return `
      <g opacity="0.9">
        <circle cx="980" cy="300" r="240" fill="${rgba(accent, 0.14)}" />
        <ellipse cx="860" cy="1160" rx="420" ry="240" fill="${rgba("#fff6eb", 0.06)}" />
        <path d="M340 1320C520 1180 800 1160 1040 1280" stroke="${rgba(accent, 0.16)}" stroke-width="3" fill="none" />
      </g>
    `;
  }
  if (motif === "storybook-scene") {
    return `
      <g opacity="0.95">
        <circle cx="900" cy="320" r="170" fill="${rgba(accent, 0.16)}" />
        <path d="M140 1400C280 1210 520 1120 760 1180C950 1230 1090 1360 1160 1540H80C98 1498 116 1456 140 1400Z" fill="${rgba("#0f2337", 0.18)}" />
        <circle cx="420" cy="1320" r="84" fill="${rgba(config.textAccent || "#fff8ef", 0.12)}" />
        <circle cx="760" cy="1260" r="116" fill="${rgba(accent, 0.12)}" />
      </g>
    `;
  }
  if (motif === "playful-arc") {
    return `
      <g opacity="0.96">
        <path d="M240 420C440 180 820 180 1020 440" stroke="${rgba(accent, 0.26)}" stroke-width="20" stroke-linecap="round" fill="none" />
        <path d="M300 520C480 320 760 320 930 540" stroke="${rgba(config.textAccent || "#fff8ef", 0.18)}" stroke-width="14" stroke-linecap="round" fill="none" />
        <circle cx="360" cy="860" r="80" fill="${rgba(accent, 0.12)}" />
        <rect x="620" y="760" width="280" height="360" rx="64" fill="${rgba("#10253a", 0.16)}" />
      </g>
    `;
  }
  if (motif === "bedtime-arc") {
    return `
      <g opacity="0.94">
        <circle cx="920" cy="280" r="150" fill="${rgba(accent, 0.18)}" />
        <path d="M180 1320C320 1180 520 1120 700 1140C910 1165 1040 1270 1120 1440" stroke="${rgba(config.textAccent || "#fff8ef", 0.12)}" stroke-width="10" fill="none" />
        <ellipse cx="760" cy="1460" rx="420" ry="190" fill="${rgba("#0a1524", 0.2)}" />
      </g>
    `;
  }
  if (motif === "folio") {
    return `
      <g opacity="0.96">
        <path d="M540 0L1200 0L1200 760L910 1030L540 760Z" fill="${rgba("#0f1218", 0.24)}" />
        <path d="M0 980L550 520L920 840L360 1400Z" fill="${rgba(config.textAccent || "#fff8ef", 0.08)}" />
        <path d="M670 0L1200 0L1200 980L1120 1040L670 480Z" fill="${rgba(accent, 0.14)}" />
      </g>
    `;
  }
  return `
    <g opacity="0.9">
      <path d="M540 0L980 0L1200 380V1160L880 1420L540 960Z" fill="${rgba("#0d121a", 0.18)}" />
      <path d="M320 520L1200 1380" stroke="${rgba(accent, 0.16)}" stroke-width="2" />
      <path d="M210 720L1030 1540" stroke="${rgba(config.textAccent || "#fff8ef", 0.08)}" stroke-width="1.5" />
    </g>
  `;
}

function frameMarkup(config, template) {
  const frameStyle = deriveFrameStyle(config, template);
  const accent = config.accentColor || "#caa15b";
  const pale = config.textAccent || "#fff8ef";
  if (frameStyle === "storybook-soft") {
    return `
      <rect x="24" y="24" width="${WIDTH - 48}" height="${HEIGHT - 48}" rx="58" fill="none" stroke="${rgba(pale, 0.18)}" />
      <rect x="42" y="42" width="${WIDTH - 84}" height="${HEIGHT - 84}" rx="46" fill="none" stroke="${rgba(accent, 0.18)}" />
      <circle cx="110" cy="110" r="10" fill="${rgba(accent, 0.72)}" />
      <circle cx="${WIDTH - 110}" cy="110" r="10" fill="${rgba(accent, 0.72)}" />
      <circle cx="110" cy="${HEIGHT - 110}" r="10" fill="${rgba(accent, 0.72)}" />
      <circle cx="${WIDTH - 110}" cy="${HEIGHT - 110}" r="10" fill="${rgba(accent, 0.72)}" />
    `;
  }
  if (frameStyle === "play-panel") {
    return `
      <rect x="24" y="24" width="${WIDTH - 48}" height="${HEIGHT - 48}" rx="52" fill="none" stroke="${rgba(pale, 0.16)}" />
      <path d="M80 130H220M80 130V270" stroke="${rgba(accent, 0.86)}" stroke-width="8" stroke-linecap="round" />
      <path d="M1120 130H980M1120 130V270" stroke="${rgba(accent, 0.86)}" stroke-width="8" stroke-linecap="round" />
      <path d="M80 1670H220M80 1670V1530" stroke="${rgba(accent, 0.86)}" stroke-width="8" stroke-linecap="round" />
      <path d="M1120 1670H980M1120 1670V1530" stroke="${rgba(accent, 0.86)}" stroke-width="8" stroke-linecap="round" />
    `;
  }
  if (frameStyle === "brass-rail") {
    return `
      <rect x="20" y="20" width="${WIDTH - 40}" height="${HEIGHT - 40}" rx="48" fill="none" stroke="${rgba(pale, 0.14)}" />
      <rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" rx="40" fill="none" stroke="${rgba(accent, 0.12)}" />
      <rect x="12" y="52" width="10" height="${HEIGHT - 104}" rx="5" fill="${accent}" />
    `;
  }
  if (frameStyle === "corner-bracket") {
    return `
      <rect x="24" y="24" width="${WIDTH - 48}" height="${HEIGHT - 48}" rx="46" fill="none" stroke="${rgba(pale, 0.14)}" />
      <path d="M62 62H192M62 62V192" stroke="${rgba(accent, 0.9)}" stroke-width="6" stroke-linecap="round" />
      <path d="M1138 62H1008M1138 62V192" stroke="${rgba(accent, 0.9)}" stroke-width="6" stroke-linecap="round" />
      <path d="M62 1738H192M62 1738V1608" stroke="${rgba(accent, 0.9)}" stroke-width="6" stroke-linecap="round" />
      <path d="M1138 1738H1008M1138 1738V1608" stroke="${rgba(accent, 0.9)}" stroke-width="6" stroke-linecap="round" />
    `;
  }
  if (frameStyle === "soft-double") {
    return `
      <rect x="26" y="26" width="${WIDTH - 52}" height="${HEIGHT - 52}" rx="52" fill="none" stroke="${rgba(pale, 0.16)}" />
      <rect x="50" y="50" width="${WIDTH - 100}" height="${HEIGHT - 100}" rx="42" fill="none" stroke="${rgba(accent, 0.12)}" />
      <rect x="74" y="74" width="${WIDTH - 148}" height="${HEIGHT - 148}" rx="34" fill="none" stroke="${rgba(pale, 0.07)}" />
    `;
  }
  if (frameStyle === "glow-rail") {
    return `
      <rect x="22" y="22" width="${WIDTH - 44}" height="${HEIGHT - 44}" rx="48" fill="none" stroke="${rgba(pale, 0.14)}" />
      <rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" rx="40" fill="none" stroke="${rgba(accent, 0.12)}" />
      <rect x="12" y="52" width="10" height="${HEIGHT - 104}" rx="5" fill="${accent}" />
      <circle cx="${WIDTH - 160}" cy="140" r="120" fill="${rgba(accent, 0.14)}" />
    `;
  }
  return `
    <rect x="22" y="22" width="${WIDTH - 44}" height="${HEIGHT - 44}" rx="46" fill="none" stroke="${rgba(pale, 0.14)}" />
    <rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" rx="38" fill="none" stroke="${rgba(accent, 0.12)}" />
    <rect x="58" y="58" width="${WIDTH - 116}" height="${HEIGHT - 116}" rx="30" fill="none" stroke="${rgba(pale, 0.06)}" />
  `;
}

function renderSideSlabFront(config, template, logoUri) {
  const side = preferredSide(template.zone, config.languageCode);
  const titleTone = deriveTitleTone(config, deriveTemplateName(config));
  const titleFamily = titleFontFamily(config.languageCode, titleTone);
  const bodyFamily = coverBodyFamily(config);
  const slabWidth = clamp(template.slabWidth || 720, 640, 820);
  const x = side === "left" ? 0 : WIDTH - slabWidth;
  const padding = 84;
  const textWidth = slabWidth - padding * 2;
  const anchor = frontTextAnchor(side, config.languageCode);
  const textX = side === "left" ? x + padding : x + slabWidth - padding;
  const directionAttrs = isRtl(config.languageCode) ? 'direction="rtl" unicode-bidi="plaintext"' : "";
  const kicker = categoryKicker(config);
  const titleBlock = fitTextBlock(config.title, textWidth, config.languageCode, {
    maxSize: template.titleMaxSize,
    minSize: isCjk(config.languageCode) ? 74 : 60,
    step: 4,
    maxLines: template.titleMaxLines,
    kind: "title",
    tone: titleTone,
  });
  const subtitleBlock = fitTextBlock(String(config.subtitle || ""), textWidth, config.languageCode, {
    maxSize: template.subtitleMaxSize,
    minSize: 18,
    step: 2,
    maxLines: 3,
    kind: "subtitle",
  });
  const titleY = 256;
  const titleLineHeight = titleBlock.fontSize * (isCjk(config.languageCode) ? 1.16 : 1.02);
  const subtitleY = titleY + titleBlock.lines.length * titleLineHeight + 54;
  const subtitleLineHeight = subtitleBlock.fontSize * (isCjk(config.languageCode) ? 1.34 : 1.26);
  const maxSubtitleLines = Math.max(0, Math.floor((HEIGHT - 400 - subtitleY) / Math.max(subtitleLineHeight, 1)));
  const subtitleLines = subtitleBlock.lines.slice(0, Math.min(3, maxSubtitleLines));
  const footerY = HEIGHT - 206;
  const logoX = side === "left" ? WIDTH - 154 : 58;
  const accentX = side === "left" ? 32 : WIDTH - 44;
  const slabGradientId = side === "left" ? "side-slab-left" : "side-slab-right";
  const kickerText = safeXml(kicker);

  return `
    <defs>
      <linearGradient id="${slabGradientId}" x1="${side === "left" ? "0%" : "100%"}" y1="0%" x2="${side === "left" ? "100%" : "0%"}" y2="0%">
        <stop offset="0%" stop-color="${template.panelFill}" stop-opacity="${template.panelOpacity}" />
        <stop offset="70%" stop-color="${template.panelFill}" stop-opacity="${template.panelOpacity * 0.94}" />
        <stop offset="100%" stop-color="${template.panelFill}" stop-opacity="0.08" />
      </linearGradient>
    </defs>
    <rect x="${x}" y="0" width="${slabWidth}" height="${HEIGHT}" fill="url(#${slabGradientId})" />
    <rect x="${accentX}" y="32" width="12" height="${HEIGHT - 64}" rx="6" fill="${config.accentColor || "#caa15b"}" />
    <text x="${textX}" y="102" fill="${rgba(config.textAccent || "#fff8ef", 0.82)}" font-family="${bodyFamily}" font-size="18" font-weight="700" letter-spacing="2.2" text-anchor="${anchor}" ${directionAttrs}>${kickerText}</text>
    <text x="${textX}" y="${titleY}" fill="${config.textAccent || "#fff8ef"}" font-family="${titleFamily}" font-size="${titleBlock.fontSize}" font-weight="700" text-anchor="${anchor}" ${directionAttrs}>
      ${buildTspanLines(titleBlock.lines, textX, titleY, titleLineHeight, directionAttrs)}
    </text>
    ${
      subtitleLines.length
        ? `<text x="${textX}" y="${subtitleY}" fill="${rgba(config.textAccent || "#fff8ef", 0.92)}" font-family="${bodyFamily}" font-size="${subtitleBlock.fontSize}" font-weight="500" text-anchor="${anchor}" ${directionAttrs}>${buildTspanLines(
            subtitleLines,
            textX,
            subtitleY,
            subtitleLineHeight,
            directionAttrs,
          )}</text>`
        : ""
    }
    <rect x="${side === "left" ? x + padding : x + slabWidth - padding - 220}" y="${HEIGHT - 292}" width="220" height="2" fill="${rgba(config.accentColor || "#caa15b", 0.9)}" />
    <text x="${textX}" y="${footerY}" fill="${config.textAccent || "#fff8ef"}" font-family="${bodyFamily}" font-size="30" font-weight="700" text-anchor="${anchor}" ${directionAttrs}>${safeXml(
      config.author || "",
    )}</text>
    ${
      visiblePublisherLabel(config)
        ? `<text x="${textX}" y="${footerY + 36}" fill="${rgba(config.textAccent || "#fff8ef", 0.78)}" font-family="${bodyFamily}" font-size="17" font-weight="600" letter-spacing="1.1" text-anchor="${anchor}" ${directionAttrs}>${safeXml(
            visiblePublisherLabel(config),
          )}</text>`
        : ""
    }
    ${
      logoUri
        ? `<g transform="translate(${logoX} ${HEIGHT - 170})">
            <rect width="96" height="96" rx="22" fill="${rgba("#08111e", 0.24)}" stroke="${rgba(config.textAccent || "#fff8ef", 0.18)}" />
            <image href="${logoUri}" x="10" y="10" width="76" height="76" preserveAspectRatio="xMidYMid meet" />
          </g>`
        : ""
    }
  `;
}

function renderCenteredFront(config, template, logoUri) {
  const isHeroVisual = template.name === "hero-visual-led";
  const titleTone = deriveTitleTone(config, deriveTemplateName(config));
  const titleFamily = titleFontFamily(config.languageCode, titleTone);
  const bodyFamily = coverBodyFamily(config);
  const directionAttrs = isRtl(config.languageCode) ? 'direction="rtl" unicode-bidi="plaintext"' : "";
  const align = isRtl(config.languageCode) ? "end" : "middle";
  const textX = isRtl(config.languageCode) ? WIDTH - 120 : WIDTH / 2;
  const textWidth = isRtl(config.languageCode) ? WIDTH - 240 : 940;
  const titleBlock = fitTextBlock(config.title, textWidth, config.languageCode, {
    maxSize: template.titleMaxSize,
    minSize: isCjk(config.languageCode) ? 78 : 64,
    step: 4,
    maxLines: template.titleMaxLines,
    kind: "title",
    tone: titleTone,
  });
  const subtitleBlock = fitTextBlock(String(config.subtitle || ""), textWidth, config.languageCode, {
    maxSize: template.subtitleMaxSize,
    minSize: 18,
    step: 2,
    maxLines: 3,
    kind: "subtitle",
  });
  const bandHeight = clamp(template.bandHeight || 780, isHeroVisual ? 480 : 620, 920);
  const bandY = HEIGHT - bandHeight;
  const titleY = bandY + (isHeroVisual ? 148 : 176);
  const titleLineHeight = titleBlock.fontSize * (isCjk(config.languageCode) ? 1.16 : 1.03);
  const subtitleY = titleY + titleBlock.lines.length * titleLineHeight + 48;
  const subtitleLineHeight = subtitleBlock.fontSize * (isCjk(config.languageCode) ? 1.34 : 1.26);
  const authorY = HEIGHT - (isHeroVisual ? 148 : 172);
  const subtitleRoom = Math.max(0, authorY - 82 - subtitleY);
  const subtitleMaxLines = Math.max(0, Math.floor(subtitleRoom / Math.max(subtitleLineHeight, 1)));
  const subtitleLines =
    subtitleMaxLines <= 0
      ? []
      : subtitleBlock.lines.slice(0, Math.min(3, subtitleMaxLines)).map((line, index, all) =>
          index === all.length - 1 && subtitleBlock.lines.length > all.length ? `${line.replace(/[.,;:!?-]+$/u, "")}...` : line,
        );
  const kicker = categoryKicker(config);

  return `
    <defs>
      <linearGradient id="bottom-band" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${template.panelFill}" stop-opacity="0" />
        <stop offset="12%" stop-color="${template.panelFill}" stop-opacity="${template.panelOpacity * 0.22}" />
        <stop offset="100%" stop-color="${template.panelFill}" stop-opacity="${template.panelOpacity}" />
      </linearGradient>
    </defs>
    <rect x="0" y="${bandY - (isHeroVisual ? 90 : 120)}" width="${WIDTH}" height="${bandHeight + (isHeroVisual ? 90 : 120)}" fill="url(#bottom-band)" />
    <rect x="${isHeroVisual ? 76 : 60}" y="${bandY + (isHeroVisual ? 26 : 34)}" width="${WIDTH - (isHeroVisual ? 152 : 120)}" height="${HEIGHT - bandY - (isHeroVisual ? 74 : 94)}" rx="${isHeroVisual ? 28 : 32}" fill="${rgba(template.panelFill, template.panelOpacity * (isHeroVisual ? 0.84 : 0.92))}" />
    <text x="${textX}" y="${bandY + (isHeroVisual ? 72 : 88)}" fill="${rgba(config.textAccent || "#fff8ef", 0.82)}" font-family="${bodyFamily}" font-size="${isHeroVisual ? 16 : 18}" font-weight="700" letter-spacing="2.2" text-anchor="${align}" ${directionAttrs}>${safeXml(
      kicker,
    )}</text>
    <rect x="${isRtl(config.languageCode) ? WIDTH - 220 : 120}" y="${bandY + (isHeroVisual ? 96 : 118)}" width="${isHeroVisual ? 84 : 100}" height="10" rx="5" fill="${config.accentColor || "#caa15b"}" />
    <text x="${textX}" y="${titleY}" fill="${config.textAccent || "#fff8ef"}" font-family="${titleFamily}" font-size="${titleBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>
      ${buildTspanLines(titleBlock.lines, textX, titleY, titleLineHeight, directionAttrs)}
    </text>
    ${
      subtitleLines.length
        ? `<text x="${textX}" y="${subtitleY}" fill="${rgba(config.textAccent || "#fff8ef", 0.92)}" font-family="${bodyFamily}" font-size="${subtitleBlock.fontSize}" font-weight="500" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(
            subtitleLines,
            textX,
            subtitleY,
            subtitleLineHeight,
            directionAttrs,
          )}</text>`
        : ""
    }
    <text x="${textX}" y="${authorY}" fill="${config.textAccent || "#fff8ef"}" font-family="${bodyFamily}" font-size="${isHeroVisual ? 24 : 28}" font-weight="700" text-anchor="${align}" ${directionAttrs}>${safeXml(
      config.author || "",
    )}</text>
    ${
      visiblePublisherLabel(config)
        ? `<text x="${textX}" y="${authorY + 34}" fill="${rgba(config.textAccent || "#fff8ef", 0.78)}" font-family="${bodyFamily}" font-size="${isHeroVisual ? 15 : 17}" font-weight="600" letter-spacing="1.1" text-anchor="${align}" ${directionAttrs}>${safeXml(
            visiblePublisherLabel(config),
          )}</text>`
        : ""
    }
    ${
      logoUri
        ? `<g transform="translate(${WIDTH - 156} ${HEIGHT - 180})">
            <rect width="96" height="96" rx="22" fill="${rgba("#08111e", 0.24)}" stroke="${rgba(config.textAccent || "#fff8ef", 0.18)}" />
            <image href="${logoUri}" x="10" y="10" width="76" height="76" preserveAspectRatio="xMidYMid meet" />
          </g>`
        : ""
    }
  `;
}

function isBookstoreFlatMode(config) {
  return String(config.coverStyleMode || "").trim().toLowerCase() === "bookstore_flat";
}

function isBookstoreBoldMode(config) {
  return String(config.coverStyleMode || "").trim().toLowerCase() === "bookstore_bold";
}

function isBookstoreComposedMode(config) {
  return isBookstoreFlatMode(config) || isBookstoreBoldMode(config);
}

function normalizedCoverBranch(config) {
  return String(config.coverBranch || "").trim().toLowerCase();
}

function normalizedCoverGenre(config) {
  return String(config.coverGenre || "").trim().toLowerCase();
}

function flatInkColor(config) {
  const textAccent = String(config.textAccent || "").trim().toLowerCase();
  return textAccent.startsWith("#1") || textAccent.startsWith("#2") || textAccent.startsWith("#3")
    ? config.textAccent
    : "#171717";
}

function flatPalette(config) {
  const [gradA, gradB, gradC] = gradientColors(config.coverGradient);
  const branch = normalizedCoverBranch(config);
  const genre = normalizedCoverGenre(config);
  let paper = "#fff7ed";
  if (branch === "children") paper = "#fffaf0";
  else if (genre === "education") paper = "#fffdf5";
  else if (genre === "personal-development") paper = "#fffbf5";
  else if (genre === "ai-systems") paper = "#f7fbff";
  return {
    gradA,
    gradB,
    gradC,
    paper,
    accent: config.accentColor || gradC || "#d46b2c",
    ink: flatInkColor(config),
  };
}

function flatCoverProfile(config) {
  const branch = normalizedCoverBranch(config);
  const genre = normalizedCoverGenre(config);
  if (branch === "children") return { id: "children", align: "center", textWidth: 900 };
  if (branch === "fiction" || genre === "narrative-fiction") return { id: "narrative", align: "center", textWidth: 820 };
  if (genre === "education") return { id: "education", align: "edge", textWidth: 510 };
  if (genre === "ai-systems") return { id: "systems", align: "edge", textWidth: 520 };
  if (genre === "personal-development") return { id: "personal", align: "center", textWidth: 860 };
  if (genre === "expertise-authority") return { id: "authority", align: "center", textWidth: 860 };
  return { id: "business", align: "center", textWidth: 900 };
}

function renderBookstoreBoldFront(config, artUri) {
  const palette = flatPalette(config);
  const profile = flatCoverProfile(config);
  const isNarrative = profile.id === "narrative";
  const titleTone = deriveTitleTone(config, deriveTemplateName(config));
  const titleFamily = titleFontFamily(config.languageCode, titleTone);
  const bodyFamily = coverBodyFamily(config);
  const ink = flatInkColor(config);
  const accent = palette.accent;
  const paper = palette.paper;
  const authorName = visibleAuthorName(config);
  const directionAttrs = isRtl(config.languageCode) ? 'direction="rtl" unicode-bidi="plaintext"' : "";
  const edgeTextX = isRtl(config.languageCode) ? WIDTH - 112 : 112;
  const centeredTextX = isRtl(config.languageCode) ? WIDTH - 120 : WIDTH / 2;
  const textX = profile.id === "education" || profile.id === "systems" ? edgeTextX : centeredTextX;
  const align = profile.id === "education" || profile.id === "systems"
    ? (isRtl(config.languageCode) ? "end" : "start")
    : (isRtl(config.languageCode) ? "end" : "middle");
  const textWidth = profile.id === "education" || profile.id === "systems" ? 560 : profile.textWidth;
  const titleBlock = fitTextBlock(config.title, textWidth, config.languageCode, {
    maxSize: profile.id === "children" ? 128 : isNarrative ? 106 : 118,
    minSize: isNarrative ? 42 : 48,
    step: 4,
    maxLines: profile.id === "children" ? 4 : isNarrative ? 4 : 5,
    kind: "title",
    tone: titleTone,
  });
  const subtitleBlock = fitTextBlock(String(config.subtitle || ""), textWidth * (isNarrative ? 0.88 : 0.94), config.languageCode, {
    maxSize: isNarrative ? 22 : 24,
    minSize: 18,
    step: 2,
    maxLines: 3,
    kind: "subtitle",
  });
  const authorBlock = fitTextBlock(String(authorName || ""), Math.min(760, textWidth * (isNarrative ? 0.7 : 0.84)), config.languageCode, {
    maxSize: 30,
    minSize: 19,
    step: 1,
    maxLines: 1,
    kind: "body",
  });
  const kicker = isNarrative ? "" : categoryKicker(config);
  const titleY = profile.id === "children" ? 184 : isNarrative ? 244 : 198;
  const titleLineHeight = titleBlock.fontSize * 1.04;
  const subtitleY = titleY + titleBlock.lines.length * titleLineHeight + 42;
  const subtitleLineHeight = subtitleBlock.fontSize * 1.3;
  const subtitleLines = subtitleBlock.lines.slice(0, 3);
  const authorY = isNarrative ? HEIGHT - 116 : HEIGHT - 128;
  const titleBandHeight = profile.id === "children" ? 596 : isNarrative ? 700 : 632;

  let defs = "";
  let artMarkup = "";

  if (profile.id === "children") {
    defs = `
      <clipPath id="bold-front-art">
        <rect x="90" y="650" width="1020" height="910" rx="64" />
      </clipPath>`;
    artMarkup = `
      <circle cx="218" cy="742" r="64" fill="${rgba(accent, 0.16)}" />
      <circle cx="${WIDTH - 220}" cy="1500" r="78" fill="${rgba(palette.gradC, 0.16)}" />
      <rect x="90" y="650" width="1020" height="910" rx="64" fill="${rgba("#ffffff", 0.86)}" />
      <g clip-path="url(#bold-front-art)">
        <image href="${artUri}" x="90" y="650" width="1020" height="910" preserveAspectRatio="xMidYMid slice" />
      </g>`;
  } else if (profile.id === "education" || profile.id === "systems") {
    defs = `
      <clipPath id="bold-front-art">
        <rect x="654" y="734" width="382" height="620" rx="52" />
      </clipPath>`;
    artMarkup = `
      <rect x="626" y="704" width="438" height="676" rx="66" fill="${rgba("#ffffff", 0.24)}" />
      <rect x="654" y="734" width="382" height="620" rx="52" fill="${rgba("#ffffff", 0.94)}" stroke="${rgba(accent, 0.74)}" stroke-width="8" />
      <g clip-path="url(#bold-front-art)">
        <image href="${artUri}" x="654" y="734" width="382" height="620" preserveAspectRatio="xMidYMid slice" />
      </g>`;
  } else if (profile.id === "personal") {
    defs = `
      <clipPath id="bold-front-art">
        <path d="M274 1514V1016C274 844 418 708 600 708C782 708 926 844 926 1016V1514Z" />
      </clipPath>`;
    artMarkup = `
      <circle cx="184" cy="788" r="84" fill="${rgba(accent, 0.14)}" />
      <path d="M250 1540V1000C250 816 404 676 600 676C796 676 950 816 950 1000V1540Z" fill="${rgba("#ffffff", 0.3)}" />
      <path d="M274 1514V1016C274 844 418 708 600 708C782 708 926 844 926 1016V1514Z" fill="${rgba("#ffffff", 0.92)}" stroke="${rgba(accent, 0.7)}" stroke-width="8" />
      <g clip-path="url(#bold-front-art)">
        <image href="${artUri}" x="274" y="708" width="652" height="832" preserveAspectRatio="xMidYMid slice" />
      </g>`;
  } else if (profile.id === "authority") {
    defs = `
      <clipPath id="bold-front-art">
        <rect x="284" y="760" width="632" height="548" rx="42" />
      </clipPath>`;
    artMarkup = `
      <rect x="252" y="728" width="696" height="612" rx="58" fill="${rgba("#ffffff", 0.26)}" />
      <rect x="284" y="760" width="632" height="548" rx="42" fill="${rgba("#ffffff", 0.94)}" stroke="${rgba(accent, 0.74)}" stroke-width="8" />
      <g clip-path="url(#bold-front-art)">
        <image href="${artUri}" x="284" y="760" width="632" height="548" preserveAspectRatio="xMidYMid slice" />
      </g>`;
  } else if (isNarrative) {
    defs = `
      <clipPath id="bold-front-art">
        <circle cx="${WIDTH / 2}" cy="1062" r="248" />
      </clipPath>`;
    artMarkup = `
      <circle cx="${WIDTH / 2}" cy="1062" r="272" fill="${rgba("#ffffff", 0.24)}" />
      <circle cx="${WIDTH / 2}" cy="1062" r="248" fill="${rgba("#ffffff", 0.95)}" stroke="${rgba(accent, 0.62)}" stroke-width="8" />
      <g clip-path="url(#bold-front-art)">
        <image href="${artUri}" x="${WIDTH / 2 - 248}" y="814" width="496" height="496" preserveAspectRatio="xMidYMid slice" />
      </g>`;
  } else {
    defs = `
      <clipPath id="bold-front-art">
        <circle cx="${WIDTH / 2}" cy="1020" r="262" />
      </clipPath>`;
    artMarkup = `
      <circle cx="${WIDTH / 2}" cy="1020" r="286" fill="${rgba("#ffffff", 0.26)}" />
      <circle cx="${WIDTH / 2}" cy="1020" r="262" fill="${rgba("#ffffff", 0.94)}" stroke="${rgba(accent, 0.78)}" stroke-width="10" />
      <g clip-path="url(#bold-front-art)">
        <image href="${artUri}" x="${WIDTH / 2 - 262}" y="758" width="524" height="524" preserveAspectRatio="xMidYMid slice" />
      </g>`;
  }

  return `
    <defs>
      <linearGradient id="bold-front-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.gradA}" />
        <stop offset="55%" stop-color="${palette.gradB}" />
        <stop offset="100%" stop-color="${palette.gradC}" />
      </linearGradient>
      <linearGradient id="bold-front-band" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${rgba("#ffffff", 0.9)}" />
        <stop offset="100%" stop-color="${rgba(paper, 0.74)}" />
      </linearGradient>
${defs}
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bold-front-bg)" />
    <rect x="54" y="54" width="${WIDTH - 108}" height="${titleBandHeight}" rx="44" fill="url(#bold-front-band)" />
    <rect x="54" y="${titleBandHeight - 18}" width="${WIDTH - 108}" height="${HEIGHT - titleBandHeight - 36}" rx="54" fill="${rgba("#ffffff", 0.08)}" />
    ${artMarkup}
    ${
      kicker
        ? `<text x="${textX}" y="116" fill="${rgba(ink, 0.72)}" font-family="${bodyFamily}" font-size="17" font-weight="700" letter-spacing="1.8" text-anchor="${align}" ${directionAttrs}>${safeXml(kicker)}</text>`
        : ""
    }
    <text x="${textX}" y="${titleY}" fill="${ink}" font-family="${titleFamily}" font-size="${titleBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(titleBlock.lines, textX, titleY, titleLineHeight, directionAttrs)}</text>
    ${
      subtitleLines.length
        ? `<text x="${textX}" y="${subtitleY}" fill="${rgba(ink, 0.9)}" font-family="${bodyFamily}" font-size="${subtitleBlock.fontSize}" font-weight="600" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(
            subtitleLines,
            textX,
            subtitleY,
            subtitleLineHeight,
            directionAttrs,
          )}</text>`
        : ""
    }
    ${
      authorName
        ? `<text x="${WIDTH / 2}" y="${authorY}" fill="#ffffff" font-family="${bodyFamily}" font-size="${authorBlock.fontSize}" font-weight="700" text-anchor="middle" ${directionAttrs}>${safeXml(authorBlock.lines[0] || authorName)}</text>`
        : ""
    }
  `;
}

function renderBookstoreBoldBack(config, artUri) {
  const palette = flatPalette(config);
  const profile = flatCoverProfile(config);
  const isNarrative = profile.id === "narrative";
  const bodyFamily = coverBodyFamily(config);
  const titleFamily = titleFontFamily(config.languageCode, deriveTitleTone(config, deriveTemplateName(config)));
  const ink = flatInkColor(config);
  const accent = palette.accent;
  const paper = palette.paper;
  const authorName = visibleAuthorName(config);
  const kicker = isNarrative ? "" : categoryKicker(config);
  const directionAttrs = isRtl(config.languageCode) ? 'direction="rtl" unicode-bidi="plaintext"' : "";
  const anchor = isRtl(config.languageCode) ? "end" : "start";
  const x = isRtl(config.languageCode) ? 1020 : 118;
  const summary = fitTextBlock(config.summary || "", isNarrative ? 650 : 700, config.languageCode, {
    maxSize: 27,
    minSize: 18,
    step: 2,
    maxLines: 5,
    kind: "body",
  });
  const bio = fitTextBlock(config.authorBio || "", isNarrative ? 650 : 700, config.languageCode, {
    maxSize: 21,
    minSize: 17,
    step: 1,
    maxLines: 4,
    kind: "body",
  });
  const bioY = authorName ? 1080 : 1024;
  let defs = "";
  let motifMarkup = "";

  if (profile.id === "children") {
    defs = `
      <clipPath id="bold-back-mark">
        <rect x="664" y="1020" width="390" height="500" rx="46" />
      </clipPath>`;
    motifMarkup = `
      <rect x="632" y="988" width="454" height="564" rx="60" fill="${rgba("#ffffff", 0.2)}" />
      <rect x="664" y="1020" width="390" height="500" rx="46" fill="${rgba("#ffffff", 0.9)}" />
      <g clip-path="url(#bold-back-mark)">
        <image href="${artUri}" x="664" y="1020" width="390" height="500" preserveAspectRatio="xMidYMid slice" opacity="0.18" />
      </g>`;
  } else if (profile.id === "education" || profile.id === "systems") {
    defs = `
      <clipPath id="bold-back-mark">
        <rect x="770" y="990" width="262" height="382" rx="34" />
      </clipPath>`;
    motifMarkup = `
      <rect x="742" y="960" width="318" height="438" rx="46" fill="${rgba("#ffffff", 0.18)}" />
      <rect x="770" y="990" width="262" height="382" rx="34" fill="${rgba("#ffffff", 0.9)}" />
      <g clip-path="url(#bold-back-mark)">
        <image href="${artUri}" x="770" y="990" width="262" height="382" preserveAspectRatio="xMidYMid slice" opacity="0.16" />
      </g>`;
  } else if (profile.id === "personal") {
    defs = `
      <clipPath id="bold-back-mark">
        <path d="M736 1546V1288C736 1168 832 1082 954 1082C1076 1082 1172 1168 1172 1288V1546Z" />
      </clipPath>`;
    motifMarkup = `
      <path d="M736 1546V1288C736 1168 832 1082 954 1082C1076 1082 1172 1168 1172 1288V1546Z" fill="${rgba("#ffffff", 0.22)}" />
      <g clip-path="url(#bold-back-mark)">
        <image href="${artUri}" x="736" y="1082" width="436" height="464" preserveAspectRatio="xMidYMid slice" opacity="0.14" />
      </g>`;
  } else if (profile.id === "authority") {
    defs = `
      <clipPath id="bold-back-mark">
        <rect x="756" y="1088" width="274" height="274" rx="30" />
      </clipPath>`;
    motifMarkup = `
      <rect x="728" y="1060" width="330" height="330" rx="42" fill="${rgba("#ffffff", 0.2)}" />
      <rect x="756" y="1088" width="274" height="274" rx="30" fill="${rgba("#ffffff", 0.9)}" />
      <g clip-path="url(#bold-back-mark)">
        <image href="${artUri}" x="756" y="1088" width="274" height="274" preserveAspectRatio="xMidYMid slice" opacity="0.16" />
      </g>`;
  } else {
    defs = `
      <clipPath id="bold-back-mark">
        <circle cx="920" cy="1270" r="170" />
      </clipPath>`;
    motifMarkup = `
      <circle cx="920" cy="1270" r="192" fill="${rgba("#ffffff", 0.2)}" />
      <circle cx="920" cy="1270" r="170" fill="${rgba("#ffffff", 0.9)}" />
      <g clip-path="url(#bold-back-mark)">
        <image href="${artUri}" x="750" y="1100" width="340" height="340" preserveAspectRatio="xMidYMid slice" opacity="0.16" />
      </g>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">
  <defs>
    <linearGradient id="bold-back-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.gradA}" />
      <stop offset="58%" stop-color="${palette.gradB}" />
      <stop offset="100%" stop-color="${palette.gradC}" />
    </linearGradient>
    <linearGradient id="bold-back-band" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${rgba("#ffffff", 0.88)}" />
      <stop offset="100%" stop-color="${rgba(paper, 0.72)}" />
    </linearGradient>
${defs}
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bold-back-bg)" />
  <rect x="54" y="54" width="${WIDTH - 108}" height="1120" rx="44" fill="url(#bold-back-band)" />
  <rect x="54" y="1144" width="${WIDTH - 108}" height="${HEIGHT - 1198}" rx="52" fill="${rgba("#ffffff", 0.08)}" />
  ${motifMarkup}
  ${
    kicker
      ? `<text x="${x}" y="146" fill="${rgba(ink, 0.74)}" font-family="${bodyFamily}" font-size="18" font-weight="700" letter-spacing="1.8" text-anchor="${anchor}" ${directionAttrs}>${safeXml(kicker)}</text>`
      : ""
  }
  <text x="${x}" y="232" fill="${ink}" font-family="${titleFamily}" font-size="42" font-weight="700" text-anchor="${anchor}" ${directionAttrs}>${safeXml(config.title)}</text>
  <text x="${x}" y="330" fill="${rgba(ink, 0.9)}" font-family="${bodyFamily}" font-size="${summary.fontSize}" font-weight="500" text-anchor="${anchor}" ${directionAttrs}>${buildTspanLines(summary.lines, x, 330, summary.fontSize * 1.42, directionAttrs)}</text>
  <rect x="110" y="940" width="${WIDTH - 220}" height="2" fill="${rgba(accent, 0.56)}" />
  ${
    authorName
      ? `<text x="${x}" y="1024" fill="${ink}" font-family="${bodyFamily}" font-size="22" font-weight="700" text-anchor="${anchor}" ${directionAttrs}>${safeXml(authorName)}</text>`
      : ""
  }
  ${
    bio.lines.length
      ? `<text x="${x}" y="${bioY}" fill="${rgba(ink, 0.84)}" font-family="${bodyFamily}" font-size="${bio.fontSize}" font-weight="500" text-anchor="${anchor}" ${directionAttrs}>${buildTspanLines(
          bio.lines,
          x,
          bioY,
          bio.fontSize * 1.45,
          directionAttrs,
        )}</text>`
      : ""
  }
</svg>`;
}

function renderBookstoreFlatFront(config, artUri) {
  const palette = flatPalette(config);
  const profile = flatCoverProfile(config);
  const isChildren = profile.id === "children";
  const titleTone = deriveTitleTone(config, deriveTemplateName(config));
  const titleFamily = titleFontFamily(config.languageCode, titleTone);
  const bodyFamily = coverBodyFamily(config);
  const ink = palette.ink;
  const accent = palette.accent;
  const paper = palette.paper;
  const edgeTextX = isRtl(config.languageCode) ? WIDTH - 118 : 118;
  const centeredTextX = isRtl(config.languageCode) ? WIDTH - 120 : WIDTH / 2;
  const textX = profile.align === "edge" ? edgeTextX : centeredTextX;
  const align = profile.align === "edge" ? (isRtl(config.languageCode) ? "end" : "start") : (isRtl(config.languageCode) ? "end" : "middle");
  const directionAttrs = isRtl(config.languageCode) ? 'direction="rtl" unicode-bidi="plaintext"' : "";
  const textWidth = isRtl(config.languageCode) ? WIDTH - 220 : profile.textWidth;
  const titleBlock = fitTextBlock(config.title, textWidth, config.languageCode, {
    maxSize: isChildren ? 132 : profile.id === "authority" ? 124 : profile.id === "personal" ? 120 : 118,
    minSize: isChildren ? 58 : 48,
    step: 4,
    maxLines: isChildren ? 4 : profile.id === "education" || profile.id === "systems" ? 4 : 5,
    kind: "title",
    tone: titleTone,
  });
  const subtitleBlock = fitTextBlock(String(config.subtitle || ""), textWidth * 0.92, config.languageCode, {
    maxSize: isChildren ? 28 : profile.id === "authority" ? 25 : 24,
    minSize: 18,
    step: 2,
    maxLines: 3,
    kind: "subtitle",
  });
  const authorBlock = fitTextBlock(String(config.author || ""), textWidth * 0.66, config.languageCode, {
    maxSize: 30,
    minSize: 18,
    step: 1,
    maxLines: 1,
    kind: "body",
  });
  const kicker = categoryKicker(config);
  const titleY = isChildren ? 170 : profile.id === "business" ? 224 : profile.id === "authority" ? 212 : profile.id === "personal" ? 170 : 216;
  const titleLineHeight = titleBlock.fontSize * (isChildren ? 1.06 : 1.03);
  const subtitleY = titleY + titleBlock.lines.length * titleLineHeight + 48;
  const subtitleLineHeight = subtitleBlock.fontSize * 1.3;
  const subtitleLines = subtitleBlock.lines.slice(0, 3);
  const authorY = isChildren ? HEIGHT - 142 : profile.id === "education" || profile.id === "systems" ? HEIGHT - 174 : HEIGHT - 152;

  if (isChildren) {
    return `
      <defs>
        <clipPath id="flat-kids-art">
          <rect x="118" y="520" width="964" height="860" rx="60" />
        </clipPath>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="${paper}" />
      <rect x="0" y="0" width="${WIDTH}" height="430" fill="${paper}" />
      <path d="M120 1450C280 1290 500 1210 700 1230C900 1250 1040 1360 1080 1500" stroke="${rgba(accent, 0.26)}" stroke-width="18" fill="none" stroke-linecap="round" />
      <circle cx="248" cy="824" r="54" fill="${rgba("#ec4b2f", 0.95)}" />
      <circle cx="948" cy="706" r="60" fill="${rgba("#3c8fc9", 0.95)}" />
      <path d="M834 1160L930 988L1022 1160Z" fill="${rgba("#1a9b6f", 0.92)}" />
      <rect x="118" y="520" width="964" height="860" rx="60" fill="${rgba("#ffffff", 0.74)}" />
      <g clip-path="url(#flat-kids-art)">
        <image href="${artUri}" x="118" y="520" width="964" height="860" preserveAspectRatio="xMidYMid slice" />
      </g>
      <text x="${textX}" y="88" fill="${rgba(ink, 0.74)}" font-family="${bodyFamily}" font-size="18" font-weight="700" letter-spacing="1.8" text-anchor="${align}" ${directionAttrs}>${safeXml(kicker)}</text>
      <text x="${textX}" y="${titleY}" fill="${ink}" font-family="${titleFamily}" font-size="${titleBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(titleBlock.lines, textX, titleY, titleLineHeight, directionAttrs)}</text>
      ${
        subtitleLines.length
          ? `<text x="${textX}" y="${subtitleY}" fill="${rgba(ink, 0.88)}" font-family="${bodyFamily}" font-size="${subtitleBlock.fontSize}" font-weight="600" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(
              subtitleLines,
              textX,
              subtitleY,
              subtitleLineHeight,
              directionAttrs,
            )}</text>`
          : ""
      }
      <text x="${textX}" y="${authorY}" fill="${ink}" font-family="${bodyFamily}" font-size="${authorBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>${safeXml(authorBlock.lines[0] || config.author || "")}</text>
    `;
  }

  if (profile.id === "education") {
    return `
      <defs>
        <linearGradient id="flat-education-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${paper}" />
          <stop offset="74%" stop-color="${palette.gradA}" />
          <stop offset="100%" stop-color="${palette.gradB}" />
        </linearGradient>
        <clipPath id="flat-education-art">
          <rect x="646" y="278" width="414" height="690" rx="54" />
        </clipPath>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#flat-education-bg)" />
      <rect x="0" y="0" width="120" height="${HEIGHT}" fill="${rgba(accent, 0.94)}" />
      <rect x="598" y="224" width="512" height="806" rx="70" fill="${rgba("#ffffff", 0.74)}" />
      <rect x="646" y="278" width="414" height="690" rx="54" fill="${rgba("#ffffff", 0.96)}" stroke="${rgba(accent, 0.72)}" stroke-width="8" />
      <path d="M646 368H1060M646 486H1060M646 604H1060M646 722H1060M646 840H1060" stroke="${rgba(accent, 0.16)}" stroke-width="2" />
      <path d="M760 278V968M878 278V968M996 278V968" stroke="${rgba(ink, 0.08)}" stroke-width="2" />
      <g clip-path="url(#flat-education-art)">
        <image href="${artUri}" x="646" y="278" width="414" height="690" preserveAspectRatio="xMidYMid slice" />
      </g>
      <rect x="118" y="116" width="124" height="14" rx="7" fill="${ink}" />
      <text x="${textX}" y="92" fill="${rgba(ink, 0.68)}" font-family="${bodyFamily}" font-size="17" font-weight="700" letter-spacing="1.8" text-anchor="${align}" ${directionAttrs}>${safeXml(kicker)}</text>
      <text x="${textX}" y="${titleY}" fill="${ink}" font-family="${titleFamily}" font-size="${titleBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(titleBlock.lines, textX, titleY, titleLineHeight, directionAttrs)}</text>
      ${
        subtitleLines.length
          ? `<text x="${textX}" y="${subtitleY}" fill="${rgba(ink, 0.86)}" font-family="${bodyFamily}" font-size="${subtitleBlock.fontSize}" font-weight="600" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(
              subtitleLines,
              textX,
              subtitleY,
              subtitleLineHeight,
              directionAttrs,
            )}</text>`
          : ""
      }
      <rect x="118" y="${HEIGHT - 228}" width="150" height="12" rx="6" fill="${rgba(accent, 0.88)}" />
      <text x="${textX}" y="${authorY}" fill="${ink}" font-family="${bodyFamily}" font-size="${authorBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>${safeXml(authorBlock.lines[0] || config.author || "")}</text>
    `;
  }

  if (profile.id === "systems") {
    return `
      <defs>
        <linearGradient id="flat-systems-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${paper}" />
          <stop offset="66%" stop-color="${palette.gradA}" />
          <stop offset="100%" stop-color="${palette.gradB}" />
        </linearGradient>
        <clipPath id="flat-systems-art">
          <rect x="662" y="292" width="392" height="612" rx="46" />
        </clipPath>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#flat-systems-bg)" />
      <circle cx="980" cy="146" r="106" fill="${rgba(accent, 0.16)}" />
      <rect x="642" y="262" width="428" height="648" rx="58" fill="${rgba("#ffffff", 0.82)}" />
      <rect x="662" y="292" width="392" height="612" rx="46" fill="${rgba("#ffffff", 0.96)}" stroke="${rgba(accent, 0.76)}" stroke-width="8" />
      <g clip-path="url(#flat-systems-art)">
        <image href="${artUri}" x="662" y="292" width="392" height="612" preserveAspectRatio="xMidYMid slice" />
      </g>
      <path d="M118 110H278M118 152H338M118 194H258" stroke="${rgba(accent, 0.9)}" stroke-width="10" stroke-linecap="round" />
      <path d="M642 994H1070M642 1070H1070M642 1146H1070" stroke="${rgba(accent, 0.18)}" stroke-width="2" />
      <path d="M760 994V1184M880 994V1184M1000 994V1184" stroke="${rgba(ink, 0.08)}" stroke-width="2" />
      <text x="${textX}" y="92" fill="${rgba(ink, 0.7)}" font-family="${bodyFamily}" font-size="17" font-weight="700" letter-spacing="1.8" text-anchor="${align}" ${directionAttrs}>${safeXml(kicker)}</text>
      <text x="${textX}" y="${titleY}" fill="${ink}" font-family="${titleFamily}" font-size="${titleBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(titleBlock.lines, textX, titleY, titleLineHeight, directionAttrs)}</text>
      ${
        subtitleLines.length
          ? `<text x="${textX}" y="${subtitleY}" fill="${rgba(ink, 0.86)}" font-family="${bodyFamily}" font-size="${subtitleBlock.fontSize}" font-weight="600" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(
              subtitleLines,
              textX,
              subtitleY,
              subtitleLineHeight,
              directionAttrs,
            )}</text>`
          : ""
      }
      <rect x="118" y="${HEIGHT - 230}" width="160" height="12" rx="6" fill="${rgba(accent, 0.88)}" />
      <text x="${textX}" y="${authorY}" fill="${ink}" font-family="${bodyFamily}" font-size="${authorBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>${safeXml(authorBlock.lines[0] || config.author || "")}</text>
    `;
  }

  if (profile.id === "personal") {
    return `
      <defs>
        <linearGradient id="flat-personal-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${paper}" />
          <stop offset="58%" stop-color="${palette.gradA}" />
          <stop offset="100%" stop-color="${palette.gradB}" />
        </linearGradient>
        <clipPath id="flat-personal-art">
          <path d="M250 1440V1010C250 820 405 674 600 674C795 674 950 820 950 1010V1440Z" />
        </clipPath>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#flat-personal-bg)" />
      <circle cx="178" cy="186" r="110" fill="${rgba(accent, 0.18)}" />
      <circle cx="${WIDTH - 176}" cy="1464" r="124" fill="${rgba(palette.gradC, 0.18)}" />
      <path d="M250 1440V1010C250 820 405 674 600 674C795 674 950 820 950 1010V1440Z" fill="${rgba("#ffffff", 0.84)}" />
      <path d="M274 1440V1018C274 840 417 702 600 702C783 702 926 840 926 1018V1440Z" fill="${rgba("#ffffff", 0.96)}" stroke="${rgba(accent, 0.7)}" stroke-width="8" />
      <g clip-path="url(#flat-personal-art)">
        <image href="${artUri}" x="250" y="674" width="700" height="766" preserveAspectRatio="xMidYMid slice" opacity="0.94" />
      </g>
      <path d="M152 118H304" stroke="${rgba(accent, 0.88)}" stroke-width="12" stroke-linecap="round" />
      <text x="${textX}" y="92" fill="${rgba(ink, 0.72)}" font-family="${bodyFamily}" font-size="18" font-weight="700" letter-spacing="1.8" text-anchor="${align}" ${directionAttrs}>${safeXml(kicker)}</text>
      <text x="${textX}" y="${titleY}" fill="${ink}" font-family="${titleFamily}" font-size="${titleBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(titleBlock.lines, textX, titleY, titleLineHeight, directionAttrs)}</text>
      ${
        subtitleLines.length
          ? `<text x="${textX}" y="${subtitleY}" fill="${rgba(ink, 0.86)}" font-family="${bodyFamily}" font-size="${subtitleBlock.fontSize}" font-weight="600" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(
              subtitleLines,
              textX,
              subtitleY,
              subtitleLineHeight,
              directionAttrs,
            )}</text>`
          : ""
      }
      <text x="${textX}" y="${authorY}" fill="${ink}" font-family="${bodyFamily}" font-size="${authorBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>${safeXml(authorBlock.lines[0] || config.author || "")}</text>
    `;
  }

  if (profile.id === "authority") {
    return `
      <defs>
        <linearGradient id="flat-authority-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${paper}" />
          <stop offset="62%" stop-color="${palette.gradA}" />
          <stop offset="100%" stop-color="${palette.gradB}" />
        </linearGradient>
        <clipPath id="flat-authority-art">
          <rect x="314" y="720" width="572" height="540" rx="42" />
        </clipPath>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#flat-authority-bg)" />
      <rect x="314" y="720" width="572" height="540" rx="42" fill="${rgba("#ffffff", 0.92)}" stroke="${rgba(accent, 0.74)}" stroke-width="8" />
      <rect x="350" y="756" width="500" height="468" rx="28" fill="${rgba("#fffaf3", 0.84)}" />
      <g clip-path="url(#flat-authority-art)">
        <image href="${artUri}" x="314" y="720" width="572" height="540" preserveAspectRatio="xMidYMid slice" opacity="0.9" />
      </g>
      <rect x="322" y="700" width="556" height="16" rx="8" fill="${rgba(accent, 0.84)}" />
      <rect x="154" y="112" width="110" height="14" rx="7" fill="${rgba(accent, 0.84)}" />
      <rect x="${WIDTH - 264}" y="112" width="110" height="14" rx="7" fill="${rgba(accent, 0.48)}" />
      <text x="${textX}" y="92" fill="${rgba(ink, 0.72)}" font-family="${bodyFamily}" font-size="18" font-weight="700" letter-spacing="1.8" text-anchor="${align}" ${directionAttrs}>${safeXml(kicker)}</text>
      <text x="${textX}" y="${titleY}" fill="${ink}" font-family="${titleFamily}" font-size="${titleBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(titleBlock.lines, textX, titleY, titleLineHeight, directionAttrs)}</text>
      ${
        subtitleLines.length
          ? `<text x="${textX}" y="${subtitleY}" fill="${rgba(ink, 0.88)}" font-family="${bodyFamily}" font-size="${subtitleBlock.fontSize}" font-weight="600" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(
              subtitleLines,
              textX,
              subtitleY,
              subtitleLineHeight,
              directionAttrs,
            )}</text>`
          : ""
      }
      <text x="${textX}" y="${authorY}" fill="${ink}" font-family="${bodyFamily}" font-size="${authorBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>${safeXml(authorBlock.lines[0] || config.author || "")}</text>
    `;
  }

  return `
    <defs>
      <linearGradient id="flat-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${paper}" />
        <stop offset="62%" stop-color="${palette.gradA}" />
        <stop offset="100%" stop-color="${palette.gradB}" />
      </linearGradient>
      <clipPath id="flat-emblem">
        <circle cx="${WIDTH / 2}" cy="980" r="226" />
      </clipPath>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#flat-bg)" />
    <circle cx="${WIDTH / 2}" cy="980" r="258" fill="${rgba("#ffffff", 0.7)}" />
    <circle cx="${WIDTH / 2}" cy="980" r="226" fill="${rgba("#fffaf4", 0.98)}" stroke="${rgba(accent, 0.82)}" stroke-width="10" />
    <g clip-path="url(#flat-emblem)">
      <image href="${artUri}" x="${WIDTH / 2 - 226}" y="754" width="452" height="452" preserveAspectRatio="xMidYMid slice" opacity="0.92" />
    </g>
    <rect x="126" y="117" width="140" height="14" rx="7" fill="${accent}" />
    <rect x="${WIDTH - 266}" y="${HEIGHT - 254}" width="140" height="14" rx="7" fill="${rgba(accent, 0.72)}" />
    <text x="${textX}" y="92" fill="${rgba(ink, 0.72)}" font-family="${bodyFamily}" font-size="18" font-weight="700" letter-spacing="1.8" text-anchor="${align}" ${directionAttrs}>${safeXml(kicker)}</text>
    <text x="${textX}" y="${titleY}" fill="${ink}" font-family="${titleFamily}" font-size="${titleBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(titleBlock.lines, textX, titleY, titleLineHeight, directionAttrs)}</text>
    ${
      subtitleLines.length
        ? `<text x="${textX}" y="${subtitleY}" fill="${rgba(ink, 0.88)}" font-family="${bodyFamily}" font-size="${subtitleBlock.fontSize}" font-weight="600" text-anchor="${align}" ${directionAttrs}>${buildTspanLines(
            subtitleLines,
            textX,
            subtitleY,
            subtitleLineHeight,
            directionAttrs,
          )}</text>`
        : ""
    }
    <text x="${textX}" y="${authorY}" fill="${ink}" font-family="${bodyFamily}" font-size="${authorBlock.fontSize}" font-weight="700" text-anchor="${align}" ${directionAttrs}>${safeXml(authorBlock.lines[0] || config.author || "")}</text>
  `;
}

function renderBookstoreFlatBack(config, artUri) {
  const palette = flatPalette(config);
  const profile = flatCoverProfile(config);
  const bodyFamily = coverBodyFamily(config);
  const titleFamily = titleFontFamily(config.languageCode, deriveTitleTone(config, deriveTemplateName(config)));
  const ink = palette.ink;
  const accent = palette.accent;
  const paper = palette.paper;
  const directionAttrs = isRtl(config.languageCode) ? 'direction="rtl" unicode-bidi="plaintext"' : "";
  const anchor = isRtl(config.languageCode) ? "end" : "start";
  const x = isRtl(config.languageCode) ? 1010 : 110;
  const summaryWidth = profile.id === "education" || profile.id === "systems" ? 650 : 760;
  const summary = fitTextBlock(config.summary || "", summaryWidth, config.languageCode, {
    maxSize: 28,
    minSize: 19,
    step: 2,
    maxLines: String(config.backCoverMode || "") === "minimal_blurb" ? 6 : 9,
    kind: "body",
  });
  const bio = fitTextBlock(config.authorBio || "", summaryWidth, config.languageCode, {
    maxSize: 21,
    minSize: 17,
    step: 1,
    maxLines: 4,
    kind: "body",
  });
  let motifMarkup = `
  <circle cx="320" cy="1380" r="170" fill="${rgba("#ffffff", 0.42)}" />
  <g clip-path="url(#flat-back-mark)">
    <image href="${artUri}" x="150" y="1210" width="340" height="340" preserveAspectRatio="xMidYMid slice" opacity="0.18" />
  </g>`;
  let defs = `
    <clipPath id="flat-back-mark">
      <circle cx="320" cy="1380" r="170" />
    </clipPath>`;

  if (profile.id === "education") {
    defs = `
    <clipPath id="flat-back-mark">
      <rect x="748" y="214" width="320" height="520" rx="42" />
    </clipPath>`;
    motifMarkup = `
  <rect x="720" y="188" width="376" height="572" rx="54" fill="${rgba("#ffffff", 0.68)}" />
  <rect x="748" y="214" width="320" height="520" rx="42" fill="${rgba("#ffffff", 0.96)}" stroke="${rgba(accent, 0.7)}" stroke-width="6" />
  <path d="M748 298H1068M748 394H1068M748 490H1068M748 586H1068" stroke="${rgba(accent, 0.18)}" stroke-width="2" />
  <path d="M834 214V734M920 214V734M1006 214V734" stroke="${rgba(ink, 0.08)}" stroke-width="2" />
  <g clip-path="url(#flat-back-mark)">
    <image href="${artUri}" x="748" y="214" width="320" height="520" preserveAspectRatio="xMidYMid slice" opacity="0.18" />
  </g>`;
  } else if (profile.id === "systems") {
    defs = `
    <clipPath id="flat-back-mark">
      <rect x="750" y="236" width="304" height="430" rx="36" />
    </clipPath>`;
    motifMarkup = `
  <circle cx="986" cy="236" r="120" fill="${rgba(accent, 0.14)}" />
  <rect x="728" y="210" width="348" height="482" rx="48" fill="${rgba("#ffffff", 0.72)}" />
  <rect x="750" y="236" width="304" height="430" rx="36" fill="${rgba("#ffffff", 0.96)}" stroke="${rgba(accent, 0.72)}" stroke-width="6" />
  <g clip-path="url(#flat-back-mark)">
    <image href="${artUri}" x="750" y="236" width="304" height="430" preserveAspectRatio="xMidYMid slice" opacity="0.18" />
  </g>
  <path d="M750 722H1054M750 782H1054M750 842H1054" stroke="${rgba(accent, 0.18)}" stroke-width="2" />
  <path d="M816 722V878M904 722V878M992 722V878" stroke="${rgba(ink, 0.08)}" stroke-width="2" />`;
  } else if (profile.id === "personal") {
    defs = `
    <clipPath id="flat-back-mark">
      <path d="M706 1540V1240C706 1100 818 994 960 994C1102 994 1214 1100 1214 1240V1540Z" />
    </clipPath>`;
    motifMarkup = `
  <path d="M706 1540V1240C706 1100 818 994 960 994C1102 994 1214 1100 1214 1240V1540Z" fill="${rgba("#ffffff", 0.5)}" />
  <g clip-path="url(#flat-back-mark)">
    <image href="${artUri}" x="706" y="994" width="508" height="546" preserveAspectRatio="xMidYMid slice" opacity="0.14" />
  </g>`;
  } else if (profile.id === "authority") {
    defs = `
    <clipPath id="flat-back-mark">
      <rect x="754" y="1088" width="274" height="274" rx="30" />
    </clipPath>`;
    motifMarkup = `
  <rect x="728" y="1060" width="326" height="326" rx="44" fill="${rgba("#ffffff", 0.52)}" />
  <rect x="754" y="1088" width="274" height="274" rx="30" fill="${rgba("#ffffff", 0.92)}" stroke="${rgba(accent, 0.62)}" stroke-width="6" />
  <g clip-path="url(#flat-back-mark)">
    <image href="${artUri}" x="754" y="1088" width="274" height="274" preserveAspectRatio="xMidYMid slice" opacity="0.16" />
  </g>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">
  <defs>
    <linearGradient id="flat-back-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${paper}" />
      <stop offset="62%" stop-color="${palette.gradA}" />
      <stop offset="100%" stop-color="${palette.gradB}" />
    </linearGradient>
${defs}
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#flat-back-bg)" />
${motifMarkup}
  <rect x="104" y="128" width="160" height="10" rx="5" fill="${accent}" />
  <text x="${x}" y="210" fill="${ink}" font-family="${titleFamily}" font-size="44" font-weight="700" text-anchor="${anchor}" ${directionAttrs}>${safeXml(config.title)}</text>
  <text x="${x}" y="328" fill="${rgba(ink, 0.9)}" font-family="${bodyFamily}" font-size="${summary.fontSize}" font-weight="500" text-anchor="${anchor}" ${directionAttrs}>${buildTspanLines(summary.lines, x, 328, summary.fontSize * 1.42, directionAttrs)}</text>
  <rect x="110" y="1018" width="${WIDTH - 220}" height="2" fill="${rgba(accent, 0.54)}" />
  <text x="${x}" y="1110" fill="${ink}" font-family="${bodyFamily}" font-size="22" font-weight="700" text-anchor="${anchor}" ${directionAttrs}>${safeXml(config.author || "")}</text>
  ${
    bio.lines.length
      ? `<text x="${x}" y="1166" fill="${rgba(ink, 0.84)}" font-family="${bodyFamily}" font-size="${bio.fontSize}" font-weight="500" text-anchor="${anchor}" ${directionAttrs}>${buildTspanLines(
          bio.lines,
          x,
          1166,
          bio.fontSize * 1.45,
          directionAttrs,
        )}</text>`
      : ""
  }
</svg>`;
}

function createFrontSvg(config, artUri, logoUri) {
  if (isBookstoreBoldMode(config)) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">
  ${renderBookstoreBoldFront(config, artUri)}
</svg>`;
  }
  if (isBookstoreFlatMode(config)) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">
  ${renderBookstoreFlatFront(config, artUri)}
</svg>`;
  }
  const templateName = deriveTemplateName(config);
  const preferredZone = String(config.preferredZone || "").trim();
  const template = templateConfig(templateName, preferredZone);
  const [gradA, gradB, gradC] = gradientColors(config.coverGradient);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">
  <defs>
    <linearGradient id="frame-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradA}" />
      <stop offset="52%" stop-color="${gradB}" />
      <stop offset="100%" stop-color="${gradC}" />
    </linearGradient>
    <linearGradient id="art-overlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#090c14" stop-opacity="0.36" />
      <stop offset="50%" stop-color="#07080e" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#05060b" stop-opacity="0.6" />
    </linearGradient>
    <radialGradient id="foil" cx="78%" cy="12%" r="45%">
      <stop offset="0%" stop-color="${config.accentColor || "#caa15b"}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${config.accentColor || "#caa15b"}" stop-opacity="0" />
    </radialGradient>
    <clipPath id="front-clip">
      <rect x="32" y="32" width="${WIDTH - 64}" height="${HEIGHT - 64}" rx="44" />
    </clipPath>
    <filter id="art-soften" x="-8%" y="-8%" width="116%" height="116%">
      <feGaussianBlur stdDeviation="2.2" />
      <feColorMatrix type="saturate" values="0.82" />
    </filter>
    <filter id="panel-shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="rgb(3,5,10)" flood-opacity="0.45" />
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" rx="52" fill="url(#frame-bg)" />
  <g clip-path="url(#front-clip)">
    <image href="${artUri}" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid slice" filter="url(#art-soften)" />
    <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#art-overlay)" />
    <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#foil)" />
    ${motifOverlayMarkup(config)}
  </g>
  ${frameMarkup(config, template)}
  ${
    template.layout === "bottom-band" || template.layout === "center-stack" || isCjk(config.languageCode)
      ? renderCenteredFront(config, template, logoUri)
      : renderSideSlabFront(config, template, logoUri)
  }
</svg>`;
}

function createBackSvg(config, artUri, logoUri) {
  if (isBookstoreBoldMode(config)) {
    return renderBookstoreBoldBack(config, artUri);
  }
  if (isBookstoreFlatMode(config)) {
    return renderBookstoreFlatBack(config, artUri);
  }
  const [gradA, gradB, gradC] = gradientColors(config.coverGradient);
  const templateName = deriveTemplateName(config);
  const template = templateConfig(templateName, String(config.preferredZone || "").trim());
  const bodyFamily = coverBodyFamily(config);
  const titleFamily = titleFontFamily(config.languageCode, deriveTitleTone(config, templateName));
  const summary = fitTextBlock(config.summary || "", 740, config.languageCode, {
    maxSize: 28,
    minSize: 20,
    step: 2,
    maxLines: 7,
    kind: "body",
  });
  const bio = fitTextBlock(config.authorBio || "", 740, config.languageCode, {
    maxSize: 22,
    minSize: 18,
    step: 1,
    maxLines: 6,
    kind: "body",
  });
  const directionAttrs = isRtl(config.languageCode) ? 'direction="rtl" unicode-bidi="plaintext"' : "";
  const anchor = isRtl(config.languageCode) ? "end" : "start";
  const x = isRtl(config.languageCode) ? 1040 : 120;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">
  <defs>
    <linearGradient id="back-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradC}" />
      <stop offset="55%" stop-color="${gradB}" />
      <stop offset="100%" stop-color="${gradA}" />
    </linearGradient>
    <linearGradient id="back-overlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#04070b" stop-opacity="0.34" />
      <stop offset="100%" stop-color="#030408" stop-opacity="0.74" />
    </linearGradient>
    <filter id="back-art-soften" x="-8%" y="-8%" width="116%" height="116%">
      <feGaussianBlur stdDeviation="2.4" />
      <feColorMatrix type="saturate" values="0.8" />
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" rx="52" fill="url(#back-bg)" />
  <image href="${artUri}" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid slice" opacity="0.16" filter="url(#back-art-soften)" />
  <rect width="${WIDTH}" height="${HEIGHT}" rx="52" fill="url(#back-overlay)" />
  ${frameMarkup(config, template)}
  <rect x="72" y="72" width="${WIDTH - 144}" height="${HEIGHT - 144}" rx="42" fill="rgba(255,255,255,0.06)" stroke="${rgba(config.textAccent || "#fff8ef", 0.16)}" />
  <text x="${x}" y="194" fill="${config.textAccent || "#fff8ef"}" font-family="${titleFamily}" font-size="54" font-weight="700" text-anchor="${anchor}" ${directionAttrs}>${safeXml(
    config.title,
  )}</text>
  ${
    visiblePublisherLabel(config)
      ? `<text x="${x}" y="246" fill="${rgba(config.textAccent || "#fff8ef", 0.72)}" font-family="${bodyFamily}" font-size="18" font-weight="700" letter-spacing="2" text-anchor="${anchor}" ${directionAttrs}>${safeXml(
          visiblePublisherLabel(config),
        )}</text>`
      : ""
  }
  <text x="${x}" y="368" fill="${config.textAccent || "#fff8ef"}" font-family="${bodyFamily}" font-size="${summary.fontSize}" font-weight="500" text-anchor="${anchor}" ${directionAttrs}>
    ${buildTspanLines(summary.lines, x, 368, summary.fontSize * 1.42, directionAttrs)}
  </text>
  <rect x="120" y="980" width="${WIDTH - 240}" height="2" fill="${rgba(config.accentColor || "#caa15b", 0.44)}" />
  <text x="${x}" y="1088" fill="${rgba(config.textAccent || "#fff8ef", 0.84)}" font-family="${bodyFamily}" font-size="20" font-weight="700" letter-spacing="1.6" text-anchor="${anchor}" ${directionAttrs}>${safeXml(
    config.author,
  )}</text>
  <text x="${x}" y="1140" fill="${rgba(config.textAccent || "#fff8ef", 0.82)}" font-family="${bodyFamily}" font-size="${bio.fontSize}" font-weight="500" text-anchor="${anchor}" ${directionAttrs}>
    ${buildTspanLines(bio.lines, x, 1140, bio.fontSize * 1.48, directionAttrs)}
  </text>
  ${
    logoUri
      ? `<g transform="translate(${isRtl(config.languageCode) ? 936 : 120} 1642)">
           <rect width="132" height="132" rx="34" fill="rgba(7,10,18,0.36)" stroke="${rgba(config.textAccent || "#fff8ef", 0.14)}" />
           <image href="${logoUri}" x="18" y="18" width="96" height="96" preserveAspectRatio="xMidYMid meet" />
         </g>`
      : ""
  }
</svg>`;
}

function render(svg, outputPath) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
    font: {
      loadSystemFonts: true,
      fontFiles: FONT_FILES,
      defaultFontFamily: "Arial",
    },
  });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, resvg.render().asPng());
}

function main() {
  const args = parseArgs(process.argv);
  const configPath = args.config ? path.resolve(args.config) : "";
  const artPath = args.art ? path.resolve(args.art) : "";
  if (!configPath || !fs.existsSync(configPath)) {
    throw new Error(`Missing --config JSON path: ${configPath}`);
  }
  if (!artPath || !fs.existsSync(artPath)) {
    throw new Error(`Missing --art path: ${artPath}`);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  config.author = visibleAuthorName(config);
  config.authorBio = visibleAuthorBio(config);
  if (!visiblePublisherLabel(config)) {
    config.publisher = "";
  }
  const frontSvgPath = path.resolve(args["front-svg"] || path.join(path.dirname(artPath), "front_cover_final.svg"));
  const frontPngPath = path.resolve(args["front-png"] || path.join(path.dirname(artPath), "front_cover_final.png"));
  const backSvgPath = path.resolve(args["back-svg"] || path.join(path.dirname(artPath), "back_cover_final.svg"));
  const backPngPath = path.resolve(args["back-png"] || path.join(path.dirname(artPath), "back_cover_final.png"));
  const logoPath = config.brandingLogoPath && fs.existsSync(config.brandingLogoPath) ? config.brandingLogoPath : "";

  const artUri = fileDataUri(artPath);
  const logoUri = logoPath ? fileDataUri(logoPath) : "";
  const frontSvg = createFrontSvg(config, artUri, logoUri);
  const backSvg = createBackSvg(config, artUri, logoUri);

  fs.mkdirSync(path.dirname(frontSvgPath), { recursive: true });
  fs.writeFileSync(frontSvgPath, frontSvg, "utf8");
  fs.writeFileSync(backSvgPath, backSvg, "utf8");
  render(frontSvg, frontPngPath);
  render(backSvg, backPngPath);

  process.stdout.write(
    JSON.stringify(
      {
        template: deriveTemplateName(config),
        frontSvg: frontSvgPath,
        frontPng: frontPngPath,
        backSvg: backSvgPath,
        backPng: backPngPath,
      },
      null,
      2,
    ),
  );
}

main();
