"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Command,
  CreditCard,
  Library,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  User2,
  X,
  DollarSign,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CommandPalette, type PaletteAction } from "@/components/app/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import {
  clearClientAuthState,
  type PreviewViewer,
} from "@/lib/preview-auth";
import { useAuthenticatedViewer } from "@/lib/use-authenticated-viewer";
import type { Book } from "@/lib/dashboard-api";
import { cn } from "@/lib/utils";

type AppFrameProps = {
  title: string;
  subtitle?: string;
  current: "home" | "new" | "account" | "billing" | "workspace" | "preview" | "affiliate";
  layout?: "default" | "book";
  currentBookSlug?: string;
  books?: Book[];
  showBookShelf?: boolean;
  hideHeader?: boolean;
  actions?: PaletteAction[];
  primaryAction?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  viewer?: PreviewViewer | null;
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { key: "home", href: "/app/library", label: "My Books", icon: Library },
  { key: "new", href: "/app/new/topic", label: "Start Book", icon: Plus },
  { key: "account", href: "/app/settings/profile", label: "Ayarlar", icon: User2 },
  { key: "billing", href: "/app/settings/billing", label: "Planlar", icon: CreditCard },
  { key: "affiliate", href: "/app/affiliate", label: "Affiliate %30", icon: DollarSign },
] as const;

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  creator: "Yazar",
  pro: "Stüdyo",
  premium: "Single Book",
};

function displayNameForViewer(viewer?: PreviewViewer | null) {
  if (!viewer) return "Hesabın";
  const name = viewer.name.trim();
  if (!name || name === "Book Creator") {
    return viewer.email.split("@")[0] || "Hesabın";
  }
  return name;
}

function initialsForViewer(viewer?: PreviewViewer | null) {
  const displayName = displayNameForViewer(viewer);
  const parts = displayName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "BG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function viewerPlanLabel(viewer?: PreviewViewer | null) {
  if (!viewer) return "Free";
  return PLAN_LABELS[viewer.planId] || viewer.planId;
}

