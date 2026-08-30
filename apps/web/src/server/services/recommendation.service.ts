import type {
  FallbackRecommendationQuery,
  RecommendationCandidate,
  RecommendationQuery,
} from "@/server/repositories/recommendation.repository";
import type { ResolvedLocation } from "@/server/services/location.service";
import type { MatchReason, Recommendation } from "@/types/recommendation";

type RecommendationInputBase = {
  ageMin: number;
  ageMax: number;
  durationMinutes: number;
  excludeMissionIds?: string[];
  missionId?: string;
};

export type RecommendationInput = RecommendationInputBase &
  (
    | { locationMode: "nearby"; location: string }
    | { locationMode: "home"; location?: never }
  );

export type RecommendationRepository = {
  findLocationBased(
    input: RecommendationQuery,
  ): Promise<RecommendationCandidate | null>;
  findFallback(
    input: FallbackRecommendationQuery,
  ): Promise<RecommendationCandidate | null>;
};

export type RecommendationDependencies = {
  resolveLocation(input: string): Promise<ResolvedLocation>;
  repository: RecommendationRepository;
};

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

function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes} minutes`;
  }

  const hourLabel = `${hours} ${hours === 1 ? "hour" : "hours"}`;

  return minutes === 0 ? hourLabel : `${hourLabel} ${minutes} minutes`;
}

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
