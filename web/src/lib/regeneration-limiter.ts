/**
 * Regeneration Limiter Utility
 *
 * Tracks and limits regeneration operations per book:
 * - Max 1 rewrite per book
 * - Max 1 front cover upload per book
 * - Max 1 back cover upload per book
 *
 * Counts are stored in localStorage and persist across sessions.
 */

export interface RegenerationCount {
  rewrite: number;
  cover_front: number;
  cover_back: number;
}

const STORAGE_KEY = (slug: string) => `regeneration_count_${slug}`;

const DEFAULT_COUNT: RegenerationCount = {
  rewrite: 0,
  cover_front: 0,
  cover_back: 0,
};

/**
 * Get regeneration count for a specific book
 */
export function getRegenerationCount(slug: string): RegenerationCount {
  if (typeof window === "undefined") {
    return { ...DEFAULT_COUNT };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY(slug));
    if (!stored) {
      return { ...DEFAULT_COUNT };
    }
    return { ...DEFAULT_COUNT, ...JSON.parse(stored) };
  } catch (error) {
    console.error("Failed to read regeneration count:", error);
    return { ...DEFAULT_COUNT };
  }
}

/**
 * Save regeneration count for a specific book
 */
export function saveRegenerationCount(slug: string, count: Partial<RegenerationCount>): void {
  if (typeof window === "undefined") return;

  try {
    const current = getRegenerationCount(slug);
    const updated = { ...current, ...count };
    localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save regeneration count:", error);
  }
}

/**
 * Check if a regeneration operation is allowed
 */
export function canRegenerate(
  slug: string,
  type: keyof RegenerationCount
): boolean {
  const count = getRegenerationCount(slug);
  return count[type] < 1;
}

/**
 * Increment regeneration count for a specific operation
 */
export function incrementRegenerationCount(
  slug: string,
  type: keyof RegenerationCount
): RegenerationCount {
  const current = getRegenerationCount(slug);
  if (current[type] >= 1) {
    return current; // Already at limit
  }

  const updated = { ...current, [type]: current[type] + 1 };
  saveRegenerationCount(slug, updated);
  return updated;
}

/**
 * Reset regeneration count for a book (useful for testing or admin actions)
 */
export function resetRegenerationCount(slug: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY(slug), JSON.stringify(DEFAULT_COUNT));
  } catch (error) {
    console.error("Failed to reset regeneration count:", error);
  }
}

/**
 * Get remaining regeneration count for a specific operation
 */
export function getRemainingRegenerations(
  slug: string,
  type: keyof RegenerationCount
): number {
  const count = getRegenerationCount(slug);
  return Math.max(0, 1 - count[type]);
}

/**
 * Check if any regeneration operations have been used
 */
export function hasUsedAnyRegeneration(slug: string): boolean {
  const count = getRegenerationCount(slug);
  return count.rewrite > 0 || count.cover_front > 0 || count.cover_back > 0;
}