function AppBrandLogo({
  compact = false,
}: {
  compact?: boolean;
}) {
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

function SidebarContent({
  current,
  currentBookSlug,
  books,
  showBookShelf = true,
  actions,
  viewer,
  showFooter = false,
  verificationSending = false,
  verificationMessage = "",
  onNavigate,
  onLogout,
  onResendVerification,
}: {
  current: AppFrameProps["current"];
  currentBookSlug?: string;
  books: Book[];
  showBookShelf?: boolean;
  actions: PaletteAction[];
  viewer?: PreviewViewer | null;
  showFooter?: boolean;
  verificationSending?: boolean;
  verificationMessage?: string;
  onNavigate?: () => void;
  onLogout?: () => void | Promise<void>;
  onResendVerification?: () => void | Promise<void>;
}) {
  const router = useRouter();

  function go(href: string) {
    router.push(href);
    onNavigate?.();
  }

  const displayName = displayNameForViewer(viewer);
  const newBookHref =
    viewer && viewer.usage?.canStartBook === false
      ? `/app/settings/billing?intent=start-book${viewer.usage.reason ? `&reason=${encodeURIComponent(viewer.usage.reason)}` : ""}`
      : "/app/new/topic";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Link
        href="/app/library"
        className="group flex shrink-0 items-center rounded-[24px] border border-sidebar-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04))] px-4 py-4 transition-colors hover:bg-sidebar-accent/65"
        onClick={onNavigate}
      >
        <AppBrandLogo />
      </Link>

      <nav className="mt-5 shrink-0 space-y-1" aria-label="Ana menü">
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

      {showBookShelf ? (
        <>
          <div className="my-5 shrink-0 h-px bg-sidebar-border/55" />

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-2 shrink-0 flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/42">
                Books
              </span>
              <span className="rounded-full border border-sidebar-border/60 bg-sidebar-accent/70 px-2 py-0.5 text-[10px] font-semibold text-sidebar-foreground/56">
                {books.length}
              </span>
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
              {books.slice(0, 30).map((book) => {
                const active = currentBookSlug === book.slug;
                return (
                  <button
                    key={book.slug}
                    type="button"
                    className={cn(
                      "group flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-[16px] px-3 text-left transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground/62 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )}
                    onClick={() => go(`/app/book/${encodeURIComponent(book.slug)}/preview`)}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg border transition-colors",
                        active
                          ? "border-primary/15 bg-primary/10 text-primary"
                          : "border-sidebar-border/60 bg-sidebar text-sidebar-foreground/52 group-hover:border-sidebar-border group-hover:bg-sidebar-accent/85",
                      )}
                    >
                      <BookOpen className="size-3.5 shrink-0" aria-hidden="true" />
                    </span>
                    <span className="truncate text-xs font-medium leading-5">{book.title}</span>
                  </button>
                );
              })}
              {!books.length && (
                <p className="px-3 py-3 text-xs text-sidebar-foreground/40">
                  No books yet.
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 items-start">
          <div className="mt-5 rounded-[20px] border border-sidebar-border/55 bg-sidebar-accent/35 px-3 py-3 text-xs leading-6 text-sidebar-foreground/54">
            You are in the new book flow. When steps are completed, preview and workspace will appear here.
          </div>
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-3 shrink-0">
          <div className="flex w-full items-center justify-between rounded-[18px] border border-sidebar-border/55 bg-sidebar-accent/55 px-3 py-2.5 text-[11px] text-sidebar-foreground/54">
            <span>Komut paleti</span>
            <kbd className="flex items-center gap-0.5 rounded border border-sidebar-border bg-sidebar px-1.5 py-0.5 font-mono text-[10px]">
              <Command className="size-2.5" />K
            </kbd>
          </div>
        </div>
      )}

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
              className="rounded-full border border-sidebar-border bg-sidebar px-3 py-1 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar"
              onClick={() => go("/app/settings/profile")}
            >
              Profil
            </button>
            <button
              type="button"
              className="rounded-full border border-sidebar-border bg-sidebar px-3 py-1 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar"
              onClick={() => go("/app/settings/billing")}
            >
              Planlar
            </button>
            {viewer.role !== "USER" ? (
              <button
                type="button"
                className="rounded-full border border-sidebar-border bg-sidebar px-3 py-1 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar"
                onClick={() => go("/admin")}
              >
                Admin
              </button>
            ) : null}
            {!viewer.emailVerified ? (
              <button
                type="button"
                className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
                onClick={() => void onResendVerification?.()}
                disabled={verificationSending}
              >
                {verificationSending ? "Gönderiliyor..." : "Doğrula"}
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-sidebar px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar"
            onClick={() => void onLogout?.()}
          >
            <LogOut className="size-4" />
            Çıkış yap
          </button>

          {verificationMessage ? (
            <p className="mt-2 text-xs leading-5 text-sidebar-foreground/60">{verificationMessage}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  label,
  description,
  onSelect,
}: {
  href: string;
  label: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-accent"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs leading-5 text-muted-foreground">{description}</div>
      </div>
    </Link>
  );
}

export function AppFrame({
  title,
  subtitle,
  current,
  layout = "default",
  currentBookSlug,
  books = [],
  showBookShelf = true,
  hideHeader = false,
  actions = [],
  primaryAction,
  viewer,
  children,
}: AppFrameProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const { viewer: hydratedViewer, refreshViewer } = useAuthenticatedViewer(!viewer);
  const currentViewer = viewer || hydratedViewer;

  const planLabel = useMemo(() => viewerPlanLabel(currentViewer), [currentViewer]);
  const displayName = useMemo(() => displayNameForViewer(currentViewer), [currentViewer]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  async function handleLogout() {
    await signOut({ redirect: false, callbackUrl: "/" });
    clearClientAuthState();
    setAccountMenuOpen(false);
    setDrawerOpen(false);
    router.push("/");
    router.refresh();
  }

  async function handleResendVerification() {
    setVerificationSending(true);
    setVerificationMessage("");
    trackEvent("verification_resend_clicked", { source: "app_frame_banner" });

    const response = await fetch("/api/auth/verify-email/resend", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);

    const payload = response
      ? ((await response.json().catch(() => null)) as { error?: string; message?: string } | null)
      : null;

    if (!response?.ok) {
      setVerificationMessage(payload?.error || "Doğrulama maili tekrar gönderilemedi.");
      setVerificationSending(false);
      return;
    }

    setVerificationMessage(payload?.message || "Doğrulama maili tekrar gönderildi.");
    setVerificationSending(false);
    await refreshViewer();
  }

  return (
    <>
      <aside className="app-sidebar hidden lg:flex">
        <div className="flex h-full flex-col px-3.5 py-4">
          <SidebarContent
            current={current}
            currentBookSlug={currentBookSlug}
            books={books}
            showBookShelf={showBookShelf}
            actions={actions}
            viewer={currentViewer}
          />
        </div>
      </aside>

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-sidebar-border bg-sidebar shadow-2xl transition-transform duration-300 lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Mobil menü"
      >
        <div className="flex h-full flex-col px-3.5 py-4">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              Menü
            </span>
            <button
              type="button"
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent transition hover:bg-sidebar-accent/80"
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
            showBookShelf={showBookShelf}
            actions={actions}
            viewer={currentViewer}
            showFooter
            verificationSending={verificationSending}
            verificationMessage={verificationMessage}
            onNavigate={() => setDrawerOpen(false)}
            onLogout={handleLogout}
            onResendVerification={handleResendVerification}
          />
        </div>
      </aside>

      <div className="app-content min-h-dvh bg-background text-foreground">
        {!hideHeader && <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-border/50 bg-background/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="min-w-0 flex flex-1 items-center gap-3">
            <button
              type="button"
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-card transition hover:bg-accent lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Menüyü aç"
            >
              <Menu className="size-4" />
            </button>

            <Link
              href="/app/library"
              className="hidden shrink-0 rounded-full border border-border/70 bg-card px-3 py-2 transition-colors hover:bg-accent sm:flex lg:hidden"
            >
              <AppBrandLogo compact />
            </Link>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold text-foreground sm:text-lg">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {actions.length > 0 ? <CommandPalette actions={actions} /> : null}
            {primaryAction ? (
              <Button size="sm" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            ) : null}

            {currentViewer ? (
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  className="flex h-11 cursor-pointer items-center gap-2 rounded-[18px] border border-border/80 bg-card px-2.5 text-left shadow-sm transition-colors hover:bg-accent sm:px-3"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initialsForViewer(currentViewer)}
                  </div>
                  <div className="hidden min-w-0 sm:block">
                    <div className="max-w-[10rem] truncate text-sm font-semibold text-foreground">
                      {displayName}
                    </div>
                    <div className="truncate text-[11px] font-medium text-muted-foreground">
                      {planLabel}
                    </div>
                  </div>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>

                {accountMenuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+12px)] z-40 w-[19rem] rounded-[26px] border border-border/70 bg-card/98 p-2 shadow-[0_24px_60px_rgba(37,27,20,0.16)] backdrop-blur-md">
                    <div className="flex items-start gap-3 rounded-[20px] bg-accent/55 px-3 py-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {initialsForViewer(currentViewer)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {displayName}
                        </div>
                        <div className="truncate text-xs leading-5 text-muted-foreground">
                          {currentViewer.email}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge>{planLabel}</Badge>
                          {currentViewer.emailVerified ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="size-3.5" />
                              Doğrulandı
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                              <ShieldCheck className="size-3.5" />
                              Doğrulama bekleniyor
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1">
                      <MenuLink
                        href="/app/settings/profile"
                        label="Profil ayarları"
                        description="Manage your name, writing goal, and account status."
                        onSelect={() => setAccountMenuOpen(false)}
                      />
                      <MenuLink
                        href="/app/settings/billing"
                        label="Planlar"
                        description="Paketini, erişim durumunu ve ödeme akışını gör."
                        onSelect={() => setAccountMenuOpen(false)}
                      />
                      {currentViewer.role !== "USER" ? (
                        <MenuLink
                          href="/admin"
                          label="Admin"
                          description="Yönetim paneline kısa yoldan geç."
                          onSelect={() => setAccountMenuOpen(false)}
                        />
                      ) : null}
                    </div>

                    <div className="mt-2 border-t border-border/60 pt-2">
                      <button
                        type="button"
                        className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-2xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                        onClick={() => void handleLogout()}
                      >
                        <LogOut className="size-4 text-muted-foreground" />
                        Çıkış yap
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>}

        {!hideHeader && currentViewer && !currentViewer.emailVerified ? (
          <div className="px-6 pt-4 md:px-10">
            <div className="rounded-[24px] border border-amber-500/20 bg-[linear-gradient(135deg,rgba(255,248,235,0.96),rgba(247,239,227,0.98))] px-5 py-4 shadow-[0_8px_30px_rgba(188,104,67,0.08)] dark:bg-[linear-gradient(135deg,rgba(34,25,20,0.96),rgba(24,18,15,0.98))]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">
                    Verify your email address
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Verify your email for account security, login recovery, and notifications to work properly. This step is required only once.
                  </p>
                  {verificationMessage ? (
                    <p className="mt-2 text-xs font-medium text-primary">{verificationMessage}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleResendVerification()}
                      disabled={verificationSending}
                    >
                    {verificationSending ? "Gönderiliyor..." : "Doğrulama mailini tekrar gönder"}
                    </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push("/app/settings/profile")}
                  >
                    Profil ayarlarını aç
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <main
          className={cn(
            hideHeader ? "" : "px-6 py-8 md:px-10 md:py-10",
            !hideHeader && layout === "book" && "xl:px-14",
          )}
        >
          {!hideHeader && subtitle ? (
            <p className="mb-8 text-sm leading-6 text-muted-foreground">{subtitle}</p>
          ) : null}
          {children}
        </main>
      </div>
    </>
  );
}
