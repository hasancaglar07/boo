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
  coverTemplateHint?: string;
  titleTone?: string;
  coverHierarchy?: string;
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
  const candidates = [path.resolve(process.cwd(), ".."), process.cwd()];
  for (const candidate of candidates) {
    if (await exists(path.join(candidate, "book_outputs"))) {
      return candidate;
    }
  }
  return candidates[0];
}

export async function loadShowcasePortfolioManifest(repoRoot?: string) {
  const root = repoRoot || (await resolveRepoRoot());
  const manifestPath = path.join(root, "data", "showcase-portfolio.json");
  const raw = await fs.readFile(manifestPath, "utf8");
  return JSON.parse(raw) as ShowcasePortfolioEntry[];
}
