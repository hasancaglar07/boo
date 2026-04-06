import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Features4Item {
  title: string;
  description: string;
  icon: ReactNode;
}

export interface Features4Props {
  badge?: string;
  title?: string;
  description?: string;
  items: readonly Features4Item[];
  className?: string;
}

export function Features4({
  badge,
  title = "Foundation system built for clear decisions",
  description,
  items,
  className,
}: Features4Props) {
  return (
    <section className={cn("py-12 md:py-20", className)}>
      <div className="shell">
        <div className="mx-auto max-w-3xl space-y-5 text-center">
          {badge ? <Badge>{badge}</Badge> : null}
          <h2 className="text-balance font-serif text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
            {title}
          </h2>
          {description ? (
            <p className="mx-auto max-w-2xl text-pretty text-base leading-8 text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div className="relative mx-auto mt-10 grid max-w-5xl divide-x divide-y overflow-hidden rounded-[28px] border border-border/80 bg-card/90 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="space-y-4 p-8 md:p-10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-background text-primary">
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}