export type SiteRealBook = {
  slug: string;
  title: string;
  author: string;
  category: string;
  language: string;
  palette: [string, string, string];
  publicCoverAsset?: string;
};

const SITE_BOOK_ASSET_VERSION = "20260403-public-cover-sync-1";

function normalizeSiteAssetFileName(assetName: string) {
  return assetName.split("/").filter(Boolean).pop() || assetName;
}

export function siteExampleAssetUrl(slug: string, assetName = "front_cover_final.png") {
  const fileName = normalizeSiteAssetFileName(assetName);
  return `/showcase-covers/${encodeURIComponent(slug)}/${encodeURIComponent(fileName)}?v=${SITE_BOOK_ASSET_VERSION}`;
}

export function siteExamplePublicCoverAsset(slug: string) {
  return SITE_REAL_BOOK_LOOKUP[slug]?.publicCoverAsset || "front_cover_final.png";
}

export function siteExamplePublicCoverUrl(slug: string) {
  return siteExampleAssetUrl(slug, siteExamplePublicCoverAsset(slug));
}

export const SITE_REAL_BOOKS: SiteRealBook[] = [
  {
    slug: "authority-in-100-pages",
    title: "Authority in 100 Pages",
    author: "Mara Ellison",
    category: "Business Playbook",
    language: "English",
    palette: ["#7a4a2f", "#f3c37a", "#fff8ef"],
    publicCoverAsset: "front_cover_clean-signal-exact.png",
  },
  {
    slug: "silent-offers",
    title: "Silent Offers",
    author: "Jonah Vale",
    category: "Creator & Marketing",
    language: "English",
    palette: ["#21405f", "#86c6ff", "#f3f9ff"],
  },
  {
    slug: "prompt-systems-for-small-teams",
    title: "Prompt Systems for Small Teams",
    author: "Priya North",
    category: "AI Workflow Guide",
    language: "English",
    palette: ["#284b3f", "#7de2b8", "#f1fff9"],
    publicCoverAsset: "front_cover_signal-grid-signature_studio.png",
  },
  {
    slug: "parent-friendly-stem-at-home",
    title: "Parent-Friendly STEM at Home",
    author: "Lena Park",
    category: "Education Book",
    language: "English",
    palette: ["#6d3f7e", "#d8a6ff", "#fbf4ff"],
    publicCoverAsset: "front_cover_workbook-clear-signature_studio.png",
  },
  {
    slug: "focus-by-design",
    title: "Focus by Design",
    author: "Elaine Mercer",
    category: "Personal Development",
    language: "English",
    palette: ["#8a3b4b", "#ff9db4", "#fff5f8"],
    publicCoverAsset: "front_cover_calm-focus-signature_studio.png",
  },
  {
    slug: "quiet-leadership-for-remote-teams",
    title: "Quiet Leadership for Remote Teams",
    author: "Nadia Brooks",
    category: "Leadership Guide",
    language: "English",
    palette: ["#3a4b8f", "#a8bcff", "#f5f7ff"],
  },
  {
    slug: "uzmanligini-kitaba-donustur",
    title: "Uzmanlığını Kitaba Dönüştür",
    author: "Selin Karaca",
    category: "Uzmanlık Rehberi",
    language: "Türkçe",
    palette: ["#8c5a21", "#ffc872", "#fff9ef"],
  },
  {
    slug: "yapay-zeka-ile-premium-hizmet-sistemi",
    title: "Yapay Zeka ile Premium Hizmet Sistemi",
    author: "Mina Ersoy",
    category: "AI Workflow Guide",
    language: "Türkçe",
    palette: ["#4d5f23", "#c7ef76", "#f9ffe9"],
  },
  {
    slug: "tu-metodo-hecho-libro",
    title: "Tu Método Hecho Libro",
    author: "Lucía Ferrer",
    category: "Expertise Guide",
    language: "Español",
    palette: ["#23556f", "#7fcde7", "#f2fbff"],
    publicCoverAsset: "front_cover_modern-mentor-exact.png",
  },
  {
    slug: "productividad-profunda-con-ia",
    title: "Productividad Profunda con IA",
    author: "Carla Montes",
    category: "AI Workflow Guide",
    language: "Español",
    palette: ["#214f45", "#89e3ce", "#effffb"],
  },
  {
    slug: "ia-pratica-para-negocios-pequenos",
    title: "IA Prática para Negócios Pequenos",
    author: "Rafael Couto",
    category: "AI Workflow Guide",
    language: "Português",
    palette: ["#384989", "#9eb4ff", "#f3f6ff"],
    publicCoverAsset: "front_cover_signal-grid-signature_studio.png",
  },
  {
    slug: "votre-methode-devient-un-livre",
    title: "Votre Méthode Devient un Livre",
    author: "Camille Durand",
    category: "Expertise Guide",
    language: "Français",
    palette: ["#3e6f54", "#9de3b8", "#f4fff7"],
  },
  {
    slug: "clarte-calme-execution",
    title: "Clarté, Calme, Exécution",
    author: "Élise Martin",
    category: "Personal Development",
    language: "Français",
    palette: ["#1b5960", "#7bdde6", "#effeff"],
    publicCoverAsset: "front_cover_soft-discipline.png",
  },
  {
    slug: "il-libro-che-vende-la-tua-competenza",
    title: "Il Libro che Vende la Tua Competenza",
    author: "Giulia Rinaldi",
    category: "Expertise Guide",
    language: "Italiano",
    palette: ["#2a6758", "#8ae1c8", "#f1fff9"],
  },
];

export const SITE_REAL_BOOK_LOOKUP = Object.fromEntries(
  SITE_REAL_BOOKS.map((book) => [book.slug, book] as const),
) as Record<string, SiteRealBook>;

function hashSeed(seed: string) {
  let hash = 0;
  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export function getSeededSiteBooks(seed: string, count: number) {
  if (count <= 0 || !SITE_REAL_BOOKS.length) return [];

  const pool = [...SITE_REAL_BOOKS];
  const selected: SiteRealBook[] = [];
  let state = hashSeed(seed) || 1;

  while (pool.length && selected.length < count) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const index = state % pool.length;
    selected.push(pool.splice(index, 1)[0]);
  }

  return selected;
}
