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

import { useEffect, ReactNode, useMemo } from "react";
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
let lastPathname: string | null = null;

/**
 * PageTransition wrapper component
 *
 * Wraps page content with fade + slide transitions.
 * Detects navigation direction for spatial continuity.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const direction = useMemo<"forward" | "backward">(() => {
    if (!lastPathname) return "forward";
    return historyStack.has(pathname) ? "backward" : "forward";
  }, [pathname]);

  // Detect navigation direction
  useEffect(() => {
    historyStack.add(pathname);
    lastPathname = pathname;
  }, [pathname]);

  // Skip animations if reduced motion is preferred
  if (prefersReducedMotion()) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="sync" initial={false}>
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
  const direction = useMemo<"forward" | "backward">(() => {
    if (!lastPathname) return "forward";
    return historyStack.has(pathname) ? "backward" : "forward";
  }, [pathname]);

  useEffect(() => {
    historyStack.add(pathname);
    lastPathname = pathname;
  }, [pathname]);

  return direction;
}
