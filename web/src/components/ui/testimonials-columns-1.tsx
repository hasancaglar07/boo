"use client";

import Image from "next/image";
import React from "react";
import { motion } from "motion/react";
import { Star, Quote } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TestimonialItem {
  text: string;
  image?: string;
  name: string;
  role: string;
  platform?: string;
  rating?: number; // Star rating 1-5
}

function TestimonialAvatar({ image, name }: { image?: string; name: string }) {
  if (image) {
    return (
      <Image
        width={48}
        height={48}
        src={image}
        alt={name}
        className="h-12 w-12 rounded-full object-cover ring-2 ring-background shadow-sm"
        loading="lazy"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-bold text-primary ring-2 ring-background">
      {initials}
    </div>
  );
}

export const TestimonialsColumn = ({
  className,
  testimonials,
  duration = 16,
}: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) => {
  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          translateY: ["0%", "-50%"]
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-5 pb-6"
      >
        {new Array(2).fill(0).map((_, duplicateIndex) => (
          <React.Fragment key={duplicateIndex}>
            {testimonials.map(({ text, image, name, role, platform, rating }, index) => (
              <motion.article
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true, margin: "-20px" }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={cn(
                  "group w-full max-w-[340px] rounded-[20px] border p-6",
                  "bg-card border-primary/8",
                  "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]",
                  "hover:border-primary/20 hover:shadow-[0_2px_8px_rgba(188,104,67,0.08),0_8px_24px_rgba(0,0,0,0.06)]",
                  "dark:bg-card/80 dark:border-white/8 dark:hover:border-primary/25",
                  "dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.15)]",
                  "dark:hover:shadow-[0_2px_8px_rgba(222,136,96,0.12),0_8px_24px_rgba(0,0,0,0.25)]",
                  "transition-all duration-300 ease-out relative overflow-hidden"
                )}
                key={`${name}-${index}-${duplicateIndex}`}
              >
                {/* Subtle corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/[0.03] to-transparent pointer-events-none dark:from-primary/[0.06]" />

                {/* Quote icon */}
                <Quote className="size-7 text-primary/15 mb-3 dark:text-primary/20" aria-hidden="true" />

                {/* Star Rating */}
                {rating && (
                  <div className="flex gap-0.5 mb-3" aria-label={`Rating: ${rating} out of 5 stars`}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-[18px]",
                          i < rating
                            ? "fill-amber-500 text-amber-500"
                            : "fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600"
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                )}
                <p className="text-sm leading-7 text-foreground/90">{text}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <TestimonialAvatar image={image} name={name} />
                    <div className="flex flex-col">
                      <div className="text-sm font-semibold tracking-tight text-foreground">{name}</div>
                      <div className="text-xs tracking-tight text-muted-foreground">{role}</div>
                    </div>
                  </div>
                  {platform && (
                    <span className="shrink-0 rounded-full border border-border bg-accent/60 px-2.5 py-1 text-[11px] font-medium tracking-wide text-accent-foreground">
                      {platform}
                    </span>
                  )}
                </div>
              </motion.article>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

export interface TestimonialsColumnsSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  badge?: string;
  title?: string;
  description?: string;
  testimonials?: TestimonialItem[];
  items?: TestimonialItem[];
  showHeader?: boolean;
  /** Optional aggregate rating to display below the cards */
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
  };
  /** Localized label for the aggregate rating line */
  aggregateLabel?: string;
}

export function TestimonialsColumnsSection({
  className,
  badge = "Yorumlar",
  title,
  description,
  testimonials,
  items,
  showHeader = true,
  aggregateRating,
  aggregateLabel,
  ...props
}: TestimonialsColumnsSectionProps) {
  // Support both 'testimonials' and 'items' prop names
  const data = testimonials || items || [];
  const firstColumn = data.slice(0, 3);
  const secondColumn = data.slice(3, 6);
  const thirdColumn = data.slice(6, 9);

  return (
    <div
      className={cn("relative", className)}
      {...props}
    >
      {showHeader && title && description && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto mb-8 flex max-w-[560px] flex-col items-center text-center"
        >
          <div className="flex justify-center">
            <div className="rounded-full border border-border bg-accent/60 px-4 py-1 text-xs font-medium tracking-wide text-accent-foreground">
              {badge}
            </div>
          </div>

          <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-foreground md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-pretty text-sm leading-7 text-muted-foreground md:text-base">
            {description}
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, margin: "-50px" }}
        className="flex justify-center gap-4 md:gap-6 [mask-image:linear-gradient(to_bottom,black_0%,black_8%,black_92%,black_0%)]"
      >
        <TestimonialsColumn testimonials={firstColumn} duration={14} />
        <TestimonialsColumn
          testimonials={secondColumn}
          className="hidden md:block"
          duration={18}
        />
        <TestimonialsColumn
          testimonials={thirdColumn}
          className="hidden xl:block"
          duration={16}
        />
      </motion.div>

      {/* Aggregate rating social proof */}
      {aggregateRating && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="mt-8 flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-4",
                  i < Math.round(aggregateRating.ratingValue)
                    ? "fill-amber-500 text-amber-500"
                    : "fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600"
                )}
                aria-hidden="true"
              />
            ))}
            <span className="ml-1.5 text-sm font-semibold text-foreground">
              {aggregateRating.ratingValue}
            </span>
            <span className="text-sm text-muted-foreground">
              / {aggregateRating.bestRating || 5}
            </span>
          </div>
          <p className="text-xs tracking-wide text-muted-foreground">
            {aggregateLabel || `${aggregateRating.reviewCount}+ verified reviews from real authors`}
          </p>
        </motion.div>
      )}
    </div>
  );
}
