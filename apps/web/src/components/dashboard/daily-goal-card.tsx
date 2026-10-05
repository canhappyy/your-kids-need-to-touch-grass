import Link from "next/link";
import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { DAILY_GOAL_MINUTES } from "@/lib/dashboard-stats";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/types/dashboard";

type DailyGoalCardProps = {
  stats: DashboardStats;
  streak: number;
};

/** Compact daily progress summary with the current activity streak. */
export function DailyGoalCard({ stats, streak }: DailyGoalCardProps) {
  const reachedGoal = stats.todayMinutes >= DAILY_GOAL_MINUTES;
  const activeStreak = streak > 0;

  return (
    <Card className="border border-[#93AB63]/70 bg-white/60 py-3 shadow-sm ring-0">
      <CardContent className="space-y-2 px-3 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-zinc-800">Daily activity goal</h2>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold tabular-nums",
              activeStreak
                ? "bg-[#E4633C]/12 text-[#C94E2A]"
                : "bg-zinc-200/70 text-zinc-500",
            )}
            data-streak-active={activeStreak}
          >
            <Flame
              aria-hidden="true"
              className={cn("size-4", activeStreak && "fill-current")}
            />
            {streak} day streak
          </span>
        </div>

        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-zinc-800 tabular-nums">
            {stats.todayMinutes} min
          </p>
          <p className="font-semibold text-[#C94E2A] tabular-nums">
            {stats.todayGoalPercentage}%
          </p>
        </div>

        <Progress
          aria-valuetext={
            stats.todayMinutes + " of " + DAILY_GOAL_MINUTES + " minutes"
          }
          className="gap-1 [&_[data-slot=progress-indicator]]:bg-[#E4633C] [&_[data-slot=progress-track]]:h-2"
          value={stats.todayGoalPercentage}
        >
          <ProgressLabel className="sr-only">Daily activity goal</ProgressLabel>
        </Progress>

        <p className="text-xs leading-snug text-zinc-600">
          {reachedGoal ? (
            "Today's goal reached—great work!"
          ) : (
            <>
              Almost there!{" "}
              <Link
                className="font-semibold text-[#C94E2A] underline underline-offset-2"
                href="/?history=open"
              >
                Log another activity
              </Link>{" "}
              to reach today&apos;s goal.
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

export type { DailyGoalCardProps };
