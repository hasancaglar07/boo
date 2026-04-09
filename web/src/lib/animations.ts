/**
 * Centralized Animation Tokens
 *
 * Following UI/UX Pro Max rules:
 * - duration-timing: 150-300ms for micro-interactions
 * - easing: Ease-out for enter, ease-in for exit (faster)
 * - stagger-sequence: 30-50ms for lists/grids
 *
 * @see https://github.com/anthropics/claude-code/blob/main/.claude/skills/ui-ux-pro-max/README.md
 */

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animation duration tokens (in milliseconds)
 */
export const duration = {
  /**
   * Fast duration for micro-interactions (button press, hover feedback)
   * @rule 150ms for instant, responsive feedback
   */
  fast: 150,

  /**
   * Base duration for standard transitions (page transitions, fade in/out)
   * @rule 200ms for smooth, noticeable transitions
   */
  base: 200,

  /**
   * Slow duration for complex transitions (modal open, multi-step animations)
   * @rule 300ms maximum for UI animations (avoid >500ms)
   */
  slow: 300,
} as const;

/**
 * Animation easing functions
 *
 * Using cubic-bezier for natural, spring-like motion
 */
export const easing = {
  /**
   * Enter animation easing (ease-out)
   * Fast start, smooth deceleration - feels natural for elements appearing
   * @rule cubic-bezier(0.22, 1, 0.36, 1) - Apple HIG style spring
   */
  enter: [0.22, 1, 0.36, 1] as const,

  /**
   * Exit animation easing (ease-in)
   * Smooth acceleration, fast exit - feels responsive
   * @rule exit-faster-than-enter: 60-70% of enter duration
   */
  exit: [0.36, 0, 0.66, -0.56] as const,

  /**
   * Spring physics for micro-interactions
   * Natural, bouncy motion for button presses and feedback
   * @rule spring-physics: Prefer spring/physics-based curves
   */
  spring: { type: "spring", stiffness: 300, damping: 25 },

  /**
   * Linear for continuous animations (loading spinners, progress bars)
   */
  linear: "linear" as const,
} as const;

/**
 * Stagger delays for sequential list/grid animations
 *
 * @rule stagger-sequence: 30-50ms per item for smooth entrance
 */
export const stagger = {
  /**
   * Stagger for list items (vertical lists)
   * @rule 50ms per item for noticeable but not slow sequence
   */
  list: 0.05,

  /**
   * Stagger for grid items (card grids, image galleries)
   * @rule 30ms per item for faster, more responsive grid entrance
   */
  grid: 0.03,
} as const;

/**
 * Transition presets for common use cases
 */
export const transitions = {
  /**
   * Fast transition for micro-interactions (button press, hover)
   */
  fast: {
    duration: duration.fast,
    ease: easing.spring,
  },

  /**
   * Base transition for standard animations (fade, slide)
   */
  base: {
    duration: duration.base,
    ease: easing.enter,
  },

  /**
   * Slow transition for complex animations (modal, page transition)
   */
  slow: {
    duration: duration.slow,
    ease: easing.enter,
  },

  /**
   * Exit transition (faster than enter)
   * @rule exit-faster-than-enter
   */
  exit: {
    duration: duration.base * 0.7, // 70% of base duration
    ease: easing.exit,
  },
} as const;

/**
 * Get transition options with reduced motion support
 *
 * @param transition - Base transition options
 * @returns Transition options, or simplified version if reduced motion is preferred
 */
export function getTransition<T extends Record<string, unknown>>(
  transition: T
): T {
  if (prefersReducedMotion()) {
    return { ...transition, duration: 0 } as T;
  }
  return transition;
}

/**
 * Animation configuration object
 *
 * Consolidates all animation tokens for easy import
 */
export const animation = {
  duration,
  easing,
  stagger,
  transitions,
  prefersReducedMotion,
  getTransition,
} as const;
