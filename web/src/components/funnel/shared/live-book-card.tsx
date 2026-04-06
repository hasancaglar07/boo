"use client";

import { coverDirectionLabel, toneLabel, type FunnelDraft } from "@/lib/funnel-draft";

export function LiveBookCard({ draft }: { draft: FunnelDraft }) {
  const displayTitle = draft.title || "Your book title will appear here";
  const displaySubtitle =
    draft.subtitle ||
    "As title, subtitle, and cover direction progress, a clearer book feel emerges here.";
  const displayBrand = draft.logoText || draft.imprint || "Wordmark";
  const displayAuthor = draft.authorName || "Author name";

  return (
    <div className="max-h-[140px] overflow-hidden rounded-xl border border-border/80 bg-[#2a1e16] p-3 text-white">
      <div className="flex items-center justify-between gap-2">
        {draft.logoUrl ? (
          <img
            src={draft.logoUrl}
            alt={`${displayBrand} logo`}
            className="h-6 w-auto max-w-[120px] object-contain"
          />
        ) : (
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
            {displayBrand}
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="max-w-[14ch] text-lg font-semibold leading-tight">{displayTitle}</div>
        <div className="mt-1.5 max-w-[28ch] text-xs leading-5 text-white/60">{displaySubtitle}</div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {draft.coverBrief ? (
          <span className="rounded-full border border-white/12 bg-white/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-white/55">
            {draft.coverBrief}
          </span>
        ) : null}
        <span className="rounded-full border border-white/12 bg-white/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-white/55">
          {coverDirectionLabel(draft.coverDirection, draft.language)}
        </span>
        <span className="rounded-full border border-white/12 bg-white/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-white/55">
          {toneLabel(draft.tone, draft.language)}
        </span>
      </div>
      <div className="mt-2 text-[10px] font-medium tracking-[0.12em] text-white/55 uppercase">{displayAuthor}</div>
    </div>
  );
}