#!/usr/bin/env node

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const vendorRoot = path.resolve(SCRIPT_DIR, "vendor/node_modules/@resvg/resvg-js/package.json");
const requireVendor = createRequire(vendorRoot);
const { Resvg } = requireVendor("@resvg/resvg-js");

const WIDTH = 1200;
const HEIGHT = 1920;

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

function gradientColors(value) {
  const matches = String(value || "").match(/#(?:[0-9a-fA-F]{6})/g) || [];
  return [
    matches[0] || "#111827",
    matches[1] || matches[0] || "#1f2937",
    matches[2] || matches[1] || matches[0] || "#0b1020",
  ];
}

function hexToRgb(hex) {
  const value = String(hex || "").replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
  const int = Number.parseInt(normalized || "000000", 16);
  return {
    red: (int >> 16) & 255,
    green: (int >> 8) & 255,
    blue: int & 255,
  };
}

function mix(left, right, weight) {
  const a = hexToRgb(left);
  const b = hexToRgb(right);
  const w = clamp(weight, 0, 1);
  const blend = (first, second) => Math.round(first + (second - first) * w);
  return `rgb(${blend(a.red, b.red)}, ${blend(a.green, b.green)}, ${blend(a.blue, b.blue)})`;
}

function rgba(hex, alpha) {
  const { red, green, blue } = hexToRgb(hex);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function darken(hex, amount) {
  return mix(hex, "#05070d", amount);
}

function lighten(hex, amount) {
  return mix(hex, "#f8f1e8", amount);
}

function seeded(slug, salt) {
  const digest = crypto.createHash("sha256").update(`${slug}:${salt}`).digest("hex");
  return Number.parseInt(digest.slice(0, 8), 16) / 0xffffffff;
}

function sceneOperator(config, palette) {
  const slug = String(config.slug || "book");
  const offset = Math.round(seeded(slug, "operator-x") * 120);
  const beamTilt = 120 + Math.round(seeded(slug, "operator-tilt") * 110);
  return `
    <g opacity="0.2">
      ${Array.from({ length: 8 }, (_, index) => {
        const x = 160 + index * 122 + Math.round(seeded(slug, `line-${index}`) * 18);
        return `<rect x="${x}" y="120" width="3" height="1620" fill="${rgba(palette.accent, 0.14)}" />`;
      }).join("")}
    </g>
    <g filter="url(#soft-shadow)">
      <rect x="${720 + offset}" y="160" width="300" height="920" rx="32" fill="${rgba(lighten(palette.paper, 0.12), 0.82)}" />
      <rect x="${860 + offset}" y="240" width="10" height="900" fill="${rgba(palette.accent, 0.82)}" />
      <rect x="${470 + offset}" y="540" width="260" height="860" rx="28" fill="${rgba(lighten(palette.paper, 0.08), 0.74)}" />
      <rect x="${600 + offset}" y="620" width="9" height="780" fill="${rgba(palette.accent, 0.68)}" />
      <polygon points="${520 - beamTilt},1220 ${880 - beamTilt},860 ${1140 - beamTilt},1110 ${760 - beamTilt},1510" fill="${rgba(lighten(palette.paper, 0.06), 0.16)}" />
      <polygon points="700,260 1120,140 1180,640 780,740" fill="${rgba(lighten(palette.mid, 0.2), 0.14)}" />
    </g>
    <circle cx="${880 + offset}" cy="340" r="220" fill="${rgba(lighten(palette.accent, 0.18), 0.12)}" />
    <circle cx="${955 + offset}" cy="310" r="164" fill="${rgba(lighten(palette.accent, 0.28), 0.18)}" />
  `;
}

function sceneAuthority(config, palette) {
  const slug = String(config.slug || "book");
  const shift = Math.round(seeded(slug, "authority-shift") * 140);
  return `
    <g filter="url(#soft-shadow)">
      <circle cx="${900 - shift}" cy="420" r="280" fill="${rgba(lighten(palette.paper, 0.14), 0.18)}" />
      <circle cx="${915 - shift}" cy="420" r="220" fill="${rgba(lighten(palette.paper, 0.08), 0.22)}" />
      <rect x="${650 - shift}" y="860" width="240" height="760" rx="28" fill="${rgba(lighten(palette.paper, 0.1), 0.72)}" />
      <rect x="${835 - shift}" y="760" width="12" height="860" fill="${rgba(palette.accent, 0.8)}" />
      <rect x="${860 - shift}" y="980" width="180" height="540" rx="24" fill="${rgba(lighten(palette.paper, 0.04), 0.66)}" />
      <polygon points="${460 - shift},620 ${690 - shift},520 ${890 - shift},980 ${610 - shift},1140" fill="${rgba(lighten(palette.paper, 0.08), 0.18)}" />
    </g>
    <g opacity="0.28">
      <rect x="120" y="144" width="960" height="2" fill="${rgba(palette.accent, 0.34)}" />
      <rect x="120" y="1772" width="960" height="2" fill="${rgba(palette.accent, 0.24)}" />
      <rect x="1080" y="184" width="2" height="1460" fill="${rgba(palette.accent, 0.22)}" />
    </g>
  `;
}

function sceneWarmGuide(config, palette) {
  const slug = String(config.slug || "book");
  const orbit = 760 + Math.round(seeded(slug, "warm-orbit") * 160);
  const step = 850 + Math.round(seeded(slug, "warm-step") * 120);
  return `
    <g filter="url(#soft-shadow)">
      <ellipse cx="${orbit}" cy="420" rx="300" ry="230" fill="${rgba(lighten(palette.paper, 0.1), 0.18)}" />
      <path d="M520 340 C650 200, 900 200, 1030 360" stroke="${rgba(lighten(palette.accent, 0.22), 0.42)}" stroke-width="14" stroke-linecap="round" fill="none" />
      <path d="M560 420 C690 300, 870 300, 980 432" stroke="${rgba(lighten(palette.accent, 0.2), 0.28)}" stroke-width="10" stroke-linecap="round" fill="none" />
      <rect x="240" y="${step}" width="360" height="180" rx="28" fill="${rgba(lighten(palette.paper, 0.1), 0.76)}" />
      <rect x="530" y="${step - 92}" width="300" height="220" rx="28" fill="${rgba(lighten(palette.paper, 0.06), 0.72)}" />
      <rect x="770" y="${step - 190}" width="220" height="260" rx="28" fill="${rgba(lighten(palette.paper, 0.02), 0.68)}" />
      <rect x="820" y="${step - 198}" width="10" height="520" fill="${rgba(palette.accent, 0.7)}" />
      <polygon points="710,1160 1060,840 1140,1080 840,1430" fill="${rgba(lighten(palette.paper, 0.05), 0.14)}" />
    </g>
    <circle cx="${orbit - 70}" cy="412" r="112" fill="${rgba(lighten(palette.accent, 0.16), 0.12)}" />
  `;
}

function sceneStoryworld(config, palette) {
  const slug = String(config.slug || "book");
  const moonX = 860 + Math.round(seeded(slug, "storyworld-moon") * 120);
  const hillRise = 1260 + Math.round(seeded(slug, "storyworld-hill") * 90);
  return `
    <g filter="url(#soft-shadow)">
      <circle cx="${moonX}" cy="290" r="150" fill="${rgba(lighten(palette.accent, 0.2), 0.26)}" />
      <circle cx="${moonX + 28}" cy="268" r="112" fill="${rgba(lighten(palette.paper, 0.2), 0.2)}" />
      <path d="M60 1550C160 1390 360 1250 620 1230C880 1210 1090 1330 1160 ${hillRise}V1920H60Z" fill="${rgba(lighten(palette.mid, 0.16), 0.5)}" />
      <circle cx="330" cy="1420" r="96" fill="${rgba(lighten(palette.paper, 0.15), 0.22)}" />
      <circle cx="680" cy="1360" r="120" fill="${rgba(lighten(palette.accent, 0.08), 0.16)}" />
      <rect x="780" y="820" width="200" height="290" rx="80" fill="${rgba(lighten(palette.paper, 0.08), 0.18)}" />
    </g>
  `;
}

function sceneLearningAdventure(config, palette) {
  const slug = String(config.slug || "book");
  const orbit = 780 + Math.round(seeded(slug, "learning-orbit") * 180);
  return `
    <g filter="url(#soft-shadow)">
      <path d="M180 430C350 180 780 160 1020 430" stroke="${rgba(lighten(palette.accent, 0.16), 0.42)}" stroke-width="22" stroke-linecap="round" fill="none" />
      <path d="M240 540C420 320 740 320 930 540" stroke="${rgba(lighten(palette.paper, 0.12), 0.28)}" stroke-width="14" stroke-linecap="round" fill="none" />
      <circle cx="${orbit}" cy="340" r="44" fill="${rgba(lighten(palette.accent, 0.22), 0.34)}" />
      <rect x="230" y="980" width="280" height="220" rx="40" fill="${rgba(lighten(palette.paper, 0.12), 0.3)}" />
      <rect x="510" y="900" width="260" height="260" rx="54" fill="${rgba(lighten(palette.accent, 0.08), 0.26)}" />
      <rect x="780" y="840" width="190" height="320" rx="54" fill="${rgba(lighten(palette.paper, 0.06), 0.22)}" />
      <circle cx="340" cy="1088" r="24" fill="${rgba(palette.accent, 0.34)}" />
    </g>
  `;
}

function sceneBedtimeCalm(config, palette) {
  const slug = String(config.slug || "book");
  const moonX = 860 + Math.round(seeded(slug, "bedtime-moon") * 100);
  return `
    <g filter="url(#soft-shadow)">
      <circle cx="${moonX}" cy="280" r="130" fill="${rgba(lighten(palette.accent, 0.22), 0.28)}" />
      <circle cx="${moonX + 38}" cy="260" r="102" fill="${rgba(lighten(palette.paper, 0.18), 0.18)}" />
      <ellipse cx="720" cy="1420" rx="430" ry="220" fill="${rgba(lighten(palette.mid, 0.08), 0.22)}" />
      <path d="M160 1410C320 1280 540 1210 780 1230C960 1246 1100 1320 1180 1450" stroke="${rgba(lighten(palette.paper, 0.15), 0.22)}" stroke-width="12" fill="none" />
      <path d="M230 1530C390 1410 590 1350 790 1370C930 1384 1060 1440 1140 1530" stroke="${rgba(lighten(palette.accent, 0.16), 0.18)}" stroke-width="10" fill="none" />
    </g>
  `;
}

function sceneHeroBusiness(config, palette) {
  return `
    <g filter="url(#soft-shadow)">
      <rect x="88" y="170" width="1024" height="1500" rx="72" fill="${rgba(lighten(palette.mid, 0.04), 0.22)}" />
      <rect x="210" y="360" width="560" height="840" rx="34" fill="${rgba("#eadfcd", 0.94)}" transform="rotate(-10 490 780)" />
      <rect x="274" y="438" width="430" height="670" rx="22" fill="${rgba("#fbf6ee", 0.98)}" transform="rotate(-10 490 780)" />
      <circle cx="618" cy="948" r="26" fill="${rgba("#d3aa61", 0.18)}" />
      <rect x="290" y="1032" width="152" height="14" rx="7" fill="${rgba("#d3aa61", 0.14)}" transform="rotate(-10 366 1039)" />
      <rect x="802" y="494" width="126" height="690" rx="26" fill="${rgba("#2b251f", 0.78)}" transform="rotate(11 865 839)" />
      <rect x="858" y="542" width="12" height="600" rx="6" fill="${rgba("#d3aa61", 0.92)}" transform="rotate(11 864 842)" />
      <rect x="684" y="1116" width="232" height="132" rx="30" fill="${rgba(lighten(palette.mid, 0.14), 0.34)}" />
      <rect x="710" y="1140" width="180" height="18" rx="9" fill="${rgba("#f2ecdf", 0.52)}" />
      <rect x="710" y="1172" width="140" height="18" rx="9" fill="${rgba("#f2ecdf", 0.42)}" />
      <circle cx="900" cy="386" r="138" fill="${rgba(lighten(palette.accent, 0.18), 0.16)}" />
    </g>
    <path d="M170 1520C360 1380 572 1328 798 1362C936 1384 1040 1432 1122 1516" stroke="${rgba(lighten(palette.paper, 0.18), 0.12)}" stroke-width="10" fill="none" />
  `;
}

function sceneHeroExpertise(config, palette) {
  return `
    <g filter="url(#soft-shadow)">
      <rect x="140" y="210" width="920" height="1400" rx="70" fill="${rgba(lighten(palette.mid, 0.04), 0.2)}" />
      <rect x="210" y="360" width="470" height="980" rx="42" fill="${rgba("#efe6d7", 0.9)}" />
      <rect x="266" y="430" width="358" height="836" rx="24" fill="${rgba("#fbf6ee", 0.98)}" />
      <circle cx="814" cy="562" r="124" fill="${rgba("#d2b06a", 0.2)}" />
      <circle cx="814" cy="562" r="78" fill="${rgba("#efd7a0", 0.3)}" />
      <circle cx="814" cy="562" r="34" fill="${rgba("#aa7448", 0.45)}" />
      <rect x="760" y="816" width="182" height="114" rx="26" fill="${rgba("#2b2520", 0.72)}" />
      <rect x="786" y="848" width="130" height="16" rx="8" fill="${rgba("#f1eadf", 0.34)}" />
      <rect x="786" y="880" width="100" height="16" rx="8" fill="${rgba("#f1eadf", 0.24)}" />
      <rect x="736" y="1032" width="224" height="246" rx="32" fill="${rgba("#dfcfb6", 0.2)}" />
      <path d="M736 1220C784 1160 850 1126 932 1118" stroke="${rgba("#f0dbaf", 0.3)}" stroke-width="12" fill="none" stroke-linecap="round" />
      <path d="M300 1112C410 1060 520 1050 620 1082" stroke="${rgba("#d1ae6b", 0.16)}" stroke-width="10" fill="none" stroke-linecap="round" />
    </g>
  `;
}

function sceneHeroAi(config, palette) {
  return `
    <g filter="url(#soft-shadow)">
      <rect x="146" y="286" width="876" height="1220" rx="56" fill="${rgba(lighten(palette.mid, 0.04), 0.16)}" />
      <rect x="208" y="386" width="664" height="760" rx="42" fill="${rgba("#dfeae7", 0.12)}" />
      <rect x="274" y="472" width="208" height="152" rx="26" fill="${rgba("#f4faf9", 0.26)}" />
      <rect x="518" y="472" width="286" height="152" rx="26" fill="${rgba("#8de0cb", 0.2)}" />
      <rect x="274" y="664" width="530" height="188" rx="30" fill="${rgba("#f1f7f6", 0.14)}" />
      <rect x="274" y="896" width="262" height="176" rx="28" fill="${rgba("#f4faf9", 0.18)}" />
      <rect x="566" y="896" width="238" height="176" rx="28" fill="${rgba("#d6ece5", 0.18)}" />
      <rect x="866" y="590" width="126" height="640" rx="34" fill="${rgba(darken(palette.darkA, 0.08), 0.58)}" />
      <circle cx="240" cy="1272" r="88" fill="${rgba(lighten(palette.accent, 0.12), 0.18)}" />
      <rect x="210" y="1248" width="520" height="18" rx="9" fill="${rgba(lighten(palette.accent, 0.18), 0.42)}" />
      <rect x="370" y="1032" width="8" height="238" rx="4" fill="${rgba(lighten(palette.accent, 0.18), 0.52)}" />
      <rect x="654" y="760" width="8" height="514" rx="4" fill="${rgba(lighten(palette.accent, 0.18), 0.48)}" />
      <ellipse cx="936" cy="1280" rx="72" ry="28" fill="${rgba("#121925", 0.34)}" />
      <path d="M902 1278C926 1246 952 1246 970 1278" stroke="${rgba("#f2f7f5", 0.24)}" stroke-width="8" fill="none" stroke-linecap="round" />
    </g>
  `;
}

function sceneHeroEducation(config, palette) {
  return `
    <g filter="url(#soft-shadow)">
      <circle cx="888" cy="344" r="210" fill="${rgba(lighten(palette.accent, 0.22), 0.18)}" />
      <circle cx="888" cy="344" r="132" fill="${rgba(lighten(palette.paper, 0.16), 0.14)}" />
      <path d="M408 338C564 204 840 202 1010 346" stroke="${rgba(lighten(palette.paper, 0.14), 0.34)}" stroke-width="16" fill="none" stroke-linecap="round" />
      <path d="M452 412C610 304 816 308 948 424" stroke="${rgba(lighten(palette.accent, 0.16), 0.28)}" stroke-width="12" fill="none" stroke-linecap="round" />
      <path d="M230 1168L402 938L554 1168Z" fill="${rgba("#f8e8b3", 0.9)}" />
      <rect x="610" y="996" width="140" height="210" rx="26" fill="${rgba("#e8f3ff", 0.38)}" />
      <rect x="770" y="924" width="166" height="282" rx="40" fill="${rgba("#ffd6a3", 0.34)}" />
      <circle cx="680" cy="904" r="36" fill="${rgba("#92c5ff", 0.54)}" />
      <circle cx="848" cy="870" r="26" fill="${rgba("#ffe07a", 0.56)}" />
      <rect x="300" y="1260" width="380" height="54" rx="27" fill="${rgba(lighten(palette.paper, 0.12), 0.18)}" />
      <rect x="736" y="1276" width="174" height="22" rx="11" fill="${rgba(lighten(palette.accent, 0.12), 0.26)}" />
    </g>
  `;
}

function sceneHeroPersonal(config, palette) {
  return `
    <g filter="url(#soft-shadow)">
      <rect x="112" y="202" width="976" height="1416" rx="74" fill="${rgba(lighten(palette.mid, 0.04), 0.14)}" />
      <rect x="196" y="292" width="476" height="1084" rx="48" fill="${rgba("#e9e2d4", 0.84)}" />
      <rect x="256" y="372" width="356" height="824" rx="28" fill="${rgba("#faf5ed", 0.96)}" />
      <rect x="764" y="1030" width="154" height="154" rx="77" fill="${rgba("#ebe5dc", 0.28)}" />
      <circle cx="840" cy="1108" r="48" fill="${rgba("#d7c8b5", 0.34)}" />
      <ellipse cx="884" cy="1362" rx="120" ry="48" fill="${rgba(lighten(palette.paper, 0.08), 0.12)}" />
      <rect x="748" y="560" width="244" height="420" rx="28" fill="${rgba(darken(palette.darkA, 0.04), 0.34)}" />
      <path d="M716 518C816 382 924 322 1044 330" stroke="${rgba("#f2d59f", 0.34)}" stroke-width="18" fill="none" stroke-linecap="round" />
      <path d="M716 590C816 474 930 430 1040 440" stroke="${rgba("#fff8ef", 0.22)}" stroke-width="14" fill="none" stroke-linecap="round" />
    </g>
  `;
}

function chooseScene(config, palette) {
  const renderMode = String(config.renderMode || "").trim().toLowerCase();
  const family = String(config.coverVariantFamily || "").trim().toLowerCase();
  const branch = String(config.coverBranch || "").trim().toLowerCase();
  const genre = String(config.coverGenre || "").trim().toLowerCase();
  const motif = String(config.coverMotif || "").trim().toLowerCase();
  if (renderMode === "hero") {
    if (branch === "children") {
      if (family === "bedtime-calm" || motif === "bedtime-arc") return sceneBedtimeCalm(config, palette);
      if (family === "learning-adventure" || motif === "playful-arc" || motif === "tactile-learning") return sceneLearningAdventure(config, palette);
      return sceneStoryworld(config, palette);
    }
    if (genre === "expertise-authority") return sceneHeroExpertise(config, palette);
    if (genre === "education") return sceneHeroEducation(config, palette);
    if (genre === "ai-systems") return sceneHeroAi(config, palette);
    if (genre === "personal-development") return sceneHeroPersonal(config, palette);
    return sceneHeroBusiness(config, palette);
  }
  if (branch === "children") {
    if (family === "bedtime-calm" || motif === "bedtime-arc") return sceneBedtimeCalm(config, palette);
    if (family === "learning-adventure" || motif === "playful-arc" || motif === "tactile-learning") return sceneLearningAdventure(config, palette);
    return sceneStoryworld(config, palette);
  }
  if (family === "authority" || family === "authority-serif" || family === "instructor-premium" || motif === "folio" || motif === "seal") {
    return sceneAuthority(config, palette);
  }
  if (family === "warm-guide" || family === "modern-mentor" || family === "calm-tech" || family === "curious-learning" || family === "calm-focus" || family === "elevated-reset" || motif === "horizon" || motif === "atmospheric-light") {
    return sceneWarmGuide(config, palette);
  }
  return sceneOperator(config, palette);
}

function buildSvg(config) {
  const [gradA, gradB, gradC] = gradientColors(config.coverGradient);
  const childrenBranch = String(config.coverBranch || "").trim().toLowerCase() === "children";
  const palette = {
    accent: config.accentColor || gradA,
    paper: lighten(config.textAccent || "#f4efe7", 0.18),
    darkA: childrenBranch ? mix(gradA, "#fff4dd", 0.18) : darken(gradA, 0.58),
    darkB: childrenBranch ? mix(gradB, "#f2f0ff", 0.12) : darken(gradB, 0.64),
    darkC: childrenBranch ? mix(gradC, "#eef6ff", 0.08) : darken(gradC, 0.72),
    mid: childrenBranch ? mix(gradA, gradB, 0.46) : mix(gradB, gradC, 0.42),
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.darkA}" />
      <stop offset="52%" stop-color="${palette.darkB}" />
      <stop offset="100%" stop-color="${palette.darkC}" />
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="10%" r="60%">
      <stop offset="0%" stop-color="${rgba(palette.accent, 0.38)}" />
      <stop offset="100%" stop-color="${rgba(palette.accent, 0)}" />
    </radialGradient>
    <linearGradient id="veil" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${childrenBranch ? "rgba(255,255,255,0.02)" : "rgba(6,9,16,0.1)"}" />
      <stop offset="60%" stop-color="${childrenBranch ? "rgba(255,255,255,0.01)" : "rgba(5,8,14,0.04)"}" />
      <stop offset="100%" stop-color="${childrenBranch ? "rgba(6,12,24,0.08)" : "rgba(3,4,8,0.24)"}" />
    </linearGradient>
    <filter id="soft-shadow" x="-12%" y="-12%" width="128%" height="128%">
      <feDropShadow dx="0" dy="26" stdDeviation="34" flood-color="rgba(1,4,10,0.42)" />
    </filter>
    <filter id="grain" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" seed="8" />
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0 0 0.04" />
      </feComponentTransfer>
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)" />
  ${chooseScene(config, palette)}
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#veil)" />
  <rect width="${WIDTH}" height="${HEIGHT}" filter="url(#grain)" opacity="0.55" />
</svg>`;
}

function render(svg, outputPath) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
    font: { loadSystemFonts: false, defaultFontFamily: "Arial" },
  });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, resvg.render().asPng());
}

function main() {
  const args = parseArgs(process.argv);
  const configPath = args.config ? path.resolve(args.config) : "";
  const outputPath = args.output ? path.resolve(args.output) : "";
  if (!configPath || !fs.existsSync(configPath)) {
    throw new Error(`Missing --config JSON path: ${configPath}`);
  }
  if (!outputPath) {
    throw new Error("Missing --output path");
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const svg = buildSvg(config);
  const svgPath = args.svg ? path.resolve(args.svg) : outputPath.replace(/\.(png|jpg|jpeg|webp)$/i, ".svg");

  fs.mkdirSync(path.dirname(svgPath), { recursive: true });
  fs.writeFileSync(svgPath, svg, "utf8");
  render(svg, outputPath);

  process.stdout.write(
    JSON.stringify(
      {
        svg: svgPath,
        png: outputPath,
        family: config.coverVariantFamily || "operator",
      },
      null,
      2,
    ),
  );
}

main();
