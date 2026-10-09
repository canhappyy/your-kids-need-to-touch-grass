import { Activity, Footprints, Gauge, ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/types/dashboard";

/**
 * Properties for the `DashboardMetrics` component.
 */
type DashboardMetricsProps = {
  /** Aggregated dashboard statistics containing daily averages, total counts, and national percentile. */
  stats: DashboardStats;
};

/** Shared styling for each metric card tile */
const tileClass =
  "border border-[#93AB63]/60 bg-white/55 py-3 sm:py-3.5 shadow-sm ring-0";

function ActivityTimeCard({
  label,
  totalMinutes,
  averageMinutes,
  comparison,
  icon: Icon,
}: {
  label: string;
  totalMinutes: number | null;
  averageMinutes: number | null;
  comparison?: string;
  icon: typeof Activity;
}) {
  return (
    <Card className={tileClass}>
      <CardContent className="px-3.5 sm:px-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
          <Icon aria-hidden="true" className="size-3.5 text-[#728A46]" />
          <span>{label}</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <p className="text-lg font-bold leading-tight text-zinc-800 tabular-nums">
              {totalMinutes === null ? "—" : `${totalMinutes} min`}
            </p>
            <p className="text-[11px] text-zinc-500">total</p>
          </div>
          <div>
            <p className="text-lg font-bold leading-tight text-zinc-800 tabular-nums">
              {averageMinutes === null ? "—" : `${averageMinutes} min`}
            </p>
            <p className="text-[11px] text-zinc-500">avg/day</p>
          </div>
        </div>
        {comparison ? (
          <p className="mt-1 text-[11px] text-zinc-500">{comparison}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * Weekly summary metric cards calculated strictly from local completion history.
 *
 * Displays a 2x2 grid of key engagement markers:
 * 1. **Activity Time:** Current-week-to-date total and daily average active minutes.
 * 2. **Walking:** Estimated daily walking distance in kilometers based on park visits and missions.
 * 3. **Activities Logged:** Total count of completed missions stored on device.
 * 4. **Activity Time Last Week:** Previous full week's total and daily average, with benchmark context.
 *
 * @param props - Component properties containing aggregated stats.
 * @returns The rendered 2x2 metric cards grid.
 */
export function DashboardMetrics({ stats }: DashboardMetricsProps) {
  const metrics = [
    {
      label: "Walking",
      value: stats.averageWalkingKmPerDay.toFixed(1) + " km",
      detail: "avg/day",
      icon: Footprints,
    },
    {
      label: "Activities logged",
      value: String(stats.activityCount),
      detail: "all time",
      icon: ListChecks,
    },
  ];

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:gap-4"
      aria-label="Weekly activity metrics"
    >
      <ActivityTimeCard
        averageMinutes={stats.currentWeekAverageMinutes}
        icon={Activity}
        label="Activity time this week"
        totalMinutes={stats.weeklyMinutes}
      />
      <ActivityTimeCard
        averageMinutes={stats.previousWeekAverageMinutes}
        comparison={
          stats.percentileBand ? `Benchmark: ${stats.percentileBand}` : undefined
        }
        icon={Gauge}
        label="Activity time last week"
        totalMinutes={
          stats.previousWeekAverageMinutes === null
            ? null
            : stats.previousWeekMinutes
        }
      />
      {metrics.map(({ label, value, detail, icon: Icon }) => (
        <Card className={tileClass} key={label}>
          <CardContent className="px-3.5 sm:px-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
              <Icon aria-hidden="true" className="size-3.5 text-[#728A46]" />
              <span>{label}</span>
            </div>
            <p className="mt-1 text-lg font-bold leading-tight text-zinc-800 tabular-nums">
              {value}
            </p>
            <p className="text-[11px] text-zinc-500">{detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export type { DashboardMetricsProps };
