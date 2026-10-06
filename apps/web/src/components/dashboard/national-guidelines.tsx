import {
  ABS_ACTIVITY_SOURCE,
  AUSTRALIAN_GUIDELINE_SOURCE,
} from "@/data/australian-activity-reference";
import type { DashboardStats } from "@/types/dashboard";

type NationalGuidelinesProps = {
  stats: DashboardStats;
};

/** Published national figures beside this device's PlayGo-only averages. */
export function NationalGuidelines({ stats }: NationalGuidelinesProps) {
  const figures = [
    {
      label: "PlayGo active time",
      value: stats.averageMinutesPerDay + " min/day",
    },
    {
      label: "PlayGo walking estimate",
      value: stats.averageWalkingKmPerDay.toFixed(1) + " km/day",
    },
    {
      label: "National average (" + stats.referenceAgeLabel + ")",
      value: stats.nationalAverageMinutes + " min/day",
    },
    {
      label: "National guideline",
      value: "60 min/day",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {figures.map((figure) => (
          <div
            className="rounded-lg bg-[#FDF6EA] p-2.5 sm:p-3"
            key={figure.label}
          >
            <p className="text-[11px] leading-tight text-zinc-500">
              {figure.label}
            </p>
            <p className="mt-1 font-semibold text-zinc-800 tabular-nums">
              {figure.value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        Child figures use only activities logged in PlayGo. Sources:{" "}
        <a
          className="underline underline-offset-2"
          href={ABS_ACTIVITY_SOURCE.url}
          rel="noreferrer"
          target="_blank"
        >
          ABS 2023 National Nutrition and Physical Activity Survey
        </a>
        {" and "}
        <a
          className="underline underline-offset-2"
          href={AUSTRALIAN_GUIDELINE_SOURCE.url}
          rel="noreferrer"
          target="_blank"
        >
          Australian physical activity guideline
        </a>
        .
      </p>
    </div>
  );
}

export type { NationalGuidelinesProps };
