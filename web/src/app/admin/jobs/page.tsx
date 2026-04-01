"use client";

import { DataTable, type Column } from "@/components/admin/data-table";
import { MetricCard } from "@/components/admin/metric-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminResource } from "@/lib/admin/client";

type JobsPayload = {
  items: Array<{
    id: string;
    type: string;
    bookSlug: string;
    title: string;
    status: string;
    progress: number;
    startedAt: string;
    message: string;
  }>;
  summary: {
    active: number;
    pending: number;
    failed: number;
    queueDepth: number;
  };
};

export default function AdminJobsPage() {
  const { data, loading, error } = useAdminResource<JobsPayload>("/api/admin/jobs", {
    intervalMs: 10000,
  });

  const columns: Column<JobsPayload["items"][number]>[] = [
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
            <span className="admin-muted">{row.message}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-black/5 dark:bg-white/10">
            <div className="h-2 rounded-full bg-[color:var(--admin-primary)]" style={{ width: `${row.progress}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: "startedAt",
      header: "Started",
      cell: (row) => row.startedAt.replace("T", " ").slice(0, 16),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[color:var(--admin-text)]">Job queue monitor</h1>
        <p className="mt-1 text-sm admin-muted">Preview ve generation işlerini 10 saniyede bir yeniler.</p>
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
