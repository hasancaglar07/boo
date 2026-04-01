"use client";

import { MoreHorizontal } from "lucide-react";

export function ActionMenu({
  actions,
}: {
  actions: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
    destructive?: boolean;
  }>;
}) {
  return (
    <details className="group relative">
      <summary className="flex list-none cursor-pointer items-center justify-center rounded-xl border border-[color:var(--admin-border)] bg-white/60 p-2 text-[color:var(--admin-text)] transition hover:bg-white dark:bg-white/5">
        <MoreHorizontal className="size-4" />
      </summary>
      <div className="absolute right-0 top-12 z-20 min-w-[180px] rounded-2xl border border-[color:var(--admin-border)] bg-[color:var(--admin-surface-strong)] p-1 shadow-2xl">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={action.disabled}
            className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-[color:var(--admin-text)] transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/6"
            onClick={(event) => {
              event.preventDefault();
              action.onClick();
            }}
          >
            <span className={action.destructive ? "text-rose-600 dark:text-rose-300" : ""}>{action.label}</span>
          </button>
        ))}
      </div>
    </details>
  );
}
