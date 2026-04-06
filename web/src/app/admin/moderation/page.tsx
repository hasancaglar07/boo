"use client";

import { useSearchParams } from "next/navigation";

import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminFetch, useAdminResource } from "@/lib/admin/client";
import { formatAdminDate } from "@/lib/admin/format";
import type { AdminListResponse } from "@/lib/admin/types";

type ModerationRow = {
  id: string;
  bookSlug: string;
  bookTitle: string;
  status: string;
  qualityScore: number | null;
  plagiarismScore: number | null;
  createdAt: string;
  notes?: string | null;
};

export default function AdminModerationPage() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const { data, loading, error, reload } = useAdminResource<AdminListResponse<ModerationRow>>(`/api/admin/moderation/queue?${query}`);

  async function moderate(id: string, action: "approve" | "reject" | "request_revision") {
    await adminFetch(`/api/admin/moderation/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    await reload();
  }

  const columns: Column<ModerationRow>[] = [
    {
      key: "book",
      header: "Book",
      cell: (row) => (
        <div>
          <a
            href={`/admin/books/${encodeURIComponent(row.bookSlug)}`}
            className="font-semibold text-[color:var(--admin-text)] hover:text-[color:var(--admin-primary)] hover:underline"
          >
            {row.bookTitle}
          </a>
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
      key: "scores",
      header: "Scores & Notes",
      cell: (row) => (
        <div className="text-sm max-w-[200px]">
          <div className="flex gap-3">
            <span>Kalite: <strong>{row.qualityScore ?? "—"}</strong></span>
            <span>Plagiarism: <strong>{row.plagiarismScore ?? "—"}</strong></span>
          </div>
          {row.notes && (
            <div className="mt-1 text-xs admin-muted line-clamp-2">{row.notes}</div>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Tarih",
      cell: (row) => formatAdminDate(row.createdAt),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 disabled:opacity-50"
            onClick={() => void moderate(row.id, "approve")}
            disabled={row.status === "approved"}
          >
            Onayla
          </button>
          <button
            type="button"
            className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 disabled:opacity-50"
            onClick={() => void moderate(row.id, "request_revision")}
            disabled={row.status === "revision_requested"}
          >
            Revizyon
          </button>
          <button
            type="button"
            className="rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 disabled:opacity-50"
            onClick={() => void moderate(row.id, "reject")}
            disabled={row.status === "rejected"}
          >
            Reddet
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-[color:var(--admin-text)]">Content moderation</h1>
        <p className="mt-1 text-sm admin-muted">Partial moderation queue. Empty state appears if no records.</p>
      </div>

      <FilterBar
        searchPlaceholder="Search book or slug"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Pending", value: "pending" },
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
              { label: "Revision", value: "revision_requested" },
            ],
          },
        ]}
        withDateRange={false}
      />

      {error ? <div className="text-sm text-rose-600">{error}</div> : null}

      <DataTable
        data={data?.items || []}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        emptyTitle="No moderation records"
        emptyMessage="No quality or plagiarism review records created yet."
      />

      {data ? (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          totalItems={data.totalItems}
          pageSize={data.pageSize}
        />
      ) : null}
    </div>
  );
}