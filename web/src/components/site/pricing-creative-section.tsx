"use client";

import { useState, useMemo } from "react";
import { Coins, BookOpen, Sparkles, Layers } from "lucide-react";

import {
  CreativePricing,
  type PricingTier,
} from "@/components/ui/creative-pricing";
import { plans, premiumPlan } from "@/lib/marketing-data";
import { cn } from "@/lib/utils";

export function PricingCreativeSection({
  tag,
  title,
  description,
  className,
}: {
  tag?: string;
  title?: string;
  description?: string;
  className?: string;
}) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const tiers = useMemo<PricingTier[]>(() => [
    {
      name: premiumPlan.name,
      icon: <Coins className="h-5 w-5" />,
      price: premiumPlan.price,
      interval: premiumPlan.interval,
      perUnit: null,
      description: premiumPlan.description,
      features: premiumPlan.features,
      popular: false,
      accentClassName: "text-foreground",
      ctaLabel: "$4 ile Kitabımı Çıkar",
      ctaHref: "/start/topic?plan=tek-kitap",
    },
    {
      name: plans[0].name,
      icon: <BookOpen className="h-5 w-5" />,
      price: plans[0].price,
      interval: plans[0].interval,
      annualPrice: billingCycle === "annual" ? plans[0].annualMonthlyPrice : undefined,
      annualInterval: "ay (yıllık faturalandı)",
      perUnit: plans[0].perUnit,
      description: plans[0].description,
      features: plans[0].features,
      popular: false,
      accentClassName: "text-foreground",
      ctaLabel: "Starter ile Başla",
      ctaHref: `/start/topic?plan=starter${billingCycle === "annual" ? "&billing=annual" : ""}`,
    },
    {
      name: plans[1].name,
      icon: <Sparkles className="h-5 w-5" />,
      price: plans[1].price,
      interval: plans[1].interval,
      annualPrice: billingCycle === "annual" ? plans[1].annualMonthlyPrice : undefined,
      annualInterval: "ay (yıllık faturalandı)",
      perUnit: plans[1].perUnit,
      decoyNote: plans[1].decoyNote,
      description: plans[1].description,
      features: plans[1].features,
      popular: true,
      accentClassName: "text-primary border-primary bg-primary/10",
      ctaLabel: "Yazar Planına Geç",
      ctaHref: `/start/topic?plan=creator${billingCycle === "annual" ? "&billing=annual" : ""}`,
    },
    {
      name: plans[2].name,
      icon: <Layers className="h-5 w-5" />,
      price: plans[2].price,
      interval: plans[2].interval,
      annualPrice: billingCycle === "annual" ? plans[2].annualMonthlyPrice : undefined,
      annualInterval: "ay (yıllık faturalandı)",
      perUnit: plans[2].perUnit,
      description: plans[2].description,
      features: plans[2].features,
      popular: false,
      accentClassName: "text-muted-foreground",
      ctaLabel: "Stüdyo'ya Geç",
      ctaHref: `/start/topic?plan=pro${billingCycle === "annual" ? "&billing=annual" : ""}`,
    },
  ], [billingCycle]);

  return (
    <section className={className}>
      <div className="shell">
        {/* Billing cycle toggle */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-3 rounded-full border border-border/80 bg-card/80 p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Aylık
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                billingCycle === "annual"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yıllık
            </button>
          </div>
          {billingCycle === "annual" && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              %20 tasarruf — 2 ay bedava
            </span>
          )}
        </div>

        <CreativePricing
          tag={tag}
          title={title}
          description={description}
          tiers={tiers}
          billingCycle={billingCycle}
        />
      </div>
    </section>
  );
}
