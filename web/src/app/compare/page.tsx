import type { Metadata } from "next";
import { Check, X, Minus } from "lucide-react";

import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { DirectAnswerBlock } from "@/components/site/direct-answer";
import { LastUpdated } from "@/components/site/last-updated";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { buildBreadcrumbSchema } from "@/lib/schema";
import { buildPageMetadata, absoluteUrl } from "@/lib/seo";
import { KDP_GUARANTEE_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

export const metadata: Metadata = buildPageMetadata({
  title: "Comparison | Book Creator and Alternatives",
  description:
    "Compare Book Creator against manual writing, general AI assistants, and competing tools. Find out why a specialized book production tool is essential.",
  path: "/compare",
  keywords: ["book generator comparison", "ai book writing alternatives", "chatgpt book", "jasper alternatives"],
});

type Support = "yes" | "no" | "partial";

interface CompareRow {
  feature: string;
  bookGenerator: Support;
  manualAI: Support;
  generalTools: Support;
  note?: string;
}

const rows: CompareRow[] = [
  { feature: "Book-focused topic input system", bookGenerator: "yes", manualAI: "no", generalTools: "no", note: "Other tools accept generic prompts; they don't understand book structure." },
  { feature: "Automatic outline generation", bookGenerator: "yes", manualAI: "partial", generalTools: "partial" },
  { feature: "Consistent chapter-by-chapter generation", bookGenerator: "yes", manualAI: "no", generalTools: "no", note: "Long-form content suffers from context drift." },
  { feature: "EPUB output", bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { feature: "KDP-compliant PDF", bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { feature: "Cover image generation", bookGenerator: "yes", manualAI: "no", generalTools: "partial" },
  { feature: "Bibliography / reference support", bookGenerator: "yes", manualAI: "partial", generalTools: "partial" },
  { feature: "No separate API costs for users", bookGenerator: "yes", manualAI: "no", generalTools: "partial", note: "In Book Creator, model costs are included in the plan; some general tools charge separately." },
  { feature: "Publishing history and revisions", bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { feature: "Book production in Turkish", bookGenerator: "yes", manualAI: "partial", generalTools: "partial", note: "General AI tools can produce Turkish content, but structure may break." },
  { feature: "KDP niche research", bookGenerator: "yes", manualAI: "no", generalTools: "no" },
  { feature: "No setup required (web-based)", bookGenerator: "yes", manualAI: "partial", generalTools: "yes" },
  { feature: "Pricing model — per-book value", bookGenerator: "yes", manualAI: "no", generalTools: "no", note: "Token-based tools mean longer books = higher costs." },
];

function SupportIcon({ value }: { value: Support }) {
  if (value === "yes") return <Check className="mx-auto size-5 text-green-600" />;
  if (value === "no") return <X className="mx-auto size-5 text-red-500" />;
  return <Minus className="mx-auto size-5 text-yellow-500" />;
}

const alternatives = [
  {
    name: "ChatGPT / Claude (manual)",
    pros: ["Powerful language model", "Flexibility"],
    cons: [
      "No book structure",
      "You need to write new prompts for every chapter",
      "Inconsistency due to context drift",
      "No EPUB/PDF output",
      "High token costs for long books",
    ],
  },
  {
    name: "Jasper / Copy.ai",
    pros: ["Good short-form content generation", "Template support"],
    cons: [
      "Not designed for book-length content",
      "No KDP output",
      "Turkish quality is inconsistent",
      "Expensive subscription",
    ],
  },
  {
    name: "Scrivener + AI plugins",
    pros: ["Powerful authoring tool", "Structured writing"],
    cons: [
      "Steep learning curve",
      "Complex AI integration",
      "Paid + plugin costs",
      "KDP output requires manual adjustment",
    ],
  },
  {
    name: "Manual writing",
    pros: ["Full control", "No AI dependency"],
    cons: [
      "Can take months or years",
      "Hard to get started",
      "High editing costs",
      "Creating an outline is a project in itself",
    ],
  },
];

export default function ComparePage() {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", item: absoluteUrl("/") },
    { name: "Compare", item: absoluteUrl("/compare") },
  ]);

  return (
    <MarketingPage>
      {/* Hero */}
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Comparison</Badge>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              You can start with ChatGPT.{" "}
              <span className="text-primary">But it may not be enough to finish.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground">
              The problem isn't model quality — it's rewriting prompts for every chapter, maintaining a consistent tone, solving the cover separately, and completing the output separately. Book Creator streamlines this scattered chain into a single workflow.
            </p>

            {/* Direct Answer Block for AI Extraction */}
            <div className="mt-8 text-left">
              <DirectAnswerBlock
                question="How does Book Generator compare to ChatGPT or manual writing?"
                answer="Book Generator isn't a replacement for ChatGPT—it's a specialized book production system. While ChatGPT requires prompt engineering for each chapter and lacks book structure, Book Generator provides topic-to-book workflow, consistent chapter generation, KDP-compliant EPUB/PDF output, and cover design in a single pipeline."
              />
              <LastUpdated date="2026-04-09" className="mt-4 text-sm" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/80 py-14">
        <div className="shell">
          <div className="mx-auto max-w-4xl rounded-[24px] border border-border/80 bg-card/80 px-6 py-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">The hidden cost of the manual approach</p>
            <p className="mt-3 text-base leading-8 text-foreground">
              A 10–30 hour workflow can't be managed in a single tool: research in one place, outline in another, cover separately, output separately. This fragmentation is the most common reason books remain unfinished. Book Creator brings this entire chain into a single workflow.
            </p>
          </div>
        </div>
      </section>

      {/* Feature table */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading
            badge="Feature Table"
            title="What can it do, and what can't it?"
            description="Features purpose-built for book production — things general AI tools lack."
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-4 pl-2 text-left font-medium text-muted-foreground">Feature</th>
                  <th className="pb-4 text-center font-semibold text-foreground">Book Creator</th>
                  <th className="pb-4 text-center font-medium text-muted-foreground">Manual AI</th>
                  <th className="pb-4 pr-2 text-center font-medium text-muted-foreground">General Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.feature} className="group">
                    <td className="py-3.5 pl-2">
                      <div>
                        <span className="font-medium text-foreground">{row.feature}</span>
                        {row.note && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{row.note}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <SupportIcon value={row.bookGenerator} />
                    </td>
                    <td className="py-3.5 text-center">
                      <SupportIcon value={row.manualAI} />
                    </td>
                    <td className="py-3.5 pr-2 text-center">
                      <SupportIcon value={row.generalTools} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="size-3.5 text-green-600" /> Full support</span>
            <span className="flex items-center gap-1.5"><Minus className="size-3.5 text-yellow-500" /> Partial / manual</span>
            <span className="flex items-center gap-1.5"><X className="size-3.5 text-red-500" /> None</span>
          </div>
        </div>
      </section>

      {/* Alternative cards */}
      <section className="border-b border-border/80 py-16">
        <div className="shell">
          <SectionHeading
            badge="Understanding Alternatives"
            title="Why other tools fall short?"
          />
          <div className="grid gap-6 sm:grid-cols-2">
            {alternatives.map((alt) => (
              <div key={alt.name} className="rounded-2xl border border-border/80 bg-background p-6">
                <h3 className="font-serif text-lg font-semibold text-foreground">{alt.name}</h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Pros</p>
                    <ul className="space-y-1.5">
                      {alt.pros.map((p) => (
                        <li key={p} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-green-500" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Cons</p>
                    <ul className="space-y-1.5">
                      {alt.cons.map((c) => (
                        <li key={c} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                          <X className="mt-0.5 size-3.5 shrink-0 text-red-400" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingCtaSection
        title="Stop wasting time with general tools — see the difference with your own topic."
        description={`Preview first, then decide if this book is worth publishing. The real difference isn't the chatbot — it's the publication-ready workflow. ${NO_API_COST_CLAIM} and books are prepared with ${KDP_GUARANTEE_CLAIM}.`}
        items={[
          "Topic summary → chapter plan → book pipeline",
          "KDP-compliant EPUB / PDF",
          "Turkish book support",
          "Preview first, then full book",
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </MarketingPage>
  );
}
