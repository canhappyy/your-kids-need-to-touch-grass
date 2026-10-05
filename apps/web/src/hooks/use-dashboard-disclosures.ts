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

/** Session disclosure state plus permanent acknowledgement of earned badges. */
export function useDashboardDisclosures(unlockedBadgeIds: string[]) {
  const [openSections, setOpenSections] = useState({
    ...COLLAPSED_DASHBOARD_SECTIONS,
  });
  const [seenBadgeIds, setSeenBadgeIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

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

  useEffect(() => {
    if (!hydrated || !openSections.rewardBadges) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setSeenBadgeIds((currentSeen) => {
        const nextSeen = mergeSeenBadgeIds(currentSeen, unlockedBadgeIds);
        if (nextSeen.length === currentSeen.length) return currentSeen;
        writeSeenBadgeIds(nextSeen);
        return nextSeen;
      });
    });
    return () => {
      active = false;
    };
  }, [hydrated, openSections.rewardBadges, unlockedBadgeIds]);

  const unseenBadgeIds = useMemo(() => {
    const seen = new Set(seenBadgeIds);
    return unlockedBadgeIds.filter((id) => !seen.has(id));
  }, [seenBadgeIds, unlockedBadgeIds]);

  const toggleSection = useCallback(
    (sectionId: DashboardSectionId) => {
      setOpenSections((current) => {
        const next = { ...current, [sectionId]: !current[sectionId] };
        writeDashboardSections(next);

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
