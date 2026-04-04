"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/site/mobile-nav";
import { Button } from "@/components/ui/button";
import { getSession, syncPreviewAuthState } from "@/lib/preview-auth";
import { cn } from "@/lib/utils";

/* ─── Nav structure ──────────────────────────────────────── */

type NavItem = { type: "link"; href: string; label: string };

const nav: NavItem[] = [
  { type: "link", href: "/how-it-works", label: "Nasıl Çalışır" },
  { type: "link", href: "/examples", label: "Örnekler" },
  { type: "link", href: "/pricing", label: "Fiyatlar" },
  { type: "link", href: "/tools", label: "Araçlar" },
  { type: "link", href: "/faq", label: "SSS" },
];

/* ─── Main header ────────────────────────────────────────── */

export function SiteHeader() {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const logoSrc = resolvedTheme === "dark" ? "/dark-logo.png" : "/logo.png";
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getSession()));

  useEffect(() => {
    let active = true;

    void syncPreviewAuthState().then((payload) => {
      if (!active) return;
      setIsAuthenticated(Boolean(payload?.authenticated || getSession()));
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="site-header sticky top-0 z-50">
      {/* Top gradient accent line */}
      <div className="site-header-accent" aria-hidden="true" />

      <div className="shell flex h-[68px] items-center justify-between gap-8">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="flex shrink-0 items-center transition-opacity duration-150 hover:opacity-85"
          aria-label="Ana sayfaya git"
        >
          <span className="relative block h-10 w-[250px] overflow-hidden md:h-12 md:w-[320px] lg:w-[360px]">
            <Image
              src={logoSrc}
              alt="Kitap Oluşturucu"
              className="h-full w-full object-contain object-left"
              fill
              priority
              sizes="(min-width: 1024px) 360px, (min-width: 768px) 320px, 250px"
            />
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav
          className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
          aria-label="Ana menü"
        >
          {nav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-2 text-[13.5px] font-medium tracking-[-0.01em] transition-colors duration-150",
                  isActive
                    ? "text-foreground after:absolute after:inset-x-3 after:bottom-1 after:h-[1.5px] after:rounded-full after:bg-primary/70 after:content-['']"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ── Actions ── */}
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />

          <div className="mx-2 hidden h-4 w-px bg-border/80 lg:block" aria-hidden="true" />

          <Link href={isAuthenticated ? "/app/library" : "/login"} className="hidden lg:block">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3.5 text-[13px] font-medium tracking-[-0.01em]"
            >
              {isAuthenticated ? "Kitaplarım" : "Giriş Yap"}
            </Button>
          </Link>

          <Link href={isAuthenticated ? "/app/new/topic" : "/start/topic"} className="hidden lg:block">
            <Button
              size="sm"
              className="header-cta-btn h-9 gap-1.5 px-4 text-[13px] font-semibold tracking-[-0.02em]"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {isAuthenticated ? "Yeni Kitap" : "Ücretsiz Preview"}
            </Button>
          </Link>

          <MobileNav isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </header>
  );
}
