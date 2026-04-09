import {
  evaluateBookIdea,
  mapValidatorIntentToBookType,
  mapValidatorLanguageToFunnelLanguage,
  type BookIdeaIntent,
  type BookIdeaLanguage,
} from "@/lib/book-idea-validator";

export type ToolIconKey =
  | "sparkles"
  | "target"
  | "compass"
  | "trending"
  | "layers"
  | "search"
  | "magnet"
  | "book"
  | "pen";

export type MarketingToolSlug =
  | "book-idea-validator"
  | "book-outline-starter"
  | "content-to-book-mapper"
  | "kdp-niche-score"
  | "lead-magnet-book-angle-finder"
  | "title-subtitle-critic";

export type GenericMarketingToolSlug = Exclude<MarketingToolSlug, "book-idea-validator">;

export type MarketingToolId =
  | "book_idea_validator"
  | "book_outline_starter"
  | "content_to_book_mapper"
  | "kdp_niche_score"
  | "lead_magnet_book_angle_finder"
  | "title_subtitle_critic";

export type MarketingToolValues = Record<string, string>;

export type MarketingToolField =
  | {
      name: string;
      label: string;
      type: "input";
      placeholder: string;
      minLength: number;
      required?: boolean;
    }
  | {
      name: string;
      label: string;
      type: "textarea";
      placeholder: string;
      minLength: number;
      required?: boolean;
    }
  | {
      name: string;
      label: string;
      type: "select";
      placeholder?: string;
      minLength?: number;
      required?: boolean;
      options: Array<{ value: string; label: string }>;
    };

export type MarketingToolBenefit = {
  icon: ToolIconKey;
  title: string;
  description: string;
};

export type MarketingToolSample = {
  label: string;
  values: MarketingToolValues;
};

export type MarketingToolSummary = {
  slug: MarketingToolSlug;
  id: MarketingToolId;
  name: string;
  badge: string;
  path: string;
  description: string;
  shortLabel: string;
  ctaLabel: string;
  icon: ToolIconKey;
  experience: "custom" | "generic";
  steps?: string[];
};

export type MarketingToolDimension = {
  key: string;
  label: string;
  score: number;
  summary: string;
};

export type MarketingToolReportSection = {
  title: string;
  items: string[];
  ordered?: boolean;
};

export type MarketingToolEvaluation = {
  overallScore: number;
  verdict: string;
  recommendedFormat: string;
  recommendedAngle: string;
  strongestPoints: string[];
  risks: string[];
  nextStep: string;
  dimensions: MarketingToolDimension[];
  reportSections: MarketingToolReportSection[];
};

export type GenericMarketingToolDefinition = Omit<MarketingToolSummary, "slug" | "id" | "experience"> & {
  slug: GenericMarketingToolSlug;
  id: Exclude<MarketingToolId, "book_idea_validator">;
  experience: "generic";
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  heroTitle: string;
  heroDescription: string;
  formIntro: string;
  placeholderTitle: string;
  placeholderText: string;
  gateTitle: string;
  gateDescription: string;
  nextStepTitle: string;
  nextStepDescription: string;
  previewCtaLabel: string;
  samples: MarketingToolSample[];
  benefits: MarketingToolBenefit[];
  fields: MarketingToolField[];
  buildPreviewHref: (values: MarketingToolValues) => string;
  evaluate: (values: MarketingToolValues) => MarketingToolEvaluation;
};

const STOP_WORDS = new Set([
  "ve",
  "ile",
  "bir",
  "for",
  "bu",
  "the",
  "and",
  "for",
  "your",
  "book",
  "kitap",
  "guide",
  "to",
  "of",
  "a",
  "an",
]);

const GENERIC_OUTCOME_PATTERN =
  /\b(help|teach|build|grow|launch|scale|write|publish|increase|reduce|result|establish|convert|sales|lead)\b/iu;
const AUDIENCE_PATTERN =
  /\b(for|owner|coach|consultant|creator|educator|founder|marketer|author|expert|publisher)\b/iu;
const METHOD_PATTERN =
  /\b(system|framework|method|playbook|blueprint|map)\b/iu;
