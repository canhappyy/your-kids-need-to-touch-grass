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
      className="grid gap-2"
      role="status"
    >
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}

/** Compact parent summary backed only by device-local activity records. */
export function DashboardSection() {
  const { records, loading, error, refresh } = useCompletedMissions();
  const currentDate = useDashboardDate();
  const {
    badges,
    loading: badgesLoading,
    error: badgesError,
  } = useSpeciesBadges();
  const {
    rewards,
    loading: rewardsLoading,
    error: rewardsError,
    refresh: refreshRewards,
  } = useRewards(records, currentDate, badges);
  const stats = useMemo(
    () => buildDashboardStats(records, currentDate),
    [records, currentDate],
  );
  const { openSections, hasNewBadges, toggleSection } = useDashboardDisclosures(
    rewards.unlockedBadgeIds,
  );

  const handleRetry = () => {
    refresh();
    refreshRewards();
  };

  return (
    <section className="w-full">
      <ScreenHeader title="Parent dashboard" className="mb-3" />

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
        <div className="space-y-2">
          <div className="grid gap-2 md:grid-cols-2">
            <DailyGoalCard stats={stats} streak={rewards.currentStreak} />
            <Card className="border border-[#93AB63]/60 bg-white/55 py-3 shadow-sm ring-0">
              <CardContent className="px-3 sm:px-4">
                <WeeklyActivityChart days={stats.days} />
              </CardContent>
            </Card>
          </div>
          <DashboardMetrics stats={stats} />
          <div className="space-y-1.5 pt-0.5">
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
