#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { createRequire } from "module";

const requireFromWeb = createRequire(path.resolve(path.dirname(new URL(import.meta.url).pathname), "../web/package.json"));
const { PNG } = requireFromWeb("pngjs");

const WIDTH = 1200;
const HEIGHT = 1920;

const FONT_5X7 = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["11111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
};

function readInput() {
  return new Promise((resolve) => {
    let raw = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      raw += chunk;
    });
    process.stdin.on("end", () => {
      resolve(JSON.parse(raw || "{}"));
    });
  });
}

function mulberry32(seed) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hexToRgb(hex) {
  const normalized = String(hex || "").replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16) || 0,
    g: parseInt(normalized.slice(2, 4), 16) || 0,
    b: parseInt(normalized.slice(4, 6), 16) || 0,
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mixColors(c1, c2, t) {
  return {
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t)),
  };
}

function parseGradient(gradient) {
  const colors = String(gradient || "").match(/#[0-9a-fA-F]{6}/g) || [];
  const fallback = ["#111111", "#333333", "#666666"];
  return [...colors, ...fallback].slice(0, 3).map(hexToRgb);
}

function setPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = color.r;
  png.data[idx + 1] = color.g;
  png.data[idx + 2] = color.b;
  png.data[idx + 3] = 255;
}

function blendPixel(png, x, y, color, alpha) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  const a = Math.max(0, Math.min(1, alpha));
  png.data[idx] = Math.round(color.r * a + png.data[idx] * (1 - a));
  png.data[idx + 1] = Math.round(color.g * a + png.data[idx + 1] * (1 - a));
  png.data[idx + 2] = Math.round(color.b * a + png.data[idx + 2] * (1 - a));
  png.data[idx + 3] = 255;
}

function fillGradient(png, c1, c2, c3) {
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const t = (x + y) / (png.width + png.height);
      const color = t < 0.52 ? mixColors(c1, c2, t / 0.52) : mixColors(c2, c3, (t - 0.52) / 0.48);
      setPixel(png, x, y, color);
    }
  }
}

function addNoise(png, rand, amount = 10) {
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const idx = (png.width * y + x) << 2;
      const drift = Math.floor((rand() - 0.5) * amount);
      png.data[idx] = Math.max(0, Math.min(255, png.data[idx] + drift));
      png.data[idx + 1] = Math.max(0, Math.min(255, png.data[idx + 1] + drift));
      png.data[idx + 2] = Math.max(0, Math.min(255, png.data[idx + 2] + drift));
    }
  }
}

function drawCircle(png, cx, cy, radius, color, alpha = 0.2) {
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(png.width - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(png.height - 1, Math.ceil(cy + radius));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;
      const falloff = 1 - dist / radius;
      blendPixel(png, x, y, color, alpha * falloff);
    }
  }
}

function drawRoundedRect(png, x, y, width, height, radius, color, alpha = 0.14) {
  const maxX = Math.min(png.width - 1, Math.floor(x + width));
  const maxY = Math.min(png.height - 1, Math.floor(y + height));
  const minX = Math.max(0, Math.floor(x));
  const minY = Math.max(0, Math.floor(y));
  for (let py = minY; py <= maxY; py += 1) {
    for (let px = minX; px <= maxX; px += 1) {
      const dx = Math.min(px - x, x + width - px);
      const dy = Math.min(py - y, y + height - py);
      if (dx >= radius || dy >= radius) {
        blendPixel(png, px, py, color, alpha);
        continue;
      }
      const rx = dx - radius;
      const ry = dy - radius;
      if (rx * rx + ry * ry <= radius * radius) {
        blendPixel(png, px, py, color, alpha);
      }
    }
  }
}

function drawBeam(png, x1, y1, x2, y2, thickness, color, alpha = 0.12) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const cx = lerp(x1, x2, t);
    const cy = lerp(y1, y2, t);
    drawCircle(png, cx, cy, thickness, color, alpha * 0.6);
  }
}

function drawFrame(png, margin, color, alpha = 0.18) {
  drawRoundedRect(png, margin, margin, png.width - margin * 2, 3, 1, color, alpha);
  drawRoundedRect(png, margin, png.height - margin - 3, png.width - margin * 2, 3, 1, color, alpha);
}

function drawPixelGlyph(png, glyph, x, y, scale, color) {
  const pattern = FONT_5X7[glyph];
  if (!pattern) return;
  for (let row = 0; row < pattern.length; row += 1) {
    for (let col = 0; col < pattern[row].length; col += 1) {
      if (pattern[row][col] !== "1") continue;
      drawRoundedRect(
        png,
        x + col * scale,
        y + row * scale,
        scale - 1,
        scale - 1,
        Math.max(1, Math.floor(scale / 5)),
        color,
        1,
      );
    }
  }
}

function drawMonogram(png, mark, color) {
  const glyphs = String(mark || "BG").slice(0, 3).toUpperCase().split("");
  const scale = 16;
  const padding = 22;
  const boxWidth = glyphs.length * (5 * scale + scale) + padding * 2 - scale;
  const boxHeight = 7 * scale + padding * 2;
  drawRoundedRect(png, 76, 104, boxWidth, boxHeight, 34, { r: 15, g: 15, b: 18 }, 0.28);
  glyphs.forEach((glyph, index) => {
    drawPixelGlyph(png, glyph, 76 + padding + index * (6 * scale), 104 + padding, scale, color);
  });
}

