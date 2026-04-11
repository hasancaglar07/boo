"use client";

import Image from "next/image";
import {
  Sparkles,
  BookOpen,
  DollarSign,
  Wrench,
  HelpCircle,
  ChevronDown,
  Search,
  FileText,
  PenLine,
  Layers,
  BarChart3,
  Scale,
  ArrowRight,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { MobileNav } from "@/components/site/mobile-nav";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getSession, syncPreviewAuthState } from "@/lib/preview-auth";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────── */
type DropdownChild = {
  href: string;
  labelKey: string;
  icon?: ReactNode;
  descriptionKey?: string;
};

type NavItem =
  | { type: "link"; href: string; labelKey: string }
  | { type: "dropdown"; href: string; labelKey: string; children: DropdownChild[] };

/* ── Dropdown configuration ─────────────────────────────────── */
const nav: NavItem[] = [
  {
    type: "dropdown",
    href: "/how-it-works",
    labelKey: "nav.howItWorks",
    children: [
      { href: "/how-it-works", labelKey: "nav.howItWorks", icon: <BookOpen className="size-4" />, descriptionKey: "nav.howItWorksDesc" },
      { href: "/examples", labelKey: "nav.examples", icon: <Layers className="size-4" />, descriptionKey: "nav.examplesDesc" },
      { href: "/use-cases", labelKey: "footer.useCases", icon: <PenLine className="size-4" />, descriptionKey: "nav.useCasesDesc" },
    ],
  },
  {
    type: "dropdown",
    href: "/pricing",
    labelKey: "nav.pricing",
    children: [
      { href: "/pricing", labelKey: "nav.pricing", icon: <DollarSign className="size-4" />, descriptionKey: "nav.pricingDesc" },
      { href: "/compare", labelKey: "footer.compare", icon: <Scale className="size-4" />, descriptionKey: "nav.compareDesc" },
    ],
  },
  {
    type: "dropdown",
    href: "/tools",
    labelKey: "nav.tools",
    children: [
      { href: "/tools", labelKey: "nav.tools", icon: <Wrench className="size-4" />, descriptionKey: "nav.toolsDesc" },
      { href: "/resources", labelKey: "footer.resources", icon: <FileText className="size-4" />, descriptionKey: "nav.resourcesDesc" },
      { href: "/blog", labelKey: "footer.blog", icon: <BarChart3 className="size-4" />, descriptionKey: "nav.blogDesc" },
    ],
  },
  { type: "link", href: "/faq", labelKey: "nav.faq" },
];

/* ── Dropdown timing constants ──────────────────────────────── */
const DROPDOWN_OPEN_DELAY = 80;
const DROPDOWN_CLOSE_DELAY = 200;

