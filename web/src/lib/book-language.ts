const LANGUAGE_ALIASES: Record<string, string> = {
  tr: "Turkish",
  turkish: "Turkish",
  "türkçe": "Turkish",
  turkce: "Turkish",
  turk: "Turkish",
  en: "English",
  english: "English",
  ingilizce: "English",
  es: "Spanish",
  spanish: "Spanish",
  espanol: "Spanish",
  español: "Spanish",
  ispanyolca: "Spanish",
  de: "German",
  german: "German",
  deutsch: "German",
  almanca: "German",
  fr: "French",
  french: "French",
  français: "French",
  francais: "French",
  "fransızca": "French",
  pt: "Portuguese",
  portuguese: "Portuguese",
  "português": "Portuguese",
  portugues: "Portuguese",
  portekizce: "Portuguese",
  it: "Italian",
  italian: "Italian",
  italiano: "Italian",
  italyanca: "Italian",
  nl: "Dutch",
  dutch: "Dutch",
  nederlands: "Dutch",
  hollandaca: "Dutch",
  ar: "Arabic",
  arabic: "Arabic",
  "العربية": "Arabic",
  "arapça": "Arabic",
  arapca: "Arabic",
  ja: "Japanese",
  japanese: "Japanese",
  "日本語": "Japanese",
  japonca: "Japanese",
};

const LANGUAGE_LABELS: Record<string, string> = {
  Turkish: "Türkçe",
  English: "English",
  Spanish: "Español",
  German: "Deutsch",
  French: "Français",
  Portuguese: "Português",
  Italian: "Italiano",
  Dutch: "Nederlands",
  Arabic: "العربية",
  Japanese: "日本語",
};

const CHAPTER_LABELS: Record<string, string> = {
  Turkish: "Bölüm",
  English: "Chapter",
  Spanish: "Capítulo",
  German: "Kapitel",
  French: "Chapitre",
  Portuguese: "Capítulo",
  Italian: "Capitolo",
  Dutch: "Hoofdstuk",
  Arabic: "الفصل",
  Japanese: "第n章",
};

const LABEL_VARIANTS = [
  "Chapter",
  "Bölüm",
  "Capítulo",
  "Kapitel",
  "Chapitre",
  "Capitolo",
  "Hoofdstuk",
  "الفصل",
];

const ESCAPED_LABEL_VARIANTS = LABEL_VARIANTS.map((label) =>
  label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
);

const GENERIC_HEADING_REGEX = new RegExp(
  `^(?:${ESCAPED_LABEL_VARIANTS.join("|")})\\s+(\\d+)\\b\\s*[:.\\-]?\\s*(.*)$`,
  "iu",
);
const JAPANESE_HEADING_REGEX = /^第\s*(\d+)\s*章\s*[:.\-]?\s*(.*)$/iu;

export function normalizeBookLanguage(language?: string) {
  const lowered = String(language || "").trim().toLowerCase();
  if (!lowered) return "";
  return LANGUAGE_ALIASES[lowered] || String(language || "").trim();
}

export function languageLabelFor(value?: string) {
  const normalized = normalizeBookLanguage(value);
  return LANGUAGE_LABELS[normalized] || normalized || "English";
}

export function chapterLabelForLanguage(language?: string) {
  const normalized = normalizeBookLanguage(language);
  return CHAPTER_LABELS[normalized] || "Chapter";
}

export function formatChapterHeadingPrefix(language: string, number: number) {
  const normalized = normalizeBookLanguage(language);
  if (normalized === "Japanese") {
    return `第${number}章`;
  }
  return `${chapterLabelForLanguage(normalized)} ${number}`;
}

export function formatChapterReference(language: string, number: number) {
  return formatChapterHeadingPrefix(language, number);
}

export function stripChapterHeading(heading: string) {
  const trimmed = String(heading || "").trim();
  if (!trimmed) return "";

  const japaneseMatch = trimmed.match(JAPANESE_HEADING_REGEX);
  if (japaneseMatch) {
    return japaneseMatch[2].trim();
  }

  const genericMatch = trimmed.match(GENERIC_HEADING_REGEX);
  if (genericMatch) {
    return genericMatch[2].trim();
  }

  return trimmed;
}

export function parseLocalizedChapterHeading(heading: string, language?: string) {
  const trimmed = String(heading || "").trim();
  if (!trimmed) return null;

  const japaneseMatch = trimmed.match(JAPANESE_HEADING_REGEX);
  if (japaneseMatch) {
    const number = Number(japaneseMatch[1]);
    return {
      number,
      label: chapterLabelForLanguage(language || "Japanese"),
      reference: formatChapterReference(language || "Japanese", number),
      title: japaneseMatch[2].trim(),
    };
  }

  const genericMatch = trimmed.match(GENERIC_HEADING_REGEX);
  if (!genericMatch) return null;

  const number = Number(genericMatch[1]);
  const normalized = normalizeBookLanguage(language);
  const inferredLanguage =
    normalized ||
    (trimmed.startsWith("Bölüm")
      ? "Turkish"
      : trimmed.startsWith("Capítulo")
        ? "Spanish"
        : trimmed.startsWith("Kapitel")
          ? "German"
          : trimmed.startsWith("Chapitre")
            ? "French"
            : trimmed.startsWith("Capitolo")
              ? "Italian"
              : trimmed.startsWith("Hoofdstuk")
                ? "Dutch"
                : trimmed.startsWith("الفصل")
                  ? "Arabic"
                  : "English");

  return {
    number,
    label: chapterLabelForLanguage(inferredLanguage),
    reference: formatChapterReference(inferredLanguage, number),
    title: genericMatch[2].trim(),
  };
}

export function normalizeStructuralHeading(title: string, language: string, number?: number) {
  const cleaned = stripChapterHeading(title);
  if (cleaned) return cleaned;
  return number ? formatChapterReference(language, number) : chapterLabelForLanguage(language);
}

