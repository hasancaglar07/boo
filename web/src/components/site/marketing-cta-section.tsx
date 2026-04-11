"use client";

import { useTranslations } from "next-intl";

import { Cta4 } from "@/components/ui/cta-4";

export function MarketingCtaSection({
  title,
  description,
  items,
}: {
  title?: string;
  description?: string;
  items?: readonly string[];
}) {
  const t = useTranslations("MarketingCta");

  return (
    <Cta4
      title={title ?? t("title")}
      description={description ?? t("description")}
      buttonText={t("buttonText")}
      buttonUrl="/start/topic"
      items={items}
    />
  );
}
