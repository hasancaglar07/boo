"use client";

import { SectionHeading } from "@/components/site/section-heading";
import { TestimonialsColumnsSection } from "@/components/ui/testimonials-columns-1";
import { testimonialData } from "@/lib/testimonials-data";

export function HomeTestimonialsSection() {
  return (
    <section className="border-b border-border/80 bg-background py-8 md:py-10">
      <div className="shell">
        <SectionHeading
          badge="Customer Reviews"
          title="What Authors Say"
          description="Real results from real authors."
          align="center"
          className="mb-6 md:mb-8"
        />

        <TestimonialsColumnsSection
          items={testimonialData}
          showHeader={false}
        />
      </div>
    </section>
  );
}
