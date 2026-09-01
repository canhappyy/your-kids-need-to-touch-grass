import type {
  Recommendation,
  RecommendationVenue,
  SupervisionLevel,
} from "@/types/recommendation"

/**
 * Formats duration in minutes to a human-readable string.
 * Examples: 45 -> "45 minutes", 60 -> "1 hour", 90 -> "1 hour 30 minutes", 120 -> "2 hours"
 */
export function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  if (!hours) return `${minutes} minutes`

  const hourLabel = `${hours} ${hours === 1 ? "hour" : "hours"}`
  return minutes ? `${hourLabel} ${minutes} minutes` : hourLabel
}

/**
 * Formats supervision level into a display-friendly label.
 */
export function formatSupervision(
  input: SupervisionLevel | Pick<Recommendation, "supervisionLevel">
): string {
  const supervisionLevel =
    typeof input === "string" ? input : input.supervisionLevel

  return supervisionLevel === "Independent-Play-Safe"
    ? "Independent play"
    : "Adult supervision"
}

/**
 * Resolves the location display label based on venue and mission type.
 */
export function getLocationLabel(
  recommendation: Pick<Recommendation, "venue" | "missionType">
): string {
  if (recommendation.venue) {
    return recommendation.venue.name
  }

  return recommendation.missionType === "Home-Based" ? "At home" : "Anywhere"
}

/**
 * Builds a Google Maps search URL from venue coordinates, or returns null if no venue exists.
 */
export function getDirectionsUrl(
  venue: RecommendationVenue | null
): string | null {
  if (!venue) return null

  const query = encodeURIComponent(`${venue.latitude},${venue.longitude}`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

/**
 * Calculates percentage towards a daily active goal (default 60 minutes) and clamped progress bar value.
 */
export function calculateDailyGoalProgress(
  durationMinutes: number,
  goalMinutes = 60
): {
  dailyGoalPercentage: number
  progressValue: number
  label: string
} {
  const dailyGoalPercentage = Math.round((durationMinutes / goalMinutes) * 100)
  const progressValue = Math.min(dailyGoalPercentage, 100)
  const label = `${dailyGoalPercentage}% of the ${goalMinutes}-minute daily goal`

  return {
    dailyGoalPercentage,
    progressValue,
    label,
  }
}
