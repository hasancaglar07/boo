export type BookIdeaIntent = "lead_magnet" | "authority_book" | "paid_guide" | "kdp_publish" | "not_sure";
export type BookIdeaLanguage = "turkish" | "english" | "multilingual" | "other";
export type MaterialStatus = "none" | "notes" | "content" | "framework";

export type BookIdeaValidatorInput = {
  topic: string;
  audience: string;
  goal: string;
  intent: BookIdeaIntent;
  language: BookIdeaLanguage;
  materials: MaterialStatus;
};

export function mapValidatorLanguageToFunnelLanguage(language: BookIdeaLanguage) {
  switch (language) {
    case "english":
      return "English";
    case "turkish":
      return "Turkish";
    case "multilingual":
      return "English";
    default:
      return "Turkish";
  }
}

export function mapValidatorIntentToBookType(intent: BookIdeaIntent) {
  switch (intent) {
    case "authority_book":
      return "is";
    case "lead_magnet":
      return "rehber";
    case "paid_guide":
      return "egitim";
    case "kdp_publish":
      return "is";
    default:
      return "rehber";
  }
}

type DimensionKey =
  | "audienceClarity"
  | "promiseStrength"
  | "specificity"
  | "differentiation"
  | "contentDepth"
  | "commercialUtility";

export type BookIdeaValidatorResult = {
  overallScore: number;
  verdict: string;
  recommendedFormat: string;
  recommendedAngle: string;
  strongestPoints: string[];
  risks: string[];
  nextStep: string;
  dimensions: Array<{
    key: DimensionKey;
    label: string;
    score: number;
    weight: number;
    summary: string;
  }>;
  titleIdeas: string[];
  miniOutline: string[];
};

const STOP_WORDS = new Set([
  "ve",
  "ile",
  "bir",
  "for",
  "the",
  "and",
  "for",
  "how",
  "your",
  "guide",
  "book",
  "book",
  "to",
  "of",
  "a",
  "an",
]);

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

function getTopicCore(input: BookIdeaValidatorInput) {
  const words = uniqueWords(input.topic);
  return words.slice(0, 4).join(" ");
}

function getIntentFormat(intent: BookIdeaIntent) {
  switch (intent) {
    case "lead_magnet":
      return "Lead magnet book";
    case "authority_book":
      return "Authority book";
    case "paid_guide":
      return "Premium short guide";
    case "kdp_publish":
      return "KDP nonfiction book";
    default:
      return "Authority-first starter book";
  }
}

function audienceClarityScore(input: BookIdeaValidatorInput) {
  const audienceWords = uniqueWords(input.audience);
  const score =
    45 +
    Math.min(audienceWords.length, 6) * 6 +
    (/\bfor\b|for|targeting|owner|coach|consultant|creator|educator|operator/iu.test(input.audience) ? 12 : 0) +
    (input.audience.length > 18 ? 8 : 0);
  return clamp(score, 35, 95);
}

function promiseStrengthScore(input: BookIdeaValidatorInput) {
  const score =
    42 +
    (/\b(help|teach|grow|build|launch|scale|write|publish|create|increase|reduce)\b/iu.test(input.goal) ? 18 : 0) +
    (/\b(result|increase|grow|build|publish|write|extract|transform|scale)\b/iu.test(input.goal) ? 18 : 0) +
    Math.min(uniqueWords(input.goal).length, 5) * 4;
  return clamp(score, 32, 94);
}

function specificityScore(input: BookIdeaValidatorInput) {
  const broadTerms = /\b(personal development|business|business|marketing|health|health|success|productivity|productivity)\b/iu.test(
    input.topic,
  );
  const score = 58 + Math.min(uniqueWords(input.topic).length, 6) * 5 - (broadTerms ? 14 : 0);
  return clamp(score, 30, 96);
}

function differentiationScore(input: BookIdeaValidatorInput) {
  const score =
    44 +
    (/\b(my|our|benim|bizim|method|framework|system|sistem|metod|playbook|blueprint)\b/iu.test(
      `${input.topic} ${input.goal}`,
    )
      ? 20
      : 0) +
    (input.materials === "framework" ? 14 : 0) +
    (input.materials === "content" ? 8 : 0) +
    (input.language === "multilingual" ? 4 : 0);
  return clamp(score, 28, 95);
}

function contentDepthScore(input: BookIdeaValidatorInput) {
  const score =
    48 +
    (input.materials === "none" ? -8 : 0) +
    (input.materials === "notes" ? 4 : 0) +
    (input.materials === "content" ? 10 : 0) +
    (input.materials === "framework" ? 18 : 0) +
    Math.min(uniqueWords(input.topic).length, 6) * 3;
  return clamp(score, 34, 96);
}

function commercialUtilityScore(input: BookIdeaValidatorInput) {
  const score =
    48 +
    (input.intent === "lead_magnet" ? 18 : 0) +
    (input.intent === "authority_book" ? 16 : 0) +
    (input.intent === "paid_guide" ? 14 : 0) +
    (input.intent === "kdp_publish" ? 12 : 0) +
    (/\b(client|client|lead|course|course|sale|sale|consult|consultant)\b/iu.test(`${input.goal} ${input.audience}`)
      ? 10
      : 0);
  return clamp(score, 36, 96);
}

function buildRecommendedAngle(input: BookIdeaValidatorInput) {
  const topicCore = titleCase(getTopicCore(input) || input.topic.trim());
  const audienceCore = input.audience.trim();
  const goalCore = input.goal.trim();
  return `${topicCore} instead of leaving the topic as a general book, ${audienceCore} for ${goalCore.toLocaleLowerCase(
    "tr-TR",
  )} framing it with a focus provides a stronger start.`;
}

