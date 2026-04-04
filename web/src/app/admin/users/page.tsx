"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { ActionMenu } from "@/components/admin/action-menu";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminResource } from "@/lib/admin/client";
import { formatAdminCurrency, formatAdminDate } from "@/lib/admin/format";
import type { AdminListResponse } from "@/lib/admin/types";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  planLabel: string;
  status: string;
  books: number;
  revenue: number;
  createdAt: string;
  emailVerified: boolean;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const { data, loading, error } = useAdminResource<AdminListResponse<UserRow>>(`/api/admin/users?${query}`);

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      header: "User",
      sortable: true,
      cell: (row) => (
        <Link href={`/admin/users/${row.id}`} className="block hover:underline">
          <div className="font-semibold text-[color:var(--admin-text)]">{row.name}</div>
          <div className="mt-0.5 text-xs admin-muted">{row.email}</div>
          <div className="mt-1 flex items-center gap-1.5">
            {row.emailVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-3" /> Doğrulandı
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                <AlertCircle className="size-3" /> Doğrulanmadı
              </span>
            )}
          </div>
        </Link>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      sortable: true,
      cell: (row) => (
        <div className="space-y-1">
          <div className="font-medium">{row.planLabel}</div>
          <div className="text-xs admin-muted">{row.role}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} label={row.status} />,
    },
    {
      key: "books",
      header: "Books",
      sortable: true,
      cell: (row) => row.books,
    },
    {
      key: "revenue",
      header: "Revenue",
      sortable: true,
      cell: (row) => formatAdminCurrency(row.revenue),
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
              onClick: () => router.push(`/admin/users/${row.id}`),
            },
          ]}
        />
      ),
      className: "w-[72px]",
    },
  ];

  function handleSort(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    const currentSort = params.get("sort") || "createdAt";
    const currentOrder = params.get("order") || "desc";
    params.set("sort", key);
    params.set("order", currentSort === key && currentOrder === "desc" ? "asc" : "desc");
    router.replace(`/admin/users?${params.toString()}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--admin-text)]">User management</h1>
          <p className="mt-1 text-sm admin-muted">Plan, status ve gelir kırılımıyla kullanıcıları yönet.</p>
        </div>
        <Link
          href={`/api/admin/reports/users?${query}`}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--admin-border)] px-4 text-sm font-semibold text-[color:var(--admin-text)]"
        >
          CSV export
        </Link>
      </div>

      <FilterBar
        searchPlaceholder="E-posta, isim veya kullanıcı ID ara"
        filters={[
          {
            key: "plan",
            label: "Plan",
            options: [
              { label: "Free", value: "free" },
              { label: "Starter", value: "starter" },
              { label: "Yazar", value: "creator" },
              { label: "Stüdyo", value: "pro" },
              { label: "Tek Kitap", value: "premium" },
            ],
          },
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Active", value: "ACTIVE" },
              { label: "Canceled", value: "CANCELED" },
              { label: "Past Due", value: "PAST_DUE" },
            ],
          },
          {
            key: "role",
            label: "Role",
            options: [
              { label: "User", value: "USER" },
              { label: "Admin", value: "ADMIN" },
              { label: "Super Admin", value: "SUPER_ADMIN" },
            ],
          },
        ]}
      />

      {error ? <div className="text-sm text-rose-600">{error}</div> : null}

      <DataTable
        data={data?.items || []}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        emptyTitle="Kullanıcı bulunamadı"
        emptyMessage="Filtreleri temizleyip tekrar dene."
        sort={searchParams.get("sort") || "createdAt"}
        order={(searchParams.get("order") as "asc" | "desc" | null) || "desc"}
        onSort={handleSort}
        bulkActions={[
          {
            label: "Filtreli CSV indir",
            onClick: () => {
              window.location.assign(`/api/admin/reports/users?${query}`);
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
