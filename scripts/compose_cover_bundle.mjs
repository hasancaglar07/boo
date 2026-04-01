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
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".svg"
      ? "image/svg+xml"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".webp"
          ? "image/webp"
          : "image/png";
  return `data:${mime};base64,${fs.readFileSync(filePath).toString("base64")}`;
}

function isRtl(languageCode) {
  return languageCode === "Arabic";
}

function isCjk(languageCode) {
  return languageCode === "Japanese";
}

function deriveTemplateName(config) {
  const hint = String(config.coverTemplateHint || "").trim();
  if (hint) return hint;

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

function wrapText(text, width, fontSize, languageCode, maxLines, kind = "body") {
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
  if (lines.length <= maxLines) return lines;
  const clamped = lines.slice(0, maxLines);
  clamped[maxLines - 1] = `${clamped[maxLines - 1].replace(/[.,;:!?-]+$/u, "")}...`;
  return clamped;
}

function fitTextBlock(text, width, languageCode, options) {
  let fontSize = options.maxSize;
  let lines = wrapText(text, width, fontSize, languageCode, options.maxLines, options.kind);

  while (fontSize > options.minSize && lines.length > options.maxLines) {
    fontSize -= options.step;
    lines = wrapText(text, width, fontSize, languageCode, options.maxLines, options.kind);
  }

  return { fontSize, lines };
}

function templateConfig(templateName, preferredZone) {
  const base = {
    "business-playbook": {
      panelOpacity: 0.72,
      panelFill: "#0f172a",
      accentStyle: "bar",
      defaultZone: "top-left",
      badgeTone: "dark",
      titleMaxSize: 118,
      subtitleMaxSize: 31,
      titleMaxLines: 4,
    },
    "education-workbook": {
      panelOpacity: 0.76,
      panelFill: "#111827",
      accentStyle: "corner",
      defaultZone: "lower-left",
      badgeTone: "soft",
      titleMaxSize: 102,
      subtitleMaxSize: 29,
      titleMaxLines: 4,
    },
    "expertise-authority": {
      panelOpacity: 0.78,
      panelFill: "#111827",
      accentStyle: "bar",
      defaultZone: "lower-left",
      badgeTone: "dark",
      titleMaxSize: 124,
      subtitleMaxSize: 29,
      titleMaxLines: 4,
    },
    "personal-growth": {
      panelOpacity: 0.66,
      panelFill: "#1f2937",
      accentStyle: "glow",
      defaultZone: "lower-right",
      badgeTone: "soft",
      titleMaxSize: 106,
      subtitleMaxSize: 30,
      titleMaxLines: 5,
    },
    "executive-minimal": {
      panelOpacity: 0.6,
      panelFill: "#0f172a",
      accentStyle: "line",
      defaultZone: "top-right",
      badgeTone: "dark",
      titleMaxSize: 114,
      subtitleMaxSize: 28,
      titleMaxLines: 4,
    },
    "narrative-story": {
      panelOpacity: 0.68,
      panelFill: "#161616",
      accentStyle: "glow",
      defaultZone: "lower-left",
      badgeTone: "soft",
      titleMaxSize: 110,
      subtitleMaxSize: 31,
      titleMaxLines: 5,
    },
  }[templateName] || {
    panelOpacity: 0.7,
    panelFill: "#111827",
    accentStyle: "bar",
    defaultZone: "top-left",
    badgeTone: "dark",
    titleMaxSize: 110,
    subtitleMaxSize: 30,
    titleMaxLines: 4,
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
  const bodyFamily = bodyFontFamily(config.languageCode);
  const titleTone = deriveTitleTone(config, deriveTemplateName(config));
  const titleFamily = titleFontFamily(config.languageCode, titleTone);
  const textWidth = panel.width - panelPaddingX * 2;
  const titleBlock = fitTextBlock(config.title, textWidth, config.languageCode, {
    maxSize: template.titleMaxSize,
    minSize: isCjk(config.languageCode) ? 64 : 58,
    step: 4,
    maxLines: template.titleMaxLines,
    kind: "title",
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
      <stop offset="0%" stop-color="#090c14" stop-opacity="0.28" />
      <stop offset="50%" stop-color="#07080e" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#05060b" stop-opacity="0.54" />
    </linearGradient>
    <radialGradient id="foil" cx="78%" cy="12%" r="45%">
      <stop offset="0%" stop-color="${config.accentColor || "#caa15b"}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${config.accentColor || "#caa15b"}" stop-opacity="0" />
    </radialGradient>
    <clipPath id="front-clip">
      <rect x="32" y="32" width="${WIDTH - 64}" height="${HEIGHT - 64}" rx="44" />
    </clipPath>
    <filter id="panel-shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="rgb(3,5,10)" flood-opacity="0.45" />
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" rx="52" fill="url(#frame-bg)" />
  <g clip-path="url(#front-clip)">
    <image href="${artUri}" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid slice" />
    <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#art-overlay)" />
    <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#foil)" />
  </g>
  <rect x="32" y="32" width="${WIDTH - 64}" height="${HEIGHT - 64}" rx="44" fill="none" stroke="${rgba(config.textAccent || "#fff8ef", 0.2)}" />
  <rect x="56" y="56" width="${WIDTH - 112}" height="${HEIGHT - 112}" rx="36" fill="none" stroke="${rgba(config.accentColor || "#caa15b", 0.16)}" />
  ${titlePanelSvg(config, template)}
  ${
    logoUri
      ? `<g transform="translate(72 1660)">
           <rect width="84" height="84" rx="22" fill="${rgba("#0b0f18", 0.28)}" />
           <image href="${logoUri}" x="10" y="10" width="64" height="64" preserveAspectRatio="xMidYMid meet" />
         </g>`
      : ""
  }
</svg>`;
}

function createBackSvg(config, artUri, logoUri) {
  const [gradA, gradB, gradC] = gradientColors(config.coverGradient);
  const bodyFamily = bodyFontFamily(config.languageCode);
  const titleFamily = titleFontFamily(config.languageCode, deriveTitleTone(config, deriveTemplateName(config)));
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
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" rx="52" fill="url(#back-bg)" />
  <image href="${artUri}" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid slice" opacity="0.18" />
  <rect width="${WIDTH}" height="${HEIGHT}" rx="52" fill="url(#back-overlay)" />
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
