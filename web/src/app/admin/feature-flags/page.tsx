"use client";

import { useState } from "react";
import { Flag, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

import { useAdminResource } from "@/lib/admin/client";
import { adminFetch } from "@/lib/admin/client";
import { formatAdminDateTime } from "@/lib/admin/format";
import { StatusBadge } from "@/components/admin/status-badge";

type FeatureFlag = {
  id: string;
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type FlagsPayload = { flags: FeatureFlag[] };

export default function AdminFeatureFlagsPage() {
  const { data, loading, error, reload } = useAdminResource<FlagsPayload>("/api/admin/feature-flags");
  const [toggling, setToggling] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [createError, setCreateError] = useState("");

  async function handleToggle(flag: FeatureFlag) {
    setToggling(flag.key);
    try {
      await adminFetch(`/api/admin/feature-flags/${encodeURIComponent(flag.key)}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
      await reload();
    } catch {
      // silently ignore
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete(key: string) {
    if (!window.confirm(`"${key}" flagını silmek istediğine emin misin?`)) return;
    try {
      await adminFetch(`/api/admin/feature-flags/${encodeURIComponent(key)}`, { method: "DELETE" });
      await reload();
    } catch {
      // silently ignore
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim() || !newLabel.trim()) {
      setCreateError("Key ve label zorunlu.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      await adminFetch("/api/admin/feature-flags", {
        method: "POST",
        body: JSON.stringify({ key: newKey.trim(), label: newLabel.trim(), description: newDesc.trim() }),
      });
      setNewKey("");
      setNewLabel("");
      setNewDesc("");
      setShowCreate(false);
      await reload();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Oluşturulamadı.");
    } finally {
      setCreating(false);
    }
  }

  if (error) {
    return <div className="admin-panel rounded-[24px] px-6 py-10 text-sm text-rose-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--admin-text)]">Feature Flags</h1>
          <p className="mt-1 text-sm admin-muted">Özellikleri kod değişikliği yapmadan aç/kapat.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--admin-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="size-4" />
          Yeni Flag
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="admin-panel rounded-[24px] p-5 space-y-4">
          <div className="text-sm font-semibold text-[color:var(--admin-text)]">Yeni Feature Flag</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium admin-muted">Key *</label>
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="my_new_feature"
                className="h-10 w-full rounded-xl border border-[color:var(--admin-border)] bg-white/60 px-3 text-sm outline-none focus:border-[color:var(--admin-primary)] dark:bg-white/5"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium admin-muted">Label *</label>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="My New Feature"
                className="h-10 w-full rounded-xl border border-[color:var(--admin-border)] bg-white/60 px-3 text-sm outline-none focus:border-[color:var(--admin-primary)] dark:bg-white/5"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium admin-muted">Açıklama</label>
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Bu flag ne işe yarıyor?"
              className="h-10 w-full rounded-xl border border-[color:var(--admin-border)] bg-white/60 px-3 text-sm outline-none focus:border-[color:var(--admin-primary)] dark:bg-white/5"
            />
          </div>
          {createError && <p className="text-xs text-rose-600">{createError}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {creating ? "Oluşturuluyor..." : "Oluştur"}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setCreateError(""); }}
              className="inline-flex items-center rounded-2xl border border-[color:var(--admin-border)] px-4 py-2 text-sm admin-muted hover:text-[color:var(--admin-text)]"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      <div className="admin-panel rounded-[28px] p-5">
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-black/5 dark:bg-white/8" />
            ))}
          </div>
        )}

        {!loading && !data?.flags.length && (
          <div className="rounded-2xl border border-dashed border-[color:var(--admin-border)] px-6 py-10 text-center">
            <Flag className="mx-auto mb-3 size-8 admin-muted opacity-40" />
            <p className="text-sm admin-muted">Henüz feature flag yok.</p>
          </div>
        )}

        {!loading && (data?.flags || []).length > 0 && (
          <div className="space-y-3">
            {(data?.flags || []).map((flag) => (
              <div
                key={flag.key}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--admin-border)] bg-white/50 px-4 py-3 dark:bg-white/5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-[color:var(--admin-primary)]">{flag.key}</span>
                    <StatusBadge status={flag.enabled ? "success" : "default"} label={flag.enabled ? "Aktif" : "Pasif"} />
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-[color:var(--admin-text)]">{flag.label}</div>
                  {flag.description && (
                    <div className="mt-0.5 text-xs admin-muted">{flag.description}</div>
                  )}
                  <div className="mt-1 text-xs admin-muted">Güncellendi: {formatAdminDateTime(flag.updatedAt)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={toggling === flag.key}
                    onClick={() => handleToggle(flag)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--admin-border)] px-3 py-2 text-sm transition hover:border-[color:var(--admin-primary)] disabled:opacity-50"
                    title={flag.enabled ? "Kapat" : "Aç"}
                  >
                    {flag.enabled ? (
                      <ToggleRight className="size-5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="size-5 admin-muted" />
                    )}
                    <span className="text-xs font-medium">{toggling === flag.key ? "..." : flag.enabled ? "Kapat" : "Aç"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(flag.key)}
                    className="inline-flex size-9 items-center justify-center rounded-xl border border-[color:var(--admin-border)] text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    title="Sil"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
