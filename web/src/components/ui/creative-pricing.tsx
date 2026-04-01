"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export interface PricingTier {
  name: string;
  icon: ReactNode;
  price: string;
  interval?: string;
  perUnit?: string | null;
  annualPrice?: string;
  annualInterval?: string;
  decoyNote?: string;
  description: string;
  features: readonly string[];
  popular?: boolean;
  accentClassName: string;
  ctaLabel?: string;
  ctaHref?: string;
}

function CreativePricing({
  tag = "Basit fiyatlar",
  title = "İlk kitabın için doğru planı seç",
  description = "Küçük başla, üretim arttıkça yükselt. Her planın amacı ve sınırı net.",
  tiers,
  billingCycle = "monthly",
}: {
  tag?: string;
  title?: string;
  description?: string;
  tiers: PricingTier[];
  billingCycle?: "monthly" | "annual";
}) {
  return (
    <div className="relative mx-auto w-full max-w-6xl px-4">
      <div className="mb-16 text-center">
        <div className="font-serif text-lg italic tracking-wide text-primary">
          {tag}
        </div>

        <div className="relative mx-auto mt-4 max-w-4xl">
          <h2 className="text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {title}
          </h2>
          <div className="absolute -left-2 bottom-0 hidden -rotate-6 text-xl text-primary/80 md:block">
            ✦
          </div>
          <div className="absolute -right-2 top-0 hidden rotate-6 text-xl text-primary/80 md:block">
            ✧
          </div>
          <div className="absolute -bottom-4 left-1/2 h-3 w-44 -translate-x-1/2 rounded-full bg-primary/15 blur-sm" />
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-8 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {tiers.map((tier, index) => (
          <div
            key={tier.name}
            className={cn(
              "relative transition-all duration-300",
              index === 0 && "md:rotate-[-1deg]",
              index === 1 && "md:rotate-[1deg]",
              index === 2 && "md:rotate-[-2deg]",
              index === 3 && "md:rotate-[1.5deg]",
            )}
          >
            <div className="absolute inset-0 rounded-[26px] border-2 border-foreground/90 bg-card shadow-[4px_4px_0px_0px] shadow-foreground/85" />

            <div className="group relative rounded-[26px] p-6 md:p-7">
              {tier.popular ? (
                <div className="absolute -right-2 -top-2 rotate-6 rounded-full border-2 border-foreground bg-primary px-3 py-1 text-xs font-semibold tracking-wide text-primary-foreground shadow-sm">
                  En çok seçilen
                </div>
              ) : null}

              <div className="mb-6">
                <div
                  className={cn(
                    "mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-foreground bg-background",
                    tier.accentClassName,
                  )}
                >
                  {tier.icon}
                </div>

                <h3 className="font-serif text-2xl font-semibold text-foreground">
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {tier.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  {billingCycle === "annual" && tier.annualPrice ? tier.annualPrice : tier.price}
                </span>
                <span className="ml-1 text-sm text-muted-foreground">
                  /{billingCycle === "annual" && tier.annualInterval ? tier.annualInterval : (tier.interval ?? "ay")}
                </span>
                {tier.perUnit ? (
                  <p className="mt-1 text-xs text-muted-foreground/70">{tier.perUnit}</p>
                ) : null}
                {tier.decoyNote ? (
                  <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {tier.decoyNote}
                  </span>
                ) : null}
              </div>

              {/* Özellikleri karar anında hızlı taranabilir tutuyoruz. */}
              <div className="mb-7 space-y-3">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-foreground bg-background">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm leading-6 text-foreground">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                asChild
                className={cn(
                  "h-12 w-full rounded-xl border-2 border-foreground text-sm font-semibold shadow-[4px_4px_0px_0px] shadow-foreground/85 transition-all duration-300",
                  "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px]",
                  tier.popular
                    ? "bg-primary text-primary-foreground hover:opacity-95"
                    : "bg-background text-foreground hover:bg-accent",
                )}
              >
                <Link
                  href={tier.ctaHref || "/start"}
                  onClick={() =>
                    trackEvent("pricing_cta_click", {
                      plan: tier.name.toLowerCase(),
                      href: tier.ctaHref || "/start",
                    })
                  }
                >
                  {tier.ctaLabel || "Planı seç"}
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-8 top-24 hidden -rotate-12 text-3xl text-primary/35 lg:block">
          ✎
        </div>
        <div className="absolute bottom-24 right-8 hidden rotate-12 text-3xl text-primary/35 lg:block">
          ✦
        </div>
      </div>
    </div>
  );
}

export { CreativePricing };
