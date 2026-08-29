import type {
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
): MatchReason[] {
  return [
    { kind: "age", label: `Ages ${input.ageMin}–${input.ageMax}` },
    {
      kind: "time",
      label: `Fits within ${formatDuration(input.durationMinutes)}`,
    },
    { kind: "location", label: `Near ${location.label}` },
  ];
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

  if (!candidate) {
    return null;
  }

  return {
    ...candidate,
    reasons: buildReasons(input, location),
  };
}

type LegacyRecommendationInput = {
  postcode: string;
  age: number;
  duration: number;
};

export async function getRecommendations(input: LegacyRecommendationInput) {
  const { findAllActivities } = await import(
    "@/server/repositories/activity.repository"
  );
  const activities = await findAllActivities();

  return activities
    .filter((activity) => {
      const ageSuitable =
        (input.age >= 5 && input.age <= 7 && activity.age_5_7 === "Y") ||
        (input.age >= 8 && input.age <= 9 && activity.age_8_9 === "Y") ||
        (input.age >= 10 && input.age <= 12 && activity.age_10_12 === "Y");

      return ageSuitable && activity.duration_minutes <= input.duration;
    })
    .slice(0, 5);
}
