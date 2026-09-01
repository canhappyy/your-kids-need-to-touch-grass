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
  swapsRemaining,
}: ActivityResultProps) {
  const {
    agesLabel,
    dailyGoalPercentage,
    directionsUrl,
    formattedDuration,
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
      <ActivityHeader
        agesLabel={agesLabel}
        formattedDuration={formattedDuration}
        formattedSupervision={formattedSupervision}
        reasons={recommendation.reasons}
        title={recommendation.title}
      />

      <ActivityDetails
        formattedDuration={formattedDuration}
        locationLabel={locationLabel}
      />

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
        swapsRemaining={swapsRemaining}
      />
    </section>
  )
}

export { ActivityResult, type ActivityResultProps }
