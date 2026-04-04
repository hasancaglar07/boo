"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function ChoiceGrid<T extends string>({
  values,
  selected,
  labelFor,
  descriptionFor,
  onSelect,
  columns = "sm:grid-cols-2",
}: {
  values: T[];
  selected: T;
  labelFor: (value: T) => string;
  descriptionFor?: (value: T) => string;
  onSelect: (value: T) => void;
  columns?: string;
}) {
  return (
    <div className={cn("grid gap-3", columns)}>
      {values.map((value) => {
        const isSelected = selected === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isSelected}
            className={cn(
              "group relative min-h-[76px] rounded-[22px] border px-5 py-5 text-left outline-none",
              "transition-all duration-150 ease-out",
              "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
              isSelected
                ? "scale-[1.02] border-primary/50 bg-primary/10 shadow-[0_4px_16px_rgba(var(--primary),0.12)] ring-1 ring-primary/25"
                : "border-border bg-background/72 hover:scale-[1.01] hover:border-primary/30 hover:bg-accent/70 hover:shadow-md active:scale-[0.995]",
            )}
            onClick={() => onSelect(value)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-[15px] font-semibold leading-snug transition-colors duration-150",
                  isSelected ? "text-primary" : "text-foreground group-hover:text-foreground",
                )}>
                  {labelFor(value)}
                </div>
                {descriptionFor ? (
                  <div className="mt-1.5 text-sm leading-6 text-muted-foreground">{descriptionFor(value)}</div>
                ) : null}
              </div>
              <div
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/60 bg-card text-transparent group-hover:border-primary/30",
                )}
              >
                <Check className={cn("size-3.5 transition-all duration-150", isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75")} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
