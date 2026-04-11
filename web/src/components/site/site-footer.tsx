"use client";

import Image from "next/image";
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Mail,
  Heart,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

/* ─── Data ───────────────────────────────────────────────── */

const productLinkKeys = [
  { href: "/start/topic", labelKey: "footer.freePreview", highlight: true },
  { href: "/how-it-works", labelKey: "nav.howItWorks" },
  { href: "/examples", labelKey: "nav.examples" },
  { href: "/pricing", labelKey: "nav.pricing" },
  { href: "/compare", labelKey: "footer.compare" },
];

const resourceLinkKeys = [
  { href: "/tools", labelKey: "footer.freeTools" },
  { href: "/blog", labelKey: "footer.blog" },
  { href: "/faq", labelKey: "nav.faq" },
  { href: "/resources", labelKey: "footer.resources" },
  { href: "/use-cases", labelKey: "footer.useCases" },
];

const companyLinkKeys = [
  { href: "/about", labelKey: "footer.about" },
  { href: "/contact", labelKey: "footer.contact" },
  { href: "/affiliate", labelKey: "footer.affiliate" },
];

const legalLinkKeys = [
  { href: "/privacy", labelKey: "footer.privacy" },
  { href: "/terms", labelKey: "footer.terms" },
  { href: "/refund-policy", labelKey: "footer.refund" },
];

/* ─── Newsletter Form ────────────────────────────────────── */

function NewsletterForm() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("success");
    setEmail("");
    setTimeout(() => setStatus("idle"), 4000);
  };

  return (
    <div className="footer-newsletter">
      <p className="text-sm font-semibold text-foreground">
        {t("footer.writingTips")}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("footer.newsletterDesc")}
      </p>
      <form onSubmit={handleSubmit} className="footer-newsletter-form">
        <div className="footer-newsletter-input-wrap">
          <Mail className="footer-newsletter-icon" aria-hidden="true" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("footer.emailPlaceholder")}
            required
            className="footer-newsletter-input"
            aria-label={t("footer.emailLabel")}
          />
        </div>
        <button type="submit" className="footer-newsletter-btn" disabled={status === "success"}>
          {status === "success" ? (
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {t("footer.subscribed")}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              {t("footer.subscribe")}
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
  titleKey,
  links,
}: {
  titleKey: string;
  links: { href: string; labelKey: string; highlight?: boolean }[];
}) {
  const t = useTranslations();

  return (
    <div>
      <p className="footer-col-title">{t(titleKey)}</p>
      <ul className="space-y-2.5">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="footer-link group"
            >
              <span className={item.highlight ? "text-primary font-medium" : ""}>
                {t(item.labelKey)}
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
  const t = useTranslations();
  const logoSrc = resolvedTheme === "dark" ? "/dark-logo.png" : "/logo.png";

  const trustBadges = [
    { icon: Sparkles, text: t("footer.freePreview") },
    { icon: BookOpen, text: t("footer.trust.kdp") },
    { icon: Heart, text: t("footer.trust.refund") },
    { icon: Mail, text: t("footer.trust.noApiCost") },
  ];

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
                {t.rich("footer.ctaTitle", {
                  em: (chunks) => <em>{chunks}</em>,
                })}
              </h3>
              <p className="footer-cta-sub">
                {t("footer.ctaSub")}
              </p>
            </div>
            <Link href="/start/topic" className="footer-cta-btn">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t("footer.ctaBtn")}
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
                aria-label={t("footer.goHome")}
                className="footer-logo-link"
              >
                <span className="relative block h-10 w-[200px] overflow-hidden md:h-11 md:w-[240px]">
                  <Image
                    src={logoSrc}
                    alt={t("nav.brandName")}
                    className="h-full w-full object-contain object-left"
                    fill
                    sizes="(min-width: 768px) 240px, 200px"
                  />
                </span>
              </Link>

              {/* Description */}
              <p className="footer-brand-desc">
                {t("footer.brandDesc")}
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
            <FooterLinkGroup titleKey="footer.product" links={productLinkKeys} />

            {/* Col 3: Resources */}
            <FooterLinkGroup titleKey="footer.resources" links={resourceLinkKeys} />

            {/* Col 4: Company + Legal */}
            <div className="space-y-6">
              <FooterLinkGroup titleKey="footer.company" links={companyLinkKeys} />
              <FooterLinkGroup titleKey="footer.legal" links={legalLinkKeys} />
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
                © {new Date().getFullYear()} {t("footer.copyright")}
              </p>
              <p className="footer-bottom-tagline">
                {t("footer.tagline")}
              </p>
            </div>

            {/* Right: Theme Toggle */}
            <div className="footer-bottom-right">
              <span className="footer-bottom-label">{t("footer.theme")}</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
