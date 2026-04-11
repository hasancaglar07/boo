"use client";

import { useTranslations } from "next-intl";

import { SectionHeading } from "@/components/site/section-heading";
import { TestimonialsMarqueeSection } from "@/components/ui/testimonials-marquee";
import { testimonialData, testimonialsAggregateRating } from "@/lib/testimonials-data";

export function HomeTestimonialsSection() {
  const t = useTranslations("HomePage.testimonials");

  return (
    <section className="border-b border-border/80 bg-background py-8 md:py-12">
      <div className="shell">
        <SectionHeading
          badge={t("badge")}
          title={t("title")}
          description={t("description")}
          align="center"
          className="mb-5 md:mb-7"
        />

        <TestimonialsMarqueeSection
          items={testimonialData}
          showHeader={false}
          aggregateRating={testimonialsAggregateRating}
          aggregateLabel={t("aggregateLabel", { count: testimonialsAggregateRating.reviewCount })}
        />
      </div>
    </section>
  );
}
