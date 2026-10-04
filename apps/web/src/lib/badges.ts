import { MILESTONE_BADGES } from "@/lib/rewards";
import type { MilestoneBadge } from "@/types/reward";

/**
 * Fetches species badges from the /api/badges endpoint.
 * Returns the fetched array, or falls back to MILESTONE_BADGES on error.
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
    return [...MILESTONE_BADGES];
  } catch {
    return [...MILESTONE_BADGES];
  }
}
