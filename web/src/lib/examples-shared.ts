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

export type ExampleChapterPreview = {
  chapter: string;
  title: string;
  text: string;
};

export type ExampleExports = {
  epub?: ExampleAsset;
  pdf?: ExampleAsset;
  html?: ExampleAsset;
};

export type ExampleEntry = {
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
  coverImageUrl?: string;
  backCoverImageUrl?: string;
  chapters: number;
  outline: ExampleOutlineItem[];
  chapterPreview: ExampleChapterPreview;
  exports: ExampleExports;
};
