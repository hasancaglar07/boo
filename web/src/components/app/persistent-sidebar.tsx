"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Library,
  LogOut,
  Plus,
  ShieldCheck,
  Sparkles,
  User2,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import { useAppContext } from "@/components/app/app-context";
import { trackEvent } from "@/lib/analytics";
import { buildBookAssetUrl } from "@/lib/dashboard-api";
import { clearClientAuthState, type PreviewViewer } from "@/lib/preview-auth";
import { useAuthenticatedViewer } from "@/lib/use-authenticated-viewer";
import { cn } from "@/lib/utils";

/* ── Constants ─────────────────────────────────────────────── */

const NAV_ITEMS = [
  { key: "home", href: "/app/library", label: "My Books", icon: Library },
  { key: "new", href: "/app/new/topic", label: "Start Book", icon: Plus },
  { key: "account", href: "/app/settings/profile", label: "Settings", icon: User2 },
  { key: "billing", href: "/app/settings/billing", label: "Plans", icon: CreditCard },
  { key: "affiliate", href: "/app/affiliate", label: "Affiliate 30%", icon: DollarSign },
] as const;

type NavKey = (typeof NAV_ITEMS)[number]["key"];

const BOOK_PALETTE = [
  { from: "#f59e0b", to: "#d97706" },
  { from: "#f87171", to: "#dc2626" },
  { from: "#a78bfa", to: "#7c3aed" },
  { from: "#34d399", to: "#059669" },
  { from: "#60a5fa", to: "#2563eb" },
  { from: "#fb923c", to: "#ea580c" },
  { from: "#f472b6", to: "#db2777" },
  { from: "#4ade80", to: "#16a34a" },
];

function bookColor(title: string) {
  const code = (title.charCodeAt(0) ?? 65) + (title.charCodeAt(1) ?? 0);
  return BOOK_PALETTE[code % BOOK_PALETTE.length];
}

/* ── Route helpers ──────────────────────────────────────────── */

function getCurrentFromPath(path: string): NavKey {
  if (path === "/app/library" || path === "/app") return "home";
  if (path.startsWith("/app/new")) return "new";
  if (path.startsWith("/app/settings/billing")) return "billing";
  if (path.startsWith("/app/settings")) return "account";
  if (path.startsWith("/app/affiliate")) return "affiliate";
  return "home";
}

/* ── Brand logo (duplicated from app-frame for isolation) ───── */

function AppBrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={cn(
        "relative block overflow-hidden",
        compact ? "h-8 w-[132px]" : "h-12 w-[220px] max-w-full",
      )}
    >
      <Image
        src="/logo.png"
        alt="Book Generator"
        className="h-full w-full object-contain object-left dark:hidden"
        fill
        priority
        sizes={compact ? "132px" : "210px"}
      />
      <Image
        src="/dark-logo.png"
        alt="Book Generator"
        className="hidden h-full w-full object-contain object-left dark:block"
        fill
        priority
        sizes={compact ? "132px" : "210px"}
      />
    </span>
  );
}

/* ── Viewer helpers ─────────────────────────────────────────── */

function displayNameForViewer(viewer?: PreviewViewer | null) {
  if (!viewer) return "Your Account";
  const name = viewer.name.trim();
  if (!name || name === "Book Creator") return viewer.email.split("@")[0] || "Your Account";
  return name;
}

