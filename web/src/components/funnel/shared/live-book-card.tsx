"use client";

import { coverDirectionLabel, toneLabel, type FunnelDraft } from "@/lib/funnel-draft";

export function LiveBookCard({ draft }: { draft: FunnelDraft }) {
  const displayTitle = draft.title || "Kitabının adı burada görünecek";
  const displaySubtitle =
    draft.subtitle ||
    "Başlık, alt başlık ve kapak yönü ilerledikçe burada daha net bir kitap hissi oluşturur.";
  const displayBrand = draft.logoText || draft.imprint || "Wordmark";
  const displayAuthor = draft.authorName || "Yazar adı";

  return (
    <div className="overflow-hidden rounded-[28px] border border-border/80 bg-[radial-gradient(circle_at_top,_rgba(188,104,67,0.18),_transparent_34%),linear-gradient(180deg,_#261c16_0%,_#523629_52%,_#b96a42_100%)] p-6 text-white shadow-[0_24px_48px_rgba(37,27,20,0.18)]">
      <div className="flex items-center justify-between gap-3">
        {draft.logoUrl ? (
          <img
            src={draft.logoUrl}
            alt={`${displayBrand} logosu`}
            className="h-12 w-auto max-w-[190px] object-contain"
          />
        ) : (
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
            {displayBrand}
          </div>
        )}
      </div>
      <div className="mt-12">
        <div className="max-w-[12ch] text-3xl font-semibold leading-[1.02] md:text-4xl">{displayTitle}</div>
        <div className="mt-4 max-w-[28ch] text-sm leading-7 text-white/82">{displaySubtitle}</div>
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {draft.coverBrief ? (
          <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/78">
            {draft.coverBrief}
          </span>
        ) : null}
        <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/78">
          {coverDirectionLabel(draft.coverDirection, draft.language)}
        </span>
        <span className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/78">
          {toneLabel(draft.tone, draft.language)}
        </span>
      </div>
      <div className="mt-10 text-sm font-medium tracking-[0.14em] text-white/82 uppercase">{displayAuthor}</div>
    </div>
  );
}
