"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  COLLAPSED_DASHBOARD_SECTIONS,
  mergeSeenBadgeIds,
  readDashboardSections,
  readSeenBadgeIds,
  writeDashboardSections,
  writeSeenBadgeIds,
  type DashboardSectionId,
} from "@/lib/dashboard-preferences";

/**
 * Custom hook managing the expansion state of collapsible cards on the parent dashboard,
 * alongside tracking newly unlocked wildlife badges that have not yet been seen by the parent.
 *
 * How this hook works:
 * 1. Hydration & Storage Synchronization:
 *    - Reads initial card disclosure states from `sessionStorage` (resets each browsing session).
 *    - Reads acknowledged badge IDs from `localStorage` (persists across visits).
 *    - Uses `queueMicrotask` during initial mount to ensure server-rendered markup matches client initial state.
 *
 * 2. Unseen Badge Discovery & Notification:
 *    - Compares `unlockedBadgeIds` from the gamification store against `seenBadgeIds`.
 *    - Computes `hasNewBadges` to render an attention indicator dot on the wildlife rewards card header.
 *
 * 3. Auto-Acknowledgement on Card Expansion:
 *    - When the parent opens the `"rewardBadges"` disclosure card, all currently unlocked badges
 *      are automatically marked as seen and saved to `localStorage`, clearing the notification indicator.
 *
 * @param unlockedBadgeIds - Array of badge IDs currently earned by the child.
 * @returns An object containing:
 * - `openSections`: Record mapping each section ID to its boolean open/closed state.
 * - `hasNewBadges`: Boolean indicating whether there are newly unlocked badges awaiting parent review.
 * - `toggleSection`: Callback function to toggle a specific section card open or closed.
 */
export function useDashboardDisclosures(unlockedBadgeIds: string[]) {
  // Start with collapsed sections to guarantee SSR and initial client render align
  const [openSections, setOpenSections] = useState({
    ...COLLAPSED_DASHBOARD_SECTIONS,
  });
  const [seenBadgeIds, setSeenBadgeIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate preferences from client storage after initial mount
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setOpenSections(readDashboardSections());
      setSeenBadgeIds(readSeenBadgeIds());
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // When the rewards card is currently expanded, automatically mark all earned badges as seen
  useEffect(() => {
    if (!hydrated || !openSections.rewardBadges) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setSeenBadgeIds((currentSeen) => {
        const nextSeen = mergeSeenBadgeIds(currentSeen, unlockedBadgeIds);
        // Avoid state updates if all badges were already marked as seen
        if (nextSeen.length === currentSeen.length) return currentSeen;
        writeSeenBadgeIds(nextSeen);
        return nextSeen;
      });
    });
    return () => {
      active = false;
    };
  }, [hydrated, openSections.rewardBadges, unlockedBadgeIds]);

  // Compute badges that the parent has not yet seen
  const unseenBadgeIds = useMemo(() => {
    const seen = new Set(seenBadgeIds);
    return unlockedBadgeIds.filter((id) => !seen.has(id));
  }, [seenBadgeIds, unlockedBadgeIds]);

  // Handler for toggling card expansion state
  const toggleSection = useCallback(
    (sectionId: DashboardSectionId) => {
      setOpenSections((current) => {
        const next = { ...current, [sectionId]: !current[sectionId] };
        writeDashboardSections(next);

        // If expanding the rewards card, immediately acknowledge all unlocked badges
        if (sectionId === "rewardBadges" && next.rewardBadges) {
          setSeenBadgeIds((currentSeen) => {
            const nextSeen = mergeSeenBadgeIds(
              currentSeen,
              unlockedBadgeIds,
            );
            writeSeenBadgeIds(nextSeen);
            return nextSeen;
          });
        }

        return next;
      });
    },
    [unlockedBadgeIds],
  );

  return {
    openSections,
    hasNewBadges: hydrated && unseenBadgeIds.length > 0,
    toggleSection,
  };
}
