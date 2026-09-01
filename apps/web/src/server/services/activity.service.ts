import {
  findAllActivities,
  findActivityById,
} from "@/server/repositories/activity.repository";

/**
 * Retrieves all activities available in the system.
 *
 * @returns A promise resolving to an array of raw activity records.
 */
export async function getAllActivities() {
  return findAllActivities();
}

/**
 * Retrieves an activity by its unique mission identifier.
 *
 * @param missionId - The unique ID of the mission.
 * @returns A promise resolving to the activity record with categories and tags, or `null` if not found.
 */
export async function getActivityById(missionId: string) {
  return findActivityById(missionId);
}
