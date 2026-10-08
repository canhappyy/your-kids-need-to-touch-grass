import type { ResolvedLocation } from "@/types/location";
import type {
  FallbackRecommendationQuery,
  MatchReason,
  Recommendation,
  RecommendationCandidate,
  RecommendationInput,
  RecommendationInputBase,
  RecommendationQuery,
} from "@/types/recommendation";

export type { RecommendationInput, RecommendationInputBase };

/**
 * Repository contract required by the recommendation service.
 */
export type RecommendationRepository = {
  /** Finds a location-based recommendation candidate matching spatial, age, duration, and play preference criteria. */
  findLocationBased(
    input: RecommendationQuery,
  ): Promise<RecommendationCandidate | null>;
  /** Finds a fallback home-based or location-agnostic recommendation candidate matching age, duration, and play preference criteria. */
  findFallback(
    input: FallbackRecommendationQuery,
  ): Promise<RecommendationCandidate | null>;
};

/**
 * Injected dependencies for recommendation service execution and testing.
 */
export type RecommendationDependencies = {
  /** Function that resolves a location string into coordinates and label. */
  resolveLocation(input: string): Promise<ResolvedLocation>;
  /** Recommendation repository implementation. */
  repository: RecommendationRepository;
};

/**
 * Loads default repository and location service dependencies.
 *
 * @returns A promise resolving to `RecommendationDependencies`.
 */
async function loadDefaultDependencies(): Promise<RecommendationDependencies> {
  const [locationService, recommendationRepository] = await Promise.all([
    import("@/server/services/location.service"),
    import("@/server/repositories/recommendation.repository"),
  ]);

  return {
    resolveLocation: locationService.resolveRecommendationLocation,
    repository: {
      findLocationBased:
        recommendationRepository.findLocationBasedRecommendation,
      findFallback: recommendationRepository.findFallbackRecommendation,
    },
  };
}

/**
 * Formats duration in minutes into a readable text label.
 *
 * @param durationMinutes - Duration in minutes.
 * @returns Formatted duration string (e.g. "45 minutes", "1 hour", "1 hour 30 minutes").
 */
