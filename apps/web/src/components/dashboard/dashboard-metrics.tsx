import { Activity, Footprints, ListChecks, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/types/dashboard";

type DashboardMetricsProps = {
  stats: DashboardStats;
};

const tileClass =
  "border border-[#93AB63]/60 bg-white/55 py-2.5 shadow-sm ring-0";

/** Four all-time metrics calculated only from local completion history. */
export function DashboardMetrics({ stats }: DashboardMetricsProps) {
  const metrics = [
    {
      label: "Activity time",
      value: stats.averageMinutesPerDay + " min",
      detail: "avg per day",
      icon: Activity,
    },
    {
      label: "Walking",
      value: stats.averageWalkingKmPerDay.toFixed(1) + " km",
      detail: "avg per day",
      icon: Footprints,
    },
    {
      label: "Activities logged",
      value: String(stats.activityCount),
      detail: "all time",
      icon: ListChecks,
    },
    {
      label: "Nationwide ranking",
      value: stats.percentileBand ?? "—",
      detail: "published reference",
      icon: Trophy,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2" aria-label="All-time activity metrics">
      {metrics.map(({ label, value, detail, icon: Icon }) => (
        <Card className={tileClass} key={label}>
          <CardContent className="px-3">
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
