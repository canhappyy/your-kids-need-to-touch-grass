import {
  findAllActivities,
  findActivityById,
} from "@/server/repositories/activity.repository";

/**
 * Retrieves all activities available in the system catalog.
 *
 * This service function acts as a domain bridge between the HTTP controller / API layer
 * and the low-level database repository. It fetches all missions (both home-based and outdoor),
 * along with their assigned tags, age suitability ranges, and duration estimates.
 *
 * @returns A promise resolving to an array of raw activity database records.
 *
 * @example
 * ```ts
 * const activities = await getAllActivities();
 * console.log(`Catalog contains ${activities.length} missions`);
 * ```
 */
export async function getAllActivities() {
  // Delegate query directly to the activity repository
  return findAllActivities();
}

/**
 * Retrieves a specific activity by its unique mission identifier (e.g., "MIS-001").
 *
 * Fetches the complete activity profile including instructions, required equipment,
 * target age groups, safety guidelines, and category taxonomy.
 *
 * @param missionId - The unique alphanumeric mission ID string.
 * @returns A promise resolving to the activity record or `null` if no match was found in the database.
 *
 * @example
 * ```ts
 * const mission = await getActivityById("MIS-042");
 * if (!mission) {
 *   console.log("Mission not found");
 * }
 * ```
 */
export async function getActivityById(missionId: string) {
  // Fetch activity details from repository
  return findActivityById(missionId);
}

