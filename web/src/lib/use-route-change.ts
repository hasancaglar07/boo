/**
 * useRouteChange Hook
 *
 * Listen for route changes and detect navigation direction.
 * Provides callbacks for route change events.
 *
 * @usage
 * ```tsx
 * useRouteChange({
 *   onRouteChange: (from, to, direction) => {
 *     console.log(`Navigating ${direction} from ${from} to ${to}`);
 *   }
 * });
 * ```
 */

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export type NavigationDirection = "forward" | "backward" | "initial";

interface RouteChangeOptions {
  /**
   * Callback when route changes
   */
  onRouteChange?: (from: string, to: string, direction: NavigationDirection) => void;
  /**
   * Callback on route change start
   */
  onChangeStart?: (to: string) => void;
  /**
   * Callback on route change complete
   */
  onChangeComplete?: (to: string) => void;
}

/**
 * Track navigation history across the app
 */
const historySet = new Set<string>();

/**
 * Hook to listen for route changes
 *
 * Detects navigation direction and provides callbacks for route events.
 */
export function useRouteChange(options: RouteChangeOptions = {}) {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);
  const directionRef = useRef<NavigationDirection>("initial");

  useEffect(() => {
    const from = previousPathRef.current;
    const to = pathname;

    // Determine direction
    if (from === null) {
      // Initial load
      directionRef.current = "initial";
      historySet.add(to);
    } else if (historySet.has(to)) {
      // Navigating back
      directionRef.current = "backward";
    } else {
      // Navigating forward
      directionRef.current = "forward";
      historySet.add(to);
    }

    const direction = directionRef.current;

    // Trigger callbacks
    if (from !== to) {
      options.onChangeStart?.(to);

      // Small delay for transition start
      setTimeout(() => {
        options.onRouteChange?.(from || "/", to, direction);
      }, 0);

      // Transition complete after animation
      setTimeout(() => {
        options.onChangeComplete?.(to);
      }, 300);
    }

    previousPathRef.current = to;
  }, [pathname, options]);

  return {
    direction: directionRef.current,
    previousPath: previousPathRef.current,
    currentPath: pathname,
  };
}

/**
 * Hook to get navigation direction only
 *
 * Simpler version if you only need the direction
 */
export function useNavigationDirection(): NavigationDirection {
  const pathname = usePathname();
  const directionRef = useRef<NavigationDirection>("initial");

  useEffect(() => {
    if (historySet.has(pathname)) {
      directionRef.current = "backward";
    } else {
      directionRef.current = "forward";
      historySet.add(pathname);
    }
  }, [pathname]);

  return directionRef.current;
}
