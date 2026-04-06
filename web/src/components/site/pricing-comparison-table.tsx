"use client";

import * as React from "react";
import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Feature = {
  id: string;
  name: string;
  premium: boolean | string | number;
  starter: boolean | string | number;
  creator: boolean | string | number;
  pro: boolean | string | number;
};

const features: Feature[] = [
  // Production limits
  { id: "book-count",   name: "Monthly book production",            premium: 1,       starter: 10,      creator: 30,   pro: 80 },
  { id: "cover",          name: "Monthly cover allowance",              premium: 3,       starter: 20,      creator: 60,   pro: 200 },

  // Core production
  { id: "wizard",         name: "5-step guided wizard",     premium: true,    starter: true,    creator: true, pro: true },
  { id: "outline",        name: "AI chapter outline generation", premium: true,    starter: true,    creator: true, pro: true },
  { id: "bolum",          name: "Chapter writing + regeneration",  premium: true,    starter: true,    creator: true, pro: true },
  { id: "editor",         name: "Chapter editor",                  premium: true,    starter: true,    creator: true, pro: true },
  { id: "ton",            name: "Tone and target audience setting",        premium: true,    starter: true,    creator: true, pro: true },

  // Cover & design
  { id: "cover-ai",       name: "AI cover generation",       premium: true,    starter: true,    creator: true, pro: true },
  { id: "cover-style",    name: "Cover style selection (3 themes)",     premium: true,    starter: true,    creator: true, pro: true },
  { id: "cover-custom",   name: "Custom color palette",        premium: true,    starter: true,    creator: true, pro: true },

  // Output formats
  { id: "epub",           name: "EPUB output",                   premium: true,    starter: true,    creator: true, pro: true },
  { id: "pdf",            name: "PDF output — KDP-ready",     premium: true,    starter: true,    creator: true, pro: true },
  { id: "html",           name: "HTML output",                   premium: false,   starter: false,   creator: true, pro: true },
  { id: "markdown",       name: "Markdown output",               premium: false,   starter: false,   creator: true, pro: true },

  // Research & analysis
  { id: "arastirma",      name: "Research center",              premium: false,   starter: false,   creator: true, pro: true },
  { id: "keyword",        name: "KDP keyword analysis",     premium: false,   starter: false,   creator: true, pro: true },
  { id: "pazar",          name: "Market gap analysis",          premium: false,   starter: false,   creator: true, pro: true },

  // Language & series
  { id: "dil",            name: "Multilingual production",               premium: true,    starter: true,    creator: true, pro: true },
  { id: "seri",           name: "Batch / bulk production",            premium: false,   starter: false,   creator: false, pro: true },
  { id: "ton-profil",     name: "Custom tone profiles", premium: false,   starter: false,   creator: false, pro: true },

  // Platform
  { id: "workspace",      name: "Book workspace",            premium: false,   starter: true,    creator: true, pro: true },
  { id: "api-cost",       name: "No API cost to user",    premium: true,    starter: true,    creator: true, pro: true },
  { id: "api",            name: "API & automation access",       premium: false,   starter: false,   creator: false, pro: true },

  // Support
  { id: "support",         name: "Email support",                premium: true,    starter: true,    creator: true, pro: true },
  { id: "priority",        name: "Priority support",               premium: false,   starter: false,   creator: true, pro: true },
  { id: "onboarding",     name: "Dedicated onboarding support",         premium: false,   starter: false,   creator: false, pro: true },
];

const plans = [
  {
    id: "premium",
    name: "Single Book",
    price: 4,
    description: "1 book",
    popular: false,
    oneTime: true,
  },
  {
    id: "starter",
    name: "Starter",
    price: 19,
    description: "10 books / month",
    popular: false,
    oneTime: false,
  },
  {
    id: "creator",
    name: "Author",
    price: 39,
    description: "30 books / month",
    popular: true,
    oneTime: false,
  },
  {
    id: "pro",
    name: "Studio",
    price: 79,
    description: "80 books / month",
    popular: false,
    oneTime: false,
  },
];

export function PricingComparisonTable() {
  return (
    <section className="border-b border-border/80 py-20">
      <div className="shell">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Plan Comparison
            </h2>
            <p className="mt-2 text-muted-foreground">
              Which plan suits you best? Compare features side by side.
            </p>
          </div>
          <div className="rounded-full border border-border/80 bg-card/80 px-4 py-2 text-sm text-muted-foreground">
            All prices are for monthly billing
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-border/80">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/80">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Feature
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.id}
                    className={cn(
                      "px-6 py-4 text-center",
                      plan.popular && "bg-primary/5"
                    )}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-lg font-bold text-foreground">{plan.name}</span>
                      {plan.popular && (
                        <Badge className="text-xs">Most Popular</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {plan.oneTime
                        ? "$4 / one-time"
                        : `$${plan.price}/month`
                      }
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr
                  key={feature.id}
                  className={cn(
                    "border-b border-border/80 transition-colors hover:bg-muted/30",
                    index % 2 === 0 && "bg-muted/20"
                  )}
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-foreground">{feature.name}</span>
                  </td>
                  {plans.map((plan) => {
                    const value = feature[plan.id as keyof Feature];
                    const hasFeature = typeof value === "number" ? value > 0 : Boolean(value);
                    return (
                      <td
                        key={plan.id}
                        className={cn(
                          "px-6 py-4 text-center",
                          plan.popular && "bg-primary/5"
                        )}
                      >
                        {typeof value === "number" ? (
                          <span className="text-sm font-semibold text-foreground">{value}</span>
                        ) : hasFeature ? (
                          <Check className="mx-auto h-5 w-5 text-primary" />
                        ) : (
                          <X className="mx-auto h-5 w-5 text-muted-foreground/30" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}