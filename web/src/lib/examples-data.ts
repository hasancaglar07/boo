import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type {
  ExampleAsset,
  ExampleCardEntry,
  ExampleChapterContent,
  ExampleExports,
  ExampleOutlineItem,
  ExampleReaderEntry,
} from "@/lib/examples-shared";
import {
  chapterLabelForLanguage,
  formatChapterReference,
  languageLabelFor,
  normalizeBookLanguage,
  parseLocalizedChapterHeading,
} from "@/lib/book-language";
import {
  loadShowcasePortfolioManifest,
  resolveRepoRoot,
  type ShowcasePortfolioEntry,
} from "@/lib/showcase-manifest";
import { titleCase } from "@/lib/utils";

type DashboardMeta = {
  author?: string;
  publisher?: string;
  description?: string;
  author_bio?: string;
  branding_mark?: string;
  branding_logo_url?: string;
  cover_brief?: string;
  cover_prompt?: string;
  opening_note?: string;
  reader_hook?: string;
  language?: string;
  cover_art_image?: string;
  cover_image?: string;
  back_cover_image?: string;
  cover_template?: string;
  cover_variant_count?: number;
  cover_generation_provider?: string;
  cover_composed?: boolean;
  year?: string;
};

type ResolvedExample = {
  card: ExampleCardEntry;
  reader: ExampleReaderEntry;
  bookDir: string;
  assetAllowlist: string[];
  htmlSupportDirs: string[];
};

const PRIMARY_COVER_CANDIDATES = [
  "assets/front_cover_final.png",
  "assets/front_cover_final.webp",
  "assets/front_cover_final.jpg",
  "assets/front_cover_final.jpeg",
  "assets/front_cover_final.svg",
  "assets/ai_front_cover_final.png",
  "assets/ai_front_cover_final.webp",
  "assets/ai_front_cover.png",
  "assets/ai_front_cover.webp",
  "assets/ai_front_cover.jpg",
  "assets/ai_front_cover.jpeg",
  "assets/generated_front_cover.png",
  "assets/generated_front_cover.webp",
  "assets/showcase_front_cover.png",
  "assets/showcase_front_cover.webp",
  "assets/showcase_front_cover.jpg",
  "assets/showcase_front_cover.jpeg",
];
const HERO_COVER_CANDIDATES = [
  "assets/homepage_hero_cover.png",
  "assets/homepage_hero_cover.webp",
  "assets/homepage_hero_cover.jpg",
  "assets/homepage_hero_cover.jpeg",
  "assets/homepage_hero_cover.svg",
];
const FALLBACK_COVER_CANDIDATES = ["assets/showcase_front_cover.svg"];
const BACK_COVER_CANDIDATES = [
  "assets/back_cover_final.svg",
  "assets/back_cover_final.png",
  "assets/back_cover_final.webp",
  "assets/showcase_back_cover.svg",
  "assets/showcase_back_cover.png",
  "assets/showcase_back_cover.webp",
];
const LOGO_CANDIDATES = ["assets/publisher_logo.svg", "assets/publisher_logo.png"];
const INTRODUCTION_CANDIDATES = ["introduction_final.md"];
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
  const paragraphs = extractParagraphs(text);
  if (!paragraphs.length) return "";

  let summary = "";
  for (const paragraph of paragraphs) {
    const candidate = summary ? `${summary} ${paragraph}` : paragraph;
    if (candidate.length > maxLength) break;
    summary = candidate;
    if (summary.length >= maxLength * 0.7) break;
  }

  const finalText = summary || paragraphs[0];
  return finalText.length > maxLength ? `${finalText.slice(0, maxLength - 1).trim()}…` : finalText;
}

function chapterNumberFromFile(fileName: string) {
  return Number(fileName.match(/^chapter_(\d+)_/i)?.[1] || 0);
}

function sortChapterFiles(fileNames: string[]) {
  return [...fileNames].sort((left, right) => chapterNumberFromFile(left) - chapterNumberFromFile(right));
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

function stripLeadingMarkdownSections(raw: string) {
  const lines = raw.replace(/\r/g, "").split("\n");
  let index = 0;
  while (index < lines.length && !lines[index].trim()) index += 1;
  while (index < lines.length && /^#/.test(lines[index].trim())) {
    index += 1;
    while (index < lines.length && !lines[index].trim()) index += 1;
  }
  return lines.slice(index).join("\n").trim();
}

function extractParagraphs(raw: string) {
  const body = stripLeadingMarkdownSections(raw);
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n+/g, " ").trim())
    .filter(Boolean);
}

