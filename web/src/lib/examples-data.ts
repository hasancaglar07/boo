import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type {
  ExampleAsset,
  ExampleEntry,
  ExampleExports,
  ExampleOutlineItem,
} from "@/lib/examples-shared";
import {
  formatChapterReference,
  languageLabelFor,
  normalizeBookLanguage,
  parseLocalizedChapterHeading,
} from "@/lib/book-language";
import { loadShowcasePortfolioManifest, resolveRepoRoot, type ShowcasePortfolioEntry } from "@/lib/showcase-manifest";
import { titleCase } from "@/lib/utils";

type DashboardMeta = {
  author?: string;
  publisher?: string;
  description?: string;
  author_bio?: string;
  branding_mark?: string;
  branding_logo_url?: string;
  cover_brief?: string;
  language?: string;
  cover_image?: string;
  back_cover_image?: string;
  year?: string;
};

type ResolvedExample = ExampleEntry & {
  bookDir: string;
  assetAllowlist: string[];
  htmlSupportDirs: string[];
};

const COVER_CANDIDATES = [
  "assets/showcase_front_cover.svg",
  "assets/ai_front_cover_final.png",
  "assets/ai_front_cover.png",
  "assets/generated_front_cover.png",
];
const BACK_COVER_CANDIDATES = [
  "assets/showcase_back_cover.svg",
  "assets/ai_back_cover_final.png",
  "assets/ai_back_cover.png",
  "assets/generated_back_cover.png",
];
const LOGO_CANDIDATES = [
  "assets/publisher_logo.svg",
  "assets/publisher_logo.png",
];
const EXPORT_DIR_PREFIX = "exports_";
const DIRECT_EXPORT_EXTENSIONS = new Set([".pdf", ".epub", ".html"]);
const HTML_SUPPORT_EXTENSIONS = new Set([
  ".css",
  ".gif",
  ".ico",
  ".jpg",
  ".jpeg",
  ".png",
  ".svg",
  ".webp",
]);

