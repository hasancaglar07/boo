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
      <text x="${footerX}" y="${footerY + 34}" fill="${rgba(config.textAccent || "#fff8ef", 0.74)}" font-family="${bodyFamily}" font-size="${publisherBlock.fontSize}" font-weight="600" text-anchor="${panel.footerAlign === "middle" ? "middle" : panel.footerAlign === "end" ? "end" : "start"}" letter-spacing="1.2" ${directionAttrs}>${safeXml(
        `${config.publisher}  ${config.year ? ` / ${config.year}` : ""}`,
      )}</text>
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
    <text x="${textX}" y="${footerY + 36}" fill="${rgba(config.textAccent || "#fff8ef", 0.78)}" font-family="${bodyFamily}" font-size="17" font-weight="600" letter-spacing="1.1" text-anchor="${anchor}" ${directionAttrs}>${safeXml(
      `${config.publisher || ""}${config.year ? ` / ${config.year}` : ""}`,
    )}</text>
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
    <text x="${textX}" y="${authorY + 34}" fill="${rgba(config.textAccent || "#fff8ef", 0.78)}" font-family="${bodyFamily}" font-size="${isHeroVisual ? 15 : 17}" font-weight="600" letter-spacing="1.1" text-anchor="${align}" ${directionAttrs}>${safeXml(
      `${config.publisher || ""}${config.year ? ` / ${config.year}` : ""}`,
    )}</text>
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

function createFrontSvg(config, artUri, logoUri) {
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
  <text x="${x}" y="246" fill="${rgba(config.textAccent || "#fff8ef", 0.72)}" font-family="${bodyFamily}" font-size="18" font-weight="700" letter-spacing="2" text-anchor="${anchor}" ${directionAttrs}>${safeXml(
    `${config.publisher}${config.year ? ` / ${config.year}` : ""}`,
  )}</text>
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
  <text x="${x}" y="1600" fill="${rgba(config.textAccent || "#fff8ef", 0.76)}" font-family="${bodyFamily}" font-size="20" font-weight="600" text-anchor="${anchor}" ${directionAttrs}>${safeXml(
    config.coverBrief || "",
  )}</text>
  ${
    logoUri
      ? `<g transform="translate(${isRtl(config.languageCode) ? 936 : 120} 1642)">
           <rect width="132" height="132" rx="34" fill="rgba(7,10,18,0.36)" stroke="${rgba(config.textAccent || "#fff8ef", 0.14)}" />
           <image href="${logoUri}" x="18" y="18" width="96" height="96" preserveAspectRatio="xMidYMid meet" />
         </g>`
      : ""
  }
  <rect x="${WIDTH - 256}" y="${HEIGHT - 240}" width="140" height="140" rx="14" fill="rgba(255,255,255,0.92)" />
  <rect x="${WIDTH - 238}" y="${HEIGHT - 216}" width="14" height="96" fill="#0b1020" />
  <rect x="${WIDTH - 210}" y="${HEIGHT - 216}" width="8" height="96" fill="#0b1020" />
  <rect x="${WIDTH - 194}" y="${HEIGHT - 216}" width="18" height="96" fill="#0b1020" />
  <rect x="${WIDTH - 164}" y="${HEIGHT - 216}" width="10" height="96" fill="#0b1020" />
  <rect x="${WIDTH - 146}" y="${HEIGHT - 216}" width="22" height="96" fill="#0b1020" />
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
