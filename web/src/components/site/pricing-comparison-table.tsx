"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, X, Coins } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
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
  // Üretim limitleri
  { id: "kitap-sayisi",   name: "Aylık kitap üretimi",            premium: 1,       starter: 10,      creator: 30,   pro: 80 },
  { id: "kapak",          name: "Aylık kapak hakkı",              premium: 3,       starter: 20,      creator: 60,   pro: 200 },

  // Temel üretim
  { id: "wizard",         name: "5 adımlı yönlendirmeli sihirbaz", premium: true,    starter: true,    creator: true, pro: true },
  { id: "outline",        name: "Yapay zeka bölüm planı üretimi", premium: true,    starter: true,    creator: true, pro: true },
  { id: "bolum",          name: "Bölüm yazımı + yeniden üretim",  premium: true,    starter: true,    creator: true, pro: true },
  { id: "editor",         name: "Bölüm editörü",                  premium: true,    starter: true,    creator: true, pro: true },
  { id: "ton",            name: "Ton ve hedef kitle ayarı",        premium: true,    starter: true,    creator: true, pro: true },

  // Kapak & tasarım
  { id: "cover-ai",       name: "Yapay zeka kapak üretimi",       premium: true,    starter: true,    creator: true, pro: true },
  { id: "cover-style",    name: "Kapak stili seçimi (3 tema)",     premium: true,    starter: true,    creator: true, pro: true },
  { id: "cover-custom",   name: "Renk paleti özelleştirme",        premium: true,    starter: true,    creator: true, pro: true },

  // Çıktı formatları
  { id: "epub",           name: "EPUB çıktısı",                   premium: true,    starter: true,    creator: true, pro: true },
  { id: "pdf",            name: "PDF çıktısı — KDP'ye hazır",     premium: true,    starter: true,    creator: true, pro: true },
  { id: "html",           name: "HTML çıktısı",                   premium: false,   starter: false,   creator: true, pro: true },
  { id: "markdown",       name: "Markdown çıktısı",               premium: false,   starter: false,   creator: true, pro: true },

  // Araştırma & analiz
  { id: "arastirma",      name: "Araştırma merkezi",              premium: false,   starter: false,   creator: true, pro: true },
  { id: "keyword",        name: "KDP anahtar kelime analizi",     premium: false,   starter: false,   creator: true, pro: true },
  { id: "pazar",          name: "Pazar boşluğu analizi",          premium: false,   starter: false,   creator: true, pro: true },

  // Dil & dizi
  { id: "dil",            name: "Çok dilli üretim",               premium: true,    starter: true,    creator: true, pro: true },
  { id: "seri",           name: "Seri / toplu üretim",            premium: false,   starter: false,   creator: false, pro: true },
  { id: "ton-profil",     name: "Özelleştirilmiş ton profilleri", premium: false,   starter: false,   creator: false, pro: true },

  // Platform
  { id: "workspace",      name: "Kitap çalışma alanı",            premium: false,   starter: true,    creator: true, pro: true },
  { id: "api-cost",       name: "Kullanıcı API ücreti ödemez",    premium: true,    starter: true,    creator: true, pro: true },
  { id: "api",            name: "API ve otomasyon erişimi",       premium: false,   starter: false,   creator: false, pro: true },

  // Destek
  { id: "destek",         name: "E-posta desteği",                premium: true,    starter: true,    creator: true, pro: true },
  { id: "oncelik",        name: "Öncelikli destek",               premium: false,   starter: false,   creator: true, pro: true },
  { id: "onboarding",     name: "Özel başlangıç desteği",         premium: false,   starter: false,   creator: false, pro: true },
];

const plans = [
  {
    id: "premium",
    name: "Tek Kitap",
    price: 4,
    description: "1 kitap",
    popular: false,
    oneTime: true,
  },
  {
    id: "starter",
    name: "Başlangıç",
    price: 19,
    description: "10 kitap / ay",
    popular: false,
    oneTime: false,
  },
  {
    id: "creator",
    name: "Yazar",
    price: 39,
    description: "30 kitap / ay",
    popular: true,
    oneTime: false,
  },
  {
    id: "pro",
    name: "Stüdyo",
    price: 79,
    description: "80 kitap / ay",
    popular: false,
    oneTime: false,
  },
];

export function PricingComparisonTable() {
  const [billingCycle, setBillingCycle] = React.useState<"monthly" | "yearly">("monthly");

  const getPrice = (basePrice: number) => {
    return billingCycle === "yearly" 
      ? Math.floor(basePrice * 0.8 * 12) 
      : basePrice;
  };

  return (
    <section className="border-b border-border/80 py-20">
      <div className="shell">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Plan Karşılaştırması
            </h2>
            <p className="mt-2 text-muted-foreground">
              Hangi plan sana en uygun? Özellikleri yan yana karşılaştır.
            </p>
          </div>

          {/* Billing Toggle */}
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
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                billingCycle === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yıllık (%20 indirim)
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-border/80">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/80">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Özellik
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
                        <Badge className="text-xs">En Popüler</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {plan.oneTime
                        ? "$4 / tek seferlik"
                        : billingCycle === "yearly"
                          ? `$${getPrice(plan.price) / 12}/ay`
                          : `$${plan.price}/ay`
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

        {/* Savings Calculator */}
        {billingCycle === "yearly" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Yıllık planla %20 tasarruf et
                </p>
                <p className="text-sm text-muted-foreground">
                  Aylık plana göre yıllık toplamda 2 ay ücretsiz kazanırsın.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
