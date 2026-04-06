"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, Sparkles, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLang } from "@/components/lang-provider";

const primaryNavKeys = [
  { href: "/how-it-works", labelKey: "nav.howItWorks" },
  { href: "/examples", labelKey: "nav.examples" },
  { href: "/pricing", labelKey: "nav.pricing" },
  { href: "/compare", labelKey: "footer.compare" },
  { href: "/faq", labelKey: "nav.faq" },
];

const secondaryNavKeys = [
  { href: "/tools", labelKey: "nav.tools" },
  { href: "/resources", labelKey: "footer.resources" },
  { href: "/blog", labelKey: "footer.blog" },
  { href: "/use-cases", labelKey: "footer.useCases" },
];

/* ─── Language Toggle for Mobile ─────────────────────────────── */

function MobileLangToggle() {
  const { lang, setLang } = useLang();
  const next = lang === "en" ? "tr" : "en";

  return (
    <button
      onClick={() => setLang(next)}
      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[14px] font-medium text-muted-foreground transition-all duration-150 hover:bg-accent/70 hover:text-foreground"
      aria-label={lang === "en" ? "Switch to Turkish" : "Türkçe'ye geç"}
    >
      <Globe className="h-4 w-4" aria-hidden="true" />
      {lang === "en" ? "Türkçe" : "English"}
    </button>
  );
}

export function MobileNav({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const { t } = useLang();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-card/60 text-muted-foreground backdrop-blur-sm transition-all duration-150 hover:border-border hover:bg-accent/80 hover:text-foreground active:scale-95 lg:hidden"
        onClick={() => setOpen((v) => !v)}
      >
        {open
          ? <X className="h-[15px] w-[15px]" />
          : <Menu className="h-[15px] w-[15px]" />
        }
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="fixed inset-x-0 top-[69px] z-50 border-b border-border/60 bg-background/95 px-4 pb-6 pt-3 shadow-xl backdrop-blur-2xl lg:hidden">
            {/* Top accent */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--primary) 50%, transparent) 50%, transparent 100%)",
              }}
              aria-hidden="true"
            />

            <nav className="flex flex-col gap-0.5" aria-label="Mobile menu">
              {primaryNavKeys.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[14px] font-medium tracking-[-0.01em] text-muted-foreground transition-all duration-150 hover:bg-accent/70 hover:text-foreground"
                >
                  {t(item.labelKey)}
                </Link>
              ))}
            </nav>

            <div className="mt-4 border-t border-border/60 pt-4">
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                More
              </div>
              <nav className="flex flex-col gap-0.5" aria-label="Mobile secondary menu">
                {secondaryNavKeys.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-[14px] font-medium tracking-[-0.01em] text-muted-foreground transition-all duration-150 hover:bg-accent/70 hover:text-foreground"
                  >
                    {t(item.labelKey)}
                  </Link>
                ))}
                <MobileLangToggle />
              </nav>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
              <Link href={isAuthenticated ? "/app/library" : "/login"} onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full text-[13.5px] font-medium tracking-[-0.01em]">
                  {isAuthenticated ? t("nav.myBooks") : t("nav.login")}
                </Button>
              </Link>
              <Link href={isAuthenticated ? "/app/new/topic" : "/start/topic"} onClick={() => setOpen(false)}>
                <Button className="site-cta-btn w-full gap-1.5 text-[13.5px] font-semibold tracking-[-0.01em]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {isAuthenticated ? t("nav.newBook") : t("nav.freePreview")}
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
