"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { CommandPalette, type PaletteAction } from "@/components/app/command-palette";
import { useOptionalAppContext } from "@/components/app/app-context";
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

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  creator: "Author",
  pro: "Studio",
  premium: "Single Book",
};

function displayNameForViewer(viewer?: PreviewViewer | null, fallback = "Your Account") {
  if (!viewer) return fallback;
  const name = viewer.name.trim();
  if (!name || name === "Book Creator") {
    return viewer.email.split("@")[0] || fallback;
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
  const t = useTranslations("AppFrame");
  const router = useRouter();
  const appCtx = useOptionalAppContext();
  const isInLayout = appCtx !== null;

  // When inside the /app/app layout, drawer state lives in the persistent context.
  // When outside (e.g. /start/* funnel), fall back to local state.
  const [localDrawerOpen, setLocalDrawerOpen] = useState(false);
  const drawerOpen = appCtx?.drawerOpen ?? localDrawerOpen;
  const setDrawerOpen = appCtx?.setDrawerOpen ?? setLocalDrawerOpen;

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const { viewer: hydratedViewer, refreshViewer } = useAuthenticatedViewer(!viewer);
  const currentViewer = viewer || hydratedViewer;

  const planLabel = useMemo(() => viewerPlanLabel(currentViewer), [currentViewer]);
  const displayName = useMemo(() => displayNameForViewer(currentViewer, t("yourAccount")), [currentViewer, t]);

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
      setVerificationMessage(payload?.error || t("verificationResendFailed"));
      setVerificationSending(false);
      return;
    }

    setVerificationMessage(payload?.message || t("verificationResent"));
    setVerificationSending(false);
    await refreshViewer();
  }

  return (
    <>
      {/* Sidebar + mobile drawer are rendered by PersistentSidebar in the /app/app layout.
          Only render them here when outside that layout (e.g. /start/* funnel routes). */}
      {!isInLayout && (
        <>
          <aside className="app-sidebar hidden lg:flex">
            <div className="flex h-full flex-col px-3.5 py-4 text-sidebar-foreground/60 text-xs">
              {/* Sidebar content handled by PersistentSidebar when in layout */}
            </div>
          </aside>

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
            aria-label={t("mobileMenu")}
          >
            <div className="flex h-full flex-col px-3.5 py-4">
              <div className="mb-3 flex shrink-0 items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                  {t("menu")}
                </span>
                <button
                  type="button"
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent transition hover:bg-sidebar-accent/80"
                  onClick={() => setDrawerOpen(false)}
                  aria-label={t("closeMenu")}
                >
                  {/* X icon — only rendered outside layout */}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      <div className="app-content min-h-dvh bg-background text-foreground">
        {!hideHeader && <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-border/50 bg-background/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="min-w-0 flex flex-1 items-center gap-3">
            <button
              type="button"
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-card transition hover:bg-accent lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("openMenu")}
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
                              {t("verified")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                              <ShieldCheck className="size-3.5" />
                              {t("pendingVerification")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1">
                      <MenuLink
                        href="/app/settings/profile"
                        label={t("profileSettings")}
                        description={t("profileSettingsDesc")}
                        onSelect={() => setAccountMenuOpen(false)}
                      />
                      <MenuLink
                        href="/app/settings/billing"
                        label={t("plans")}
                        description={t("plansDesc")}
                        onSelect={() => setAccountMenuOpen(false)}
                      />
                      {currentViewer.role !== "USER" ? (
                        <MenuLink
                          href="/admin"
                          label={t("admin")}
                          description={t("adminDesc")}
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
                        {t("signOut")}
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
                    {t("verifyEmailTitle")}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {t("verifyEmailDesc")}
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
                    {verificationSending ? t("sending") : t("resendVerification")}
                    </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push("/app/settings/profile")}
                  >
                    {t("openProfileSettings")}
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
