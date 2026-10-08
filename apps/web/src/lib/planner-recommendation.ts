import type { PlannedActivity } from "@/types/planner";
import type { Recommendation } from "@/types/recommendation";

export function plannedActivityFromRecommendation(
  recommendation: Recommendation,
  plannedDate: string,
  id: string,
  now = new Date(),
): PlannedActivity {
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
