"use client";

import { useTranslations } from "next-intl";

export function HomePricingTestimonials() {
  const t = useTranslations("HomePricingTestimonials");

  const pricingNotes = [
    { title: t("note1Title"), text: t("note1Text") },
    { title: t("note2Title"), text: t("note2Text") },
    { title: t("note3Title"), text: t("note3Text") },
  ];

  return (
    <section className="border-b border-border/80 py-10">
      <div className="shell">
        <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
          {t("intro")}
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {pricingNotes.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-[28px] border border-primary/15 bg-primary/5 px-5 py-5"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
