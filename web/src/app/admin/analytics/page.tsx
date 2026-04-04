"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { MetricCard } from "@/components/admin/metric-card";
import { NotConfiguredCard } from "@/components/admin/not-configured-card";
import { useAdminResource } from "@/lib/admin/client";
import { formatAdminCurrency, formatAdminNumber } from "@/lib/admin/format";

type FunnelPayload = {
  stages: Array<{
    name: string;
    count: number;
    conversionRate: number;
    dropOffRate: number;
    avgTimeToNext: number;
  }>;
};

type CohortPayload = Array<{
  cohort: string;
  size: number;
  retention: number[];
  revenue: number[];
}>;

type ChurnPayload = {
  byMonth: Array<{
    month: string;
    active: number;
    churned: number;
    churnRate: number;
  }>;
};

type RevenuePayload = {
  totalRevenue: number;
  mrr: number;
  arr: number;
  revenueTrend: Array<{ label: string; amount: number }>;
};

type AuthPayload = {
  summary: {
    signupsCompleted: number;
    magicLinksSent: number;
    verificationResends: number;
    checkoutBlockedUnverified: number;
    authBridgeSkipped: number;
  };
  miniFunnel: Array<{
    name: string;
    count: number;
    conversionRate: number;
  }>;
  methods: Array<{ label: string; value: number }>;
  failureReasons: Array<{ label: string; value: number }>;
  sources: Array<{ label: string; value: number }>;
  recentEvents: Array<{
    id: string;
    eventName: string;
    createdAt: string;
    properties: Record<string, unknown>;
  }>;
};

const funnelConfig = {
  count: {
    label: "Count",
    color: "#1e40af",
  },
};

const churnConfig = {
  churnRate: {
    label: "Churn",
    color: "#dc2626",
  },
};

const revenueConfig = {
  amount: {
    label: "Revenue",
    color: "#1e40af",
  },
};

function retentionColor(value: number): string {
  if (value >= 80) return "bg-emerald-500/90 text-white";
  if (value >= 60) return "bg-emerald-400/70 text-emerald-900 dark:text-white";
  if (value >= 40) return "bg-amber-400/70 text-amber-900 dark:text-amber-100";
  if (value >= 20) return "bg-orange-400/70 text-orange-900 dark:text-orange-100";
  return "bg-rose-400/70 text-rose-900 dark:text-rose-100";
}

