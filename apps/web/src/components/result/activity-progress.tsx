import { Separator } from "@/components/ui/separator";

/**
 * Props for the {@link ActivityProgress} component.
 */
export type ActivityProgressProps = {
  /** Minutes already completed today. */
  completedMinutesToday: number;
  /** Minutes added if the recommended activity is completed. */
  activityMinutes: number;
  /** Daily goal in minutes. */
  goalMinutes?: number;
  /** Optional additional class name for the wrapper. */
  className?: string;
  /** Whether to render a trailing separator. Defaults to false. */
  showSeparator?: boolean;
};

/**
 * Visual progress bar showing how much of the recommended 60-minute daily
 * outdoor play goal is fulfilled by the recommended mission.
 *
 * Renders a branded progress track alongside accessible status text.
 */
export function ActivityProgress({
  completedMinutesToday,
  activityMinutes,
  goalMinutes = 60,
  className,
  showSeparator = false,
}: ActivityProgressProps) {
  const completedPercentage = Math.min(
    100,
    Math.round((completedMinutesToday / goalMinutes) * 100),
  );
  const projectedPercentage = Math.min(
    100,
    Math.round(((completedMinutesToday + activityMinutes) / goalMinutes) * 100),
  );
  const addedPercentage = Math.max(
    0,
    projectedPercentage - completedPercentage,
  );

  return (
    <div className={className}>
      <div
        aria-label="Daily activity goal progress"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={projectedPercentage}
        aria-valuetext={`${completedPercentage}% done today; this activity adds ${addedPercentage}%, reaching ${projectedPercentage}%`}
        className="space-y-2"
        role="progressbar"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-zinc-800">
            Daily activity goal
          </span>
          <span className="text-sm font-semibold tabular-nums text-zinc-700">
            {completedPercentage}% → {projectedPercentage}%
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-[#7B8FD6]/20">
          <div
            className="bg-[#E4633C] transition-all"
            style={{ width: `${completedPercentage}%` }}
          />
          <div
            className="bg-[#7B8FD6] transition-all"
            style={{ width: `${addedPercentage}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#E4633C]" aria-hidden="true" />
            Done today · {completedPercentage}%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#7B8FD6]" aria-hidden="true" />
            This activity · +{addedPercentage}%
          </span>
        </div>
      </div>

      {showSeparator && <Separator className="mt-6 bg-zinc-200" />}
    </div>
  );
}
