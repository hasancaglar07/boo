"use client";

import Link from "next/link";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from "recharts";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ActionMenu } from "@/components/admin/action-menu";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { MetricCard } from "@/components/admin/metric-card";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminFetch, useAdminResource } from "@/lib/admin/client";
import { formatAdminCurrency, formatAdminDate } from "@/lib/admin/format";
import type { AdminListResponse } from "@/lib/admin/types";

type InvoiceRow = {
  id: string;
  invoiceId: string;
  userId: string | null;
  userEmail: string;
  userName: string;
  planId: string;
  amount: number;
  currency: string;
  status: string;
  kind: string;
  createdAt: string;
  bookSlug: string | null;
};

type RevenueMetrics = {
  mrr: number;
  arr: number;
  totalRevenue: number;
  revenueByPlan: Array<{ planId: string; label: string; amount: number }>;
  revenueTrend: Array<{ label: string; amount: number }>;
};

const revenueConfig = {
  amount: {
    label: "Amount",
    color: "#1e40af",
  },
};

export default function AdminBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const invoices = useAdminResource<AdminListResponse<InvoiceRow>>(`/api/admin/billing/invoices?${query}`);
  const revenue = useAdminResource<RevenueMetrics>("/api/admin/metrics/revenue");

  async function mutate(id: string, action: "refund" | "void") {
    await adminFetch(`/api/admin/billing/invoices/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    });
    await Promise.all([invoices.reload(), revenue.reload()]);
  }

  function handleSort(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    const currentSort = params.get("sort") || "createdAt";
    const currentOrder = params.get("order") || "desc";
    params.set("sort", key);
    params.set("order", currentSort === key && currentOrder === "desc" ? "asc" : "desc");
    router.replace(`/admin/billing?${params.toString()}`);
  }

  const columns: Column<InvoiceRow>[] = [
    {
      key: "invoiceId",
      header: "Invoice",
      sortable: true,
      cell: (row) => (
        <div>
          <div className="font-semibold text-[color:var(--admin-text)]">{row.invoiceId.slice(0, 8)}</div>
          <div className="text-xs admin-muted">{row.userEmail}</div>
          {row.bookSlug && (
            <a
              href={`/admin/books/${encodeURIComponent(row.bookSlug)}`}
              className="mt-1 block text-xs text-[color:var(--admin-primary)] hover:underline"
            >
              📖 {row.bookSlug}
            </a>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      cell: (row) => formatAdminCurrency(row.amount, row.currency),
    },
    {
      key: "kind",
      header: "Kind",
      cell: (row) => {
        const kindColors: Record<string, string> = {
          subscription: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
          one_time_book_unlock: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
          manual_adjustment: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
          refund: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
        };
        const kindLabels: Record<string, string> = {
          subscription: "Subscription",
          one_time_book_unlock: "Book Unlock",
          manual_adjustment: "Manuel",
          refund: "Refund",
        };
        return (
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${kindColors[row.kind] || "bg-slate-500/10 text-slate-700"}`}>
            {kindLabels[row.kind] || row.kind}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      header: "Date",
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
              label: "Refund",
              onClick: () => void mutate(row.id, "refund"),
              disabled: row.status !== "paid",
              destructive: true,
            },
            {
              label: "Void",
              onClick: () => void mutate(row.id, "void"),
              disabled: row.status === "void",
              destructive: true,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[color:var(--admin-text)]">Billing & invoices</h1>
          <p className="mt-1 text-sm admin-muted">Internal ledger-based revenue view and refund/void actions.</p>
        </div>
        <Link
          href={`/api/admin/reports/revenue?${query}`}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-[color:var(--admin-border)] px-4 text-sm font-semibold text-[color:var(--admin-text)]"
        >
          CSV Export
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard title="MRR" value={revenue.data ? formatAdminCurrency(revenue.data.mrr) : "—"} />
        <MetricCard title="ARR" value={revenue.data ? formatAdminCurrency(revenue.data.arr) : "—"} color="success" />
        <MetricCard title="Total revenue" value={revenue.data ? formatAdminCurrency(revenue.data.totalRevenue) : "—"} color="warning" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="admin-panel rounded-[28px] p-5">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Revenue trend</div>
          <ChartContainer className="h-[260px] w-full" config={revenueConfig}>
            <LineChart data={revenue.data?.revenueTrend || []}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="amount" stroke="var(--color-amount)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>
        <div className="admin-panel rounded-[28px] p-5">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Revenue by plan</div>
          <ChartContainer className="h-[260px] w-full" config={revenueConfig}>
            <BarChart data={revenue.data?.revenueByPlan || []}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </section>

      <FilterBar
        searchPlaceholder="Invoice ID veya user email ara"
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Paid", value: "paid" },
              { label: "Refunded", value: "refunded" },
              { label: "Void", value: "void" },
              { label: "Open", value: "open" },
            ],
          },
        ]}
      />

      <DataTable
        data={invoices.data?.items || []}
        columns={columns}
        getRowId={(row) => row.id}
        loading={invoices.loading}
        emptyTitle="No invoices found"
        emptyMessage="No billing records yet."
        sort={searchParams.get("sort") || "createdAt"}
        order={(searchParams.get("order") as "asc" | "desc" | null) || "desc"}
        onSort={handleSort}
      />

      {invoices.data ? (
        <Pagination
          page={invoices.data.page}
          totalPages={invoices.data.totalPages}
          totalItems={invoices.data.totalItems}
          pageSize={invoices.data.pageSize}
        />
      ) : null}
    </div>
  );
}