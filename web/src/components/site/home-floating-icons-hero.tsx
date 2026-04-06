"use client";

import {
  FloatingIconsHero,
  type FloatingIconsHeroProps,
} from "@/components/ui/floating-icons-hero-section";
import { SITE_REAL_BOOKS, siteExamplePublicCoverUrl } from "@/lib/site-real-books";
import { KDP_GUARANTEE_CLAIM, KDP_LIVE_BOOKS_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

const heroPositions = [
  "left-[8%] top-[14%]",
  "right-[10%] top-[14%]",
  "left-[12%] top-[54%]",
  "right-[14%] top-[56%]",
  "left-[18%] top-[76%]",
  "right-[20%] top-[78%]",
  "left-[28%] top-[18%]",
  "right-[30%] top-[22%]",
  "left-[30%] top-[68%]",
  "right-[32%] top-[68%]",
  "left-[42%] top-[10%]",
  "right-[42%] top-[10%]",
  "left-[42%] top-[82%]",
  "right-[42%] top-[82%]",
] as const;

const heroBooks = SITE_REAL_BOOKS.slice(0, heroPositions.length);

const heroCovers: FloatingIconsHeroProps["assets"] = heroBooks.map((book, index) => ({
  id: index + 1,
  className: heroPositions[index],
  cover: {
    title: book.title,
    author: book.author,
    badge: book.language,
    palette: [book.palette[0], book.palette[1]],
    imageUrl: siteExamplePublicCoverUrl(book.slug),
  },
}));

export function HomeFloatingIconsHero() {
  return (
    <FloatingIconsHero
      className="border-b border-border/80"
      badge="AI-Powered Book Writing"
      title="Turn your expertise into a book. Get your first EPUB this week."
      subtitle="For consultants, instructors, and content creators: Enter your topic, approve the chapter outline, generate chapters, add a cover, and your publication file is ready."
      ctaText="Start your first book"
      ctaHref="/start/topic"
      secondaryCtaText="View Sample Outputs"
      secondaryCtaHref="/examples"
      trustNote={`No credit card required · Preview first · ${NO_API_COST_CLAIM} · ${KDP_GUARANTEE_CLAIM}`}
      socialProof={{ count: NO_API_COST_CLAIM, rating: KDP_LIVE_BOOKS_CLAIM }}
      assets={heroCovers}
    />
  );
}