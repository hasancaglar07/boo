"use client";

import Image from "next/image";
import React from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";

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
        width={44}
        height={44}
        src={image}
        alt={name}
        className="h-11 w-11 rounded-full object-cover"
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
    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
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
        className="flex flex-col gap-4 pb-4"
      >
        {new Array(2).fill(0).map((_, duplicateIndex) => (
          <React.Fragment key={duplicateIndex}>
            {testimonials.map(({ text, image, name, role, platform, rating }, index) => (
              <motion.article
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true, margin: "-20px" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="w-full max-w-[280px] md:max-w-xs rounded-[24px] border border-border bg-card/90 p-5 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow duration-200"
                key={`${name}-${index}-${duplicateIndex}`}
              >
                {/* Star Rating */}
                {rating && (
                  <div className="flex gap-0.5 mb-3" aria-label={`Rating: ${rating} out of 5 stars`}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-4",
                          i < rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                )}
                <p className="text-sm leading-7 text-foreground">{text}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <TestimonialAvatar image={image} name={name} />
                    <div className="flex flex-col">
                      <div className="text-sm font-medium tracking-tight text-foreground">{name}</div>
                      <div className="text-sm tracking-tight text-muted-foreground">{role}</div>
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
  extends React.HTMLAttributes<HTMLElement> {
  badge?: string;
  title?: string;
  description?: string;
  testimonials?: TestimonialItem[];
  items?: TestimonialItem[];
  showHeader?: boolean; // Control if header section is shown
}

export function TestimonialsColumnsSection({
  className,
  badge = "Yorumlar",
  title,
  description,
  testimonials,
  items,
  showHeader = true,
  ...props
}: TestimonialsColumnsSectionProps) {
  // Support both 'testimonials' and 'items' prop names
  const data = testimonials || items || [];
  const firstColumn = data.slice(0, 3);
  const secondColumn = data.slice(3, 6);
  const thirdColumn = data.slice(6, 9);

  return (
    <section
      className={cn("relative border-b border-border/80 bg-background", className)}
      {...props}
    >
      <div className="shell">
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
          className="flex justify-center gap-3 md:gap-5 [mask-image:linear-gradient(to_bottom,transparent,black_5%,black_90%,transparent)] pb-8"
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
      </div>
    </section>
  );
}
