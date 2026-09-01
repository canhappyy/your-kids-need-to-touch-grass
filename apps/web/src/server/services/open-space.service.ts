import {
  findAllOpenSpaces,
  findOpenSpacesByCategory,
} from "@/server/repositories/open-space.repository";

/**
 * Retrieves open spaces, optionally filtered by a specific category.
 *
 * @param category - Optional category name (e.g., "Park", "Playground") to filter by.
 * @returns A promise resolving to an array of open space records.
 */
export async function getAllOpenSpaces(category?: string) {
  if (category) {
    return findOpenSpacesByCategory(category);
  }

  return findAllOpenSpaces();
}
