"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useParticleEffect } from "@/lib/particle-effects";

interface ParticleEffectProps {
  className?: string;
  intensity?: "low" | "medium" | "high";
  interactive?: boolean;
  disabled?: boolean; // For performance mode
}

const INTENSITY_CONFIG = {
  low: {
    particleCount: 20,
    minSize: 1,
    maxSize: 3,
  },
  medium: {
    particleCount: 50,
    minSize: 2,
    maxSize: 5,
  },
  high: {
    particleCount: 80,
    minSize: 2,
    maxSize: 6,
  },
};

export function ParticleEffect({
  className,
  intensity = "medium",
  interactive = true,
  disabled = false,
}: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = INTENSITY_CONFIG[intensity];

  // Check for reduced motion preference and mobile device
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    // Check for mobile device
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Disable particle effect if reduced motion, explicitly disabled, or on mobile
  if (disabled || prefersReducedMotion || isMobile) {
    return null;
  }

  useParticleEffect(canvasRef, {
    ...config,
    interactive,
    mouseInfluenceRadius: 150,
    mouseRepelForce: 0.5,
  });

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "absolute inset-0 pointer-events-none",
        "opacity-40 dark:opacity-30",
        className
      )}
      aria-hidden="true"
    />
  );
}

// Gradient background component
export function GradientBackground({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const colors = [
      "rgba(124, 58, 237, 0.03)",  // primary
      "rgba(16, 185, 129, 0.03)",  // emerald
      "rgba(245, 158, 11, 0.02)",  // amber
    ];

    let currentColorIndex = 0;
    let nextColorIndex = 1;
    let progress = 0;
    const duration = 12000; // 12 seconds for full cycle
    const step = 100 / (duration / 16); // 60fps

    const animate = () => {
      progress += step;

      if (progress >= 100) {
        progress = 0;
        currentColorIndex = nextColorIndex;
        nextColorIndex = (nextColorIndex + 1) % colors.length;
      }

      const currentColor = colors[currentColorIndex];
      const nextColor = colors[nextColorIndex];
      const blendedColor = blendColors(currentColor, nextColor, progress / 100);

      element.style.background = blendedColor;

      requestAnimationFrame(animate);
    };

    const animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 -z-10 transition-colors", className)}
    >
      {children}
    </div>
  );
}

// Color blending utility
function blendColors(color1: string, color2: string, progress: number): string {
  const parseColor = (color: string) => {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return { r: 0, g: 0, b: 0, a: 1 };

    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: match[4] ? parseFloat(match[4]) : 1,
    };
  };

  const c1 = parseColor(color1);
  const c2 = parseColor(color2);

  const r = Math.round(c1.r + (c2.r - c1.r) * progress);
  const g = Math.round(c1.g + (c2.g - c1.g) * progress);
  const b = Math.round(c1.b + (c2.b - c1.b) * progress);
  const a = c1.a + (c2.a - c1.a) * progress;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