function motifFor(entry) {
  const haystack = `${entry.coverPrompt || ""} ${entry.category || ""} ${entry.type || ""} ${entry.topic || ""}`.toLowerCase();
  if (/(ai|prompt|tech|workflow|system|sistem)/u.test(haystack)) return "grid";
  if (/(education|learning|parent|stem|eğitim|formateur|enseign|enseñar)/u.test(haystack)) return "orbit";
  if (/(focus|discipline|calm|leadership|remote|sonuç|ritme|ruhige|clarte|calme)/u.test(haystack)) return "columns";
  if (/(offer|marketing|authority|business|negocio|uzman|expert|vende|revenue|kitap)/u.test(haystack)) return "ribbons";
  return "editorial";
}

function renderMotif(png, entry, rand, accent, textAccent) {
  const motif = motifFor(entry);
  if (motif === "grid") {
    for (let i = 0; i < 6; i += 1) {
      const x = 120 + i * 150 + rand() * 40;
      drawRoundedRect(png, x, 220 + rand() * 140, 110 + rand() * 160, 1180 + rand() * 240, 36, textAccent, 0.07);
    }
    for (let i = 0; i < 12; i += 1) {
      drawBeam(
        png,
        80 + rand() * (png.width - 160),
        180 + rand() * 300,
        80 + rand() * (png.width - 160),
        1320 + rand() * 460,
        6 + rand() * 12,
        accent,
        0.08,
      );
    }
  } else if (motif === "orbit") {
    for (let i = 0; i < 8; i += 1) {
      drawCircle(
        png,
        180 + rand() * (png.width - 360),
        220 + rand() * (png.height - 440),
        120 + rand() * 240,
        i % 2 === 0 ? accent : textAccent,
        0.07 + rand() * 0.06,
      );
    }
    for (let i = 0; i < 5; i += 1) {
      drawRoundedRect(png, 120 + rand() * 700, 300 + i * 240, 340 + rand() * 180, 86 + rand() * 160, 44, accent, 0.08);
    }
  } else if (motif === "columns") {
    for (let i = 0; i < 7; i += 1) {
      drawRoundedRect(
        png,
        90 + i * 140 + rand() * 30,
        240 + rand() * 240,
        90 + rand() * 40,
        1240 + rand() * 280,
        45,
        i % 2 === 0 ? textAccent : accent,
        0.08,
      );
    }
    drawCircle(png, png.width * 0.82, 320, 220, accent, 0.12);
    drawCircle(png, png.width * 0.22, png.height * 0.82, 260, textAccent, 0.08);
  } else if (motif === "ribbons") {
    for (let i = 0; i < 6; i += 1) {
      drawBeam(
        png,
        -120 + rand() * 200,
        220 + i * 240,
        png.width - 180 + rand() * 180,
        40 + i * 220 + rand() * 80,
        40 + rand() * 50,
        i % 2 === 0 ? accent : textAccent,
        0.08,
      );
    }
    for (let i = 0; i < 4; i += 1) {
      drawRoundedRect(png, 120 + rand() * 520, 180 + i * 330, 420 + rand() * 220, 110 + rand() * 90, 36, accent, 0.05);
    }
  } else {
    for (let i = 0; i < 12; i += 1) {
      drawCircle(
        png,
        120 + rand() * (png.width - 240),
        180 + rand() * (png.height - 360),
        80 + rand() * 200,
        i % 3 === 0 ? accent : textAccent,
        0.05 + rand() * 0.05,
      );
    }
    for (let i = 0; i < 5; i += 1) {
      drawBeam(png, 140 + rand() * 400, 100 + rand() * 500, 980 + rand() * 80, 860 + i * 180, 22 + rand() * 28, accent, 0.05);
    }
  }
}

function addEditorialAccents(png, accent, textAccent) {
  drawFrame(png, 72, textAccent, 0.2);
  drawRoundedRect(png, 72, 1560, png.width - 144, 2, 1, textAccent, 0.22);
  drawRoundedRect(png, 72, 144, png.width - 144, 2, 1, textAccent, 0.24);
  drawCircle(png, png.width * 0.82, 260, 160, accent, 0.1);
  drawCircle(png, png.width * 0.24, png.height * 0.84, 240, textAccent, 0.06);
}

async function main() {
  const outputPath = process.argv[2];
  if (!outputPath) {
    console.error("Output path is required.");
    process.exit(1);
  }

  const entry = await readInput();
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  const [c1, c2, c3] = parseGradient(entry.coverGradient);
  const accent = hexToRgb(entry.accentColor || "#d1a65f");
  const textAccent = hexToRgb(entry.textAccent || "#f5f1e8");
  const seed = hashString(`${entry.slug}|${entry.coverPrompt}|${entry.brandingMark}|${entry.coverBrief}`);
  const rand = mulberry32(seed);

  fillGradient(png, c1, c2, c3);
  renderMotif(png, entry, rand, accent, textAccent);
  addEditorialAccents(png, accent, textAccent);
  addNoise(png, rand, 8);
  drawMonogram(png, entry.brandingMark, textAccent);

  fs.writeFileSync(outputPath, PNG.sync.write(png));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
