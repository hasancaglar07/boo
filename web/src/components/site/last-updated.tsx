import { Clock } from "lucide-react";

interface LastUpdatedProps {
  date: string;
  className?: string;
}

/**
 * LastUpdated component displays a "Last updated" date with icon
 * Critical for AI search optimization - AI systems weight freshness heavily
 * Add this to all content pages for better AI citation rates
 */
export function LastUpdated({ date, className = "" }: LastUpdatedProps) {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <Clock className="size-4" aria-hidden="true" />
      <time dateTime={date}>Last updated: {formattedDate}</time>
    </div>
  );
}
