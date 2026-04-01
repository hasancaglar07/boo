export type PublisherLogoPreset = {
  id: string;
  imprint: string;
  mark: string;
  url: string;
};

type LogoSeed = {
  id: string;
  imprint: string;
  mark: string;
  bg: string;
  fg: string;
  accent: string;
  shape: "circle" | "square" | "arch" | "diamond" | "bar";
};

function makeSvgLogo(seed: LogoSeed) {
  const frame =
    seed.shape === "circle"
      ? `<circle cx="56" cy="56" r="34" fill="${seed.accent}" opacity="0.94" />`
      : seed.shape === "square"
        ? `<rect x="22" y="22" width="68" height="68" rx="22" fill="${seed.accent}" opacity="0.94" />`
        : seed.shape === "arch"
          ? `<path d="M24 90V54c0-18 14-32 32-32s32 14 32 32v36Z" fill="${seed.accent}" opacity="0.94" />`
          : seed.shape === "diamond"
            ? `<path d="M56 18 92 54 56 90 20 54Z" fill="${seed.accent}" opacity="0.94" />`
            : `<rect x="18" y="40" width="76" height="32" rx="16" fill="${seed.accent}" opacity="0.94" />`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112" fill="none">
      <rect width="112" height="112" rx="28" fill="${seed.bg}" />
      ${frame}
      <text x="56" y="66" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="700" fill="${seed.fg}" letter-spacing="2">${seed.mark}</text>
      <path d="M28 92h56" stroke="${seed.fg}" stroke-opacity="0.26" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const SEEDS: LogoSeed[] = [
  { id: "north-peak", imprint: "North Peak Press", mark: "NP", bg: "#1d1a17", fg: "#f3ece2", accent: "#b96a42", shape: "arch" },
  { id: "lighthouse", imprint: "Lighthouse Editions", mark: "LE", bg: "#0f1a22", fg: "#eef3f7", accent: "#6ea3d5", shape: "circle" },
  { id: "cedar-house", imprint: "Cedar House Books", mark: "CH", bg: "#211a15", fg: "#f6efe4", accent: "#8e6b4f", shape: "square" },
  { id: "atlas", imprint: "Atlas Narrative", mark: "AN", bg: "#171717", fg: "#faf7f2", accent: "#d1944a", shape: "diamond" },
  { id: "ivory", imprint: "Ivory Lane Press", mark: "IL", bg: "#f1e8dc", fg: "#2c241d", accent: "#d8b07d", shape: "bar" },
  { id: "sable", imprint: "Sable Quill", mark: "SQ", bg: "#111215", fg: "#f6f2eb", accent: "#7e5b9a", shape: "circle" },
  { id: "oak", imprint: "Oakline Studio", mark: "OS", bg: "#1b1816", fg: "#f6eee4", accent: "#7b945a", shape: "square" },
  { id: "crown", imprint: "Crown Harbour Books", mark: "CB", bg: "#182028", fg: "#eef1f4", accent: "#5ea7c4", shape: "arch" },
  { id: "chapter", imprint: "Chapter Foundry", mark: "CF", bg: "#161617", fg: "#f8f5ef", accent: "#cf7b51", shape: "diamond" },
  { id: "ember", imprint: "Ember Slate Press", mark: "ES", bg: "#201714", fg: "#f6ede8", accent: "#ce6f57", shape: "bar" },
  { id: "folium", imprint: "Folium House", mark: "FH", bg: "#12201b", fg: "#f0f5ef", accent: "#66a182", shape: "circle" },
  { id: "aurora", imprint: "Aurora Bound", mark: "AB", bg: "#171622", fg: "#f4f2f7", accent: "#8f79d9", shape: "square" },
  { id: "marble", imprint: "Marble Row", mark: "MR", bg: "#efebe3", fg: "#261f18", accent: "#cab49a", shape: "diamond" },
  { id: "granite", imprint: "Granite Shelf", mark: "GS", bg: "#1a1b1d", fg: "#f6f6f6", accent: "#9a9ca4", shape: "arch" },
  { id: "verve", imprint: "Verve Editions", mark: "VE", bg: "#241d19", fg: "#fbf0e6", accent: "#e18855", shape: "circle" },
  { id: "maple", imprint: "Maple Street Books", mark: "MS", bg: "#f4ebe1", fg: "#33271e", accent: "#c7845f", shape: "square" },
  { id: "signal", imprint: "Signal & Story", mark: "SS", bg: "#121720", fg: "#f4f7fb", accent: "#4b87c9", shape: "bar" },
  { id: "harbor", imprint: "Harborline Press", mark: "HP", bg: "#1a1e24", fg: "#f3f5f6", accent: "#8796b1", shape: "diamond" },
  { id: "river", imprint: "Riverstone Books", mark: "RB", bg: "#152120", fg: "#edf4f2", accent: "#4ea597", shape: "arch" },
  { id: "summit", imprint: "Summit Ink", mark: "SI", bg: "#17181a", fg: "#f8f4ef", accent: "#d8a266", shape: "circle" },
  { id: "elm", imprint: "Elm House Media", mark: "EH", bg: "#1a1e16", fg: "#f2f1ea", accent: "#97a66c", shape: "bar" },
  { id: "noir", imprint: "Noir Ledger", mark: "NL", bg: "#101012", fg: "#fbf8f2", accent: "#b1a79b", shape: "square" },
  { id: "quartz", imprint: "Quartz Chapter", mark: "QC", bg: "#f4f1eb", fg: "#2d2822", accent: "#c6b8a7", shape: "circle" },
  { id: "bluebird", imprint: "Bluebird Editions", mark: "BE", bg: "#13202a", fg: "#eef5fb", accent: "#5b98cf", shape: "arch" },
  { id: "redwood", imprint: "Redwood Atlas", mark: "RA", bg: "#1d1413", fg: "#f8eeea", accent: "#ba6f68", shape: "diamond" },
  { id: "sage", imprint: "Sage Narrative", mark: "SN", bg: "#172019", fg: "#eff4ef", accent: "#7fa27d", shape: "square" },
  { id: "copper", imprint: "Copperline Press", mark: "CP", bg: "#221912", fg: "#f7ece3", accent: "#c47b49", shape: "bar" },
  { id: "willow", imprint: "Willow & Word", mark: "WW", bg: "#1b1d18", fg: "#f4f1eb", accent: "#9fa981", shape: "circle" },
  { id: "studio", imprint: "Studio Meridian", mark: "SM", bg: "#14171f", fg: "#f5f6fa", accent: "#6f83ce", shape: "diamond" },
  { id: "brook", imprint: "Brookline Books", mark: "BB", bg: "#f1ede6", fg: "#2c241f", accent: "#d0b491", shape: "arch" },
];

export const PUBLISHER_LOGO_PRESETS: PublisherLogoPreset[] = SEEDS.map((seed) => ({
  id: seed.id,
  imprint: seed.imprint,
  mark: seed.mark,
  url: makeSvgLogo(seed),
}));

export function pickRandomPublisherLogo() {
  return PUBLISHER_LOGO_PRESETS[Math.floor(Math.random() * PUBLISHER_LOGO_PRESETS.length)];
}