function buildStrongestPoints(input: BookIdeaValidatorInput, scores: Record<DimensionKey, number>) {
  const points: string[] = [];

  if (scores.audienceClarity >= 74) {
    points.push("Target reader definition is clear enough; this strengthens title and promise clarity.");
  }
  if (scores.promiseStrength >= 72) {
    points.push("The outcome of the topic is clearly described; this idea promises transformation, not just information.");
  }
  if (scores.contentDepth >= 72) {
    points.push("There's enough material on this topic to divide into chapters; it produces a full skeleton, not a mini guide.");
  }
  if (scores.commercialUtility >= 72) {
    points.push("The book is not just content to read; it can also generate lead, authority, or sales value.");
  }
  if (scores.differentiation >= 72) {
    points.push("The topic has potential to differentiate through a personal method or framework.");
  }

  while (points.length < 3) {
    points.push("The idea is concrete enough for a start; with a small positioning refinement it can become much stronger.");
  }

  return points.slice(0, 3);
}

function buildRisks(input: BookIdeaValidatorInput, scores: Record<DimensionKey, number>) {
  const risks: string[] = [];

  if (scores.specificity < 68) {
    risks.push("The topic seems somewhat broad; choosing a narrower problem or segment makes the book more readable.");
  }
  if (scores.audienceClarity < 68) {
    risks.push("The target reader should be defined more clearly; currently the book may seem to address everyone.");
  }
  if (scores.promiseStrength < 68) {
    risks.push("What the reader gains at the end of the book should be sharpened with a stronger outcome statement.");
  }
  if (scores.contentDepth < 68) {
    risks.push("Available material may be limited; it would be good to add examples, notes, or case sets before the outline.");
  }
  if (input.intent === "not_sure") {
    risks.push("The usage purpose is unclear; deciding whether it's a lead magnet or authority book strengthens the structure.");
  }

  while (risks.length < 3) {
    risks.push("If the title, format, and example case layer are not set up correctly, the idea may look generic.");
  }

  return risks.slice(0, 3);
}

function buildTitleIdeas(input: BookIdeaValidatorInput) {
  const topicCore = titleCase(getTopicCore(input) || input.topic.trim());
  const audienceCore = input.audience.trim();
  const goalCore = input.goal.trim();

  return [
    `${topicCore}: ${titleCase(audienceCore.split(/\s+/).slice(0, 4).join(" First 90 Days ").trim());
}

function buildMiniOutline(input: BookIdeaValidatorInput) {
  const topicCore = titleCase(getTopicCore(input) || input.topic.trim());
  const format = getIntentFormat(input.intent);

  return [
    `${format} introduction: why ${topicCore}`,
    "The core problem and misconceptions the target reader faces",
    `${topicCore} core approach or framework`,
    "Most common mistakes and why they don't produce results",
    Step-by-step implementation plan,
    "Real scenario, example, or mini case study set",
    First 7-day quick win action plan,
    Next step: full outline and preview generation,
  ];
}

function buildVerdict(score: number) {
  if (score >= 82) return "Strong authority-book candidate";
  if (score >= 72) return "Promising, but tighten the angle";
  if (score >= 60) return "Usable idea, needs sharper positioning";
  return "Early idea, refine before full production";
}

function buildNextStep(input: BookIdeaValidatorInput, score: number) {
  if (score >= 80) {
    return `${getIntentFormat(input.intent)} direction. Move this idea to the full outline and preview flow now.`;
  }
  if (score >= 68) {
    return "First sharpen the target reader and outcome in one sentence; then proceed to full outline generation.";
  }
  return "Reframe this topic with a narrower segment and a clearer outcome promise, then run a second analysis.";
}

export function evaluateBookIdea(input: BookIdeaValidatorInput): BookIdeaValidatorResult {
  const scores: Record<DimensionKey, number> = {
    audienceClarity: audienceClarityScore(input),
    promiseStrength: promiseStrengthScore(input),
    specificity: specificityScore(input),
    differentiation: differentiationScore(input),
    contentDepth: contentDepthScore(input),
    commercialUtility: commercialUtilityScore(input),
  };

  const dimensions: BookIdeaValidatorResult["dimensions"] = [
    {
      key: "audienceClarity",
      label: "Audience clarity",
      score: scores.audienceClarity,
      weight: 20,
      summary: "How clearly you define who you're writing for.",
    },
    {
      key: "promiseStrength",
      label: "Promise strength",
      score: scores.promiseStrength,
      weight: 20,
      summary: "How clear your promised outcome to the reader is.",
    },
    {
      key: "specificity",
      label: "Specificity",
      score: scores.specificity,
      weight: 15,
      summary: "How focused and defensible the topic is.",
    },
    {
      key: "differentiation",
      label: "Differentiation",
      score: scores.differentiation,
      weight: 15,
      summary: "Potential for the idea to differentiate through personal method or angle.",
    },
    {
      key: "contentDepth",
      label: "Content depth",
      score: scores.contentDepth,
      weight: 15,
      summary: "Density of chapter-ready material.",
    },
    {
      key: "commercialUtility",
      label: "Commercial utility",
      score: scores.commercialUtility,
      weight: 15,
      summary: "Potential to generate lead, authority, or sales value.",
    },
  ];

  const overallScore = Math.round(
    dimensions.reduce((total, item) => total + (item.score * item.weight) / 100, 0),
  );

  return {
    overallScore,
    verdict: buildVerdict(overallScore),
    recommendedFormat: getIntentFormat(input.intent),
    recommendedAngle: buildRecommendedAngle(input),
    strongestPoints: buildStrongestPoints(input, scores),
    risks: buildRisks(input, scores),
    nextStep: buildNextStep(input, overallScore),
    dimensions,
    titleIdeas: buildTitleIdeas(input),
    miniOutline: buildMiniOutline(input),
  };
}