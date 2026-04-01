import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-accent/72 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
