"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

function Sparkline({ values = [] }: { values?: number[] }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  return (
    <div className="mt-4 flex h-8 items-end gap-1">
      {values.slice(-12).map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="flex-1 rounded-full bg-[color:var(--admin-primary-soft)]"
          style={{ height: `${Math.max(18, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function MetricCard({
  title,
  value,
  trend,
  icon,
  color = "primary",
  loading = false,
  sparkline,
}: {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: "up" | "down";
    label: string;
  };
  icon?: React.ReactNode;
  color?: "primary" | "success" | "warning" | "danger";
  loading?: boolean;
  sparkline?: number[];
}) {
  const accent =
    color === "success"
      ? "text-emerald-600"
      : color === "warning"
        ? "text-amber-600"
        : color === "danger"
          ? "text-rose-600"
          : "text-[color:var(--admin-primary)]";

  return (
    <div className="admin-panel rounded-[24px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] admin-muted">{title}</div>
          {loading ? (
            <div className="mt-3 h-9 w-28 animate-pulse rounded-xl bg-black/5 dark:bg-white/8" />
          ) : (
            <div className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--admin-text)]">{value}</div>
          )}
        </div>
        <div className={cn("rounded-2xl p-3", accent, "bg-black/5 dark:bg-white/5")}>
          {icon}
        </div>
      </div>

      {trend ? (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold",
              trend.direction === "up"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "bg-rose-500/10 text-rose-700 dark:text-rose-300",
            )}
          >
            {trend.direction === "up" ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            %{Math.abs(trend.value)}
          </span>
          <span className="admin-muted">{trend.label}</span>
        </div>
      ) : null}

      <Sparkline values={sparkline} />
    </div>
  );
}
