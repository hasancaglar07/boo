import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SectionHeading({
  badge,
  title,
  description,
  align = "left",
  actionHref,
  actionLabel,
  className,
  action,
}: {
  badge?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  actionHref?: string;
  actionLabel?: string;
  className?: string;
  action?: ReactNode;
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "mb-8 flex items-end justify-between gap-6",
        centered && "mx-auto max-w-3xl flex-col items-center text-center",
        className,
      )}
    >
      <div className={cn("max-w-3xl", centered && "mx-auto")}>
        {badge ? <Badge>{badge}</Badge> : null}
        <h2 className="mt-4 text-balance font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          {title}
        </h2>
        {description ? (
          <p className={cn("mt-4 text-pretty text-base leading-8 text-muted-foreground", centered && "mx-auto max-w-2xl")}>
            {description}
          </p>
        ) : null}
      </div>

      {action ? (
        action
      ) : actionHref && actionLabel ? (
        <Link href={actionHref} className="text-sm text-muted-foreground transition hover:text-foreground">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
