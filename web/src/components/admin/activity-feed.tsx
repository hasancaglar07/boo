"use client";

import {
  BookOpen,
  CircleDot,
  CreditCard,
  Key,
  LogIn,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
} from "lucide-react";

import { formatRelativeTime } from "@/lib/admin/format";

function getActivityIcon(action: string) {
  const a = action.toLowerCase();
  if (a.includes("login") || a.includes("signin")) return LogIn;
  if (a.includes("signup") || a.includes("register") || a.includes("created")) {
    if (a.includes("user") || a.includes("account")) return UserPlus;
  }
  if (a.includes("book")) return BookOpen;
  if (a.includes("billing") || a.includes("payment") || a.includes("checkout") || a.includes("invoice")) return CreditCard;
  if (a.includes("role") || a.includes("admin")) return Shield;
  if (a.includes("delete") || a.includes("remove")) return Trash2;
  if (a.includes("settings") || a.includes("config")) return Settings;
  if (a.includes("unlock") || a.includes("premium")) return Sparkles;
  if (a.includes("verify") || a.includes("email")) return UserCheck;
  if (a.includes("api") || a.includes("key") || a.includes("token")) return Key;
  return CircleDot;
}

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
    metadata?: Record<string, unknown> | null;
  }>;
}) {
  return (
    <div className="admin-panel rounded-[24px] p-5">
      <div className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] admin-muted">Recent activity</div>
      <div className="space-y-4">
        {items.length ? (
          items.map((item) => {
            const Icon = getActivityIcon(item.action);
            return (
              <div key={item.id} className="flex gap-3">
                <div className="mt-1 flex size-8 items-center justify-center rounded-full bg-[color:var(--admin-primary-soft)] text-[color:var(--admin-primary)] shrink-0">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[color:var(--admin-text)]">
                    <span className="font-semibold">{item.actor}</span> {item.action}
                  </p>
                  {typeof item.metadata?.detail === "string" && item.metadata.detail ? (
                    <p className="mt-1 text-xs leading-5 admin-muted">{item.metadata.detail}</p>
                  ) : null}
                  <p className="text-xs admin-muted">
                    {typeof item.metadata?.status === "string" ? `${item.metadata.status} · ` : ""}
                    {item.entityType || "system"} {item.entityId ? `· ${item.entityId}` : ""} · {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm admin-muted">No activity yet.</p>
        )}
      </div>
    </div>
  );
}
