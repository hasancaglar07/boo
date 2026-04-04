"use client";

import Image from "next/image";
import Link from "next/link";

import { useTheme } from "@/components/theme-provider";
import { marketingToolCatalog } from "@/lib/marketing-tools";
import { KDP_GUARANTEE_CLAIM, KDP_LIVE_BOOKS_CLAIM, NO_API_COST_CLAIM } from "@/lib/site-claims";

export function SiteFooter() {
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === "dark" ? "/dark-logo.png" : "/logo.png";

  return (
    <footer className="border-t border-border/80 py-12">
      <div className="shell">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-[1.1fr_auto_auto_auto_auto_auto]">
          {/* Logo + Açıklama */}
          <div>
            <Link href="/" aria-label="Ana sayfaya git" className="inline-block transition-opacity duration-150 hover:opacity-80">
              <span className="relative block h-10 w-[220px] overflow-hidden md:h-11 md:w-[260px]">
                <Image
                  src={logoSrc}
                  alt="Kitap Oluşturucu"
                  className="h-full w-full object-contain object-left"
                  fill
                  sizes="(min-width: 768px) 260px, 220px"
                />
              </span>
            </Link>
            <p className="mt-2 max-w-xs text-sm text-pretty text-muted-foreground">
              İlk kitap üretimini daha anlaşılır hale getiren sade ve premium yazım arayüzü.
            </p>
            <div className="mt-4">
              <Link
                href="/start/topic"
                className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Ücretsiz önizlemeyi başlat
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {[KDP_LIVE_BOOKS_CLAIM, KDP_GUARANTEE_CLAIM, NO_API_COST_CLAIM].map((item) => (
                <span key={item} className="rounded-full border border-border/80 bg-card px-3 py-1">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Ürün Linkleri */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ürün</p>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/start/topic", label: "Ücretsiz Önizleme" },
                { href: "/how-it-works", label: "Nasıl çalışır" },
                { href: "/examples", label: "Örnekler" },
                { href: "/pricing", label: "Fiyatlar" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted-foreground transition hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Araçlar</p>
            <ul className="space-y-2 text-sm">
              {[{ path: "/tools", shortLabel: "Tüm Araçlar" }, ...marketingToolCatalog].map((item) => (
                <li key={item.path}>
                  <Link href={item.path} className="text-muted-foreground transition hover:text-foreground">
                    {item.shortLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Öğren</p>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/blog", label: "Blog" },
                { href: "/faq", label: "SSS" },
                { href: "/resources", label: "Kaynaklar" },
                { href: "/compare", label: "Karşılaştır" },
                { href: "/use-cases", label: "Kullanım Alanları" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted-foreground transition hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Şirket</p>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/about", label: "Hakkında" },
                { href: "/contact", label: "İletişim" },
                { href: "/affiliate", label: "Affiliate" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted-foreground transition hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Yasal</p>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/privacy", label: "Gizlilik" },
                { href: "/terms", label: "Şartlar" },
                { href: "/refund-policy", label: "İade Politikası" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted-foreground transition hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start gap-2 border-t border-border/80 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Kitap Oluşturucu. Tüm hakları saklıdır.</p>
          <p>Yapay zeka destekli kitap yazımı.</p>
        </div>
      </div>
    </footer>
  );
}
