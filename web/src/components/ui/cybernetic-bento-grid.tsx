"use client";

import * as React from "react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BentoItemProps = {
  className?: string;
  children: ReactNode;
};

function BentoItem({ className, children }: BentoItemProps) {
  const itemRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      item.style.setProperty("--mouse-x", `${x}px`);
      item.style.setProperty("--mouse-y", `${y}px`);
    };

    item.addEventListener("mousemove", handleMouseMove);
    return () => item.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={itemRef}
      className={cn(
        "group relative overflow-hidden rounded-[28px] border border-border/80 bg-card/90 p-6 shadow-sm backdrop-blur-sm",
        "before:pointer-events-none before:absolute before:inset-px before:rounded-[27px] before:opacity-0",
        "before:transition-opacity before:duration-300 before:content-[''] group-hover:before:opacity-100",
        "before:[background:radial-gradient(320px_circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),color-mix(in_srgb,var(--primary)_16%,transparent),transparent_48%)]",
        className,
      )}
    >
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

export interface CyberneticBentoItem {
  title: string;
  description: string;
  icon?: ReactNode;
  eyebrow?: string;
  metric?: string;
  bullets?: readonly string[];
  visual?: ReactNode;
  className?: string;
}

export interface CyberneticBentoGridProps {
  badge?: string;
  title?: string;
  description?: string;
  items: readonly CyberneticBentoItem[];
}

export function CyberneticBentoGrid({
  badge = "Core Features",
  title = "Write, edit, and publish in a single flow.",
  description = "A single decision pipeline instead of scattered tool chains. This section reveals the real power behind the product.",
  items,
}: CyberneticBentoGridProps) {
  return (
    <section className="py-18">
      <div className="shell">
        <div className="mx-auto max-w-3xl text-center">
          <Badge>{badge}</Badge>
          <h2 className="mt-4 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-8 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mt-10 grid auto-rows-[minmax(210px,1fr)] gap-4 md:grid-cols-4">
          {items.map((item) => (
            <BentoItem key={item.title} className={item.className}>
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      {item.eyebrow ? (
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-primary/80">
                          {item.eyebrow}
                        </div>
                      ) : null}
                      <div className="flex items-center gap-3">
                        {item.icon ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-primary">
                            {item.icon}
                          </div>
                        ) : null}
                        <h3 className="text-xl font-semibold tracking-tight text-foreground">{item.title}</h3>
                      </div>
                    </div>
                    {item.metric ? (
                      <div className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                        {item.metric}
                      </div>
                    ) : null}
                  </div>

                  <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">{item.description}</p>
                </div>

                <div className="space-y-4">
                  {item.visual ? (
                    <div className="rounded-[22px] border border-border/70 bg-background/80 p-4">{item.visual}</div>
                  ) : null}

                  {item.bullets?.length ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {item.bullets.map((bullet) => (
                        <div
                          key={bullet}
                          className="rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-xs text-foreground"
                        >
                          {bullet}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </BentoItem>
          ))}
        </div>
      </div>
    </section>
  );
}