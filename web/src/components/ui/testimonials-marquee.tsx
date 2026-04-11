"use client";

import React from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export interface TestimonialItem {
  text: string;
  image?: string;
  name: string;
  role: string;
  platform?: string;
  rating?: number;
}

/* ── Single compact card ────────────────────────────────── */
function MarqueeCard({ item }: { item: TestimonialItem }) {
  return (
    <div
      className={cn(
        "flex w-[300px] shrink-0 flex-col gap-3 rounded-2xl border p-5",
        "bg-card border-border/60",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        "hover:border-primary/20 hover:shadow-[0_2px_12px_rgba(188,104,67,0.08)]",
        "dark:bg-card/70 dark:border-white/6 dark:hover:border-primary/25",
        "transition-all duration-300 select-none"
      )}
    >
      {/* Stars */}
      {item.rating != null && (
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "size-3.5",
                i < item.rating!
                  ? "fill-amber-500 text-amber-500"
                  : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
              )}
            />
          ))}
        </div>
      )}

      {/* Quote */}
      <p className="line-clamp-3 text-[13px] leading-6 text-foreground/85">
        &ldquo;{item.text}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-2.5 mt-auto">
        {item.image ? (
          <Image
            width={32}
            height={32}
            src={item.image}
            alt={item.name}
            className="h-8 w-8 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            {item.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="truncate text-xs font-semibold text-foreground">{item.name}</span>
          <span className="truncate text-[11px] text-muted-foreground">{item.role}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Marquee row ────────────────────────────────────────── */
function MarqueeRow({
  items,
  speed = 40,
  reverse = false,
}: {
  items: TestimonialItem[];
  speed?: number;
  reverse?: boolean;
}) {
  return (
    <div className="marquee-mask flex overflow-hidden">
      <div
        className={cn("flex gap-4 py-1", reverse ? "marquee-reverse" : "marquee-forward")}
        style={{ "--marquee-speed": `${speed}s` } as React.CSSProperties}
      >
        {/* Original + duplicate for seamless loop */}
        {[0, 1].map((dup) =>
          items.map((item, i) => (
            <MarqueeCard key={`${dup}-${i}`} item={item} />
          ))
        )}
      </div>
    </div>
  );
}

/* ── Section props ──────────────────────────────────────── */
export interface TestimonialsMarqueeSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  testimonials?: TestimonialItem[];
  items?: TestimonialItem[];
  showHeader?: boolean;
  badge?: string;
  title?: string;
  description?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
  };
  aggregateLabel?: string;
}

export function TestimonialsMarqueeSection({
  className,
  testimonials,
  items,
  showHeader = true,
  badge,
  title,
  description,
  aggregateRating,
  aggregateLabel,
  ...props
}: TestimonialsMarqueeSectionProps) {
  const data = testimonials || items || [];

  // Split into 2 rows for a denser layout
  const row1 = data.slice(0, Math.ceil(data.length / 2));
  const row2 = data.slice(Math.ceil(data.length / 2));

  return (
    <div className={cn("relative", className)} {...props}>
      {/* Header */}
      {showHeader && title && description && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="mx-auto mb-6 flex max-w-[520px] flex-col items-center text-center"
        >
          {badge && (
            <div className="rounded-full border border-border bg-accent/50 px-3.5 py-1 text-[11px] font-medium tracking-wide text-accent-foreground">
              {badge}
            </div>
          )}
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        </motion.div>
      )}

      {/* Marquee rows */}
      <div className="flex flex-col gap-3">
        <MarqueeRow items={row1} speed={45} />
        <MarqueeRow items={row2} speed={38} reverse />
      </div>

      {/* Aggregate rating */}
      {aggregateRating && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-6 flex flex-col items-center gap-1"
        >
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-3.5",
                  i < Math.round(aggregateRating.ratingValue)
                    ? "fill-amber-500 text-amber-500"
                    : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                )}
              />
            ))}
            <span className="ml-1 text-sm font-semibold text-foreground">
              {aggregateRating.ratingValue}
            </span>
            <span className="text-xs text-muted-foreground">
              / {aggregateRating.bestRating || 5}
            </span>
          </div>
          <p className="text-[11px] tracking-wide text-muted-foreground">
            {aggregateLabel || `${aggregateRating.reviewCount}+ verified reviews`}
          </p>
        </motion.div>
      )}
    </div>
  );
}
