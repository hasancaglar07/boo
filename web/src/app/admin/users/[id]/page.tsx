"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { ActivityFeed } from "@/components/admin/activity-feed";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminFetch, useAdminResource } from "@/lib/admin/client";
import { formatAdminCurrency, formatAdminDateTime } from "@/lib/admin/format";

type UserDetailResponse = {
  item: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    goal: string;
    role: string;
    emailVerified: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    currentPlan: string;
    currentStatus: string;
    totalRevenue: number;
  };
  related: {
    subscriptions: Array<{
      id: string;
      planId: string;
      status: string;
      kind: string;
      startsAt: string;
      endsAt: string | null;
    }>;
    books: Array<{
      slug: string;
      title: string;
      status: string;
      createdAt: string;
    }>;
    billingRecords: Array<{
      id: string;
      planId: string;
      amount: number;
      currency: string;
      status: string;
      createdAt: string;
    }>;
    activity: Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string | null;
      createdAt: string;
    }>;
    notes: Array<{
      id: string;
      body: string;
      createdAt: string;
      author: string;
    }>;
  };
  permissions: {
    canChangeRole: boolean;
    canAddNote: boolean;
    canResendVerification: boolean;
  };
};

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const { data, loading, error, reload } = useAdminResource<UserDetailResponse>(`/api/admin/users/${userId}`);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");

  async function handleSubmitNote(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    setBusy("note");
    await adminFetch(`/api/admin/users/${userId}/notes`, {
      method: "POST",
      body: JSON.stringify({ body: note.trim() }),
    });
    setNote("");
    setBusy("");
    await reload();
  }

  async function handleRoleChange(role: string) {
    setBusy("role");
    await adminFetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    setBusy("");
    await reload();
  }

  async function handleResendVerification() {
    setBusy("verify");
    await adminFetch(`/api/admin/users/${userId}/verification`, {
      method: "POST",
    });
    setBusy("");
  }

  if (loading && !data) {
    return <div className="admin-panel rounded-[24px] px-6 py-10">Yükleniyor…</div>;
  }

  if (error || !data) {
    return <div className="admin-panel rounded-[24px] px-6 py-10 text-sm text-rose-600">{error || "Kullanıcı yüklenemedi."}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="admin-panel rounded-[28px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] admin-muted">Profile</div>
              <h1 className="mt-2 text-3xl font-semibold text-[color:var(--admin-text)]">{data.item.name}</h1>
              <p className="mt-2 text-sm admin-muted">{data.item.email}</p>
            </div>
            <StatusBadge status={data.item.currentStatus} label={data.item.currentStatus} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-[color:var(--admin-border)] bg-white/50 p-4 dark:bg-white/5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] admin-muted">Role</div>
              <div className="mt-2 font-semibold text-[color:var(--admin-text)]">{data.item.role}</div>
            </div>
            <div className="rounded-[20px] border border-[color:var(--admin-border)] bg-white/50 p-4 dark:bg-white/5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] admin-muted">Current plan</div>
              <div className="mt-2 font-semibold text-[color:var(--admin-text)]">{data.item.currentPlan}</div>
            </div>
            <div className="rounded-[20px] border border-[color:var(--admin-border)] bg-white/50 p-4 dark:bg-white/5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] admin-muted">Created</div>
              <div className="mt-2 font-semibold text-[color:var(--admin-text)]">{formatAdminDateTime(data.item.createdAt)}</div>
            </div>
            <div className="rounded-[20px] border border-[color:var(--admin-border)] bg-white/50 p-4 dark:bg-white/5">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] admin-muted">Total revenue</div>
              <div className="mt-2 font-semibold text-[color:var(--admin-text)]">{formatAdminCurrency(data.item.totalRevenue)}</div>
            </div>
          </div>

          {data.item.goal ? (
            <div className="mt-4 rounded-[20px] border border-[color:var(--admin-border)] bg-white/50 p-4 text-sm admin-muted dark:bg-white/5">
              {data.item.goal}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="admin-panel rounded-[28px] p-6">
            <div className="text-sm font-semibold text-[color:var(--admin-text)]">Actions</div>
            <div className="mt-4 flex flex-col gap-3">
              {data.permissions.canResendVerification ? (
                <button
                  type="button"
                  onClick={() => void handleResendVerification()}
                  className="rounded-2xl border border-[color:var(--admin-border)] px-4 py-3 text-left text-sm font-semibold text-[color:var(--admin-text)]"
                >
                  {busy === "verify" ? "Gönderiliyor..." : "E-posta doğrulamasını tekrar gönder"}
                </button>
              ) : null}
              {data.permissions.canChangeRole ? (
                <div className="rounded-2xl border border-[color:var(--admin-border)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] admin-muted">Role change</div>
                  <div className="mt-3 flex gap-2">
                    {["USER", "ADMIN", "SUPER_ADMIN"].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => void handleRoleChange(role)}
                        className="rounded-xl border border-[color:var(--admin-border)] px-3 py-2 text-sm font-medium"
                        disabled={busy === "role"}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="admin-panel rounded-[28px] p-6">
            <div className="text-sm font-semibold text-[color:var(--admin-text)]">Admin notes</div>
            <form className="mt-4 space-y-3" onSubmit={(event) => void handleSubmitNote(event)}>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                placeholder="İç not ekle"
                className="w-full rounded-2xl border border-[color:var(--admin-border)] bg-white/60 px-4 py-3 text-sm outline-none dark:bg-white/5"
              />
              <button
                type="submit"
                className="rounded-2xl bg-[color:var(--admin-primary)] px-4 py-3 text-sm font-semibold text-white"
                disabled={busy === "note"}
              >
                {busy === "note" ? "Kaydediliyor..." : "Notu kaydet"}
              </button>
            </form>
            <div className="mt-4 space-y-3">
              {data.related.notes.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-white/50 p-4 dark:bg-white/5">
                  <div className="text-sm text-[color:var(--admin-text)]">{item.body}</div>
                  <div className="mt-2 text-xs admin-muted">{item.author} · {formatAdminDateTime(item.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="admin-panel rounded-[28px] p-6">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Subscriptions</div>
          <div className="space-y-3">
            {data.related.subscriptions.map((subscription) => (
              <div key={subscription.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-white/50 p-4 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-[color:var(--admin-text)]">{subscription.planId}</div>
                  <StatusBadge status={subscription.status} />
                </div>
                <div className="mt-2 text-xs admin-muted">{formatAdminDateTime(subscription.startsAt)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel rounded-[28px] p-6">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Books</div>
          <div className="space-y-3">
            {data.related.books.map((book) => (
              <Link
                key={book.slug}
                href={`/admin/books/${encodeURIComponent(book.slug)}`}
                className="block rounded-2xl border border-[color:var(--admin-border)] bg-white/50 p-4 transition hover:bg-white dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-[color:var(--admin-text)]">{book.title}</div>
                  <StatusBadge status={book.status} />
                </div>
                <div className="mt-2 text-xs admin-muted">{book.slug}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-panel rounded-[28px] p-6">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Billing history</div>
          <div className="space-y-3">
            {data.related.billingRecords.map((record) => (
              <div key={record.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-white/50 p-4 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-[color:var(--admin-text)]">{record.planId}</div>
                  <StatusBadge status={record.status} />
                </div>
                <div className="mt-2 text-sm">{formatAdminCurrency(record.amount, record.currency)}</div>
                <div className="mt-1 text-xs admin-muted">{formatAdminDateTime(record.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ActivityFeed
        items={data.related.activity.map((item) => ({
          id: item.id,
          action: item.action,
          actor: "system",
          entityType: item.entityType,
          entityId: item.entityId,
          createdAt: item.createdAt,
        }))}
      />
    </div>
  );
}
