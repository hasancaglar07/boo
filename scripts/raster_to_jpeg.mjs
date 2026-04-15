#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const requireResvg = createRequire(path.resolve(SCRIPT_DIR, "vendor/node_modules/@resvg/resvg-js/package.json"));
const requireJpeg = createRequire(path.resolve(SCRIPT_DIR, "vendor/node_modules/jpeg-js/package.json"));
const { Resvg } = requireResvg("@resvg/resvg-js");
const jpeg = requireJpeg("jpeg-js");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function detectMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  return "image/png";
}

function main() {
  const args = parseArgs(process.argv);
  const inputPath = path.resolve(String(args.input || ""));
  const outputPath = path.resolve(String(args.output || ""));
  const width = Math.max(1, Number.parseInt(String(args.width || "1200"), 10) || 1200);
  const height = Math.max(1, Number.parseInt(String(args.height || "1800"), 10) || 1800);
  const quality = Math.max(1, Math.min(100, Number.parseInt(String(args.quality || "92"), 10) || 92));

  if (!inputPath || !outputPath) {
    console.error("Usage: raster_to_jpeg.mjs --input <path> --output <path> [--width 1200 --height 1800 --quality 92]");
    process.exit(2);
  }
  if (!fs.existsSync(inputPath)) {
    console.error(`Input image not found: ${inputPath}`);
    process.exit(2);
  }

  const source = fs.readFileSync(inputPath);
  const dataUri = `data:${detectMime(inputPath)};base64,${source.toString("base64")}`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <image href="${dataUri}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
</svg>`;

  const rendered = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { loadSystemFonts: true, defaultFontFamily: "Arial" },
  }).render();
  const encoded = jpeg.encode(
    {
      data: rendered.pixels,
      width: rendered.width,
      height: rendered.height,
    },
    quality,
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, encoded.data);
}

main();

