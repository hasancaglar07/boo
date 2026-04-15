"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Sparkles, BookOpen, CreditCard, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { trackEvent } from "@/lib/analytics";

export function StartOptionCards() {
  const t = useTranslations("StartOptionCards");
  useEffect(() => {
    trackEvent("start_page_viewed");
  }, []);

  const OPTIONS = [
    {
      key: "start_wizard",
      href: "/start/topic",
      icon: Sparkles,
      label: t("wizardLabel"),
      description: t("wizardDescription"),
      cta: t("wizardCta"),
      highlight: true,
    },
    {
      key: "view_examples",
      href: "/examples",
      icon: BookOpen,
      label: t("examplesLabel"),
      description: t("examplesDescription"),
      cta: t("examplesCta"),
      highlight: false,
    },
    {
      key: "view_pricing",
      href: "/pricing",
      icon: CreditCard,
      label: t("pricingLabel"),
      description: t("pricingDescription"),
      cta: t("pricingCta"),
      highlight: false,
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
      {OPTIONS.map(({ key, href, icon: Icon, label, description, cta, highlight }) => (
        <Link
          key={key}
          href={href}
          onClick={() => trackEvent("start_option_clicked", { option: key })}
          className={[
            "group flex flex-col rounded-xl border p-6 transition-all duration-200",
            "hover:shadow-md hover:-translate-y-0.5",
            highlight
              ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
              : "border-border bg-card text-card-foreground hover:border-primary/40",
          ].join(" ")}
        >
          <Icon
            className={[
              "h-6 w-6 mb-4",
              highlight ? "text-primary-foreground" : "text-primary",
            ].join(" ")}
          />
          <h2
            className={[
              "font-semibold text-base mb-2",
              highlight ? "text-primary-foreground" : "text-foreground",
            ].join(" ")}
          >
            {label}
          </h2>
          <p
            className={[
              "text-sm leading-relaxed mb-5 flex-1",
              highlight ? "text-primary-foreground/80" : "text-muted-foreground",
            ].join(" ")}
          >
            {description}
          </p>
          <span
            className={[
              "inline-flex items-center gap-1 text-sm font-medium transition-colors",
              highlight
                ? "text-primary-foreground"
                : "text-primary group-hover:gap-2",
            ].join(" ")}
          >
            {cta} <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      ))}
    </div>
  );
}
