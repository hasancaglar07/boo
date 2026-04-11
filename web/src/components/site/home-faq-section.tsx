"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Upload,
  CreditCard,
  FileDown,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ── Icon map for question types ────────────────────────── */

const QUESTION_ICONS: Record<string, React.ElementType> = {
  quality: CheckCircle2,
  duration: Clock,
  kdp: Upload,
  creditCard: CreditCard,
  formats: FileDown,
};

/* ── Types ──────────────────────────────────────────────── */

export type FaqItem = {
  question: string;
  answer: string;
  iconKey?: string;
  claims?: Array<{ label: string; value: string }>;
};

type HomeFaqSectionProps = {
  badge?: string;
  title?: string;
  description?: string;
  items: FaqItem[];
  allQuestionsHref?: string;
  allQuestionsLabel?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

/* ── Accordion Item ─────────────────────────────────────── */

function FaqAccordionItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const IconComponent = (item.iconKey && QUESTION_ICONS[item.iconKey]) || CheckCircle2;
  const number = String(index + 1).padStart(2, "0");

  return (
    <div
      className={cn(
        "group/faq rounded-2xl border transition-all duration-300",
        isOpen
          ? "border-primary/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_4%,var(--card)),var(--card))] shadow-sm"
          : "border-border/60 bg-card/60 hover:border-border hover:bg-card",
      )}
    >
      {/* Question header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-4 px-5 py-4 text-left md:px-6 md:py-5"
        aria-expanded={isOpen}
      >
        {/* Number */}
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors duration-300",
            isOpen
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground group-hover/faq:bg-primary/8 group-hover/faq:text-primary",
          )}
        >
          {number}
        </span>

        {/* Icon */}
        <IconComponent
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0 transition-colors duration-300",
            isOpen ? "text-primary" : "text-muted-foreground/60",
          )}
        />

        {/* Question text */}
        <span className="flex-1 text-base font-semibold leading-snug text-foreground md:text-lg">
          {item.question}
        </span>

        {/* Chevron */}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      {/* Answer */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pl-[4.5rem] md:px-6 md:pb-6">
              <p className="text-sm leading-8 text-muted-foreground md:text-base">
                {item.answer}
              </p>

              {/* Claim badges */}
              {item.claims && item.claims.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {item.claims.map((claim) => (
                    <span
                      key={claim.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="font-semibold">{claim.value}</span>
                      <span className="text-primary/70">—</span>
                      <span className="text-primary/70">{claim.label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main FAQ Section ───────────────────────────────────── */

export function HomeFaqSection({
  badge = "FAQ",
  title = "Frequently Asked Questions",
  description,
  items,
  allQuestionsHref = "/faq",
  allQuestionsLabel = "View all questions",
  ctaLabel = "Start Free Preview",
  ctaHref = "/start/topic",
}: HomeFaqSectionProps) {
  const [openIndex, setOpenIndex] = React.useState<number>(0);

  if (!items.length) return null;

  return (
    <section className="border-b border-border/80 py-12 md:py-16">
      <div className="shell">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            {badge}
          </span>
          <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {title}
          </h2>
          {description && (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {/* Accordion */}
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {items.map((item, index) => (
            <FaqAccordionItem
              key={item.question}
              item={item}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </div>

        {/* Bottom CTA row */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={allQuestionsHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            {allQuestionsLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Button asChild size="default" className="shadow-lg">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
