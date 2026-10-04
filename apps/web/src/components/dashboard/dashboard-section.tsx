"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { HistoryErrorAlert } from "@/components/history/history-error-alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompletedMissions } from "@/hooks/use-completed-missions";
import { useDashboardDate } from "@/hooks/use-dashboard-date";
import { useRewards } from "@/hooks/use-rewards";
import { useSpeciesBadges } from "@/hooks/use-species-badges";
import { buildDashboardStats } from "@/lib/dashboard-stats";
import type { DashboardView } from "@/types/dashboard";
import { ActivityStatsCard } from "./activity-stats-card";
import { RewardsGallery } from "./rewards-gallery";
import { StreakCard } from "./streak-card";

function DashboardLoadingState() {
  return (
    <div aria-label="Loading dashboard activity" className="grid gap-5 lg:grid-cols-2" role="status">
      <Skeleton className="h-28 rounded-xl lg:col-span-2" />
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-64 rounded-xl lg:col-span-2" />
    </div>
  );
}

/** Parent dashboard backed only by completed missions in browser storage. */
export function DashboardSection() {
  const { records, loading, error, refresh } = useCompletedMissions();
  const [view, setView] = useState<DashboardView>("daily");
  const currentDate = useDashboardDate();
  const { badges } = useSpeciesBadges();
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

  const handleViewChange = (nextView: string | number) => {
    if (nextView === "daily" || nextView === "weekly") {
      setView(nextView);
    }
  };
  const handleRetry = () => {
    refresh();
    refreshRewards();
  };

  return (
    <section className="w-full">
      <header className="mb-8 text-center sm:text-left">
        <Image
          alt="playgo & co"
          className="mx-auto h-auto w-40 sm:mx-0 sm:w-48"
          height={47}
          priority
          src="/playgo&co.svg"
          width={240}
        />
        <h1 className="mt-7 text-2xl font-bold tracking-tight text-zinc-800 sm:text-3xl">
          Parent dashboard
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:text-base">
          Track your child&apos;s active play against the 60-minute daily goal.
        </p>
      </header>

      {loading || rewardsLoading ? (
        <DashboardLoadingState />
      ) : error || rewardsError ? (
        <Card className="border border-red-200 bg-white/55 shadow-sm ring-0">
          <CardContent className="py-6">
            <HistoryErrorAlert
              message={error || rewardsError}
              onRetry={handleRetry}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <StreakCard rewards={rewards} />
          <Tabs onValueChange={handleViewChange} value={view}>
            <TabsList className="mb-4 grid h-11 w-full grid-cols-2 bg-white/65 p-1 sm:max-w-md">
              <TabsTrigger value="daily">Daily View</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Trends</TabsTrigger>
            </TabsList>
            <TabsContent value="daily">
              <ActivityStatsCard stats={stats} view="daily" />
            </TabsContent>
            <TabsContent value="weekly">
              <ActivityStatsCard stats={stats} view="weekly" />
            </TabsContent>
          </Tabs>
          <RewardsGallery
            badges={badges}
            unlockedBadgeIds={rewards.unlockedBadgeIds}
          />
        </>
      )}
    </section>
  );
}
