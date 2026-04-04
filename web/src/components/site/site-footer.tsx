"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Mail,
  Heart,
  ExternalLink,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  KDP_GUARANTEE_CLAIM,
  NO_API_COST_CLAIM,
  REFUND_GUARANTEE_CLAIM,
} from "@/lib/site-claims";

/* ─── Data ───────────────────────────────────────────────── */

const productLinks = [
  { href: "/start/topic", label: "Ücretsiz Önizleme", highlight: true },
  { href: "/how-it-works", label: "Nasıl Çalışır" },
  { href: "/examples", label: "Örnekler" },
  { href: "/pricing", label: "Fiyatlar" },
  { href: "/compare", label: "Karşılaştır" },
];

const resourceLinks = [
  { href: "/tools", label: "Ücretsiz Araçlar" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "SSS" },
  { href: "/resources", label: "Kaynaklar" },
  { href: "/use-cases", label: "Kullanım Senaryoları" },
];

const companyLinks = [
  { href: "/about", label: "Hakkında" },
  { href: "/contact", label: "İletişim" },
  { href: "/affiliate", label: "Affiliate Programı" },
];

const legalLinks = [
  { href: "/privacy", label: "Gizlilik Politikası" },
  { href: "/terms", label: "Kullanım Şartları" },
  { href: "/refund-policy", label: "İade Politikası" },
];

const trustBadges = [
  { icon: Sparkles, text: "Ücretsiz Preview" },
  { icon: BookOpen, text: KDP_GUARANTEE_CLAIM },
  { icon: Heart, text: REFUND_GUARANTEE_CLAIM },
  { icon: Mail, text: NO_API_COST_CLAIM },
];

/* ─── Newsletter Form ────────────────────────────────────── */

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: integrate with real newsletter endpoint
    setStatus("success");
    setEmail("");
    setTimeout(() => setStatus("idle"), 4000);
  };

  return (
    <div className="footer-newsletter">
      <p className="text-sm font-semibold text-foreground">
        Yazım ipuçları ve kampanyalar
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Haftalık bültenimize katıl, ilk kitabını daha hızlı yaz.
      </p>
      <form onSubmit={handleSubmit} className="footer-newsletter-form">
        <div className="footer-newsletter-input-wrap">
          <Mail className="footer-newsletter-icon" aria-hidden="true" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta adresin"
            required
            className="footer-newsletter-input"
            aria-label="E-posta adresi"
          />
        </div>
        <button type="submit" className="footer-newsletter-btn" disabled={status === "success"}>
          {status === "success" ? (
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Katıldın!
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              Abone Ol
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </button>
      </form>
    </div>
  );
}

/* ─── Footer Link Group ──────────────────────────────────── */

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; highlight?: boolean }[];
}) {
  return (
    <div>
      <p className="footer-col-title">{title}</p>
      <ul className="space-y-2.5">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="footer-link group"
            >
              <span className={item.highlight ? "text-primary font-medium" : ""}>
                {item.label}
              </span>
              {item.highlight && (
                <ArrowRight className="footer-link-arrow" aria-hidden="true" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Main Footer ────────────────────────────────────────── */

export function SiteFooter() {
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === "dark" ? "/dark-logo.png" : "/logo.png";

  return (
    <footer className="site-footer">
      {/* Top gradient accent line */}
      <div className="footer-accent-line" aria-hidden="true" />

      {/* ── CTA Band ── */}
      <div className="footer-cta-band">
        <div className="shell">
          <div className="footer-cta-inner">
            <div className="footer-cta-copy">
              <h3 className="footer-cta-title">
                Kitabını <em>bugün</em> yazmaya başla
              </h3>
              <p className="footer-cta-sub">
                Ücretsiz preview ile ilk kitabını dakikalar içinde oluştur.
              </p>
            </div>
            <Link href="/start/topic" className="footer-cta-btn">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Ücretsiz Önizleme Başlat
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Footer Content ── */}
      <div className="footer-main">
        <div className="shell">
          <div className="footer-grid">
            {/* Col 1: Logo + Description + Trust + Newsletter */}
            <div className="footer-brand-col">
              {/* Logo */}
              <Link
                href="/"
                aria-label="Ana sayfaya git"
                className="footer-logo-link"
              >
                <span className="relative block h-10 w-[200px] overflow-hidden md:h-11 md:w-[240px]">
                  <Image
                    src={logoSrc}
                    alt="Kitap Oluşturucu"
                    className="h-full w-full object-contain object-left"
                    fill
                    sizes="(min-width: 768px) 240px, 200px"
                  />
                </span>
              </Link>

              {/* Description */}
              <p className="footer-brand-desc">
                Yapay zeka destekli, sade ve premium kitap yazım arayüzü.
                İlk kitabını profesyonel standartlarda oluştur.
              </p>

              {/* Trust Badges */}
              <div className="footer-trust-badges">
                {trustBadges.map((badge) => (
                  <span key={badge.text} className="footer-trust-badge">
                    <badge.icon className="h-3 w-3 shrink-0 text-primary/70" aria-hidden="true" />
                    <span>{badge.text}</span>
                  </span>
                ))}
              </div>

              {/* Newsletter */}
              <NewsletterForm />
            </div>

            {/* Col 2: Product */}
            <FooterLinkGroup title="Ürün" links={productLinks} />

            {/* Col 3: Resources */}
            <FooterLinkGroup title="Kaynaklar" links={resourceLinks} />

            {/* Col 4: Company + Legal */}
            <div className="space-y-6">
              <FooterLinkGroup title="Şirket" links={companyLinks} />
              <FooterLinkGroup title="Yasal" links={legalLinks} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="footer-bottom">
        <div className="shell">
          <div className="footer-bottom-inner">
            {/* Left: Copyright */}
            <div className="footer-bottom-left">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Kitap Oluşturucu. Tüm hakları saklıdır.
              </p>
              <p className="footer-bottom-tagline">
                Yapay zeka destekli kitap yazımı.
              </p>
            </div>

            {/* Right: Theme Toggle */}
            <div className="footer-bottom-right">
              <span className="footer-bottom-label">Tema</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
