import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { MissionInstructionsDialog } from "./mission-instructions-dialog"
import { ActivityActions } from "./activity-actions"
import { ActivityDetails } from "./activity-details"
import { ActivityHeader } from "./activity-header"
import { ActivityProgress } from "./activity-progress"
import { useActivityResult } from "@/hooks/use-activity-result"
import type { ActivityResultProps } from "@/types/activity"

function ActivityResult({
  recommendation,
  isRetrying = false,
  onBackToSearch,
  onTryAnother,
}: ActivityResultProps) {
  const {
    agesLabel,
    dailyGoalPercentage,
    directionsUrl,
    formattedDuration,
    formattedTotalDuration,
    formattedCommuteDuration,
    formattedSupervision,
    goalAriaText,
    locationLabel,
    progressValue,
  } = useActivityResult(recommendation)

  return (
    <section
      aria-labelledby="activity-title"
      className="flex min-h-[calc(100svh-6.5rem)] flex-col pt-3 pb-[72px]"
    >
      <Dialog key={recommendation.missionId}>
        <div className="relative">
          <DialogTrigger
            aria-label={`How to Play: ${recommendation.title}`}
            className="absolute inset-0 z-10 cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#93AB63] focus-visible:ring-offset-4"
          />
          <ActivityHeader
            agesLabel={agesLabel}
            formattedDuration={formattedCommuteDuration !== null ? `${formattedTotalDuration} total (est.)` : formattedDuration}
            formattedSupervision={formattedSupervision}
            reasons={recommendation.reasons}
            title={recommendation.title}
          />

          <ActivityDetails
            formattedTotalDuration={formattedTotalDuration}
            formattedCommuteDuration={formattedCommuteDuration}
            formattedDuration={formattedDuration}
            locationLabel={locationLabel}
          />
        </div>

        <ActivityProgress
          dailyGoalPercentage={dailyGoalPercentage}
          goalAriaText={goalAriaText}
          progressValue={progressValue}
        />

        <ActivityActions
          directionsUrl={directionsUrl}
          isRetrying={isRetrying}
          onBackToSearch={onBackToSearch}
          onTryAnother={onTryAnother}
        />
        <MissionInstructionsDialog
          title={recommendation.title}
          instructionText={recommendation.instructionText}
        />
      </Dialog>
    </section>
  )
}

export { ActivityResult, type ActivityResultProps }
