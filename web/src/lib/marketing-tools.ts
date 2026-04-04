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
  "için",
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
  /\b(help|teach|build|grow|launch|scale|write|publish|increase|reduce|sonuç|artır|büyüt|kur|yayınla|yaz|dönüştür|satış|lead)\b/iu;
const AUDIENCE_PATTERN =
  /\b(for|için|owner|coach|consultant|creator|educator|founder|marketer|yazar|eğitmen|koç|danışman|uzman|yayıncı)\b/iu;
const METHOD_PATTERN =
  /\b(system|framework|method|playbook|blueprint|sistem|metod|yöntem|harita|çerçeve)\b/iu;
const BROAD_TOPIC_PATTERN =
  /\b(iş|business|marketing|pazarlama|başarı|verimlilik|productivity|kişisel gelişim|health|sağlık|growth)\b/iu;

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

function shortCore(value: string, fallback = "Konu") {
  const words = uniqueWords(value);
  return titleCase(words.slice(0, 4).join(" ")) || fallback;
}

function averageScore(dimensions: MarketingToolDimension[]) {
  const total = dimensions.reduce((sum, dimension) => sum + dimension.score, 0);
  return Math.round(total / Math.max(dimensions.length, 1));
}

function verdictFromScore(score: number) {
  if (score >= 82) return "Güçlü aday";
  if (score >= 70) return "İyi ama biraz daraltılmalı";
  if (score >= 58) return "Temel sinyal var, konumlandırma istiyor";
  return "Önce açıyı sıkılaştır";
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
    strengths.push(candidate ? `${candidate.label} tarafında kullanılabilir bir sinyal var.` : "Çekirdek fikir test etmeye değer.");
  }

  while (risks.length < 3) {
    const candidate = weakest[risks.length];
    risks.push(candidate ? `${candidate.label} alanını biraz daha netleştirmek dönüşümü artırır.` : "Başlık ve vaat netliği biraz daha sıkılaştırılmalı.");
  }

  return { strengths: strengths.slice(0, 3), risks: risks.slice(0, 3) };
}

