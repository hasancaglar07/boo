"use client";

import { useMemo, useState } from "react";

import { NotConfiguredCard } from "@/components/admin/not-configured-card";
import { adminFetch, useAdminResource } from "@/lib/admin/client";

type SettingsPayload = {
  featureFlags: Array<{
    id: string;
    key: string;
    label: string;
    description: string;
    enabled: boolean;
  }>;
  backendSettings: Record<string, unknown>;
  notConfigured: string[];
};

export default function AdminSettingsPage() {
  const { data, loading, error, reload } = useAdminResource<SettingsPayload>("/api/admin/settings");
  const [saving, setSaving] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});

  const settings = useMemo(() => ({
    default_author: String(data?.backendSettings.default_author || ""),
    default_publisher: String(data?.backendSettings.default_publisher || ""),
    ollama_base_url: String(data?.backendSettings.ollama_base_url || ""),
    ollama_model: String(data?.backendSettings.ollama_model || ""),
    cover_service: String(data?.backendSettings.cover_service || ""),
  }), [data]);

  async function toggleFlag(id: string, enabled: boolean) {
    setSaving(id);
    await adminFetch("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify({
        action: "feature_flag",
        id,
        enabled,
      }),
    });
    setSaving("");
    await reload();
  }

  async function saveBackendSettings() {
    setSaving("backend");
    await adminFetch("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify({
        action: "backend_settings",
        payload: {
          default_author: form.default_author ?? settings.default_author,
          default_publisher: form.default_publisher ?? settings.default_publisher,
          ollama_base_url: form.ollama_base_url ?? settings.ollama_base_url,
          ollama_model: form.ollama_model ?? settings.ollama_model,
          cover_service: form.cover_service ?? settings.cover_service,
        },
      }),
    });
    setSaving("");
    await reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[color:var(--admin-text)]">System settings</h1>
        <p className="mt-1 text-sm admin-muted">Canlı feature flags ve backend generation ayarları. Diğer alanlar structured placeholder olarak durur.</p>
      </div>

      {error ? <div className="text-sm text-rose-600">{error}</div> : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="admin-panel rounded-[28px] p-6">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Feature flags</div>
          <div className="space-y-3">
            {loading && !data ? <div className="text-sm admin-muted">Yükleniyor…</div> : null}
            {data?.featureFlags.length ? data.featureFlags.map((flag) => (
              <div key={flag.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--admin-border)] bg-white/50 px-4 py-4 dark:bg-white/5">
                <div>
                  <div className="font-semibold text-[color:var(--admin-text)]">{flag.label || flag.key}</div>
                  <div className="mt-1 text-sm admin-muted">{flag.description || flag.key}</div>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleFlag(flag.id, !flag.enabled)}
                  disabled={saving === flag.id}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${flag.enabled ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-black/5 text-[color:var(--admin-text)] dark:bg-white/8"}`}
                >
                  {flag.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-[color:var(--admin-border)] px-4 py-6 text-sm admin-muted">
                Henüz feature flag kaydı yok.
              </div>
            )}
          </div>
        </div>

        <div className="admin-panel rounded-[28px] p-6">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Backend settings</div>
          <div className="grid gap-3">
            {Object.entries(settings).map(([key, value]) => (
              <label key={key} className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] admin-muted">{key}</span>
                <input
                  value={form[key] ?? value}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  className="h-11 rounded-2xl border border-[color:var(--admin-border)] bg-white/60 px-3 text-sm outline-none dark:bg-white/5"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void saveBackendSettings()}
            className="mt-4 rounded-2xl bg-[color:var(--admin-primary)] px-4 py-3 text-sm font-semibold text-white"
            disabled={saving === "backend"}
          >
            {saving === "backend" ? "Kaydediliyor..." : "Backend ayarlarını kaydet"}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <NotConfiguredCard
          title="Pricing editor"
          description="Plan fiyatları ve limits için admin UI ileride gerçek billing provider veya catalog adapter ile bağlanacak."
        />
        <NotConfiguredCard
          title="Email templates"
          description="Template düzenleme ve test e-mail yüzeyi bu fazda bağlanmadı."
        />
        <NotConfiguredCard
          title="API keys & webhooks"
          description="Key rotation, webhook yönetimi ve gelişmiş rate-limit kuralları structured placeholder olarak bırakıldı."
        />
      </section>
    </div>
  );
}
