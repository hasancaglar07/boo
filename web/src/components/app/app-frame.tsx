"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Command,
  CreditCard,
  Library,
  Menu,
  Plus,
  User2,
  X,
} from "lucide-react";
import { useState } from "react";

import { CommandPalette, type PaletteAction } from "@/components/app/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { Book } from "@/lib/dashboard-api";
import { cn } from "@/lib/utils";

type AppFrameProps = {
  title: string;
  subtitle?: string;
  current: "home" | "new" | "account" | "billing" | "workspace" | "preview";
  layout?: "default" | "book";
  currentBookSlug?: string;
  books?: Book[];
  actions?: PaletteAction[];
  primaryAction?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { key: "home", href: "/app/library", label: "Kitaplarım", icon: Library },
  { key: "new", href: "/start/topic", label: "Kitap Başlat", icon: Plus },
  { key: "account", href: "/app/settings/profile", label: "Ayarlar", icon: User2 },
  { key: "billing", href: "/app/settings/billing", label: "Planlar", icon: CreditCard },
] as const;

/** Sidebar inner content — reused for desktop fixed panel and mobile drawer */
function SidebarContent({
  current,
  currentBookSlug,
  books,
  actions,
  onNavigate,
}: {
  current: AppFrameProps["current"];
  currentBookSlug?: string;
  books: Book[];
  actions: PaletteAction[];
  onNavigate?: () => void;
}) {
  const router = useRouter();

  function go(href: string) {
    router.push(href);
    onNavigate?.();
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo */}
      <Link
        href="/app/library"
        className="flex shrink-0 items-center px-2 pb-2 pt-3 transition-opacity hover:opacity-80"
        onClick={onNavigate}
      >
        <span className="relative block h-9 w-[160px] overflow-hidden">
          <Image
            src="/logo.png"
            alt="Book Generator"
            className="h-full w-full object-contain object-left dark:hidden"
            fill
            priority
            sizes="160px"
          />
          <Image
            src="/dark-logo.png"
            alt="Book Generator"
            className="hidden h-full w-full object-contain object-left dark:block"
            fill
            priority
            sizes="160px"
          />
        </span>
      </Link>

      {/* Primary nav */}
      <nav className="mt-4 shrink-0 space-y-0.5" aria-label="Ana menü">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Section divider */}
      <div className="my-4 shrink-0 h-px bg-sidebar-border/50" />

      {/* Books list — fills remaining space, scrollable */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 shrink-0 flex items-center justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/40">
            Kitaplar
          </span>
          <span className="rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-semibold text-sidebar-foreground/50">
            {books.length}
          </span>
        </div>
        <div className="min-h-0 flex-1 space-y-px overflow-y-auto">
          {books.slice(0, 30).map((book) => {
            const active = currentBookSlug === book.slug;
            return (
              <button
                key={book.slug}
                type="button"
                className={cn(
                  "flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
                onClick={() => go(`/app/book/${encodeURIComponent(book.slug)}/preview`)}
              >
                <BookOpen className="size-3 shrink-0 opacity-50" aria-hidden="true" />
                <span className="truncate text-xs font-medium">{book.title}</span>
              </button>
            );
          })}
          {!books.length && (
            <p className="px-3 py-3 text-xs text-sidebar-foreground/40">
              Henüz kitap yok.
            </p>
          )}
        </div>
      </div>

      {/* Command palette hint */}
      {actions.length > 0 && (
        <div className="mt-3 shrink-0">
          <div className="flex w-full items-center justify-between rounded-xl border border-sidebar-border/40 bg-sidebar-accent/50 px-3 py-2 text-[11px] text-sidebar-foreground/50">
            <span>Komut paleti</span>
            <kbd className="flex items-center gap-0.5 rounded border border-sidebar-border bg-sidebar px-1.5 py-0.5 font-mono text-[10px]">
              <Command className="size-2.5" />K
            </kbd>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppFrame({
  title,
  subtitle,
  current,
  layout = "default",
  currentBookSlug,
  books = [],
  actions = [],
  primaryAction,
  children,
}: AppFrameProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* ── Desktop: fixed left sidebar ─────────────────────────── */}
      <aside className="app-sidebar hidden lg:flex">
        <div className="flex h-full flex-col px-3 py-3">
          <SidebarContent
            current={current}
            currentBookSlug={currentBookSlug}
            books={books}
            actions={actions}
          />
        </div>
      </aside>

      {/* ── Mobile: overlay + slide-in drawer ───────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-sidebar-border bg-sidebar shadow-2xl transition-transform duration-300 lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Mobil menü"
      >
        <div className="flex h-full flex-col px-3 py-3">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              Menü
            </span>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent transition hover:bg-sidebar-accent/80"
              onClick={() => setDrawerOpen(false)}
              aria-label="Menüyü kapat"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <SidebarContent
            current={current}
            currentBookSlug={currentBookSlug}
            books={books}
            actions={actions}
            onNavigate={() => setDrawerOpen(false)}
          />
        </div>
      </aside>

      {/* ── Page content pushed right of fixed sidebar ───────────── */}
      <div className="app-content min-h-dvh bg-background text-foreground">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/50 bg-background/95 px-6 backdrop-blur-md">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card transition hover:bg-accent lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menüyü aç"
          >
            <Menu className="size-4" />
          </button>

          {/* Page title */}
          <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
            {title}
          </h1>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {actions.length > 0 && <CommandPalette actions={actions} />}
            {primaryAction && (
              <Button size="sm" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            )}
          </div>
        </header>

        {/* Main scrollable area */}
        <main
          className={cn(
            "px-6 py-8 md:px-10 md:py-10",
            layout === "book" && "xl:px-14",
          )}
        >
          {subtitle && (
            <p className="mb-8 text-sm leading-6 text-muted-foreground">{subtitle}</p>
          )}
          {children}
        </main>
      </div>
    </>
  );
}
