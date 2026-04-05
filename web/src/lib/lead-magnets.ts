export type LeadMagnetSlug = "ai-book-starter-pack";

export type LeadMagnetDeliverySection = {
  title: string;
  items: string[];
  ordered?: boolean;
};

export type LeadMagnetDefinition = {
  slug: LeadMagnetSlug;
  badge: string;
  title: string;
  description: string;
  formTitle: string;
  formDescription: string;
  previewHighlights: string[];
  trustPoints: string[];
  successTitle: string;
  successDescription: string;
  instantAccessItems: string[];
  deliverySections: LeadMagnetDeliverySection[];
  nextStepHref: string;
  nextStepLabel: string;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
};

export const leadMagnetCatalog: LeadMagnetDefinition[] = [
  {
    slug: "ai-book-starter-pack",
    badge: "Email Starter Pack",
    title: "AI Book Writing Starter Pack",
    description:
      "A short guide, checklist, and curated links to publish your first book without staring at a blank page. The goal is not theory — it's to get you directly into the wizard and preview flow.",
    formTitle: "Get the pack via email",
    formDescription:
      "Opens instantly on this page, and a copy lands in your inbox. Only your email is required — no other fields.",
    previewHighlights: [
      "A clear framework to use when filling in your topic summary",
      "7 checkpoint items you shouldn't skip when approving your outline",
      "A quick bug-hunting checklist before EPUB and PDF delivery",
      "Final review notes before uploading to KDP",
      "Direct links to relevant tools and wizards",
    ],
    trustPoints: [
      "Email only, low friction",
      "Instant access + email copy",
      "Connects directly to the start funnel after reading",
    ],
    successTitle: "Pack sent. Quick access is here while you wait.",
    successDescription:
      "The same content will arrive in your email shortly. If you'd like, you can start your own book right now with the quick steps below.",
    instantAccessItems: [
      "Narrow your topic around a single outcome and a single reader type.",
      "Verify that each chapter in your outline carries a decision or transformation.",
      "Don't move to the paid step before seeing your first preview.",
      "Check cover, metadata, and EPUB flow together before exporting.",
    ],
    deliverySections: [
      {
        title: "What's inside the pack?",
        items: [
          "A fill-in-the-blank briefing framework for your topic summary",
          "A quick quality filter for your first outline",
          "Common error points in the EPUB/PDF delivery pipeline",
          "Pre-publish metadata and cover review notes",
        ],
      },
      {
        title: "10-minute action sequence",
        ordered: true,
        items: [
          "Clarify your topic and target reader in a single sentence.",
          "Fill in the topic step in the wizard with this clarity.",
          "Review the outline output using the filter included in the pack.",
          "Open the preview, then decide whether to proceed with the full book.",
        ],
      },
      {
        title: "Who benefits most from this pack?",
        items: [
          "Experts publishing their first non-fiction book or guide",
          "Consultants and instructors who want to write a lead magnet book",
          "Creators who want to quickly test a trial book for KDP",
        ],
      },
    ],
    nextStepHref: "/start/topic",
    nextStepLabel: "Start Free Preview",
    secondaryCtaHref: "/tools",
    secondaryCtaLabel: "Open Tool Hub",
  },
];

export const featuredLeadMagnet = leadMagnetCatalog[0];

export function getLeadMagnetBySlug(slug: string) {
  return leadMagnetCatalog.find((item) => item.slug === slug) || null;
}
