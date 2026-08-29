import {
  findAllOpenSpaces,
  findOpenSpacesByCategory,
} from "@/server/repositories/open-space.repository";

export async function getAllOpenSpaces(category?: string) {
  if (category) {
    return findOpenSpacesByCategory(category);
  }

  return findAllOpenSpaces();
}
