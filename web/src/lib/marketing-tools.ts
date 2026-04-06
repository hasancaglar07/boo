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

[Output exceeded 50000 byte limit (59122 bytes total). Full output saved to C:\Users\ihsan\AppData\Local\Temp\.tmptJmjW6\stdout-6. Read it with shell commands like `head`, `tail`, or `sed -n '100,200p'` up to 2000 lines at a time.]