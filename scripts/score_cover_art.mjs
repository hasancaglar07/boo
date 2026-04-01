#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const requireFromWeb = createRequire(path.resolve(SCRIPT_DIR, "../web/package.json"));
const requireFromVendor = createRequire(path.resolve(SCRIPT_DIR, "./vendor/node_modules/jpeg-js/package.json"));
const { PNG } = requireFromWeb("pngjs");
const jpeg = requireFromVendor("jpeg-js");

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function statRegion(png, region) {
  const startX = Math.max(0, Math.floor(region.x * png.width));
  const endX = Math.min(png.width - 1, Math.ceil((region.x + region.width) * png.width));
  const startY = Math.max(0, Math.floor(region.y * png.height));
  const endY = Math.min(png.height - 1, Math.ceil((region.y + region.height) * png.height));
  const sampleStep = Math.max(2, Math.floor(Math.min(png.width, png.height) / 220));

  let count = 0;
  let sum = 0;
  let sumSq = 0;
  let edge = 0;
  let saturation = 0;

  for (let y = startY; y <= endY; y += sampleStep) {
    for (let x = startX; x <= endX; x += sampleStep) {
      const index = (png.width * y + x) << 2;
      const red = png.data[index];
      const green = png.data[index + 1];
      const blue = png.data[index + 2];
      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);

      count += 1;
      sum += luminance;
      sumSq += luminance * luminance;
      saturation += max - min;

      if (x + sampleStep <= endX) {
        const rightIndex = (png.width * y + (x + sampleStep)) << 2;
        const rightLum =
          0.2126 * png.data[rightIndex] +
          0.7152 * png.data[rightIndex + 1] +
          0.0722 * png.data[rightIndex + 2];
        edge += Math.abs(luminance - rightLum);
      }
      if (y + sampleStep <= endY) {
        const downIndex = (png.width * (y + sampleStep) + x) << 2;
        const downLum =
          0.2126 * png.data[downIndex] +
          0.7152 * png.data[downIndex + 1] +
          0.0722 * png.data[downIndex + 2];
        edge += Math.abs(luminance - downLum);
      }
    }
  }

  const mean = count ? sum / count : 0;
  const variance = count ? Math.max(0, sumSq / count - mean * mean) : 0;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    stdDev,
    edge: count ? edge / count : 0,
    saturation: count ? saturation / count : 0,
  };
}

function zoneScore(stats) {
  const calmScore = clamp(100 - stats.stdDev * 1.7 - stats.edge * 1.55, 0, 100);
  const contrastScore = clamp(Math.abs(stats.mean - 128) * 0.72, 0, 100);
  const saturationScore = clamp(100 - Math.abs(stats.saturation - 54) * 1.1, 0, 100);
  return calmScore * 0.52 + contrastScore * 0.28 + saturationScore * 0.2;
}

function main() {
  const args = parseArgs(process.argv);
  const input = args.input ? path.resolve(args.input) : "";
  if (!input || !fs.existsSync(input)) {
    throw new Error(`Missing --input PNG path: ${input}`);
  }

  const source = fs.readFileSync(input);
  let png;
  if (source[0] === 0x89 && source[1] === 0x50 && source[2] === 0x4e && source[3] === 0x47) {
    png = PNG.sync.read(source);
  } else if (source[0] === 0xff && source[1] === 0xd8) {
    const decoded = jpeg.decode(source, { useTArray: true });
    png = { width: decoded.width, height: decoded.height, data: decoded.data };
  } else {
    throw new Error(`Unsupported cover art format for scoring: ${input}`);
  }
  const zones = {
    "top-left": { x: 0.06, y: 0.06, width: 0.5, height: 0.28 },
    "top-right": { x: 0.44, y: 0.06, width: 0.5, height: 0.28 },
    "lower-left": { x: 0.06, y: 0.54, width: 0.5, height: 0.28 },
    "lower-right": { x: 0.44, y: 0.54, width: 0.5, height: 0.28 },
    center: { x: 0.22, y: 0.24, width: 0.56, height: 0.42 },
  };

  const scoredZones = Object.entries(zones).map(([name, region]) => {
    const stats = statRegion(png, region);
    return {
      name,
      score: zoneScore(stats),
      ...stats,
    };
  });

  const calmestZone = [...scoredZones].sort((left, right) => right.score - left.score)[0];
  const center = scoredZones.find((zone) => zone.name === "center");
  const overall = statRegion(png, { x: 0, y: 0, width: 1, height: 1 });

  const crowdPenalty = center ? clamp(center.stdDev * 0.55 + center.edge * 0.55 - 18, 0, 38) : 0;
  const globalContrast = clamp(Math.abs(overall.mean - 124) * 0.45 + overall.stdDev * 0.35, 0, 100);
  const saturationBalance = clamp(100 - Math.abs(overall.saturation - 68) * 1.1, 0, 100);
  const finalScore = clamp(
    calmestZone.score * 0.58 + globalContrast * 0.24 + saturationBalance * 0.18 - crowdPenalty,
    0,
    100,
  );

  process.stdout.write(
    JSON.stringify(
      {
        score: Number(finalScore.toFixed(2)),
        preferredZone: calmestZone.name,
        zones: Object.fromEntries(
          scoredZones.map((zone) => [
            zone.name,
            {
              score: Number(zone.score.toFixed(2)),
              mean: Number(zone.mean.toFixed(2)),
              stdDev: Number(zone.stdDev.toFixed(2)),
              edge: Number(zone.edge.toFixed(2)),
              saturation: Number(zone.saturation.toFixed(2)),
            },
          ]),
        ),
        overall: {
          mean: Number(overall.mean.toFixed(2)),
          stdDev: Number(overall.stdDev.toFixed(2)),
          edge: Number(overall.edge.toFixed(2)),
          saturation: Number(overall.saturation.toFixed(2)),
        },
      },
      null,
      2,
    ),
  );
}

main();
