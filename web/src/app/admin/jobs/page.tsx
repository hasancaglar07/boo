"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { DataTable, type Column } from "@/components/admin/data-table";
import { MetricCard } from "@/components/admin/metric-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminFetch, useAdminResource } from "@/lib/admin/client";

type JobRow = {
  id: string;
  type: string;
  bookSlug: string;
  title: string;
  status: string;
  progress: number;
  startedAt: string;
  message: string;
};

type JobsPayload = {
  items: Array<JobRow>;
  summary: {
    active: number;
    pending: number;
    failed: number;
    queueDepth: number;
  };
};

export default function AdminJobsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, loading, error, reload } = useAdminResource<JobsPayload>("/api/admin/jobs", {
    intervalMs: 10000,
  });

  const columns: Column<JobRow>[] = [
    {
      key: "type",
      header: "Type",
      cell: (row) => (
        <div>
          <div className="font-semibold text-[color:var(--admin-text)]">{row.type}</div>
          <div className="text-xs admin-muted">{row.bookSlug}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "progress",
      header: "Progress",
      cell: (row) => (
        <div className="min-w-[180px]">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>{row.progress}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-black/5 dark:bg-white/10">
            <div className="h-2 rounded-full bg-[color:var(--admin-primary)]" style={{ width: `${row.progress}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: "message",
      header: "Message",
      cell: (row) => (
        <div className="max-w-[200px] truncate text-xs admin-muted" title={row.message}>
          {row.message || "—"}
        </div>
      ),
    },
    {
      key: "startedAt",
      header: "Started",
      cell: (row) => row.startedAt.replace("T", " ").slice(0, 16),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            className="text-xs text-[color:var(--admin-primary)] hover:underline"
            onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
          >
            {expandedId === row.id ? "Gizle" : "Detay"}
          </button>
          {row.status === "failed" && (
            <button
              type="button"
              className="rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300"
              onClick={() => {
                void adminFetch(`/api/admin/jobs/${row.id}/retry`, { method: "POST", body: "{}" })
                  .then(() => void reload())
                  .catch(() => {});
              }}
            >
              Tekrar Dene
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--admin-text)]">Job queue monitor</h1>
          <p className="mt-1 text-sm admin-muted">Preview ve generation işlerini 10 saniyede bir yeniler.</p>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--admin-border)] px-4 py-2.5 text-sm font-semibold text-[color:var(--admin-text)] disabled:opacity-50 transition hover:border-[color:var(--admin-primary)]"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Yükleniyor..." : "Yenile"}
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Active jobs" value={data?.summary.active || 0} />
        <MetricCard title="Pending" value={data?.summary.pending || 0} color="warning" />
        <MetricCard title="Failed" value={data?.summary.failed || 0} color="danger" />
        <MetricCard title="Queue depth" value={data?.summary.queueDepth || 0} color="success" />
      </section>

      {error ? <div className="text-sm text-rose-600">{error}</div> : null}

      <DataTable
        data={data?.items || []}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        emptyTitle="Aktif job yok"
        emptyMessage="Şu anda queue boş görünüyor."
      />
    </div>
  );
}
