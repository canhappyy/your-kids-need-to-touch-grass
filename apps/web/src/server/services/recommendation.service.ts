import type {
  FallbackRecommendationQuery,
  RecommendationCandidate,
  RecommendationQuery,
} from "@/server/repositories/recommendation.repository";
import type { ResolvedLocation } from "@/server/services/location.service";
import type { MatchReason, Recommendation } from "@/types/recommendation";

/**
 * Base input parameters shared across all recommendation requests.
 */
type RecommendationInputBase = {
  /** Minimum child age in years. */
  ageMin: number;
  /** Maximum child age in years. */
  ageMax: number;
  /** Available duration in minutes. */
  durationMinutes: number;
  /** Optional array of mission IDs to exclude from results. */
  excludeMissionIds?: string[];
  /** Optional specific mission ID to fetch. */
  missionId?: string;
};

/**
 * Discriminative union input for recommendation generation based on location mode.
 */
export type RecommendationInput = RecommendationInputBase &
  (
    | { locationMode: "nearby"; location: string }
    | { locationMode: "home"; location?: never }
  );

/**
 * Repository contract required by the recommendation service.
 */
export type RecommendationRepository = {
  /** Finds a location-based recommendation candidate. */
  findLocationBased(
    input: RecommendationQuery,
  ): Promise<RecommendationCandidate | null>;
  /** Finds a fallback home-based or location-agnostic recommendation candidate. */
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
 * Core recommendation engine method that matches activities based on age, time, and location.
 *
 * For "home" mode:
 * Searches for Home-Based, zero-equipment activities matching the criteria.
 *
 * For `"nearby"` mode:
 * Resolves location, attempts to find a location-based activity within 10km, and falls back to
 * Home-Based or Location-Agnostic activities if no nearby activity is found.
 *
 * @param input - Search criteria including age range, duration, and location mode.
 * @param dependencies - Optional custom dependencies for testing.
 * @returns A promise resolving to the final `Recommendation` with match reasons, or `null` if none found.
 */
export async function getRecommendation(
  input: RecommendationInput,
  dependencies?: RecommendationDependencies,
): Promise<Recommendation | null> {
  const deps = dependencies ?? (await loadDefaultDependencies());

  if (input.locationMode === "home") {
    const homeMission = await deps.repository.findFallback({
      ageMin: input.ageMin,
      ageMax: input.ageMax,
      durationMinutes: input.durationMinutes,
      excludeMissionIds: input.excludeMissionIds,
      missionId: input.missionId,
      missionTypes: ["Home-Based"],
      equipmentRequiredTag: "None",
    });

    return homeMission
      ? { ...homeMission, reasons: buildReasons(input) }
      : null;
  }

  const location = await deps.resolveLocation(input.location);
  const candidate = await deps.repository.findLocationBased({
    latitude: location.latitude,
    longitude: location.longitude,
    ageMin: input.ageMin,
    ageMax: input.ageMax,
    durationMinutes: input.durationMinutes,
    excludeMissionIds: input.excludeMissionIds,
    missionId: input.missionId,
  });

  const repeatsExcludedMission = candidate
    ? input.excludeMissionIds?.includes(candidate.missionId)
    : false;

  if (candidate && !repeatsExcludedMission) {
    return {
      ...candidate,
      reasons: buildReasons(input, location),
    };
  }

  const fallback = await deps.repository.findFallback({
    ageMin: input.ageMin,
    ageMax: input.ageMax,
    durationMinutes: input.durationMinutes,
    excludeMissionIds: input.excludeMissionIds,
    missionId: input.missionId,
    missionTypes: ["Home-Based", "Location-Agnostic"],
    equipmentRequiredTag: "None",
  });

  if (!fallback) {
    return candidate
      ? {
          ...candidate,
          reasons: buildReasons(input, location),
        }
      : null;
  }

  return {
    ...fallback,
    reasons: buildReasons(input),
  };
}
