"use client";

import { CircleDot } from "lucide-react";

import { formatRelativeTime } from "@/lib/admin/format";

export function ActivityFeed({
  items,
}: {
  items: Array<{
    id: string;
    action: string;
    actor: string;
    createdAt: string;
    entityType?: string;
    entityId?: string | null;
  }>;
}) {
  return (
    <div className="admin-panel rounded-[24px] p-5">
      <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] admin-muted">Recent activity</div>
      <div className="space-y-4">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="mt-1 flex size-8 items-center justify-center rounded-full bg-[color:var(--admin-primary-soft)] text-[color:var(--admin-primary)]">
                <CircleDot className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[color:var(--admin-text)]">
                  <span className="font-semibold">{item.actor}</span> {item.action}
                </p>
                <p className="text-xs admin-muted">
                  {item.entityType || "system"} {item.entityId ? `· ${item.entityId}` : ""} · {formatRelativeTime(item.createdAt)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm admin-muted">Henüz activity yok.</p>
        )}
      </div>
    </div>
  );
}
