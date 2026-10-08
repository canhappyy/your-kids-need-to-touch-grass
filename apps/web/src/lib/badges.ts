import { MILESTONE_BADGES } from "@/lib/rewards";
import type { MilestoneBadge } from "@/types/reward";

/**
 * Retrieves the full catalog of collectible Australian wildlife achievement badges.
 *
 * Calls the `/api/badges` backend endpoint to obtain badges configured in the database,
 * with full metadata (species names, unlock rules, requirements, and visual asset paths).
 * If the network request fails or the database is offline, gracefully degrades to the bundled
 * local `MILESTONE_BADGES` constant so badge display never breaks.
 *
 * @param fetchFn - Optional HTTP fetch implementation for testing or custom headers. Defaults to global `fetch`.
 * @returns A Promise resolving to an array of `MilestoneBadge` objects.
 */
export async function fetchSpeciesBadges(
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<MilestoneBadge[]> {
  try {
    const response = await fetchFn("/api/badges");
    if (!response.ok) {
      throw new Error(`Failed to load badges: ${response.statusText}`);
    }
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    // Fallback if returned data is empty
    return [...MILESTONE_BADGES];
  } catch {
    // Graceful offline fallback
    return [...MILESTONE_BADGES];
  }
}
