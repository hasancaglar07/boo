"use client";

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  Loader2,
  Minus,
  Sparkles,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

const STATUS_MAP: Record<
  string,
  {
    label: string;
    icon: typeof CheckCircle2;
    className: string;
  }
> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  success: {
    label: "Success",
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  inactive: {
    label: "Inactive",
    icon: Minus,
    className: "border-slate-400/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  danger: {
    label: "Danger",
    icon: XCircle,
    className: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    className: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  pending: {
    label: "Pending",
    icon: Clock3,
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  canceled: {
    label: "Canceled",
    icon: Ban,
    className: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  past_due: {
    label: "Past Due",
    icon: AlertTriangle,
    className: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  },
  trialing: {
    label: "Trialing",
    icon: Sparkles,
    className: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  draft: {
    label: "Draft",
    icon: Minus,
    className: "border-slate-400/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  },
  generating: {
    label: "Generating",
    icon: Loader2,
    className: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  preview_ready: {
    label: "Preview Ready",
    icon: CheckCircle2,
    className: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  premium_unlocked: {
    label: "Premium Unlocked",
    icon: Sparkles,
    className: "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
  exported: {
    label: "Exported",
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  revision_requested: {
    label: "Revision Requested",
    icon: AlertTriangle,
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  refunded: {
    label: "Refunded",
    icon: Ban,
    className: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  void: {
    label: "Void",
    icon: Minus,
    className: "border-slate-400/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  },
  open: {
    label: "Open",
    icon: Clock3,
    className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
};

export function StatusBadge({
  status,
  label,
  size = "md",
}: {
  status: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const key = String(status || "").trim().toLowerCase();
  const meta = STATUS_MAP[key] || STATUS_MAP.inactive;
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-[0.12em]",
        size === "sm" && "px-2 py-1 text-[10px]",
        size === "md" && "px-2.5 py-1 text-[11px]",
        size === "lg" && "px-3 py-1.5 text-xs",
        meta.className,
      )}
      title={label || meta.label}
    >
      <Icon className={cn("size-3.5", key === "processing" || key === "generating" ? "animate-spin" : "")} />
      {label || meta.label}
    </span>
  );
}
