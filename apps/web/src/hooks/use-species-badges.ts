"use client";

import { useEffect, useState } from "react";
import { fetchSpeciesBadges } from "@/lib/badges";
import type { MilestoneBadge } from "@/types/reward";

/**
 * Custom React hook that fetches the Australian wildlife badge catalog from the `/api/badges` backend endpoint.
 *
 * Automatically falls back to the bundled offline `MILESTONE_BADGES` catalog if the database is offline
 * or the user is disconnected from the internet, guaranteeing the rewards gallery always renders.
 *
 * @param initialBadges - Optional pre-seeded array of badges for SSR or instant rendering before fetch resolves.
 * @returns An object containing:
 * - `badges`: Array of full `MilestoneBadge` records with species names, icons, and requirements.
 * - `loading`: Boolean indicating whether the network fetch is currently in flight.
 * - `error`: Error message string if the fetch failed, or null on success.
 */
export function useSpeciesBadges(
  initialBadges: readonly MilestoneBadge[] = [],
) {
  const [badges, setBadges] = useState<MilestoneBadge[]>([...initialBadges]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // Fetch badges from API endpoint
    fetchSpeciesBadges()
      .then((data) => {
        if (active) {
          setBadges(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load badges");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { badges, loading, error };
}
