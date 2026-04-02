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
  "için",
  "the",
  "and",
  "for",
  "how",
  "your",
  "guide",
  "kitap",
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
    (/\bfor\b|için|yönelik|owner|coach|consultant|creator|educator|operator/iu.test(input.audience) ? 12 : 0) +
    (input.audience.length > 18 ? 8 : 0);
  return clamp(score, 35, 95);
}

function promiseStrengthScore(input: BookIdeaValidatorInput) {
  const score =
    42 +
    (/\b(help|teach|grow|build|launch|scale|write|publish|create|increase|reduce)\b/iu.test(input.goal) ? 18 : 0) +
    (/\b(sonuç|artır|büyüt|kur|yayınla|yaz|çıkar|dönüştür|ölçekle)\b/iu.test(input.goal) ? 18 : 0) +
    Math.min(uniqueWords(input.goal).length, 5) * 4;
  return clamp(score, 32, 94);
}

function specificityScore(input: BookIdeaValidatorInput) {
  const broadTerms = /\b(kişisel gelişim|business|iş|marketing|sağlık|health|başarı|productivity|verimlilik)\b/iu.test(
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
    (/\b(client|müşteri|lead|course|kurs|sale|satış|consult|danışman)\b/iu.test(`${input.goal} ${input.audience}`)
      ? 10
      : 0);
  return clamp(score, 36, 96);
}

function buildRecommendedAngle(input: BookIdeaValidatorInput) {
  const topicCore = titleCase(getTopicCore(input) || input.topic.trim());
  const audienceCore = input.audience.trim();
  const goalCore = input.goal.trim();
  return `${topicCore} konusunu genel bir kitap olarak bırakmak yerine, ${audienceCore} için ${goalCore.toLocaleLowerCase(
    "tr-TR",
  )} odağıyla çerçevelemek daha güçlü bir başlangıç sağlar.`;
}

function buildStrongestPoints(input: BookIdeaValidatorInput, scores: Record<DimensionKey, number>) {
  const points: string[] = [];

  if (scores.audienceClarity >= 74) {
    points.push("Hedef okur tanımı yeterince net; bu da başlık ve vaat netliğini güçlendirir.");
  }
  if (scores.promiseStrength >= 72) {
    points.push("Konunun sonucu net tarif edilmiş; bu fikir yalnız bilgi değil dönüşüm vaat ediyor.");
  }
  if (scores.contentDepth >= 72) {
    points.push("Bu konuda bölümleşebilecek kadar malzeme var; mini rehber değil tam iskelet çıkar.");
  }
  if (scores.commercialUtility >= 72) {
    points.push("Kitap, yalnız okunacak bir içerik değil; lead, authority veya satış katkısı da üretebilir.");
  }
  if (scores.differentiation >= 72) {
    points.push("Konu, kişisel yöntem veya framework üzerinden ayrışma potansiyeli taşıyor.");
  }

  while (points.length < 3) {
    points.push("Fikir başlangıç için yeterince somut; küçük bir positioning daraltmasıyla çok daha güçlü hale gelebilir.");
  }

  return points.slice(0, 3);
}

function buildRisks(input: BookIdeaValidatorInput, scores: Record<DimensionKey, number>) {
  const risks: string[] = [];

  if (scores.specificity < 68) {
    risks.push("Konu biraz geniş görünüyor; daha dar bir problem veya segment seçmek kitabı daha okunur yapar.");
  }
  if (scores.audienceClarity < 68) {
    risks.push("Hedef okur daha net yazılmalı; şu an kitap herkese hitap ediyor gibi durabilir.");
  }
  if (scores.promiseStrength < 68) {
    risks.push("Okurun kitap sonunda ne kazanacağı daha güçlü bir sonuç cümlesiyle keskinleştirilmeli.");
  }
  if (scores.contentDepth < 68) {
    risks.push("Mevcut materyal sınırlı olabilir; outline öncesi örnekler, notlar veya vaka seti eklemek iyi olur.");
  }
  if (input.intent === "not_sure") {
    risks.push("Kullanım amacı belirsiz; lead magnet mi authority book mü olduğuna karar vermek yapıyı güçlendirir.");
  }

  while (risks.length < 3) {
    risks.push("Başlık, format ve örnek vaka katmanı doğru kurulmazsa fikir jenerik görünebilir.");
  }

  return risks.slice(0, 3);
}

function buildTitleIdeas(input: BookIdeaValidatorInput) {
  const topicCore = titleCase(getTopicCore(input) || input.topic.trim());
  const audienceCore = input.audience.trim();
  const goalCore = input.goal.trim();

  return [
    `${topicCore}: ${titleCase(audienceCore.split(/\s+/).slice(0, 4).join(" "))} İçin Net Bir Sistem`,
    `${topicCore} Playbook`,
    `${titleCase(goalCore)} İçin ${topicCore}`,
    `${topicCore} ile İlk 90 Gün`,
    `${audienceCore} İçin ${topicCore} Rehberi`,
  ].map((item) => item.replace(/\s+/g, " ").trim());
}

function buildMiniOutline(input: BookIdeaValidatorInput) {
  const topicCore = titleCase(getTopicCore(input) || input.topic.trim());
  const format = getIntentFormat(input.intent);

  return [
    `${format} için giriş: neden şimdi ${topicCore}`,
    "Hedef okurun yaşadığı temel problem ve yanlış varsayımlar",
    `${topicCore} için çekirdek yaklaşım veya framework`,
    "En sık yapılan hatalar ve neden sonuç alınamadığı",
    "Adım adım uygulama planı",
    "Gerçek senaryo, örnek veya mini vaka seti",
    "İlk 7 gün uygulanacak hızlı kazanım planı",
    "Sonraki adım: tam outline ve preview üretimi",
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
    return `${getIntentFormat(input.intent)} yönünde ilerle. Bu fikri şimdi tam outline ve preview akışına taşı.`;
  }
  if (score >= 68) {
    return "Önce hedef okuru ve sonucu bir cümlede keskinleştir; ardından tam outline üretimine geç.";
  }
  return "Bu konuyu daha dar bir segment ve daha net bir sonuç vaadiyle yeniden çerçevele, sonra ikinci analizi çalıştır.";
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
      summary: "Kimin için yazdığın ne kadar net.",
    },
    {
      key: "promiseStrength",
      label: "Promise strength",
      score: scores.promiseStrength,
      weight: 20,
      summary: "Okura hangi sonucu vadettiğin ne kadar açık.",
    },
    {
      key: "specificity",
      label: "Specificity",
      score: scores.specificity,
      weight: 15,
      summary: "Konu ne kadar odaklı ve savunulabilir.",
    },
    {
      key: "differentiation",
      label: "Differentiation",
      score: scores.differentiation,
      weight: 15,
      summary: "Fikirin kişisel yöntem veya açınla ayrışma ihtimali.",
    },
    {
      key: "contentDepth",
      label: "Content depth",
      score: scores.contentDepth,
      weight: 15,
      summary: "Bölümlenebilir malzeme yoğunluğu.",
    },
    {
      key: "commercialUtility",
      label: "Commercial utility",
      score: scores.commercialUtility,
      weight: 15,
      summary: "Lead, authority veya satış katkısı üretme potansiyeli.",
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
