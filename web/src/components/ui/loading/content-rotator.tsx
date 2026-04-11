"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  getRandomContent,
  CATEGORY_COLORS,
  type LoadingContent,
} from "@/lib/loading-content";

interface ContentRotatorProps {
  interval?: number; // milliseconds between rotations
  className?: string;
  showEmoji?: boolean;
  animate?: boolean;
}

export function ContentRotator({
  interval = 4500,
  className,
  showEmoji = true,
  animate = true,
}: ContentRotatorProps) {
  const [content, setContent] = useState<LoadingContent>(getRandomContent());
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!animate) return;

    const timer = setInterval(() => {
      setIsAnimating(true);

      // Wait for fade out animation
      setTimeout(() => {
        setContent(getRandomContent());
        setIsAnimating(false);
      }, 300);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, animate]);

  const colors = CATEGORY_COLORS[content.category];

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 transition-all duration-500",
        colors.bg,
        colors.border,
        isAnimating && animate && "opacity-0 transform translate-y-1",
        !isAnimating && animate && "opacity-100 transform translate-y-0",
        className
      )}
    >
      <style>{`
        @keyframes content-fade-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .content-animate-in {
          animation: content-fade-in 0.4s ease-out forwards;
        }
      `}</style>

      <p
        className={cn(
          "text-xs md:text-sm font-medium leading-relaxed",
          colors.text,
          !isAnimating && animate && "content-animate-in"
        )}
      >
        {showEmoji && <span className="mr-1.5">{content.emoji}</span>}
        {content.text}
      </p>
    </div>
  );
}

// Compact version for smaller spaces
export function ContentRotatorCompact({
  interval = 4000,
  className,
}: Pick<ContentRotatorProps, "interval" | "className">) {
  const [content, setContent] = useState<LoadingContent>(getRandomContent());
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setContent(getRandomContent());
        setIsAnimating(false);
      }, 200);
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  const colors = CATEGORY_COLORS[content.category];

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 transition-all duration-300",
        colors.bg,
        colors.border,
        isAnimating ? "opacity-50" : "opacity-100",
        className
      )}
    >
      <p className={cn("text-[10px] font-medium", colors.text)}>
        {content.emoji} {content.text}
      </p>
    </div>
  );
}

// Minimal version for very small spaces
export function ContentRotatorMinimal({
  interval = 3500,
  className,
}: Pick<ContentRotatorProps, "interval" | "className">) {
  const [content, setContent] = useState<LoadingContent>(getRandomContent());
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setContent(getRandomContent());
        setIsVisible(true);
      }, 150);
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return (
    <p
      className={cn(
        "text-[10px] text-muted-foreground transition-opacity duration-150",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {content.emoji} {content.text}
    </p>
  );
}
