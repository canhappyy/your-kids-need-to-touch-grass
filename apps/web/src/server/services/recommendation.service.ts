import type {
  FallbackRecommendationQuery,
  RecommendationCandidate,
  RecommendationQuery,
} from "@/server/repositories/recommendation.repository";
import type { ResolvedLocation } from "@/server/services/location.service";
import type { MatchReason, Recommendation } from "@/types/recommendation";

export type RecommendationInput = {
  location: string;
  ageMin: number;
  ageMax: number;
  durationMinutes: number;
  excludeMissionId?: string;
};

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
  location: ResolvedLocation,
  includeLocation: boolean,
): MatchReason[] {
  const reasons: MatchReason[] = [
    { kind: "age", label: `Ages ${input.ageMin}-${input.ageMax}` },
    {
      kind: "time",
      label: `Fits within ${formatDuration(input.durationMinutes)}`,
    },
  ];

  if (includeLocation) {
    reasons.push({ kind: "location", label: `Near ${location.label}` });
  }

  return reasons;
}

export async function getRecommendation(
  input: RecommendationInput,
  dependencies?: RecommendationDependencies,
): Promise<Recommendation | null> {
  const deps = dependencies ?? (await loadDefaultDependencies());
  const location = await deps.resolveLocation(input.location);
  const candidate = await deps.repository.findLocationBased({
    latitude: location.latitude,
    longitude: location.longitude,
    ageMin: input.ageMin,
    ageMax: input.ageMax,
    durationMinutes: input.durationMinutes,
    excludeMissionId: input.excludeMissionId,
  });

  const repeatsExcludedMission =
    candidate?.missionId === input.excludeMissionId;

  if (candidate && !repeatsExcludedMission) {
    return {
      ...candidate,
      reasons: buildReasons(input, location, true),
    };
  }

  const fallback = await deps.repository.findFallback({
    ageMin: input.ageMin,
    ageMax: input.ageMax,
    durationMinutes: input.durationMinutes,
    excludeMissionId: input.excludeMissionId,
  });

  if (!fallback) {
    return candidate
      ? {
          ...candidate,
          reasons: buildReasons(input, location, true),
        }
      : null;
  }

  return {
    ...fallback,
    reasons: buildReasons(input, location, false),
  };
}
