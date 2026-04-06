"use client";

import { languageLabel, bookLengthLabel, type FunnelDraft } from "@/lib/funnel-draft";

export function SummaryCards({ draft }: { draft: FunnelDraft }) {
  const items = [
    { label: "Topic", value: draft.topic || "Not yet selected" },
    { label: "Title", value: draft.title || "Not yet selected" },
    { label: "Author", value: draft.authorName || "Not yet entered" },
    { label: "Branding", value: draft.logoText || draft.imprint || "Not yet entered" },
    { label: "Reader", value: draft.audience || "Not yet selected" },
    { label: "Dil", value: languageLabel(draft.language) },
    { label: "Chapters", value: draft.outline.length ? `${draft.outline.length} chapters` : "Not yet generated" },
    { label: "Stil", value: `${languageLabel(draft.language)} • ${bookLengthLabel(draft.bookLength, draft.language)}` },
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