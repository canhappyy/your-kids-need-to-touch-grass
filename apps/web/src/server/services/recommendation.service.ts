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
  ): Promise<RecommendationCandidate[]>;
  /** Finds a fallback home-based or location-agnostic recommendation candidate matching age, duration, and play preference criteria. */
  findFallback(
    input: FallbackRecommendationQuery,
  ): Promise<RecommendationCandidate[]>;
};

/**
 * Function signature for semantic candidate re-ranking against user free-text interests.
 *
 * @param interests - User-provided free-text interests or prompt.
 * @param candidates - List of candidate activities meeting hard filtering criteria.
 * @returns A promise resolving to an array of ranked mission IDs ordered by semantic relevance.
 */
export type RankCandidates = (
  interests: string,
  candidates: RecommendationCandidate[],
) => Promise<string[]>;

/**
 * Injected dependencies for recommendation service execution and testing.
 */
export type RecommendationDependencies = {
  /** Function that resolves a location string into coordinates and label. */
  resolveLocation(input: string): Promise<ResolvedLocation>;
  /** Recommendation repository implementation. */
  repository: RecommendationRepository;
  /** Optional semantic ranker. Failures fall back to repository order. */
  rankCandidates?: RankCandidates;
};

/**
 * Loads default repository and location service dependencies.
 *
 * @returns A promise resolving to `RecommendationDependencies`.
 */
async function loadDefaultDependencies(): Promise<RecommendationDependencies> {
  const [locationService, recommendationRepository, aiRankingService] =
    await Promise.all([
      import("@/server/services/location.service"),
      import("@/server/repositories/recommendation.repository"),
      import("@/server/services/ai-ranking.service"),
    ]);

  return {
    resolveLocation: locationService.resolveRecommendationLocation,
    repository: {
      findLocationBased:
        recommendationRepository.findLocationBasedRecommendations,
      findFallback: recommendationRepository.findFallbackRecommendations,
    },
    rankCandidates: aiRankingService.rankRecommendationCandidates,
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
 * Filters out previously seen or excluded candidate missions.
 *
 * @param candidates - List of candidate activities.
 * @param excludedMissionIds - Optional list of mission IDs to exclude from consideration.
 * @returns Array of candidate activities with excluded missions removed.
 */
function withoutExcluded(
  candidates: RecommendationCandidate[],
  excludedMissionIds: string[] | undefined,
): RecommendationCandidate[] {
  if (!excludedMissionIds?.length) return candidates;
  const excluded = new Set(excludedMissionIds);
  return candidates.filter((candidate) => !excluded.has(candidate.missionId));
}

/**
 * Selects the optimal activity candidate from a filtered candidate list.
 *
 * If free-text child interests are provided and a semantic ranker is supplied,
 * this function invokes the AI ranking pipeline to sort candidates by semantic relevance.
 * In case of ranking failure, timeout, or missing ranker, it gracefully falls back to
 * the primary candidate from repository ordering.
 *
 * @param candidates - Pre-filtered candidate activities matching hard constraints.
 * @param input - Search input parameters containing optional `interests` and `missionId`.
 * @param rankCandidates - Optional semantic ranking function.
 * @returns The top ranked candidate, or `null` if the candidate pool is empty.
 */
async function selectCandidate(
  candidates: RecommendationCandidate[],
  input: RecommendationInput,
  rankCandidates: RankCandidates | undefined,
): Promise<RecommendationCandidate | null> {
  if (!candidates.length) return null;

  const interests = input.interests?.trim();
  // Bypass AI ranking if no interests specified, an exact missionId was targeted, or ranker is absent
  if (!interests || input.missionId || !rankCandidates) return candidates[0];

  try {
    // Attempt semantic AI ranking
    const rankedMissionIds = await rankCandidates(interests, candidates);
    const candidatesById = new Map(
      candidates.map((candidate) => [candidate.missionId, candidate]),
    );
    // Find the first matching candidate in rank order
    for (const missionId of rankedMissionIds) {
      const candidate = candidatesById.get(missionId);
      if (candidate) return candidate;
    }
  } catch (error) {
    // Gracefully degrade to standard database ordering on ranker failure
    console.warn("AI ranking unavailable; using filtered fallback.", {
      errorClass: error instanceof Error ? error.name : "UnknownError",
    });
  }

  return candidates[0];
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
    const homeMissions = await deps.repository.findFallback({
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
    const preferredHomeMissions = withoutExcluded(
      homeMissions,
      input.excludeMissionIds,
    );
    const homeMission = await selectCandidate(
      preferredHomeMissions.length ? preferredHomeMissions : homeMissions,
      input,
      deps.rankCandidates,
    );

    return homeMission
      ? { ...homeMission, reasons: buildReasons(input) }
      : null;
  }

  // --- Branch 2: Parent selected "Nearby / Outdoor" ---
  // Resolve postcode or suburb name into GPS coordinates
  const location = await deps.resolveLocation(input.location);

  // Search for nearby open space outdoor activities within distance threshold
  const candidates = await deps.repository.findLocationBased({
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
  const preferredCandidates = withoutExcluded(
    candidates,
    input.excludeMissionIds,
  );

  // If a valid nearby outdoor activity was found that isn't excluded, return it with location-aware reasons
  if (preferredCandidates.length) {
    const candidate = await selectCandidate(
      preferredCandidates,
      input,
      deps.rankCandidates,
    );
    return {
      ...candidate!,
      reasons: buildReasons(input, location),
    };
  }

  // Fallback Cascade: No suitable nearby outdoor spot found (e.g., bad weather or distant location).
  // Query for a suitable zero-equipment home-based activity instead so the parent still gets a great activity.
  const fallbacks = await deps.repository.findFallback({
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

  const preferredFallbacks = withoutExcluded(
    fallbacks,
    input.excludeMissionIds,
  );
  const fallback = await selectCandidate(
    preferredFallbacks.length ? preferredFallbacks : [],
    input,
    deps.rankCandidates,
  );

  // Return the fallback activity with reasons explaining the age and time match
  if (fallback) return { ...fallback, reasons: buildReasons(input) };

  const repeatedCandidate = await selectCandidate(
    candidates,
    input,
    deps.rankCandidates,
  );
  if (repeatedCandidate) {
    return {
      ...repeatedCandidate,
      reasons: buildReasons(input, location),
    };
  }

  const repeatedFallback = await selectCandidate(
    fallbacks,
    input,
    deps.rankCandidates,
  );
  return repeatedFallback
    ? { ...repeatedFallback, reasons: buildReasons(input) }
    : null;
}