async function exists(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function normalizeSlashes(value: string) {
  return value.replace(/\\/g, "/");
}

function buildExampleAssetUrl(slug: string, relativePath: string) {
  const encoded = normalizeSlashes(relativePath)
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/api/examples/assets/${encodeURIComponent(slug)}/${encoded}`;
}

async function readMaybeText(targetPath: string) {
  try {
    return await fs.readFile(targetPath, "utf8");
  } catch {
    return "";
  }
}

async function readMaybeJson<T>(targetPath: string): Promise<T | null> {
  const raw = await readMaybeText(targetPath);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function safeStat(targetPath: string) {
  try {
    return await fs.stat(targetPath);
  } catch {
    return null;
  }
}

async function listDirNames(targetPath: string) {
  try {
    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

async function listFiles(targetPath: string) {
  try {
    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

function cleanupTitle(value?: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^[a-z0-9\s-]+$/i.test(trimmed) && trimmed === trimmed.toLowerCase()) {
    return titleCase(trimmed.replace(/-/g, " "));
  }
  return trimmed;
}

function summarizeText(text: string, maxLength = 220) {
  const paragraphs = text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n+/g, " ").trim())
    .filter(Boolean);

  if (!paragraphs.length) return "";

  let summary = "";
  for (const paragraph of paragraphs) {
    const candidate = summary ? `${summary} ${paragraph}` : paragraph;
    if (candidate.length > maxLength) break;
    summary = candidate;
    if (summary.length >= maxLength * 0.65) break;
  }

  const finalText = summary || paragraphs[0];
  return finalText.length > maxLength ? `${finalText.slice(0, maxLength - 1).trim()}…` : finalText;
}

function parseOutline(raw: string, languageCode: string) {
  const lines = raw.replace(/\r/g, "").split("\n");
  const title = cleanupTitle(lines.find((line) => line.startsWith("# "))?.replace(/^#\s+/, ""));
  const subtitle = lines.find((line) => line.startsWith("## "))?.replace(/^##\s+/, "").trim() || "";
  const outline: ExampleOutlineItem[] = [];

  for (const line of lines) {
    const match = line.match(/^###\s+(.+?)(?:\s+\(([^)]+)\))?\s*$/u);
    if (!match) continue;
    const parsed = parseLocalizedChapterHeading(match[1].trim(), languageCode);
    if (!parsed) continue;
    outline.push({
      num: parsed.number,
      title: parsed.title.trim(),
      pages: match[2]?.trim() || undefined,
    });
  }

  return { title, subtitle, outline };
}

function cleanupChapterBody(raw: string) {
  const lines = raw.replace(/\r/g, "").split("\n");
  let index = 0;

  while (index < lines.length && !lines[index].trim()) {
    index += 1;
  }

  while (index < lines.length && /^#/.test(lines[index].trim())) {
    index += 1;
    while (index < lines.length && !lines[index].trim()) {
      index += 1;
    }
  }

  const body = lines
    .slice(index)
    .join("\n")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();

  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n+/g, " ").trim())
    .filter(Boolean);

  const selected: string[] = [];
  let totalLength = 0;
  for (const paragraph of paragraphs) {
    selected.push(paragraph);
    totalLength += paragraph.length;
    if (selected.length >= 4 || totalLength >= 1800) break;
  }

  return selected.join("\n\n");
}

function parseChapterPreview(raw: string, languageCode: string, fallbackTitle: string) {
  const lines = raw.replace(/\r/g, "").split("\n");
  const heading = lines.find((line) => /^#\s+/.test(line.trim()))?.trim().replace(/^#\s+/, "") || "";
  const parsed = parseLocalizedChapterHeading(heading, languageCode);
  const number = parsed?.number || 1;
  return {
    chapter: formatChapterReference(languageCode, number),
    title: cleanupTitle(parsed?.title || fallbackTitle || `${formatChapterReference(languageCode, number)}`),
    text: cleanupChapterBody(raw),
  };
}

async function pickAssetPath(bookDir: string, candidates: string[], fallbackPattern: RegExp) {
  for (const candidate of candidates) {
    if (await exists(path.join(bookDir, candidate))) {
      return candidate;
    }
  }

  const assetFiles = await listFiles(path.join(bookDir, "assets"));
  const matched = assetFiles.find((file) => fallbackPattern.test(file));
  if (matched) {
    return `assets/${matched}`;
  }

  return "";
}

async function resolveExports(bookDir: string, slug: string) {
  const exportDirs = (await listDirNames(bookDir))
    .filter((dirName) => dirName.startsWith(EXPORT_DIR_PREFIX))
    .sort()
    .reverse();

  const exports: ExampleExports = {};
  const allowlist: string[] = [];
  const htmlSupportDirs = new Set<string>();

  for (const extension of DIRECT_EXPORT_EXTENSIONS) {
    for (const dirName of exportDirs) {
      const dirPath = path.join(bookDir, dirName);
      const fileNames = await listFiles(dirPath);
      const matched = fileNames.find((fileName) => path.extname(fileName).toLowerCase() === extension);
      if (!matched) continue;

      const relativePath = normalizeSlashes(path.join(dirName, matched));
      const absolutePath = path.join(dirPath, matched);
      const fileStat = await safeStat(absolutePath);
      const asset: ExampleAsset = {
        label: extension.slice(1).toUpperCase(),
        relativePath,
        url: buildExampleAssetUrl(slug, relativePath),
        size: fileStat?.size,
      };

      if (extension === ".pdf") exports.pdf = asset;
      if (extension === ".epub") exports.epub = asset;
      if (extension === ".html") {
        exports.html = asset;
        htmlSupportDirs.add(dirName);
      }

      allowlist.push(relativePath);
      break;
    }
  }

  return { exports, allowlist, htmlSupportDirs: Array.from(htmlSupportDirs) };
}

function publicDirection(languageCode: string): "ltr" | "rtl" {
  return languageCode === "Arabic" ? "rtl" : "ltr";
}

async function buildExample(curated: ShowcasePortfolioEntry, repoRoot: string): Promise<ResolvedExample | null> {
  const bookDir = path.join(repoRoot, "book_outputs", curated.slug);
  if (!(await exists(bookDir))) return null;

  const meta = (await readMaybeJson<DashboardMeta>(path.join(bookDir, "dashboard_meta.json"))) || {};
  const outlineFile = (await listFiles(bookDir)).find((file) => /^book_outline_final_.*\.md$/i.test(file)) || "";
  const outlineRaw = outlineFile ? await readMaybeText(path.join(bookDir, outlineFile)) : "";
  const languageCode = normalizeBookLanguage(meta.language) || curated.languageCode;
  const parsedOutline = parseOutline(outlineRaw, languageCode);

  const chapterFiles = (await listFiles(bookDir))
    .filter((file) => /^chapter_\d+_final\.md$/i.test(file))
    .sort((left, right) => {
      const leftNum = Number(left.match(/^chapter_(\d+)_/i)?.[1] || 0);
      const rightNum = Number(right.match(/^chapter_(\d+)_/i)?.[1] || 0);
      return leftNum - rightNum;
    });

  const firstChapterFile = chapterFiles[0] || "";
  const firstChapterRaw = firstChapterFile ? await readMaybeText(path.join(bookDir, firstChapterFile)) : "";
  const title = cleanupTitle(parsedOutline.title) || curated.title;
  const subtitle = parsedOutline.subtitle.trim() || curated.subtitle;
  const chapterPreview = parseChapterPreview(
    firstChapterRaw,
    languageCode,
    parsedOutline.outline[0]?.title || curated.title,
  );

  const summary = String(meta.description || "").trim() || curated.summary || summarizeText(chapterPreview.text, 240);
  const coverImagePath =
    (meta.cover_image && normalizeSlashes(meta.cover_image)) ||
    (await pickAssetPath(bookDir, COVER_CANDIDATES, /(?:front_cover|generated_front_cover|generated_cover_front|showcase_front_cover)\.(svg|png|jpe?g|webp)$/i));
  const backCoverImagePath =
    (meta.back_cover_image && normalizeSlashes(meta.back_cover_image)) ||
    (await pickAssetPath(bookDir, BACK_COVER_CANDIDATES, /(?:back_cover|generated_back_cover|generated_cover_back|showcase_back_cover)\.(svg|png|jpe?g|webp)$/i));
  const brandingLogoPath =
    (meta.branding_logo_url && normalizeSlashes(meta.branding_logo_url)) ||
    (await pickAssetPath(bookDir, LOGO_CANDIDATES, /(?:publisher_logo|branding_logo)\.(svg|png|jpe?g|webp)$/i));

  const exportsBundle = await resolveExports(bookDir, curated.slug);
  const chapters = parsedOutline.outline.length || chapterFiles.length || curated.chapterCount;
  const assetAllowlist = [
    ...exportsBundle.allowlist,
    coverImagePath,
    backCoverImagePath,
    brandingLogoPath,
  ].filter((value): value is string => Boolean(value));

  return {
    id: curated.slug,
    slug: curated.slug,
    order: curated.heroRank,
    category: curated.category,
    language: curated.languageLabel || languageLabelFor(languageCode),
    languageCode,
    direction: publicDirection(languageCode),
    chapterLabel: curated.chapterLabel,
    type: curated.type,
    toneArchetype: curated.toneArchetype,
    title,
    subtitle,
    summary,
    author: String(meta.author || "").trim() || curated.author,
    authorBio: String(meta.author_bio || "").trim() || curated.authorBio,
    tags: curated.tags,
    spineColor: curated.spineColor,
    coverGradient: curated.coverGradient,
    accentColor: curated.accentColor,
    textAccent: curated.textAccent,
    brandingMark: String(meta.branding_mark || "").trim() || curated.brandingMark,
    brandingLogoUrl: brandingLogoPath ? buildExampleAssetUrl(curated.slug, brandingLogoPath) : undefined,
    coverBrief: String(meta.cover_brief || "").trim() || curated.coverBrief,
    publisher: cleanupTitle(meta.publisher) || curated.publisher,
    year: String(meta.year || "").trim() || curated.year,
    coverImageUrl: coverImagePath ? buildExampleAssetUrl(curated.slug, coverImagePath) : undefined,
    backCoverImageUrl: backCoverImagePath ? buildExampleAssetUrl(curated.slug, backCoverImagePath) : undefined,
    chapters,
    outline: parsedOutline.outline,
    chapterPreview,
    exports: exportsBundle.exports,
    bookDir,
    assetAllowlist,
    htmlSupportDirs: exportsBundle.htmlSupportDirs,
  };
}

async function loadResolvedExamples() {
  const repoRoot = await resolveRepoRoot();
  const manifest = await loadShowcasePortfolioManifest(repoRoot);
  const items = await Promise.all(manifest.map((entry) => buildExample(entry, repoRoot)));
  return items
    .filter((item): item is ResolvedExample => Boolean(item))
    .sort((left, right) => left.order - right.order);
}

export async function loadExamplesShowcaseData() {
  const items = await loadResolvedExamples();
  const categories = Array.from(new Set(items.map((item) => item.category)));
  const languages = Array.from(new Set(items.map((item) => item.language)));

  return {
    items: items.map((item) => {
      const { assetAllowlist, htmlSupportDirs, bookDir, ...publicItem } = item;
      void assetAllowlist;
      void htmlSupportDirs;
      void bookDir;
      return publicItem;
    }),
    categories: ["Tümü", ...categories],
    languages: ["Tümü", ...languages],
  };
}

function hasAllowedExtension(relativePath: string) {
  const ext = path.extname(relativePath).toLowerCase();
  return DIRECT_EXPORT_EXTENSIONS.has(ext) || HTML_SUPPORT_EXTENSIONS.has(ext);
}

export async function resolvePublicExampleAsset(slug: string, assetPath: string[]) {
  const examples = await loadResolvedExamples();
  const example = examples.find((item) => item.slug === slug);
  if (!example) return null;
  if (!assetPath.length) return null;

  if (assetPath.some((segment) => !segment || segment === "." || segment === "..")) {
    return null;
  }

  const relativePath = normalizeSlashes(assetPath.join("/"));
  if (!hasAllowedExtension(relativePath)) {
    return null;
  }

  const isDirectlyAllowed = example.assetAllowlist.includes(relativePath);
  const isHtmlSupportAsset = example.htmlSupportDirs.some((dirName) =>
    relativePath.startsWith(`${dirName}/`) &&
    HTML_SUPPORT_EXTENSIONS.has(path.extname(relativePath).toLowerCase()),
  );

  if (!isDirectlyAllowed && !isHtmlSupportAsset) {
    return null;
  }

  const normalizedBookDir = path.resolve(example.bookDir);
  const absolutePath = path.resolve(normalizedBookDir, relativePath);
  if (absolutePath !== normalizedBookDir && !absolutePath.startsWith(`${normalizedBookDir}${path.sep}`)) {
    return null;
  }

  const fileStat = await safeStat(absolutePath);
  if (!fileStat?.isFile()) {
    return null;
  }

  return {
    absolutePath,
    relativePath,
    size: fileStat.size,
  };
}
