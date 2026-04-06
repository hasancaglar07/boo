"use client";

import { useMemo } from "react";
import { Coins, BookOpen, Sparkles, Layers } from "lucide-react";

import {
  CreativePricing,
  type PricingTier,
} from "@/components/ui/creative-pricing";
import { plans, premiumPlan } from "@/lib/marketing-data";

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
      ctaLabel: "Unlock This Book for $4",
      ctaHref: "/start/topic?plan=single-book",
    },
    {
      name: plans[0].name,
      icon: <BookOpen className="h-5 w-5" />,
      price: plans[0].price,
      interval: plans[0].interval,
      perUnit: plans[0].perUnit,
      description: plans[0].description,
      features: plans[0].features,
      popular: false,
      accentClassName: "text-foreground",
      ctaLabel: "Start with Starter Plan",
      ctaHref: "/billing?plan=starter&autostart=1",
    },
    {
      name: plans[1].name,
      icon: <Sparkles className="h-5 w-5" />,
      price: plans[1].price,
      interval: plans[1].interval,
      perUnit: plans[1].perUnit,
      decoyNote: plans[1].decoyNote,
      description: plans[1].description,
      features: plans[1].features,
      popular: true,
      accentClassName: "text-primary border-primary bg-primary/10",
      ctaLabel: "Best Value Plan: Author",
      ctaHref: "/billing?plan=creator&autostart=1",
    },
    {
      name: plans[2].name,
      icon: <Layers className="h-5 w-5" />,
      price: plans[2].price,
      interval: plans[2].interval,
      perUnit: plans[2].perUnit,
      description: plans[2].description,
      features: plans[2].features,
      popular: false,
      accentClassName: "text-muted-foreground",
      ctaLabel: "Go to Studio",
      ctaHref: "/billing?plan=pro&autostart=1",
    },
  ], []);

  return (
    <section className={className}>
      <div className="shell">
        <CreativePricing
          tag={tag}
          title={title}
          description={description}
          tiers={tiers}
        />
      </div>
    </section>
  );
}