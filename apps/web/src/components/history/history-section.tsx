"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import { TopNav } from "@/components/layout/top-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCompletedMissions } from "@/hooks/use-completed-missions";
import { useSavedActivities } from "@/hooks/use-saved-activities";
import { useSpeciesBadges } from "@/hooks/use-species-badges";
import { readCompletedMissions } from "@/lib/completed-missions";
import { readRewards, reconcileRewards } from "@/lib/rewards";
import type { MilestoneBadge } from "@/types/reward";
import { ClearHistoryDialog } from "./clear-history-dialog";
import { HistoryErrorAlert } from "./history-error-alert";
import { HistoryHeader } from "./history-header";
import { HistoryList } from "./history-list";
import { HistoryLoadingState } from "./history-loading-state";
import { SavedActivityItem } from "./saved-activity-item";
import { BadgeDetailDialog } from "@/components/dashboard/badge-detail-dialog";

/**
 * Props for the {@link HistorySection} component.
 */
export type HistorySectionProps = {
  /** Optional callback fired when the user chooses to close or find a mission. */
  onClose?: () => void;
  /** Whether to render top navigation back button inside the section. Defaults to false. */
  showNav?: boolean;
};

/**
 * Main presentation and coordinator component for the activity backlog view.
 *
 * Displays two sections:
 * 1. Saved activities — with check (move to completed) and cross (remove) controls.
 * 2. Completed missions — with clear history dialog and completion records.
 */
export function HistorySection({
  onClose,
  showNav = false,
}: HistorySectionProps = {}) {
  const {
    records: completedRecords,
    loading: completedLoading,
    error: completedError,
    refresh: refreshCompleted,
    clear: clearCompleted,
  } = useCompletedMissions();

  const {
    savedActivities,
    loading: savedLoading,
    error: savedError,
    refresh: refreshSaved,
    remove: removeSaved,
    markComplete: markSavedComplete,
  } = useSavedActivities();
  const { badges } = useSpeciesBadges();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newBadges, setNewBadges] = useState<MilestoneBadge[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const handleClear = () => {
    if (clearCompleted()) {
      setConfirmOpen(false);
    }
  };

  const loading = completedLoading || savedLoading;
  const error = completedError || savedError;
  const onRetry = () => {
    refreshCompleted();
    refreshSaved();
  };

  const handleComplete = (id: string) => {
    const previousIds = new Set(readRewards()?.unlockedBadgeIds ?? []);
    if (!markSavedComplete(id) || badges.length === 0) return;

    const state = reconcileRewards(
      readCompletedMissions(),
      new Date(),
      window.localStorage,
      badges,
    );
    const unlockedBadges = badges.filter(
      (badge) =>
        state.unlockedBadgeIds.includes(badge.id) && !previousIds.has(badge.id),
    );
    if (unlockedBadges.length > 0) setNewBadges(unlockedBadges);
  };

  return (
    <>
      {showNav && <TopNav backHref="/" backAriaLabel="Back to search" />}
      <div className="mx-auto w-full max-w-lg space-y-8">
        <HistoryHeader headingRef={headingRef} />
        {loading && <HistoryLoadingState />}
        {error && <HistoryErrorAlert message={error} onRetry={onRetry} />}

        {!loading && (
          <>
            {/* Saved activities section */}
            <section
              aria-labelledby="saved-activities-heading"
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h2
                  className="text-xl font-bold tracking-tight text-zinc-900"
                  id="saved-activities-heading"
                >
                  Saved activities
                </h2>
                <Badge
                  className="border-[#93AB63]/40 bg-white font-semibold text-zinc-800"
                  variant="outline"
                >
                  {savedActivities.length}
                </Badge>
              </div>

              {savedActivities.length === 0 ? (
                <Card className="border-dashed bg-white/50">
                  <CardContent className="py-6 text-center text-sm text-zinc-600">
                    <p>No saved activities yet.</p>
                    <Link
                      className="mt-2 inline-flex min-h-11 items-center font-medium text-[#93AB63] underline"
                      href="/"
                      onClick={onClose}
                    >
                      Find an activity to save
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <ul className="space-y-3" aria-label="Saved activities">
                  {savedActivities.map((activity) => (
                    <li key={activity.id}>
                      <SavedActivityItem
                        activity={activity}
                        onComplete={handleComplete}
                        onRemove={removeSaved}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Completed missions section */}
            <section
              aria-labelledby="completed-missions-heading"
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h2
                  className="text-xl font-bold tracking-tight text-zinc-900"
                  id="completed-missions-heading"
                >
                  Completed missions
                </h2>
                <Badge
                  className="border-zinc-300 bg-white font-semibold text-zinc-800"
                  variant="outline"
                >
                  {completedRecords.length}
                </Badge>
              </div>

              {completedRecords.length === 0 ? (
                <Card className="border-dashed bg-white/50">
                  <CardContent className="py-6 text-center text-sm text-zinc-600">
                    <p>No missions completed yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <HistoryList records={completedRecords} />
              )}
            </section>

            <ClearHistoryDialog
              error={completedError}
              finalFocusRef={headingRef}
              onConfirmClear={handleClear}
              onOpenChange={setConfirmOpen}
              open={confirmOpen}
              showTrigger={completedRecords.length > 0 || Boolean(completedError)}
            />
          </>
        )}
      </div>
      <Dialog
        open={newBadges.length > 0}
        onOpenChange={(open) => {
          if (!open) setNewBadges((current) => current.slice(1));
        }}
      >
        {newBadges[0] ? (
          <BadgeDetailDialog badge={newBadges[0]} />
        ) : null}
      </Dialog>
    </>
  );
}
