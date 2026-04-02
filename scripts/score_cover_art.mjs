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

function buildLuminanceGrid(png, targetWidth = 220) {
  const scale = Math.min(1, targetWidth / png.width);
  const width = Math.max(48, Math.round(png.width * scale));
  const height = Math.max(64, Math.round(png.height * scale));
  const data = new Float32Array(width * height);
  const sampleX = png.width / width;
  const sampleY = png.height / height;

  for (let y = 0; y < height; y += 1) {
    const srcY = Math.min(png.height - 1, Math.floor((y + 0.5) * sampleY));
    for (let x = 0; x < width; x += 1) {
      const srcX = Math.min(png.width - 1, Math.floor((x + 0.5) * sampleX));
      const index = (png.width * srcY + srcX) << 2;
      const red = png.data[index];
      const green = png.data[index + 1];
      const blue = png.data[index + 2];
      data[y * width + x] = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    }
  }

  return { width, height, data };
}

function buildBinaryMask(grid, threshold, mode) {
  const mask = new Uint8Array(grid.width * grid.height);
  for (let index = 0; index < grid.data.length; index += 1) {
    const value = grid.data[index];
    mask[index] = mode === "dark" ? (value <= threshold ? 1 : 0) : value >= threshold ? 1 : 0;
  }
  return mask;
}

function scoreTextRows(mask, width, height) {
  const limitY = Math.max(12, Math.floor(height * 0.78));
  const bandHeight = Math.max(10, Math.round(height * 0.06));
  const stride = Math.max(4, Math.round(bandHeight * 0.5));
  const bands = [];

  for (let y0 = 0; y0 + bandHeight <= limitY; y0 += stride) {
    let active = 0;
    let transitions = 0;
    let segments = 0;

    for (let y = y0; y < y0 + bandHeight; y += 1) {
      let previous = 0;
      for (let x = 0; x < width; x += 1) {
        const current = mask[y * width + x];
        active += current;
        if (x > 0 && current !== previous) {
          transitions += 1;
        }
        if (current && previous === 0) {
          segments += 1;
        }
        previous = current;
      }
    }

    const area = bandHeight * width;
    const fill = active / Math.max(1, area);
    const transitionDensity = transitions / Math.max(1, bandHeight * (width - 1));
    const segmentDensity = segments / Math.max(1, bandHeight);
    const fillFit = fill < 0.015 || fill > 0.36 ? 0 : clamp(1 - Math.abs(fill - 0.12) / 0.12, 0, 1);
    const transitionScore = clamp((transitionDensity - 0.045) / 0.16, 0, 1);
    const segmentScore = clamp((segmentDensity - 1.4) / 4.6, 0, 1);
    const risk = (fillFit * 0.34 + transitionScore * 0.41 + segmentScore * 0.25) * 100;

    bands.push({
      y0,
      y1: y0 + bandHeight,
      fill,
      transitionDensity,
      segmentDensity,
      risk,
    });
  }

  const ranked = [...bands].sort((left, right) => right.risk - left.risk);
  const top = ranked.slice(0, 3);
  const meanTopRisk =
    top.length > 0 ? top.reduce((sum, band) => sum + band.risk, 0) / top.length : 0;
  const repeatedHighBands = bands.filter((band) => band.risk >= 52).length;
  const repeatBonus = clamp((repeatedHighBands - 1) * 10, 0, 28);
  const score = clamp((top[0]?.risk || 0) * 0.62 + meanTopRisk * 0.26 + repeatBonus, 0, 100);

  return {
    score,
    bands: top.map((band) => ({
      y0: band.y0,
      y1: band.y1,
      fill: Number(band.fill.toFixed(3)),
      transitionDensity: Number(band.transitionDensity.toFixed(3)),
      segmentDensity: Number(band.segmentDensity.toFixed(3)),
      risk: Number(band.risk.toFixed(2)),
    })),
  };
}

function textArtifactScore(png, overall) {
  const grid = buildLuminanceGrid(png);
  const brightThreshold = clamp(overall.mean + Math.max(26, overall.stdDev * 0.32), 154, 236);
  const darkThreshold = clamp(overall.mean - Math.max(28, overall.stdDev * 0.35), 18, 112);
  const bright = scoreTextRows(buildBinaryMask(grid, brightThreshold, "bright"), grid.width, grid.height);
  const dark = scoreTextRows(buildBinaryMask(grid, darkThreshold, "dark"), grid.width, grid.height);
  const score = clamp(Math.max(bright.score, dark.score), 0, 100);
  return {
    score,
    dominantMode: bright.score >= dark.score ? "bright" : "dark",
    brightBands: bright.bands,
    darkBands: dark.bands,
  };
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
  const textArtifacts = textArtifactScore(png, overall);

  const crowdPenalty = center ? clamp(center.stdDev * 0.55 + center.edge * 0.55 - 18, 0, 38) : 0;
  const globalContrast = clamp(Math.abs(overall.mean - 124) * 0.45 + overall.stdDev * 0.35, 0, 100);
  const saturationBalance = clamp(100 - Math.abs(overall.saturation - 68) * 1.1, 0, 100);
  const finalScore = clamp(
    calmestZone.score * 0.58 +
      globalContrast * 0.24 +
      saturationBalance * 0.18 -
      crowdPenalty -
      textArtifacts.score * 0.48,
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
        textRisk: Number(textArtifacts.score.toFixed(2)),
        textDominantMode: textArtifacts.dominantMode,
        textBands: {
          bright: textArtifacts.brightBands,
          dark: textArtifacts.darkBands,
        },
      },
      null,
      2,
    ),
  );
}

main();
