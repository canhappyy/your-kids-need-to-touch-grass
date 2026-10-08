import type { PlannedActivity } from "@/types/planner";
import type { Recommendation } from "@/types/recommendation";

/**
 * Transforms an activity recommendation from search results into a persisted `PlannedActivity` record.
 *
 * Extracts essential activity attributes (mission ID, title, duration, instructions, and equipment)
 * and resolves a human-friendly location string (e.g. park venue name, "At home", or "Anywhere").
 *
 * @param recommendation - Full activity recommendation payload from the search API.
 * @param plannedDate - Scheduled target date string in YYYY-MM-DD format.
 * @param id - Unique UUID identifying this planned activity entry.
 * @param now - Reference timestamp when the activity is saved. Defaults to `new Date()`.
 * @returns A structured `PlannedActivity` ready for persistence in client storage.
 */
export function plannedActivityFromRecommendation(
  recommendation: Recommendation,
  plannedDate: string,
  id: string,
  now = new Date(),
): PlannedActivity {
  // Determine appropriate human-readable location label
  const locationLabel = recommendation.venue
    ? recommendation.venue.name
    : recommendation.missionType === "Home-Based"
      ? "At home"
      : "Anywhere";

  return {
    id,
    missionId: recommendation.missionId,
    name: recommendation.title,
    plannedDate,
    createdAt: now.toISOString(),
    durationMinutes: recommendation.durationMinutes,
    missionType: recommendation.missionType,
    locationLabel,
    instructionText: recommendation.instructionText,
    equipmentNeeded: recommendation.equipmentNeeded,
    ...(recommendation.iconFile ? { iconFile: recommendation.iconFile } : {}),
  };
}
