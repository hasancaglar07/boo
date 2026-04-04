"use client";

import { Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { ActionMenu } from "@/components/admin/action-menu";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminResource } from "@/lib/admin/client";
import { formatAdminDate } from "@/lib/admin/format";
import type { AdminListResponse } from "@/lib/admin/types";

type BookRow = {
  slug: string;
  title: string;
  author: string;
  language: string;
  status: string;
  chapters: number;
  exports: number;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  coverUrl: string;
  premiumUnlocked: boolean;
};

export default function AdminBooksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const { data, loading, error } = useAdminResource<AdminListResponse<BookRow>>(`/api/admin/books?${query}`);

  function handleSort(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    const currentSort = params.get("sort") || "createdAt";
    const currentOrder = params.get("order") || "desc";
    params.set("sort", key);
    params.set("order", currentSort === key && currentOrder === "desc" ? "asc" : "desc");
    router.replace(`/admin/books?${params.toString()}`);
  }

  const columns: Column<BookRow>[] = [
    {
      key: "title",
      header: "Book",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.coverUrl} alt={row.title} className="h-14 w-10 rounded-lg object-cover" />
          ) : (
            <div className="h-14 w-10 rounded-lg bg-black/5 dark:bg-white/8" />
          )}
          <div>
            <button
              type="button"
              className="text-left font-semibold text-[color:var(--admin-text)] hover:text-[color:var(--admin-primary)] hover:underline"
              onClick={() => router.push(`/admin/books/${encodeURIComponent(row.slug)}`)}
            >
              {row.title}
            </button>
            <div className="mt-1 text-xs admin-muted">{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col gap-1.5">
          <StatusBadge status={row.status} />
          {row.premiumUnlocked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
              <Sparkles className="size-3" /> Premium Açık
            </span>
          )}
        </div>
      ),
    },
    {
      key: "author",
      header: "Author",
      sortable: true,
      cell: (row) => (
        <div>
          <div>{row.author}</div>
          <div className="text-xs admin-muted">{row.language}</div>
          {row.ownerEmail && (
            <button
              type="button"
              className="mt-1 text-xs text-[color:var(--admin-primary)] hover:underline"
              onClick={(e) => { e.stopPropagation(); router.push(`/admin/users?q=${encodeURIComponent(row.ownerEmail)}`); }}
            >
              {row.ownerEmail}
            </button>
          )}
        </div>
      ),
    },
    {
      key: "chapters",
      header: "Chapters",
      sortable: true,
      cell: (row) => (
        <div>
          <div>{row.chapters}</div>
          <div className="text-xs admin-muted">{row.exports} export</div>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (row) => formatAdminDate(row.createdAt),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <ActionMenu
          actions={[
            {
              label: "Detayı aç",
              onClick: () => router.push(`/admin/books/${encodeURIComponent(row.slug)}`),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-[color:var(--admin-text)]">Book management</h1>
        <p className="mt-1 text-sm admin-muted">Üretim statüsü, owner bilgisi ve export davranışıyla kitaplar.</p>
      </div>

      <FilterBar
        searchPlaceholder="Başlık, slug, yazar veya owner ara"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Draft", value: "DRAFT" },
              { label: "Generating", value: "GENERATING" },
              { label: "Preview Ready", value: "PREVIEW_READY" },
              { label: "Premium Unlocked", value: "PREMIUM_UNLOCKED" },
              { label: "Exported", value: "EXPORTED" },
            ],
          },
          {
            key: "language",
            label: "Language",
            options: [
              { label: "Turkish", value: "Turkish" },
              { label: "English", value: "English" },
            ],
          },
        ]}
      />

      {error ? <div className="text-sm text-rose-600">{error}</div> : null}

      <DataTable
        data={data?.items || []}
        columns={columns}
        getRowId={(row) => row.slug}
        loading={loading}
        emptyTitle="Kitap bulunamadı"
        emptyMessage="Henüz kitap yok veya filtreler fazla dar."
        sort={searchParams.get("sort") || "createdAt"}
        order={(searchParams.get("order") as "asc" | "desc" | null) || "desc"}
        onSort={handleSort}
        bulkActions={[
          {
            label: "CSV export",
            onClick: () => {
              window.location.assign(`/api/admin/reports/books?${query}`);
            },
          },
        ]}
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