export default function AdminAnalyticsPage() {
  const funnel = useAdminResource<FunnelPayload>("/api/admin/analytics/funnel");
  const cohort = useAdminResource<CohortPayload>("/api/admin/analytics/cohort");
  const churn = useAdminResource<ChurnPayload>("/api/admin/analytics/churn");
  const revenue = useAdminResource<RevenuePayload>("/api/admin/analytics/revenue");
  const auth = useAdminResource<AuthPayload>("/api/admin/analytics/auth");
  const performance = useAdminResource<{ code?: string; feature?: string }>("/api/admin/analytics/performance", {
    allowErrorPayload: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[color:var(--admin-text)]">Analytics & reports</h1>
        <p className="mt-1 text-sm admin-muted">Funnel, cohort, revenue ve churn görünümü.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total revenue" value={revenue.data ? formatAdminCurrency(revenue.data.totalRevenue) : "—"} />
        <MetricCard title="MRR" value={revenue.data ? formatAdminCurrency(revenue.data.mrr) : "—"} color="success" />
        <MetricCard title="Cohorts" value={cohort.data ? formatAdminNumber(cohort.data.length) : "—"} color="warning" />
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <MetricCard title="Signups" value={auth.data ? formatAdminNumber(auth.data.summary.signupsCompleted) : "—"} />
        <MetricCard title="Magic Links" value={auth.data ? formatAdminNumber(auth.data.summary.magicLinksSent) : "—"} color="success" />
        <MetricCard title="Verification Resends" value={auth.data ? formatAdminNumber(auth.data.summary.verificationResends) : "—"} color="warning" />
        <MetricCard title="Blocked Checkout" value={auth.data ? formatAdminNumber(auth.data.summary.checkoutBlockedUnverified) : "—"} color="danger" />
        <MetricCard title="Bridge Skips" value={auth.data ? formatAdminNumber(auth.data.summary.authBridgeSkipped) : "—"} color="warning" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="admin-panel rounded-[28px] p-5">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Conversion funnel</div>
          <ChartContainer className="h-[280px] w-full" config={funnelConfig}>
            <BarChart data={funnel.data?.stages || []}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="admin-panel rounded-[28px] p-5">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Revenue trend</div>
          <ChartContainer className="h-[280px] w-full" config={revenueConfig}>
            <AreaChart data={revenue.data?.revenueTrend || []}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="amount" stroke="var(--color-amount)" fill="var(--color-amount)" fillOpacity={0.18} />
            </AreaChart>
          </ChartContainer>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-4">
        <div className="admin-panel rounded-[28px] p-5">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Auth mini funnel</div>
          <div className="space-y-3">
            {(auth.data?.miniFunnel || []).map((item) => (
              <div key={item.name} className="rounded-2xl border border-[color:var(--admin-border)] bg-white/50 px-4 py-3 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-[color:var(--admin-text)]">{item.name}</div>
                  <div className="text-sm admin-muted">{formatAdminNumber(item.count)}</div>
                </div>
                <div className="mt-2 text-xs admin-muted">Step conversion: %{item.conversionRate}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel rounded-[28px] p-5">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Auth methods</div>
          <div className="space-y-3">
            {(auth.data?.methods || []).map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-[color:var(--admin-border)] bg-white/50 px-4 py-3 dark:bg-white/5">
                <div className="text-sm font-medium text-[color:var(--admin-text)]">{item.label}</div>
                <div className="text-sm admin-muted">{formatAdminNumber(item.value)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel rounded-[28px] p-5">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Auth failure reasons</div>
          <div className="space-y-3">
            {(auth.data?.failureReasons || []).map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-[color:var(--admin-border)] bg-white/50 px-4 py-3 dark:bg-white/5">
                <div className="text-sm font-medium text-[color:var(--admin-text)]">{item.label}</div>
                <div className="text-sm admin-muted">{formatAdminNumber(item.value)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel rounded-[28px] p-5">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Auth sources</div>
          <div className="space-y-3">
            {(auth.data?.sources || []).map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-[color:var(--admin-border)] bg-white/50 px-4 py-3 dark:bg-white/5">
                <div className="text-sm font-medium text-[color:var(--admin-text)]">{item.label}</div>
                <div className="text-sm admin-muted">{formatAdminNumber(item.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-panel rounded-[28px] p-5">
        <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Recent auth events</div>
        <div className="space-y-3">
          {(auth.data?.recentEvents || []).map((item) => (
            <div key={item.id} className="rounded-2xl border border-[color:var(--admin-border)] bg-white/50 px-4 py-3 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-[color:var(--admin-text)]">{item.eventName}</div>
                <div className="text-xs admin-muted">{new Date(item.createdAt).toLocaleString("tr-TR")}</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(item.properties || {}).map(([key, value]) => (
                  <span key={key} className="rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-mono dark:bg-white/8">
                    {key}: {String(value)}
                  </span>
                ))}
                {Object.keys(item.properties || {}).length === 0 && (
                  <span className="text-xs admin-muted">properties yok</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="admin-panel rounded-[28px] p-5">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Cohort retention</div>
          <div className="space-y-3">
            {(cohort.data || []).map((item) => (
              <div key={item.cohort} className="rounded-2xl border border-[color:var(--admin-border)] bg-white/50 px-4 py-3 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-[color:var(--admin-text)]">{item.cohort}</div>
                  <div className="text-xs admin-muted">{item.size} kullanıcı</div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {item.retention.map((value, index) => (
                    <div key={index} className={`rounded-xl px-3 py-2 text-center ${retentionColor(value)}`}>
                      <div className="text-[10px] uppercase tracking-[0.14em] opacity-70">M{index + 1}</div>
                      <div className="mt-1 text-sm font-bold">%{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel rounded-[28px] p-5">
          <div className="mb-4 text-sm font-semibold text-[color:var(--admin-text)]">Churn by month</div>
          <ChartContainer className="h-[280px] w-full" config={churnConfig}>
            <BarChart data={churn.data?.byMonth || []}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `%${v}`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent formatter={(value) => [`%${value}`, "Churn"]} />}
              />
              <Bar dataKey="churnRate" fill="var(--color-churnRate)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </section>

      {performance.data?.code === "NOT_CONFIGURED" ? (
        <NotConfiguredCard
          title="Performance metrics not configured"
          description="p95/p99, worker utilization ve infrastructure-level monitoring bu fazda bağlı değil."
        />
      ) : null}
    </div>
  );
}
