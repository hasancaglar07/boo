import "server-only";

import { promises as fs } from "fs";
import path from "path";

export type ShowcasePortfolioEntry = {
  slug: string;
  languageCode: string;
  languageLabel: string;
  chapterLabel: string;
  category: string;
  toneArchetype: string;
  title: string;
  subtitle: string;
  summary: string;
  author: string;
  authorBio: string;
  publisher: string;
  brandingMark: string;
  brandingLogoSvg: string;
  coverBrief: string;
  coverPrompt: string;
  openingNote: string;
  readerHook: string;
  coverBranch?: "nonfiction" | "children";
  coverGenre?: string;
  coverSubtopic?: string;
  coverTemplateHint?: string;
  titleTone?: string;
  coverHierarchy?: string;
  coverPaletteKey?: string;
  coverLayoutKey?: string;
  coverMotif?: string;
  chapterCount: number;
  heroRank: number;
  exportTarget: "hero" | "preview";
  type: string;
  tags: string[];
  topic: string;
  audience: string;
  promise: string;
  spineColor: string;
  coverGradient: string;
  accentColor: string;
  textAccent: string;
  year: string;
};

async function exists(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function resolveRepoRoot() {
  const candidates = [process.cwd(), path.resolve(process.cwd(), "..")];
  for (const candidate of candidates) {
    if (
      (await exists(path.join(candidate, "book_outputs"))) ||
      (await exists(path.join(candidate, "data", "showcase-portfolio.json")))
    ) {
      return candidate;
    }
  }
  return process.cwd();
}

export async function loadShowcasePortfolioManifest(repoRoot?: string) {
  const root = repoRoot || (await resolveRepoRoot());
  const manifestPath = path.join(root, "data", "showcase-portfolio.json");
  const raw = await fs.readFile(manifestPath, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") {
      return "";
    }
    throw error;
  });
  if (!raw) return [];

  try {
    return JSON.parse(raw) as ShowcasePortfolioEntry[];
  } catch {
    return [];
  }
}
