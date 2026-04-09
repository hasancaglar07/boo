/**
 * LoadingOverlay Component
 *
 * Full-page loading overlay with backdrop blur.
 * Blocks interaction while showing loading state.
 *
 * @usage
 * ```tsx
 * <LoadingOverlay message="Loading your data..." />
 * <LoadingOverlay progress={75} showProgress />
 * ```
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./spinner";
import { ProgressCircular } from "./progress-indicator";

interface LoadingOverlayProps {
  /**
   * Message to display below spinner
   */
  message?: string;
  /**
   * Progress value (0-100) for progress indicator
   * If provided, shows ProgressCircular instead of spinner
   */
  progress?: number;
  /**
   * Whether to show circular progress indicator
   * Requires progress prop
   * @default false
   */
  showProgress?: boolean;
  /**
   * Size of spinner/progress indicator
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Custom children to render in overlay
   */
  children?: ReactNode;
  /**
   * Whether to show backdrop blur
   * @default true
   */
  backdropBlur?: boolean;
}

/**
 * Full-page loading overlay with optional progress indicator
 */
export function LoadingOverlay({
  message,
  progress,
  showProgress = false,
  size = "md",
  className,
  children,
  backdropBlur = true,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        backdropBlur && "backdrop-blur-sm",
        "bg-background/80",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner or Progress Indicator */}
        {children || (showProgress && progress !== undefined ? (
          <ProgressCircular
            value={progress}
            size={size}
            isComplete={progress >= 100}
          />
        ) : (
          <LoadingSpinner size={size} />
        ))}

        {/* Optional message */}
        {message && (
          <p className="text-sm font-medium text-muted-foreground">
            {message}
          </p>
        )}

        {/* Optional progress text */}
        {showProgress && progress !== undefined && (
          <p className="text-xs text-muted-foreground">
            {progress >= 100 ? "Completed" : `${progress}%`}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Inline loading state for smaller containers
 *
 * Use for: Loading states within cards, panels, etc.
 */
interface InlineLoaderProps {
  /**
   * Message to display
   */
  message?: string;
  /**
   * Size of spinner
   * @default "sm"
   */
  size?: "sm" | "md";
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function InlineLoader({
  message,
  size = "sm",
  className,
}: InlineLoaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 py-12",
        className
      )}
    >
      <LoadingSpinner size={size} />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
