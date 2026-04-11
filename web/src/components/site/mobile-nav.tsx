"use client";

import * as React from "react";
import {
  Menu,
  X,
  Sparkles,
  ArrowRight,
  BookOpen,
  DollarSign,
  Wrench,
  HelpCircle,
  Layers,
  Scale,
  FileText,
  PenLine,
  BarChart3,
  SunMedium,
  MoonStar,
  Globe,
  ChevronDown,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { locales, type AppLocale } from "@/i18n/routing";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ── Nav groups ─────────────────────────────────────────────── */
const primaryNav = [
  { href: "/how-it-works", labelKey: "nav.howItWorks", icon: BookOpen },
  { href: "/examples", labelKey: "nav.examples", icon: Layers },
  { href: "/use-cases", labelKey: "footer.useCases", icon: PenLine },
  { href: "/pricing", labelKey: "nav.pricing", icon: DollarSign },
  { href: "/compare", labelKey: "footer.compare", icon: Scale },
  { href: "/faq", labelKey: "nav.faq", icon: HelpCircle },
];

const secondaryNav = [
  { href: "/tools", labelKey: "nav.tools", icon: Wrench },
  { href: "/resources", labelKey: "footer.resources", icon: FileText },
  { href: "/blog", labelKey: "footer.blog", icon: BarChart3 },
];

/* ── Component ──────────────────────────────────────────────── */
export function MobileNav({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const t = useTranslations();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);

  /* Lock body scroll */
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* Close on route change */
  React.useEffect(() => { setOpen(false); }, [pathname]);

  const isDark = resolvedTheme === "dark";

  return (
    <>
      {/* ── Trigger Button ─────────────────────────────────── */}
      <button
        aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
        aria-expanded={open}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground backdrop-blur-sm transition-all duration-200 lg:hidden",
          open
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border/70 bg-card/60 hover:border-border hover:bg-accent/80 hover:text-foreground active:scale-95"
        )}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-[15px] w-[15px]" /> : <Menu className="h-[15px] w-[15px]" />}
      </button>

      {/* ── Backdrop ───────────────────────────────────────── */}
      <div
        className={cn(
          "mobile-drawer-overlay fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden",
          open && "mobile-drawer-overlay--open"
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
        style={{ pointerEvents: open ? "auto" : "none" }}
      />

      {/* ── Drawer ─────────────────────────────────────────── */}
      <div
        className={cn(
          "mobile-drawer fixed inset-y-0 right-0 z-50 flex w-full max-w-[340px] flex-col bg-background/98 shadow-2xl backdrop-blur-2xl lg:hidden",
          open && "mobile-drawer--open"
        )}
      >
        {/* Top accent line */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--primary) 50%, transparent) 50%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        {/* ── Drawer Header ───────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <span className="text-[13px] font-semibold tracking-[-0.01em] text-foreground">
            {t("nav.mainMenu")}
          </span>
          <button
            aria-label={t("nav.closeMenu")}
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent/70 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Nav Content (scrollable) ────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Primary nav */}
          <nav className="flex flex-col gap-0.5" aria-label={t("nav.mobileMenu")}>
            {primaryNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium tracking-[-0.01em] transition-all duration-200",
                    isActive
                      ? "bg-primary/8 text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "flex size-8 items-center justify-center rounded-lg border transition-colors",
                    isActive
                      ? "border-primary/25 bg-primary/10 text-primary"
                      : "border-border/50 bg-card/60 text-muted-foreground group-hover:border-border group-hover:bg-accent/60 group-hover:text-foreground"
                  )}>
                    <Icon className="size-4" />
                  </div>
                  <span className="flex-1">{t(item.labelKey)}</span>
                  {isActive && (
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Divider + Secondary */}
          <div className="mt-5 border-t border-border/60 pt-4">
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("nav.more")}
            </div>
            <nav className="flex flex-col gap-0.5" aria-label={t("nav.mobileSecondaryMenu")}>
              {secondaryNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium tracking-[-0.01em] transition-all duration-200",
                      isActive
                        ? "bg-primary/8 text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "flex size-8 items-center justify-center rounded-lg border transition-colors",
                      isActive
                        ? "border-primary/25 bg-primary/10 text-primary"
                        : "border-border/50 bg-card/60 text-muted-foreground group-hover:border-border group-hover:bg-accent/60 group-hover:text-foreground"
                    )}>
                      <Icon className="size-4" />
                    </div>
                    <span className="flex-1">{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* ── Theme + Language in drawer ─────────────────── */}
          <div className="mt-5 border-t border-border/60 pt-4">
            <div className="flex items-center gap-3 px-3">
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/60 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
                <span>{isDark ? "Light" : "Dark"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom CTA ──────────────────────────────────── */}
        <div className="border-t border-border/60 px-5 py-4">
          <div className="flex flex-col gap-2">
            <Link href={isAuthenticated ? "/app/library" : "/login"} onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full text-[13.5px] font-medium tracking-[-0.01em]">
                {isAuthenticated ? t("nav.myBooks") : t("nav.login")}
              </Button>
            </Link>
            <Link href={isAuthenticated ? "/app/new/topic" : "/start/topic"} onClick={() => setOpen(false)}>
              <Button className="header-cta-btn w-full gap-1.5 text-[13.5px] font-semibold tracking-[-0.01em]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {isAuthenticated ? t("nav.newBook") : t("nav.freePreview")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
