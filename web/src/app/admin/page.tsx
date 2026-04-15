"use client";

import Link from "next/link";
import { Activity, BarChart2, BookOpen, CreditCard, Gauge, Server, TrendingUp, Users, UsersRound } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";

import { ActivityFeed } from "@/components/admin/activity-feed";
import { MetricCard } from "@/components/admin/metric-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { useAdminResource } from "@/lib/admin/client";
import { formatAdminCurrency, formatAdminNumber, formatRelativeTime } from "@/lib/admin/format";
import type { AdminLiveActivityPayload, AdminOverviewPayload } from "@/lib/admin/types";
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

function toHealthBadgeStatus(health: AdminLiveActivityPayload["health"] | null | undefined) {
  if (!health) return "default";
  if (health.status === "healthy") return "success";
  if (health.status === "degraded") return "warning";
  return "danger";
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
  const live = useAdminResource<AdminLiveActivityPayload>("/api/admin/live-activity", {
    intervalMs: 5000,
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
          title="Active subscription"
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
          title="Total books"
          value={loading || !data ? "—" : formatAdminNumber(data.cards.totalBooks)}
          icon={<BookOpen className="size-5" />}
          color="warning"
          sparkline={data?.conversionSeries.map((item) => item.signups)}
        />
      </section>

      <section className="space-y-4">
        <div className="admin-panel rounded-[28px] p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-[color:var(--admin-text)]">Live activity</div>
              <p className="mt-1 text-sm admin-muted">
                Real-time generation monitor. Refreshes every 5 seconds.
                {live.data?.snapshotAt ? ` Last snapshot ${formatRelativeTime(live.data.snapshotAt)}.` : ""}
              </p>
            </div>
            <StatusBadge
              status={toHealthBadgeStatus(live.data?.health)}
              label={
                !live.data
                  ? "Loading"
                  : live.data.health.status === "healthy"
                    ? "System Healthy"
                    : live.data.health.status === "degraded"
                      ? "System Degraded"
                      : "System Down"
              }
            />
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            title="Concurrent ops"
            value={live.loading && !live.data ? "—" : formatAdminNumber(live.data?.summary.concurrentOperations || 0)}
            icon={<Activity className="size-5" />}
          />
          <MetricCard
            title="Active users"
            value={live.loading && !live.data ? "—" : formatAdminNumber(live.data?.summary.activeUsers || 0)}
            icon={<UsersRound className="size-5" />}
            color="success"
          />
          <MetricCard
            title="Active books"
            value={live.loading && !live.data ? "—" : formatAdminNumber(live.data?.summary.activeBooks || 0)}
            icon={<BookOpen className="size-5" />}
            color="success"
          />
          <MetricCard
            title="Books generating"
            value={live.loading && !live.data ? "—" : formatAdminNumber(live.data?.summary.booksGeneratingNow || 0)}
            icon={<TrendingUp className="size-5" />}
            color="primary"
          />
          <MetricCard
            title="Queue depth"
            value={live.loading && !live.data ? "—" : formatAdminNumber(live.data?.summary.queueDepth || 0)}
            icon={<Server className="size-5" />}
            color="warning"
          />
          <MetricCard
            title="Failed (1h)"
            value={live.loading && !live.data ? "—" : formatAdminNumber(live.data?.summary.failedLastHour || 0)}
            icon={<Gauge className="size-5" />}
            color={live.data?.summary.failedLastHour ? "danger" : "success"}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="admin-panel rounded-[28px] p-5">
            <div className="text-sm font-semibold text-[color:var(--admin-text)]">Provider usage</div>
            <p className="mt-1 text-sm admin-muted">Active and total operations per generation provider.</p>
            <div className="mt-4 space-y-2">
              {(live.data?.providers || []).slice(0, 6).map((provider) => (
                <div key={provider.provider} className="flex items-center justify-between rounded-2xl border border-[color:var(--admin-border)] px-3 py-2">
                  <div className="truncate text-sm font-semibold text-[color:var(--admin-text)]">{provider.provider}</div>
                  <div className="text-xs admin-muted">
                    {formatAdminNumber(provider.active)} active / {formatAdminNumber(provider.total)} total
                  </div>
                </div>
              ))}
              {!live.loading && !(live.data?.providers || []).length ? (
                <div className="text-sm admin-muted">No provider signal yet.</div>
              ) : null}
            </div>
          </div>

          <div className="admin-panel rounded-[28px] p-5">
            <div className="text-sm font-semibold text-[color:var(--admin-text)]">API usage</div>
            <p className="mt-1 text-sm admin-muted">Real request telemetry from backend proxy calls (last 15 minutes).</p>
            <div className="mt-4 space-y-2">
              {(live.data?.apiUsage || []).slice(0, 6).map((api) => (
                <div key={api.api} className="rounded-2xl border border-[color:var(--admin-border)] px-3 py-2">
                  <div className="truncate text-sm font-semibold text-[color:var(--admin-text)]">{api.api}</div>
                  <div className="mt-1 text-xs admin-muted">
                    {formatAdminNumber(api.inFlight)} in-flight / {formatAdminNumber(api.total)} requests (15m)
                  </div>
                  <div className="text-xs admin-muted">
                    {formatAdminNumber(api.errors)} errors · last{" "}
                    {api.lastRequestAt ? formatRelativeTime(api.lastRequestAt) : "—"}
                  </div>
                </div>
              ))}
              {!live.loading && !(live.data?.apiUsage || []).length ? (
                <div className="text-sm admin-muted">No API signal yet.</div>
              ) : null}
            </div>
          </div>

          <div className="admin-panel rounded-[28px] p-5">
            <div className="text-sm font-semibold text-[color:var(--admin-text)]">Health checks</div>
            <p className="mt-1 text-sm admin-muted">Operational status and failure pressure.</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-2xl border border-[color:var(--admin-border)] px-3 py-2">
                <span className="admin-muted">Backend reachable</span>
                <span className="font-semibold text-[color:var(--admin-text)]">{live.data?.health.backendReachable ? "Yes" : "No"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[color:var(--admin-border)] px-3 py-2">
                <span className="admin-muted">Stale operations</span>
                <span className="font-semibold text-[color:var(--admin-text)]">{formatAdminNumber(live.data?.health.staleOperations || 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[color:var(--admin-border)] px-3 py-2">
                <span className="admin-muted">Error rate</span>
                <span className="font-semibold text-[color:var(--admin-text)]">%{formatAdminNumber(live.data?.health.errorRatePct || 0)}</span>
              </div>
              <div className="rounded-2xl border border-[color:var(--admin-border)] px-3 py-2">
                <div className="mb-1 text-xs uppercase tracking-[0.16em] admin-muted">Alerts</div>
                {(live.data?.health.alerts || []).map((alert) => (
                  <div key={alert} className="text-sm text-[color:var(--admin-text)]">
                    {alert}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="admin-panel rounded-[28px] p-5">
          <div className="mb-4">
            <div className="text-sm font-semibold text-[color:var(--admin-text)]">Live operations</div>
            <p className="mt-1 text-sm admin-muted">
              Which books are running now, current stage, provider, and inferred API usage.
            </p>
          </div>

          {live.error ? <div className="mb-4 text-sm text-rose-600">{live.error}</div> : null}

          <div className="admin-scrollbar overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-black/5 dark:border-white/8">
                <tr>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] admin-muted">Book</th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] admin-muted">Owner</th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] admin-muted">Stage</th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] admin-muted">Status</th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] admin-muted">Progress</th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] admin-muted">Provider</th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] admin-muted">API</th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] admin-muted">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/8">
                {(live.data?.operations || []).map((operation) => (
                  <tr key={operation.id} className="transition hover:bg-black/3 dark:hover:bg-white/3">
                    <td className="px-3 py-3 align-top text-sm text-[color:var(--admin-text)]">
                      <Link
                        href={`/admin/books/${encodeURIComponent(operation.bookSlug)}`}
                        className="font-semibold text-[color:var(--admin-primary)] hover:underline"
                      >
                        {operation.title}
                      </Link>
                      <div className="text-xs admin-muted">{operation.bookSlug}</div>
                    </td>
                    <td className="px-3 py-3 align-top text-sm text-[color:var(--admin-text)]">{operation.owner}</td>
                    <td className="px-3 py-3 align-top text-sm text-[color:var(--admin-text)]">
                      <div>{operation.stage}</div>
                      <div className="text-xs admin-muted">{operation.stepCode}</div>
                    </td>
                    <td className="px-3 py-3 align-top text-sm text-[color:var(--admin-text)]">
                      <StatusBadge status={operation.lifecycle} />
                    </td>
                    <td className="px-3 py-3 align-top text-sm text-[color:var(--admin-text)]">
                      <div className="min-w-[140px]">
                        <div className="mb-1 flex items-center justify-between text-xs admin-muted">
                          <span>{operation.progress}%</span>
                          {operation.stale ? <span className="text-rose-600">stale</span> : null}
                        </div>
                        <div className="h-2 rounded-full bg-black/5 dark:bg-white/10">
                          <div
                            className="h-2 rounded-full bg-[color:var(--admin-primary)]"
                            style={{ width: `${operation.progress}%` }}
                          />
                        </div>
                        <div className="mt-1 max-w-[240px] truncate text-xs admin-muted" title={operation.message}>
                          {operation.message}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top text-sm text-[color:var(--admin-text)]">{operation.provider}</td>
                    <td className="px-3 py-3 align-top text-sm text-[color:var(--admin-text)]">{operation.api}</td>
                    <td className="px-3 py-3 align-top text-sm text-[color:var(--admin-text)]">
                      {formatRelativeTime(operation.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!live.loading && !(live.data?.operations || []).length ? (
            <div className="pt-4 text-sm admin-muted">No live operations right now.</div>
          ) : null}
        </section>
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
