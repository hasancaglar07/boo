import type { Metadata } from "next";

import { MarketingPage } from "@/components/site/marketing-page";
import { BookIdeaValidatorTool } from "@/components/site/book-idea-validator-tool";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Book Idea Validator | Book Generator",
  description:
    "Score your book idea's strength in seconds. Get analysis on target reader, promise, and format; continue with title ideas and a mini outline.",
  path: "/tools/book-idea-validator",
  keywords: [
    "book idea validator",
    "book topic validator",
    "book idea assessment",
    "authority book idea",
    "lead magnet book idea",
    "book outline starter",
  ],
});

export default function BookIdeaValidatorPage() {
  return (
    <MarketingPage>
      <BookIdeaValidatorTool />
    </MarketingPage>
  );
}
