"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CircularCountdownProps {
  seconds: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "warning" | "critical";
  onComplete?: () => void;
  showLabel?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { size: 64, strokeWidth: 3, fontSize: "text-lg" },
  md: { size: 96, strokeWidth: 4, fontSize: "text-2xl" },
  lg: { size: 128, strokeWidth: 5, fontSize: "text-4xl" },
};

export function CircularCountdown({
  seconds: initialSeconds,
  size = "md",
  variant: propVariant,
  onComplete,
  showLabel = false,
  className,
}: CircularCountdownProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  // Auto-detect variant based on remaining seconds
  const variant = propVariant || (seconds > 20 ? "default" : seconds > 10 ? "warning" : "critical");

  const config = SIZE_CONFIG[size];
  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / initialSeconds;
  const strokeOffset = circumference * (1 - progress);

  // Countdown effect
  useEffect(() => {
    if (seconds <= 0) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds, onComplete]);

  // Variant colors
  const variantColors = {
    default: {
      track: "stroke-primary/20",
      progress: "stroke-primary",
      text: "text-primary",
      glow: "rgba(124, 58, 237, 0.3)",
    },
    warning: {
      track: "stroke-amber-500/20",
      progress: "stroke-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      glow: "rgba(245, 158, 11, 0.3)",
    },
    critical: {
      track: "stroke-red-500/20",
      progress: "stroke-red-500",
      text: "text-red-600 dark:text-red-400",
      glow: "rgba(239, 68, 68, 0.3)",
    },
  };

  const colors = variantColors[variant];

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <style>{`
        @keyframes countdown-pulse {
          0%, 100% { filter: drop-shadow(0 0 4px ${colors.glow}); }
          50% { filter: drop-shadow(0 0 12px ${colors.glow}); }
        }
        .countdown-animate {
          animation: countdown-pulse 2s ease-in-out infinite;
        }
        @keyframes countdown-pop {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .countdown-pop {
          animation: countdown-pop 0.3s ease-out;
        }
      `}</style>

      <svg
        width={config.size}
        height={config.size}
        viewBox={`0 0 ${config.size} ${config.size}`}
        className="-rotate-90 countdown-animate"
        role="timer"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Background circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          strokeWidth={config.strokeWidth}
          className={cn("transition-colors duration-500", colors.track)}
        />

        {/* Progress circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-300 ease-out",
            colors.progress
          )}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeOffset,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-semibold tabular-nums tracking-tight countdown-pop",
            config.fontSize,
            colors.text
          )}
        >
          {seconds}
        </span>
        {showLabel && (
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {seconds === 1 ? "second" : "seconds"}
          </span>
        )}
      </div>
    </div>
  );
}