function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes} minutes`;
  }

  const hourLabel = `${hours} ${hours === 1 ? "hour" : "hours"}`;

  return minutes === 0 ? hourLabel : `${hourLabel} ${minutes} minutes`;
}

/**
 * Constructs user-facing match reasons explaining why this recommendation fits criteria.
 *
 * @param input - The search input criteria.
 * @param location - Optional resolved location for location-based recommendations.
 * @returns Array of structured `MatchReason` objects.
 */
function buildReasons(
  input: RecommendationInput,
  location?: ResolvedLocation,
): MatchReason[] {
  const reasons: MatchReason[] = [
    { kind: "age", label: `Ages ${input.ageMin}-${input.ageMax}` },
    {
      kind: "time",
      label: `Fits within ${formatDuration(input.durationMinutes)}`,
    },
  ];

  if (location) {
    reasons.push({ kind: "location", label: `Near ${location.label}` });
  }

  return reasons;
}


/**
 * Core recommendation engine method that matches activities based on age, time, location, and play preferences.
 *
 * Algorithm Flow:
 * 1. **Home Mode (`locationMode: "home"`):**
 *    - Direct lookup for Home-Based or Location-Agnostic activities requiring zero equipment ("None").
 *    - Matches the child's age range, available duration, play style, and supervision availability.
 *    - Immediately returns with formatted match reasons if found, or `null`.
 *
 * 2. **Nearby Mode (`locationMode: "nearby"`):**
 *    - Resolves the requested location into geographic coordinates (latitude and longitude).
 *    - Searches for location-based outdoor activities (such as parks or reserves within 2km)
 *      matching child age, activity duration, play style, and supervision.
 *    - Validates against `excludeMissionIds` to avoid repeating recent missions.
 *    - **Graceful Fallback:** If no nearby outdoor activity qualifies, the system cascades to
 *      finding a top home-based or location-agnostic activity so the parent is never left empty-handed.
 *    - Attaches human-readable match reasons ("Ages 6-8", "Fits within 30 minutes", "Near Clayton").
 *
 * @param input - Search criteria including age range, duration, location mode, play style, and supervision availability.
 * @param dependencies - Optional custom dependencies for testing and dependency injection.
 * @returns A promise resolving to the final `Recommendation` with match reasons, or `null` if no activity matches.
 *
 * @example
 * ```ts
 * const rec = await getRecommendation({
 *   ageMin: 5,
 *   ageMax: 8,
 *   durationMinutes: 30,
 *   locationMode: "nearby",
 *   location: "3168",
 *   canSupervise: true,
 * });
 * ```
 */
export async function getRecommendation(
  input: RecommendationInput,
  dependencies?: RecommendationDependencies,
): Promise<Recommendation | null> {
  // Use supplied dependencies (e.g. during unit tests) or lazily load real production implementations
  const deps = dependencies ?? (await loadDefaultDependencies());

  // Determine permitted mission types for fallback: strictly home-based, or also location-agnostic
  const fallbackMissionTypes = input.homeBasedOnly
    ? (["Home-Based"] as const)
    : (["Home-Based", "Location-Agnostic"] as const);

  // --- Branch 1: Parent selected "At Home" ---
  if (input.locationMode === "home") {
    // Look up an indoor/at-home activity matching criteria with zero equipment needed
    const homeMission = await deps.repository.findFallback({
      ageMin: input.ageMin,
      ageMax: input.ageMax,
      durationMinutes: input.durationMinutes,
      playStyle: input.playStyle,
      canSupervise: input.canSupervise,
      excludeMissionIds: input.excludeMissionIds,
      missionId: input.missionId,
      missionTypes: [...fallbackMissionTypes],
      equipmentRequiredTag: "None",
    });

    // If found, attach user-facing match reasons; otherwise return null
    return homeMission
      ? { ...homeMission, reasons: buildReasons(input) }
      : null;
  }

  // --- Branch 2: Parent selected "Nearby / Outdoor" ---
  // Resolve postcode or suburb name into GPS coordinates
  const location = await deps.resolveLocation(input.location);

  // Search for nearby open space outdoor activities within distance threshold
  const candidate = await deps.repository.findLocationBased({
    latitude: input.latitude ?? location.latitude,
    longitude: input.longitude ?? location.longitude,
    ageMin: input.ageMin,
    ageMax: input.ageMax,
    durationMinutes: input.durationMinutes,
    playStyle: input.playStyle,
    canSupervise: input.canSupervise,
    excludeMissionIds: input.excludeMissionIds,
    missionId: input.missionId,
  });

  // Check if candidate matches any mission the parent explicitly wanted to exclude
  const repeatsExcludedMission = candidate
    ? input.excludeMissionIds?.includes(candidate.missionId)
    : false;

  // If a valid nearby outdoor activity was found that isn't excluded, return it with location-aware reasons
  if (candidate && !repeatsExcludedMission) {
    return {
      ...candidate,
      reasons: buildReasons(input, location),
    };
  }

  // Fallback Cascade: No suitable nearby outdoor spot found (e.g., bad weather or distant location).
  // Query for a suitable zero-equipment home-based activity instead so the parent still gets a great activity.
  const fallback = await deps.repository.findFallback({
    ageMin: input.ageMin,
    ageMax: input.ageMax,
    durationMinutes: input.durationMinutes,
    playStyle: input.playStyle,
    canSupervise: input.canSupervise,
    excludeMissionIds: input.excludeMissionIds,
    missionId: input.missionId,
    missionTypes: [...fallbackMissionTypes],
    equipmentRequiredTag: "None",
  });

  // If even the fallback returned nothing, return whatever candidate existed (if any) or null
  if (!fallback) {
    return candidate
      ? {
          ...candidate,
          reasons: buildReasons(input, location),
        }
      : null;
  }

  // Return the fallback activity with reasons explaining the age and time match
  return {
    ...fallback,
    reasons: buildReasons(input),
  };
}

