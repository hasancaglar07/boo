/**
 * LoadingSpinner Component
 *
 * Enhanced spinner with pulse and ring animation effects.
 * More engaging than basic CSS spinner.
 *
 * @usage
 * ```tsx
 * <LoadingSpinner size="md" />
 * <LoadingSpinner size="lg" variant="pulse" />
 * ```
 */

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type Size = "sm" | "md" | "lg";
export type Variant = "default" | "pulse" | "ring";

const sizeConfig = {
  sm: { size: 16, className: "h-4 w-4" },
  md: { size: 24, className: "h-6 w-6" },
  lg: { size: 36, className: "h-9 w-9" },
} as const;

interface LoadingSpinnerProps {
  /**
   * Size preset
   * @default "md"
   */
  size?: Size;
  /**
   * Animation variant
   * @default "default"
   */
  variant?: Variant;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Custom color (overrides default)
   */
  color?: string;
}

/**
 * Enhanced loading spinner with multiple animation variants
 */
export function LoadingSpinner({
  size = "md",
  variant = "default",
  className,
  color,
}: LoadingSpinnerProps) {
  const config = sizeConfig[size];

  if (variant === "pulse") {
    // Pulse variant: Scale animation + glow
    return (
      <div
        className={cn(
          "relative flex items-center justify-center",
          className
        )}
        style={{
          animation: "pulse-ring 2s ease-in-out infinite",
        }}
      >
        <Loader2
          className={cn(
            config.className,
            "animate-spin",
            color?.replace("text-", "text-")
          )}
          style={{ color }}
        />
      </div>
    );
  }

  if (variant === "ring") {
    // Ring variant: Multiple rotating rings
    return (
      <div className={cn("relative", className)}>
        {/* Outer ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-muted opacity-20",
            config.className
          )}
          style={{
            animation: "spin 3s linear infinite",
          }}
        />
        {/* Inner spinner */}
        <Loader2
          className={cn(
            config.className,
            "animate-spin",
            color?.replace("text-", "text-")
          )}
          style={{ color }}
        />
      </div>
    );
  }

  // Default variant: Simple spinner
  return (
    <Loader2
      className={cn(
        config.className,
        "animate-spin",
        className,
        color?.replace("text-", "text-")
      )}
      style={{ color }}
      aria-hidden="true"
    />
  );
}

/**
 * Add these keyframes to globals.css:
 *
 * ```css
 * @keyframes pulse-ring {
 *   0%, 100% {
 *     opacity: 1;
 *     transform: scale(1);
 *   }
 *   50% {
 *     opacity: 0.6;
 *     transform: scale(1.1);
 *   }
 * }
 *
 * @keyframes spin {
 *   from {
 *     transform: rotate(0deg);
 *   }
 *   to {
 *     transform: rotate(360deg);
 *   }
 * }
 * ```
 */