function joinParagraphs(paragraphs: string[], maxParagraphs?: number, maxLength?: number) {
  const selected: string[] = [];
  let totalLength = 0;
  for (const paragraph of paragraphs) {
    selected.push(paragraph);
    totalLength += paragraph.length;
    if (maxParagraphs && selected.length >= maxParagraphs) break;
    if (maxLength && totalLength >= maxLength) break;
  }
  return selected.join("\n\n");
}

function parseChapterContent(
  raw: string,
  languageCode: string,
  fallbackTitle: string,
  fallbackNumber: number,
): ExampleChapterContent {
  const lines = raw.replace(/\r/g, "").split("\n");
  const heading = lines.find((line) => /^#\s+/.test(line.trim()))?.trim().replace(/^#\s+/, "") || "";
  const parsed = parseLocalizedChapterHeading(heading, languageCode);
  const number = parsed?.number || fallbackNumber;
  const title = cleanupTitle(parsed?.title || fallbackTitle || formatChapterReference(languageCode, number));
  return {
    num: number,
    reference: formatChapterReference(languageCode, number),
    title,
    pages: undefined,
    text: joinParagraphs(extractParagraphs(raw)),
    anchorId: `chapter-${number}`,
  };
}

function parsePreviewText(raw: string, languageCode: string, fallbackTitle: string, fallbackNumber: number) {
  const chapter = parseChapterContent(raw, languageCode, fallbackTitle, fallbackNumber);
  return {
    reference: chapter.reference,
    title: chapter.title,
    text: joinParagraphs(extractParagraphs(raw), 4, 1800),
  };
}

async function pickAssetPath(bookDir: string, candidates: string[], fallbackPattern: RegExp) {
  for (const candidate of candidates.filter(Boolean)) {
    if (await exists(path.join(bookDir, candidate))) return candidate;
  }
  const assetFiles = await listFiles(path.join(bookDir, "assets"));
  const matched = assetFiles.find((file) => fallbackPattern.test(file));
  return matched ? `assets/${matched}` : "";
}

async function resolveCoverPaths(bookDir: string, meta: DashboardMeta) {
  const metaCover = normalizeSlashes(String(meta.cover_image || ""));
  const preferredMetaCover = metaCover;
  const primaryCover = await pickAssetPath(
    bookDir,
    [preferredMetaCover, ...PRIMARY_COVER_CANDIDATES],
    /(?:front_cover(?:_final)?|generated_front_cover|showcase_front_cover)\.(png|webp|jpe?g|svg)$/i,
  );
  const fallbackCover = await pickAssetPath(
    bookDir,
    [/\.svg$/i.test(metaCover) ? metaCover : "", ...FALLBACK_COVER_CANDIDATES],
    /(?:front_cover(?:_final)?|generated_front_cover|showcase_front_cover)\.svg$/i,
  );
  const backCover = await pickAssetPath(
    bookDir,
    [normalizeSlashes(String(meta.back_cover_image || "")), ...BACK_COVER_CANDIDATES],
    /(?:back_cover(?:_final)?|generated_back_cover|showcase_back_cover)\.(svg|png|webp|jpe?g)$/i,
  );
  const brandingLogo = await pickAssetPath(
    bookDir,
    [normalizeSlashes(String(meta.branding_logo_url || "")), ...LOGO_CANDIDATES],
    /(?:publisher_logo|branding_logo)\.(svg|png|jpe?g|webp)$/i,
  );
  const heroCover = await pickAssetPath(
    bookDir,
    HERO_COVER_CANDIDATES,
    /homepage_hero_cover\.(png|webp|jpe?g|svg)$/i,
  );

  return { primaryCover, fallbackCover, backCover, brandingLogo, heroCover };
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

async function readIntroduction(bookDir: string) {
  for (const fileName of INTRODUCTION_CANDIDATES) {
    const absolutePath = path.join(bookDir, fileName);
    if (await exists(absolutePath)) {
      return await readMaybeText(absolutePath);
    }
  }
  return "";
}

async function buildResolvedExample(curated: ShowcasePortfolioEntry, repoRoot: string): Promise<ResolvedExample | null> {
  const bookDir = path.join(repoRoot, "book_outputs", curated.slug);
  if (!(await exists(bookDir))) return null;

  const meta = (await readMaybeJson<DashboardMeta>(path.join(bookDir, "dashboard_meta.json"))) || {};
  const outlineFile = (await listFiles(bookDir)).find((file) => /^book_outline_final_.*\.md$/i.test(file)) || "";
  const outlineRaw = outlineFile ? await readMaybeText(path.join(bookDir, outlineFile)) : "";
  const languageCode = normalizeBookLanguage(meta.language) || curated.languageCode;
  const parsedOutline = parseOutline(outlineRaw, languageCode);

  const chapterFiles = sortChapterFiles(
    (await listFiles(bookDir)).filter((file) => /^chapter_\d+_final\.md$/i.test(file)),
  );
  const firstChapterFile = chapterFiles[0] || "";
  const firstChapterRaw = firstChapterFile ? await readMaybeText(path.join(bookDir, firstChapterFile)) : "";
  const introRaw = await readIntroduction(bookDir);
  const title = cleanupTitle(parsedOutline.title) || curated.title;
  const subtitle = parsedOutline.subtitle.trim() || curated.subtitle;
  const firstChapterNumber = chapterNumberFromFile(firstChapterFile) || 1;
  const firstOutlineTitle = parsedOutline.outline.find((item) => item.num === firstChapterNumber)?.title || parsedOutline.outline[0]?.title || curated.title;
  const preview = parsePreviewText(firstChapterRaw, languageCode, firstOutlineTitle, firstChapterNumber);
  const summary = String(meta.description || "").trim() || curated.summary || summarizeText(preview.text, 240);
  const coverPaths = await resolveCoverPaths(bookDir, meta);
  const exportsBundle = await resolveExports(bookDir, curated.slug);
  const chapters = parsedOutline.outline.length || chapterFiles.length || curated.chapterCount;
  const direction = publicDirection(languageCode);
  const introductionText = introRaw
    ? joinParagraphs(extractParagraphs(introRaw))
    : [String(meta.opening_note || "").trim() || curated.openingNote, summary, String(meta.reader_hook || "").trim() || curated.readerHook]
        .filter(Boolean)
        .join("\n\n");

  const outlineByNumber = new Map(parsedOutline.outline.map((item) => [item.num, item]));
  const chaptersContent: ExampleChapterContent[] = [];
  for (const fileName of chapterFiles) {
    const number = chapterNumberFromFile(fileName);
    const raw = await readMaybeText(path.join(bookDir, fileName));
    const fallbackTitle = outlineByNumber.get(number)?.title || title;
    const parsedChapter = parseChapterContent(raw, languageCode, fallbackTitle, number);
    chaptersContent.push({
      ...parsedChapter,
      pages: outlineByNumber.get(parsedChapter.num)?.pages,
      anchorId: `chapter-${parsedChapter.num}`,
    });
  }

  const assetAllowlist = [
    ...exportsBundle.allowlist,
    coverPaths.primaryCover,
    coverPaths.fallbackCover,
    coverPaths.backCover,
    coverPaths.brandingLogo,
    coverPaths.heroCover,
  ].filter((value): value is string => Boolean(value));

  const common: ExampleCardEntry = {
    id: curated.slug,
    slug: curated.slug,
    order: curated.heroRank,
    category: curated.category,
    language: curated.languageLabel || languageLabelFor(languageCode),
    languageCode,
    direction,
    chapterLabel: curated.chapterLabel || chapterLabelForLanguage(languageCode),
    type: curated.type,
    toneArchetype: curated.toneArchetype,
    title,
    subtitle,
    summary,
    readerHook: String(meta.reader_hook || "").trim() || curated.readerHook,
    author: String(meta.author || "").trim() || curated.author,
    authorBio: String(meta.author_bio || "").trim() || curated.authorBio,
    tags: curated.tags,
    spineColor: curated.spineColor,
    coverGradient: curated.coverGradient,
    accentColor: curated.accentColor,
    textAccent: curated.textAccent,
    brandingMark: String(meta.branding_mark || "").trim() || curated.brandingMark,
    brandingLogoUrl: coverPaths.brandingLogo ? buildExampleAssetUrl(curated.slug, coverPaths.brandingLogo) : undefined,
    coverBrief: String(meta.cover_brief || "").trim() || curated.coverBrief,
    publisher: cleanupTitle(meta.publisher) || curated.publisher,
    year: String(meta.year || "").trim() || curated.year,
    chapters,
    outline: parsedOutline.outline.length ? parsedOutline.outline : chaptersContent.map((chapter) => ({
      num: chapter.num,
      title: chapter.title,
      pages: chapter.pages,
    })),
    chapterPreview: {
      chapter: preview.reference,
      title: preview.title,
      text: preview.text,
    },
    coverImages: {
      primaryUrl: coverPaths.primaryCover ? buildExampleAssetUrl(curated.slug, coverPaths.primaryCover) : undefined,
      fallbackUrl: coverPaths.fallbackCover ? buildExampleAssetUrl(curated.slug, coverPaths.fallbackCover) : undefined,
      backUrl: coverPaths.backCover ? buildExampleAssetUrl(curated.slug, coverPaths.backCover) : undefined,
    },
    exports: exportsBundle.exports,
  };

  return {
    card: common,
    reader: {
      ...common,
      openingNote: String(meta.opening_note || "").trim() || curated.openingNote,
      introductionText,
      chaptersContent,
    },
    bookDir,
    assetAllowlist,
    htmlSupportDirs: exportsBundle.htmlSupportDirs,
  };
}

async function loadResolvedExamples() {
  const repoRoot = await resolveRepoRoot();
  const manifest = await loadShowcasePortfolioManifest(repoRoot);
  const items = await Promise.all(manifest.map((entry) => buildResolvedExample(entry, repoRoot)));
  return items
    .filter((item): item is ResolvedExample => Boolean(item))
    .sort((left, right) => left.card.order - right.card.order);
}

export async function loadExamplesShowcaseData() {
  const items = await loadResolvedExamples();
  const categories = Array.from(new Set(items.map((item) => item.card.category)));
  const languages = Array.from(new Set(items.map((item) => item.card.language)));

  return {
    items: items.map((item) => item.card),
    categories: ["Tümü", ...categories],
    languages: ["Tümü", ...languages],
  };
}

export async function loadExampleReaderData(slug: string) {
  const items = await loadResolvedExamples();
  return items.find((item) => item.reader.slug === slug)?.reader || null;
}

function hasAllowedExtension(relativePath: string) {
  const ext = path.extname(relativePath).toLowerCase();
  return DIRECT_EXPORT_EXTENSIONS.has(ext) || HTML_SUPPORT_EXTENSIONS.has(ext);
}

export async function resolvePublicExampleAsset(slug: string, assetPath: string[]) {
  const examples = await loadResolvedExamples();
  const example = examples.find((item) => item.card.slug === slug);
  if (!example || !assetPath.length) return null;

  if (assetPath.some((segment) => !segment || segment === "." || segment === "..")) {
    return null;
  }

  const relativePath = normalizeSlashes(assetPath.join("/"));
  if (!hasAllowedExtension(relativePath)) return null;

  const isDirectlyAllowed = example.assetAllowlist.includes(relativePath);
  const isHtmlSupportAsset = example.htmlSupportDirs.some(
    (dirName) =>
      relativePath.startsWith(`${dirName}/`) &&
      HTML_SUPPORT_EXTENSIONS.has(path.extname(relativePath).toLowerCase()),
  );

  if (!isDirectlyAllowed && !isHtmlSupportAsset) return null;

  const normalizedBookDir = path.resolve(example.bookDir);
  const absolutePath = path.resolve(normalizedBookDir, relativePath);
  if (absolutePath !== normalizedBookDir && !absolutePath.startsWith(`${normalizedBookDir}${path.sep}`)) {
    return null;
  }

  const fileStat = await safeStat(absolutePath);
  if (!fileStat?.isFile()) return null;

  return {
    absolutePath,
    relativePath,
    size: fileStat.size,
  };
}
