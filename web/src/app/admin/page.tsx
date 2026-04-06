"use client";

import { BarChart2, BookOpen, CreditCard, TrendingUp, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";

import { ActivityFeed } from "@/components/admin/activity-feed";
import { MetricCard } from "@/components/admin/metric-card";
import { useAdminResource } from "@/lib/admin/client";
import { formatAdminCurrency, formatAdminNumber } from "@/lib/admin/format";
import type { AdminOverviewPayload } from "@/lib/admin/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

function computeTrend(
  series: Array<Record<string, number | string | null | undefined>> | undefined,
  key: string
): { value: number; direction: "up" | "down"; label: string } | undefined {
  if (!series || series.length < 2) return undefined;
  const prev = Number(series[series.length - 2]?.[key] ?? 0);
  const curr = Number(series[series.length - 1]?.[key] ?? 0);
  if (prev === 0) return undefined;
  const delta = Math.round(((curr - prev) / prev) * 100);
  return { value: Math.abs(delta), direction: delta >= 0 ? "up" : "down", label: "vs previous period" };
}

const revenueChartConfig = {
  value: {
    label: "Revenue",
    color: "#1e40af",
  },
};

const conversionChartConfig = {
  signups: {
    label: "Signups",
    color: "#1e40af",
  },
  paid: {
    label: "Paid",
    color: "#f59e0b",
  },
};

const userChartConfig = {
  users: {
    label: "Users",
    color: "#3b82f6",
  },
};

const planColors = ["#1e40af", "#3b82f6", "#64748b", "#f59e0b", "#0f766e"];

export default function AdminDashboardPage() {
  const { data, error, loading } = useAdminResource<AdminOverviewPayload>("/api/admin/metrics/overview", {
    intervalMs: 15000,
  });

  if (error) {
    return <div className="admin-panel rounded-[24px] px-6 py-10 text-sm text-rose-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-3">
        <MetricCard
          title="Total Users"
          value={loading || !data ? "—" : formatAdminNumber(data.cards.totalUsers)}
          icon={<Users className="size-5" />}
          sparkline={data?.userGrowth.map((item) => item.users)}
          trend={computeTrend(data?.userGrowth, "users")}
        />
        <MetricCard
          title="Aktif abonelik"
          value={loading || !data ? "—" : formatAdminNumber(data.cards.activeSubscriptions)}
          icon={<CreditCard className="size-5" />}
          color="success"
          sparkline={data?.conversionSeries.map((item) => item.paid)}
          trend={computeTrend(data?.conversionSeries, "paid")}
        />
        <MetricCard
          title="MRR"
          value={loading || !data ? "—" : formatAdminCurrency(data.cards.mrr)}
          icon={<TrendingUp className="size-5" />}
          color="primary"
          sparkline={data?.revenueTrend.map((item) => item.value)}
          trend={computeTrend(data?.revenueTrend, "value")}
        />
        <MetricCard
          title="ARR"
          value={loading || !data ? "—" : formatAdminCurrency(data.cards.arr)}
          icon={<TrendingUp className="size-5" />}
          color="success"
        />
        <MetricCard
          title="Funnel CR"
          value={loading || !data ? "—" : `%${data.cards.funnelConversionRate.toFixed(1)}`}
          icon={<BarChart2 className="size-5" />}
          color="warning"
        />
        <MetricCard
          title="Toplam kitap"
          value={loading || !data ? "—" : formatAdminNumber(data.cards.totalBooks)}
          icon={<BookOpen className="size-5" />}
          color="warning"
          sparkline={data?.conversionSeries.map((item) => item.signups)}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="admin-panel rounded-[28px] p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold text-[color:var(--admin-text)]">Revenue trend</div>
            <p className="mt-1 text-sm admin-muted">Last 30 days of paid billing flow</p>
          </div>
          <ChartContainer className="h-[280px] w-full" config={revenueChartConfig}>
            <LineChart data={data?.revenueTrend || []}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="admin-panel rounded-[28px] p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold text-[color:var(--admin-text)]">Plan distribution</div>
            <p className="mt-1 text-sm admin-muted">Active and free user distribution</p>
          </div>
          <ChartContainer className="h-[280px] w-full" config={revenueChartConfig}>
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Pie
                data={data?.planDistribution || []}
                dataKey="value"
                nameKey="label"
                innerRadius={52}
                outerRadius={90}
                paddingAngle={3}
              >
                {(data?.planDistribution || []).map((item, index) => (
                  <Cell key={item.label} fill={planColors[index % planColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="grid gap-6">
          <div className="admin-panel rounded-[28px] p-5">
            <div className="mb-4">
              <div className="text-sm font-semibold text-[color:var(--admin-text)]">New users vs premium conversions</div>
              <p className="mt-1 text-sm admin-muted">Weekly signup and paid flow</p>
            </div>
            <ChartContainer className="h-[260px] w-full" config={conversionChartConfig}>
              <BarChart data={data?.conversionSeries || []}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="signups" fill="var(--color-signups)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="paid" fill="var(--color-paid)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="admin-panel rounded-[28px] p-5">
            <div className="mb-4">
              <div className="text-sm font-semibold text-[color:var(--admin-text)]">User growth</div>
              <p className="mt-1 text-sm admin-muted">New user trend</p>
            </div>
            <ChartContainer className="h-[260px] w-full" config={userChartConfig}>
              <AreaChart data={data?.userGrowth || []}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="users" stroke="var(--color-users)" fill="var(--color-users)" fillOpacity={0.22} />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>

        <ActivityFeed items={data?.recentActivity || []} />
      </section>
    </div>
  );
}