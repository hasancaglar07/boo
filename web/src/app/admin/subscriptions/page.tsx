"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ActionMenu } from "@/components/admin/action-menu";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminFetch, useAdminResource } from "@/lib/admin/client";
import { formatAdminCurrency, formatAdminDate } from "@/lib/admin/format";
import type { AdminListResponse } from "@/lib/admin/types";

type SubscriptionRow = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planLabel: string;
  status: string;
  amount: number;
  nextBilling: string | null;
  startedAt: string;
};

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const { data, loading, error, reload } = useAdminResource<AdminListResponse<SubscriptionRow>>(`/api/admin/subscriptions?${query}`);

  async function mutate(id: string, action: "cancel" | "reactivate") {
    await adminFetch(`/api/admin/subscriptions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    });
    await reload();
  }

  function handleSort(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    const currentSort = params.get("sort") || "startedAt";
    const currentOrder = params.get("order") || "desc";
    params.set("sort", key);
    params.set("order", currentSort === key && currentOrder === "desc" ? "asc" : "desc");
    router.replace(`/admin/subscriptions?${params.toString()}`);
  }

  const columns: Column<SubscriptionRow>[] = [
    {
      key: "user",
      header: "User",
      cell: (row) => (
        <div>
          <div className="font-semibold text-[color:var(--admin-text)]">{row.userName}</div>
          <div className="text-xs admin-muted">{row.userEmail}</div>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      sortable: true,
      cell: (row) => row.planLabel,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} label={row.status} />,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      cell: (row) => formatAdminCurrency(row.amount),
    },
    {
      key: "startedAt",
      header: "Started",
      sortable: true,
      cell: (row) => (
        <div>
          <div>{formatAdminDate(row.startedAt)}</div>
          <div className="text-xs admin-muted">{row.nextBilling ? `Next: ${formatAdminDate(row.nextBilling)}` : "Manual"}</div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <ActionMenu
          actions={[
            {
              label: row.status === "ACTIVE" ? "Cancel subscription" : "Reactivate",
              onClick: () => void mutate(row.id, row.status === "ACTIVE" ? "cancel" : "reactivate"),
              destructive: row.status === "ACTIVE",
            },
            {
              label: "Open user",
              onClick: () => router.push(`/admin/users/${row.userId}`),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-[color:var(--admin-text)]">Subscriptions</h1>
        <p className="mt-1 text-sm admin-muted">Manual entitlement tabanlı aktif abonelik görünümü.</p>
      </div>

      <FilterBar
        searchPlaceholder="Kullanıcı e-postası veya subscription ID ara"
        filters={[
          {
            key: "plan",
            label: "Plan",
            options: [
              { label: "Starter", value: "starter" },
              { label: "Yazar", value: "creator" },
              { label: "Stüdyo", value: "pro" },
            ],
          },
          {
            key: "status",
            label: "Status",
            options: [
              { label: "ACTIVE", value: "ACTIVE" },
              { label: "CANCELED", value: "CANCELED" },
              { label: "PAST_DUE", value: "PAST_DUE" },
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
        emptyTitle="Abonelik bulunamadı"
        emptyMessage="Aktif subscription entitlement yok."
        sort={searchParams.get("sort") || "startedAt"}
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
