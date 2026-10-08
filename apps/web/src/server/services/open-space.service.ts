import {
  findAllOpenSpaces,
  findOpenSpacesByCategory,
} from "@/server/repositories/open-space.repository";

/**
 * Retrieves public open spaces, optionally filtered by a specific category.
 *
 * This service handles business logic for exploring open public spaces (such as parks,
 * nature reserves, playgrounds, and recreational ovals). If a category filter is provided,
 * it routes the request to category-specific filtering; otherwise, it returns the full
 * directory sorted alphabetically.
 *
 * @param category - Optional category name (e.g., "Park", "Playground") to filter by.
 * @returns A promise resolving to an array of open space records.
 *
 * @example
 * ```ts
 * // Get all spaces across Victoria
 * const allParks = await getAllOpenSpaces();
 *
 * // Get only designated playgrounds
 * const playgrounds = await getAllOpenSpaces("Playground");
 * ```
 */
export async function getAllOpenSpaces(category?: string) {
  // If the client provided a category filter, query only matching records
  if (category) {
    return findOpenSpacesByCategory(category);
  }

  // Otherwise, return all open spaces in alphabetical order
  return findAllOpenSpaces();
}

