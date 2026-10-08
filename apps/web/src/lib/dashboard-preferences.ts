/**
 * Key used to store dashboard disclosure toggle states in browser sessionStorage.
 * Storing in sessionStorage ensures disclosure states reset across separate browser sessions.
 */
export const DASHBOARD_SECTIONS_KEY = "playgo.dashboard-sections.v1";

/**
 * Key used to store seen/acknowledged badge IDs in browser localStorage.
 * Persisting in localStorage ensures badge notifications are not repeatedly shown after the parent has seen them.
 */
export const DASHBOARD_SEEN_BADGES_KEY = "playgo.dashboard-seen-badges.v1";

/**
 * Valid identifiers for expandable disclosure cards on the parent insights dashboard:
 * - `"rewardBadges"`: Wildlife achievement badges gallery card.
 * - `"favouriteActivities"`: Most frequent play styles and variety breakdown card.
 * - `"nationalGuidelines"`: Australian physical activity guideline comparison card.
 */
export type DashboardSectionId =
  | "rewardBadges"
  | "favouriteActivities"
  | "nationalGuidelines";

/**
 * Map tracking whether each dashboard disclosure section is currently expanded (`true`) or collapsed (`false`).
 */
export type DashboardSectionState = Record<DashboardSectionId, boolean>;

/**
 * Minimal storage interface contract required for reading and writing dashboard preferences.
 */
type PreferenceStore = Pick<Storage, "getItem" | "setItem">;

/**
 * Default collapsed state where all dashboard disclosure cards are closed on initial load.
 */
export const COLLAPSED_DASHBOARD_SECTIONS: DashboardSectionState = {
  rewardBadges: false,
  favouriteActivities: false,
  nationalGuidelines: false,
};

/**
 * Type guard verifying that an unknown value matches the expected `DashboardSectionState` structure.
 *
 * @param value - Arbitrary parsed JSON value to check.
 * @returns True if value is an object with boolean flags for all required dashboard sections.
 */
function isSectionState(value: unknown): value is DashboardSectionState {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.rewardBadges === "boolean" &&
    typeof record.favouriteActivities === "boolean" &&
    typeof record.nationalGuidelines === "boolean"
  );
}

/**
 * Reads the session disclosure state from storage.
 * Gracefully falls back to all collapsed if storage is empty, inaccessible, or corrupted.
 *
 * @param store - The storage backend to read from (defaults to `window.sessionStorage`).
 * @returns Validated `DashboardSectionState` object.
 */
export function readDashboardSections(
  store?: PreferenceStore,
): DashboardSectionState {
  try {
    const raw = (store ?? window.sessionStorage).getItem(
      DASHBOARD_SECTIONS_KEY,
    );
    if (!raw) return { ...COLLAPSED_DASHBOARD_SECTIONS };
    const parsed: unknown = JSON.parse(raw);
    return isSectionState(parsed)
      ? parsed
      : { ...COLLAPSED_DASHBOARD_SECTIONS };
  } catch {
    return { ...COLLAPSED_DASHBOARD_SECTIONS };
  }
}

/**
 * Persists the dashboard disclosure toggle state to storage.
 * Silently catches and ignores storage errors (e.g. private browsing storage restrictions).
 *
 * @param state - The current section expansion state to write.
 * @param store - The storage backend to write to (defaults to `window.sessionStorage`).
 */
export function writeDashboardSections(
  state: DashboardSectionState,
  store?: PreferenceStore,
): void {
  try {
    (store ?? window.sessionStorage).setItem(
      DASHBOARD_SECTIONS_KEY,
      JSON.stringify(state),
    );
  } catch {
    // Presentation state may safely reset when storage is unavailable.
  }
}

/**
 * Reads the list of badge IDs that the parent has already viewed in the rewards dialog.
 *
 * @param store - The storage backend to read from (defaults to `window.localStorage`).
 * @returns Array of unique acknowledged badge ID strings.
 */
export function readSeenBadgeIds(
  store?: PreferenceStore,
): string[] {
  try {
    const raw = (store ?? window.localStorage).getItem(
      DASHBOARD_SEEN_BADGES_KEY,
    );
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (
      !Array.isArray(parsed) ||
      !parsed.every((value) => typeof value === "string")
    ) {
      return [];
    }
    return [...new Set(parsed)];
  } catch {
    return [];
  }
}

/**
 * Persists acknowledged badge IDs to storage, deduplicating the list.
 *
 * @param badgeIds - Array of badge ID strings marked as seen.
 * @param store - The storage backend to write to (defaults to `window.localStorage`).
 */
export function writeSeenBadgeIds(
  badgeIds: string[],
  store?: PreferenceStore,
): void {
  try {
    (store ?? window.localStorage).setItem(
      DASHBOARD_SEEN_BADGES_KEY,
      JSON.stringify([...new Set(badgeIds)]),
    );
  } catch {
    // Presentation state may safely reset when storage is unavailable.
  }
}

/**
 * Merges newly unlocked badge IDs into the existing list of acknowledged badges without duplicates.
 *
 * @param seenBadgeIds - Currently acknowledged badge IDs.
 * @param unlockedBadgeIds - Newly unlocked badge IDs.
 * @returns Deduplicated array containing both sets of badge IDs.
 */
export function mergeSeenBadgeIds(
  seenBadgeIds: string[],
  unlockedBadgeIds: string[],
): string[] {
  return [...new Set([...seenBadgeIds, ...unlockedBadgeIds])];
}
