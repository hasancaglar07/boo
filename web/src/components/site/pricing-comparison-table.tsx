"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

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

const featureRows: Omit<Feature, "name">[] = [
  // Production limits
  { id: "book-count",   premium: 1,       starter: 10,      creator: 30,   pro: 80 },
  { id: "cover",        premium: 3,       starter: 20,      creator: 60,   pro: 200 },

  // Core production
  { id: "wizard",       premium: true,    starter: true,    creator: true, pro: true },
  { id: "outline",      premium: true,    starter: true,    creator: true, pro: true },
  { id: "bolum",        premium: true,    starter: true,    creator: true, pro: true },
  { id: "editor",       premium: true,    starter: true,    creator: true, pro: true },
  { id: "ton",          premium: true,    starter: true,    creator: true, pro: true },

  // Cover & design
  { id: "cover-ai",     premium: true,    starter: true,    creator: true, pro: true },
  { id: "cover-style",  premium: true,    starter: true,    creator: true, pro: true },
  { id: "cover-custom", premium: true,    starter: true,    creator: true, pro: true },

  // Output formats
  { id: "epub",         premium: true,    starter: true,    creator: true, pro: true },
  { id: "pdf",          premium: true,    starter: true,    creator: true, pro: true },
  { id: "html",         premium: false,   starter: false,   creator: true, pro: true },
  { id: "markdown",     premium: false,   starter: false,   creator: true, pro: true },

  // Research & analysis
  { id: "arastirma",    premium: false,   starter: false,   creator: true, pro: true },
  { id: "keyword",      premium: false,   starter: false,   creator: true, pro: true },
  { id: "pazar",        premium: false,   starter: false,   creator: true, pro: true },

  // Language & series
  { id: "dil",          premium: true,    starter: true,    creator: true, pro: true },
  { id: "seri",         premium: false,   starter: false,   creator: false, pro: true },
  { id: "ton-profil",   premium: false,   starter: false,   creator: false, pro: true },

  // Platform
  { id: "workspace",    premium: false,   starter: true,    creator: true, pro: true },
  { id: "api-cost",     premium: true,    starter: true,    creator: true, pro: true },
  { id: "api",          premium: false,   starter: false,   creator: false, pro: true },

  // Support
  { id: "support",      premium: true,    starter: true,    creator: true, pro: true },
  { id: "priority",     premium: false,   starter: false,   creator: true, pro: true },
  { id: "onboarding",   premium: false,   starter: false,   creator: false, pro: true },
];

const planDefs = [
  { id: "premium",  nameKey: "planSingleBook", descKey: "planDesc1Book",   price: 4,  popular: false, oneTime: true  },
  { id: "starter",  nameKey: "planStarter",    descKey: "planDesc10Books", price: 19, popular: false, oneTime: false },
  { id: "creator",  nameKey: "planAuthor",     descKey: "planDesc30Books", price: 39, popular: true,  oneTime: false },
  { id: "pro",      nameKey: "planStudio",     descKey: "planDesc80Books", price: 79, popular: false, oneTime: false },
];

const featureNameKey: Record<string, string> = {
  "book-count":   "featureMonthlyBooks",
  "cover":        "featureMonthlyCover",
  "wizard":       "featureWizard",
  "outline":      "featureOutline",
  "bolum":        "featureChapterWriting",
  "editor":       "featureEditor",
  "ton":          "featureTone",
  "cover-ai":     "featureCoverAi",
  "cover-style":  "featureCoverStyle",
  "cover-custom": "featureCoverCustom",
  "epub":         "featureEpub",
  "pdf":          "featurePdf",
  "html":         "featureHtml",
  "markdown":     "featureMarkdown",
  "arastirma":    "featureResearch",
  "keyword":      "featureKeyword",
  "pazar":        "featureMarket",
  "dil":          "featureMultilingual",
  "seri":         "featureBatch",
  "ton-profil":   "featureCustomTone",
  "workspace":    "featureWorkspace",
  "api-cost":     "featureNoApiCost",
  "api":          "featureApi",
  "support":      "featureEmailSupport",
  "priority":     "featurePriority",
  "onboarding":   "featureOnboarding",
};

export function PricingComparisonTable() {
  const t = useTranslations("PricingComparisonTable");

  const plans = planDefs.map((p) => ({
    ...p,
    name: t(p.nameKey as Parameters<typeof t>[0]),
    description: t(p.descKey as Parameters<typeof t>[0]),
  }));

  const features: Feature[] = featureRows.map((row) => ({
    ...row,
    name: t(featureNameKey[row.id] as Parameters<typeof t>[0]),
  }));

  return (
    <section className="border-b border-border/80 py-20">
      <div className="shell">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              {t("title")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("description")}
            </p>
          </div>
          <div className="rounded-full border border-border/80 bg-card/80 px-4 py-2 text-sm text-muted-foreground">
            {t("billingNote")}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-border/80">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/80">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  {t("featureColumnHeader")}
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
                        <Badge className="text-xs">{t("mostPopular")}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {plan.oneTime
                        ? t("oneTimePrice")
                        : t("monthlyPrice", { price: plan.price })
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