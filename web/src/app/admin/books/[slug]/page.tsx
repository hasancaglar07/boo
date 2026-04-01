"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { ActivityFeed } from "@/components/admin/activity-feed";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminFetch, useAdminResource } from "@/lib/admin/client";
import { formatAdminDateTime } from "@/lib/admin/format";

type BookDetailResponse = {
  item: {
    slug: string;
    title: string;
    subtitle: string;
    author: string;
    language: string;
    status: string;
    description: string;
    ownerName: string;
    ownerEmail: string;
    coverUrl: string;
    backCoverUrl: string;
    createdAt: string;
    generation?: {
      progress?: number;
      message?: string;
      stage?: string;
      updated_at?: string;
    } | null;
  };
  related: {
    outline: Array<{
      id: string;
      number: number;
      title: string;
      wordCount: number;
    }>;
    moderation: Array<{
      id: string;
      status: string;
      qualityScore?: number | null;
      plagiarismScore?: number | null;
      notes: string;
      createdAt: string;
    }>;
    notes: Array<{
      id: string;
      body: string;
      author: string;
      createdAt: string;
    }>;
    activity: Array<{
      id: string;
      action: string;
      actor: string;
      createdAt: string;
    }>;
  };
  permissions: {
    canUnlockPremium: boolean;
    canRetryPreview: boolean;
  };
};

export default function AdminBookDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data, error, loading, reload } = useAdminResource<BookDetailResponse>(`/api/admin/books/${slug}`);
  const [busy, setBusy] = useState("");

  async function handleUnlock() {
    setBusy("unlock");
    await adminFetch(`/api/admin/books/${slug}/unlock`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    setBusy("");
    await reload();
  }

  async function handleRetry() {
    setBusy("retry");
    await adminFetch(`/api/admin/books/${slug}/retry`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    setBusy("");
    await reload();
  }

  if (loading && !data) {
    return <div className="admin-panel rounded-[24px] px-6 py-10">Yükleniyor…</div>;
  }

  if (error || !data) {
    return <div className="admin-panel rounded-[24px] px-6 py-10 text-sm text-rose-600">{error || "Kitap yüklenemedi."}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="admin-panel rounded-[28px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] admin-muted">Book detail</div>
              <h1 className="mt-2 text-3xl font-semibold text-[color:var(--admin-text)]">{data.item.title}</h1>
              {data.item.subtitle ? <p className="mt-2 admin-muted">{data.item.subtitle}</p> : null}
            </div>
            <StatusBadge status={data.item.status} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-[color:var(--admin-border)] bg-white/50 p-4 dark:bg-white/5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] admin-muted">Author</div>
              <div className="mt-2 font-semibold text-[color:var(--admin-text)]">{data.item.author || "—"}</div>
            </div>
            <div className="rounded-[20px] border border-[color:var(--admin-border)] bg-white/50 p-4 dark:bg-white/5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] admin-muted">Owner</div>
              <div className="mt-2 font-semibold text-[color:var(--admin-text)]">{data.item.ownerEmail || data.item.ownerName || "—"}</div>
            </div>
            <div className="rounded-[20px] border border-[color:var(--admin-border)] bg-white/50 p-4 dark:bg-white/5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] admin-muted">Language</div>
              <div className="mt-2 font-semibold text-[color:var(--admin-text)]">{data.item.language}</div>
            </div>
            <div className="rounded-[20px] border border-[color:var(--admin-border)] bg-white/50 p-4 dark:bg-white/5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] admin-muted">Created</div>
              <div className="mt-2 font-semibold text-[color:var(--admin-text)]">{formatAdminDateTime(data.item.createdAt)}</div>
            </div>
          </div>

          {data.item.description ? (
            <div className="mt-4 rounded-[20px] border border-[color:var(--admin-border)] bg-white/50 p-4 text-sm admin-muted dark:bg-white/5">
              {data.item.description}
            </div>
          ) : null}

          {data.item.generation ? (
            <div className="mt-4 rounded-[20px] border border-[color:var(--admin-border)] bg-white/50 p-4 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[color:var(--admin-text)]">Generation state</div>
                <div className="text-sm font-semibold text-[color:var(--admin-primary)]">%{Math.round(Number(data.item.generation.progress || 0))}</div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-black/5 dark:bg-white/10">
                <div
                  className="h-2 rounded-full bg-[color:var(--admin-primary)]"
                  style={{ width: `${Math.min(100, Math.max(0, Number(data.item.generation.progress || 0)))}%` }}
                />
              </div>
              <div className="mt-3 text-sm admin-muted">{data.item.generation.message || data.item.generation.stage || "—"}</div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="admin-panel rounded-[28px] p-6">
            <div className="text-sm font-semibold text-[color:var(--admin-text)]">Actions</div>
            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                className="rounded-2xl bg-[color:var(--admin-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                onClick={() => void handleRetry()}
                disabled={!data.permissions.canRetryPreview || busy === "retry"}
              >
                {busy === "retry" ? "Başlatılıyor..." : "Preview pipeline yeniden başlat"}
              </button>
              <button
                type="button"
                className="rounded-2xl border border-[color:var(--admin-border)] px-4 py-3 text-sm font-semibold text-[color:var(--admin-text)] disabled:opacity-50"
                onClick={() => void handleUnlock()}
                disabled={!data.permissions.canUnlockPremium || busy === "unlock"}
              >
                {busy === "unlock" ? "Açılıyor..." : "Premium aç"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="admin-panel rounded-[28px] p-4">
              <div className="mb-3 text-sm font-semibold text-[color:var(--admin-text)]">Front cover</div>
              {data.item.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.item.coverUrl} alt={data.item.title} className="aspect-[3/4] w-full rounded-[18px] object-cover" />
              ) : (
                <div className="aspect-[3/4] rounded-[18px] bg-black/5 dark:bg-white/8" />
              )}
            </div>
            <div className="admin-panel rounded-[28px] p-4">
              <div className="mb-3 text-sm font-semibold text-[color:var(--admin-text)]">Back cover</div>
              {data.item.backCoverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.item.backCoverUrl} alt={`${data.item.title} back cover`} className="aspect-[3/4] w-full rounded-[18px] object-cover" />
              ) : (
                <div className="aspect-[3/4] rounded-[18px] bg-black/5 dark:bg-white/8" />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="admin-panel rounded-[28px] p-6 xl:col-span-2">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Outline & chapters</div>
          <div className="space-y-3">
            {data.related.outline.map((chapter) => (
              <div key={chapter.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-white/50 px-4 py-3 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-[color:var(--admin-text)]">
                    {chapter.number}. {chapter.title}
                  </div>
                  <div className="text-xs admin-muted">{chapter.wordCount} kelime</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel rounded-[28px] p-6">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Moderation</div>
          <div className="space-y-3">
            {data.related.moderation.length ? data.related.moderation.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-white/50 px-4 py-3 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge status={item.status} />
                  <div className="text-xs admin-muted">{formatAdminDateTime(item.createdAt)}</div>
                </div>
                <div className="mt-3 text-sm admin-muted">
                  Quality: {item.qualityScore ?? "—"} · Plagiarism: {item.plagiarismScore ?? "—"}
                </div>
                {item.notes ? <div className="mt-2 text-sm">{item.notes}</div> : null}
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-[color:var(--admin-border)] px-4 py-6 text-sm admin-muted">
                Moderation kaydı yok.
              </div>
            )}
          </div>
        </div>
      </section>

      <ActivityFeed items={data.related.activity} />
    </div>
  );
}