/* ── SiteHeader Component ───────────────────────────────────── */
export function SiteHeader() {
  const { resolvedTheme } = useTheme();
  const t = useTranslations();
  const pathname = usePathname();
  const logoSrc = resolvedTheme === "dark" ? "/dark-logo.png" : "/logo.png";
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getSession()));
  const [scrolled, setScrolled] = useState(false);
  const tickingRef = useRef(false);

  /* ── Auth sync ──────────────────────────────────────────── */
  useEffect(() => {
    let active = true;
    void syncPreviewAuthState().then((payload) => {
      if (!active) return;
      setIsAuthenticated(Boolean(payload?.authenticated || getSession()));
    });
    return () => { active = false; };
  }, []);

  /* ── Scroll handler (rAF-throttled) ─────────────────────── */
  const handleScroll = useCallback(() => {
    if (tickingRef.current) return;
    tickingRef.current = true;
    requestAnimationFrame(() => {
      setScrolled(window.scrollY > 20);
      tickingRef.current = false;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  /* ── Helper: is nav item active? ────────────────────────── */
  const isItemActive = (item: NavItem) => {
    if (item.type === "link") return pathname === item.href;
    return (
      pathname === item.href ||
      item.children.some((c) => pathname === c.href)
    );
  };

  return (
    <header
      className={cn(
        "site-header fixed inset-x-0 top-0 z-50 backdrop-blur-xl",
        scrolled && "site-header--scrolled"
      )}
    >
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      <div className={cn(
        "header-inner shell flex items-center justify-between gap-6 lg:gap-8 transition-[height] duration-300 ease-out",
        scrolled ? "h-[60px]" : "h-[72px]"
      )}>
        {/* ── Logo ────────────────────────────────────────── */}
        <Link
          href="/"
          className="header-logo-link flex shrink-0 items-center"
          aria-label={t("nav.goHome")}
        >
          <span className={cn(
            "header-logo-wrap relative block overflow-hidden transition-all duration-300 ease-out",
            scrolled
              ? "h-9 w-[200px] md:h-10 md:w-[240px]"
              : "h-10 w-[240px] md:h-12 md:w-[300px] lg:w-[340px]"
          )}>
            <Image
              src={logoSrc}
              alt={t("nav.brandName")}
              className="h-full w-full object-contain object-left drop-shadow-sm"
              fill
              priority
              sizes="(min-width: 1024px) 340px, (min-width: 768px) 300px, 240px"
            />
          </span>
        </Link>

        {/* ── Desktop Navigation ──────────────────────────── */}
        <nav
          className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
          aria-label={t("nav.mainMenu")}
        >
          {nav.map((item) => {
            const active = isItemActive(item);

            if (item.type === "link") {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "nav-link rounded-lg px-3.5 py-2 text-[13.5px] font-medium tracking-[-0.01em]",
                    active
                      ? "nav-link-active text-foreground bg-accent/50 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              );
            }

            return (
              <NavDropdown
                key={item.href}
                item={item}
                isActive={active}
                scrolled={scrolled}
              />
            );
          })}
        </nav>

        {/* ── Right Section ───────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-1.5 lg:gap-2">
          {/* Search hint (desktop only) */}
          <button
            className="nav-link hidden h-8 items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-3 text-[12px] text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground lg:flex"
            aria-label="Search (⌘K)"
            onClick={() => {
              /* Future: open command palette */
            }}
          >
            <Search className="size-3.5" />
            <span className="opacity-70">⌘K</span>
          </button>

          <LanguageSwitcher />
          <ThemeToggle />

          <div className="mx-1 hidden h-5 w-px bg-border/60 lg:block" aria-hidden="true" />

          {/* Auth link */}
          <Link href={isAuthenticated ? "/app/library" : "/login"} className="hidden lg:block">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 px-3.5 text-[13px] font-medium tracking-[-0.01em] transition-all duration-200",
                "hover:bg-accent/50"
              )}
            >
              {isAuthenticated ? t("nav.myBooks") : t("nav.login")}
            </Button>
          </Link>

          {/* Primary CTA */}
          <Link href={isAuthenticated ? "/app/new/topic" : "/start/topic"} className="hidden lg:block">
            <Button
              size="sm"
              className={cn(
                "header-cta-btn gap-2 px-5 text-[13px] font-semibold tracking-[-0.02em] shadow-md hover:shadow-lg transition-all duration-200",
                scrolled ? "h-8" : "h-9"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse" aria-hidden="true" />
              {isAuthenticated ? t("nav.newBook") : t("nav.freePreview")}
            </Button>
          </Link>

          {/* Mobile menu toggle */}
          <MobileNav isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </header>
  );
}

/* ── NavDropdown (per-item, standalone component) ──────────── */
function NavDropdown({
  item,
  isActive,
  scrolled,
}: {
  item: NavItem & { type: "dropdown" };
  isActive: boolean;
  scrolled: boolean;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* cleanup timers on unmount */
  useEffect(() => {
    return () => {
      clearTimeout(openTimerRef.current);
      clearTimeout(closeTimerRef.current);
    };
  }, []);

  /* close on route change */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const scheduleOpen = () => {
    if (closeTimerRef.current !== undefined) clearTimeout(closeTimerRef.current);
    openTimerRef.current = setTimeout(() => setOpen(true), DROPDOWN_OPEN_DELAY);
  };

  const scheduleClose = () => {
    if (openTimerRef.current !== undefined) clearTimeout(openTimerRef.current);
    closeTimerRef.current = setTimeout(() => setOpen(false), DROPDOWN_CLOSE_DELAY);
  };

  const cancelClose = () => {
    if (closeTimerRef.current !== undefined) clearTimeout(closeTimerRef.current);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      {/* Trigger */}
      <button
        type="button"
        className={cn(
          "nav-trigger nav-link flex items-center gap-1 rounded-lg px-3.5 py-2 text-[13.5px] font-medium tracking-[-0.01em] outline-none",
          isActive
            ? "nav-link-active text-foreground bg-accent/50 shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
        )}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((prev) => !prev)}
      >
        {t(item.labelKey)}
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Panel */}
      <div
        className={cn(
          "nav-dropdown absolute left-1/2 top-full z-50 pt-2",
          open ? "nav-dropdown--open" : "nav-dropdown--closed pointer-events-none"
        )}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <div
          className={cn(
            "rounded-2xl border border-border/60 bg-popover/98 shadow-xl backdrop-blur-2xl",
            "w-[280px] p-2",
            scrolled && "-mt-1"
          )}
        >
          {/* Arrow indicator */}
          <div className="absolute -top-[6px] left-1/2 -translate-x-1/2">
            <div className="size-3 rotate-45 border-l border-t border-border/60 bg-popover/98" />
          </div>

          {item.children.map((child) => {
            const childActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "nav-dropdown-item group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-150",
                  childActive
                    ? "bg-primary/8 text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {/* Icon */}
                {child.icon && (
                  <div
                    className={cn(
                      "nav-dropdown-icon mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-card/80 transition-all duration-150",
                      childActive && "bg-primary/12 border-primary/25 text-primary"
                    )}
                  >
                    {child.icon}
                  </div>
                )}
                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium leading-tight">
                    {t(child.labelKey)}
                    {childActive && (
                      <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" aria-hidden="true" />
                    )}
                  </div>
                  {child.descriptionKey && (
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
                      {t(child.descriptionKey)}
                    </p>
                  )}
                </div>
                {/* Arrow */}
                <ArrowRight
                  className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-primary/60"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
