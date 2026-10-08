import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

/**
 * Props for the {@link ActivityProgress} component.
 */
export type ActivityProgressProps = {
  /** The clamped numerical progress value (0 to 100) used by the visual progress bar indicator. */
  progressValue: number;
  /** Accessible description of the current progress toward the daily goal for assistive technologies. */
  goalAriaText: string;
  /** Percentage of the recommended 60-minute daily outdoor goal achieved by completing this mission. */
  dailyGoalPercentage: number;
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
  progressValue,
  goalAriaText,
  dailyGoalPercentage,
  className,
  showSeparator = false,
}: ActivityProgressProps) {
  return (
    <div className={className}>
      <Progress
        aria-valuetext={goalAriaText}
        className="gap-1.5 [&_[data-slot=progress-indicator]]:bg-[#E4633C] [&_[data-slot=progress-track]]:h-2"
        value={progressValue}
      >
        <ProgressLabel className="w-full text-center text-xs font-medium text-zinc-600">
          {dailyGoalPercentage}% of the 60-minute daily goal
        </ProgressLabel>
      </Progress>

      {showSeparator && <Separator className="mt-6 bg-zinc-200" />}
    </div>
  );
}
