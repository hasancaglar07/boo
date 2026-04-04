"use client";

import { languageLabel, bookLengthLabel, type FunnelDraft } from "@/lib/funnel-draft";

export function SummaryCards({ draft }: { draft: FunnelDraft }) {
  const items = [
    { label: "Konu", value: draft.topic || "Henüz seçilmedi" },
    { label: "Başlık", value: draft.title || "Henüz seçilmedi" },
    { label: "Yazar", value: draft.authorName || "Henüz girilmedi" },
    { label: "Branding", value: draft.logoText || draft.imprint || "Henüz girilmedi" },
    { label: "Okur", value: draft.audience || "Henüz seçilmedi" },
    { label: "Dil", value: languageLabel(draft.language) },
    { label: "Bölümler", value: draft.outline.length ? `${draft.outline.length} bölüm` : "Henüz oluşturulmadı" },
    { label: "Stil", value: `${languageLabel(draft.language)} • ${bookLengthLabel(draft.bookLength, draft.language)}` },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-[22px] border border-border/80 bg-background/74 px-4 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{item.label}</div>
          <div className="mt-2 text-[15px] font-medium leading-7 text-foreground">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
