"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/site/section-heading";
import { KDP_GUARANTEE_CLAIM, KDP_LIVE_BOOKS_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

const proofCards = [
  {
    title: "Real KDP publishing proof",
    text: `This is not just a demo. ${KDP_LIVE_BOOKS_CLAIM} books are live on Amazon KDP, proving the publishing system actually works.`,
  },
  {
    title: "See the output, not the promise",
    text: "Explore over 30 multilingual books in the showcase to see what the product actually generates: real covers, real chapters, real EPUB files.",
  },
  {
    title: "Clear and transparent guarantee",
    text: `Users see the cover, chapter plan, and preview before paying and make an informed decision. Plus, books are backed by ${KDP_GUARANTEE_CLAIM}.`,
  },
  {
    title: "No extra API or subscription bills",
    text: `The wizard, preview, upgrade, and export chain are all within the same product. ${NO_API_COST_CLAIM.toLowerCase()} — no need for scattered tools.`,
  },
] as const;

export function HomeTestimonialsSection() {
  return (
    <section className="border-b border-border/80 bg-background py-20">
      <div className="shell">
        <SectionHeading
          badge="User Reviews and Proof"
          title="Does the AI Book Generator Really Work? Here's the Proof"
          description="Published books, real covers, and KDP evidence. Everything you need to know about user experience and reliability."
          align="center"
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {proofCards.map((item) => (
            <Card key={item.title} className="rounded-[28px]">
              <CardContent className="space-y-3">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">{item.title}</h3>
                <p className="text-sm leading-8 text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}