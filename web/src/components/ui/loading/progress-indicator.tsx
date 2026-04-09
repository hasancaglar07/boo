/**
 * ProgressIndicator Component
 *
 * Circular and linear progress indicators with customizable appearance.
 * Based on GenerateLoadingScreen pattern but more reusable.
 *
 * @usage
 * ```tsx
 * <ProgressCircular value={75} size="md" />
 * <ProgressLinear value={50} className="w-full" />
 * ```
 */

import { cn } from "@/lib/utils";

// Size presets for circular progress
type Size = "sm" | "md" | "lg";

const sizeConfig = {
  sm: { width: 80, strokeWidth: 4 },
  md: { width: 152, strokeWidth: 5 },
  lg: { width: 200, strokeWidth: 6 },
} as const;

/**
 * Circular progress indicator
 *
 * Features:
 * - Smooth SVG circle animation
 * - Customizable size (sm/md/lg)
 * - Optional percentage display
 * - Color variants (primary, success, warning)
 */
interface ProgressCircularProps {
  /**
   * Progress value (0-100)
   */
  value: number;
  /**
   * Size preset
   * @default "md"
   */
  size?: Size;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show percentage in center
   * @default true
   */
  showPercentage?: boolean;
  /**
   * Color variant
   * @default "primary"
   */
  variant?: "primary" | "success" | "warning";
  /**
   * Whether animation is complete (shows checkmark)
   */
  isComplete?: boolean;
}

export function ProgressCircular({
  value,
  size = "md",
  className,
  showPercentage = true,
  variant = "primary",
  isComplete = false,
}: ProgressCircularProps) {
  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (value / 100) * circumference;

  const variantColors = {
    primary: "stroke-primary",
    success: "stroke-emerald-500",
    warning: "stroke-amber-500",
  };

  const variantTextColors = {
    primary: "text-foreground",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
  };

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={config.width}
        height={config.width}
        viewBox={`0 0 ${config.width} ${config.width}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          strokeWidth={config.strokeWidth}
          className="stroke-muted/40"
        />
        {/* Progress arc */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-700 ease-out",
            variantColors[variant]
          )}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeOffset,
          }}
        />
      </svg>

      {/* Center content */}
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "tabular-nums tracking-tight",
              size === "sm" ? "text-lg" : "text-4xl",
              "font-extralight",
              variantTextColors[variant]
            )}
          >
            {isComplete ? "✓" : value}
            {!isComplete && <span className="text-lg text-muted-foreground">%</span>}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Linear progress indicator
 *
 * Features:
 * - Horizontal bar animation
 * - Optional label display
 * - Color variants
 * - Smooth transition
 */
interface ProgressLinearProps {
  /**
   * Progress value (0-100)
   */
  value: number;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show label above bar
   */
  showLabel?: boolean;
  /**
   * Label text (defaults to percentage)
   */
  label?: string;
  /**
   * Color variant
   * @default "primary"
   */
  variant?: "primary" | "success" | "warning";
}

export function ProgressLinear({
  value,
  className,
  showLabel = false,
  label,
  variant = "primary",
}: ProgressLinearProps) {
  const variantColors = {
    primary: "bg-primary",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {label || `${value}%`}
          </span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted/50"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            variantColors[variant]
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
