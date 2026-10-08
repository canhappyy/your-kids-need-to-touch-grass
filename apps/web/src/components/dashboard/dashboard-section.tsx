"use client";

import { useMemo } from "react";
import { ScreenHeader } from "@/components/layout/screen-header";
import { HistoryErrorAlert } from "@/components/history/history-error-alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompletedMissions } from "@/hooks/use-completed-missions";
import { useDashboardDisclosures } from "@/hooks/use-dashboard-disclosures";
import { useDashboardDate } from "@/hooks/use-dashboard-date";
import { useRewards } from "@/hooks/use-rewards";
import { buildDashboardStats } from "@/lib/dashboard-stats";
import { useSpeciesBadges } from "@/hooks/use-species-badges";
import { DailyGoalCard } from "./daily-goal-card";
import { DashboardDisclosure } from "./dashboard-disclosure";
import { DashboardMetrics } from "./dashboard-metrics";
import { FavouriteActivities } from "./favourite-activities";
import { NationalGuidelines } from "./national-guidelines";
import { RewardsGallery } from "./rewards-gallery";
import { WeeklyActivityChart } from "./weekly-activity-chart";

function DashboardLoadingState() {
  return (
    <div
      aria-label="Loading dashboard activity"
      className="grid gap-3 sm:gap-4"
      role="status"
    >
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Main parent dashboard section assembling all tracking, goals, guidelines, and rewards.
 *
 * Architectural Design:
 * - **100% Local Device Privacy:** All calculations (active minutes, streaks, variety preferences)
 *   are performed client-side using completion logs stored strictly on the parent's device.
 * - **State Coordination:**
 *   1. Fetches completion logs via `useCompletedMissions`.
 *   2. Determines active calendar reference date via `useDashboardDate`.
 *   3. Queries wildlife badge catalog from PostgreSQL via `useSpeciesBadges`.
 *   4. Evaluates streaks and unlocks via `useRewards`.
 *   5. Aggregates weekly chart days, percentiles, and stats via `buildDashboardStats`.
 *   6. Tracks accordion disclosure expansion and "NEW" badge notification via `useDashboardDisclosures`.
 * - **Graceful Loading & Error Recovery:** Presents skeleton placeholders while loading and an
 *   accessible retry alert if data fails to initialize.
 *
 * @returns The rendered parent dashboard section.
 */
export function DashboardSection() {
  // Load completed missions from local device storage
  const { records, loading, error, refresh } = useCompletedMissions();
  // Get active local reference date
  const currentDate = useDashboardDate();
  // Load official species badges catalogue
  const {
    badges,
    loading: badgesLoading,
    error: badgesError,
  } = useSpeciesBadges();
  // Compute rewards, streak, and unlocked badge IDs
  const {
    rewards,
    loading: rewardsLoading,
    error: rewardsError,
    refresh: refreshRewards,
  } = useRewards(records, currentDate, badges);
  // Aggregate statistics for daily goals, 7-day chart, and ABS guidelines
  const stats = useMemo(
    () => buildDashboardStats(records, currentDate),
    [records, currentDate],
  );
  // Manage expandable accordions and new badge notifications
  const { openSections, hasNewBadges, toggleSection } = useDashboardDisclosures(
    rewards.unlockedBadgeIds,
  );

  // Combined retry handler re-triggering storage and reward refreshes
  const handleRetry = () => {
    refresh();
    refreshRewards();
  };

  return (
    <section className="w-full">
      <ScreenHeader title="Parent dashboard" className="mb-4 sm:mb-6" />

      {loading || rewardsLoading || badgesLoading ? (
        <DashboardLoadingState />
      ) : error || rewardsError || badgesError ? (

        <Card className="border border-red-200 bg-white/55 shadow-sm ring-0">
          <CardContent className="py-4">
            <HistoryErrorAlert
              message={error || rewardsError || badgesError || "Rewards could not be loaded."}
              onRetry={handleRetry}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <DailyGoalCard stats={stats} streak={rewards.currentStreak} />
            <Card className="border border-[#93AB63]/60 bg-white/55 py-3.5 sm:py-4 shadow-sm ring-0">
              <CardContent className="px-4 sm:px-5">
                <WeeklyActivityChart days={stats.days} />
              </CardContent>
            </Card>
          </div>
          <DashboardMetrics stats={stats} />
          <div className="space-y-2.5 sm:space-y-3 pt-1">
            <DashboardDisclosure
              id="reward-badges"
              isNew={hasNewBadges}
              onToggle={() => toggleSection("rewardBadges")}
              open={openSections.rewardBadges}
              title="Your Child's Achievements"
            >
              <RewardsGallery
                badges={badges}
                showHeading={false}
                unlockedBadgeIds={rewards.unlockedBadgeIds}
              />
            </DashboardDisclosure>
            <DashboardDisclosure
              id="favourite-activities"
              onToggle={() => toggleSection("favouriteActivities")}
              open={openSections.favouriteActivities}
              title="Your Child's Favourites"
            >
              <FavouriteActivities tags={stats.varietyTagCounts} />
            </DashboardDisclosure>
            <DashboardDisclosure
              id="national-guidelines"
              onToggle={() => toggleSection("nationalGuidelines")}
              open={openSections.nationalGuidelines}
              title="National guidelines"
            >
              <NationalGuidelines stats={stats} />
            </DashboardDisclosure>
          </div>
        </div>
      )}
    </section>
  );
}
