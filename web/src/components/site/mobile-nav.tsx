"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const primaryNav = [
  { href: "/how-it-works", label: "Nasıl Çalışır" },
  { href: "/examples", label: "Örnekler" },
  { href: "/pricing", label: "Fiyatlar" },
  { href: "/faq", label: "SSS" },
  { href: "/blog", label: "Blog" },
];

const secondaryNav = [
  { href: "/resources", label: "Kaynaklar" },
  { href: "/compare", label: "Karşılaştır" },
  { href: "/use-cases", label: "Kullanım Alanları" },
];

export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
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

            <nav className="flex flex-col gap-0.5" aria-label="Mobil menü">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[14px] font-medium tracking-[-0.01em] text-muted-foreground transition-all duration-150 hover:bg-accent/70 hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 border-t border-border/60 pt-4">
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Daha Fazla
              </div>
              <nav className="flex flex-col gap-0.5" aria-label="Mobil yardımcı menü">
                {secondaryNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-[14px] font-medium tracking-[-0.01em] text-muted-foreground transition-all duration-150 hover:bg-accent/70 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full text-[13.5px] font-medium tracking-[-0.01em]">
                  Giriş Yap
                </Button>
              </Link>
              <Link href="/start/topic" onClick={() => setOpen(false)}>
                <Button className="site-cta-btn w-full gap-1.5 text-[13.5px] font-semibold tracking-[-0.01em]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Ücretsiz Önizleme
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
