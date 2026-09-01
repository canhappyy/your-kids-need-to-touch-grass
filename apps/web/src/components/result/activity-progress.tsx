import { Progress, ProgressLabel } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

type ActivityProgressProps = {
  progressValue: number
  goalAriaText: string
  dailyGoalPercentage: number
}

export function ActivityProgress({
  progressValue,
  goalAriaText,
  dailyGoalPercentage,
}: ActivityProgressProps) {
  return (
    <>
      <Progress
        aria-valuetext={goalAriaText}
        className="mt-6 gap-2 [&_[data-slot=progress-indicator]]:bg-emerald-600 [&_[data-slot=progress-track]]:h-2"
        value={progressValue}
      >
        <ProgressLabel className="w-full text-center text-sm font-medium text-zinc-600">
          {dailyGoalPercentage}% of the 60-minute daily goal
        </ProgressLabel>
      </Progress>

      <Separator className="mt-6 bg-zinc-200" />
    </>
  )
}
