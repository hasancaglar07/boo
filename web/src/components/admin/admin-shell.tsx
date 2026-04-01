"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileClock,
  Flag,
  LayoutDashboard,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/books", label: "Books", icon: BookOpen },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: Search },
  { href: "/admin/jobs", label: "Jobs", icon: FileClock },
  { href: "/admin/audit", label: "Audit", icon: ShieldCheck },
  { href: "/admin/moderation", label: "Moderation", icon: Flag },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
] as const;

function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean).slice(1);
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs admin-muted">
      <span>/admin</span>
      {parts.map((part) => (
        <span key={part} className="inline-flex items-center gap-2">
          <span>/</span>
          <span className="font-semibold capitalize text-[color:var(--admin-text)]">{decodeURIComponent(part)}</span>
        </span>
      ))}
    </div>
  );
}

function GlobalSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      className="relative w-full max-w-md"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(`/admin/users?q=${encodeURIComponent(value.trim())}`);
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--admin-muted)]" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Kullanıcı, e-posta veya kitap ara"
        className="h-11 w-full rounded-2xl border border-[color:var(--admin-border)] bg-white/60 pl-9 pr-4 text-sm text-[color:var(--admin-text)] outline-none transition focus:border-[color:var(--admin-primary)] focus:ring-2 focus:ring-[color:var(--admin-primary-soft)] dark:bg-white/5"
      />
    </form>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
  };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const title = useMemo(
    () => NAV_ITEMS.find((item) => item.href === pathname)?.label || "Admin",
    [pathname],
  );

  return (
    <div className="admin-root admin-shell">
      {drawerOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-label="Admin menüsünü kapat"
        />
      )}

      <aside
        className={cn(
          "admin-sidebar fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-200",
          collapsed ? "w-[92px]" : "w-[280px]",
          drawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/admin" className="text-sm font-semibold tracking-[0.22em] text-white">
            {collapsed ? "BG" : "BOOK GENERATOR"}
          </Link>
          <button
            type="button"
            className="hidden rounded-xl border border-white/10 p-2 text-white/80 lg:inline-flex"
            onClick={() => setCollapsed((current) => !current)}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/10 p-2 text-white/80 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="admin-scrollbar flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white",
                    collapsed && "justify-center",
                  )}
                  onClick={() => setDrawerOpen(false)}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 px-4 py-4 text-xs text-white/70">
          {!collapsed ? (
            <>
              <div className="font-semibold text-white">{user.name || user.email || "Admin"}</div>
              <div className="mt-1">{user.role}</div>
            </>
          ) : (
            <div className="text-center font-semibold text-white">{user.role.slice(0, 1)}</div>
          )}
        </div>
      </aside>

      <div className={cn("min-h-dvh transition-all duration-200", collapsed ? "lg:pl-[92px]" : "lg:pl-[280px]")}>
        <header className="sticky top-0 z-30 border-b border-[color:var(--admin-border)] bg-[color:var(--admin-surface-strong)] px-4 py-4 backdrop-blur-2xl md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex rounded-2xl border border-[color:var(--admin-border)] p-2 lg:hidden"
                onClick={() => setDrawerOpen(true)}
              >
                <Menu className="size-4" />
              </button>
              <div>
                <Breadcrumbs />
                <div className="mt-1 text-xl font-semibold text-[color:var(--admin-text)]">{title}</div>
              </div>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <GlobalSearch />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center rounded-2xl border border-[color:var(--admin-border)] bg-white/60 text-[color:var(--admin-text)] dark:bg-white/5"
                >
                  <Bell className="size-4" />
                </button>
                <div className="rounded-2xl border border-[color:var(--admin-border)] bg-white/60 px-4 py-2 text-sm dark:bg-white/5">
                  <div className="font-semibold text-[color:var(--admin-text)]">{user.name || "Admin"}</div>
                  <div className="admin-muted text-xs">{user.email}</div>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
