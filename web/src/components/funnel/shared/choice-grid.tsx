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
    <div className={cn("grid grid-cols-1 gap-3", columns)}>
      {values.map((value) => {
        const isSelected = selected === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isSelected}
            className={cn(
              "group relative rounded-2xl border px-4 py-3.5 text-left outline-none sm:px-5 sm:py-4",
              "transition-all duration-200",
              "focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1",
              isSelected
                ? "border-2 border-primary bg-primary/8"
                : "border-border bg-background/72 hover:border-primary/40 hover:bg-primary/3 active:bg-accent",
            )}
            onClick={() => onSelect(value)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-base sm:text-lg font-bold leading-snug transition-colors duration-150",
                  isSelected ? "text-primary" : "text-foreground group-hover:text-foreground",
                )}>
                  {labelFor(value)}
                </div>
                {descriptionFor ? (
                  <div className="mt-1 text-sm leading-6 text-muted-foreground">{descriptionFor(value)}</div>
                ) : null}
              </div>
              <div
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 bg-card text-transparent group-hover:border-primary/30",
                )}
              >
                <Check className={cn("size-4 transition-all duration-150", isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75")} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