function initialsForViewer(viewer?: PreviewViewer | null) {
  const displayName = displayNameForViewer(viewer);
  const parts = displayName
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return "BG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

/* ── SidebarInner ───────────────────────────────────────────── */

function SidebarInner({
  onNavigate,
  onLogout,
  onResendVerification,
  showFooter = false,
  verificationSending = false,
  verificationMessage = "",
}: {
  onNavigate?: () => void;
  onLogout?: () => void | Promise<void>;
  onResendVerification?: () => void | Promise<void>;
  showFooter?: boolean;
  verificationSending?: boolean;
  verificationMessage?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { books, drawerOpen: _d, setDrawerOpen: _sd, refreshBooks: _rb } = useAppContext();
  const { viewer } = useAuthenticatedViewer(true);

  const current = getCurrentFromPath(pathname);
  const bookSlugMatch = /\/app\/book\/([^/]+)/.exec(pathname);
  const currentBookSlug = bookSlugMatch ? decodeURIComponent(bookSlugMatch[1]) : undefined;

  const newBookHref =
    viewer && viewer.usage?.canStartBook === false
      ? `/app/settings/billing?intent=start-book${viewer.usage.reason ? `&reason=${encodeURIComponent(viewer.usage.reason)}` : ""}`
      : "/app/new/topic";

  const displayName = displayNameForViewer(viewer);

  const sortedBooks = useMemo(
    () =>
      [...books].sort((a, b) => {
        const aT = a.status?.started_at ? new Date(a.status.started_at).getTime() : 0;
        const bT = b.status?.started_at ? new Date(b.status.started_at).getTime() : 0;
        return bT - aT;
      }),
    [books],
  );

  /* Prefetch top routes */
  useEffect(() => {
    const routes = [
      "/app/library",
      "/app/settings/profile",
      "/app/settings/billing",
      "/app/affiliate",
      newBookHref,
    ];
    for (const r of routes) void router.prefetch(r);
    for (const book of sortedBooks.slice(0, 8)) {
      const s = encodeURIComponent(book.slug);
      void router.prefetch(`/app/book/${s}/preview`);
      void router.prefetch(`/app/book/${s}/workspace?tab=writing`);
    }
  }, [sortedBooks, newBookHref, router]);

  function go(href: string) {
    router.push(href);
    onNavigate?.();
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo */}
      <Link
        href="/app/library"
        className="group flex shrink-0 items-center rounded-[24px] border border-sidebar-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))] px-4 py-4 transition-colors hover:bg-sidebar-accent/65"
        onClick={onNavigate}
      >
        <AppBrandLogo />
      </Link>

      {/* Nav */}
      <nav className="mt-5 shrink-0 space-y-1" aria-label="Main menu">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          const href = item.key === "new" ? newBookHref : item.href;
          return (
            <Link
              key={item.key}
              href={href}
              onClick={onNavigate}
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-[18px] px-3.5 text-[15px] font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-[0_12px_24px_rgba(188,104,67,0.16)]"
                  : "text-sidebar-foreground/74 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-xl border transition-colors",
                  active
                    ? "border-primary-foreground/10 bg-primary-foreground/14 text-primary-foreground"
                    : "border-sidebar-border/65 bg-sidebar px-0 text-sidebar-foreground/72 group-hover:border-sidebar-border group-hover:bg-sidebar-accent/85",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="my-4 shrink-0 h-px bg-sidebar-border/45" />

      {/* Book shelf */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2.5 shrink-0 flex items-center justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/38">
            My Books
          </span>
          <div className="flex items-center gap-1.5">
            <span className="rounded-full border border-sidebar-border/55 bg-sidebar-accent/60 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-sidebar-foreground/48">
              {books.length}
            </span>
            <Link
              href={newBookHref}
              onClick={onNavigate}
              title="New book"
              className="flex size-[22px] items-center justify-center rounded-full border border-sidebar-border/70 bg-sidebar-accent/70 text-sidebar-foreground/56 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
            >
              <Plus className="size-3" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="sidebar-book-list min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {sortedBooks.slice(0, 50).map((book) => {
            const active = currentBookSlug === book.slug;
            const isGenerating = !!book.status?.active;
            const palette = bookColor(book.title);
            return (
              <button
                key={book.slug}
                type="button"
                className={cn(
                  "group flex min-h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-[13px] px-2 pr-3 text-left transition-all duration-150",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
                onClick={() => go(`/app/book/${encodeURIComponent(book.slug)}/preview`)}
              >
                {/* Cover thumbnail or gradient avatar */}
                <div
                  className={cn(
                    "relative flex shrink-0 overflow-hidden rounded-[6px] border",
                    active
                      ? "border-primary/25 shadow-[0_2px_8px_rgba(188,104,67,0.18)]"
                      : "border-sidebar-border/50 group-hover:border-sidebar-border/80",
                  )}
                  style={{ width: 26, height: 34 }}
                >
                  {book.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={buildBookAssetUrl(book.slug, book.cover_image)}
                      alt=""
                      aria-hidden="true"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      style={{
                        background: `linear-gradient(145deg, ${palette.from}, ${palette.to})`,
                      }}
                      className="flex h-full w-full items-center justify-center text-[11px] font-bold text-white/90"
                    >
                      {book.title[0]?.toUpperCase() ?? "B"}
                    </div>
                  )}
                  {isGenerating && (
                    <div className="absolute inset-0 animate-pulse bg-white/20" />
                  )}
                </div>

                {/* Title + status */}
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium leading-[1.35]">
                    {book.title}
                  </span>
                  {isGenerating && (
                    <span className="flex items-center gap-1 text-[10px] leading-[1.4] text-emerald-500 dark:text-emerald-400">
                      <Sparkles className="size-2.5" aria-hidden="true" />
                      Writing...
                    </span>
                  )}
                </div>

                {/* Pulse dot */}
                {isGenerating && (
                  <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}

          {!books.length && (
            <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-sidebar-border/60 bg-sidebar-accent/25 px-4 py-5 text-center">
              <BookOpen className="size-6 text-sidebar-foreground/28" aria-hidden="true" />
              <p className="text-xs leading-5 text-sidebar-foreground/38">No books yet.</p>
              <Link
                href={newBookHref}
                onClick={onNavigate}
                className="rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/14"
              >
                Create your first book
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer (mobile only) */}
      {showFooter && viewer ? (
        <div className="mt-3 shrink-0 rounded-[22px] border border-sidebar-border/60 bg-sidebar-accent/45 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initialsForViewer(viewer)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-sidebar-foreground">
                {displayName}
              </div>
              <div className="truncate text-xs text-sidebar-foreground/60">{viewer.email}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-sidebar-border bg-sidebar px-3 py-1 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              onClick={() => go("/app/settings/profile")}
            >
              Profile
            </button>
            <button
              type="button"
              className="rounded-full border border-sidebar-border bg-sidebar px-3 py-1 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              onClick={() => go("/app/settings/billing")}
            >
              Plans
            </button>
            {viewer.role !== "USER" && (
              <button
                type="button"
                className="rounded-full border border-sidebar-border bg-sidebar px-3 py-1 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                onClick={() => go("/admin")}
              >
                Admin
              </button>
            )}
            {!viewer.emailVerified && (
              <button
                type="button"
                className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
                onClick={() => void onResendVerification?.()}
                disabled={verificationSending}
              >
                {verificationSending ? "Sending..." : "Verify"}
              </button>
            )}
          </div>

          <button
            type="button"
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-sidebar px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            onClick={() => void onLogout?.()}
          >
            <LogOut className="size-4" />
            Sign Out
          </button>

          {verificationMessage && (
            <p className="mt-2 text-xs leading-5 text-sidebar-foreground/60">
              {verificationMessage}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ── PersistentSidebar (desktop + mobile drawer) ────────────── */

export function PersistentSidebar() {
  const { drawerOpen, setDrawerOpen } = useAppContext();
  const { viewer, refreshViewer } = useAuthenticatedViewer(true);
  const router = useRouter();
  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");

  async function handleLogout() {
    await signOut({ redirect: false, callbackUrl: "/" });
    clearClientAuthState();
    setDrawerOpen(false);
    router.push("/");
    router.refresh();
  }

  async function handleResendVerification() {
    setVerificationSending(true);
    setVerificationMessage("");
    trackEvent("verification_resend_clicked", { source: "persistent_sidebar" });

    const response = await fetch("/api/auth/verify-email/resend", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);

    const payload = response
      ? ((await response.json().catch(() => null)) as {
          error?: string;
          message?: string;
        } | null)
      : null;

    if (!response?.ok) {
      setVerificationMessage(payload?.error || "Verification email could not be resent.");
      setVerificationSending(false);
      return;
    }

    setVerificationMessage(payload?.message || "Verification email has been resent.");
    setVerificationSending(false);
    await refreshViewer();
  }

  const sharedProps = {
    onLogout: handleLogout,
    onResendVerification: handleResendVerification,
    verificationSending,
    verificationMessage,
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="app-sidebar hidden lg:flex">
        <div className="flex h-full flex-col px-3.5 py-4">
          <SidebarInner {...sharedProps} />
        </div>
      </aside>

      {/* Mobile overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-sidebar-border bg-sidebar shadow-2xl transition-transform duration-300 lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Mobile menu"
      >
        <div className="flex h-full flex-col px-3.5 py-4">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              Menu
            </span>
            <button
              type="button"
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent transition hover:bg-sidebar-accent/80"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <SidebarInner
            {...sharedProps}
            showFooter
            onNavigate={() => setDrawerOpen(false)}
          />
        </div>
      </aside>
    </>
  );
}
