"use client";

import { useTranslations } from "next-intl";
import { languageLabel, bookLengthLabel, type FunnelDraft } from "@/lib/funnel-draft";

export function SummaryCards({ draft }: { draft: FunnelDraft }) {
  const t = useTranslations("FunnelSummaryCards");

  const items = [
    { label: t("topic"), value: draft.topic || t("notSelected") },
    { label: t("title"), value: draft.title || t("notSelected") },
    { label: t("author"), value: draft.authorName || t("notEntered") },
    { label: t("branding"), value: draft.logoText || draft.imprint || t("notEntered") },
    { label: t("reader"), value: draft.audience || t("notSelected") },
    { label: t("language"), value: languageLabel(draft.language) },
    { label: t("chapters"), value: draft.outline.length ? t("chapterCount", { count: draft.outline.length }) : t("notGenerated") },
    { label: t("style"), value: `${languageLabel(draft.language)} • ${bookLengthLabel(draft.bookLength, draft.language)}` },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border/80 bg-background/74 px-2.5 py-2">
          <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.label}</div>
          <div className="mt-1 text-xs font-medium leading-5 text-foreground">{item.value}</div>
        </div>
      ))}
    </div>
  );
}