const BROAD_TOPIC_PATTERN =
  /\b(business|marketing|success|productivity|personal development|health|growth)\b/iu;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeWords(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function uniqueWords(value: string) {
  return Array.from(new Set(normalizeWords(value)));
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function shortCore(value: string, fallback = "Topic") {
  const words = uniqueWords(value);
  return titleCase(words.slice(0, 4).join(" ")) || fallback;
}

function averageScore(dimensions: MarketingToolDimension[]) {
  const total = dimensions.reduce((sum, dimension) => sum + dimension.score, 0);
  return Math.round(total / Math.max(dimensions.length, 1));
}

function verdictFromScore(score: number) {
  if (score >= 82) return "Strong candidate";
  if (score >= 70) return "Good but needs to be narrowed down a bit";
  if (score >= 58) return "Base signal exists, requires positioning";
  return "First tighten the angle";
}

function wordsBonus(value: string, limit: number, perWord: number) {
  return Math.min(uniqueWords(value).length, limit) * perWord;
}

function regexBonus(value: string, pattern: RegExp, amount: number) {
  return pattern.test(value) ? amount : 0;
}

function formatBookType(bookType: string) {
  switch (bookType) {
    case "authority_book":
      return "Authority book";
    case "lead_magnet":
      return "Lead magnet book";
    case "paid_guide":
      return "Premium short guide";
    case "kdp_publish":
      return "KDP nonfiction";
    default:
      return "Structured nonfiction book";
  }
}

function mapBookTypeToPreview(bookType: string) {
  switch (bookType) {
    case "authority_book":
      return "business";
    case "lead_magnet":
      return "guide";
    case "paid_guide":
      return "education";
    case "kdp_publish":
      return "business";
    default:
      return "guide";
  }
}

function mapLanguageToPreview(language: string) {
  switch (language) {
    case "english":
      return "English";
    case "multilingual":
      return "English";
    default:
      return "Turkish";
  }
}

function buildPreviewHref(params: {
  topic: string;
  audience?: string;
  language?: string;
  bookType?: string;
}) {
  const url = new URL("https://tool.local/start/topic");
  url.searchParams.set("topic", params.topic);

  if (params.audience) {
    url.searchParams.set("audience", params.audience);
  }
  if (params.language) {
    url.searchParams.set("language", mapLanguageToPreview(params.language));
  }
  if (params.bookType) {
    url.searchParams.set("bookType", mapBookTypeToPreview(params.bookType));
  }

  return `${url.pathname}${url.search}`;
}

function buildStrengthsAndRisks(dimensions: MarketingToolDimension[], positives: string[], negatives: string[]) {
  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  const weakest = [...dimensions].sort((a, b) => a.score - b.score);

  const strengths = positives.slice(0, 3);
  const risks = negatives.slice(0, 3);

  while (strengths.length < 3) {
    const candidate = sorted[strengths.length];
    strengths.push(candidate ? `There is an available signal on ${candidate.label}.` : "The core idea is worth testing.");
  }

  while (risks.length < 3) {
    const candidate = weakest[risks.length];
    risks.push(candidate ? `Clarifying the ${candidate.label} field a bit more would increase conversion.` : "The clarity of the title and promise could be tightened a bit more.");
  }

  return { strengths: strengths.slice(0, 3), risks: risks.slice(0, 3) };
}

function outlineStarterEvaluation(values: MarketingToolValues): MarketingToolEvaluation {
  const topic = values.topic || "";
  const audience = values.audience || "";
  const goal = values.goal || "";
  const bookType = values.bookType || "authority_book";
  const topicCore = shortCore(topic, "Book topic");
  const goalCore = goal.trim() || "a clear result";

  const dimensions: MarketingToolDimension[] = [
    {
      key: "focus",
      label: "Topic focus",
      score: clamp(48 + wordsBonus(topic, 6, 5) - regexBonus(topic, BROAD_TOPIC_PATTERN, 12), 32, 95),
      summary: "For the outline to work effectively, the topic should be narrow, centered around a single problem or transformation.",
    },
    {
      key: "reader_fit",
      label: "Reader fit",
      score: clamp(46 + wordsBonus(audience, 6, 6) + regexBonus(audience, AUDIENCE_PATTERN, 12), 34, 95),
      summary: "When the target reader is clear, chapter order and example type are easier to determine.",
    },
    {
      key: "promise",
      label: "Clarity of promises",
      score: clamp(44 + wordsBonus(goal, 5, 5) + regexBonus(goal, GENERIC_OUTCOME_PATTERN, 16), 34, 94),
      summary: "If what the reader will gain by the end of the book is clearly described, the outline becomes more persuasive.",
    },
    {
      key: "structure",
      label: "Chapter signal",
      score: clamp(42 + wordsBonus(topic, 6, 4) + regexBonus(`${topic} ${goal}`, METHOD_PATTERN, 16), 30, 94),
      summary: "The method, system, or step-by-step process facilitates the chapter backbone signal.",
    },
    {
      key: "completion",
      label: "Completion likelihood",
      score: clamp(50 + (bookType === "lead_magnet" ? 10 : 6) + (values.language === "multilingual" ? -2 : 4), 36, 92),
      summary: "Keeping the scope under control reduces the risk of the book being left unfinished.",
    },
  ];

  const overallScore = averageScore(dimensions);
  const outlineItems = [
    `Why does ${audience || "Target reader"} struggle with ${topicCore.toLocaleLowerCase("tr-TR")}?`,
    `An approach that is still used today but remains weak`,
    `Core framework or working logic for ${topicCore}`,
    `First quick win and implementation step`,
    `Most common errors and how to prevent them`,
    `Real example or mini case flow`,
    `Making the system sustainable`,
    `Next step: call for ${goalCore}`,
  ];

  const reportSections: MarketingToolReportSection[] = [
    { title: "Suggested chapter outline", ordered: true, items: outlineItems },
    {
      title: "Editorial notes",
      items: [
        "In the first chapter, quantify or make the problem cost visible.",
        "In the middle chapters, show not only theory but also a decision tree and example flow.",
        "In the final chapter, guide the reader toward your product, consulting services, or the next action.",
        "Use a one-sentence promise at the beginning of each chapter.",
      ],
    },
  ];

  const { strengths, risks } = buildStrengthsAndRisks(
    dimensions,
    [
      dimensions[0].score >= 72 ? "The topic is narrow enough; this prevents the outline from scattering." : "",
      dimensions[1].score >= 72 ? "Since the target reader is clear, the chapter tone is easily established." : "",
      dimensions[3].score >= 70 ? "There is a method or framework signal within the topic; this chapters well." : "",
    ].filter(Boolean),
    [
      dimensions[0].score < 65 ? "Narrow down the topic a bit more; in its current state, chapters could become too generic." : "",
      dimensions[2].score < 65 ? "Write more sharply what result the reader will get at the end." : "",
      dimensions[3].score < 64 ? "Add method, stage, or decision tree layer; the outline comes out more easily." : "",
    ].filter(Boolean),
  );

  return {
    overallScore,
    verdict: verdictFromScore(overallScore),
    recommendedFormat: formatBookType(bookType),
    recommendedAngle: `${topicCore} topic for ${audience || "a clear segment"} focusing on ${goalCore} within an 8-chapter flow would be the strongest start.`,
    strongestPoints: strengths,
    risks,
    nextStep: "Move this draft to the preview flow and test the tone of the first chapter.",
    dimensions,
    reportSections,
  };
}

function contentToBookMapperEvaluation(values: MarketingToolValues): MarketingToolEvaluation {
  const assetSummary = values.assetSummary || "";
  const audience = values.audience || "";
  const goal = values.goal || "";
  const sourceType = values.sourceType || "course_workshop";
  const materialDepth = values.materialDepth || "medium";
  const assetCore = shortCore(assetSummary, "Current content");

  const sourceBonus =
    sourceType === "consulting_framework" ? 16 : sourceType === "course_workshop" ? 14 : sourceType === "newsletter_content" ? 10 : 12;
  const depthBonus = materialDepth === "rich" ? 18 : materialDepth === "medium" ? 10 : 4;

  const dimensions: MarketingToolDimension[] = [
    {
      key: "coverage",
      label: "Content scope",
      score: clamp(44 + wordsBonus(assetSummary, 7, 4) + depthBonus, 34, 95),
      summary: "Clusterable, not scattered, content is needed for book conversion.",
    },
    {
      key: "repurpose_fit",
      label: "Conversion Compatibility",
      score: clamp(48 + sourceBonus + regexBonus(assetSummary, METHOD_PATTERN, 10), 36, 96),
      summary: "Courses, frameworks, and organized content series are more ready to be converted into books.",
    },
    {
      key: "reader_fit",
      label: "Reader matching",
      score: clamp(46 + wordsBonus(audience, 6, 6) + regexBonus(audience, AUDIENCE_PATTERN, 10), 34, 95),
      summary: "Just as the content format matters, so does who that content is addressed to.",
    },
    {
      key: "commercial_fit",
      label: "Commercial contribution",
      score: clamp(42 + wordsBonus(goal, 5, 5) + regexBonus(goal, GENERIC_OUTCOME_PATTERN, 16), 32, 94),
      summary: "A book should not only be a compilation of content, but also serve a business purpose.",
    },
    {
      key: "gaps",
      label: "Missing piece risk",
      score: clamp(62 + (materialDepth === "rich" ? 14 : materialDepth === "medium" ? 6 : -4), 40, 94),
      summary: "As depth increases, the transition, example, and conclusion sections become easier to complete.",
    },
  ];

  const overallScore = averageScore(dimensions);
  const clusterLabel =
    sourceType === "course_workshop"
      ? "module"
      : sourceType === "consulting_framework"
        ? "framework block"
        : sourceType === "newsletter_content"
          ? "newsletter collection"
          : "content series";

  const reportSections: MarketingToolReportSection[] = [
    {
      title: "Suggested content collections",
      ordered: true,
      items: [
        `Main problem input for ${assetCore}`,
        `Core decision framework for ${audience || "Target reader"}`,
        `The most powerful ${clusterLabel} and their reordering`,
        `Consolidation of frequently repeated content into a single central section`,
        `Adding example case and application section`,
        `In the last chapter, a call to action for ${goal || "next action"}`,
      ],
    },
    {
      title: "Missing piece warnings",
      items: [
        "Transition sentences between content sections should also be written separately.",
        "Instead of repetitive examples, 1-2 strong cases should be selected.",
        "The book opening should frame the problem rather than list the content.",
        "The final chapter should connect to a service, course, or newsletter continuation.",
      ],
    },
  ];

  const { strengths, risks } = buildStrengthsAndRisks(
    dimensions,
    [
      dimensions[1].score >= 74 ? "The current content type provides a natural skeleton for bookification." : "",
      dimensions[0].score >= 72 ? "There is enough material available; the book does not have to be written from scratch." : "",
      dimensions[3].score >= 70 ? "The book doesn't just organize content; it also generates conversions." : "",
    ].filter(Boolean),
    [
      dimensions[4].score < 64 ? "Transition, case, and closing sections should also be designed." : "",
      dimensions[2].score < 66 ? "Describe more clearly for whom the content is being rewritten." : "",
      dimensions[0].score < 66 ? "Separate the material into module, series, or theme-based clusters." : "",
    ].filter(Boolean),
  );

  return {
    overallScore,
    verdict: verdictFromScore(overallScore),
    recommendedFormat: "Repurposed authority guide",
    recommendedAngle: `Instead of copying ${assetCore} content as is, converting into a focused guide for ${audience || "target reader"} targeting ${goal || "clear conversion"} yields stronger results.`,
    strongestPoints: strengths,
    risks,
    nextStep: "Move these sets to the wizard and test the first three chapters in the preview.",
    dimensions,
    reportSections,
  };
}

function kdpNicheScoreEvaluation(values: MarketingToolValues): MarketingToolEvaluation {
  const niche = values.niche || "";
  const audience = values.audience || "";
  const promise = values.promise || "";
  const competition = values.competition || "medium";
  const nicheCore = shortCore(niche, "Niche");

  const competitionScore = competition === "low" ? 86 : competition === "medium" ? 68 : 46;
  const dimensions: MarketingToolDimension[] = [
    {
      key: "specificity",
      label: "Micro niche clarity",
      score: clamp(52 + wordsBonus(niche, 6, 5) - regexBonus(niche, BROAD_TOPIC_PATTERN, 14), 34, 96),
      summary: "KDP requires a searchable and defensible micro niche, not a broad topic.",
    },
    {
      key: "buyer_fit",
      label: "Reader matching",
      score: clamp(44 + wordsBonus(audience, 6, 6) + regexBonus(audience, AUDIENCE_PATTERN, 10), 34, 95),
      summary: "Just like the category, who the book is for also generates sales signals.",
    },
    {
      key: "promise",
      label: "Promise power",
      score: clamp(44 + wordsBonus(promise, 5, 5) + regexBonus(promise, GENERIC_OUTCOME_PATTERN, 16), 34, 95),
      summary: "A concrete benefit statement is required for the subtitle and description.",
    },
    {
      key: "competition",
      label: "Competition manageability",
      score: competitionScore,
      summary: "If the competition signal is high, the title needs to be narrowed down further.",
    },
    {
      key: "series",
      label: "Series potential",
      score: clamp(46 + wordsBonus(`${niche} ${promise}`, 6, 4) + (competition === "low" ? 10 : 4), 34, 94),
      summary: "A good micro niche often also carries subheading or series opportunities.",
    },
  ];

  const overallScore = averageScore(dimensions);
  const reportSections: MarketingToolReportSection[] = [
    {
      title: "Subtitle angles",
      items: [
        `Practical getting started guide for ${nicheCore}`,
        `Step by step ${nicheCore} for ${audience || "Beginners"}`,
        `${promise || `Clear result on ${nicheCore}`}`,
        `Field guide to reducing ${nicheCore} errors`,
        `Applicable short system for ${nicheCore}`,
      ],
    },
    {
      title: "Metadata beginnings",
      items: [
        `${nicheCore} guide`,
        `${nicheCore} handbook`,
        `${audience || nicheCore} starter`,
        `${nicheCore} strategy`,
        `${nicheCore} workbook`,
      ],
    },
    {
      title: "Mini chapter path",
      ordered: true,
      items: [
        `Cost of the niche problem`,
        `Weak approaches in the market`,
        `Core system for ${nicheCore}`,
        `Quick start steps`,
        `Case or example results`,
        `Next book or series opportunity`,
      ],
    },
  ];

  const { strengths, risks } = buildStrengthsAndRisks(
    dimensions,
    [
      dimensions[0].score >= 76 ? "The niche is narrow enough; this provides an advantage in KDP searches." : "",
      dimensions[2].score >= 72 ? "Promises can be carried well on the subtitle and description side." : "",
      dimensions[4].score >= 72 ? "This seems suitable for a series starter rather than a single standalone book." : "",
    ].filter(Boolean),
    [
      dimensions[0].score < 66 ? "Niche down to a more micro level; otherwise, the competition will suffocate you." : "",
      dimensions[3].score < 60 ? "Competition is high; add a sub-niche or use case to the title." : "",
      dimensions[1].score < 66 ? "Carry more clearly in the title or subtitle who you are writing for." : "",
    ].filter(Boolean),
  );

  return {
    overallScore,
    verdict: verdictFromScore(overallScore),
    recommendedFormat: "KDP micro-niche nonfiction",
    recommendedAngle: `Instead of leaving ${nicheCore} as a general topic, micro-niching for ${audience || "a specific reader segment"} with a focus on ${promise || "a single main result"} would be more accurate.`,
    strongestPoints: strengths,
    risks,
    nextStep: "Move this micro niche to the preview flow and test the first subtitle set.",
    dimensions,
    reportSections,
  };
}

function leadMagnetBookAngleFinderEvaluation(values: MarketingToolValues): MarketingToolEvaluation {
  const expertise = values.expertise || "";
  const client = values.client || "";
  const outcome = values.outcome || "";
  const offerType = values.offerType || "consulting";
  const expertiseCore = shortCore(expertise, "Expertise");

  const offerBonus =
    offerType === "consulting" ? 16 : offerType === "coaching" ? 14 : offerType === "course" ? 12 : offerType === "service" ? 12 : 10;
  const dimensions: MarketingToolDimension[] = [
    {
      key: "client",
      label: "Ideal customer clarity",
      score: clamp(46 + wordsBonus(client, 6, 6) + regexBonus(client, AUDIENCE_PATTERN, 10), 34, 95),
      summary: "A lead magnet book works when it's written not for everyone, but for the right customer.",
    },
    {
      key: "outcome",
      label: "Conclusion sentence",
      score: clamp(44 + wordsBonus(outcome, 5, 5) + regexBonus(outcome, GENERIC_OUTCOME_PATTERN, 16), 34, 95),
      summary: "The short book's promise should be tied to a quick and measurable gain.",
    },
    {
      key: "offer",
      label: "Offer fit",
      score: clamp(48 + offerBonus, 40, 96),
      summary: "The clearer the prompt you feed at the end of the book, the more powerfully the tool will work.",
    },
    {
      key: "trust",
      label: "Trust-building power",
      score: clamp(42 + wordsBonus(expertise, 6, 4) + regexBonus(expertise, METHOD_PATTERN, 12), 32, 92),
      summary: "Expertise, framework, and process signals lend authority to the book.",
    },
    {
      key: "conversion",
      label: "Conversion potential",
      score: clamp(46 + regexBonus(`${client} ${outcome}`, GENERIC_OUTCOME_PATTERN, 12) + offerBonus / 2, 36, 94),
      summary: "The book should be able to convert into a meeting or proposal request with the right CTA.",
    },
  ];

  const overallScore = averageScore(dimensions);
  const reportSections: MarketingToolReportSection[] = [
    {
      title: "Angle suggestions",
      items: [
        `${client || "Ideal customer"} ${outcome || "quick gain"} guide`,
        `${expertiseCore} getting the first result faster with`,
        `Short playbook that reduces ${client || "Right customer"} errors`,
        `30-day progress plan using ${expertiseCore}`,
        `Short authority book transitioning to ${offerType === "course" ? "Course" : "Service"}`,
      ],
    },
    {
      title: "Short guide draft",
      ordered: true,
      items: [
        `Problems and incorrect assumptions`,
        `Who it works for / who it doesn't work for`,
        `within the framework of ${expertiseCore}`,
        `First app step`,
        `Sample scenario or case`,
        `Offer or next step`,
      ],
    },
    {
      title: "CTA opportunities",
      items: [
        "Checklist or worksheet download",
        "Diagnosis interview or demo call",
        "Mini training or webinar transition",
        "Redirect to case study or proposal page",
      ],
    },
  ];

  const { strengths, risks } = buildStrengthsAndRisks(
    dimensions,
    [
      dimensions[0].score >= 72 ? "The customer definition is clear; this is critical for the lead magnet tone." : "",
      dimensions[2].score >= 74 ? "Since the offer the book will be linked to is clear, a conversion bridge can be established." : "",
      dimensions[3].score >= 70 ? "Its core builds trust through a framework of expertise." : "",
    ].filter(Boolean),
    [
      dimensions[1].score < 66 ? "Write more sharply what the reader will gain at the end of the book." : "",
      dimensions[0].score < 66 ? "Narrow the book down enough to speak to a single customer segment, not everyone." : "",
      dimensions[2].score < 66 ? "Clarify which offer will be called at the end of the book." : "",
    ].filter(Boolean),
  );

  return {
    overallScore,
    verdict: verdictFromScore(overallScore),
    recommendedFormat: "Client-converting short guide",
    recommendedAngle: `Instead of presenting ${expertiseCore} knowledge like a general expertise book, converting to a short guide for ${client || "ideal customer"} focused on ${outcome || "single main result"} generates more leads.`,
    strongestPoints: strengths,
    risks,
    nextStep: "Move this angle to the preview flow and test the CTA you will place at the end of the book.",
    dimensions,
    reportSections,
  };
}

function titleSubtitleCriticEvaluation(values: MarketingToolValues): MarketingToolEvaluation {
  const title = values.title || "";
  const subtitle = values.subtitle || "";
  const audience = values.audience || "";
  const goal = values.goal || "";
  const intent = values.intent || "authority_book";
  const titleCore = shortCore(title, "Title");
  const titleWordCount = normalizeWords(title).length;

  const clarityScore =
    titleWordCount >= 2 && titleWordCount <= 8 ? 82 : titleWordCount <= 1 ? 42 : titleWordCount > 12 ? 54 : 70;

  const dimensions: MarketingToolDimension[] = [
    {
      key: "clarity",
      label: "Title clarity",
      score: clamp(clarityScore - regexBonus(title, BROAD_TOPIC_PATTERN, 10), 34, 94),
      summary: "If the title is too broad or too crowded, clicks drop.",
    },
    {
      key: "promise",
      label: "Subtitle promise",
      score: clamp(42 + wordsBonus(`${subtitle} ${goal}`, 6, 5) + regexBonus(`${subtitle} ${goal}`, GENERIC_OUTCOME_PATTERN, 16), 34, 95),
      summary: "The subtitle should explain in a single sentence why the reader should be interested.",
    },
    {
      key: "specificity",
      label: "Specificity",
      score: clamp(44 + wordsBonus(`${title} ${subtitle}`, 7, 4) - regexBonus(`${title} ${subtitle}`, BROAD_TOPIC_PATTERN, 12), 32, 94),
      summary: "General words need to be replaced with topic, audience, and outcome indicators.",
    },
    {
      key: "audience",
      label: "Audience signal",
      score: clamp(42 + wordsBonus(audience, 6, 6) + regexBonus(`${subtitle} ${audience}`, AUDIENCE_PATTERN, 12), 34, 95),
      summary: "The clearer the title's call to action, the more correct clicks increase.",
    },
    {
      key: "memorability",
      label: "Memorability",
      score: clamp(76 - Math.max(titleWordCount - 6, 0) * 4 + regexBonus(title, METHOD_PATTERN, 6), 34, 92),
      summary: "Shorter and more rhythmic titles are easier to remember.",
    },
  ];

  const overallScore = averageScore(dimensions);
  const recommendedFormat = formatBookType(intent);
  const audienceCore = shortCore(audience, "Reader");
  const goalCore = goal.trim() || "concrete result";

  const reportSections: MarketingToolReportSection[] = [
    {
      title: "Alternative titles",
      items: [
        `${titleCore} for ${audienceCore}`,
        `${titleCore}: ${goalCore}`,
        `${titleCore} Playbook`,
        `${titleCore} Guide`,
        `${audienceCore} ${goalCore} System`,
      ],
    },
    {
      title: "Enhanced subtitle directions",
      items: [
        `${audience || "Correct reader"} short roadmap delivering ${goal || "measurable result"}`,
        `A clear ${titleCore} system instead of scattered attempts`,
        `A decision guide from first application to sustainable result`,
        `${intent === "kdp_publish" ? "Amazon KDP" : "Real world"} applicable step-by-step framework`,
      ],
    },
    {
      title: "Positioning notes",
      items: [
        "The title should show the topic, the subtitle should show the result and audience.",
        "Add method, segment, or use case instead of generic concept.",
        "The title should show the topic, the subtitle should show the result and audience.",
        "Title should be memorable; subtitle should convince.",
      ],
    },
  ];

  const { strengths, risks } = buildStrengthsAndRisks(
    dimensions,
    [
      dimensions[0].score >= 74 ? "Title works well in length; this provides first-glance clarity." : "",
      dimensions[1].score >= 72 ? "Subtitle carries a promise; conversion sentence can be built." : "",
      dimensions[4].score >= 70 ? "Title is close to memorable in terms of rhythm." : "",
    ].filter(Boolean),
    [
      dimensions[0].score < 66 ? "Shorten the title or reduce generic words." : "",
      dimensions[1].score < 66 ? "Add open-ended result and time/output signal in Subtitle." : "",
      dimensions[3].score < 66 ? "Who it was written for should be more visible." : "",
    ].filter(Boolean),
  );

  return {
    overallScore,
    verdict: verdictFromScore(overallScore),
    recommendedFormat,
    recommendedAngle: `Don't leave the title as just a nice-sounding label. For ${audience || "the right reader"} build a more promising title + subtitle pair around ${goalCore}.`,
    strongestPoints: strengths,
    risks,
    nextStep: "Move the best title pair to the preview flow and fix the book position around it.",
    dimensions,
    reportSections,
  };
}

export const marketingToolCatalog: MarketingToolSummary[] = [
  {
    slug: "book-idea-validator",
    id: "book_idea_validator",
    name: "Book Idea Evaluator",
    badge: "Idea",
    path: "/tools/book-idea-validator",
    description: "Scores your idea's strength, suggests a format, and provides a draft starting point.",
    shortLabel: "Idea Test",
    ctaLabel: "Test Idea",
    icon: "sparkles",
    experience: "custom",
    steps: [
      "Enter your book topic or idea",
      "AI analyzes market potential and format fit",
      "Get detailed score, format suggestion, and starting point via email"
    ]
  },
  {
    slug: "book-outline-starter",
    id: "book_outline_starter",
    name: "Book Outline Generator",
    badge: "Structure",
    path: "/tools/book-outline-starter",
    description: "Converts your topic into a clear 8-chapter outline and prepares it for preview.",
    shortLabel: "Draft Creator",
    ctaLabel: "Generate Draft",
    icon: "layers",
    experience: "generic",
    steps: [
      "Enter your topic, target reader, and goal",
      "AI generates 8-chapter backbone with editorial notes",
      "Receive complete outline structure and move to preview"
    ]
  },
  {
    slug: "content-to-book-mapper",
    id: "content_to_book_mapper",
    name: "Content to Book Converter",
    badge: "Conversion",
    path: "/tools/content-to-book-mapper",
    description: "Converts existing course, blog, or podcast content into a book backbone.",
    shortLabel: "Content Converter",
    ctaLabel: "Convert",
    icon: "book",
    experience: "generic",
    steps: [
      "Paste your existing content (course, blog, or podcast transcript)",
      "AI analyzes and organizes into book structure",
      "Get mapped chapter outline with content recommendations"
    ]
  },
  {
    slug: "kdp-niche-score",
    id: "kdp_niche_score",
    name: "KDP Niche Scorer",
    badge: "Market",
    path: "/tools/kdp-niche-score",
    description: "Scores your KDP micro niche, suggests subtitle angles and metadata.",
    shortLabel: "KDP Niche Analysis",
    ctaLabel: "Score Niche",
    icon: "search",
    experience: "generic",
    steps: [
      "Enter your book niche or topic area",
      "AI analyzes Amazon KDP market competition and demand",
      "Receive niche score, subtitle angles, and metadata recommendations"
    ]
  },
  {
    slug: "lead-magnet-book-angle-finder",
    id: "lead_magnet_book_angle_finder",
    name: "Client-Attracting Book Angle Finder",
    badge: "Target",
    path: "/tools/lead-magnet-book-angle-finder",
    description: "Turns your expertise into a short book hook that attracts customers.",
    shortLabel: "Angle Finder",
    ctaLabel: "Find the Angle",
    icon: "magnet",
    experience: "generic",
    steps: [
      "Describe your expertise and target customers",
      "AI identifies compelling book angles and hooks",
      "Get specific book concepts that attract your ideal clients"
    ]
  },
  {
    slug: "title-subtitle-critic",
    id: "title_subtitle_critic",
    name: "Title and Subtitle Critic",
    badge: "Copy",
    path: "/tools/title-subtitle-critic",
    description: "Critiques title pair for clarity, promise, and positioning.",
    shortLabel: "Title Critique",
    ctaLabel: "Test Title",
    icon: "pen",
    experience: "generic",
    steps: [
      "Enter your book title and subtitle",
      "AI critiques for clarity, promise, and market positioning",
      "Receive detailed feedback and improvement suggestions"
    ]
  },
];

export const genericMarketingToolDefinitions: GenericMarketingToolDefinition[] = [
  {
    slug: "book-outline-starter",
    id: "book_outline_starter",
    name: "Book Outline Generator",
    badge: "Free Tool",
    path: "/tools/book-outline-starter",
    description: "Converts your topic into a clear 8-chapter backbone and prepares it for the preview flow.",
    shortLabel: "Outline Creator",
    ctaLabel: "Generate Outline",
    icon: "layers",
    experience: "generic",
    metaTitle: "Book Outline Generator | Book Generator",
    metaDescription: "Enter your topic, target reader, and goal. Book Outline Generator provides an 8-chapter backbone and editorial notes for a quick start.",
    keywords: ["book outline generator", "book chapter planner", "nonfiction outline tool", "book structure tool"],
    heroTitle: "Extract the book backbone before your topic scatters.",
    heroDescription:
      "Enter topic, audience, and goal. The tool converts the topic into an 8-chapter skeleton, flags weak links, and prepares you for the preview flow.",
    formIntro: "90-second outline test",
    placeholderTitle: "First draft signal will appear here",
    placeholderText: "Fill in your topic, analyze it, and see the chapter signal. When the full report opens, the suggested backbone and editorial notes appear.",
    gateTitle: "Unlock the full chapter backbone",
    gateDescription: "8-chapter outline, editorial notes, and clear angle for preview delivered via email.",
    nextStepTitle: "If the outline is ready, the next step is to move to preview.",
    nextStepDescription: "Move this skeleton to the wizard, see the tone of the first chapter, and test whether the book really works on the decision surface.",
    previewCtaLabel: "Start Preview with Outline",
    samples: [
      {
        label: "Consulting book",
        values: {
          topic: "Consulting system generating inbound leads via LinkedIn",
          audience: "B2B consultants and boutique agency owners",
          goal: "Generate higher-quality sales meetings",
          bookType: "authority_book",
          language: "turkish",
        },
      },
      {
        label: "Lead magnet guide",
        values: {
          topic: "Email list building system for coaches in the first 30 days",
          audience: "Coaches and solo education creators",
          goal: "Collect consulting requests with a lead magnet book",
          bookType: "lead_magnet",
          language: "turkish",
        },
      },
      {
        label: "KDP guide",
        values: {
          topic: "Mini greenhouse setup guide for renters",
          audience: "Beginners doing small-space gardening in the US",
          goal: "Produce a clear micro-niche guide for KDP",
          bookType: "kdp_publish",
          language: "english",
        },
      },
    ],
    benefits: [
      {
        icon: "layers",
        title: "Chapter backbone",
        description: "Not just listing topic headings, but building a readable flow.",
      },
      {
        icon: "compass",
        title: "Editorial direction",
        description: "See what each chapter does and why it's there.",
      },
      {
        icon: "trending",
        title: "Completion signal",
        description: "See the risk of the book being left unfinished at the outline stage.",
      },
    ],
    fields: [
      { name: "topic", label: "Book topic", type: "textarea", placeholder: "E.g. paid newsletter growth system for content creators", minLength: 10, required: true },
      { name: "audience", label: "Who will read this book?", type: "input", placeholder: "E.g. solo creators, consultants, educators", minLength: 6, required: true },
      { name: "goal", label: "What should the book deliver at the end?", type: "input", placeholder: "E.g. a clear process, more leads or KDP sales signals", minLength: 8, required: true },
      {
        name: "bookType",
        label: "Which format are you targeting?",
        type: "select",
        required: true,
        options: [
          { value: "authority_book", label: "Authority book" },
          { value: "lead_magnet", label: "Lead magnet book" },
          { value: "paid_guide", label: "Premium short guide" },
          { value: "kdp_publish", label: "KDP nonfiction" },
        ],
      },
      {
        name: "language",
        label: "Production language",
        type: "select",
        required: true,
        options: [
          { value: "turkish", label: "Turkish" },
          { value: "english", label: "English" },
          { value: "multilingual", label: "Multilingual" },
        ],
      },
    ],
    buildPreviewHref: (values) =>
      buildPreviewHref({
        topic: values.topic || "Book topic",
        audience: values.audience,
        language: values.language,
        bookType: values.bookType,
      }),
    evaluate: outlineStarterEvaluation,
  },
  {
    slug: "content-to-book-mapper",
    id: "content_to_book_mapper",
    name: "Content to Book Converter",
    badge: "Free Tool",
    path: "/tools/content-to-book-mapper",
    description: "Converts existing course, blog, podcast or framework content into a book.",
    shortLabel: "Content Converter",
    ctaLabel: "Generate Map",
    icon: "book",
    experience: "generic",
    metaTitle: "Content to Book Converter | Book Generator",
    metaDescription: "See how your course, podcast, blog or framework content can be converted into a book in seconds. Get content clusters and a conversion plan.",
    keywords: ["content to book", "convert course to book", "podcast to book", "content repurposing book"],
    heroTitle: "Extract the map that turns scattered content into a book.",
    heroDescription:
      "Enter your course, workshop, podcast or newsletter content. The tool shows which clusters will live in the book, which gaps need filling, and how to position it.",
    formIntro: "Conversion test",
    placeholderTitle: "Bookification map will appear here",
    placeholderText: "Enter content type and purpose. The tool instantly shows clusterable parts, missing links, and bookification order.",
    gateTitle: "Unlock the full bookification plan",
    gateDescription: "Content clusters, missing piece warnings, and a clear conversion plan for preview delivered via email.",
    nextStepTitle: "After generating the map, test the first chapter.",
    nextStepDescription: "Move the best content cluster to the wizard, see the first chapter in preview, and verify whether the repurpose flow actually works.",
    previewCtaLabel: "Start Preview with Map",
    samples: [
      {
        label: "Workshop set",
        values: {
          sourceType: "course_workshop",
          assetSummary: "3-module workshop series: packaging and pricing system for freelance designers",
          audience: "Freelance designers and creative service professionals",
          goal: "Convert workshop content into an authority book",
          materialDepth: "rich",
          language: "turkish",
        },
      },
      {
        label: "Podcast archive",
        values: {
          sourceType: "blog_podcast",
          assetSummary: "20-episode podcast: calm operations and team rituals for solo founders",
          audience: "Solo founders and small team leaders",
          goal: "Turn podcast into a short paid guide",
          materialDepth: "medium",
          language: "english",
        },
      },
      {
        label: "Consulting framework",
        values: {
          sourceType: "consulting_framework",
          assetSummary: "Revenue ops diagnostic framework, client onboarding checklists and audit decks",
          audience: "B2B SaaS founders and revenue leaders",
          goal: "Produce a short authority book for lead generation",
          materialDepth: "rich",
          language: "turkish",
        },
      },
    ],
    benefits: [
      {
        icon: "book",
        title: "Content clusters",
        description: "Clarifies which module, section or series should merge in the book.",
      },
      {
        icon: "layers",
        title: "Gap analysis",
        description: "Spot missing cases, transitions and closing pieces in advance.",
      },
      {
        icon: "target",
        title: "New purpose",
        description: "Position content not just for archiving, but with a new conversion purpose.",
      },
    ],
    fields: [
      {
        name: "sourceType",
        label: "Which content type are you coming from?",
        type: "select",
        required: true,
        options: [
          { value: "course_workshop", label: "Course / workshop" },
          { value: "blog_podcast", label: "Blog / podcast series" },
          { value: "consulting_framework", label: "Consulting framework" },
          { value: "newsletter_content", label: "Newsletter / content series" },
        ],
      },
      { name: "assetSummary", label: "What content do you have?", type: "textarea", placeholder: "E.g. 12-lesson course, 30 newsletters, 8 case studies and sales deck", minLength: 12, required: true },
      { name: "audience", label: "Who is the book for?", type: "input", placeholder: "E.g. first-time founders, consultants, team leaders", minLength: 6, required: true },
      { name: "goal", label: "What should this book produce?", type: "input", placeholder: "E.g. authority, demo requests, course sales or KDP revenue", minLength: 8, required: true },
      {
        name: "materialDepth",
        label: "Material depth",
        type: "select",
        required: true,
        options: [
          { value: "light", label: "Scattered / light" },
          { value: "medium", label: "Medium" },
          { value: "rich", label: "Deep and repetitive" },
        ],
      },
      {
        name: "language",
        label: "Production language",
        type: "select",
        required: true,
        options: [
          { value: "turkish", label: "Turkish" },
          { value: "english", label: "English" },
          { value: "multilingual", label: "Multilingual" },
        ],
      },
    ],
    buildPreviewHref: (values) =>
      buildPreviewHref({
        topic: values.assetSummary || "Current content",
        audience: values.audience,
        language: values.language,
        bookType: "authority_book",
      }),
    evaluate: contentToBookMapperEvaluation,
  },
  {
    slug: "kdp-niche-score",
    id: "kdp_niche_score",
    name: "KDP Niche Scorer",
    badge: "Free Tool",
    path: "/tools/kdp-niche-score",
    description: "Clarifies your KDP title by providing micro niche, subtitle angle and metadata starters.",
    shortLabel: "KDP Niche Analysis",
    ctaLabel: "Score Niche",
    icon: "search",
    experience: "generic",
    metaTitle: "KDP Niche Scorer | Book Generator",
    metaDescription: "Score how defensible your niche is for Amazon KDP. Get subtitle angles, metadata starters and a mini chapter path.",
    keywords: ["kdp niche score", "amazon kdp niche tool", "kdp title ideas", "nonfiction kdp niche tool"],
    heroTitle: "Pick a micro niche in KDP without drowning.",
    heroDescription:
      "Enter your niche, target reader and promise sentence. The tool reveals how narrow your niche is, whether competition is manageable, and subtitle directions.",
    formIntro: "Micro-niche test",
    placeholderTitle: "Niche report will appear here",
    placeholderText: "Enter your niche, audience and promise sentence. The tool explains the micro niche signal, competition manageability and series opportunity.",
    gateTitle: "Unlock subtitle and metadata set",
    gateDescription: "Subtitle angles, metadata starters and mini chapter path delivered via email.",
    nextStepTitle: "The right micro niche is verified with a quick preview.",
    nextStepDescription: "Move the strongest subtitle direction to the wizard, see the sample chapter flow, and test whether the niche is truly defensible enough to become a book.",
    previewCtaLabel: "Start Preview with Niche",
    samples: [
      {
        label: "Micro niche",
        values: {
          niche: "Analog planning systems for adults with ADHD",
          audience: "US adults who want to keep productivity tools simple",
          promise: "turn a scattered task list into a sustainable weekly rhythm",
          competition: "medium",
          language: "english",
        },
      },
      {
        label: "TR niche",
        values: {
          niche: "Balcony greenhouse setup guide for beginners",
          audience: "Readers starting to grow in small city apartments",
          promise: "get the first harvest in 60 days",
          competition: "low",
          language: "turkish",
        },
      },
      {
        label: "High competition",
        values: {
          niche: "productivity for founders",
          audience: "Seed-stage SaaS founders",
          promise: "calm operations system instead of a scattered calendar",
          competition: "high",
          language: "english",
        },
      },
    ],
    benefits: [
      {
        icon: "search",
        title: "Micro niche narrowing",
        description: "Drops the general category and finds a defensible title space.",
      },
      {
        icon: "trending",
        title: "Competition signal",
        description: "See if you need to narrow the title further.",
      },
      {
        icon: "pen",
        title: "Subtitle directions",
        description: "Produces the first subtitle and metadata set for KDP listing.",
      },
    ],
    fields: [
      { name: "niche", label: "Your niche idea", type: "textarea", placeholder: "E.g. miniature greenhouse gardening for renters", minLength: 10, required: true },
      { name: "audience", label: "Who will buy this niche?", type: "input", placeholder: "E.g. first-time small-space growers in the US", minLength: 6, required: true },
      { name: "promise", label: "What result will the book promise?", type: "input", placeholder: "E.g. get the first harvest in 60 days, make fewer mistakes", minLength: 8, required: true },
      {
        name: "competition",
        label: "Competition feel",
        type: "select",
        required: true,
        options: [
          { value: "low", label: "Low / niche" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High / crowded" },
        ],
      },
      {
        name: "language",
        label: "Publication language",
        type: "select",
        required: true,
        options: [
          { value: "english", label: "English" },
          { value: "turkish", label: "Turkish" },
          { value: "multilingual", label: "Multilingual" },
        ],
      },
    ],
    buildPreviewHref: (values) =>
      buildPreviewHref({
        topic: values.niche || "KDP niche",
        audience: values.audience,
        language: values.language,
        bookType: "kdp_publish",
      }),
    evaluate: kdpNicheScoreEvaluation,
  },
  {
    slug: "lead-magnet-book-angle-finder",
    id: "lead_magnet_book_angle_finder",
    name: "Client-Attracting Book Angle Finder",
    badge: "Free Tool",
    path: "/tools/lead-magnet-book-angle-finder",
    description: "Turns your expertise into a short book angle that attracts customers.",
    shortLabel: "Angle Finder",
    ctaLabel: "Find the Angle",
    icon: "magnet",
    experience: "generic",
    metaTitle: "Client-Attracting Book Angle Finder | Book Generator",
    metaDescription: "Turn your expertise into a lead-generating short book angle. Find the right angle and mini guide backbone with target client, offer and outcome info.",
    keywords: ["lead magnet book", "authority book angle", "client attracting book", "client attracting book"],
    heroTitle: "Turn your expertise into a client-attracting short book.",
    heroDescription:
      "Write what you sell, who you sell to, and what result you accelerate. The tool infers which book angle will generate more trust and meeting requests.",
    formIntro: "Angle test",
    placeholderTitle: "Lead magnet angle will appear here",
    placeholderText: "Enter your expertise area and ideal client. The tool shows the right promise sentence, outline direction and CTA opportunities for the short book.",
    gateTitle: "Unlock the full angle set",
    gateDescription: "Angle suggestions, short guide outline and CTA opportunities delivered via email.",
    nextStepTitle: "Once you find the angle, move to producing the short guide.",
    nextStepDescription: "Move the chosen angle to the preview flow, see the first chapter and CTA tone, then convert the book into a full client-attracting package.",
    previewCtaLabel: "Start Preview with Angle",
    samples: [
      {
        label: "Consulting",
        values: {
          expertise: "B2B SaaS onboarding audit and retention framework",
          client: "SaaS founders struggling with activation after PLG",
          outcome: "detect and fix activation drop in the first 30 days",
          offerType: "consulting",
          language: "turkish",
        },
      },
      {
        label: "Coaching",
        values: {
          expertise: "Premium package positioning system for ICF coaches",
          client: "Coaches who feel they're selling their offer too cheap",
          outcome: "sell higher-priced session packages",
          offerType: "coaching",
          language: "turkish",
        },
      },
      {
        label: "Course",
        values: {
          expertise: "Newsletter growth engine for niche creators",
          client: "Creators who have an audience but their email list is growing slowly",
          outcome: "reach the first 1000 email subscribers with a lead magnet",
          offerType: "course",
          language: "english",
        },
      },
    ],
    benefits: [
      {
        icon: "magnet",
        title: "Lead-focused angle",
        description: "Ensures the book generates trust and demand, not sales.",
      },
      {
        icon: "target",
        title: "Right customer",
        description: "Clarifies who to speak to, reduces the risk of writing for everyone.",
      },
      {
        icon: "book",
        title: "Short guide backbone",
        description: "Makes the book a conversion-focused guide, not a long authority text.",
      },
    ],
    fields: [
      { name: "expertise", label: "Which expertise are you packaging?", type: "textarea", placeholder: "E.g. premium pricing, retention audit, webinar conversion system", minLength: 10, required: true },
      { name: "client", label: "Which client will read this book?", type: "input", placeholder: "E.g. SaaS founders, coaches, consultants, creators", minLength: 6, required: true },
      { name: "outcome", label: "What result should the book accelerate?", type: "input", placeholder: "E.g. more demos, better pricing, faster email growth", minLength: 8, required: true },
      {
        name: "offerType",
        label: "What offer is at the end?",
        type: "select",
        required: true,
        options: [
          { value: "consulting", label: "Consulting" },
          { value: "coaching", label: "Coaching" },
          { value: "course", label: "Course" },
          { value: "service", label: "Service" },
          { value: "community", label: "Community" },
        ],
      },
      {
        name: "language",
        label: "Production language",
        type: "select",
        required: true,
        options: [
          { value: "turkish", label: "Turkish" },
          { value: "english", label: "English" },
          { value: "multilingual", label: "Multilingual" },
        ],
      },
    ],
    buildPreviewHref: (values) =>
      buildPreviewHref({
        topic: values.expertise || "Lead magnet book",
        audience: values.client,
        language: values.language,
        bookType: "lead_magnet",
      }),
    evaluate: leadMagnetBookAngleFinderEvaluation,
  },
  {
    slug: "title-subtitle-critic",
    id: "title_subtitle_critic",
    name: "Title and Subtitle Critic",
    badge: "Free Tool",
    path: "/tools/title-subtitle-critic",
    description: "Critiques title and subtitle pair for clarity, promise and positioning.",
    shortLabel: "Title Critique",
    ctaLabel: "Test Title",
    icon: "pen",
    experience: "generic",
    metaTitle: "Title and Subtitle Critic | Book Generator",
    metaDescription: "Score your book title and subtitle for clarity, promise and memorability. Get alternative titles and subtitle directions.",
    keywords: ["book title critic", "subtitle generator", "book title analysis", "nonfiction title ideas"],
    heroTitle: "Don't settle for a title that just sounds good.",
    heroDescription:
      "Enter your title, subtitle and target reader. The tool scores how clear the pair is, suggests stronger variations and subtitle directions.",
    formIntro: "Title fit test",
    placeholderTitle: "Title critique will appear here",
    placeholderText: "Enter title and subtitle. The tool instantly scores first-glance clarity, promise power and audience signal.",
    gateTitle: "Unlock alternative title set",
    gateDescription: "Alternative titles, subtitle directions and positioning notes delivered via email.",
    nextStepTitle: "If a strong title is chosen, build the book around it.",
    nextStepDescription: "Move the winning title pair to the preview flow, fix the first chapter and sales page tone around the same positioning.",
    previewCtaLabel: "Start Preview with Title",
    samples: [
      {
        label: "Authority",
        values: {
          title: "Silent Offers",
          subtitle: "How boutique consultants turn trust into inbound pipeline without daily content chaos",
          audience: "B2B consultants and solo agency owners",
          goal: "generate inbound leads",
          intent: "authority_book",
        },
      },
      {
        label: "Lead magnet",
        values: {
          title: "First 1000 Emails",
          subtitle: "A calm newsletter growth guide for niche creators who hate growth hacks",
          audience: "Niche creators",
          goal: "grow email list",
          intent: "lead_magnet",
        },
      },
      {
        label: "KDP",
        values: {
          title: "Balcony Harvest",
          subtitle: "A starter system for renters who want to grow food in tiny urban spaces",
          audience: "Beginners doing small-space gardening",
          goal: "KDP sales in a micro niche",
          intent: "kdp_publish",
        },
      },
    ],
    benefits: [
      {
        icon: "pen",
        title: "Clarity score",
        description: "See if the title really shows what it's about at first glance.",
      },
      {
        icon: "trending",
        title: "Promise power",
        description: "Measures whether the subtitle builds a result sentence.",
      },
      {
        icon: "target",
        title: "Audience signal",
        description: "Quickly read whether it's calling the right reader.",
      },
    ],
    fields: [
      { name: "title", label: "Title", type: "input", placeholder: "E.g. Silent Offers", minLength: 3, required: true },
      { name: "subtitle", label: "Subtitle", type: "textarea", placeholder: "E.g. How boutique consultants turn trust into inbound pipeline without daily content chaos", minLength: 8, required: true },
      { name: "audience", label: "Target reader", type: "input", placeholder: "E.g. consultants, creators, KDP readers", minLength: 6, required: true },
      { name: "goal", label: "What result should the title sell?", type: "input", placeholder: "E.g. leads, authority, sales or a clear conversion", minLength: 8, required: true },
      {
        name: "intent",
        label: "Book type",
        type: "select",
        required: true,
        options: [
          { value: "authority_book", label: "Authority book" },
          { value: "lead_magnet", label: "Lead magnet book" },
          { value: "paid_guide", label: "Premium short guide" },
          { value: "kdp_publish", label: "KDP nonfiction" },
        ],
      },
    ],
    buildPreviewHref: (values) =>
      buildPreviewHref({
        topic: [values.title, values.subtitle].filter(Boolean).join(" - ") || "Book title",
        audience: values.audience,
        language: "turkish",
        bookType: values.intent,
      }),
    evaluate: titleSubtitleCriticEvaluation,
  },
];

export function getMarketingToolBySlug(slug: MarketingToolSlug) {
  return marketingToolCatalog.find((tool) => tool.slug === slug) || null;
}

export function getGenericMarketingToolBySlug(slug: string) {
  return genericMarketingToolDefinitions.find((tool) => tool.slug === slug) || null;
}

export function getGenericMarketingToolSlugs() {
  return genericMarketingToolDefinitions.map((tool) => tool.slug);
}

export function getMarketingToolRelatedCards(slug: MarketingToolSlug) {
  return marketingToolCatalog.filter((tool) => tool.slug !== slug).slice(0, 3);
}

export function evaluateBookIdeaToolForEmail(values: {
  topic: string;
  audience: string;
  goal: string;
  intent: string;
  language: string;
  materials: string;
}) {
  const input = {
    topic: values.topic,
    audience: values.audience,
    goal: values.goal,
    intent: (values.intent || "not_sure") as BookIdeaIntent,
    language: (values.language || "turkish") as BookIdeaLanguage,
    materials: (values.materials || "notes") as "none" | "notes" | "content" | "framework",
  };

  return {
    result: evaluateBookIdea(input),
    previewHref: (() => {
      const url = new URL("https://tool.local/start/topic");
      url.searchParams.set("topic", input.topic);
      url.searchParams.set("audience", input.audience);
      url.searchParams.set("language", mapValidatorLanguageToFunnelLanguage(input.language));
      url.searchParams.set("bookType", mapValidatorIntentToBookType(input.intent));
      return `${url.pathname}${url.search}`;
    })(),
  };
}
