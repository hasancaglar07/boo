"use client";

import Image from "next/image";
import Link from "next/link";

import { useTheme } from "@/components/theme-provider";

export function SiteFooter() {
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === "dark" ? "/dark-logo.png" : "/logo.png";

  return (
    <footer className="border-t border-border/80 py-12">
      <div className="shell">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-[1.1fr_auto_auto_auto_auto]">
          {/* Logo + Açıklama */}
          <div>
            <div className="relative block h-16 w-[320px] max-w-full overflow-hidden sm:h-20 sm:w-[400px]">
              <Image
                src={logoSrc}
                alt="Book Generator"
                className="h-full w-full object-contain object-center"
                fill
                sizes="(min-width: 640px) 400px, 320px"
              />
            </div>
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
            <div className="mt-4 flex items-center gap-3">
              {/* Sosyal medya linkleri hazır olduğunda buraya ekle */}
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
          <p>© 2026 Book Generator. Tüm hakları saklıdır.</p>
          <p>Türkiye&apos;de tasarlandı 🇹🇷</p>
        </div>
      </div>
    </footer>
  );
}
