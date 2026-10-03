import { Activity, Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Progress,
  ProgressLabel,
} from "@/components/ui/progress";
import {
  DAILY_GOAL_MINUTES,
  NATIONAL_MEETING_RATE,
  ROLLING_DAY_COUNT,
} from "@/lib/dashboard-stats";
import type { DashboardStats, DashboardView } from "@/types/dashboard";
import { WeeklyActivityChart } from "./weekly-activity-chart";

type ActivityStatsCardProps = {
  stats: DashboardStats;
  view: DashboardView;
};

function DailyActivity({ stats }: Pick<ActivityStatsCardProps, "stats">) {
  const progress = Math.min(
    (stats.todayMinutes / DAILY_GOAL_MINUTES) * 100,
    100,
  );
  const today = stats.days.at(-1)?.date ?? new Date();

  return (
    <Card className="border border-[#93AB63]/60 bg-white/55 shadow-sm ring-0">
      <CardHeader>
        <CardTitle>Today&apos;s activity</CardTitle>
        <CardDescription>
          {new Intl.DateTimeFormat("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(today)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-[#7B8FD6]/15 text-[#6579C4]">
            <Activity aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-3xl font-bold tabular-nums text-zinc-800">
              {stats.todayMinutes} min
            </p>
            <p className="text-sm text-zinc-500">
              {stats.todayMinutes} active minutes today
            </p>
          </div>
        </div>

        <Progress
          aria-valuetext={`${stats.todayMinutes} of ${DAILY_GOAL_MINUTES} minutes`}
          className="gap-2 [&_[data-slot=progress-indicator]]:bg-[#E4633C] [&_[data-slot=progress-track]]:h-3"
          value={progress}
        >
          <ProgressLabel>Daily activity goal</ProgressLabel>
          <span className="ml-auto text-sm text-zinc-500 tabular-nums">
            {stats.todayMinutes} of {DAILY_GOAL_MINUTES} minutes
          </span>
        </Progress>

        <p className="mt-5 rounded-xl bg-[#FDF6EA] px-4 py-3 text-sm leading-relaxed text-zinc-700">
          {stats.todayMinutes < DAILY_GOAL_MINUTES
            ? "Every 15 minutes of outdoor play counts towards today's goal!"
            : "Today's goal reached - great work!"}
        </p>
      </CardContent>
    </Card>
  );
}

function WeeklyActivity({ stats }: Pick<ActivityStatsCardProps, "stats">) {
  return (
    <Card className="border border-[#93AB63]/60 bg-white/55 shadow-sm ring-0">
      <CardHeader>
        <CardTitle>Last 7 days</CardTitle>
        <CardDescription>
          Daily active minutes against the 60-minute goal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WeeklyActivityChart days={stats.days} />
      </CardContent>
    </Card>
  );
}

function NationalBenchmark({ stats }: Pick<ActivityStatsCardProps, "stats">) {
  return (
    <Card className="border border-[#93AB63]/60 bg-white/55 shadow-sm ring-0">
      <CardHeader>
        <CardTitle>Australian national benchmark</CardTitle>
        <CardDescription>
          Compare active play with the national guideline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-[#93AB63]/15 text-[#728A46]">
            <Target aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-3xl font-bold tabular-nums text-zinc-800">
              {stats.weeklyMinutes} min
            </p>
            <p className="text-sm text-zinc-500">
              {stats.weeklyMinutes} active minutes in the last 7 days
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-[#FDF6EA] px-4 py-3">
          <p className="font-semibold text-zinc-800">
            {stats.daysMeetingGoal} of {ROLLING_DAY_COUNT} days reached the goal ({stats.goalDayRate}%).
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            {NATIONAL_MEETING_RATE}% of Australian children meet the 60-minute daily guideline.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Daily or weekly child activity view with a persistent national benchmark. */
export function ActivityStatsCard({ stats, view }: ActivityStatsCardProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,1fr)]">
      {view === "daily" ? (
        <DailyActivity stats={stats} />
      ) : (
        <WeeklyActivity stats={stats} />
      )}
      <NationalBenchmark stats={stats} />
    </div>
  );
}

export type { ActivityStatsCardProps };
