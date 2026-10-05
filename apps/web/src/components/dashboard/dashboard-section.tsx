"use client";

import Image from "next/image";
import { useMemo } from "react";
import { HistoryErrorAlert } from "@/components/history/history-error-alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompletedMissions } from "@/hooks/use-completed-missions";
import { useDashboardDate } from "@/hooks/use-dashboard-date";
import { useRewards } from "@/hooks/use-rewards";
import { buildDashboardStats } from "@/lib/dashboard-stats";
import { DailyGoalCard } from "./daily-goal-card";
import { DashboardMetrics } from "./dashboard-metrics";
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
    rewards,
    loading: rewardsLoading,
    error: rewardsError,
    refresh: refreshRewards,
  } = useRewards(records, currentDate);
  const stats = useMemo(
    () => buildDashboardStats(records, currentDate),
    [records, currentDate],
  );

  const handleRetry = () => {
    refresh();
    refreshRewards();
  };

  return (
    <section className="w-full">
      <header className="mb-3 pr-12">
        <Image
          alt="playgo & co"
          className="h-auto w-28 sm:w-36"
          height={47}
          priority
          src="/playgo&co.svg"
          width={240}
        />
        <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-800 sm:text-2xl">
          Parent dashboard
        </h1>
      </header>

      {loading || rewardsLoading ? (
        <DashboardLoadingState />
      ) : error || rewardsError ? (
        <Card className="border border-red-200 bg-white/55 shadow-sm ring-0">
          <CardContent className="py-4">
            <HistoryErrorAlert
              message={error || rewardsError}
              onRetry={handleRetry}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2 md:grid-cols-2">
            <DailyGoalCard
              stats={stats}
              streak={rewards.currentStreak}
            />
            <Card className="border border-[#93AB63]/60 bg-white/55 py-3 shadow-sm ring-0">
              <CardContent className="px-3 sm:px-4">
                <WeeklyActivityChart days={stats.days} />
              </CardContent>
            </Card>
          </div>
          <DashboardMetrics stats={stats} />
        </div>
      )}
    </section>
  );
}
