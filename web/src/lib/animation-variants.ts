/**
 * Animation Variants Library
 *
 * Reusable Framer Motion variants for common animation patterns.
 * All variants follow UI/UX Pro Max rules:
 * - transform-performance: Only transform/opacity, no width/height
 * - duration-timing: 150-300ms durations
 * - easing: Ease-out for enter, ease-in for exit
 *
 * @usage
 * ```tsx
 * <motion.div
 *   variants={variants.fadeUp}
 *   initial="hidden"
 *   animate="visible"
 *   exit="hidden"
 * >
 *   Content
 * </motion.div>
 * ```
 */

import { animation } from "./animations";

/**
 * Fade and slide up animation
 *
 * Use for: Page content, cards, sections appearing from bottom
 * Direction: Upward motion (positive y to 0)
 */
export const fadeUp = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: animation.transitions.base,
  },
} as const;

/**
 * Fade in animation (no movement)
 *
 * Use for: Simple visibility changes, overlay appearances
 * Direction: No movement, opacity only
 */
export const fadeIn = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: animation.transitions.base,
  },
} as const;

/**
 * Scale and fade in animation
 *
 * Use for: Modals, popups, tooltips, badges
 * Direction: Scale from 95% to 100% with fade
 */
export const scaleIn = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: animation.transitions.base,
  },
} as const;

/**
 * Slide in from left
 *
 * Use for: Sidebars, drawers, off-canvas navigation
 * Direction: Left to right (negative x to 0)
 */
export const slideInLeft = {
  hidden: {
    x: -20,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: animation.transitions.base,
  },
} as const;

/**
 * Slide in from right
 *
 * Use for: Sidebars (right side), panels, drawers
 * Direction: Right to left (positive x to 0)
 */
export const slideInRight = {
  hidden: {
    x: 20,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: animation.transitions.base,
  },
} as const;

/**
 * Slide in from top
 *
 * Use for: Dropdown menus, toasts (desktop), top sheets
 * Direction: Top to bottom (negative y to 0)
 */
export const slideInTop = {
  hidden: {
    y: -20,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: animation.transitions.base,
  },
} as const;

/**
 * Slide in from bottom
 *
 * Use for: Bottom sheets (mobile), toasts (mobile), modals
 * Direction: Bottom to top (positive y to 0)
 */
export const slideInBottom = {
  hidden: {
    y: 20,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: animation.transitions.base,
  },
} as const;

/**
 * Staggered container for list items
 *
 * Use for: Lists where items should appear sequentially
 * Delay: 50ms per item (animation.stagger.list)
 *
 * @usage
 * ```tsx
 * <motion.ul variants={staggerList}>
 *   {items.map((item) => (
 *     <motion.li key={item.id} variants={staggerItem}>
 *       {item.content}
 *     </motion.li>
 *   ))}
 * </motion.ul>
 * ```
 */
export const staggerList = {
  visible: {
    transition: {
      staggerChildren: animation.stagger.list,
      delayChildren: 0.1,
    },
  },
} as const;

/**
 * Individual list item (for use with staggerList)
 */
export const staggerItem = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: animation.transitions.fast,
  },
} as const;

/**
 * Staggered container for grid items
 *
 * Use for: Grids where cards should appear sequentially
 * Delay: 30ms per item (animation.stagger.grid)
 *
 * @usage
 * ```tsx
 * <motion.div variants={staggerGrid} className="grid">
 *   {items.map((item) => (
 *     <motion.div key={item.id} variants={staggerGridItem}>
 *       {item.content}
 *     </motion.div>
 *   ))}
 * </motion.div>
 * ```
 */
export const staggerGrid = {
  visible: {
    transition: {
      staggerChildren: animation.stagger.grid,
      delayChildren: 0.05,
    },
  },
} as const;

/**
 * Individual grid item (for use with staggerGrid)
 */
export const staggerGridItem = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: animation.transitions.fast,
  },
} as const;

/**
 * Page transition variants (fade + slide)
 *
 * Use for: Page route transitions with spatial continuity
 * Direction: Forward (up), Backward (down)
 *
 * @usage
 * ```tsx
 * <motion.div
 *   variants={pageTransition(direction)}
 *   initial="hidden"
 *   animate="visible"
 *   exit="hidden"
 * >
 *   {children}
 * </motion.div>
 * ```
 */
export function pageTransition(direction: "forward" | "backward" = "forward") {
  const yOffset = direction === "forward" ? 20 : -20;

  return {
    hidden: {
      opacity: 0,
      y: yOffset,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: animation.duration.slow / 1000, // Convert to seconds
        ease: animation.easing.enter,
      },
    },
    exit: {
      opacity: 0,
      y: -yOffset,
      transition: {
        duration: (animation.duration.base * 0.7) / 1000, // 70% of base, in seconds
        ease: animation.easing.exit,
      },
    },
  } as const;
}

/**
 * Modal variants (scale + fade)
 *
 * Use for: Modal dialogs, popups, overlays
 * Includes backdrop animation
 */
export const modal = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: animation.transitions.slow,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: animation.transitions.exit,
  },
} as const;

/**
 * Modal backdrop (dimmed background)
 */
export const modalBackdrop = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: animation.duration.slow / 1000,
      ease: animation.easing.enter,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: (animation.duration.fast * 0.5) / 1000, // Very fast exit
      ease: animation.easing.exit,
    },
  },
} as const;

/**
 * Toast notification variants
 *
 * Use for: Toast notifications, alerts, messages
 * Direction: Slide from right (desktop) or top (mobile)
 */
export const toast = {
  hidden: {
    x: 100, // Start from right
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: animation.transitions.base,
  },
  exit: {
    x: 100,
    opacity: 0,
    transition: animation.transitions.exit,
  },
} as const;

/**
 * Consolidated variants export
 */
export const variants = {
  fadeUp,
  fadeIn,
  scaleIn,
  slideInLeft,
  slideInRight,
  slideInTop,
  slideInBottom,
  staggerList,
  staggerItem,
  staggerGrid,
  staggerGridItem,
  modal,
  modalBackdrop,
  toast,
  pageTransition,
} as const;