function outlineStarterEvaluation(values: MarketingToolValues): MarketingToolEvaluation {
  const topic = values.topic || "";
  const audience = values.audience || "";
  const goal = values.goal || "";
  const bookType = values.bookType || "authority_book";
  const topicCore = shortCore(topic, "Kitap konusu");
  const goalCore = goal.trim() || "net bir sonuç";

  const dimensions: MarketingToolDimension[] = [
    {
      key: "focus",
      label: "Konu odağı",
      score: clamp(48 + wordsBonus(topic, 6, 5) - regexBonus(topic, BROAD_TOPIC_PATTERN, 12), 32, 95),
      summary: "Outline güçlü çalışsın diye konu tek bir problem veya dönüşüm etrafında dar olmalı.",
    },
    {
      key: "reader_fit",
      label: "Okur uyumu",
      score: clamp(46 + wordsBonus(audience, 6, 6) + regexBonus(audience, AUDIENCE_PATTERN, 12), 34, 95),
      summary: "Hedef okur net olduğunda bölüm sırası ve örnek tipi daha kolay belirlenir.",
    },
    {
      key: "promise",
      label: "Vaat netliği",
      score: clamp(44 + wordsBonus(goal, 5, 5) + regexBonus(goal, GENERIC_OUTCOME_PATTERN, 16), 34, 94),
      summary: "Kitap sonunda okuyucunun ne alacağı net tarif edilirse taslak daha ikna edici olur.",
    },
    {
      key: "structure",
      label: "Bölümleşme sinyali",
      score: clamp(42 + wordsBonus(topic, 6, 4) + regexBonus(`${topic} ${goal}`, METHOD_PATTERN, 16), 30, 94),
      summary: "Yöntem, sistem veya aşamalı süreç sinyali bölüm omurgasını kolaylaştırır.",
    },
    {
      key: "completion",
      label: "Tamamlama ihtimali",
      score: clamp(50 + (bookType === "lead_magnet" ? 10 : 6) + (values.language === "multilingual" ? -2 : 4), 36, 92),
      summary: "Kapsamın kontrol altında olması kitabın yarım kalma riskini düşürür.",
    },
  ];

  const overallScore = averageScore(dimensions);
  const outlineItems = [
    `${audience || "Hedef okur"} neden ${topicCore.toLocaleLowerCase("tr-TR")} konusunda zorlanıyor?`,
    `Bugün kullanılan ama zayıf kalan yaklaşım`,
    `${topicCore} için temel çerçeve veya çalışma mantığı`,
    `İlk hızlı kazanım ve uygulama adımı`,
    `En sık görülen hatalar ve nasıl önleneceği`,
    `Gerçek örnek veya mini vaka akışı`,
    `Sistemin sürdürülebilir hale getirilmesi`,
    `Sonraki adım: ${goalCore.toLocaleLowerCase("tr-TR")} için çağrı`,
  ];

  const reportSections: MarketingToolReportSection[] = [
    { title: "Önerilen bölüm omurgası", ordered: true, items: outlineItems },
    {
      title: "Editoryal notlar",
      items: [
        "İlk bölümde problem maliyetini sayısallaştır veya görünür kıl.",
        "Orta bölümlerde yalnız teori değil, karar ağacı ve örnek akış göster.",
        "Son bölümde okuyucuyu ürün, danışmanlık veya bir sonraki aksiyona taşı.",
        "Her bölüm başında tek cümlelik vaat kullan.",
      ],
    },
  ];

  const { strengths, risks } = buildStrengthsAndRisks(
    dimensions,
    [
      dimensions[0].score >= 72 ? "Konu yeterince dar; bu da taslak'ın dağılmasını engeller." : "",
      dimensions[1].score >= 72 ? "Hedef okur net olduğu için bölüm tonu kolay oturur." : "",
      dimensions[3].score >= 70 ? "Konu içinde yöntem veya çerçeve sinyali var; bu iyi bölümleşir." : "",
    ].filter(Boolean),
    [
      dimensions[0].score < 65 ? "Konuyu biraz daha daralt; şu haliyle bölümler jenerikleşebilir." : "",
      dimensions[2].score < 65 ? "Okur sonunda hangi sonucu alacak, bunu daha keskin yaz." : "",
      dimensions[3].score < 64 ? "Yöntem, aşama veya karar ağacı katmanı ekle; taslak daha kolay çıkar." : "",
    ].filter(Boolean),
  );

  return {
    overallScore,
    verdict: verdictFromScore(overallScore),
    recommendedFormat: formatBookType(bookType),
    recommendedAngle: `${topicCore} konusunu ${audience || "net bir segment"} için ${goalCore.toLocaleLowerCase(
      "tr-TR",
    )} odağıyla 8 bölümlük bir akışa çevirmek en güçlü başlangıç olur.`,
    strongestPoints: strengths,
    risks,
    nextStep: "Bu taslak'ı önizleme akışına taşı ve ilk bölümün tonunu test et.",
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
  const assetCore = shortCore(assetSummary, "Mevcut içerik");

  const sourceBonus =
    sourceType === "consulting_framework" ? 16 : sourceType === "course_workshop" ? 14 : sourceType === "newsletter_content" ? 10 : 12;
  const depthBonus = materialDepth === "rich" ? 18 : materialDepth === "medium" ? 10 : 4;

  const dimensions: MarketingToolDimension[] = [
    {
      key: "coverage",
      label: "İçerik kapsamı",
      score: clamp(44 + wordsBonus(assetSummary, 7, 4) + depthBonus, 34, 95),
      summary: "Kitaba dönüşüm için dağınık değil kümelenebilir içerik gerekir.",
    },
    {
      key: "repurpose_fit",
      label: "Dönüştürme uyumu",
      score: clamp(48 + sourceBonus + regexBonus(assetSummary, METHOD_PATTERN, 10), 36, 96),
      summary: "Kurs, framework ve düzenli içerik serileri kitaplaştırmaya daha hazırdır.",
    },
    {
      key: "reader_fit",
      label: "Okur eşleşmesi",
      score: clamp(46 + wordsBonus(audience, 6, 6) + regexBonus(audience, AUDIENCE_PATTERN, 10), 34, 95),
      summary: "İçerik formatı kadar o içeriğin kime çevrildiği de önemlidir.",
    },
    {
      key: "commercial_fit",
      label: "Ticari katkı",
      score: clamp(42 + wordsBonus(goal, 5, 5) + regexBonus(goal, GENERIC_OUTCOME_PATTERN, 16), 32, 94),
      summary: "Kitap yalnız içerik derlemesi değil, bir iş amacına da hizmet etmeli.",
    },
    {
      key: "gaps",
      label: "Eksik parça riski",
      score: clamp(62 + (materialDepth === "rich" ? 14 : materialDepth === "medium" ? 6 : -4), 40, 94),
      summary: "Derinlik arttıkça geçiş, örnek ve sonuç bölümleri daha kolay tamamlanır.",
    },
  ];

  const overallScore = averageScore(dimensions);
  const clusterLabel =
    sourceType === "course_workshop"
      ? "modül"
      : sourceType === "consulting_framework"
        ? "framework bloğu"
        : sourceType === "newsletter_content"
          ? "newsletter kümesi"
          : "içerik serisi";

  const reportSections: MarketingToolReportSection[] = [
    {
      title: "Önerilen içerik kümeleri",
      ordered: true,
      items: [
        `${assetCore} için ana problem girişi`,
        `${audience || "Hedef okur"} için temel karar çerçevesi`,
        `En güçlü ${clusterLabel} ve bunların yeniden sıralanması`,
        `Sık tekrar eden içeriğin tek bir merkezi bölüme toplanması`,
        `Örnek vaka ve uygulama bölümünün eklenmesi`,
        `Son bölümde ${goal.toLocaleLowerCase("tr-TR") || "bir sonraki aksiyon"} çağrısı`,
      ],
    },
    {
      title: "Eksik parça uyarıları",
      items: [
        "İçerik parçaları arasında geçiş cümleleri ayrıca yazılmalı.",
        "Tekrarlayan örnekler yerine 1-2 kuvvetli vaka seçilmeli.",
        "Kitap açılışı, içeriği listelemekten çok problemi çerçevelemeli.",
        "Son bölüm hizmet, kurs veya newsletter devamına bağlanmalı.",
      ],
    },
  ];

  const { strengths, risks } = buildStrengthsAndRisks(
    dimensions,
    [
      dimensions[1].score >= 74 ? "Mevcut içerik tipi kitaplaştırma için doğal bir iskelet sunuyor." : "",
      dimensions[0].score >= 72 ? "Elde yeterince malzeme var; kitap sıfırdan yazılmak zorunda değil." : "",
      dimensions[3].score >= 70 ? "Kitap, içeriği yalnız toparlamaz; aynı zamanda dönüşüm üretir." : "",
    ].filter(Boolean),
    [
      dimensions[4].score < 64 ? "Geçiş, vaka ve kapanış bölümleri ayrıca tasarlanmalı." : "",
      dimensions[2].score < 66 ? "İçeriği kimin için yeniden yazdığını daha net tarif et." : "",
      dimensions[0].score < 66 ? "Malzemeyi modül, seri veya tema bazlı kümelere ayır." : "",
    ].filter(Boolean),
  );

  return {
    overallScore,
    verdict: verdictFromScore(overallScore),
    recommendedFormat: "Repurposed authority guide",
    recommendedAngle: `${assetCore} içeriğini olduğu gibi kopyalamak yerine, ${audience || "hedef okur"} için ${
      goal.toLocaleLowerCase("tr-TR") || "net bir dönüşüm"
    } odaklı bir rehbere çevirmek daha güçlü sonuç verir.`,
    strongestPoints: strengths,
    risks,
    nextStep: "Bu kümeleri sihirbaza taşı ve ilk üç bölümü preview içinde test et.",
    dimensions,
    reportSections,
  };
}

function kdpNicheScoreEvaluation(values: MarketingToolValues): MarketingToolEvaluation {
  const niche = values.niche || "";
  const audience = values.audience || "";
  const promise = values.promise || "";
  const competition = values.competition || "medium";
  const nicheCore = shortCore(niche, "Niş");

  const competitionScore = competition === "low" ? 86 : competition === "medium" ? 68 : 46;
  const dimensions: MarketingToolDimension[] = [
    {
      key: "specificity",
      label: "Mikro niş netliği",
      score: clamp(52 + wordsBonus(niche, 6, 5) - regexBonus(niche, BROAD_TOPIC_PATTERN, 14), 34, 96),
      summary: "KDP için geniş konu değil, aranabilir ve savunulabilir mikro niş gerekir.",
    },
    {
      key: "buyer_fit",
      label: "Okur eşleşmesi",
      score: clamp(44 + wordsBonus(audience, 6, 6) + regexBonus(audience, AUDIENCE_PATTERN, 10), 34, 95),
      summary: "Kategori kadar kitabın kimin için olduğu da satış sinyali üretir.",
    },
    {
      key: "promise",
      label: "Vaat gücü",
      score: clamp(44 + wordsBonus(promise, 5, 5) + regexBonus(promise, GENERIC_OUTCOME_PATTERN, 16), 34, 95),
      summary: "Subtitle ve açıklama için somut kazanım cümlesi gerekir.",
    },
    {
      key: "competition",
      label: "Rekabet yönetilebilirliği",
      score: competitionScore,
      summary: "Rekabet sinyali yüksekse başlığı daha da daraltmak gerekir.",
    },
    {
      key: "series",
      label: "Seri potansiyeli",
      score: clamp(46 + wordsBonus(`${niche} ${promise}`, 6, 4) + (competition === "low" ? 10 : 4), 34, 94),
      summary: "İyi mikro niş çoğu zaman yan başlıklar veya seri fırsatı da taşır.",
    },
  ];

  const overallScore = averageScore(dimensions);
  const reportSections: MarketingToolReportSection[] = [
    {
      title: "Subtitle açıları",
      items: [
        `${nicheCore} için pratik başlangıç rehberi`,
        `${audience || "Yeni başlayanlar"} için adım adım ${nicheCore.toLocaleLowerCase("tr-TR")}`,
        `${promise || `${nicheCore.toLocaleLowerCase("tr-TR")} konusunda net sonuç`}`,
        `${nicheCore} hatalarını azaltan saha rehberi`,
        `${nicheCore} için uygulanabilir kısa sistem`,
      ],
    },
    {
      title: "Metadata başlangıçları",
      items: [
        `${nicheCore} guide`,
        `${nicheCore} handbook`,
        `${audience || nicheCore} starter`,
        `${nicheCore} strategy`,
        `${nicheCore} workbook`,
      ],
    },
    {
      title: "Mini bölüm yolu",
      ordered: true,
      items: [
        `Niş problemin maliyeti`,
        `Pazardaki zayıf yaklaşımlar`,
        `${nicheCore} için temel sistem`,
        `Hızlı başlangıç adımları`,
        `Vaka veya örnek sonuçlar`,
        `Sonraki kitap veya seri fırsatı`,
      ],
    },
  ];

  const { strengths, risks } = buildStrengthsAndRisks(
    dimensions,
    [
      dimensions[0].score >= 76 ? "Niş yeterince dar; bu KDP aramalarında avantaj sağlar." : "",
      dimensions[2].score >= 72 ? "Vaat subtitle ve açıklama tarafında iyi taşınabilir." : "",
      dimensions[4].score >= 72 ? "Bu niş tek kitap yerine seri başlangıcına da uygun görünüyor." : "",
    ].filter(Boolean),
    [
      dimensions[0].score < 66 ? "Nişi daha mikro seviyeye indir; aksi halde rekabet boğar." : "",
      dimensions[3].score < 60 ? "Rekabet yüksek; başlığa alt segment veya kullanım durumu ekle." : "",
      dimensions[1].score < 66 ? "Kimin için yazdığını başlığa veya subtitle'a daha net taşı." : "",
    ].filter(Boolean),
  );

  return {
    overallScore,
    verdict: verdictFromScore(overallScore),
    recommendedFormat: "KDP micro-niche nonfiction",
    recommendedAngle: `${nicheCore} konusunu genel bir başlık olarak bırakmak yerine, ${
      audience || "belirli bir okur segmenti"
    } için ${promise.toLocaleLowerCase("tr-TR") || "tek bir ana sonuç"} odağıyla mikro nişleştirmek daha doğru olur.`,
    strongestPoints: strengths,
    risks,
    nextStep: "Bu mikro nişi önizleme akışına taşı ve ilk subtitle setini test et.",
    dimensions,
    reportSections,
  };
}

function leadMagnetBookAngleFinderEvaluation(values: MarketingToolValues): MarketingToolEvaluation {
  const expertise = values.expertise || "";
  const client = values.client || "";
  const outcome = values.outcome || "";
  const offerType = values.offerType || "consulting";
  const expertiseCore = shortCore(expertise, "Uzmanlık");

  const offerBonus =
    offerType === "consulting" ? 16 : offerType === "coaching" ? 14 : offerType === "course" ? 12 : offerType === "service" ? 12 : 10;
  const dimensions: MarketingToolDimension[] = [
    {
      key: "client",
      label: "İdeal müşteri netliği",
      score: clamp(46 + wordsBonus(client, 6, 6) + regexBonus(client, AUDIENCE_PATTERN, 10), 34, 95),
      summary: "Lead magnet kitap, herkese değil doğru müşteriye yazıldığında çalışır.",
    },
    {
      key: "outcome",
      label: "Sonuç cümlesi",
      score: clamp(44 + wordsBonus(outcome, 5, 5) + regexBonus(outcome, GENERIC_OUTCOME_PATTERN, 16), 34, 95),
      summary: "Kısa kitabın vaadi hızlı ve ölçülebilir bir kazanca bağlanmalı.",
    },
    {
      key: "offer",
      label: "Teklif uyumu",
      score: clamp(48 + offerBonus, 40, 96),
      summary: "Kitabın sonunda okutacağın teklif ne kadar netse tool o kadar güçlü çalışır.",
    },
    {
      key: "trust",
      label: "Güven kurma gücü",
      score: clamp(42 + wordsBonus(expertise, 6, 4) + regexBonus(expertise, METHOD_PATTERN, 12), 32, 92),
      summary: "Uzmanlık, çerçeve ve süreç sinyali kitaba otorite kazandırır.",
    },
    {
      key: "conversion",
      label: "Dönüşüm potansiyeli",
      score: clamp(46 + regexBonus(`${client} ${outcome}`, GENERIC_OUTCOME_PATTERN, 12) + offerBonus / 2, 36, 94),
      summary: "Kitap, doğru CTA ile görüşme veya teklif talebine dönebilmelidir.",
    },
  ];

  const overallScore = averageScore(dimensions);
  const reportSections: MarketingToolReportSection[] = [
    {
      title: "Açı önerileri",
      items: [
        `${client || "İdeal müşteri"} için ${outcome.toLocaleLowerCase("tr-TR") || "hızlı kazanım"} rehberi`,
        `${expertiseCore} ile ilk sonucu daha hızlı alma`,
        `${client || "Doğru müşteri"} hatalarını azaltan kısa playbook`,
        `${expertiseCore} kullanarak ilk 30 günde ilerleme planı`,
        `${offerType === "course" ? "Kursa" : "Hizmete"} geçiş yapan kısa otorite kitabı`,
      ],
    },
    {
      title: "Kısa rehber taslağı",
      ordered: true,
      items: [
        `Problem ve yanlış varsayımlar`,
        `Kimler için işe yarar / kimler için yaramaz`,
        `${expertiseCore} çerçevesi`,
        `İlk uygulama adımı`,
        `Örnek senaryo veya vaka`,
        `Teklif veya sonraki adım`,
      ],
    },
    {
      title: "CTA fırsatları",
      items: [
        "Checklist veya worksheet indirimi",
        "Tanı görüşmesi veya demo çağrısı",
        "Mini eğitim veya webinar geçişi",
        "Case study veya teklif sayfasına yönlendirme",
      ],
    },
  ];

  const { strengths, risks } = buildStrengthsAndRisks(
    dimensions,
    [
      dimensions[0].score >= 72 ? "Müşteri tanımı net; bu lead magnet tonu için kritik." : "",
      dimensions[2].score >= 74 ? "Kitabın bağlanacağı teklif net olduğu için dönüşüm köprüsü kurulabilir." : "",
      dimensions[3].score >= 70 ? "Uzmanlık çerçevesi güven kuran bir çekirdek taşıyor." : "",
    ].filter(Boolean),
    [
      dimensions[1].score < 66 ? "Okur kitabın sonunda ne kazanacak, bunu daha keskin yaz." : "",
      dimensions[0].score < 66 ? "Kitabı herkese değil, tek bir müşteri segmentine konuşacak kadar daralt." : "",
      dimensions[2].score < 66 ? "Kitabın sonunda hangi teklifin çağrılacağını netleştir." : "",
    ].filter(Boolean),
  );

  return {
    overallScore,
    verdict: verdictFromScore(overallScore),
    recommendedFormat: "Client-converting short guide",
    recommendedAngle: `${expertiseCore} bilgisini genel uzmanlık kitabı gibi sunmak yerine, ${
      client || "ideal müşteri"
    } için ${outcome.toLocaleLowerCase("tr-TR") || "tek bir ana sonuç"} odaklı kısa rehbere çevirmek daha fazla lead üretir.`,
    strongestPoints: strengths,
    risks,
    nextStep: "Bu açıyı önizleme akışına taşı ve kitabın sonunda bağlayacağın CTA'yı test et.",
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
  const titleCore = shortCore(title, "Başlık");
  const titleWordCount = normalizeWords(title).length;

  const clarityScore =
    titleWordCount >= 2 && titleWordCount <= 8 ? 82 : titleWordCount <= 1 ? 42 : titleWordCount > 12 ? 54 : 70;

  const dimensions: MarketingToolDimension[] = [
    {
      key: "clarity",
      label: "Başlık açıklığı",
      score: clamp(clarityScore - regexBonus(title, BROAD_TOPIC_PATTERN, 10), 34, 94),
      summary: "Başlık çok geniş veya çok kalabalıksa tıklama düşer.",
    },
    {
      key: "promise",
      label: "Subtitle vaadi",
      score: clamp(42 + wordsBonus(`${subtitle} ${goal}`, 6, 5) + regexBonus(`${subtitle} ${goal}`, GENERIC_OUTCOME_PATTERN, 16), 34, 95),
      summary: "Subtitle, okurun neden ilgilenmesi gerektiğini tek cümlede anlatmalı.",
    },
    {
      key: "specificity",
      label: "Özgüllük",
      score: clamp(44 + wordsBonus(`${title} ${subtitle}`, 7, 4) - regexBonus(`${title} ${subtitle}`, BROAD_TOPIC_PATTERN, 12), 32, 94),
      summary: "Genel kelimeler yerine konu, kitle ve sonuç işaretleri gerekir.",
    },
    {
      key: "audience",
      label: "Kitle sinyali",
      score: clamp(42 + wordsBonus(audience, 6, 6) + regexBonus(`${subtitle} ${audience}`, AUDIENCE_PATTERN, 12), 34, 95),
      summary: "Başlığın kimi çağırdığı ne kadar netse doğru tıklama o kadar artar.",
    },
    {
      key: "memorability",
      label: "Akılda kalıcılık",
      score: clamp(76 - Math.max(titleWordCount - 6, 0) * 4 + regexBonus(title, METHOD_PATTERN, 6), 34, 92),
      summary: "Daha kısa ve ritmik başlıklar daha kolay hatırlanır.",
    },
  ];

  const overallScore = averageScore(dimensions);
  const recommendedFormat = formatBookType(intent);
  const audienceCore = shortCore(audience, "Okur");
  const goalCore = goal.trim() || "somut bir sonuç";

  const reportSections: MarketingToolReportSection[] = [
    {
      title: "Alternatif başlıklar",
      items: [
        `${audienceCore} İçin ${titleCore}`,
        `${titleCore}: ${goalCore}`,
        `${titleCore} Playbook`,
        `${titleCore} Rehberi`,
        `${audienceCore} İçin ${goalCore} Sistemi`,
      ],
    },
    {
      title: "Güçlendirilmiş subtitle yönleri",
      items: [
        `${audience || "Doğru okur"} için ${goal.toLocaleLowerCase("tr-TR") || "ölçülebilir sonuç"} sağlayan kısa yol haritası`,
        `Dağınık denemeler yerine net bir ${titleCore.toLocaleLowerCase("tr-TR")} sistemi`,
        `İlk uygulamadan sürdürülebilir sonuca kadar karar rehberi`,
        `${intent === "kdp_publish" ? "Amazon KDP için" : "Gerçek dünyada"} uygulanabilir adım adım çerçeve`,
      ],
    },
    {
      title: "Konumlandırma notları",
      items: [
        "Başlıkta konu, subtitle'da sonuç ve kitle görünmeli.",
        "Genel kavram yerine yöntem, segment veya kullanım durumu ekle.",
        "Subtitle içinde zaman, hata azaltma veya çıktı sinyali kullan.",
        "Başlık akılda kalmalı; subtitle ikna etmeli.",
      ],
    },
  ];

  const { strengths, risks } = buildStrengthsAndRisks(
    dimensions,
    [
      dimensions[0].score >= 74 ? "Başlık uzunluk olarak iyi çalışıyor; bu ilk bakış netliği sağlar." : "",
      dimensions[1].score >= 72 ? "Subtitle vaat taşıyor; dönüşüm cümlesi kurulabiliyor." : "",
      dimensions[4].score >= 70 ? "Başlık ritim açısından akılda kalmaya yakın." : "",
    ].filter(Boolean),
    [
      dimensions[0].score < 66 ? "Başlığı kısalt veya genel kelimeleri azalt." : "",
      dimensions[1].score < 66 ? "Subtitle içinde açık sonuç ve zaman/çıktı sinyali ekle." : "",
      dimensions[3].score < 66 ? "Kimin için yazıldığı daha görünür olmalı." : "",
    ].filter(Boolean),
  );

  return {
    overallScore,
    verdict: verdictFromScore(overallScore),
    recommendedFormat,
    recommendedAngle: `Başlığı yalnız kulağa iyi gelen bir etiket gibi bırakma. ${audience || "doğru okur"} için ${
      goalCore.toLocaleLowerCase("tr-TR")
    } sonucunu daha açık vaat eden bir başlık + subtitle çifti kur.`,
    strongestPoints: strengths,
    risks,
    nextStep: "En iyi başlık çiftini önizleme akışına taşı ve kitap pozisyonunu onun etrafında sabitle.",
    dimensions,
    reportSections,
  };
}

export const marketingToolCatalog: MarketingToolSummary[] = [
  {
    slug: "book-idea-validator",
    id: "book_idea_validator",
    name: "Kitap Fikri Değerlendirici",
    badge: "Fikir",
    path: "/tools/book-idea-validator",
    description: "Fikrin gücünü puanlar, format önerir ve taslak başlangıcı verir.",
    shortLabel: "Fikir Testi",
    ctaLabel: "Fikri Test Et",
    icon: "sparkles",
    experience: "custom",
  },
  {
    slug: "book-outline-starter",
    id: "book_outline_starter",
    name: "Kitap Taslak Oluşturucu",
    badge: "Yapı",
    path: "/tools/book-outline-starter",
    description: "Konunu 8 bölümlük net bir omurgaya çevirir ve önizlemeye hazırlar.",
    shortLabel: "Taslak Oluşturucu",
    ctaLabel: "Taslağı Oluştur",
    icon: "layers",
    experience: "generic",
  },
  {
    slug: "content-to-book-mapper",
    id: "content_to_book_mapper",
    name: "İçerikten Kitaba Dönüştürücü",
    badge: "Dönüşüm",
    path: "/tools/content-to-book-mapper",
    description: "Mevcut kurs, blog veya podcast içeriğini kitap omurgasına çevirir.",
    shortLabel: "İçerik Dönüştürücü",
    ctaLabel: "Dönüştür",
    icon: "book",
    experience: "generic",
  },
  {
    slug: "kdp-niche-score",
    id: "kdp_niche_score",
    name: "KDP Niş Puanlayıcı",
    badge: "Pazar",
    path: "/tools/kdp-niche-score",
    description: "KDP mikro nişini puanlar, alt başlık açısı ve metadata önerir.",
    shortLabel: "KDP Niş Analizi",
    ctaLabel: "Nişi Puanla",
    icon: "search",
    experience: "generic",
  },
  {
    slug: "lead-magnet-book-angle-finder",
    id: "lead_magnet_book_angle_finder",
    name: "Müşteri Çeken Kitap Açısı Bulucu",
    badge: "Hedef",
    path: "/tools/lead-magnet-book-angle-finder",
    description: "Uzmanlığını müşteri çeken kısa kitap açısına dönüştürür.",
    shortLabel: "Açı Bulucu",
    ctaLabel: "Açıyı Bul",
    icon: "magnet",
    experience: "generic",
  },
  {
    slug: "title-subtitle-critic",
    id: "title_subtitle_critic",
    name: "Başlık ve Alt Başlık Eleştirmeni",
    badge: "Kopya",
    path: "/tools/title-subtitle-critic",
    description: "Başlık çiftini netlik, vaat ve konumlandırma açısından eleştirir.",
    shortLabel: "Başlık Eleştirisi",
    ctaLabel: "Başlığı Test Et",
    icon: "pen",
    experience: "generic",
  },
];

export const genericMarketingToolDefinitions: GenericMarketingToolDefinition[] = [
  {
    slug: "book-outline-starter",
    id: "book_outline_starter",
    name: "Kitap Taslak Oluşturucu",
    badge: "Ücretsiz Araç",
    path: "/tools/book-outline-starter",
    description: "Konunu 8 bölümlük net bir omurgaya çevirir ve önizleme akışına hazırlar.",
    shortLabel: "Taslak Oluşturucu",
    ctaLabel: "Taslağı Oluştur",
    icon: "layers",
    experience: "generic",
    metaTitle: "Kitap Taslak Oluşturucu | Kitap Oluşturucu",
    metaDescription: "Konunu, hedef okurunu ve amacını gir. Kitap Taslak Oluşturucu; 8 bölümlük bir kitap omurgası ve editoryal notlarla hızlı başlangıç versin.",
    keywords: ["kitap taslak oluşturucu", "kitap taslak oluşturucu", "kitap bölüm planı", "nonfiction taslak aracı"],
    heroTitle: "Konun dağılmadan önce kitap omurgasını çıkar.",
    heroDescription:
      "Topic, audience ve goal bilgilerini gir. Araç; konuyu 8 bölümlük bir iskelete çevirsin, zayıf halkaları işaretlesin ve seni önizleme akışına hazırlasın.",
    formIntro: "90 saniyelik taslak testi",
    placeholderTitle: "İlk taslak sinyali burada görünecek",
    placeholderText: "Konunu doldur, analyze et ve bölümleşme sinyalini gör. Tam rapor açıldığında önerilen omurga ve editoryal notlar görünür.",
    gateTitle: "Tam bölüm omurgasını aç",
    gateDescription: "8 bölümlük taslak, editoryal notlar ve preview'e taşınacak net açı e-posta ile açılsın.",
    nextStepTitle: "Taslak hazırsa sıradaki iş önizlemeye geçmek.",
    nextStepDescription: "Bu iskeleti sihirbaza taşı, ilk bölümün tonunu gör ve kitabın gerçekten yürüyüp yürümediğini karar yüzeyinde test et.",
    previewCtaLabel: "Taslak ile Önizleme Başlat",
    samples: [
      {
        label: "Danışmanlık kitabı",
        values: {
          topic: "LinkedIn üzerinden inbound lead üreten danışmanlık sistemi",
          audience: "B2B danışmanlar ve butik ajans sahipleri",
          goal: "Daha kaliteli satış görüşmeleri üretmek",
          bookType: "authority_book",
          language: "turkish",
        },
      },
      {
        label: "Lead magnet rehberi",
        values: {
          topic: "Koçlar için ilk 30 günde e-posta listesi kurma sistemi",
          audience: "Koçlar ve solo eğitim üreticileri",
          goal: "Lead magnet kitabı ile danışmanlık talebi toplamak",
          bookType: "lead_magnet",
          language: "turkish",
        },
      },
      {
        label: "KDP bilgi kitabı",
        values: {
          topic: "Renters için mini greenhouse kurulum rehberi",
          audience: "ABD'de küçük alanda yetiştiricilik yapan yeni başlayanlar",
          goal: "KDP için net mikro niş rehber çıkarmak",
          bookType: "kdp_publish",
          language: "english",
        },
      },
    ],
    benefits: [
      {
        icon: "layers",
        title: "Bölüm omurgası",
        description: "Konu başlıklarını sıralamak değil, okunur bir akış kurmak için.",
      },
      {
        icon: "compass",
        title: "Editoryal yön",
        description: "Hangi bölümün ne iş yaptığını ve neden orada olduğunu gör.",
      },
      {
        icon: "trending",
        title: "Tamamlama sinyali",
        description: "Kitabın yarım kalma riskini daha taslak aşamasında gör.",
      },
    ],
    fields: [
      { name: "topic", label: "Kitabın konusu", type: "textarea", placeholder: "Örn. içerik üreticileri için paid newsletter büyütme sistemi", minLength: 10, required: true },
      { name: "audience", label: "Bu kitabı kim okuyacak?", type: "input", placeholder: "Örn. solo creator'lar, danışmanlar, eğitmenler", minLength: 6, required: true },
      { name: "goal", label: "Kitabın sonunda ne sağlanmalı?", type: "input", placeholder: "Örn. net bir süreç, daha fazla lead veya KDP satış sinyali", minLength: 8, required: true },
      {
        name: "bookType",
        label: "Hangi formatı hedefliyorsun?",
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
        label: "Üretim dili",
        type: "select",
        required: true,
        options: [
          { value: "turkish", label: "Türkçe" },
          { value: "english", label: "English" },
          { value: "multilingual", label: "Çok dilli" },
        ],
      },
    ],
    buildPreviewHref: (values) =>
      buildPreviewHref({
        topic: values.topic || "Kitap konusu",
        audience: values.audience,
        language: values.language,
        bookType: values.bookType,
      }),
    evaluate: outlineStarterEvaluation,
  },
  {
    slug: "content-to-book-mapper",
    id: "content_to_book_mapper",
    name: "İçerikten Kitaba Dönüştürücü",
    badge: "Ücretsiz Araç",
    path: "/tools/content-to-book-mapper",
    description: "Mevcut kurs, blog, podcast veya framework içeriğini kitaba dönüştürür.",
    shortLabel: "İçerik Dönüştürücü",
    ctaLabel: "Haritayı Çıkar",
    icon: "book",
    experience: "generic",
    metaTitle: "İçerikten Kitaba Dönüştürücü | Kitap Oluşturucu",
    metaDescription: "Elindeki kurs, podcast, blog veya framework içeriğinin kitaba nasıl çevrileceğini saniyeler içinde gör. İçerik kümeleri ve dönüşüm planı al.",
    keywords: ["content to book", "kursu kitaba çevirme", "podcast to book", "content repurposing book"],
    heroTitle: "Dağınık içeriği kitaba çevirecek haritayı çıkar.",
    heroDescription:
      "Elindeki kurs, workshop, podcast veya newsletter içeriğini yaz. Araç; hangi kümelerin kitapta yaşayacağını, hangi boşlukların doldurulacağını ve nasıl konumlandırılacağını göstersin.",
    formIntro: "Dönüşüm testi",
    placeholderTitle: "Kitaplaştırma haritası burada belirecek",
    placeholderText: "İçerik tipini ve amacını gir. Araç; kümelenebilir parçaları, eksik halkaları ve kitaplaştırma sırasını anında gösterir.",
    gateTitle: "Tam kitaplaştırma planını aç",
    gateDescription: "İçerik kümeleri, eksik parça uyarıları ve preview'e taşınacak net dönüşüm planı e-posta ile açılsın.",
    nextStepTitle: "Haritayı çıkardıktan sonra ilk bölümü test et.",
    nextStepDescription: "En iyi içerik kümesini sihirbaza taşı, ilk bölümü preview içinde gör ve repurpose akışının gerçekten işleyip işlemediğini doğrula.",
    previewCtaLabel: "Harita ile Önizleme Başlat",
    samples: [
      {
        label: "Workshop seti",
        values: {
          sourceType: "course_workshop",
          assetSummary: "3 modüllük workshop serisi: freelance tasarımcıların paket teklif ve fiyatlandırma sistemi",
          audience: "Freelance tasarımcılar ve yaratıcı servis veren uzmanlar",
          goal: "Workshop içeriğini authority kitabına dönüştürmek",
          materialDepth: "rich",
          language: "turkish",
        },
      },
      {
        label: "Podcast arşivi",
        values: {
          sourceType: "blog_podcast",
          assetSummary: "20 bölümlük podcast: solo founder'lar için calm operations ve team rituals",
          audience: "Solo founder'lar ve küçük ekip liderleri",
          goal: "Podcast'ten kısa bir ücretli rehber çıkarmak",
          materialDepth: "medium",
          language: "english",
        },
      },
      {
        label: "Consulting framework",
        values: {
          sourceType: "consulting_framework",
          assetSummary: "Revenue ops teşhis framework'ü, müşteri onboarding checklist'leri ve audit deck'leri",
          audience: "B2B SaaS kurucuları ve revenue liderleri",
          goal: "Lead toplamak için kısa authority book üretmek",
          materialDepth: "rich",
          language: "turkish",
        },
      },
    ],
    benefits: [
      {
        icon: "book",
        title: "İçerik kümeleri",
        description: "Hangi modül, bölüm veya seri kitapta birleşmeli netleşir.",
      },
      {
        icon: "layers",
        title: "Boşluk analizi",
        description: "Eksik vaka, geçiş ve kapanış parçalarını önden görürsün.",
      },
      {
        icon: "target",
        title: "Yeni amaç",
        description: "İçeriği yalnız arşivlemek değil, yeni dönüşüm amacıyla konumlarsın.",
      },
    ],
    fields: [
      {
        name: "sourceType",
        label: "Hangi içerik tipinden geliyorsun?",
        type: "select",
        required: true,
        options: [
          { value: "course_workshop", label: "Kurs / workshop" },
          { value: "blog_podcast", label: "Blog / podcast serisi" },
          { value: "consulting_framework", label: "Danışmanlık framework'ü" },
          { value: "newsletter_content", label: "Newsletter / içerik serisi" },
        ],
      },
      { name: "assetSummary", label: "Elindeki içerik ne?", type: "textarea", placeholder: "Örn. 12 derslik kurs, 30 newsletter, 8 case study ve satış deck'i", minLength: 12, required: true },
      { name: "audience", label: "Kitap kime dönecek?", type: "input", placeholder: "Örn. ilk kez uygulayacak founder'lar, danışmanlar, ekip liderleri", minLength: 6, required: true },
      { name: "goal", label: "Bu kitap ne üretmeli?", type: "input", placeholder: "Örn. authority, demo talebi, course sale veya KDP geliri", minLength: 8, required: true },
      {
        name: "materialDepth",
        label: "Malzeme derinliği",
        type: "select",
        required: true,
        options: [
          { value: "light", label: "Dağınık / hafif" },
          { value: "medium", label: "Orta seviye" },
          { value: "rich", label: "Derin ve tekrar eden" },
        ],
      },
      {
        name: "language",
        label: "Üretim dili",
        type: "select",
        required: true,
        options: [
          { value: "turkish", label: "Türkçe" },
          { value: "english", label: "English" },
          { value: "multilingual", label: "Çok dilli" },
        ],
      },
    ],
    buildPreviewHref: (values) =>
      buildPreviewHref({
        topic: values.assetSummary || "Mevcut içerik",
        audience: values.audience,
        language: values.language,
        bookType: "authority_book",
      }),
    evaluate: contentToBookMapperEvaluation,
  },
  {
    slug: "kdp-niche-score",
    id: "kdp_niche_score",
    name: "KDP Niş Puanlayıcı",
    badge: "Ücretsiz Araç",
    path: "/tools/kdp-niche-score",
    description: "Mikro niş, subtitle açısı ve metadata başlangıcı vererek KDP başlığını netleştirir.",
    shortLabel: "KDP Niş Analizi",
    ctaLabel: "Nişi Puanla",
    icon: "search",
    experience: "generic",
    metaTitle: "KDP Niş Puanlayıcı | Kitap Oluşturucu",
    metaDescription: "Amazon KDP için düşündüğün nişin ne kadar savunulabilir olduğunu puanla. Subtitle açıları, metadata başlangıcı ve mini bölüm yolu al.",
    keywords: ["kdp niche score", "amazon kdp niş aracı", "kdp title ideas", "nonfiction kdp niche tool"],
    heroTitle: "KDP'de boğulmadan mikro nişi seç.",
    heroDescription:
      "Nişini, hedef okurunu ve vaat cümleni gir. Araç; nişin ne kadar dar olduğunu, rekabetin yönetilip yönetilemeyeceğini ve subtitle yönlerini hızlıca ortaya çıkarsın.",
    formIntro: "Micro-niche testi",
    placeholderTitle: "Niş raporu burada görünecek",
    placeholderText: "Nişini, okuyucuyu ve vaat cümlesini gir. Araç; mikro niş sinyalini, rekabet yönetilebilirliğini ve seri fırsatını açıklar.",
    gateTitle: "Subtitle ve metadata setini aç",
    gateDescription: "Subtitle açıları, metadata başlangıçları ve mini bölüm yolu e-posta ile açılsın.",
    nextStepTitle: "Doğru mikro niş, hızlı preview ile doğrulanır.",
    nextStepDescription: "En güçlü subtitle yönünü sihirbaza taşı, örnek bölüm akışını gör ve nişin gerçekten kitap olacak kadar savunulabilir olup olmadığını test et.",
    previewCtaLabel: "Niş ile Preview Başlat",
    samples: [
      {
        label: "Micro niche",
        values: {
          niche: "ADHD'li yetişkinler için analog planning systems",
          audience: "ABD'de üretkenlik araçlarını basit tutmak isteyen yetişkinler",
          promise: "dağınık görev listesini sürdürülebilir haftalık ritme çevirmek",
          competition: "medium",
          language: "english",
        },
      },
      {
        label: "TR niş",
        values: {
          niche: "Yeni başlayanlar için balkon serası kurma rehberi",
          audience: "Küçük şehir dairelerinde yetiştiriciliğe başlayan okurlar",
          promise: "ilk hasadı 60 günde almak",
          competition: "low",
          language: "turkish",
        },
      },
      {
        label: "Yoğun rekabet",
        values: {
          niche: "productivity for founders",
          audience: "Seed-stage SaaS founder'lar",
          promise: "dağınık takvim yerine sakin operasyon sistemi",
          competition: "high",
          language: "english",
        },
      },
    ],
    benefits: [
      {
        icon: "search",
        title: "Mikro niş daraltma",
        description: "Genel kategoriyi bırakıp savunulabilir bir başlık alanı bulur.",
      },
      {
        icon: "trending",
        title: "Rekabet sinyali",
        description: "Başlığı daha da sıkılaştırman gerekip gerekmediğini görürsün.",
      },
      {
        icon: "pen",
        title: "Subtitle yönleri",
        description: "KDP listing için ilk subtitle ve metadata setini çıkarır.",
      },
    ],
    fields: [
      { name: "niche", label: "Düşündüğün niş", type: "textarea", placeholder: "Örn. renters için miniature greenhouse gardening", minLength: 10, required: true },
      { name: "audience", label: "Bu nişi kim satın alacak?", type: "input", placeholder: "Örn. ilk kez küçük alanda yetiştiricilik yapan ABD'li okurlar", minLength: 6, required: true },
      { name: "promise", label: "Kitap hangi sonucu vaat edecek?", type: "input", placeholder: "Örn. ilk hasadı 60 günde almak, daha az hata yapmak", minLength: 8, required: true },
      {
        name: "competition",
        label: "Rekabet hissi",
        type: "select",
        required: true,
        options: [
          { value: "low", label: "Düşük / niş" },
          { value: "medium", label: "Orta" },
          { value: "high", label: "Yüksek / kalabalık" },
        ],
      },
      {
        name: "language",
        label: "Yayın dili",
        type: "select",
        required: true,
        options: [
          { value: "english", label: "English" },
          { value: "turkish", label: "Türkçe" },
          { value: "multilingual", label: "Çok dilli" },
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
    name: "Müşteri Çeken Kitap Açısı Bulucu",
    badge: "Ücretsiz Araç",
    path: "/tools/lead-magnet-book-angle-finder",
    description: "Uzmanlığını müşteri çeken kısa kitap açısına dönüştürür.",
    shortLabel: "Açı Bulucu",
    ctaLabel: "Açıyı Bul",
    icon: "magnet",
    experience: "generic",
    metaTitle: "Müşteri Çeken Kitap Açısı Bulucu | Kitap Oluşturucu",
    metaDescription: "Uzmanlığını lead üreten kısa kitap açısına çevir. Hedef müşteri, teklif ve sonuç bilgisiyle doğru angle ve mini rehber omurgasını bul.",
    keywords: ["lead magnet book", "authority book angle", "client attracting book", "müşteri çeken kitap"],
    heroTitle: "Uzmanlığını müşteri çeken kısa kitaba çevir.",
    heroDescription:
      "Ne sattığını, kime sattığını ve hangi sonucu hızlandırdığını yaz. Araç; hangi kitap açısının daha fazla güven ve görüşme talebi üreteceğini çıkarsın.",
    formIntro: "Açı testi",
    placeholderTitle: "Lead magnet açısı burada görünecek",
    placeholderText: "Uzmanlık alanını ve ideal müşterini gir. Araç; kısa kitabın doğru vaat cümlesini, taslak yönünü ve CTA fırsatlarını gösterir.",
    gateTitle: "Tam açı setini aç",
    gateDescription: "Açı önerileri, kısa rehber taslağı ve CTA fırsatları e-posta ile açılsın.",
    nextStepTitle: "Açıyı bulduysan kısa rehberi üretmeye geç.",
    nextStepDescription: "Seçtiğin açıyı önizleme akışına taşı, ilk bölüm ve CTA tonunu gör, sonra kitabı tam müşteri çekici pakete çevir.",
    previewCtaLabel: "Angle ile Preview Başlat",
    samples: [
      {
        label: "Consulting",
        values: {
          expertise: "B2B SaaS onboarding audit ve retention framework'ü",
          client: "PLG sonrası activation sorunu yaşayan SaaS kurucuları",
          outcome: "ilk 30 günde aktivasyon düşüşünü fark edip düzeltmek",
          offerType: "consulting",
          language: "turkish",
        },
      },
      {
        label: "Coaching",
        values: {
          expertise: "ICF koçları için premium package positioning sistemi",
          client: "Teklifini ucuz sattığını düşünen koçlar",
          outcome: "daha yüksek fiyatlı seans paketi satmak",
          offerType: "coaching",
          language: "turkish",
        },
      },
      {
        label: "Course",
        values: {
          expertise: "Newsletter growth engine for niche creators",
          client: "Audience'ı var ama email listesi yavaş büyüyen creator'lar",
          outcome: "lead magnet ile ilk 1000 email subscriber'a ulaşmak",
          offerType: "course",
          language: "english",
        },
      },
    ],
    benefits: [
      {
        icon: "magnet",
        title: "Lead odaklı açı",
        description: "Kitabın satış değil güven ve talep üretmesini sağlar.",
      },
      {
        icon: "target",
        title: "Doğru müşteri",
        description: "Kime konuşacağını netleştirir, herkese yazma riskini azaltır.",
      },
      {
        icon: "book",
        title: "Kısa rehber omurgası",
        description: "Kitabı uzun authority metni değil, dönüşüm odaklı rehber yapar.",
      },
    ],
    fields: [
      { name: "expertise", label: "Hangi uzmanlığı paketliyorsun?", type: "textarea", placeholder: "Örn. premium pricing, retention audit, webinar conversion system", minLength: 10, required: true },
      { name: "client", label: "Bu kitabı hangi müşteri okuyacak?", type: "input", placeholder: "Örn. SaaS founder'lar, koçlar, danışmanlar, creator'lar", minLength: 6, required: true },
      { name: "outcome", label: "Kitap hangi sonucu hızlandırmalı?", type: "input", placeholder: "Örn. daha çok demo, daha iyi pricing, daha hızlı email growth", minLength: 8, required: true },
      {
        name: "offerType",
        label: "Sonunda hangi teklif var?",
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
        label: "Üretim dili",
        type: "select",
        required: true,
        options: [
          { value: "turkish", label: "Türkçe" },
          { value: "english", label: "English" },
          { value: "multilingual", label: "Çok dilli" },
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
    name: "Başlık ve Alt Başlık Eleştirmeni",
    badge: "Ücretsiz Araç",
    path: "/tools/title-subtitle-critic",
    description: "Başlık ve subtitle çiftini netlik, vaat ve konumlandırma açısından eleştirir.",
    shortLabel: "Başlık Eleştirisi",
    ctaLabel: "Başlığı Test Et",
    icon: "pen",
    experience: "generic",
    metaTitle: "Başlık ve Alt Başlık Eleştirmeni | Kitap Oluşturucu",
    metaDescription: "Kitap başlığını ve subtitle'ını netlik, vaat ve akılda kalıcılık açısından puanla. Alternatif başlıklar ve subtitle yönleri al.",
    keywords: ["book title critic", "subtitle generator", "kitap başlığı analizi", "nonfiction title ideas"],
    heroTitle: "Başlık kulağa iyi geliyor diye yetinme.",
    heroDescription:
      "Başlığını, subtitle'ını ve hedef okurunu gir. Araç; çiftin ne kadar net olduğunu puanlasın, daha güçlü varyasyonlar ve subtitle yönleri önerisin.",
    formIntro: "Title fit testi",
    placeholderTitle: "Başlık eleştirisi burada görünecek",
    placeholderText: "Başlık ve subtitle'ı gir. Araç; ilk bakış netliğini, vaat gücünü ve kitle sinyalini anında puanlar.",
    gateTitle: "Alternatif başlık setini aç",
    gateDescription: "Alternatif başlıklar, subtitle yönleri ve konumlandırma notları e-posta ile açılsın.",
    nextStepTitle: "Güçlü başlık seçildiyse kitabı onun etrafında kur.",
    nextStepDescription: "Kazanan başlık çiftini önizleme akışına taşı, ilk bölüm ve satış sayfası tonunu aynı positioning etrafında sabitle.",
    previewCtaLabel: "Başlıkla Preview Başlat",
    samples: [
      {
        label: "Authority",
        values: {
          title: "Silent Offers",
          subtitle: "How boutique consultants turn trust into inbound pipeline without daily content chaos",
          audience: "B2B danışmanlar ve solo ajans sahipleri",
          goal: "inbound lead üretmek",
          intent: "authority_book",
        },
      },
      {
        label: "Lead magnet",
        values: {
          title: "First 1000 Emails",
          subtitle: "A calm newsletter growth guide for niche creators who hate growth hacks",
          audience: "Niş creator'lar",
          goal: "email listesi büyütmek",
          intent: "lead_magnet",
        },
      },
      {
        label: "KDP",
        values: {
          title: "Balcony Harvest",
          subtitle: "A starter system for renters who want to grow food in tiny urban spaces",
          audience: "Küçük alanda yetiştiricilik yapan yeni başlayanlar",
          goal: "mikro nişte KDP satışı",
          intent: "kdp_publish",
        },
      },
    ],
    benefits: [
      {
        icon: "pen",
        title: "Netlik puanı",
        description: "Başlık gerçekten ne söylediğini ilk bakışta belli ediyor mu görürsün.",
      },
      {
        icon: "trending",
        title: "Vaat gücü",
        description: "Subtitle'ın sonuç cümlesi kurup kurmadığını ölçer.",
      },
      {
        icon: "target",
        title: "Kitle sinyali",
        description: "Doğru okuru çağırıp çağırmadığını hızlıca okursun.",
      },
    ],
    fields: [
      { name: "title", label: "Başlık", type: "input", placeholder: "Örn. Silent Offers", minLength: 3, required: true },
      { name: "subtitle", label: "Subtitle", type: "textarea", placeholder: "Örn. How boutique consultants turn trust into inbound pipeline without daily content chaos", minLength: 8, required: true },
      { name: "audience", label: "Hedef okur", type: "input", placeholder: "Örn. danışmanlar, creator'lar, KDP okurları", minLength: 6, required: true },
      { name: "goal", label: "Başlık hangi sonucu satmalı?", type: "input", placeholder: "Örn. lead, authority, satış veya net bir dönüşüm", minLength: 8, required: true },
      {
        name: "intent",
        label: "Kitap tipi",
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
