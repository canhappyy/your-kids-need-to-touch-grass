import type { Recommendation } from "./recommendation"

export type ActivityResultProps = {
  recommendation: Recommendation
  isRetrying?: boolean
  onBackToSearch: () => void
  onTryAnother: () => void
  swapsRemaining: number
}

export type ActivityResultViewModel = {
  locationLabel: string
  directionsUrl: string | null
  dailyGoalPercentage: number
  progressValue: number
  goalAriaText: string
  formattedDuration: string
  formattedSupervision: string
  agesLabel: string
}
