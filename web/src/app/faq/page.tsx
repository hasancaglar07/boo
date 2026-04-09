import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FAQPageHero } from "@/components/site/page-heroes";
import { MarketingCtaSection } from "@/components/site/marketing-cta-section";
import { MarketingPage } from "@/components/site/marketing-page";
import { SectionHeading } from "@/components/site/section-heading";
import { Faq5 } from "@/components/ui/faq-5";
import { Card, CardContent } from "@/components/ui/card";
import { buildFAQSchema } from "@/lib/schema";
import { faqSections } from "@/lib/marketing-data";
import { buildPageMetadata } from "@/lib/seo";

// CTA for each FAQ section — directly addresses the objection
const sectionCtas: Record<string, { label: string; href: string }> = {
  "General": { label: "See how it works", href: "/how-it-works" },
  "Book Production": { label: "Explore examples", href: "/examples" },
  "Cover and Design": { label: "See examples", href: "/examples" },
  "Delivery and Outputs": { label: "Compare plans", href: "/pricing" },
  "Rights and Publishing": { label: "Start free preview", href: "/start/topic" },
  "Subscription and Payment": { label: "See pricing", href: "/pricing" },
  "Support": { label: "Get in touch", href: "/contact" },
};

export const metadata: Metadata = buildPageMetadata({
  title: "Book Generator FAQ | AI Book Writing Questions",
  description:
    "Browse short answers to the most frequently asked questions about Book Generator's workflow, plans, output formats, rights, covers, payments, and support processes.",
  path: "/faq",
  keywords: ["book generator faq", "ai book writing questions", "epub pdf output"],
});

export default function FaqPage() {
  const topFaqs = faqSections
    .slice(0, 2)
    .reduce<Array<{ question: string; answer: string }>>((all, section) => {
      section.items.forEach(([question, answer]) => {
        all.push({ question, answer });
      });
      return all;
    }, [])
    .slice(0, 4);

  // Build FAQ schema from all FAQ items
  const allFaqs = faqSections.flatMap((section) =>
    section.items.map(([question, answer]) => ({ question, answer }))
  );
  const faqSchema = buildFAQSchema(allFaqs);

  return (
    <MarketingPage>
      <FAQPageHero />
      <section className="border-b border-border/80 py-20 md:py-24">
        <div className="shell">
          <h1 className="sr-only">Book Generator frequently asked questions</h1>
          <SectionHeading
            badge="FAQ"
            title="The key questions that delay decisions."
            description="What gets produced, how it works, what outputs you get, and how understandable it is for a first-time user — all clarified here."
            align="center"
          />
          <p className="mx-auto max-w-2xl text-center text-sm leading-7 text-muted-foreground">
            For technical questions, visit the{" "}
            <Link href="/contact" className="text-foreground underline-offset-4 hover:underline">
              contact
            </Link>{" "}
            page, for plan details check{" "}
            <Link href="/pricing" className="text-foreground underline-offset-4 hover:underline">
              pricing
            </Link>{" "}
            and for process steps see the{" "}
            <Link href="/how-it-works" className="text-foreground underline-offset-4 hover:underline">
              how it works
            </Link>{" "}
            page.
          </p>
        </div>
      </section>

      <section className="border-b border-border/80">
        <Faq5
          badge="Quick answers"
          heading="4 answers you'll want to know at first glance"
          description="These are typically the first questions that shape a user's decision to try or purchase."
          faqs={topFaqs}
        />
      </section>

      <section className="py-18">
        <div className="shell space-y-10">
          <SectionHeading
            badge="All questions"
            title="More detailed answers organized by topic."
            description="Grouped under general usage, book production, cover, delivery, rights, payment, and support headings."
          />

          {faqSections.map((section) => {
            const cta = sectionCtas[section.title];
            return (
              <section key={section.title} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                    {section.title}
                  </h2>
                  {cta && (
                    <Link
                      href={cta.href}
                      className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      {cta.label} <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {section.items.map(([question, answer]) => (
                    <Card key={question}>
                      <CardContent className="space-y-3">
                        <h3 className="text-lg font-semibold tracking-tight text-foreground">{question}</h3>
                        <p className="text-sm leading-8 text-muted-foreground">{answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                Who is it not right for?
              </h2>
              <Link
                href="/use-cases"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                See who it's for <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="space-y-3">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">Where we excel</h3>
                  <p className="text-sm leading-8 text-muted-foreground">
                    Guide books, expertise books, short lead-magnet books, and publication-ready informational books. Especially suited for experts, instructors, content creators, and KDP-focused users.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-3">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">Not the right fit</h3>
                  <p className="text-sm leading-8 text-muted-foreground">
                    It was not designed for novels, academic theses, heavily footnoted works, or technical documentation. Stating this limitation openly builds trust; we won't misrepresent the product.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </section>

      <MarketingCtaSection
        title="Done with questions? Start your own book now."
        description="Write your topic idea, see the outline, and try the first EPUB workflow. Make your decision inside the product, not on a landing page. 30-day refund guarantee, no credit card required."
        items={[
          "Clear guidance from the first workflow",
          "AI-assisted chapter planning and output system",
          "Chapter planning and output system",
          "Preview first, then full book",
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </MarketingPage>
  );
}