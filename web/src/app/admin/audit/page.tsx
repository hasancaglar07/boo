"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { Pagination } from "@/components/admin/pagination";
import { useAdminResource } from "@/lib/admin/client";
import { formatAdminDateTime } from "@/lib/admin/format";
import type { AdminListResponse } from "@/lib/admin/types";

type AuditRow = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: Record<string, unknown> | null;
  ipAddress: string;
  entityType: string;
  entityId: string | null;
};

export default function AdminAuditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const { data, loading, error } = useAdminResource<AdminListResponse<AuditRow>>(`/api/admin/audit?${query}`);

  function handleSort(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    const currentSort = params.get("sort") || "createdAt";
    const currentOrder = params.get("order") || "desc";
    params.set("sort", key);
    params.set("order", currentSort === key && currentOrder === "desc" ? "asc" : "desc");
    router.replace(`/admin/audit?${params.toString()}`);
  }

  const columns: Column<AuditRow>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      sortable: true,
      cell: (row) => formatAdminDateTime(row.timestamp),
    },
    {
      key: "user",
      header: "User",
      cell: (row) => row.user,
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => (
        <div>
          <div className="font-semibold text-[color:var(--admin-text)]">{row.action}</div>
          <div className="text-xs admin-muted">{row.entityType}{row.entityId ? ` · ${row.entityId}` : ""}</div>
        </div>
      ),
    },
    {
      key: "ipAddress",
      header: "IP hash",
      cell: (row) => row.ipAddress,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--admin-text)]">Audit log</h1>
          <p className="mt-1 text-sm admin-muted">Admin, auth ve billing aksiyonlarının tamamı.</p>
        </div>
        <Link
          href={`/api/admin/reports/users?${query}`}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--admin-border)] px-4 text-sm font-semibold text-[color:var(--admin-text)]"
        >
          Export tools
        </Link>
      </div>

      <FilterBar
        searchPlaceholder="Aksiyon, kullanıcı veya entity ara"
        filters={[
          {
            key: "action",
            label: "Action",
            options: [
              { label: "checkout.completed", value: "checkout.completed" },
              { label: "entitlement.changed", value: "entitlement.changed" },
              { label: "login.success", value: "login.success" },
              { label: "admin.user.role_changed", value: "admin.user.role_changed" },
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
        emptyTitle="Audit kaydı bulunamadı"
        emptyMessage="Seçili filtrelerde event yok."
        sort={searchParams.get("sort") || "createdAt"}
        order={(searchParams.get("order") as "asc" | "desc" | null) || "desc"}
        onSort={handleSort}
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
