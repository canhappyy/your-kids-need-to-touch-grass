export const DASHBOARD_SECTIONS_KEY = "playgo.dashboard-sections.v1";
export const DASHBOARD_SEEN_BADGES_KEY = "playgo.dashboard-seen-badges.v1";

export type DashboardSectionId =
  | "rewardBadges"
  | "favouriteActivities"
  | "nationalGuidelines";

export type DashboardSectionState = Record<DashboardSectionId, boolean>;

type PreferenceStore = Pick<Storage, "getItem" | "setItem">;

export const COLLAPSED_DASHBOARD_SECTIONS: DashboardSectionState = {
  rewardBadges: false,
  favouriteActivities: false,
  nationalGuidelines: false,
};

function isSectionState(value: unknown): value is DashboardSectionState {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.rewardBadges === "boolean" &&
    typeof record.favouriteActivities === "boolean" &&
    typeof record.nationalGuidelines === "boolean"
  );
}

/** Reads session-only disclosure state, falling back safely when corrupt. */
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

/** Reads locally acknowledged reward IDs, falling back safely when corrupt. */
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

export function mergeSeenBadgeIds(
  seenBadgeIds: string[],
  unlockedBadgeIds: string[],
): string[] {
  return [...new Set([...seenBadgeIds, ...unlockedBadgeIds])];
}
