export type ExampleAsset = {
  label: string;
  relativePath: string;
  url: string;
  size?: number;
};

export type ExampleOutlineItem = {
  num: number;
  title: string;
  pages?: string;
};

export type ExampleChapterContent = {
  num: number;
  reference: string;
  title: string;
  pages?: string;
  text: string;
  anchorId: string;
};

export type ExampleChapterPreview = {
  chapter: string;
  title: string;
  text: string;
};

export type ExampleCoverImages = {
  primaryUrl?: string;
  fallbackUrl?: string;
  backUrl?: string;
};

export type ExampleExports = {
  epub?: ExampleAsset;
  pdf?: ExampleAsset;
  html?: ExampleAsset;
};

type ExampleBase = {
  id: string;
  slug: string;
  order: number;
  category: string;
  language: string;
  languageCode: string;
  direction: "ltr" | "rtl";
  chapterLabel: string;
  type: string;
  toneArchetype: string;
  title: string;
  subtitle: string;
  summary: string;
  readerHook: string;
  author: string;
  authorBio?: string;
  tags: string[];
  spineColor: string;
  coverGradient: string;
  accentColor: string;
  textAccent: string;
  brandingMark?: string;
  brandingLogoUrl?: string;
  coverBrief?: string;
  publisher?: string;
  year?: string;
  chapters: number;
  outline: ExampleOutlineItem[];
  chapterPreview: ExampleChapterPreview;
  coverImages: ExampleCoverImages;
  exports: ExampleExports;
};

export type ExampleCardEntry = ExampleBase;

export type ExampleReaderEntry = ExampleBase & {
  openingNote: string;
  introductionText: string;
  chaptersContent: ExampleChapterContent[];
};
