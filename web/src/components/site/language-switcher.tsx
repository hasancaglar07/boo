"use client";

import * as React from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { locales, type AppLocale } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleChange = (nextLocale: AppLocale) => {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    const query = searchParams.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    router.replace(href, { locale: nextLocale });
    setOpen(false);
  };

  /* Close on outside click */
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* Close on Escape */
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={cn(
          "nav-link flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        )}
        aria-label={t("LocaleSwitcher.label")}
        title={t("LocaleSwitcher.title")}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Globe className="size-3.5" aria-hidden="true" />
        <span className="uppercase">{currentLocale}</span>
        <ChevronDown className={cn("size-3 transition-transform duration-150", open && "rotate-180")} aria-hidden="true" />
      </button>

      {/* Dropdown */}
      <div
        className={cn(
          "absolute right-0 top-full z-50 mt-1.5 min-w-[160px] overflow-hidden rounded-xl border border-border/60 bg-popover/98 shadow-lg backdrop-blur-xl transition-all duration-150",
          open
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-95 opacity-0 pointer-events-none"
        )}
        role="listbox"
        aria-label={t("LocaleSwitcher.label")}
      >
        {locales.map((locale) => {
          const isCurrent = locale === currentLocale;
          return (
            <button
              key={locale}
              role="option"
              aria-selected={isCurrent}
              onClick={() => handleChange(locale)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-[13px] font-medium transition-colors",
                isCurrent
                  ? "bg-primary/8 text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <span className="flex-1 text-left">{t(`localeNames.${locale}`)}</span>
              <span className="text-[11px] uppercase text-muted-foreground/60">{locale}</span>
              {isCurrent && <Check className="size-3.5 text-primary" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
