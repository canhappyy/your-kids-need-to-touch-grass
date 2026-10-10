const INTERESTS_STORAGE_KEY = "recommendation.interests";

type InterestsStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export function readStoredInterests(
  storage: InterestsStorage,
): string | undefined {
  const value = storage.getItem(INTERESTS_STORAGE_KEY)?.trim();
  return value || undefined;
}

export function writeStoredInterests(
  storage: InterestsStorage,
  interests: string,
): void {
  const value = interests.trim();
  if (value) {
    storage.setItem(INTERESTS_STORAGE_KEY, value);
    return;
  }

  storage.removeItem(INTERESTS_STORAGE_KEY);
}
