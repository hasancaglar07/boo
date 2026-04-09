/**
 * SkeletonCard Component
 *
 * A high-quality shimmer effect skeleton placeholder.
 * Uses gradient animation for a premium loading experience.
 *
 * @usage
 * ```tsx
 * <SkeletonCard className="h-20 w-full" />
 * <SkeletonCard className="h-32 w-64 rounded-lg" />
 * ```
 */

import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show shimmer effect (default: true)
   */
  shimmer?: boolean;
}

/**
 * SkeletonCard with shimmer animation
 *
 * Shimmer effect: Gradient highlight moves from left to right
 * Duration: 2s infinite loop
 * Direction: -200% to 200% background position
 */
export function SkeletonCard({ className, shimmer = true }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-muted/50",
        shimmer && "animate-shimmer",
        className
      )}
      style={
        shimmer
          ? {
              background: `linear-gradient(
                90deg,
                rgb(var(--muted-foreground) / 0.1) 0%,
                rgb(var(--muted-foreground) / 0.2) 50%,
                rgb(var(--muted-foreground) / 0.1) 100%
              )`,
              backgroundSize: "200% 100%",
              animation: "shimmer 2s infinite",
            }
          : undefined
      }
      aria-hidden="true"
      role="presentation"
    />
  );
}

/**
 * Add shimmer keyframes to globals.css if not already present
 *
 * @example
 * ```css
 * @keyframes shimmer {
 *   0% { background-position: -200% center; }
 *   100% { background-position: 200% center; }
 * }
 * ```
 */
