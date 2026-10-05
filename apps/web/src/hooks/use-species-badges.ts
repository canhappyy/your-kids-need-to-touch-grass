"use client";

import { useEffect, useState } from "react";
import { fetchSpeciesBadges } from "@/lib/badges";
import { MILESTONE_BADGES } from "@/lib/rewards";
import type { MilestoneBadge } from "@/types/reward";

/**
 * Hook to retrieve species badges from the database via `/api/badges`.
 * Falls back to static MILESTONE_BADGES during loading or network disconnection.
 */
export function useSpeciesBadges(
  initialBadges: readonly MilestoneBadge[] = MILESTONE_BADGES,
) {
  const [badges, setBadges] = useState<MilestoneBadge[]>([...initialBadges]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

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
