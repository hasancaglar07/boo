"use client";

import Image from "next/image";
import React from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export interface TestimonialItem {
  text: string;
  image?: string;
  name: string;
  role: string;
  platform?: string;
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
        animate={{ translateY: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {new Array(2).fill(0).map((_, duplicateIndex) => (
          <React.Fragment key={duplicateIndex}>
            {testimonials.map(({ text, image, name, role, platform }, index) => (
              <article
                className="w-full max-w-xs rounded-[28px] border border-border bg-card/90 p-6 shadow-sm backdrop-blur-sm"
                key={`${name}-${index}-${duplicateIndex}`}
              >
                <div className="mb-3 flex items-center gap-0.5 text-sm text-[#f5a623]">
                  {"★★★★★"}
                </div>
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
              </article>
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
  title: string;
  description: string;
  testimonials: TestimonialItem[];
}

export function TestimonialsColumnsSection({
  className,
  badge = "Yorumlar",
  title,
  description,
  testimonials,
  ...props
}: TestimonialsColumnsSectionProps) {
  const firstColumn = testimonials.slice(0, 3);
  const secondColumn = testimonials.slice(3, 6);
  const thirdColumn = testimonials.slice(6, 9);

  return (
    <section
      className={cn("relative border-b border-border/80 bg-background py-20", className)}
      {...props}
    >
      <div className="shell">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto flex max-w-[560px] flex-col items-center text-center"
        >
          <div className="flex justify-center">
            <div className="rounded-full border border-border bg-accent/60 px-4 py-1 text-xs font-medium tracking-wide text-accent-foreground">
              {badge}
            </div>
          </div>

          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            {title}
          </h2>
          <p className="mt-5 text-pretty text-base leading-8 text-muted-foreground">
            {description}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-[#f5a623]">★★★★★</span>
              <span className="font-semibold text-foreground">4.9/5</span>
              <span className="text-muted-foreground">ortalama puan</span>
            </span>
            <span className="h-3.5 w-px bg-border" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">1,240+</span> yazar
            </span>
          </div>
        </motion.div>

        <div className="mt-12 flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]">
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
        </div>
      </div>
    </section>
  );
}
