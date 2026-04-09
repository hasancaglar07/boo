/**
 * PageTransition Component
 *
 * Provides fade + slide page transitions for Next.js App Router.
 * Implements spatial continuity: forward navigation goes up, backward goes down.
 *
 * Features:
 * - Fade + slide animations
 * - Exit animations (AnimatePresence)
 * - Reduced motion support
 * - Spatial continuity based on navigation direction
 *
 * @usage
 * In layout.tsx:
 * ```tsx
 * <PageTransition>
 *   {children}
 * </PageTransition>
 * ```
 */

"use client";

import { useRef, useEffect, ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition } from "@/lib/animation-variants";
import { prefersReducedMotion } from "@/lib/animations";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Track navigation history to determine direction (forward/backward)
 * Module-level variable to persist across renders
 */
const historyStack = new Set<string>();

/**
 * PageTransition wrapper component
 *
 * Wraps page content with fade + slide transitions.
 * Detects navigation direction for spatial continuity.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);
  const directionRef = useRef<"forward" | "backward">("forward");

  // Detect navigation direction
  useEffect(() => {
    if (previousPathRef.current) {
      // Check if navigating back (path exists in history)
      if (historyStack.has(pathname)) {
        directionRef.current = "backward";
      } else {
        directionRef.current = "forward";
        // Add to history stack
        historyStack.add(pathname);
      }
    } else {
      // Initial load
      historyStack.add(pathname);
    }

    previousPathRef.current = pathname;
  }, [pathname]);

  // Calculate direction for current render
  const direction = useMemo(() => {
    return directionRef.current || "forward";
  }, [pathname]);

  // Skip animations if reduced motion is preferred
  if (prefersReducedMotion()) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageTransition(direction)}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to get current navigation direction
 *
 * @usage
 * ```tsx
 * const direction = useNavigationDirection();
 * <motion.div variants={pageTransition(direction)} />
 * ```
 */
export function useNavigationDirection(): "forward" | "backward" {
  const pathname = usePathname();
  const directionRef = useRef<"forward" | "backward">("forward");

  useEffect(() => {
    if (historyStack.has(pathname)) {
      directionRef.current = "backward";
    } else {
      directionRef.current = "forward";
      historyStack.add(pathname);
    }
  }, [pathname]);

  return directionRef.current;
}
