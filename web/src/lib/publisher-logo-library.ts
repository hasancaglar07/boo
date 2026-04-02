export type PublisherLogoPreset = {
  id: string;
  imprint: string;
  mark: string;
  family: "heritage" | "masthead" | "studio" | "letterpress";
  url: string;
};

type LogoFrame = "seal" | "plate" | "shield" | "arch" | "diamond";
type LogoSymbol =
  | "summit"
  | "lighthouse"
  | "cedar"
  | "atlas"
  | "column"
  | "quill"
  | "oak"
  | "crown"
  | "book"
  | "ember"
  | "folium"
  | "aurora"
  | "granite"
  | "signal"
  | "anchor"
  | "river"
  | "bluebird"
  | "redwood"
  | "compass"
  | "ledger";

type LogoFamily = PublisherLogoPreset["family"];

type LogoSeed = {
  id: string;
  imprint: string;
  mark: string;
  descriptor: string;
  family: LogoFamily;
  bg: string;
  panel: string;
  fg: string;
  accent: string;
  frame: LogoFrame;
  symbol: LogoSymbol;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

function stroke(color: string, width = 2.15) {
  return `stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;
}

function renderFrame(seed: LogoSeed) {
  const panelStroke = `stroke="${seed.accent}" stroke-opacity="0.34" stroke-width="1.45"`;
  switch (seed.frame) {
    case "seal":
      return `
        <circle cx="0" cy="0" r="26" fill="${seed.panel}" />
        <circle cx="0" cy="0" r="26" ${panelStroke} fill="none" />
        <circle cx="0" cy="0" r="20.5" stroke="${seed.fg}" stroke-opacity="0.14" stroke-width="1.15" fill="none" />
      `;
    case "plate":
      return `
        <rect x="-27" y="-22" width="54" height="44" rx="16" fill="${seed.panel}" />
        <rect x="-27" y="-22" width="54" height="44" rx="16" ${panelStroke} fill="none" />
      `;
    case "shield":
      return `
        <path d="M0 -26C14 -26 24 -18 24 -3C24 14 13 25 0 31C-13 25 -24 14 -24 -3C-24 -18 -14 -26 0 -26Z" fill="${seed.panel}" />
        <path d="M0 -26C14 -26 24 -18 24 -3C24 14 13 25 0 31C-13 25 -24 14 -24 -3C-24 -18 -14 -26 0 -26Z" ${panelStroke} fill="none" />
      `;
    case "arch":
      return `
        <path d="M-25 25V-2C-25 -17 -14 -27 0 -27C14 -27 25 -17 25 -2V25Z" fill="${seed.panel}" />
        <path d="M-25 25V-2C-25 -17 -14 -27 0 -27C14 -27 25 -17 25 -2V25Z" ${panelStroke} fill="none" />
      `;
    case "diamond":
      return `
        <path d="M0 -28L26 0L0 28L-26 0Z" fill="${seed.panel}" />
        <path d="M0 -28L26 0L0 28L-26 0Z" ${panelStroke} fill="none" />
      `;
  }
}

function renderSymbol(seed: LogoSeed) {
  const iconStroke = stroke(seed.fg, 2.2);
  const accentStroke = stroke(seed.accent, 1.8);

  switch (seed.symbol) {
    case "summit":
      return `
        <circle cx="14" cy="-14" r="3.4" fill="${seed.accent}" />
        <path d="M-18 15L-8 -5L1 8L11 -10L20 15" ${iconStroke} fill="none" />
        <path d="M-4 15L1 8L7 15" ${accentStroke} fill="none" />
      `;
    case "lighthouse":
      return `
        <path d="M0 -18L8 -11L6 16H-6L-8 -11Z" fill="${seed.fg}" fill-opacity="0.06" ${iconStroke} />
        <path d="M-11 -10H11" ${iconStroke} fill="none" />
        <path d="M0 -18V16" ${iconStroke} fill="none" />
        <path d="M12 -10L21 -14M13 -3L22 -3" ${accentStroke} fill="none" />
      `;
    case "cedar":
      return `
        <path d="M0 -19L10 -6H5L13 6H7L16 17H-16L-7 6H-13L-5 -6H-10Z" fill="${seed.fg}" fill-opacity="0.06" ${iconStroke} />
        <path d="M0 6V17" ${iconStroke} fill="none" />
      `;
    case "atlas":
      return `
        <circle cx="0" cy="0" r="15.5" ${iconStroke} fill="none" />
        <path d="M-15 0H15M0 -15V15" ${iconStroke} fill="none" />
        <path d="M-9 -12C-5 -4 -5 4 -9 12M9 -12C5 -4 5 4 9 12" ${iconStroke} fill="none" />
        <path d="M-12 -8C-4 -5 4 -5 12 -8M-12 8C-4 5 4 5 12 8" ${accentStroke} fill="none" />
      `;
    case "column":
      return `
        <path d="M-12 -14H12M-10 -10H10M-8 -10V12M8 -10V12M-12 15H12M-10 11H10" ${iconStroke} fill="none" />
        <path d="M-2 -10V12M2 -10V12" ${accentStroke} fill="none" />
      `;
    case "quill":
      return `
        <path d="M-16 16C-10 6 -1 -3 17 -18C11 -3 4 7 -6 17Z" fill="${seed.fg}" fill-opacity="0.06" ${iconStroke} />
        <path d="M-7 10L9 -6" ${iconStroke} fill="none" />
        <path d="M-1 4L5 10" ${accentStroke} fill="none" />
      `;
    case "oak":
      return `
        <path d="M0 -18C8 -18 12 -12 12 -6C12 -2 10 0 8 2C10 4 11 7 11 10C11 16 6 20 0 20C-6 20 -11 16 -11 10C-11 7 -10 4 -8 2C-10 0 -12 -2 -12 -6C-12 -12 -8 -18 0 -18Z" fill="${seed.fg}" fill-opacity="0.06" ${iconStroke} />
        <path d="M0 4V19" ${accentStroke} fill="none" />
      `;
    case "crown":
      return `
        <path d="M-18 12L-12 -6L-2 3L8 -10L18 12V16H-18Z" fill="${seed.fg}" fill-opacity="0.06" ${iconStroke} />
        <circle cx="-12" cy="-6" r="2.2" fill="${seed.accent}" />
        <circle cx="-2" cy="3" r="2.2" fill="${seed.accent}" />
        <circle cx="8" cy="-10" r="2.2" fill="${seed.accent}" />
      `;
    case "book":
      return `
        <path d="M-18 -9C-13 -12 -8 -13 0 -13C8 -13 13 -12 18 -9V15C13 12 8 11 0 11C-8 11 -13 12 -18 15Z" fill="${seed.fg}" fill-opacity="0.05" ${iconStroke} />
        <path d="M0 -13V15" ${iconStroke} fill="none" />
        <path d="M-12 -5C-8 -6 -4 -6 0 -5M0 -5C4 -6 8 -6 12 -5" ${accentStroke} fill="none" />
      `;
    case "ember":
      return `
        <path d="M0 -17C8 -9 10 -3 10 2C10 10 5 17 0 20C-5 17 -10 10 -10 2C-10 -3 -7 -8 0 -17Z" fill="${seed.fg}" fill-opacity="0.06" ${iconStroke} />
        <path d="M0 -6C4 -2 5 1 5 4C5 8 3 11 0 13C-3 11 -5 8 -5 4C-5 1 -3 -2 0 -6Z" fill="${seed.accent}" fill-opacity="0.92" />
      `;
    case "folium":
      return `
        <path d="M0 -18C12 -13 18 -4 18 6C18 14 12 19 4 19C-7 19 -14 10 -14 0C-14 -8 -10 -13 0 -18Z" fill="${seed.fg}" fill-opacity="0.06" ${iconStroke} />
        <path d="M-3 15C1 6 5 -1 12 -10" ${accentStroke} fill="none" />
      `;
    case "aurora":
      return `
        <path d="M0 -18L4 -4L18 0L4 4L0 18L-4 4L-18 0L-4 -4Z" fill="${seed.fg}" fill-opacity="0.06" ${iconStroke} />
        <path d="M0 -24V-18M18 0H24M0 18V24M-18 0H-24" ${accentStroke} fill="none" />
      `;
    case "granite":
      return `
        <path d="M-14 -14H10C14 -14 17 -11 17 -7V15H-14Z" fill="${seed.fg}" fill-opacity="0.06" ${iconStroke} />
        <path d="M-17 -2H14M-17 7H14" ${iconStroke} fill="none" />
        <path d="M-7 -14V15" ${accentStroke} fill="none" />
      `;
    case "signal":
      return `
        <circle cx="0" cy="4" r="2.6" fill="${seed.accent}" />
        <path d="M-12 4C-9 -2 -3 -5 0 -5C3 -5 9 -2 12 4" ${iconStroke} fill="none" />
        <path d="M-18 5C-14 -7 -5 -12 0 -12C5 -12 14 -7 18 5" ${accentStroke} fill="none" />
      `;
    case "anchor":
      return `
        <path d="M0 -17V8M-14 3C-12 12 -7 17 0 19C7 17 12 12 14 3M-10 3H10" ${iconStroke} fill="none" />
        <circle cx="0" cy="-19" r="3" fill="none" ${accentStroke} />
      `;
    case "river":
      return `
        <path d="M-18 -4C-12 -8 -6 -8 0 -4C6 0 12 0 18 -4" ${iconStroke} fill="none" />
        <path d="M-18 8C-12 4 -6 4 0 8C6 12 12 12 18 8" ${iconStroke} fill="none" />
        <circle cx="-10" cy="-13" r="3" fill="${seed.accent}" fill-opacity="0.85" />
      `;
    case "bluebird":
      return `
        <path d="M-17 9C-9 -9 7 -12 18 -3C11 -3 6 0 3 4C9 4 14 8 18 14C5 14 -7 13 -17 9Z" fill="${seed.fg}" fill-opacity="0.06" ${iconStroke} />
        <path d="M2 4C4 1 8 -1 12 -2" ${accentStroke} fill="none" />
      `;
    case "redwood":
      return `
        <path d="M0 -19L7 -3H3L10 10H4L12 19H-12L-4 10H-10L-3 -3H-7Z" fill="${seed.fg}" fill-opacity="0.06" ${iconStroke} />
        <path d="M0 4V19" ${accentStroke} fill="none" />
      `;
    case "compass":
      return `
        <circle cx="0" cy="0" r="16" ${iconStroke} fill="none" />
        <path d="M0 -16V16M-16 0H16" ${accentStroke} fill="none" />
        <path d="M0 -11L6 0L0 11L-6 0Z" fill="${seed.fg}" fill-opacity="0.06" ${iconStroke} />
      `;
    case "ledger":
      return `
        <rect x="-13" y="-17" width="26" height="34" rx="6" fill="${seed.fg}" fill-opacity="0.05" ${iconStroke} />
        <path d="M-7 -8H7M-7 -1H7M-7 6H5" ${iconStroke} fill="none" />
        <path d="M-5 -17V17" ${accentStroke} fill="none" />
      `;
  }
}

function renderBadge(seed: LogoSeed, x: number, y: number, scale = 1.35) {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      ${renderFrame(seed)}
      ${renderSymbol(seed)}
    </g>
  `;
}

function renderHeritageLogo(seed: LogoSeed) {
  const id = escapeXml(seed.id);
  const wordmark = escapeXml(seed.mark);
  const descriptor = escapeXml(seed.descriptor);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="520" height="208" viewBox="0 0 520 208" fill="none">
      <defs>
        <linearGradient id="${id}-paper" x1="24" y1="20" x2="486" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="${seed.bg}" />
          <stop offset="1" stop-color="${seed.panel}" />
        </linearGradient>
      </defs>
      <rect x="12" y="14" width="496" height="180" rx="30" fill="url(#${id}-paper)" />
      <rect x="12.8" y="14.8" width="494.4" height="178.4" rx="29.2" stroke="${seed.fg}" stroke-opacity="0.12" stroke-width="1.4" />
      <rect x="34" y="40" width="134" height="128" rx="28" fill="${seed.panel}" />
      <rect x="34.8" y="40.8" width="132.4" height="126.4" rx="27.2" stroke="${seed.fg}" stroke-opacity="0.1" stroke-width="1.2" />
      ${renderBadge(seed, 101, 103, 1.55)}
      <path d="M198 73H224" stroke="${seed.accent}" stroke-width="2.6" stroke-linecap="round" />
      <text x="198" y="114" font-family="'Libre Bodoni', Georgia, 'Times New Roman', serif" font-size="34" font-weight="700" fill="${seed.fg}">${wordmark}</text>
      <text x="198" y="146" font-family="'Public Sans', Arial, sans-serif" font-size="12.5" font-weight="700" letter-spacing="4.4" fill="${seed.fg}" fill-opacity="0.7">${descriptor}</text>
      <path d="M198 159H322" stroke="${seed.fg}" stroke-opacity="0.15" stroke-width="1.4" stroke-linecap="round" />
    </svg>
  `;
}

function renderMastheadLogo(seed: LogoSeed) {
  const wordmark = escapeXml(seed.mark);
  const descriptor = escapeXml(seed.descriptor);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="520" height="208" viewBox="0 0 520 208" fill="none">
      <rect x="12" y="18" width="496" height="172" rx="18" fill="${seed.bg}" />
      <path d="M42 66H144" stroke="${seed.accent}" stroke-width="1.8" stroke-linecap="round" />
      <path d="M376 66H478" stroke="${seed.accent}" stroke-width="1.8" stroke-linecap="round" />
      ${renderBadge(seed, 260, 62, 0.92)}
      <text x="260" y="123" text-anchor="middle" font-family="'Libre Bodoni', Georgia, 'Times New Roman', serif" font-size="40" font-weight="700" fill="${seed.fg}">${wordmark}</text>
      <text x="260" y="152" text-anchor="middle" font-family="'Public Sans', Arial, sans-serif" font-size="12.5" font-weight="700" letter-spacing="5" fill="${seed.fg}" fill-opacity="0.74">${descriptor}</text>
    </svg>
  `;
}

function renderStudioLogo(seed: LogoSeed) {
  const wordmark = escapeXml(seed.mark);
  const descriptor = escapeXml(seed.descriptor);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="520" height="208" viewBox="0 0 520 208" fill="none">
      <rect x="12" y="22" width="496" height="164" rx="24" fill="${seed.bg}" />
      <rect x="28" y="44" width="464" height="120" rx="22" fill="${seed.panel}" />
      <rect x="28.8" y="44.8" width="462.4" height="118.4" rx="21.2" stroke="${seed.accent}" stroke-opacity="0.22" stroke-width="1.3" />
      <rect x="44" y="64" width="84" height="80" rx="18" fill="${seed.bg}" />
      ${renderBadge(seed, 86, 104, 1.12)}
      <text x="154" y="97" font-family="'Public Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="5" fill="${seed.accent}">${descriptor}</text>
      <text x="154" y="132" font-family="'Public Sans', Arial, sans-serif" font-size="31" font-weight="700" fill="${seed.fg}">${wordmark}</text>
      <path d="M154 144H312" stroke="${seed.fg}" stroke-opacity="0.16" stroke-width="1.6" stroke-linecap="round" />
    </svg>
  `;
}

function renderLetterpressLogo(seed: LogoSeed) {
  const wordmark = escapeXml(seed.mark);
  const descriptor = escapeXml(seed.descriptor);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="520" height="208" viewBox="0 0 520 208" fill="none">
      <rect x="12" y="16" width="496" height="176" rx="22" fill="${seed.bg}" />
      <rect x="12.8" y="16.8" width="494.4" height="174.4" rx="21.2" stroke="${seed.fg}" stroke-opacity="0.1" stroke-width="1.2" />
      <path d="M70 104H192" stroke="${seed.fg}" stroke-opacity="0.18" stroke-width="1.4" stroke-linecap="round" />
      <path d="M328 104H450" stroke="${seed.fg}" stroke-opacity="0.18" stroke-width="1.4" stroke-linecap="round" />
      ${renderBadge(seed, 260, 104, 1.08)}
      <text x="260" y="72" text-anchor="middle" font-family="'Public Sans', Arial, sans-serif" font-size="12.5" font-weight="700" letter-spacing="4.6" fill="${seed.accent}">${descriptor}</text>
      <text x="260" y="156" text-anchor="middle" font-family="'Libre Bodoni', Georgia, 'Times New Roman', serif" font-size="38" font-weight="700" fill="${seed.fg}">${wordmark}</text>
    </svg>
  `;
}

function makeSvgLogo(seed: LogoSeed) {
  const svg =
    seed.family === "heritage"
      ? renderHeritageLogo(seed)
      : seed.family === "masthead"
      ? renderMastheadLogo(seed)
      : seed.family === "studio"
      ? renderStudioLogo(seed)
      : renderLetterpressLogo(seed);

  return svgDataUri(svg);
}

const SEEDS: LogoSeed[] = [
  { id: "north-peak", imprint: "North Peak Press", mark: "North Peak", descriptor: "PRESS", family: "heritage", bg: "#faf5ee", panel: "#f0e5d7", fg: "#2f241d", accent: "#bf8754", frame: "arch", symbol: "summit" },
  { id: "cedar-house", imprint: "Cedar House Books", mark: "Cedar House", descriptor: "BOOKS", family: "heritage", bg: "#f7f2eb", panel: "#eee4d8", fg: "#2b241f", accent: "#a88463", frame: "plate", symbol: "cedar" },
  { id: "crown-harbour", imprint: "Crown Harbour Books", mark: "Crown Harbour", descriptor: "COLLECTED WORKS", family: "heritage", bg: "#f4efe7", panel: "#e9dfd1", fg: "#2b221c", accent: "#b99a66", frame: "shield", symbol: "crown" },
  { id: "redwood-atlas", imprint: "Redwood Atlas", mark: "Redwood Atlas", descriptor: "FIELD GUIDES", family: "heritage", bg: "#f8efec", panel: "#efdfda", fg: "#311f1d", accent: "#bf7167", frame: "shield", symbol: "redwood" },

  { id: "lighthouse", imprint: "Lighthouse Editions", mark: "Lighthouse", descriptor: "EDITIONS", family: "masthead", bg: "#f5f7fb", panel: "#e8eef7", fg: "#203041", accent: "#7fa5cb", frame: "shield", symbol: "lighthouse" },
  { id: "atlas-narrative", imprint: "Atlas Narrative", mark: "Atlas Narrative", descriptor: "INDEPENDENT IMPRINT", family: "masthead", bg: "#f4f2ef", panel: "#ebe7e2", fg: "#232226", accent: "#ca965d", frame: "seal", symbol: "atlas" },
  { id: "aurora-bound", imprint: "Aurora Bound", mark: "Aurora Bound", descriptor: "SPECIAL EDITIONS", family: "masthead", bg: "#f4f1fb", panel: "#e8e3f5", fg: "#2d2442", accent: "#8d7bd8", frame: "diamond", symbol: "aurora" },
  { id: "bluebird-editions", imprint: "Bluebird Editions", mark: "Bluebird", descriptor: "EDITION HOUSE", family: "masthead", bg: "#f2f7fc", panel: "#e5eef8", fg: "#213547", accent: "#6b9fd2", frame: "seal", symbol: "bluebird" },

  { id: "signal-story", imprint: "Signal & Story", mark: "Signal & Story", descriptor: "MODERN IMPRINT", family: "studio", bg: "#f4f4f2", panel: "#1f1b18", fg: "#f7f3ec", accent: "#d8a159", frame: "plate", symbol: "signal" },
  { id: "studio-meridian", imprint: "Studio Meridian", mark: "Studio Meridian", descriptor: "EDITORIAL STUDIO", family: "studio", bg: "#eef1f7", panel: "#21293a", fg: "#f6f8fb", accent: "#8097dc", frame: "diamond", symbol: "compass" },
  { id: "granite-shelf", imprint: "Granite Shelf", mark: "Granite Shelf", descriptor: "NONFICTION SERIES", family: "studio", bg: "#f1f1f2", panel: "#26282d", fg: "#f4f5f6", accent: "#a7adb8", frame: "arch", symbol: "granite" },
  { id: "riverstone", imprint: "Riverstone Books", mark: "Riverstone", descriptor: "BOOKS", family: "studio", bg: "#eff6f5", panel: "#223732", fg: "#f2f7f6", accent: "#64a99c", frame: "arch", symbol: "river" },

  { id: "ember-slate", imprint: "Ember Slate Press", mark: "Ember Slate", descriptor: "LITERARY PRESS", family: "letterpress", bg: "#faf1eb", panel: "#f2e3d9", fg: "#34231c", accent: "#d97957", frame: "seal", symbol: "ember" },
  { id: "sable-quill", imprint: "Sable Quill", mark: "Sable Quill", descriptor: "ESSAYS & REVIEW", family: "letterpress", bg: "#f6f1f7", panel: "#ece5f0", fg: "#2a2031", accent: "#9672b3", frame: "shield", symbol: "quill" },
  { id: "folium-house", imprint: "Folium House", mark: "Folium House", descriptor: "NATURE WRITING", family: "letterpress", bg: "#f1f7f2", panel: "#e4eee5", fg: "#243427", accent: "#6f9f83", frame: "seal", symbol: "folium" },
  { id: "noir-ledger", imprint: "Noir Ledger", mark: "Noir Ledger", descriptor: "ARCHIVE PRESS", family: "letterpress", bg: "#f5f2ee", panel: "#e9e3dc", fg: "#2c2623", accent: "#a99f93", frame: "plate", symbol: "ledger" },
];

export const PUBLISHER_LOGO_PRESETS: PublisherLogoPreset[] = SEEDS.map((seed) => ({
  id: seed.id,
  imprint: seed.imprint,
  mark: seed.mark,
  family: seed.family,
  url: makeSvgLogo(seed),
}));

export function pickRandomPublisherLogo() {
  return PUBLISHER_LOGO_PRESETS[Math.floor(Math.random() * PUBLISHER_LOGO_PRESETS.length)];
}
